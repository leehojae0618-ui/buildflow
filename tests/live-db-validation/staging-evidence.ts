import {
  LIVE_DB_CLIENT_MODE,
  LIVE_DB_PROVIDER_ADAPTER_IDENTITY,
  LIVE_DB_PROVIDER_MODE,
  type LiveDbCaseExecutionStatus,
  type LiveDbCaseResult,
} from "./types";

/**
 * Value shapes that must never reach Evidence or logs. The dry-mode detector in
 * `evidence-summary.ts` only covers `sk-`, `service_role` and bearer tokens;
 * staging additionally exposes database URLs, JWTs and publishable keys, so the
 * staging boundary needs its own wider net.
 */
const unsafePatterns: readonly RegExp[] = [
  /postgres(?:ql)?:\/\//i, // database URL, which embeds the password
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./, // JWT (anon / service role)
  /https?:\/\/[a-z0-9-]{4,}\.supabase\.co/i, // full project URL
  /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{8,}/i,
  /\bservice_role\b/i,
  /\bsk-[A-Za-z0-9_-]{8,}/i,
  /\bbearer\s+[A-Za-z0-9._-]{8,}/i,
];

export type StagingEvidenceSafetyOptions = {
  /** Full project refs that must not appear anywhere, even unquoted. */
  forbiddenProjectRefs?: readonly string[];
};

/**
 * Returns true when the serialized value contains anything unsafe for Evidence.
 * Full project refs are checked by explicit containment rather than by shape,
 * because a bare 20-character token is indistinguishable from a checksum and a
 * shape-based rule would reject legitimate binding checksums.
 */
export function hasStagingUnsafeValue(
  value: unknown,
  options: StagingEvidenceSafetyOptions = {},
): boolean {
  const serialized = JSON.stringify(value) ?? "";
  if (unsafePatterns.some((pattern) => pattern.test(serialized))) return true;
  const lowered = serialized.toLowerCase();
  return (options.forbiddenProjectRefs ?? []).some((ref) => {
    const trimmed = ref.trim().toLowerCase();
    return trimmed.length > 0 && lowered.includes(trimmed);
  });
}

export type LiveDbStagingCaseEvidence = {
  caseId: string;
  actorClass?: string;
  expectedResult: string;
  actualSafeResult: string;
  verdict: LiveDbCaseResult["verdict"];
  safeErrorCode?: string;
  rowCount?: number;
};

export type LiveDbStagingEvidenceSummary = {
  validationRunId: string;
  targetEnvironment: "staging";
  maskedProjectRef: string;
  actorType: "HARNESS";
  providerMode: typeof LIVE_DB_PROVIDER_MODE;
  providerAdapterIdentity: typeof LIVE_DB_PROVIDER_ADAPTER_IDENTITY;
  externalProviderCallCount: 0;
  /**
   * The four client-identity fields CONTRACT.md requires validation evidence to
   * record. They are constants because this boundary constructs the approval
   * repository from the guarded LIVE_DB environment itself — no application,
   * admin or server factory is reachable from the path that produces this
   * summary, so the values cannot be anything else.
   */
  supabaseClientMode: typeof LIVE_DB_CLIENT_MODE;
  appClientFactoryUsed: false;
  adminClientFactoryUsed: false;
  serverClientFactoryUsed: false;
  executionMode: "STAGING";
  migrationApplied: boolean;
  appliedMigrationCount: number;
  timestamp: string;
  cases: readonly LiveDbStagingCaseEvidence[];
  executedCaseIds: readonly string[];
  failedCaseIds: readonly string[];
  skippedCaseIds: readonly string[];
  secretExposureDetected: boolean;
  verdict: "PASS" | "FAIL";
};

export type CreateLiveDbStagingEvidenceInput = {
  validationRunId: string;
  maskedProjectRef: string;
  migrationApplied: boolean;
  appliedMigrationCount: number;
  caseResults: readonly LiveDbCaseResult[];
  cases: readonly LiveDbStagingCaseEvidence[];
  timestamp: string;
  verdict: "PASS" | "FAIL";
} & StagingEvidenceSafetyOptions;

/**
 * A summary is only handed back as `SAFE` when nothing unsafe was found in it.
 * The `UNSAFE` branch still carries a summary so a blocked run leaves Evidence
 * behind, but a fully redacted one.
 */
export type LiveDbStagingEvidenceResult =
  | { status: "SAFE"; summary: LiveDbStagingEvidenceSummary }
  | {
      status: "UNSAFE";
      safeErrorCode: "LIVE_DB_SECRET_EXPOSURE_DETECTED";
      summary: LiveDbStagingEvidenceSummary;
    };

/** Exactly the shape `Date#toISOString` produces, and nothing else. */
const isoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * Every field is replaced by a constant rather than reused, including the
 * timestamp: it is the one value a redacted summary has any reason to carry
 * over, which makes it the one field a secret could still ride out on. A
 * timestamp that is not exactly an ISO instant is dropped entirely.
 *
 * Carrying the original fields over and merely flipping `secretExposureDetected`
 * would detect the leak while still publishing it.
 */
function redactedSummary(timestamp: string): LiveDbStagingEvidenceSummary {
  return Object.freeze({
    validationRunId: "unavailable",
    targetEnvironment: "staging",
    maskedProjectRef: "unavailable",
    actorType: "HARNESS",
    providerMode: LIVE_DB_PROVIDER_MODE,
    providerAdapterIdentity: LIVE_DB_PROVIDER_ADAPTER_IDENTITY,
    externalProviderCallCount: 0,
    supabaseClientMode: LIVE_DB_CLIENT_MODE,
    appClientFactoryUsed: false,
    adminClientFactoryUsed: false,
    serverClientFactoryUsed: false,
    executionMode: "STAGING",
    migrationApplied: false,
    appliedMigrationCount: 0,
    timestamp: isoTimestamp.test(timestamp) ? timestamp : "unavailable",
    cases: Object.freeze([]),
    executedCaseIds: Object.freeze([]),
    failedCaseIds: Object.freeze([]),
    skippedCaseIds: Object.freeze([]),
    secretExposureDetected: true,
    verdict: "FAIL",
  });
}

/**
 * Builds the ST-B Evidence summary from safe fields only. It accepts already
 * masked identifiers; it never receives or derives a URL, key, or full ref.
 *
 * The built summary is scanned with `hasStagingUnsafeValue` before it is
 * returned, so a caller that puts a database URL, JWT or raw SQL error into
 * `actualSafeResult` gets a redacted summary and an explicit failure instead of
 * Evidence that quietly contains the secret.
 */
export function createLiveDbStagingEvidenceSummary(
  input: CreateLiveDbStagingEvidenceInput,
): LiveDbStagingEvidenceResult {
  const caseIdsFor = (...statuses: LiveDbCaseExecutionStatus[]) =>
    Object.freeze(
      input.caseResults
        .filter((item) => statuses.includes(item.executionStatus))
        .map((item) => item.caseId),
    );

  const summary: LiveDbStagingEvidenceSummary = Object.freeze({
    validationRunId: input.validationRunId,
    targetEnvironment: "staging",
    maskedProjectRef: input.maskedProjectRef,
    actorType: "HARNESS",
    providerMode: LIVE_DB_PROVIDER_MODE,
    providerAdapterIdentity: LIVE_DB_PROVIDER_ADAPTER_IDENTITY,
    externalProviderCallCount: 0,
    supabaseClientMode: LIVE_DB_CLIENT_MODE,
    appClientFactoryUsed: false,
    adminClientFactoryUsed: false,
    serverClientFactoryUsed: false,
    executionMode: "STAGING",
    migrationApplied: input.migrationApplied,
    appliedMigrationCount: input.appliedMigrationCount,
    timestamp: input.timestamp,
    cases: Object.freeze(input.cases.map((item) => Object.freeze({ ...item }))),
    executedCaseIds: caseIdsFor("EXECUTED_PASS"),
    failedCaseIds: caseIdsFor("EXECUTED_FAIL"),
    skippedCaseIds: caseIdsFor("SKIPPED_REQUIRES_LOCAL", "SKIPPED_REQUIRES_STAGING"),
    secretExposureDetected: false,
    verdict: input.verdict,
  });

  const options: StagingEvidenceSafetyOptions = {
    ...(input.forbiddenProjectRefs ? { forbiddenProjectRefs: input.forbiddenProjectRefs } : {}),
  };
  if (hasStagingUnsafeValue(summary, options)) {
    const redacted = redactedSummary(input.timestamp);
    return {
      status: "UNSAFE",
      safeErrorCode: "LIVE_DB_SECRET_EXPOSURE_DETECTED",
      // Scanned again rather than assumed clean: the redacted summary is what
      // actually gets published, so it is what has to be checked.
      summary: hasStagingUnsafeValue(redacted, options) ? redactedSummary("") : redacted,
    };
  }
  return { status: "SAFE", summary };
}
