import type { RuntimeApprovalRepository } from "../../src/features/runtime-approval/repository";
import type { RuntimeApprovalBinding } from "../../src/features/runtime-approval/types";
import { runApprovalValidation } from "./approval-validation-runner";
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
import type { LiveDbCaseResult, LiveDbEnvironmentInput, LiveDbSafeErrorCode } from "./types";
import { liveDbValidationCases } from "./validation-cases";

export type StagingApprovalInput = {
  repository: RuntimeApprovalRepository | undefined;
  binding: RuntimeApprovalBinding;
  mismatchedBinding: RuntimeApprovalBinding;
  expiredApprovalId: string | undefined;
};

export type StagingRlsInput = {
  approvalId: string;
  confirmFixture: ((approvalId: string) => Promise<LiveDbRlsFixtureCheck>) | undefined;
  actors: readonly LiveDbRlsActor[] | undefined;
};

export type StagingValidationRunInput = {
  environment: LiveDbEnvironmentInput;
  /** No default: an un-injected executor blocks instead of shelling out. */
  migrationExecutor: LiveDbMigrationExecutor | undefined;
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
 * This function issues no query, spawns no process and constructs no client of
 * its own; it composes the boundaries that do.
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

  const approval = await runApprovalValidation(input.approval);
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
