import {
  LIVE_DB_DRY_MIGRATION_VERSION,
  LIVE_DB_PROVIDER_ADAPTER_IDENTITY,
  LIVE_DB_PROVIDER_MODE,
  type LiveDbCaseExecutionStatus,
  type LiveDbCaseResult,
  type LiveDbTargetEnvironment,
} from "./types";

export type LiveDbEvidenceTargetEnvironment = LiveDbTargetEnvironment | "unknown";

export type LiveDbValidationEvidenceSummary = {
  validationRunId: string;
  targetEnvironment: LiveDbEvidenceTargetEnvironment;
  targetProjectRefMasked: string;
  actorType: "HARNESS";
  providerMode: typeof LIVE_DB_PROVIDER_MODE;
  providerAdapterIdentity: typeof LIVE_DB_PROVIDER_ADAPTER_IDENTITY;
  externalProviderCallCount: 0;
  migrationVersion: typeof LIVE_DB_DRY_MIGRATION_VERSION;
  secretExposureDetected: false;
  executionMode: "DRY";
  caseResults: readonly LiveDbCaseResult[];
  executedCaseIds: readonly string[];
  failedCaseIds: readonly string[];
  skippedCaseIds: readonly string[];
  notApplicableCaseIds: readonly string[];
  verdict: "PASS" | "FAIL";
};

export function createLiveDbDryEvidenceSummary(input: {
  validationRunId: string;
  targetEnvironment: LiveDbEvidenceTargetEnvironment;
  targetProjectRefMasked: string;
  caseResults: readonly LiveDbCaseResult[];
  verdict: "PASS" | "FAIL";
}): LiveDbValidationEvidenceSummary {
  const caseResults = Object.freeze(input.caseResults.map((item) => Object.freeze({ ...item })));
  const caseIdsFor = (status: LiveDbCaseExecutionStatus) =>
    Object.freeze(caseResults.filter((item) => item.executionStatus === status).map((item) => item.caseId));
  return Object.freeze({
    validationRunId: input.validationRunId,
    targetEnvironment: input.targetEnvironment,
    targetProjectRefMasked: input.targetProjectRefMasked,
    actorType: "HARNESS",
    providerMode: LIVE_DB_PROVIDER_MODE,
    providerAdapterIdentity: LIVE_DB_PROVIDER_ADAPTER_IDENTITY,
    externalProviderCallCount: 0,
    migrationVersion: LIVE_DB_DRY_MIGRATION_VERSION,
    secretExposureDetected: false,
    executionMode: "DRY",
    caseResults,
    executedCaseIds: caseIdsFor("EXECUTED_PASS"),
    failedCaseIds: caseIdsFor("EXECUTED_FAIL"),
    skippedCaseIds: Object.freeze([
      ...caseIdsFor("SKIPPED_REQUIRES_LOCAL"),
      ...caseIdsFor("SKIPPED_REQUIRES_STAGING"),
    ]),
    notApplicableCaseIds: caseIdsFor("NOT_APPLICABLE"),
    verdict: input.verdict,
  });
}

export function hasSecretShapedValue(value: unknown) {
  const serialized = JSON.stringify(value);
  return /(?:sk-[a-z0-9_-]{8,}|service_role|bearer\s+[a-z0-9._-]{8,})/i.test(serialized);
}
