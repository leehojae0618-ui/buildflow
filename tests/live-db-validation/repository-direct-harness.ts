import { createLiveDbCleanupManifest, type LiveDbCleanupManifest } from "./cleanup-manifest";
import {
  createLiveDbDryEvidenceSummary,
  hasSecretShapedValue,
  type LiveDbValidationEvidenceSummary,
} from "./evidence-summary";
import { validateLiveDbEnvironment } from "./environment-guard";
import { validateLiveDbFakeProvider } from "./fake-provider";
import type {
  LiveDbCaseResult,
  LiveDbClientIdentityCandidate,
  LiveDbEnvironmentInput,
  LiveDbSafeErrorCode,
} from "./types";
import {
  liveDbValidationCases,
  type LiveDbValidationCase,
  validateLiveDbValidationCaseRegistry,
} from "./validation-cases";

export type ExplicitDryClientInjection = {
  approvalClient?: object;
  evidenceClient?: object;
  identity?: LiveDbClientIdentityCandidate;
};

export type RepositoryDirectDryHarnessInput = {
  environment: LiveDbEnvironmentInput;
  provider: unknown;
  clients: ExplicitDryClientInjection | undefined;
  validationRunId?: string;
  validationCases?: readonly LiveDbValidationCase[];
};

export type RepositoryDirectDryHarnessResult = {
  status: "PASSED" | "BLOCKED";
  safeErrorCode?: LiveDbSafeErrorCode;
  evidence: LiveDbValidationEvidenceSummary;
  cleanupManifest: LiveDbCleanupManifest;
};

function defaultCaseResults(values: readonly LiveDbValidationCase[]): LiveDbCaseResult[] {
  const seen = new Set<string>();
  const results: LiveDbCaseResult[] = [];
  for (const item of values) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    if (item.classification === "REQUIRES_SUPABASE_LOCAL") {
      results.push({ caseId: item.id, executionStatus: "SKIPPED_REQUIRES_LOCAL", verdict: "SKIPPED" });
      continue;
    }
    if (item.classification === "REQUIRES_STAGING") {
      results.push({ caseId: item.id, executionStatus: "SKIPPED_REQUIRES_STAGING", verdict: "SKIPPED" });
      continue;
    }
    results.push({ caseId: item.id, executionStatus: "NOT_APPLICABLE", verdict: "SKIPPED" });
  }
  return results;
}

function updateCaseResult(
  values: readonly LiveDbCaseResult[],
  caseId: string,
  result: Omit<LiveDbCaseResult, "caseId">,
): LiveDbCaseResult[] {
  return values.map((item) => (item.caseId === caseId ? { caseId, ...result } : item));
}

function blocked(
  safeErrorCode: LiveDbSafeErrorCode,
  validationRunId: string,
  caseResults: readonly LiveDbCaseResult[],
): RepositoryDirectDryHarnessResult {
  return {
    status: "BLOCKED",
    safeErrorCode,
    evidence: createLiveDbDryEvidenceSummary({
      validationRunId,
      targetEnvironment: "unknown",
      targetProjectRefMasked: "unavailable",
      caseResults,
      verdict: "FAIL",
    }),
    cleanupManifest: createLiveDbCleanupManifest(validationRunId),
  };
}

function explicitClientFailure(
  clients: ExplicitDryClientInjection | undefined,
): LiveDbSafeErrorCode | undefined {
  if (!clients?.approvalClient || !clients.evidenceClient || !clients.identity) {
    return "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED";
  }
  if (clients.identity.supabaseClientMode !== "LIVE_DB_EXPLICIT_INJECTION") {
    return "LIVE_DB_CLIENT_MODE_INVALID";
  }
  if (clients.identity.appClientFactoryUsed === true) return "LIVE_DB_APP_CLIENT_FACTORY_USED";
  if (clients.identity.adminClientFactoryUsed === true) return "LIVE_DB_ADMIN_CLIENT_FACTORY_USED";
  if (clients.identity.serverClientFactoryUsed === true) return "LIVE_DB_SERVER_CLIENT_FACTORY_USED";
  if (clients.identity.repositoryDefaultClientFallbackUsed === true) {
    return "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED";
  }
  if (
    clients.identity.appClientFactoryUsed !== false ||
    clients.identity.adminClientFactoryUsed !== false ||
    clients.identity.serverClientFactoryUsed !== false
  ) {
    return "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED";
  }
  return undefined;
}

/**
 * Validates only repository-direct dry prerequisites. It calls no database,
 * RPC, provider, migration, or cleanup method.
 */
export function runRepositoryDirectDryHarness(
  input: RepositoryDirectDryHarnessInput,
): RepositoryDirectDryHarnessResult {
  const validationRunId = input.validationRunId ?? "live-db-validation-001-dry";
  const validationCases = input.validationCases ?? liveDbValidationCases;
  let caseResults = defaultCaseResults(validationCases);
  const environment = validateLiveDbEnvironment({ ...input.environment, mode: "dry" });
  if (!environment.ok) {
    const environmentCaseId = input.environment.targetEnvironment === "production"
      ? "environment-production-block"
      : "environment-local-target";
    caseResults = updateCaseResult(caseResults, environmentCaseId, {
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: environment.safeErrorCode,
    });
    return blocked(environment.safeErrorCode, validationRunId, caseResults);
  }
  caseResults = updateCaseResult(caseResults, "environment-local-target", {
    executionStatus: "EXECUTED_PASS",
    verdict: "PASS",
  });

  const provider = validateLiveDbFakeProvider(input.provider);
  if (provider.status !== "VALID") {
    caseResults = updateCaseResult(caseResults, "provider-fake-identity", {
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: provider.safeErrorCode,
    });
    return blocked(provider.safeErrorCode, validationRunId, caseResults);
  }
  caseResults = updateCaseResult(caseResults, "provider-fake-identity", {
    executionStatus: "EXECUTED_PASS",
    verdict: "PASS",
  });

  const clientFailure = explicitClientFailure(input.clients);
  if (clientFailure) {
    caseResults = updateCaseResult(caseResults, "client-explicit-injection", {
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: clientFailure,
    });
    return blocked(clientFailure, validationRunId, caseResults);
  }
  caseResults = updateCaseResult(caseResults, "client-explicit-injection", {
    executionStatus: "EXECUTED_PASS",
    verdict: "PASS",
  });

  const registry = validateLiveDbValidationCaseRegistry(validationCases);
  if (registry.status !== "VALID") {
    caseResults = updateCaseResult(caseResults, "registry-integrity", {
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: registry.safeErrorCode,
    });
    return blocked(registry.safeErrorCode, validationRunId, caseResults);
  }
  caseResults = updateCaseResult(caseResults, "registry-integrity", {
    executionStatus: "EXECUTED_PASS",
    verdict: "PASS",
  });
  caseResults = updateCaseResult(caseResults, "evidence-safety", {
    executionStatus: "EXECUTED_PASS",
    verdict: "PASS",
  });

  let evidence = createLiveDbDryEvidenceSummary({
    validationRunId,
    targetEnvironment: environment.targetEnvironment,
    targetProjectRefMasked: environment.targetIdentityMasked,
    caseResults,
    verdict: "PASS",
  });
  if (hasSecretShapedValue(evidence)) {
    caseResults = updateCaseResult(caseResults, "evidence-safety", {
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: "LIVE_DB_SECRET_EXPOSURE_DETECTED",
    });
    evidence = createLiveDbDryEvidenceSummary({
      validationRunId,
      targetEnvironment: "unknown",
      targetProjectRefMasked: "unavailable",
      caseResults,
      verdict: "FAIL",
    });
    return {
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_SECRET_EXPOSURE_DETECTED",
      evidence,
      cleanupManifest: createLiveDbCleanupManifest(validationRunId),
    };
  }

  return {
    status: "PASSED",
    evidence,
    cleanupManifest: createLiveDbCleanupManifest(validationRunId),
  };
}
