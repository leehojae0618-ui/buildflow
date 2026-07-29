import { createLiveDbCleanupManifest, type LiveDbCleanupManifest } from "./cleanup-manifest";
import { createLiveDbDryEvidenceSummary, type LiveDbValidationEvidenceSummary } from "./evidence-summary";
import { validateLiveDbEnvironment } from "./environment-guard";
import { validateLiveDbFakeProvider } from "./fake-provider";
import type { LiveDbClientIdentity, LiveDbEnvironmentInput, LiveDbSafeErrorCode } from "./types";
import {
  dryRunnableValidationCases,
  liveDbValidationCases,
  validateLiveDbValidationCases,
} from "./validation-cases";

export type ExplicitDryClientInjection = {
  approvalClient: object;
  evidenceClient: object;
  identity: LiveDbClientIdentity;
};

export type RepositoryDirectDryHarnessInput = {
  environment: LiveDbEnvironmentInput;
  provider: unknown;
  clients: ExplicitDryClientInjection | undefined;
  validationRunId?: string;
};

export type RepositoryDirectDryHarnessResult = {
  status: "PASSED" | "BLOCKED";
  safeErrorCode?: LiveDbSafeErrorCode;
  evidence: LiveDbValidationEvidenceSummary;
  cleanupManifest: LiveDbCleanupManifest;
};

function blocked(
  safeErrorCode: LiveDbSafeErrorCode,
  validationRunId: string,
  targetProjectRefMasked = "unavailable",
): RepositoryDirectDryHarnessResult {
  return {
    status: "BLOCKED",
    safeErrorCode,
    evidence: createLiveDbDryEvidenceSummary({
      validationRunId,
      targetEnvironment: "local",
      targetProjectRefMasked,
      executedCaseIds: [],
      skippedCaseIds: liveDbValidationCases.map((item) => item.id),
      verdict: "FAIL",
    }),
    cleanupManifest: createLiveDbCleanupManifest(validationRunId),
  };
}

function explicitClientsAreValid(clients: ExplicitDryClientInjection | undefined) {
  return Boolean(
    clients?.approvalClient &&
    clients.evidenceClient &&
    clients.identity.supabaseClientMode === "LIVE_DB_EXPLICIT_INJECTION" &&
    clients.identity.appClientFactoryUsed === false &&
    clients.identity.adminClientFactoryUsed === false &&
    clients.identity.serverClientFactoryUsed === false,
  );
}

/**
 * Validates only repository-direct dry prerequisites. It calls no database,
 * RPC, provider, migration, or cleanup method.
 */
export function runRepositoryDirectDryHarness(
  input: RepositoryDirectDryHarnessInput,
): RepositoryDirectDryHarnessResult {
  const validationRunId = input.validationRunId ?? "live-db-validation-001-dry";
  const environment = validateLiveDbEnvironment({ ...input.environment, mode: "dry" });
  if (!environment.ok) return blocked(environment.safeErrorCode, validationRunId);

  const provider = validateLiveDbFakeProvider(input.provider);
  if (provider.status !== "VALID") {
    return blocked(provider.safeErrorCode, validationRunId, environment.targetIdentityMasked);
  }
  if (!explicitClientsAreValid(input.clients)) {
    return blocked("LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED", validationRunId, environment.targetIdentityMasked);
  }
  if (!validateLiveDbValidationCases()) {
    return blocked("LIVE_DB_TARGET_IDENTITY_INVALID", validationRunId, environment.targetIdentityMasked);
  }

  const executedCaseIds = dryRunnableValidationCases().map((item) => item.id);
  const skippedCaseIds = liveDbValidationCases
    .filter((item) => item.classification !== "DRY_RUNNABLE")
    .map((item) => item.id);
  return {
    status: "PASSED",
    evidence: createLiveDbDryEvidenceSummary({
      validationRunId,
      targetEnvironment: environment.targetEnvironment,
      targetProjectRefMasked: environment.targetIdentityMasked,
      executedCaseIds,
      skippedCaseIds,
      verdict: "PASS",
    }),
    cleanupManifest: createLiveDbCleanupManifest(validationRunId),
  };
}
