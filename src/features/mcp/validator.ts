import {
  mcpApprovalRequirements,
  mcpHealthStatuses,
  mcpIdempotencyModes,
  mcpPermissionKinds,
  mcpRiskClasses,
  mcpServerTransports,
  mcpTrustStatuses,
  type McpDiscoverySnapshot,
  type McpPermissionPolicy,
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
  | "MCP_IDEMPOTENCY_INVALID"
  | "MCP_RATE_LIMIT_INVALID"
  | "MCP_SAFE_RESULT_INVALID"
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
    tool.rateLimitPolicy.maxRequestsPerMinute < 1 ||
    tool.rateLimitPolicy.maxRequestsPerMinute > 10_000
  ) {
    errors.push("MCP_RATE_LIMIT_INVALID");
  }
  if (
    tool.safeResultPolicy.storeRawResult ||
    tool.safeResultPolicy.maxOutputBytes < 1 ||
    tool.safeResultPolicy.evidenceFields.length === 0
  ) {
    errors.push("MCP_SAFE_RESULT_INVALID");
  }
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
