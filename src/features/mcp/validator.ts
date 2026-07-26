import {
  mcpApprovalRequirements,
  mcpHealthStatuses,
  mcpIdempotencyModes,
  MCP_SAFE_RESULT_MAX_OUTPUT_BYTES,
  mcpPermissionKinds,
  mcpRiskClasses,
  mcpServerTransports,
  mcpTrustStatuses,
  type McpDiscoverySnapshot,
  type McpInvocationFailureContract,
  type McpPermissionPolicy,
  type McpReadinessProjection,
  type McpServerDefinition,
  type McpToolDefinition,
} from "./types";

export type McpValidationCode =
  | "MCP_ID_INVALID"
  | "MCP_VERSION_INVALID"
  | "MCP_TRANSPORT_UNSUPPORTED"
  | "MCP_TRUST_STATUS_UNSUPPORTED"
  | "MCP_HEALTH_STATUS_UNSUPPORTED"
  | "MCP_COMPATIBILITY_INVALID"
  | "MCP_TOOL_SERVER_MISMATCH"
  | "MCP_TOOL_DUPLICATE"
  | "MCP_TOOL_CAPABILITY_MISSING"
  | "MCP_SCHEMA_INVALID"
  | "MCP_CREDENTIAL_REFERENCE_INVALID"
  | "MCP_PERMISSION_UNSUPPORTED"
  | "MCP_RISK_POLICY_INVALID"
  | "MCP_TIMEOUT_INVALID"
  | "MCP_RETRY_INVALID"
  | "MCP_RETRY_IDEMPOTENCY_CONFLICT"
  | "MCP_IDEMPOTENCY_INVALID"
  | "MCP_RATE_LIMIT_INVALID"
  | "MCP_SAFE_RESULT_INVALID"
  | "MCP_SAFE_RESULT_REDACTION_REQUIRED"
  | "MCP_SAFE_RESULT_EVIDENCE_REQUIRED"
  | "MCP_SAFE_RESULT_FIELDS_DUPLICATE"
  | "MCP_SAFE_RESULT_EVIDENCE_FIELD_UNSAFE"
  | "MCP_VERIFICATION_INVALID"
  | "MCP_DISCOVERY_SNAPSHOT_INVALID"
  | "MCP_DISCOVERY_TOOL_MISMATCH";

export type McpValidationResult = {
  valid: boolean;
  errors: McpValidationCode[];
};

const idPattern = /^[a-z][a-z0-9.-]{2,80}$/;
const versionPattern = /^\d+\.\d+\.\d+$/;

function unique<T>(items: T[]) {
  return new Set(items).size === items.length;
}

function uniqueErrors(errors: McpValidationCode[]): McpValidationCode[] {
  return [...new Set(errors)];
}

function isValidId(value: string) {
  return idPattern.test(value);
}

function isValidVersion(value: string) {
  return versionPattern.test(value);
}

function validateSchema(schema: { id: string; version: string }) {
  return isValidId(schema.id) && isValidVersion(schema.version);
}

function validatePermissionPolicy(
  policy: McpPermissionPolicy,
): McpValidationCode[] {
  const errors: McpValidationCode[] = [];
  if (
    policy.permissions.length === 0 ||
    policy.permissions.some((item) => !mcpPermissionKinds.includes(item))
  ) {
    errors.push("MCP_PERMISSION_UNSUPPORTED");
  }
  if (
    !mcpRiskClasses.includes(policy.riskClass) ||
    !mcpApprovalRequirements.includes(policy.approvalRequirement)
  ) {
    errors.push("MCP_RISK_POLICY_INVALID");
  }
  if (
    (policy.externalWrite || policy.permissions.includes("DELETE")) &&
    policy.approvalRequirement === "NONE"
  ) {
    errors.push("MCP_RISK_POLICY_INVALID");
  }
  if (
    policy.costImpact !== "NONE" &&
    policy.approvalRequirement === "NONE"
  ) {
    errors.push("MCP_RISK_POLICY_INVALID");
  }
  return errors;
}

function hasUnsafeSafeFieldName(value: string) {
  const normalized = value.toLowerCase();
  return [
    "secret",
    "password",
    "credential",
    "token",
    "authorization",
    "api_key",
    "apikey",
    "raw",
    "payload",
    "stacktrace",
  ].some((fragment) => normalized.includes(fragment));
}

function hasBlankField(items: string[]) {
  return items.some((item) => item.trim().length === 0);
}

function validateSafeResultPolicy(
  tool: McpToolDefinition,
): McpValidationCode[] {
  const errors: McpValidationCode[] = [];
  const policy = tool.safeResultPolicy;
  if (
    policy.storeRawResult ||
    policy.maxOutputBytes < 1 ||
    policy.maxOutputBytes > MCP_SAFE_RESULT_MAX_OUTPUT_BYTES
  ) {
    errors.push("MCP_SAFE_RESULT_INVALID");
  }
  if (policy.redactedFields.length === 0 || hasBlankField(policy.redactedFields)) {
    errors.push("MCP_SAFE_RESULT_REDACTION_REQUIRED");
  }
  if (policy.evidenceFields.length === 0 || hasBlankField(policy.evidenceFields)) {
    errors.push("MCP_SAFE_RESULT_EVIDENCE_REQUIRED");
  }
  if (!unique(policy.redactedFields) || !unique(policy.evidenceFields)) {
    errors.push("MCP_SAFE_RESULT_FIELDS_DUPLICATE");
  }
  if (policy.evidenceFields.some(hasUnsafeSafeFieldName)) {
    errors.push("MCP_SAFE_RESULT_EVIDENCE_FIELD_UNSAFE");
  }
  return errors;
}

export function validateMcpToolDefinition(
  tool: McpToolDefinition,
): McpValidationResult {
  const errors: McpValidationCode[] = [];
  if (!isValidId(tool.serverId) || !isValidId(tool.name)) {
    errors.push("MCP_ID_INVALID");
  }
  if (!isValidVersion(tool.version)) errors.push("MCP_VERSION_INVALID");
  if (tool.capabilities.length === 0) {
    errors.push("MCP_TOOL_CAPABILITY_MISSING");
  }
  if (!validateSchema(tool.inputSchema) || !validateSchema(tool.outputSchema)) {
    errors.push("MCP_SCHEMA_INVALID");
  }
  if (
    !tool.credential.referenceOnly ||
    !tool.credential.credentialKind ||
    tool.credential.requiredScopes.length === 0
  ) {
    errors.push("MCP_CREDENTIAL_REFERENCE_INVALID");
  }
  errors.push(...validatePermissionPolicy(tool.permissionPolicy));
  if (
    tool.timeoutPolicy.timeoutMs < 1_000 ||
    tool.timeoutPolicy.timeoutMs > 120_000
  ) {
    errors.push("MCP_TIMEOUT_INVALID");
  }
  if (
    tool.retryPolicy.maxAttempts < 0 ||
    tool.retryPolicy.maxAttempts > 5
  ) {
    errors.push("MCP_RETRY_INVALID");
  }
  if (!mcpIdempotencyModes.includes(tool.idempotencyPolicy.mode)) {
    errors.push("MCP_IDEMPOTENCY_INVALID");
  }
  if (
    tool.idempotencyPolicy.mode === "REQUIRED" &&
    !tool.idempotencyPolicy.idempotencyKeyRequired
  ) {
    errors.push("MCP_IDEMPOTENCY_INVALID");
  }
  if (
    (tool.idempotencyPolicy.mode === "RETRY_BLOCKED" ||
      tool.idempotencyPolicy.mode === "NOT_SUPPORTED") &&
    tool.retryPolicy.maxAttempts !== 0
  ) {
    errors.push("MCP_RETRY_IDEMPOTENCY_CONFLICT");
  }
  if (
    tool.rateLimitPolicy.maxRequestsPerMinute < 1 ||
    tool.rateLimitPolicy.maxRequestsPerMinute > 10_000
  ) {
    errors.push("MCP_RATE_LIMIT_INVALID");
  }
  errors.push(...validateSafeResultPolicy(tool));
  if (
    tool.verification.required &&
    tool.verification.safeFields.length === 0
  ) {
    errors.push("MCP_VERIFICATION_INVALID");
  }
  return { valid: errors.length === 0, errors: uniqueErrors(errors) };
}

export function validateMcpServerDefinition(
  server: McpServerDefinition,
): McpValidationResult {
  const errors: McpValidationCode[] = [];
  if (!isValidId(server.id)) errors.push("MCP_ID_INVALID");
  if (!isValidVersion(server.version)) errors.push("MCP_VERSION_INVALID");
  if (!mcpServerTransports.includes(server.transport)) {
    errors.push("MCP_TRANSPORT_UNSUPPORTED");
  }
  if (!mcpTrustStatuses.includes(server.trustStatus)) {
    errors.push("MCP_TRUST_STATUS_UNSUPPORTED");
  }
  if (!mcpHealthStatuses.includes(server.health.status)) {
    errors.push("MCP_HEALTH_STATUS_UNSUPPORTED");
  }
  if (
    !isValidVersion(server.compatibility.minBuildFlowVersion) ||
    !isValidVersion(server.compatibility.minAgentContractVersion) ||
    server.compatibility.supportedRegions.length === 0
  ) {
    errors.push("MCP_COMPATIBILITY_INVALID");
  }
  if (!unique(server.tools.map((tool) => tool.name))) {
    errors.push("MCP_TOOL_DUPLICATE");
  }
  for (const tool of server.tools) {
    if (tool.serverId !== server.id) errors.push("MCP_TOOL_SERVER_MISMATCH");
    errors.push(...validateMcpToolDefinition(tool).errors);
  }
  return { valid: errors.length === 0, errors: uniqueErrors(errors) };
}

export function validateMcpDiscoverySnapshot(
  snapshot: McpDiscoverySnapshot,
  server: McpServerDefinition,
): McpValidationResult {
  const errors: McpValidationCode[] = [];
  if (
    !isValidId(snapshot.id) ||
    snapshot.serverId !== server.id ||
    snapshot.serverVersion !== server.version ||
    !snapshot.sanitized
  ) {
    errors.push("MCP_DISCOVERY_SNAPSHOT_INVALID");
  }
  const serverToolNames = new Set(server.tools.map((tool) => tool.name));
  for (const tool of snapshot.tools) {
    if (tool.serverId !== snapshot.serverId || !serverToolNames.has(tool.name)) {
      errors.push("MCP_DISCOVERY_TOOL_MISMATCH");
    }
    errors.push(...validateMcpToolDefinition(tool).errors);
  }
  return { valid: errors.length === 0, errors: uniqueErrors(errors) };
}

export function projectMcpToolReadiness(
  server: McpServerDefinition,
  toolName: string,
): McpReadinessProjection {
  const base = { serverId: server.id, toolName };
  if (server.health.status === "UNAVAILABLE") {
    return { ...base, callable: false, code: "MCP_SERVER_UNAVAILABLE" };
  }
  if (server.health.status === "DEGRADED") {
    return { ...base, callable: false, code: "MCP_SERVER_DEGRADED" };
  }
  const tool = server.tools.find((candidate) => candidate.name === toolName);
  if (!tool) {
    return { ...base, callable: false, code: "MCP_TOOL_NOT_FOUND" };
  }
  if (
    server.trustStatus !== "TRUSTED" ||
    server.health.status !== "HEALTHY" ||
    !tool.allowlisted ||
    !validateMcpServerDefinition(server).valid
  ) {
    return { ...base, callable: false, code: "MCP_INVOCATION_REJECTED" };
  }
  return { ...base, callable: true, code: "MCP_READY" };
}

export function createMcpInvocationFailureContract(
  code: McpInvocationFailureContract["code"],
): McpInvocationFailureContract {
  return {
    status: "FAILED",
    code,
  };
}
