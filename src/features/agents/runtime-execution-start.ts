import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "./package-export";
import type {
  ReferenceIdentifier,
  RuntimeActorReference,
  RuntimeExecutionRequest,
  RuntimeExecutionRequestApprovalBinding,
  RuntimeExecutionRequestEvidenceBinding,
  RuntimeExecutionRequestPackageBinding,
} from "./runtime-execution-request";

export const RUNTIME_PREFLIGHT_RESULT_FORMAT_VERSION =
  "buildflow.runtime-preflight-result.v1" as const;
export const RUNTIME_EXECUTION_START_FORMAT_VERSION =
  "buildflow.runtime-execution-start.v1" as const;

export type RuntimePreflightStatus =
  | "READY"
  | "WAITING_FOR_CONNECTION"
  | "WAITING_FOR_CREDENTIAL"
  | "WAITING_FOR_APPROVAL"
  | "BLOCKED"
  | "INVALID"
  | "EXPIRED"
  | "CANCELLED";

export type RuntimeReadinessStatus =
  | "READY"
  | "MISSING"
  | "NOT_READY"
  | "EXPIRED"
  | "REVOKED"
  | "UNKNOWN";

export type RuntimeApprovalSnapshotStatus =
  | "APPROVED"
  | "REVOKED"
  | "EXPIRED"
  | "INVALID"
  | "UNKNOWN";

export type RuntimeConnectionSnapshotStatus =
  | "CONNECTED"
  | "DEGRADED"
  | "DISCONNECTED"
  | "REVOKED"
  | "ERROR"
  | "UNKNOWN";

export type RuntimeCredentialSnapshotStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "REVOKED"
  | "ROTATION_REQUIRED"
  | "INVALID"
  | "ERROR"
  | "UNKNOWN";

export type RuntimeCapabilitySnapshotStatus =
  | "AVAILABLE"
  | "MISSING_CONNECTION"
  | "MISSING_CREDENTIAL"
  | "INSUFFICIENT_SCOPE"
  | "MISSING_APPROVAL"
  | "TOOL_UNAVAILABLE"
  | "POLICY_DENIED"
  | "TOOL_DEFINITION_CHANGED"
  | "UNKNOWN";

export type RuntimeProviderSnapshotStatus =
  | "READY"
  | "CONFIGURATION_MISSING"
  | "CREDENTIAL_MISSING"
  | "MODEL_UNAVAILABLE"
  | "POLICY_DENIED"
  | "DEGRADED"
  | "ERROR"
  | "UNKNOWN";

export type RuntimeMcpSnapshotStatus =
  | "READY"
  | "SERVER_UNAVAILABLE"
  | "TOOL_UNAVAILABLE"
  | "TOOL_DEFINITION_CHANGED"
  | "CONNECTION_MISSING"
  | "CREDENTIAL_MISSING"
  | "POLICY_DENIED"
  | "ERROR"
  | "UNKNOWN";

export type RuntimePolicySnapshotStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "EXPIRED"
  | "INVALID"
  | "UNKNOWN";

export type RuntimeCancellationSnapshotStatus =
  | "NONE"
  | "REQUESTED"
  | "ACCEPTED"
  | "COMPLETED"
  | "REJECTED"
  | "UNKNOWN";

export type RuntimeIdempotencySnapshotStatus =
  | "AVAILABLE"
  | "DUPLICATE_ACTIVE"
  | "ALREADY_COMPLETED"
  | "CONFLICT"
  | "UNKNOWN";

export type RuntimePreflightFailureCode =
  | "PREFLIGHT_REQUEST_INVALID"
  | "PREFLIGHT_REQUEST_EXPIRED"
  | "PREFLIGHT_APPROVAL_MISSING"
  | "PREFLIGHT_APPROVAL_REVOKED"
  | "PREFLIGHT_APPROVAL_EXPIRED"
  | "PREFLIGHT_APPROVAL_SCOPE_MISSING"
  | "PREFLIGHT_APPROVAL_BINDING_MISMATCH"
  | "PREFLIGHT_CONNECTION_MISSING"
  | "PREFLIGHT_CONNECTION_NOT_READY"
  | "PREFLIGHT_CREDENTIAL_MISSING"
  | "PREFLIGHT_CREDENTIAL_NOT_ACTIVE"
  | "PREFLIGHT_CREDENTIAL_EXPIRED"
  | "PREFLIGHT_CAPABILITY_UNAVAILABLE"
  | "PREFLIGHT_PROVIDER_NOT_READY"
  | "PREFLIGHT_MCP_NOT_READY"
  | "PREFLIGHT_MCP_TOOL_DEFINITION_CHANGED"
  | "PREFLIGHT_RUNTIME_POLICY_INACTIVE"
  | "PREFLIGHT_EXECUTION_MODE_DENIED"
  | "PREFLIGHT_CANCELLATION_REQUESTED"
  | "PREFLIGHT_DUPLICATE_EXECUTION"
  | "PREFLIGHT_IDEMPOTENCY_CONFLICT"
  | "PREFLIGHT_SNAPSHOT_INVALID"
  | "PREFLIGHT_SECRET_DETECTED"
  | "PREFLIGHT_PAYLOAD_FORBIDDEN"
  | "PREFLIGHT_INTERNAL_ERROR";

export type RuntimeExecutionStartFailureCode =
  | "RUNTIME_START_REQUEST_INVALID"
  | "RUNTIME_START_PREFLIGHT_INVALID"
  | "RUNTIME_START_PREFLIGHT_NOT_READY"
  | "RUNTIME_START_REQUEST_BINDING_MISMATCH"
  | "RUNTIME_START_APPROVAL_BINDING_MISMATCH"
  | "RUNTIME_START_PACKAGE_BINDING_MISMATCH"
  | "RUNTIME_START_EVIDENCE_BINDING_MISMATCH"
  | "RUNTIME_START_EXECUTION_MODE_MISMATCH"
  | "RUNTIME_START_EXPIRED"
  | "RUNTIME_START_CANCELLED"
  | "RUNTIME_START_IDEMPOTENCY_CONFLICT"
  | "RUNTIME_START_INTENT_INVALID"
  | "RUNTIME_START_PREVIOUS_EXECUTION_REQUIRED"
  | "RUNTIME_START_PREVIOUS_EXECUTION_FORBIDDEN"
  | "RUNTIME_START_TIMESTAMP_INVALID"
  | "RUNTIME_START_SECRET_DETECTED"
  | "RUNTIME_START_PAYLOAD_FORBIDDEN"
  | "RUNTIME_START_INTERNAL_ERROR";

export type RuntimePreflightLimitationCode =
  | "NO_LIVE_CONNECTION_ATTESTATION"
  | "NO_LIVE_CREDENTIAL_ATTESTATION"
  | "NO_PROVIDER_AVAILABILITY_ATTESTATION"
  | "NO_MCP_AVAILABILITY_ATTESTATION"
  | "NO_PERSISTENCE_ATTESTATION"
  | "NO_EXECUTION_LEASE_ATTESTATION"
  | "NO_COST_ENFORCEMENT_ATTESTATION";

export type RuntimePreflightFailure = {
  code: RuntimePreflightFailureCode;
  target?: string;
  safeReference?: string;
  recoverable: boolean;
  userActionable: boolean;
};

export type RuntimeExecutionStartFailure = {
  code: RuntimeExecutionStartFailureCode;
  target?: string;
  safeReference?: string;
  recoverable: boolean;
  userActionable: boolean;
};

type SnapshotBase<Status extends string> = {
  status: Status;
  observedAt?: string;
  expiresAt?: string;
  limitationCodes?: string[];
  checksum: string;
};

export type RuntimeApprovalStatusSnapshot = {
  approvalReferenceId: string;
  scopes: string[];
  packageBinding: RuntimeExecutionRequestPackageBinding;
  evidenceBinding: RuntimeExecutionRequestEvidenceBinding;
  runtimeExecutionRequestBinding: {
    runtimeExecutionRequestId: string;
    integrityChecksum: string;
  };
  approvedAt?: string;
  revokedAt?: string;
} & SnapshotBase<RuntimeApprovalSnapshotStatus>;

export type RuntimeConnectionReadinessSnapshot = {
  connectionReferenceId: string;
  serviceReference: string;
  versionReference?: string;
  grantedCapabilityReferences?: string[];
} & SnapshotBase<RuntimeConnectionSnapshotStatus>;

export type RuntimeCredentialReadinessSnapshot = {
  credentialReferenceId: string;
  connectionReferenceId: string;
  versionReference?: string;
} & SnapshotBase<RuntimeCredentialSnapshotStatus>;

export type RuntimeCapabilityReadinessSnapshot = {
  capabilityReferenceId: string;
  supportedByBlock: boolean;
  supportedByTool: boolean;
  grantedByConnection: boolean;
  permittedByPolicy: boolean;
  coveredByApproval: boolean;
  toolSnapshotChecksum?: string;
} & SnapshotBase<RuntimeCapabilitySnapshotStatus>;

export type RuntimeProviderReadinessSnapshot = {
  providerReference: string;
  modelReference?: string;
  configurationReference?: string;
  credentialReference?: string;
} & SnapshotBase<RuntimeProviderSnapshotStatus>;

export type RuntimeMcpReadinessSnapshot = {
  mcpServerReference: string;
  mcpToolSnapshotReference: string;
  toolDefinitionChecksum: string;
  connectionReference?: string;
  credentialReference?: string;
  capabilityReferences?: string[];
} & SnapshotBase<RuntimeMcpSnapshotStatus>;

export type RuntimePolicySnapshot = {
  runtimePolicyReference: ReferenceIdentifier;
  versionReference?: string;
  allowedExecutionModes?: string[];
  retryPolicyReference?: string;
  timeoutPolicyReference?: string;
  idempotencyPolicyReference?: string;
  costApprovalStatusReference?: string;
} & SnapshotBase<RuntimePolicySnapshotStatus>;

export type RuntimeCancellationSnapshot = {
  runtimeExecutionRequestId: string;
  cancellationReferenceId?: string;
  requestedAt?: string;
  actorReference?: RuntimeActorReference;
  checksum: string;
  status: RuntimeCancellationSnapshotStatus;
};

export type RuntimeIdempotencySnapshot = {
  runtimeExecutionRequestId: string;
  status: RuntimeIdempotencySnapshotStatus;
  existingRuntimeExecutionReference?: string;
  evaluatedAt: string;
  checksum: string;
};

export type RuntimeReadinessSummary = {
  requiredCount: number;
  readyCount: number;
  blockedCount: number;
  missingReferences: string[];
  blockedReferences: string[];
  snapshotChecksums: string[];
};

export type RuntimePreflightDeterministicCore = {
  formatVersion: typeof RUNTIME_PREFLIGHT_RESULT_FORMAT_VERSION;
  runtimeExecutionRequestReference: {
    runtimeExecutionRequestId: string;
    integrityChecksum: string;
  };
  evaluatedAt: string;
  preflightStatus: RuntimePreflightStatus;
  approvalReadiness: RuntimeReadinessStatus;
  connectionReadinessSummary: RuntimeReadinessSummary;
  credentialReadinessSummary: RuntimeReadinessSummary;
  capabilityReadinessSummary: RuntimeReadinessSummary;
  providerReadinessSummary: RuntimeReadinessSummary;
  mcpReadinessSummary: RuntimeReadinessSummary;
  runtimePolicyReadiness: RuntimeReadinessStatus;
  cancellationReadiness: RuntimeReadinessStatus;
  idempotencyReadiness: RuntimeReadinessStatus;
  safeFailureCodes: RuntimePreflightFailureCode[];
  limitationCodes: RuntimePreflightLimitationCode[];
};

export type RuntimePreflightResult = RuntimePreflightDeterministicCore & {
  runtimePreflightResultId: string;
  integrityChecksum: string;
};

export type BuildRuntimePreflightInput = {
  runtimeExecutionRequest: RuntimeExecutionRequest;
  approvalStatusSnapshot: RuntimeApprovalStatusSnapshot;
  connectionReadinessSnapshots?: RuntimeConnectionReadinessSnapshot[];
  credentialReadinessSnapshots?: RuntimeCredentialReadinessSnapshot[];
  capabilityReadinessSnapshots?: RuntimeCapabilityReadinessSnapshot[];
  providerReadinessSnapshots?: RuntimeProviderReadinessSnapshot[];
  mcpReadinessSnapshots?: RuntimeMcpReadinessSnapshot[];
  runtimePolicySnapshot?: RuntimePolicySnapshot;
  cancellationSnapshot: RuntimeCancellationSnapshot;
  idempotencySnapshot: RuntimeIdempotencySnapshot;
  evaluatedAt: string;
};

export type BuildRuntimePreflightResult =
  | { status: "VALID"; value: RuntimePreflightResult; failures: [] }
  | { status: "INVALID"; failures: RuntimePreflightFailure[] };

export type RuntimeExecutionIntent = "INITIAL" | "RETRY" | "MANUAL_RERUN";

export type RuntimeExecutionStartDeterministicCore = {
  formatVersion: typeof RUNTIME_EXECUTION_START_FORMAT_VERSION;
  runtimeExecutionId: string;
  runtimeExecutionRequestReference: {
    runtimeExecutionRequestId: string;
    integrityChecksum: string;
  };
  runtimePreflightResultReference: {
    runtimePreflightResultId: string;
    integrityChecksum: string;
  };
  executionIntent: RuntimeExecutionIntent;
  executionSequence: string;
  previousRuntimeExecutionReference?: string;
  initiatedByActorReference: RuntimeActorReference;
  startedAt: string;
  initialRuntimeStatus: "READY";
  approvalBinding: RuntimeExecutionRequestApprovalBinding;
  packageBinding: RuntimeExecutionRequestPackageBinding;
  evidenceBinding: RuntimeExecutionRequestEvidenceBinding;
  runtimePolicyReference?: ReferenceIdentifier;
  limitationCodes: RuntimePreflightLimitationCode[];
};

export type RuntimeExecutionStart = RuntimeExecutionStartDeterministicCore & {
  runtimeExecutionStartId: string;
  integrityChecksum: string;
};

export type BuildRuntimeExecutionStartInput = {
  runtimeExecutionRequest: RuntimeExecutionRequest;
  runtimePreflightResult: RuntimePreflightResult;
  executionIntent: RuntimeExecutionIntent;
  executionSequence: string;
  previousRuntimeExecutionReference?: string;
  initiatedByActorReference: RuntimeActorReference;
  startedAt: string;
};

export type BuildRuntimeExecutionStartResult =
  | { status: "VALID"; value: RuntimeExecutionStart; failures: [] }
  | { status: "INVALID"; failures: RuntimeExecutionStartFailure[] };

const sha256Pattern = /^[a-f0-9]{64}$/;
const defaultPreflightLimitations: RuntimePreflightLimitationCode[] = [
  "NO_EXECUTION_LEASE_ATTESTATION",
  "NO_LIVE_CONNECTION_ATTESTATION",
  "NO_LIVE_CREDENTIAL_ATTESTATION",
  "NO_MCP_AVAILABILITY_ATTESTATION",
  "NO_PERSISTENCE_ATTESTATION",
  "NO_PROVIDER_AVAILABILITY_ATTESTATION",
  "NO_COST_ENFORCEMENT_ATTESTATION",
];

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /AKIA[0-9A-Z]{16}/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
  /Authorization:\s*[^\s]+/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:postgres|postgresql|mysql|mongodb):\/\/[^/\s:@]+:[^@\s]+@/i,
  /https?:\/\/[^\s?]+\?[^\s]*(?:token|signature|X-Amz-Signature|access_key)=/i,
] as const;

const forbiddenKeys = new Set([
  "access_token",
  "accessToken",
  "api_key",
  "apiKey",
  "authorization",
  "authorizationHeader",
  "authHeader",
  "client_secret",
  "clientSecret",
  "connectionString",
  "cookie",
  "databaseUrl",
  "dbPassword",
  "fileContent",
  "fullPrompt",
  "headers",
  "logs",
  "mcpArguments",
  "mcpPayload",
  "mcpResult",
  "passwd",
  "password",
  "privateInput",
  "privateKey",
  "privateOutput",
  "private_key",
  "prompt",
  "providerPayload",
  "providerResponse",
  "rawPayload",
  "refresh_token",
  "refreshToken",
  "requestBody",
  "responseBody",
  "secret",
  "session",
  "sessionId",
  "signedUrl",
  "stack",
  "stackTrace",
  "token",
]);

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hash(value: unknown) {
  return sha256(stableSerializeAgentPackage(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasSecret(value: unknown): boolean {
  if (typeof value === "string") {
    return secretPatterns.some((pattern) => pattern.test(value));
  }
  if (Array.isArray(value)) return value.some(hasSecret);
  if (isRecord(value)) {
    return Object.entries(value).some(([key, child]) => forbiddenKeys.has(key) || hasSecret(child));
  }
  return false;
}

function normalizeIso(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const normalized = value.trim();
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match) return undefined;
  const [, year, month, day] = match;
  const calendarDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    calendarDate.getUTCFullYear() !== Number(year) ||
    calendarDate.getUTCMonth() !== Number(month) - 1 ||
    calendarDate.getUTCDate() !== Number(day)
  ) {
    return undefined;
  }
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function preflightFailure(
  code: RuntimePreflightFailureCode,
  target?: string,
  safeReference?: string,
): RuntimePreflightFailure {
  return { code, ...(target ? { target } : {}), ...(safeReference ? { safeReference } : {}), recoverable: true, userActionable: true };
}

function startFailure(
  code: RuntimeExecutionStartFailureCode,
  target?: string,
  safeReference?: string,
): RuntimeExecutionStartFailure {
  return { code, ...(target ? { target } : {}), ...(safeReference ? { safeReference } : {}), recoverable: true, userActionable: true };
}

function isExpired(expiresAt: string | undefined, evaluatedAt: string) {
  if (!expiresAt) return false;
  const expires = normalizeIso(expiresAt);
  if (!expires) return true;
  return new Date(evaluatedAt).getTime() >= new Date(expires).getTime();
}

function checksumFailure(checksum: string | undefined, target: string) {
  return checksum && sha256Pattern.test(checksum)
    ? undefined
    : preflightFailure("PREFLIGHT_SNAPSHOT_INVALID", target);
}

function integrityFailure(
  actual: string | undefined,
  expected: string,
  target: string,
): RuntimePreflightFailure | undefined {
  if (!actual || !sha256Pattern.test(actual) || actual !== expected) {
    return preflightFailure("PREFLIGHT_REQUEST_INVALID", target);
  }
  return undefined;
}

function preflightIntegrityFailure(
  actual: string | undefined,
  expected: string,
  target: string,
): RuntimeExecutionStartFailure | undefined {
  if (!actual || !sha256Pattern.test(actual) || actual !== expected) {
    return startFailure("RUNTIME_START_PREFLIGHT_INVALID", target);
  }
  return undefined;
}

function requestIntegrityFailure(
  actual: string | undefined,
  expected: string,
  target: string,
): RuntimeExecutionStartFailure | undefined {
  if (!actual || !sha256Pattern.test(actual) || actual !== expected) {
    return startFailure("RUNTIME_START_REQUEST_INVALID", target);
  }
  return undefined;
}

function duplicateFailures(
  snapshots: { id: string; checksum: string }[],
  target: string,
): RuntimePreflightFailure[] {
  const byId = new Map<string, string>();
  const failures: RuntimePreflightFailure[] = [];
  for (const item of snapshots) {
    const existing = byId.get(item.id);
    if (existing && existing !== item.checksum) {
      failures.push(preflightFailure("PREFLIGHT_SNAPSHOT_INVALID", target, item.id));
      continue;
    }
    byId.set(item.id, item.checksum);
  }
  return failures;
}

function summary(
  snapshots: { id: string; status: string; checksum: string; ready: boolean; blocked: boolean }[],
): RuntimeReadinessSummary {
  const unique = new Map<string, { id: string; status: string; checksum: string; ready: boolean; blocked: boolean }>();
  for (const item of snapshots) {
    const existing = unique.get(item.id);
    if (existing && stableSerializeAgentPackage(existing) !== stableSerializeAgentPackage(item)) {
      unique.set(item.id, { ...item, status: "CONFLICT", ready: false, blocked: true });
      continue;
    }
    unique.set(item.id, item);
  }
  const values = [...unique.values()].sort((a, b) => a.id.localeCompare(b.id));
  return {
    requiredCount: values.length,
    readyCount: values.filter((item) => item.ready).length,
    blockedCount: values.filter((item) => item.blocked).length,
    missingReferences: values.filter((item) => item.status === "MISSING").map((item) => item.id),
    blockedReferences: values.filter((item) => item.blocked).map((item) => item.id),
    snapshotChecksums: values.map((item) => item.checksum).sort(),
  };
}

function invalidPreflight(failures: RuntimePreflightFailure[]): BuildRuntimePreflightResult {
  const unique = new Map<string, RuntimePreflightFailure>();
  for (const item of failures) unique.set(`${item.code}:${item.target ?? ""}:${item.safeReference ?? ""}`, item);
  return { status: "INVALID", failures: [...unique.values()] };
}

function invalidStart(failures: RuntimeExecutionStartFailure[]): BuildRuntimeExecutionStartResult {
  const unique = new Map<string, RuntimeExecutionStartFailure>();
  for (const item of failures) unique.set(`${item.code}:${item.target ?? ""}:${item.safeReference ?? ""}`, item);
  return { status: "INVALID", failures: [...unique.values()] };
}

function statusFromFailures(codes: RuntimePreflightFailureCode[]): RuntimePreflightStatus {
  if (codes.includes("PREFLIGHT_REQUEST_INVALID") || codes.includes("PREFLIGHT_SNAPSHOT_INVALID")) return "INVALID";
  if (codes.includes("PREFLIGHT_REQUEST_EXPIRED") || codes.includes("PREFLIGHT_APPROVAL_EXPIRED")) return "EXPIRED";
  if (codes.includes("PREFLIGHT_CANCELLATION_REQUESTED")) return "CANCELLED";
  if (
    codes.includes("PREFLIGHT_APPROVAL_MISSING") ||
    codes.includes("PREFLIGHT_APPROVAL_REVOKED") ||
    codes.includes("PREFLIGHT_APPROVAL_SCOPE_MISSING") ||
    codes.includes("PREFLIGHT_APPROVAL_BINDING_MISMATCH")
  ) {
    return "WAITING_FOR_APPROVAL";
  }
  if (codes.includes("PREFLIGHT_CONNECTION_MISSING") || codes.includes("PREFLIGHT_CONNECTION_NOT_READY")) return "WAITING_FOR_CONNECTION";
  if (codes.includes("PREFLIGHT_CREDENTIAL_MISSING") || codes.includes("PREFLIGHT_CREDENTIAL_NOT_ACTIVE") || codes.includes("PREFLIGHT_CREDENTIAL_EXPIRED")) return "WAITING_FOR_CREDENTIAL";
  if (codes.length > 0) return "BLOCKED";
  return "READY";
}

export function buildRuntimePreflightResult(
  input: BuildRuntimePreflightInput,
): BuildRuntimePreflightResult {
  try {
    if (hasSecret(input)) {
      return invalidPreflight([preflightFailure("PREFLIGHT_SECRET_DETECTED", "runtimePreflight")]);
    }
    const evaluatedAt = normalizeIso(input.evaluatedAt);
    if (!evaluatedAt) {
      return invalidPreflight([preflightFailure("PREFLIGHT_SNAPSHOT_INVALID", "evaluatedAt")]);
    }
    const failures: RuntimePreflightFailure[] = [];
    if (!sha256Pattern.test(input.runtimeExecutionRequest.integrityChecksum)) {
      failures.push(preflightFailure("PREFLIGHT_REQUEST_INVALID", "runtimeExecutionRequest.integrityChecksum"));
    }
    const requestIntegrity = integrityFailure(
      input.runtimeExecutionRequest.integrityChecksum,
      hash(input.runtimeExecutionRequest.deterministicCore),
      "runtimeExecutionRequest.integrityChecksum",
    );
    if (requestIntegrity) failures.push(requestIntegrity);
    if (input.runtimeExecutionRequest.expirationPolicy.mode === "EXPLICIT_TIME" && isExpired(input.runtimeExecutionRequest.expirationPolicy.expiresAt, evaluatedAt)) {
      failures.push(preflightFailure("PREFLIGHT_REQUEST_EXPIRED", "runtimeExecutionRequest.expirationPolicy"));
    }
    const approval = input.approvalStatusSnapshot;
    if (approval.status !== "APPROVED") failures.push(preflightFailure(approval.status === "REVOKED" ? "PREFLIGHT_APPROVAL_REVOKED" : approval.status === "EXPIRED" ? "PREFLIGHT_APPROVAL_EXPIRED" : "PREFLIGHT_APPROVAL_MISSING", "approvalStatusSnapshot"));
    if (!approval.scopes.includes("RUNTIME_EXECUTION")) failures.push(preflightFailure("PREFLIGHT_APPROVAL_SCOPE_MISSING", "approvalStatusSnapshot.scopes"));
    if (
      approval.runtimeExecutionRequestBinding.runtimeExecutionRequestId !== input.runtimeExecutionRequest.runtimeExecutionRequestId ||
      approval.runtimeExecutionRequestBinding.integrityChecksum !== input.runtimeExecutionRequest.integrityChecksum ||
      stableSerializeAgentPackage(approval.packageBinding) !== stableSerializeAgentPackage(input.runtimeExecutionRequest.packageBinding) ||
      stableSerializeAgentPackage(approval.evidenceBinding) !== stableSerializeAgentPackage(input.runtimeExecutionRequest.evidenceBinding)
    ) {
      failures.push(preflightFailure("PREFLIGHT_APPROVAL_BINDING_MISMATCH", "approvalStatusSnapshot"));
    }
    if (isExpired(approval.expiresAt, evaluatedAt) || approval.revokedAt) {
      failures.push(preflightFailure(approval.revokedAt ? "PREFLIGHT_APPROVAL_REVOKED" : "PREFLIGHT_APPROVAL_EXPIRED", "approvalStatusSnapshot"));
    }
    const approvalChecksumFailure = checksumFailure(approval.checksum, "approvalStatusSnapshot.checksum");
    if (approvalChecksumFailure) failures.push(approvalChecksumFailure);

    const connectionSnapshots = input.connectionReadinessSnapshots ?? [];
    const credentialSnapshots = input.credentialReadinessSnapshots ?? [];
    const capabilitySnapshots = input.capabilityReadinessSnapshots ?? [];
    const providerSnapshots = input.providerReadinessSnapshots ?? [];
    const mcpSnapshots = input.mcpReadinessSnapshots ?? [];

    failures.push(
      ...duplicateFailures(
        connectionSnapshots.map((item) => ({
          id: item.connectionReferenceId,
          checksum: item.checksum,
        })),
        "connectionReadinessSnapshots",
      ),
      ...duplicateFailures(
        credentialSnapshots.map((item) => ({
          id: item.credentialReferenceId,
          checksum: item.checksum,
        })),
        "credentialReadinessSnapshots",
      ),
      ...duplicateFailures(
        capabilitySnapshots.map((item) => ({
          id: item.capabilityReferenceId,
          checksum: item.checksum,
        })),
        "capabilityReadinessSnapshots",
      ),
      ...duplicateFailures(
        providerSnapshots.map((item) => ({
          id: item.providerReference,
          checksum: item.checksum,
        })),
        "providerReadinessSnapshots",
      ),
      ...duplicateFailures(
        mcpSnapshots.map((item) => ({
          id: item.mcpToolSnapshotReference,
          checksum: item.checksum,
        })),
        "mcpReadinessSnapshots",
      ),
    );

    for (const item of connectionSnapshots) {
      const checksum = checksumFailure(item.checksum, `connection.${item.connectionReferenceId}.checksum`);
      if (checksum) failures.push(checksum);
      if (item.status !== "CONNECTED" || isExpired(item.expiresAt, evaluatedAt)) {
        failures.push(preflightFailure("PREFLIGHT_CONNECTION_NOT_READY", "connectionReadinessSnapshots", item.connectionReferenceId));
      }
    }
    for (const item of credentialSnapshots) {
      const checksum = checksumFailure(item.checksum, `credential.${item.credentialReferenceId}.checksum`);
      if (checksum) failures.push(checksum);
      if (item.status === "EXPIRED" || isExpired(item.expiresAt, evaluatedAt)) {
        failures.push(preflightFailure("PREFLIGHT_CREDENTIAL_EXPIRED", "credentialReadinessSnapshots", item.credentialReferenceId));
      } else if (item.status !== "ACTIVE") {
        failures.push(preflightFailure("PREFLIGHT_CREDENTIAL_NOT_ACTIVE", "credentialReadinessSnapshots", item.credentialReferenceId));
      }
    }
    for (const item of capabilitySnapshots) {
      const checksum = checksumFailure(item.checksum, `capability.${item.capabilityReferenceId}.checksum`);
      if (checksum) failures.push(checksum);
      if (
        item.status !== "AVAILABLE" ||
        !item.supportedByBlock ||
        !item.supportedByTool ||
        !item.grantedByConnection ||
        !item.permittedByPolicy ||
        !item.coveredByApproval
      ) {
        failures.push(preflightFailure("PREFLIGHT_CAPABILITY_UNAVAILABLE", "capabilityReadinessSnapshots", item.capabilityReferenceId));
      }
    }
    for (const item of providerSnapshots) {
      const checksum = checksumFailure(item.checksum, `provider.${item.providerReference}.checksum`);
      if (checksum) failures.push(checksum);
      if (item.status !== "READY" || isExpired(item.expiresAt, evaluatedAt)) {
        failures.push(preflightFailure("PREFLIGHT_PROVIDER_NOT_READY", "providerReadinessSnapshots", item.providerReference));
      }
    }
    for (const item of mcpSnapshots) {
      const checksum = checksumFailure(item.checksum, `mcp.${item.mcpToolSnapshotReference}.checksum`);
      if (checksum) failures.push(checksum);
      if (item.status === "TOOL_DEFINITION_CHANGED") {
        failures.push(preflightFailure("PREFLIGHT_MCP_TOOL_DEFINITION_CHANGED", "mcpReadinessSnapshots", item.mcpToolSnapshotReference));
      } else if (item.status !== "READY" || isExpired(item.expiresAt, evaluatedAt)) {
        failures.push(preflightFailure("PREFLIGHT_MCP_NOT_READY", "mcpReadinessSnapshots", item.mcpToolSnapshotReference));
      }
      if (!sha256Pattern.test(item.toolDefinitionChecksum)) {
        failures.push(preflightFailure("PREFLIGHT_MCP_TOOL_DEFINITION_CHANGED", "mcpReadinessSnapshots.toolDefinitionChecksum", item.mcpToolSnapshotReference));
      }
    }
    if (input.runtimeExecutionRequest.runtimePolicyReference) {
      if (!input.runtimePolicySnapshot) {
        failures.push(preflightFailure("PREFLIGHT_RUNTIME_POLICY_INACTIVE", "runtimePolicySnapshot"));
      } else {
        const checksum = checksumFailure(input.runtimePolicySnapshot.checksum, "runtimePolicySnapshot.checksum");
        if (checksum) failures.push(checksum);
        if (
          input.runtimePolicySnapshot.status !== "ACTIVE" ||
          input.runtimePolicySnapshot.runtimePolicyReference.referenceId !== input.runtimeExecutionRequest.runtimePolicyReference.referenceId
        ) {
          failures.push(preflightFailure("PREFLIGHT_RUNTIME_POLICY_INACTIVE", "runtimePolicySnapshot"));
        }
        if (
          input.runtimePolicySnapshot.allowedExecutionModes &&
          !input.runtimePolicySnapshot.allowedExecutionModes.includes(input.runtimeExecutionRequest.requestedExecutionMode)
        ) {
          failures.push(preflightFailure("PREFLIGHT_EXECUTION_MODE_DENIED", "runtimePolicySnapshot.allowedExecutionModes"));
        }
      }
    }
    if (input.cancellationSnapshot.status !== "NONE") {
      failures.push(preflightFailure("PREFLIGHT_CANCELLATION_REQUESTED", "cancellationSnapshot"));
    }
    if (input.cancellationSnapshot.runtimeExecutionRequestId !== input.runtimeExecutionRequest.runtimeExecutionRequestId) {
      failures.push(preflightFailure("PREFLIGHT_REQUEST_INVALID", "cancellationSnapshot.runtimeExecutionRequestId"));
    }
    if (input.idempotencySnapshot.status !== "AVAILABLE") {
      failures.push(preflightFailure(input.idempotencySnapshot.status === "CONFLICT" ? "PREFLIGHT_IDEMPOTENCY_CONFLICT" : "PREFLIGHT_DUPLICATE_EXECUTION", "idempotencySnapshot"));
    }
    if (input.idempotencySnapshot.runtimeExecutionRequestId !== input.runtimeExecutionRequest.runtimeExecutionRequestId) {
      failures.push(preflightFailure("PREFLIGHT_REQUEST_INVALID", "idempotencySnapshot.runtimeExecutionRequestId"));
    }

    if (failures.some((item) => item.code === "PREFLIGHT_SNAPSHOT_INVALID" || item.code === "PREFLIGHT_REQUEST_INVALID")) {
      return invalidPreflight(failures);
    }
    const safeFailureCodes = [...new Set(failures.map((item) => item.code))].sort();
    const preflightStatus = statusFromFailures(safeFailureCodes);
    const deterministicCore: RuntimePreflightDeterministicCore = {
      formatVersion: RUNTIME_PREFLIGHT_RESULT_FORMAT_VERSION,
      runtimeExecutionRequestReference: {
        runtimeExecutionRequestId: input.runtimeExecutionRequest.runtimeExecutionRequestId,
        integrityChecksum: input.runtimeExecutionRequest.integrityChecksum,
      },
      evaluatedAt,
      preflightStatus,
      approvalReadiness: safeFailureCodes.some((item) => item.startsWith("PREFLIGHT_APPROVAL")) ? "NOT_READY" : "READY",
      connectionReadinessSummary: summary(connectionSnapshots.map((item) => ({ id: item.connectionReferenceId, status: item.status, checksum: item.checksum, ready: item.status === "CONNECTED" && !isExpired(item.expiresAt, evaluatedAt), blocked: item.status !== "CONNECTED" || isExpired(item.expiresAt, evaluatedAt) }))),
      credentialReadinessSummary: summary(credentialSnapshots.map((item) => ({ id: item.credentialReferenceId, status: item.status, checksum: item.checksum, ready: item.status === "ACTIVE" && !isExpired(item.expiresAt, evaluatedAt), blocked: item.status !== "ACTIVE" || isExpired(item.expiresAt, evaluatedAt) }))),
      capabilityReadinessSummary: summary(capabilitySnapshots.map((item) => ({ id: item.capabilityReferenceId, status: item.status, checksum: item.checksum, ready: item.status === "AVAILABLE", blocked: item.status !== "AVAILABLE" }))),
      providerReadinessSummary: summary(providerSnapshots.map((item) => ({ id: item.providerReference, status: item.status, checksum: item.checksum, ready: item.status === "READY" && !isExpired(item.expiresAt, evaluatedAt), blocked: item.status !== "READY" || isExpired(item.expiresAt, evaluatedAt) }))),
      mcpReadinessSummary: summary(mcpSnapshots.map((item) => ({ id: item.mcpToolSnapshotReference, status: item.status, checksum: item.checksum, ready: item.status === "READY" && !isExpired(item.expiresAt, evaluatedAt), blocked: item.status !== "READY" || isExpired(item.expiresAt, evaluatedAt) }))),
      runtimePolicyReadiness: safeFailureCodes.includes("PREFLIGHT_RUNTIME_POLICY_INACTIVE") || safeFailureCodes.includes("PREFLIGHT_EXECUTION_MODE_DENIED") ? "NOT_READY" : "READY",
      cancellationReadiness: input.cancellationSnapshot.status === "NONE" ? "READY" : "NOT_READY",
      idempotencyReadiness: input.idempotencySnapshot.status === "AVAILABLE" ? "READY" : "NOT_READY",
      safeFailureCodes,
      limitationCodes: [...defaultPreflightLimitations].sort(),
    };
    const runtimePreflightResultId = hash({
      request: deterministicCore.runtimeExecutionRequestReference,
      evaluatedAt,
      snapshots: {
        approval,
        connections: connectionSnapshots,
        credentials: credentialSnapshots,
        capabilities: capabilitySnapshots,
        providers: providerSnapshots,
        mcp: mcpSnapshots,
        policy: input.runtimePolicySnapshot ?? null,
        cancellation: input.cancellationSnapshot,
        idempotency: input.idempotencySnapshot,
      },
      status: preflightStatus,
      failures: safeFailureCodes,
    });
    return {
      status: "VALID",
      value: {
        ...deterministicCore,
        runtimePreflightResultId,
        integrityChecksum: hash(deterministicCore),
      },
      failures: [],
    };
  } catch {
    return invalidPreflight([preflightFailure("PREFLIGHT_INTERNAL_ERROR", "runtimePreflight", "INTERNAL_ERROR")]);
  }
}

export function buildRuntimeExecutionStart(
  input: BuildRuntimeExecutionStartInput,
): BuildRuntimeExecutionStartResult {
  try {
    if (hasSecret(input)) {
      return invalidStart([startFailure("RUNTIME_START_SECRET_DETECTED", "runtimeExecutionStart")]);
    }
    const startedAt = normalizeIso(input.startedAt);
    if (!startedAt) {
      return invalidStart([startFailure("RUNTIME_START_TIMESTAMP_INVALID", "startedAt")]);
    }
    const failures: RuntimeExecutionStartFailure[] = [];
    if (input.runtimePreflightResult.preflightStatus !== "READY") {
      failures.push(startFailure("RUNTIME_START_PREFLIGHT_NOT_READY", "runtimePreflightResult.preflightStatus"));
    }
    if (input.runtimePreflightResult.runtimeExecutionRequestReference.runtimeExecutionRequestId !== input.runtimeExecutionRequest.runtimeExecutionRequestId || input.runtimePreflightResult.runtimeExecutionRequestReference.integrityChecksum !== input.runtimeExecutionRequest.integrityChecksum) {
      failures.push(startFailure("RUNTIME_START_REQUEST_BINDING_MISMATCH", "runtimePreflightResult.runtimeExecutionRequestReference"));
    }
    if (!sha256Pattern.test(input.runtimePreflightResult.integrityChecksum)) {
      failures.push(startFailure("RUNTIME_START_PREFLIGHT_INVALID", "runtimePreflightResult.integrityChecksum"));
    }
    const requestIntegrity = requestIntegrityFailure(
      input.runtimeExecutionRequest.integrityChecksum,
      hash(input.runtimeExecutionRequest.deterministicCore),
      "runtimeExecutionRequest.integrityChecksum",
    );
    if (requestIntegrity) failures.push(requestIntegrity);
    const preflightIntegrity = preflightIntegrityFailure(
      input.runtimePreflightResult.integrityChecksum,
      hash({
        formatVersion: input.runtimePreflightResult.formatVersion,
        runtimeExecutionRequestReference:
          input.runtimePreflightResult.runtimeExecutionRequestReference,
        evaluatedAt: input.runtimePreflightResult.evaluatedAt,
        preflightStatus: input.runtimePreflightResult.preflightStatus,
        approvalReadiness: input.runtimePreflightResult.approvalReadiness,
        connectionReadinessSummary:
          input.runtimePreflightResult.connectionReadinessSummary,
        credentialReadinessSummary:
          input.runtimePreflightResult.credentialReadinessSummary,
        capabilityReadinessSummary:
          input.runtimePreflightResult.capabilityReadinessSummary,
        providerReadinessSummary: input.runtimePreflightResult.providerReadinessSummary,
        mcpReadinessSummary: input.runtimePreflightResult.mcpReadinessSummary,
        runtimePolicyReadiness: input.runtimePreflightResult.runtimePolicyReadiness,
        cancellationReadiness: input.runtimePreflightResult.cancellationReadiness,
        idempotencyReadiness: input.runtimePreflightResult.idempotencyReadiness,
        safeFailureCodes: input.runtimePreflightResult.safeFailureCodes,
        limitationCodes: input.runtimePreflightResult.limitationCodes,
      }),
      "runtimePreflightResult.integrityChecksum",
    );
    if (preflightIntegrity) failures.push(preflightIntegrity);
    if (input.runtimeExecutionRequest.expirationPolicy.mode === "EXPLICIT_TIME" && isExpired(input.runtimeExecutionRequest.expirationPolicy.expiresAt, startedAt)) {
      failures.push(startFailure("RUNTIME_START_EXPIRED", "runtimeExecutionRequest.expirationPolicy"));
    }
    if (!input.executionSequence.trim()) {
      failures.push(startFailure("RUNTIME_START_INTENT_INVALID", "executionSequence"));
    }
    if (!input.initiatedByActorReference.actorId.trim()) {
      failures.push(startFailure("RUNTIME_START_INTENT_INVALID", "initiatedByActorReference.actorId"));
    }
    if (!["INITIAL", "RETRY", "MANUAL_RERUN"].includes(input.executionIntent)) {
      failures.push(startFailure("RUNTIME_START_INTENT_INVALID", "executionIntent"));
    }
    if (input.executionIntent === "INITIAL" && input.previousRuntimeExecutionReference) {
      failures.push(startFailure("RUNTIME_START_PREVIOUS_EXECUTION_FORBIDDEN", "previousRuntimeExecutionReference"));
    }
    if (input.executionIntent === "RETRY" && !input.previousRuntimeExecutionReference?.trim()) {
      failures.push(startFailure("RUNTIME_START_PREVIOUS_EXECUTION_REQUIRED", "previousRuntimeExecutionReference"));
    }
    if (failures.length > 0) return invalidStart(failures);
    const runtimeExecutionId = hash({
      requestId: input.runtimeExecutionRequest.runtimeExecutionRequestId,
      preflightId: input.runtimePreflightResult.runtimePreflightResultId,
      startedAt,
      executionIntent: input.executionIntent,
      executionSequence: input.executionSequence.trim(),
      previousRuntimeExecutionReference: input.previousRuntimeExecutionReference?.trim() ?? null,
    });
    const deterministicCore: RuntimeExecutionStartDeterministicCore = {
      formatVersion: RUNTIME_EXECUTION_START_FORMAT_VERSION,
      runtimeExecutionId,
      runtimeExecutionRequestReference: {
        runtimeExecutionRequestId: input.runtimeExecutionRequest.runtimeExecutionRequestId,
        integrityChecksum: input.runtimeExecutionRequest.integrityChecksum,
      },
      runtimePreflightResultReference: {
        runtimePreflightResultId: input.runtimePreflightResult.runtimePreflightResultId,
        integrityChecksum: input.runtimePreflightResult.integrityChecksum,
      },
      executionIntent: input.executionIntent,
      executionSequence: input.executionSequence.trim(),
      ...(input.previousRuntimeExecutionReference?.trim()
        ? { previousRuntimeExecutionReference: input.previousRuntimeExecutionReference.trim() }
        : {}),
      initiatedByActorReference: {
        actorType: input.initiatedByActorReference.actorType,
        actorId: input.initiatedByActorReference.actorId.trim(),
        ...(input.initiatedByActorReference.roleReference?.trim()
          ? { roleReference: input.initiatedByActorReference.roleReference.trim() }
          : {}),
        ...(input.initiatedByActorReference.organizationReference?.trim()
          ? { organizationReference: input.initiatedByActorReference.organizationReference.trim() }
          : {}),
      },
      startedAt,
      initialRuntimeStatus: "READY",
      approvalBinding: input.runtimeExecutionRequest.approvalBinding,
      packageBinding: input.runtimeExecutionRequest.packageBinding,
      evidenceBinding: input.runtimeExecutionRequest.evidenceBinding,
      ...(input.runtimeExecutionRequest.runtimePolicyReference
        ? { runtimePolicyReference: input.runtimeExecutionRequest.runtimePolicyReference }
        : {}),
      limitationCodes: input.runtimePreflightResult.limitationCodes,
    };
    return {
      status: "VALID",
      value: {
        ...deterministicCore,
        runtimeExecutionStartId: hash({
          runtimeExecutionId,
          request: deterministicCore.runtimeExecutionRequestReference,
          preflight: deterministicCore.runtimePreflightResultReference,
          startedAt,
        }),
        integrityChecksum: hash(deterministicCore),
      },
      failures: [],
    };
  } catch {
    return invalidStart([startFailure("RUNTIME_START_INTERNAL_ERROR", "runtimeExecutionStart", "INTERNAL_ERROR")]);
  }
}
