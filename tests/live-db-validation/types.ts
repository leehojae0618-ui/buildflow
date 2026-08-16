export const LIVE_DB_PROVIDER_MODE = "FAKE" as const;
export const LIVE_DB_PROVIDER_ADAPTER_IDENTITY =
  "buildflow.live-db-validation.fake-provider.v1" as const;
export const LIVE_DB_CLIENT_MODE = "LIVE_DB_EXPLICIT_INJECTION" as const;
export const LIVE_DB_DRY_MIGRATION_VERSION = "NOT_APPLICABLE_DRY_MODE" as const;
export const LIVE_DB_TEST_PREFIX = "live-db-validation-001-" as const;

export type LiveDbTargetEnvironment = "local" | "staging";
export type LiveDbHarnessMode = "dry" | "connection";

export type LiveDbSafeErrorCode =
  | "LIVE_DB_TARGET_MISSING"
  | "LIVE_DB_TARGET_INVALID"
  | "LIVE_DB_PRODUCTION_FORBIDDEN"
  | "LIVE_DB_APP_TARGET_MATCH"
  | "LIVE_DB_PRODUCTION_TARGET_MATCH"
  | "LIVE_DB_PRODUCTION_IDENTITY_UNKNOWN"
  | "LIVE_DB_OPENAI_KEY_PRESENT"
  | "LIVE_DB_EXECUTION_CONFIRMATION_REQUIRED"
  | "LIVE_DB_URL_MISSING"
  | "LIVE_DB_SERVICE_ROLE_KEY_MISSING"
  | "LIVE_DB_TARGET_IDENTITY_INVALID"
  | "LIVE_DB_SECRET_EXPOSURE_DETECTED"
  | "LIVE_DB_PROVIDER_NOT_INJECTED"
  | "LIVE_DB_PROVIDER_IDENTITY_INVALID"
  | "LIVE_DB_EXTERNAL_PROVIDER_CALL_DETECTED"
  | "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED"
  | "LIVE_DB_APP_CLIENT_FACTORY_USED"
  | "LIVE_DB_ADMIN_CLIENT_FACTORY_USED"
  | "LIVE_DB_SERVER_CLIENT_FACTORY_USED"
  | "LIVE_DB_CLIENT_MODE_INVALID"
  | "LIVE_DB_VALIDATION_REGISTRY_INVALID"
  | "LIVE_DB_STAGING_TARGET_REQUIRED"
  | "LIVE_DB_STAGING_ENV_FILE_UNREADABLE"
  | "LIVE_DB_PREFLIGHT_INCOMPLETE"
  | "LIVE_DB_FIXTURE_PREFIX_REQUIRED"
  | "LIVE_DB_OWNER_IDENTITY_MISSING"
  | "LIVE_DB_RLS_CREDENTIALS_MISSING"
  | "LIVE_DB_SCHEMA_OBJECT_MISSING"
  | "LIVE_DB_SCHEMA_VERIFICATION_FAILED"
  | "LIVE_DB_IMMUTABILITY_TRIGGER_MISSING"
  | "LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH"
  | "LIVE_DB_RUNTIME_EVIDENCE_UNEXPECTED"
  | "LIVE_DB_COUNTER_NOT_INJECTED"
  | "LIVE_DB_EXPIRY_WAIT_EXCEEDED"
  | "LIVE_DB_DB_URL_MISSING"
  | "LIVE_DB_DB_URL_IDENTITY_INVALID"
  | "LIVE_DB_DB_URL_TARGET_MISMATCH"
  | "LIVE_DB_LINKED_STATE_FORBIDDEN"
  | "LIVE_DB_MIGRATION_EXECUTOR_NOT_INJECTED"
  | "LIVE_DB_MIGRATION_COMMAND_INVALID"
  | "LIVE_DB_MIGRATION_EXECUTION_FAILED"
  | "LIVE_DB_APPROVAL_REPOSITORY_NOT_INJECTED"
  | "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME"
  | "LIVE_DB_APPROVAL_BINDING_FIXTURE_INVALID"
  | "LIVE_DB_APPROVAL_MISMATCH_FIXTURE_INVALID"
  | "LIVE_DB_APPROVAL_EXPIRED_FIXTURE_NOT_INJECTED"
  | "LIVE_DB_RLS_ACTOR_NOT_INJECTED"
  | "LIVE_DB_RLS_ACTOR_CLASS_INVALID"
  | "LIVE_DB_RLS_PROBE_NOT_INJECTED"
  | "LIVE_DB_RLS_FIXTURE_NOT_VISIBLE"
  | "LIVE_DB_RLS_INFRASTRUCTURE_ERROR"
  | "LIVE_DB_RLS_PERMISSION_DENIED"
  | "LIVE_DB_RLS_POLICY_VIOLATION"
  | "LIVE_DB_RLS_ACCESS_VIOLATION";

export type LiveDbEnvironmentInput = {
  targetEnvironment?: string;
  liveDbSupabaseUrl?: string;
  liveDbAnonKey?: string;
  liveDbServiceRoleKey?: string;
  liveDbDatabaseUrl?: string;
  executionConfirmed?: string;
  openAiApiKeyPresent: boolean;
  applicationSupabaseUrl?: string;
  knownProductionProjectRef?: string;
  mode: LiveDbHarnessMode;
};

export type LiveDbEnvironmentResult =
  | {
      ok: true;
      targetEnvironment: LiveDbTargetEnvironment;
      targetIdentityMasked: string;
    }
  | { ok: false; safeErrorCode: LiveDbSafeErrorCode };

export type LiveDbClientIdentity = {
  supabaseClientMode: typeof LIVE_DB_CLIENT_MODE;
  appClientFactoryUsed: false;
  adminClientFactoryUsed: false;
  serverClientFactoryUsed: false;
};

/** Untrusted harness input is validated before any repository can be created. */
export type LiveDbClientIdentityCandidate = {
  supabaseClientMode?: unknown;
  appClientFactoryUsed?: unknown;
  adminClientFactoryUsed?: unknown;
  serverClientFactoryUsed?: unknown;
  repositoryDefaultClientFallbackUsed?: unknown;
};

export type LiveDbProviderIdentity = {
  providerMode: typeof LIVE_DB_PROVIDER_MODE;
  providerAdapterIdentity: typeof LIVE_DB_PROVIDER_ADAPTER_IDENTITY;
  externalProviderCallCount: 0;
  defaultProviderFallbackUsed: false;
  openAIAdapterConstructedByHarness: false;
  openAIAdapterCalled: false;
};

export type LiveDbCaseExecutionStatus =
  | "EXECUTED_PASS"
  | "EXECUTED_FAIL"
  | "SKIPPED_REQUIRES_LOCAL"
  | "SKIPPED_REQUIRES_STAGING"
  | "NOT_APPLICABLE";

export type LiveDbCaseResult = {
  caseId: string;
  executionStatus: LiveDbCaseExecutionStatus;
  verdict: "PASS" | "FAIL" | "SKIPPED";
  safeErrorCode?: LiveDbSafeErrorCode;
};
