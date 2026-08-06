import type { ExternalBuilderPlatform } from "../types";

export const externalBuilderOperations = [
  "CREATE",
  "GET",
  "ACTIVATE",
  "DEACTIVATE",
  "EXECUTE",
  "GET_EXECUTION",
  "GET_EXECUTION_LOGS",
] as const;

export type ExternalBuilderOperation = (typeof externalBuilderOperations)[number];

export type RetryPolicy = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: readonly number[];
};

export type PollingPolicy = {
  intervalMs: number;
  maxAttempts: number;
  overallTimeoutMs: number;
  terminalStatuses: readonly PlatformExecutionStatus[];
};

export type ExternalBuilderClientConfig = {
  platform: ExternalBuilderPlatform;
  baseUrl: string;
  credentialReference: string;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  pollingPolicy: PollingPolicy;
  dryRun: boolean;
};

export type ExternalBuilderRequestContext = {
  requestId: string;
  projectId: string;
  blueprintChecksum: string;
  approvalReference?: string;
  credentialReference: string;
  dryRun: boolean;
};

export type PlatformExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "WAITING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "TIMED_OUT"
  | "UNKNOWN";

export type NormalizedExternalBuilderErrorCode =
  | "CREDENTIAL_REQUIRED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INVALID_REQUEST"
  | "INVALID_PLATFORM_RESPONSE"
  | "PLATFORM_UNAVAILABLE"
  | "EXECUTION_FAILED"
  | "UNSUPPORTED_OPERATION"
  | "APPROVAL_REQUIRED"
  | "UNKNOWN_EXTERNAL_ERROR";

export type NormalizedExternalBuilderError = {
  platform: ExternalBuilderPlatform;
  operation: ExternalBuilderOperation;
  code: NormalizedExternalBuilderErrorCode;
  safeMessage: string;
  retryable: boolean;
  httpStatus?: number;
  externalReference?: string;
  detailsReference?: string;
  occurredAt: string;
};

export type ExternalBuilderTransportRequest = {
  method: "GET" | "POST" | "PATCH";
  url: string;
  headers: Readonly<Record<string, string>>;
  body?: unknown;
  timeoutMs: number;
  requestId: string;
  signal: AbortSignal;
};

export type ExternalBuilderTransportResponse = {
  status: number;
  headers: Readonly<Record<string, string>>;
  body: unknown;
  receivedAt: string;
};

export type ExternalBuilderTransport = {
  mode: "MOCK" | "PRODUCTION_UNIMPLEMENTED";
  request: (input: ExternalBuilderTransportRequest) => Promise<ExternalBuilderTransportResponse>;
};

export type ExternalBuilderClientResult = {
  platform: ExternalBuilderPlatform;
  operation: ExternalBuilderOperation;
  requestId: string;
  status: "DRY_RUN" | PlatformExecutionStatus;
  externalWorkflowId?: string;
  externalExecutionId?: string;
  responseReference?: string;
  normalizedError?: NormalizedExternalBuilderError;
  actualExternalAction: false;
  startedAt: string;
  finishedAt: string;
};

export type DryRunPreview = {
  platform: ExternalBuilderPlatform;
  operation: ExternalBuilderOperation;
  method: ExternalBuilderTransportRequest["method"];
  sanitizedUrl: string;
  headerNames: readonly string[];
  credentialReference: string;
  sanitizedBody?: unknown;
  approvalRequired: boolean;
  approvalReferencePresent: boolean;
  networkCallPerformed: false;
  actualExternalAction: false;
  warnings: readonly string[];
};

export type ParsedPlatformResponse = {
  externalWorkflowId?: string;
  externalExecutionId?: string;
  status: PlatformExecutionStatus;
  responseReference: string;
};
