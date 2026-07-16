import { describe, expect, it } from "vitest";
import {
  sampleMcpServerDefinition,
  type McpDiscoverySnapshot,
  type McpServerDefinition,
  type McpToolDefinition,
} from "./types";
import {
  validateMcpDiscoverySnapshot,
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

  it("keeps the contract isolated from runtime and provider paths", () => {
    const serialized = JSON.stringify(sampleMcpServerDefinition);
    expect(serialized).not.toContain("supabase");
    expect(serialized).not.toContain("vercel");
    expect(serialized).not.toContain("github");
    expect(serialized).not.toContain("vault");
  });
});
