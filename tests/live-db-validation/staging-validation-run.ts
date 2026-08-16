import type { RuntimeApprovalBinding } from "../../src/features/runtime-approval/types";
import { runApprovalValidation } from "./approval-validation-runner";
import {
  createExplicitRepositoryInjection,
  createLiveDbClient,
  liveDbClientIdentityFailure,
  type LiveDbClientFactory,
} from "./live-db-client";
import {
  executeStagingMigration,
  type LiveDbMigrationExecutor,
} from "./staging-migration-executor";
import {
  createLiveDbStagingEvidenceSummary,
  type LiveDbStagingCaseEvidence,
  type LiveDbStagingEvidenceSummary,
} from "./staging-evidence";
import {
  runRlsValidation,
  type LiveDbRlsActor,
  type LiveDbRlsFixtureCheck,
} from "./rls-validation-runner";
import type {
  LiveDbCaseResult,
  LiveDbClientIdentityCandidate,
  LiveDbEnvironmentInput,
  LiveDbSafeErrorCode,
} from "./types";
import { liveDbValidationCases } from "./validation-cases";

export type StagingApprovalInput = {
  binding: RuntimeApprovalBinding;
  mismatchedBinding: RuntimeApprovalBinding;
  expiredApprovalId: string | undefined;
};

export type StagingRlsInput = {
  approvalId: string;
  confirmFixture: ((approvalId: string) => Promise<LiveDbRlsFixtureCheck>) | undefined;
  actors: readonly LiveDbRlsActor[] | undefined;
  /**
   * The caller's declaration about how the three actor clients were built.
   *
   * Actors are closures, so their origin cannot be inspected the way the
   * approval repository's can: this is an attestation, checked but not proven.
   * Constructing the actors here instead would mean owning owner/other/anon
   * session creation, which is deliberately out of this boundary's scope.
   */
  identity: LiveDbClientIdentityCandidate | undefined;
};

export type StagingValidationRunInput = {
  environment: LiveDbEnvironmentInput;
  /** No default: an un-injected executor blocks instead of shelling out. */
  migrationExecutor: LiveDbMigrationExecutor | undefined;
  /**
   * Builds the dedicated LIVE_DB Supabase clients. There is no default, so this
   * boundary cannot open a real connection unless a factory is handed to it.
   */
  clientFactory: LiveDbClientFactory | undefined;
  approval: StagingApprovalInput;
  rls: StagingRlsInput;
  timestamp: string;
  validationRunId?: string;
  /** Full project refs that must never appear in Evidence. */
  forbiddenProjectRefs?: readonly string[];
};

export type StagingValidationRunResult = {
  status: "PASSED" | "BLOCKED";
  safeErrorCode?: LiveDbSafeErrorCode;
  evidence: LiveDbStagingEvidenceSummary;
};

const actorClassByCaseId: Record<string, string> = {
  "rls-owner-read": "OWNER",
  "rls-cross-user-denied": "OTHER_AUTHENTICATED",
  "rls-anon-denied": "ANONYMOUS",
};

const expectedResultByCaseId = new Map(
  liveDbValidationCases.map((item) => [item.id, item.expectedResult] as const),
);

/**
 * Projects case results into Evidence rows. Both fields written here come from
 * the harness's own safe vocabulary — a registry string and a safe error code —
 * so no database message can reach Evidence through this path.
 */
function toCaseEvidence(results: readonly LiveDbCaseResult[]): LiveDbStagingCaseEvidence[] {
  return results.map((item) => ({
    caseId: item.caseId,
    ...(actorClassByCaseId[item.caseId] ? { actorClass: actorClassByCaseId[item.caseId] } : {}),
    expectedResult: expectedResultByCaseId.get(item.caseId) ?? "unspecified",
    actualSafeResult: item.safeErrorCode ?? item.verdict,
    verdict: item.verdict,
    ...(item.safeErrorCode ? { safeErrorCode: item.safeErrorCode } : {}),
  }));
}

/**
 * The single ST-B execution path: environment guard and migration target
 * resolution, then the migration, then APR, then RLS, then Evidence.
 *
 * It exists so the guarded boundaries and the code that actually touches the
 * database are the same code. Every step is reached only through an explicitly
 * injected dependency, and a block at any step stops the ones after it — in
 * particular a blocked migration never reaches an approval or RLS probe.
 *
 * It builds the LIVE_DB clients and the approval repository itself, from the
 * environment the guard just approved, so their target cannot diverge from the
 * migration's. It issues no query and spawns no process of its own, and without
 * an injected client factory it cannot open a connection at all.
 */
export async function runStagingValidation(
  input: StagingValidationRunInput,
): Promise<StagingValidationRunResult> {
  const validationRunId = input.validationRunId ?? "live-db-validation-001-staging";
  const caseResults: LiveDbCaseResult[] = [];

  const finish = (
    outcome: {
      safeErrorCode?: LiveDbSafeErrorCode;
      maskedProjectRef: string;
      migrationApplied: boolean;
      appliedMigrationCount: number;
    },
  ): StagingValidationRunResult => {
    const verdict = outcome.safeErrorCode ? "FAIL" : "PASS";
    const evidence = createLiveDbStagingEvidenceSummary({
      validationRunId,
      maskedProjectRef: outcome.maskedProjectRef,
      migrationApplied: outcome.migrationApplied,
      appliedMigrationCount: outcome.appliedMigrationCount,
      caseResults,
      cases: toCaseEvidence(caseResults),
      timestamp: input.timestamp,
      verdict,
      ...(input.forbiddenProjectRefs ? { forbiddenProjectRefs: input.forbiddenProjectRefs } : {}),
    });
    // An unsafe summary blocks the run even when every case passed: publishing
    // a secret is itself a failure of ST-B, not a footnote to a green result.
    if (evidence.status === "UNSAFE") {
      return {
        status: "BLOCKED",
        safeErrorCode: evidence.safeErrorCode,
        evidence: evidence.summary,
      };
    }
    return outcome.safeErrorCode
      ? { status: "BLOCKED", safeErrorCode: outcome.safeErrorCode, evidence: evidence.summary }
      : { status: "PASSED", evidence: evidence.summary };
  };

  // Guard and migration. `executeStagingMigration` runs the ST-A environment
  // guard and the dual-binding target resolution before it builds any argv, so
  // reaching its APPLIED branch is what makes the steps below safe to run.
  const migration = await executeStagingMigration(input.environment, input.migrationExecutor);
  if (migration.status === "BLOCKED") {
    return finish({
      safeErrorCode: migration.safeErrorCode,
      maskedProjectRef: "unavailable",
      migrationApplied: false,
      appliedMigrationCount: 0,
    });
  }
  const applied = {
    maskedProjectRef: migration.targetProjectRefMasked,
    migrationApplied: true,
    appliedMigrationCount: migration.appliedMigrationCount,
  };

  // The approval repository is built here rather than accepted, so "it uses a
  // dedicated LIVE_DB client" is a fact this boundary establishes instead of a
  // claim it trusts. SupabaseRuntimeApprovalRepository defaults its client to
  // createSupabaseAdminClient(), which would reach the application project; an
  // accepted repository could carry that default in unnoticed, and the
  // migration above would have been the only step that stayed on staging.
  //
  // Both clients come from the same environment the guard just approved, so
  // their target is the migration's target by construction.
  if (typeof input.clientFactory !== "function") {
    return finish({ ...applied, safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED" });
  }
  const configuration = {
    ...(input.environment.liveDbSupabaseUrl ? { url: input.environment.liveDbSupabaseUrl } : {}),
    ...(input.environment.liveDbServiceRoleKey
      ? { serviceRoleKey: input.environment.liveDbServiceRoleKey }
      : {}),
  };
  const approvalClient = createLiveDbClient(configuration, input.clientFactory);
  if (approvalClient.status === "BLOCKED") {
    return finish({ ...applied, safeErrorCode: approvalClient.safeErrorCode });
  }
  const evidenceClient = createLiveDbClient(configuration, input.clientFactory);
  if (evidenceClient.status === "BLOCKED") {
    return finish({ ...applied, safeErrorCode: evidenceClient.safeErrorCode });
  }
  const injection = createExplicitRepositoryInjection(approvalClient.client, evidenceClient.client);
  if ("status" in injection) {
    return finish({ ...applied, safeErrorCode: injection.safeErrorCode });
  }

  // RLS actors cannot be constructed here, so their origin is attested instead.
  const rlsIdentityFailure = liveDbClientIdentityFailure(input.rls.identity);
  if (rlsIdentityFailure) {
    return finish({ ...applied, safeErrorCode: rlsIdentityFailure });
  }

  const approval = await runApprovalValidation({
    repository: injection.approvalRepository,
    ...input.approval,
  });
  caseResults.push(...approval.caseResults);
  if (approval.status === "BLOCKED") {
    // The fallbacks matter: a blocked runner that reported no code must still
    // block here rather than fall through to a PASS verdict.
    return finish({
      ...applied,
      safeErrorCode: approval.safeErrorCode ?? "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME",
    });
  }

  const rls = await runRlsValidation(input.rls);
  caseResults.push(...rls.caseResults);
  if (rls.status === "BLOCKED") {
    return finish({
      ...applied,
      safeErrorCode: rls.safeErrorCode ?? "LIVE_DB_RLS_ACCESS_VIOLATION",
    });
  }

  // Keeps Evidence and the case registry from drifting apart: a case id the
  // registry does not know would otherwise be published with a placeholder
  // expected result and silently weaken the record.
  const unknownCase = caseResults.find((item) => !expectedResultByCaseId.has(item.caseId));
  if (unknownCase) {
    return finish({ ...applied, safeErrorCode: "LIVE_DB_VALIDATION_REGISTRY_INVALID" });
  }

  return finish(applied);
}
