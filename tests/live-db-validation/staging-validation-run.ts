import type { RuntimeApprovalBinding } from "../../src/features/runtime-approval/types";
import {
  assertApprovalFixtures,
  runApprovalExpiry,
  runApprovalLifecycle,
} from "./approval-validation-runner";
import {
  createExplicitRepositoryInjection,
  createLiveDbClient,
  liveDbClientIdentityFailure,
} from "./live-db-client";
import {
  runRlsValidation,
  validateRlsActorSet,
  type LiveDbRlsActor,
  type LiveDbRlsFixtureCheck,
} from "./rls-validation-runner";
import { createLiveDbRecordCounter } from "./runtime-record-counters";
import {
  verifyImmutabilityTrigger,
  verifyStagingSchema,
  type LiveDbSchemaClient,
} from "./schema-verification";
import {
  createLiveDbStagingEvidenceSummary,
  type LiveDbStagingCaseEvidence,
  type LiveDbStagingEvidenceSummary,
} from "./staging-evidence";
import {
  executeStagingMigration,
  type LiveDbMigrationExecutor,
} from "./staging-migration-executor";
import { resolveStagingMigrationTarget } from "./staging-migration-target";
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
};

export type StagingRlsInput = {
  actors: readonly LiveDbRlsActor[] | undefined;
  /**
   * The caller's declaration about how the three actor clients were built.
   *
   * Actors are closures, so their origin cannot be inspected the way the
   * approval repository's can: this is an attestation, checked but not proven.
   * Constructing them here would mean owning owner/other/anon session creation,
   * which is deliberately outside this boundary.
   */
  identity: LiveDbClientIdentityCandidate | undefined;
};

export type StagingValidationRunInput = {
  environment: LiveDbEnvironmentInput;
  /** No default: an un-injected executor blocks instead of shelling out. */
  migrationExecutor: LiveDbMigrationExecutor | undefined;
  approval: StagingApprovalInput;
  rls: StagingRlsInput;
  timestamp: string;
  clock: () => number;
  wait: (milliseconds: number) => Promise<void>;
  validationRunId?: string;
  /** Full project refs that must never appear in Evidence. */
  forbiddenProjectRefs?: readonly string[];
  maxExpiryWaitMs?: number;
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
 * Projects case results into Evidence rows. Both free-text fields come from the
 * harness's own safe vocabulary — a registry string and a safe error code — so
 * no database message can reach Evidence through this path.
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

const passCase = (caseId: string): LiveDbCaseResult => ({
  caseId,
  executionStatus: "EXECUTED_PASS",
  verdict: "PASS",
});

const failCase = (caseId: string, safeErrorCode: LiveDbSafeErrorCode): LiveDbCaseResult => ({
  caseId,
  executionStatus: "EXECUTED_FAIL",
  verdict: "FAIL",
  safeErrorCode,
});

export type StagingEnvironmentPreflightInput = {
  environment: LiveDbEnvironmentInput;
  migrationExecutor: LiveDbMigrationExecutor | undefined;
  approval: StagingApprovalInput;
  timestamp: string;
  clock: () => number;
  wait: (milliseconds: number) => Promise<void>;
};

/**
 * The checks that need neither a database nor a session, so they can run before
 * anything at all is contacted.
 *
 * `resolveStagingMigrationTarget` carries the whole target contract: the ST-A
 * guard (production target, app-URL collision, unknown production ref,
 * OPENAI_API_KEY presence, LIVE_DB_EXECUTION_CONFIRMED) plus the dual-binding
 * agreement between the Supabase URL and the database URL.
 *
 * Exported because the entrypoint has to run it *before* it signs anyone in.
 * A guard that runs after an authentication request has already left the
 * process is not a guard — the contact it was meant to prevent has happened,
 * whatever the guard then decides.
 */
export function preflightStagingEnvironment(
  input: StagingEnvironmentPreflightInput,
): LiveDbSafeErrorCode | undefined {
  const target = resolveStagingMigrationTarget(input.environment);
  if (target.status === "BLOCKED") return target.safeErrorCode;

  if (typeof input.migrationExecutor !== "function") {
    return "LIVE_DB_MIGRATION_EXECUTOR_NOT_INJECTED";
  }
  if (typeof input.clock !== "function" || typeof input.wait !== "function") {
    return "LIVE_DB_PREFLIGHT_INCOMPLETE";
  }

  const fixtureFailure = assertApprovalFixtures(input.approval);
  if (fixtureFailure) return fixtureFailure;

  // A timestamp that is not an ISO instant cannot anchor Evidence, and finding
  // that out after the migration would be the same mistake in miniature.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.timestamp)) {
    return "LIVE_DB_PREFLIGHT_INCOMPLETE";
  }
  return undefined;
}

/**
 * Everything knowable without a database, checked in one place before the
 * migration runs.
 *
 * Applying a migration is the first irreversible thing this function does, so
 * no static defect — a bad target, a missing dependency, a malformed actor set,
 * an unprefixed fixture, an unusable timestamp — may be discovered after it.
 *
 * The environment half is re-run here even though the entrypoint already ran
 * it. It is pure, so repeating it costs nothing, and this boundary must fail
 * closed on its own rather than trusting a caller to have checked.
 */
function runPreflight(input: StagingValidationRunInput): LiveDbSafeErrorCode | undefined {
  const environmentFailure = preflightStagingEnvironment(input);
  if (environmentFailure) return environmentFailure;

  const actorCheck = validateRlsActorSet(input.rls.actors);
  if (actorCheck.status === "INVALID") return actorCheck.safeErrorCode;
  return liveDbClientIdentityFailure(input.rls.identity);
}

/**
 * The single ST-B execution path: preflight, migration, MIG-01, APR, RLS, the
 * expiry wait, then Evidence.
 *
 * It exists so the guarded boundaries and the code that actually touches the
 * database are the same code. It builds the LIVE_DB clients and the approval
 * repository itself, from the environment the guard approved, so their target
 * cannot diverge from the migration's — there is no injection point through
 * which a foreign client could arrive. A block at any step stops the ones after
 * it, and nothing reaches the database until every static check has passed.
 */
export async function runStagingValidation(
  input: StagingValidationRunInput,
): Promise<StagingValidationRunResult> {
  const validationRunId = input.validationRunId ?? "live-db-validation-001-staging";
  const caseResults: LiveDbCaseResult[] = [];

  const finish = (outcome: {
    safeErrorCode?: LiveDbSafeErrorCode;
    maskedProjectRef: string;
    migrationApplied: boolean;
    appliedMigrationCount: number;
  }): StagingValidationRunResult => {
    const evidence = createLiveDbStagingEvidenceSummary({
      validationRunId,
      maskedProjectRef: outcome.maskedProjectRef,
      migrationApplied: outcome.migrationApplied,
      appliedMigrationCount: outcome.appliedMigrationCount,
      caseResults,
      cases: toCaseEvidence(caseResults),
      timestamp: input.timestamp,
      verdict: outcome.safeErrorCode ? "FAIL" : "PASS",
      ...(input.forbiddenProjectRefs ? { forbiddenProjectRefs: input.forbiddenProjectRefs } : {}),
    });
    // An unsafe summary blocks the run even when every case passed: publishing
    // a secret is itself a failure of ST-B, not a footnote to a green result.
    if (evidence.status === "UNSAFE") {
      return { status: "BLOCKED", safeErrorCode: evidence.safeErrorCode, evidence: evidence.summary };
    }
    return outcome.safeErrorCode
      ? { status: "BLOCKED", safeErrorCode: outcome.safeErrorCode, evidence: evidence.summary }
      : { status: "PASSED", evidence: evidence.summary };
  };
  const blockedBeforeMigration = (safeErrorCode: LiveDbSafeErrorCode) =>
    finish({
      safeErrorCode,
      maskedProjectRef: "unavailable",
      migrationApplied: false,
      appliedMigrationCount: 0,
    });

  const preflightFailure = runPreflight(input);
  if (preflightFailure) return blockedBeforeMigration(preflightFailure);

  // Object construction only — no query is issued here.
  const configuration = {
    ...(input.environment.liveDbSupabaseUrl ? { url: input.environment.liveDbSupabaseUrl } : {}),
    ...(input.environment.liveDbServiceRoleKey
      ? { serviceRoleKey: input.environment.liveDbServiceRoleKey }
      : {}),
  };
  const approvalClient = createLiveDbClient(configuration);
  if (approvalClient.status === "BLOCKED") return blockedBeforeMigration(approvalClient.safeErrorCode);
  const evidenceClient = createLiveDbClient(configuration);
  if (evidenceClient.status === "BLOCKED") return blockedBeforeMigration(evidenceClient.safeErrorCode);
  const injection = createExplicitRepositoryInjection(approvalClient.client, evidenceClient.client);
  if ("status" in injection) return blockedBeforeMigration(injection.safeErrorCode);

  const schemaClient = approvalClient.client as unknown as LiveDbSchemaClient;
  const counter = createLiveDbRecordCounter(schemaClient);

  // Preflight is complete: this is the first irreversible step.
  const migration = await executeStagingMigration(input.environment, input.migrationExecutor);
  if (migration.status === "BLOCKED") return blockedBeforeMigration(migration.safeErrorCode);
  const applied = {
    maskedProjectRef: migration.targetProjectRefMasked,
    migrationApplied: true,
    appliedMigrationCount: migration.appliedMigrationCount,
  };

  // MIG-01, structural half.
  const schema = await verifyStagingSchema(schemaClient);
  if (schema.status === "BLOCKED") {
    caseResults.push(failCase("migration-schema-objects", schema.safeErrorCode));
    return finish({ ...applied, safeErrorCode: schema.safeErrorCode });
  }
  caseResults.push(passCase("migration-schema-objects"));

  const lifecycle = await runApprovalLifecycle({
    repository: injection.approvalRepository,
    counter,
    ...input.approval,
  });
  caseResults.push(...lifecycle.caseResults);
  if (lifecycle.status === "BLOCKED") {
    return finish({
      ...applied,
      safeErrorCode: lifecycle.safeErrorCode ?? "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME",
    });
  }

  // MIG-01, behavioural half. Runs against the expiry fixture, which is the one
  // row still untouched at this point, and leaves it unchanged.
  const probeApprovalId = lifecycle.triggerProbeApprovalId;
  if (!probeApprovalId) {
    return finish({ ...applied, safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" });
  }
  const trigger = await verifyImmutabilityTrigger(schemaClient, probeApprovalId);
  if (trigger.status === "BLOCKED") {
    caseResults.push(failCase("migration-immutability-trigger", trigger.safeErrorCode));
    return finish({ ...applied, safeErrorCode: trigger.safeErrorCode });
  }
  caseResults.push(passCase("migration-immutability-trigger"));

  // RLS. The fixture check runs with the service-role client this boundary
  // already holds, so an owner reading zero rows is never confused with a row
  // that was never there.
  const confirmFixture = async (approvalId: string): Promise<LiveDbRlsFixtureCheck> => {
    // Every approval has exactly one CREATED event, so its presence is the
    // service-role proof that the row exists at all.
    const counted = await counter.countApprovalEvents(approvalId, "CREATED");
    if (counted.status === "ERRORED") {
      return { status: "ERRORED", safeErrorCode: counted.safeErrorCode };
    }
    return counted.count > 0 ? { status: "PRESENT" } : { status: "ABSENT" };
  };
  const rls = await runRlsValidation({
    approvalId: probeApprovalId,
    confirmFixture,
    actors: input.rls.actors,
  });
  caseResults.push(...rls.caseResults);
  if (rls.status === "BLOCKED") {
    return finish({ ...applied, safeErrorCode: rls.safeErrorCode ?? "LIVE_DB_RLS_ACCESS_VIOLATION" });
  }

  // The expiry fixture's TTL has been running down since the lifecycle began.
  const expiry = await runApprovalExpiry({
    repository: injection.approvalRepository,
    counter,
    binding: input.approval.binding,
    expiry: lifecycle.expiry,
    clock: input.clock,
    wait: input.wait,
    ...(input.maxExpiryWaitMs !== undefined ? { maxWaitMs: input.maxExpiryWaitMs } : {}),
  });
  caseResults.push(...expiry.caseResults);
  if (expiry.status === "BLOCKED") {
    return finish({
      ...applied,
      safeErrorCode: expiry.safeErrorCode ?? "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME",
    });
  }

  // Matrix column: ST-B writes no Runtime Evidence at all — that is ST-C's gate.
  const evidenceRows = await counter.countRuntimeEvidence();
  if (evidenceRows.status === "ERRORED") {
    return finish({ ...applied, safeErrorCode: evidenceRows.safeErrorCode });
  }
  if (evidenceRows.count !== 0) {
    return finish({ ...applied, safeErrorCode: "LIVE_DB_RUNTIME_EVIDENCE_UNEXPECTED" });
  }

  // Keeps Evidence and the case registry from drifting apart: a case id the
  // registry does not know would otherwise be published with a placeholder
  // expected result and silently weaken the record.
  if (caseResults.some((item) => !expectedResultByCaseId.has(item.caseId))) {
    return finish({ ...applied, safeErrorCode: "LIVE_DB_VALIDATION_REGISTRY_INVALID" });
  }

  return finish(applied);
}
