export const mcpServerTransports = ["stdio", "http", "sse"] as const;
export type McpServerTransport = (typeof mcpServerTransports)[number];

export const mcpTrustStatuses = [
  "UNREVIEWED",
  "TRUSTED",
  "DEPRECATED",
  "BLOCKED",
] as const;
export type McpTrustStatus = (typeof mcpTrustStatuses)[number];

export const mcpHealthStatuses = [
  "UNKNOWN",
  "HEALTHY",
  "DEGRADED",
  "UNAVAILABLE",
] as const;
export type McpHealthStatus = (typeof mcpHealthStatuses)[number];

export const mcpRiskClasses = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type McpRiskClass = (typeof mcpRiskClasses)[number];

export const mcpPermissionKinds = [
  "READ",
  "WRITE",
  "EXECUTE",
  "DELETE",
  "PUBLIC_CHANGE",
  "COST_INCURRING",
] as const;
export type McpPermissionKind = (typeof mcpPermissionKinds)[number];

export const mcpApprovalRequirements = [
  "NONE",
  "USER_APPROVAL",
  "HIGH_RISK_APPROVAL",
  "REAUTHORIZATION_REQUIRED",
] as const;
export type McpApprovalRequirement =
  (typeof mcpApprovalRequirements)[number];

export const mcpIdempotencyModes = [
  "REQUIRED",
  "OPTIONAL",
  "NOT_SUPPORTED",
  "RETRY_BLOCKED",
] as const;
export type McpIdempotencyMode = (typeof mcpIdempotencyModes)[number];

export type McpSchemaReference = {
  id: string;
  version: string;
};

export type McpCompatibilityContract = {
  minBuildFlowVersion: string;
  minAgentContractVersion: string;
  supportedRegions: string[];
};

export type McpHealthPolicy = {
  status: McpHealthStatus;
  checkedAt?: string;
  expiresAt?: string;
};

export type McpCredentialReferenceContract = {
  credentialKind: string;
  requiredScopes: string[];
  referenceOnly: true;
};

export type McpPermissionPolicy = {
  permissions: McpPermissionKind[];
  riskClass: McpRiskClass;
  approvalRequirement: McpApprovalRequirement;
  externalWrite: boolean;
  costImpact: "NONE" | "LOW" | "VARIABLE";
};

export type McpTimeoutPolicy = {
  timeoutMs: number;
};

export type McpRetryPolicy = {
  maxAttempts: number;
  retryableErrorCodes: string[];
};

export type McpIdempotencyPolicy = {
  mode: McpIdempotencyMode;
  idempotencyKeyRequired: boolean;
};

export type McpRateLimitPolicy = {
  maxRequestsPerMinute: number;
};

export type McpSafeResultPolicy = {
  storeRawResult: false;
  maxOutputBytes: number;
  redactedFields: string[];
  evidenceFields: string[];
};

export type McpVerificationEvidenceContract = {
  required: boolean;
  evidenceKind: "DISCOVERY" | "HEALTH" | "SCHEMA" | "TOOL_DRY_RUN";
  safeFields: string[];
};

export type McpToolDefinition = {
  serverId: string;
  name: string;
  version: string;
  displayName: string;
  capabilities: string[];
  inputSchema: McpSchemaReference;
  outputSchema: McpSchemaReference;
  credential: McpCredentialReferenceContract;
  permissionPolicy: McpPermissionPolicy;
  timeoutPolicy: McpTimeoutPolicy;
  retryPolicy: McpRetryPolicy;
  idempotencyPolicy: McpIdempotencyPolicy;
  rateLimitPolicy: McpRateLimitPolicy;
  safeResultPolicy: McpSafeResultPolicy;
  verification: McpVerificationEvidenceContract;
  allowlisted: boolean;
};

export type McpServerDefinition = {
  id: string;
  version: string;
  displayName: string;
  publisher: string;
  transport: McpServerTransport;
  trustStatus: McpTrustStatus;
  health: McpHealthPolicy;
  compatibility: McpCompatibilityContract;
  tools: McpToolDefinition[];
};

export type McpDiscoverySnapshot = {
  id: string;
  serverId: string;
  serverVersion: string;
  discoveredAt: string;
  expiresAt: string;
  tools: McpToolDefinition[];
  sanitized: true;
};

export type BpsMcpDependencyMapping = {
  packageId: string;
  requiredServerIds: string[];
  requiredToolCapabilities: string[];
  optionalServerIds: string[];
};

export const sampleMcpServerDefinition: McpServerDefinition = {
  id: "gmail.mcp",
  version: "1.0.0",
  displayName: "Gmail MCP",
  publisher: "BuildFlow Test Registry",
  transport: "http",
  trustStatus: "TRUSTED",
  health: {
    status: "HEALTHY",
    checkedAt: "2026-07-17T00:00:00.000Z",
    expiresAt: "2026-07-18T00:00:00.000Z",
  },
  compatibility: {
    minBuildFlowVersion: "0.1.0",
    minAgentContractVersion: "1.0.0",
    supportedRegions: ["global"],
  },
  tools: [
    {
      serverId: "gmail.mcp",
      name: "gmail.read-message",
      version: "1.0.0",
      displayName: "Read Gmail message",
      capabilities: ["EMAIL_READ"],
      inputSchema: { id: "gmail-message-query", version: "1.0.0" },
      outputSchema: { id: "gmail-message-safe-result", version: "1.0.0" },
      credential: {
        credentialKind: "oauth",
        requiredScopes: ["gmail.readonly"],
        referenceOnly: true,
      },
      permissionPolicy: {
        permissions: ["READ"],
        riskClass: "LOW",
        approvalRequirement: "USER_APPROVAL",
        externalWrite: false,
        costImpact: "NONE",
      },
      timeoutPolicy: { timeoutMs: 10_000 },
      retryPolicy: { maxAttempts: 2, retryableErrorCodes: ["RATE_LIMIT"] },
      idempotencyPolicy: {
        mode: "OPTIONAL",
        idempotencyKeyRequired: false,
      },
      rateLimitPolicy: { maxRequestsPerMinute: 60 },
      safeResultPolicy: {
        storeRawResult: false,
        maxOutputBytes: 16_384,
        redactedFields: ["headers.authorization", "body"],
        evidenceFields: ["messageId", "receivedAt"],
      },
      verification: {
        required: true,
        evidenceKind: "SCHEMA",
        safeFields: ["toolName", "schemaVersion"],
      },
      allowlisted: true,
    },
  ],
};
