import { describe, expect, it } from "vitest";
import { sampleMcpServerDefinition, type McpToolDefinition } from "../mcp";
import {
  resolveAgentToolRequirements,
  type AgentCapabilityRequirement,
  type McpToolCandidate,
} from "./tool-resolution";

const baseTool = sampleMcpServerDefinition.tools[0];

function toolWith(
  overrides: Partial<McpToolDefinition>,
): McpToolDefinition {
  return {
    ...baseTool,
    ...overrides,
    permissionPolicy: {
      ...baseTool.permissionPolicy,
      ...overrides.permissionPolicy,
    },
  };
}

const emailRequirement: AgentCapabilityRequirement = {
  id: "requirement.email-read",
  capability: "EMAIL_READ",
  required: true,
};

describe("agent tool resolution planner", () => {
  it("resolves a requirement when an allowlisted tool has credentials and no approval is required", () => {
    const candidate: McpToolCandidate = {
      id: "candidate.gmail-read",
      credentialAvailable: true,
      tool: toolWith({
        permissionPolicy: {
          ...baseTool.permissionPolicy,
          approvalRequirement: "NONE",
        },
      }),
    };

    const plan = resolveAgentToolRequirements({
      requirements: [emailRequirement],
      candidates: [candidate],
    });

    expect(plan.summary).toEqual({
      total: 1,
      resolved: 1,
      unsupported: 0,
      userActionRequired: 0,
      approvalRequired: 0,
      ready: true,
    });
    expect(plan.resolutions[0]).toMatchObject({
      status: "RESOLVED",
      reason: "MATCHED",
      selectedTool: {
        candidateId: "candidate.gmail-read",
        serverId: "gmail.mcp",
        toolName: "gmail.read-message",
      },
    });
  });

  it("returns unsupported when no tool candidate matches the capability", () => {
    const plan = resolveAgentToolRequirements({
      requirements: [
        {
          id: "requirement.calendar-read",
          capability: "CALENDAR_READ",
          required: true,
        },
      ],
      candidates: [
        {
          id: "candidate.gmail-read",
          credentialAvailable: true,
          tool: baseTool,
        },
      ],
    });

    expect(plan.resolutions[0]).toMatchObject({
      status: "UNSUPPORTED",
      reason: "NO_COMPATIBLE_TOOL",
    });
    expect(plan.unresolvedDependencies).toEqual([
      {
        requirementId: "requirement.calendar-read",
        capability: "CALENDAR_READ",
        required: true,
        status: "UNSUPPORTED",
        reason: "NO_COMPATIBLE_TOOL",
      },
    ]);
    expect(plan.summary.ready).toBe(false);
  });

  it("returns user action required when the matching tool has no available credential", () => {
    const plan = resolveAgentToolRequirements({
      requirements: [emailRequirement],
      candidates: [
        {
          id: "candidate.gmail-read",
          credentialAvailable: false,
          tool: baseTool,
        },
      ],
    });

    expect(plan.resolutions[0]).toMatchObject({
      status: "USER_ACTION_REQUIRED",
      reason: "CREDENTIAL_REQUIRED",
    });
    expect(plan.summary.userActionRequired).toBe(1);
    expect(plan.summary.ready).toBe(false);
  });

  it("returns approval required when the matching tool contract requires approval", () => {
    const plan = resolveAgentToolRequirements({
      requirements: [emailRequirement],
      candidates: [
        {
          id: "candidate.gmail-read",
          credentialAvailable: true,
          tool: baseTool,
        },
      ],
    });

    expect(plan.resolutions[0]).toMatchObject({
      status: "APPROVAL_REQUIRED",
      reason: "APPROVAL_REQUIRED",
    });
    expect(plan.summary.approvalRequired).toBe(1);
    expect(plan.summary.ready).toBe(false);
  });

  it("rejects non-allowlisted matching tools without falling through to credentials", () => {
    const plan = resolveAgentToolRequirements({
      requirements: [emailRequirement],
      candidates: [
        {
          id: "candidate.untrusted",
          credentialAvailable: true,
          tool: toolWith({ allowlisted: false }),
        },
      ],
    });

    expect(plan.resolutions[0]).toMatchObject({
      status: "UNSUPPORTED",
      reason: "TOOL_NOT_ALLOWLISTED",
    });
  });

  it("does not execute tools, read credentials, or touch runtime paths", () => {
    const serialized = JSON.stringify(
      resolveAgentToolRequirements({
        requirements: [emailRequirement],
        candidates: [
          {
            id: "candidate.gmail-read",
            credentialAvailable: true,
            tool: baseTool,
          },
        ],
      }),
    );

    expect(serialized).not.toContain("execute");
    expect(serialized).not.toContain("invoke");
    expect(serialized).not.toContain("vault");
    expect(serialized).not.toContain("provider");
    expect(serialized).not.toContain("runtime");
  });
});
