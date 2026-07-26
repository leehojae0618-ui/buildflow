import { describe, expect, it } from "vitest";
import {
  sampleMcpServerDefinition,
  type McpDiscoverySnapshot,
  type McpServerDefinition,
  type McpToolDefinition,
} from "./types";
import {
  validateMcpDiscoverySnapshot,
  createMcpInvocationFailureContract,
  projectMcpToolReadiness,
  validateMcpServerDefinition,
  validateMcpToolDefinition,
} from "./validator";

const sampleTool = sampleMcpServerDefinition.tools[0];

describe("MCP foundation contract validator", () => {
  it("accepts a safe MCP server registry contract", () => {
    expect(validateMcpServerDefinition(sampleMcpServerDefinition)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("accepts a safe MCP tool definition without runtime invocation", () => {
    expect(validateMcpToolDefinition(sampleTool)).toEqual({
      valid: true,
      errors: [],
    });
    expect(JSON.stringify(sampleTool)).not.toContain("secret");
    expect(JSON.stringify(sampleTool)).not.toContain("invoke");
    expect(JSON.stringify(sampleTool)).not.toContain("execute");
  });

  it("rejects raw result storage", () => {
    const tool: McpToolDefinition = {
      ...sampleTool,
      safeResultPolicy: {
        ...sampleTool.safeResultPolicy,
        storeRawResult: true as false,
      },
    };
    expect(validateMcpToolDefinition(tool).errors).toContain(
      "MCP_SAFE_RESULT_INVALID",
    );
  });

  it("requires approval for writes, destructive actions, and cost impact", () => {
    const tool: McpToolDefinition = {
      ...sampleTool,
      permissionPolicy: {
        permissions: ["WRITE", "DELETE", "COST_INCURRING"],
        riskClass: "HIGH",
        approvalRequirement: "NONE",
        externalWrite: true,
        costImpact: "VARIABLE",
      },
    };
    expect(validateMcpToolDefinition(tool).errors).toContain(
      "MCP_RISK_POLICY_INVALID",
    );
  });

  it("rejects credential contracts that are not reference-only", () => {
    const tool: McpToolDefinition = {
      ...sampleTool,
      credential: {
        credentialKind: "oauth",
        requiredScopes: ["gmail.readonly"],
        referenceOnly: false as true,
      },
    };
    expect(validateMcpToolDefinition(tool).errors).toContain(
      "MCP_CREDENTIAL_REFERENCE_INVALID",
    );
  });

  it("rejects duplicate tool names and server mismatches", () => {
    const server: McpServerDefinition = {
      ...sampleMcpServerDefinition,
      tools: [
        sampleTool,
        {
          ...sampleTool,
          serverId: "other.server",
        },
      ],
    };
    const result = validateMcpServerDefinition(server);
    expect(result.errors).toContain("MCP_TOOL_DUPLICATE");
    expect(result.errors).toContain("MCP_TOOL_SERVER_MISMATCH");
  });

  it("accepts sanitized discovery snapshots", () => {
    const snapshot: McpDiscoverySnapshot = {
      id: "gmail.discovery",
      serverId: sampleMcpServerDefinition.id,
      serverVersion: sampleMcpServerDefinition.version,
      discoveredAt: "2026-07-17T00:00:00.000Z",
      expiresAt: "2026-07-18T00:00:00.000Z",
      tools: sampleMcpServerDefinition.tools,
      sanitized: true,
    };
    expect(
      validateMcpDiscoverySnapshot(snapshot, sampleMcpServerDefinition),
    ).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("rejects discovery snapshots that are not sanitized", () => {
    const snapshot: McpDiscoverySnapshot = {
      id: "gmail.discovery",
      serverId: sampleMcpServerDefinition.id,
      serverVersion: sampleMcpServerDefinition.version,
      discoveredAt: "2026-07-17T00:00:00.000Z",
      expiresAt: "2026-07-18T00:00:00.000Z",
      tools: sampleMcpServerDefinition.tools,
      sanitized: false as true,
    };
    expect(
      validateMcpDiscoverySnapshot(snapshot, sampleMcpServerDefinition).errors,
    ).toContain("MCP_DISCOVERY_SNAPSHOT_INVALID");
  });

  it("projects an unavailable server as non-callable", () => {
    const server: McpServerDefinition = {
      ...sampleMcpServerDefinition,
      health: { ...sampleMcpServerDefinition.health, status: "UNAVAILABLE" },
    };
    expect(projectMcpToolReadiness(server, sampleTool.name)).toMatchObject({
      callable: false,
      code: "MCP_SERVER_UNAVAILABLE",
    });
  });

  it("maps an unknown tool to a safe tool-not-found projection", () => {
    expect(
      projectMcpToolReadiness(sampleMcpServerDefinition, "gmail.unknown"),
    ).toMatchObject({ callable: false, code: "MCP_TOOL_NOT_FOUND" });
  });

  it("represents timeout and transport failures without raw error data", () => {
    expect(createMcpInvocationFailureContract("MCP_TIMEOUT")).toEqual({
      status: "FAILED",
      code: "MCP_TIMEOUT",
    });
    expect(createMcpInvocationFailureContract("MCP_TRANSPORT_FAILED")).toEqual({
      status: "FAILED",
      code: "MCP_TRANSPORT_FAILED",
    });
  });

  it("accepts retry-blocked tools only when no retry is configured", () => {
    const tool: McpToolDefinition = {
      ...sampleTool,
      idempotencyPolicy: { mode: "RETRY_BLOCKED", idempotencyKeyRequired: false },
      retryPolicy: { maxAttempts: 0, retryableErrorCodes: [] },
    };
    expect(validateMcpToolDefinition(tool)).toEqual({ valid: true, errors: [] });
  });

  it("rejects retry-blocked tools that allow retry", () => {
    const tool: McpToolDefinition = {
      ...sampleTool,
      idempotencyPolicy: { mode: "RETRY_BLOCKED", idempotencyKeyRequired: false },
      retryPolicy: { maxAttempts: 1, retryableErrorCodes: ["RATE_LIMIT"] },
    };
    expect(validateMcpToolDefinition(tool).errors).toContain(
      "MCP_RETRY_IDEMPOTENCY_CONFLICT",
    );
  });

  it("rejects other no-retry modes that allow retry", () => {
    const tool: McpToolDefinition = {
      ...sampleTool,
      idempotencyPolicy: { mode: "NOT_SUPPORTED", idempotencyKeyRequired: false },
      retryPolicy: { maxAttempts: 1, retryableErrorCodes: ["RATE_LIMIT"] },
    };
    expect(validateMcpToolDefinition(tool).errors).toContain(
      "MCP_RETRY_IDEMPOTENCY_CONFLICT",
    );
  });

  it("accepts a retry-permitted idempotent tool within bounds", () => {
    const tool: McpToolDefinition = {
      ...sampleTool,
      idempotencyPolicy: { mode: "REQUIRED", idempotencyKeyRequired: true },
      retryPolicy: { maxAttempts: 2, retryableErrorCodes: ["RATE_LIMIT"] },
    };
    expect(validateMcpToolDefinition(tool)).toEqual({ valid: true, errors: [] });
  });

  it("requires a non-empty redaction policy", () => {
    const tool: McpToolDefinition = {
      ...sampleTool,
      safeResultPolicy: { ...sampleTool.safeResultPolicy, redactedFields: [] },
    };
    expect(validateMcpToolDefinition(tool).errors).toContain(
      "MCP_SAFE_RESULT_REDACTION_REQUIRED",
    );
  });

  it("requires non-empty, unique, safe evidence fields", () => {
    const empty: McpToolDefinition = {
      ...sampleTool,
      safeResultPolicy: { ...sampleTool.safeResultPolicy, evidenceFields: [] },
    };
    const duplicate: McpToolDefinition = {
      ...sampleTool,
      safeResultPolicy: {
        ...sampleTool.safeResultPolicy,
        evidenceFields: ["messageId", "messageId"],
      },
    };
    const sensitive: McpToolDefinition = {
      ...sampleTool,
      safeResultPolicy: {
        ...sampleTool.safeResultPolicy,
        evidenceFields: ["rawPayload"],
      },
    };
    expect(validateMcpToolDefinition(empty).errors).toContain(
      "MCP_SAFE_RESULT_EVIDENCE_REQUIRED",
    );
    expect(validateMcpToolDefinition(duplicate).errors).toContain(
      "MCP_SAFE_RESULT_FIELDS_DUPLICATE",
    );
    expect(validateMcpToolDefinition(sensitive).errors).toContain(
      "MCP_SAFE_RESULT_EVIDENCE_FIELD_UNSAFE",
    );
  });

  it("keeps the contract isolated from runtime and provider paths", () => {
    const serialized = JSON.stringify(sampleMcpServerDefinition);
    expect(serialized).not.toContain("supabase");
    expect(serialized).not.toContain("vercel");
    expect(serialized).not.toContain("github");
    expect(serialized).not.toContain("vault");
  });
});
