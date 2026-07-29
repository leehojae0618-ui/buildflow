import {
  LIVE_DB_DRY_MIGRATION_VERSION,
  LIVE_DB_PROVIDER_ADAPTER_IDENTITY,
  LIVE_DB_PROVIDER_MODE,
  type LiveDbTargetEnvironment,
} from "./types";

export type LiveDbValidationEvidenceSummary = {
  validationRunId: string;
  targetEnvironment: LiveDbTargetEnvironment;
  targetProjectRefMasked: string;
  actorType: "HARNESS";
  providerMode: typeof LIVE_DB_PROVIDER_MODE;
  providerAdapterIdentity: typeof LIVE_DB_PROVIDER_ADAPTER_IDENTITY;
  externalProviderCallCount: 0;
  migrationVersion: typeof LIVE_DB_DRY_MIGRATION_VERSION;
  secretExposureDetected: false;
  executionMode: "DRY";
  executedCaseIds: readonly string[];
  skippedCaseIds: readonly string[];
  verdict: "PASS" | "FAIL";
};

export function createLiveDbDryEvidenceSummary(input: {
  validationRunId: string;
  targetEnvironment: LiveDbTargetEnvironment;
  targetProjectRefMasked: string;
  executedCaseIds: readonly string[];
  skippedCaseIds: readonly string[];
  verdict: "PASS" | "FAIL";
}): LiveDbValidationEvidenceSummary {
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
    executedCaseIds: Object.freeze([...input.executedCaseIds]),
    skippedCaseIds: Object.freeze([...input.skippedCaseIds]),
    verdict: input.verdict,
  });
}

export function hasSecretShapedValue(value: unknown) {
  const serialized = JSON.stringify(value);
  return /(?:sk-[a-z0-9_-]{8,}|service_role|bearer\s+[a-z0-9._-]{8,})/i.test(serialized);
}
