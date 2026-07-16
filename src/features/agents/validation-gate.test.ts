import { describe, expect, it } from "vitest";
import { sampleMcpServerDefinition, type McpToolDefinition } from "../mcp";
import { definitionFromBlueprint } from "./validator";
import { aiInquiryV1AgentBlueprint, type AgentDefinition } from "./types";
import {
  resolveAgentToolRequirements,
  type McpToolCandidate,
} from "./tool-resolution";
import { validateAgentReadiness } from "./validation-gate";

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
    safeResultPolicy: {
      ...baseTool.safeResultPolicy,
      ...overrides.safeResultPolicy,
    },
  };
}

function validDefinition(): AgentDefinition {
  return definitionFromBlueprint({
    projectId: "agent-validation-project",
    name: "AI Inquiry Agent",
    blueprint: aiInquiryV1AgentBlueprint,
    deliveryMode: "CHAT",
    interfaceModes: ["WEB_CHAT"],
  });
}

function resolvedCandidate(tool = toolWith({
  permissionPolicy: {
    ...baseTool.permissionPolicy,
    approvalRequirement: "NONE",
  },
})): McpToolCandidate {
  return {
    id: "candidate.gmail-read",
    credentialAvailable: true,
    tool,
  };
}

describe("agent validation gate", () => {
  it("accepts a valid definition and resolved tool resolution plan", () => {
    const candidate = resolvedCandidate();
    const plan = resolveAgentToolRequirements({
      requirements: [
        {
          id: "requirement.email-read",
          capability: "EMAIL_READ",
          required: true,
        },
      ],
      candidates: [candidate],
    });

    expect(
      validateAgentReadiness({
        definition: validDefinition(),
        blueprint: aiInquiryV1AgentBlueprint,
        toolResolutionPlan: plan,
        mcpTools: [candidate.tool],
      }),
    ).toEqual({
      status: "VALID",
      ready: true,
      blockingReasons: [],
      safeDetails: [],
    });
  });

  it("blocks invalid agent definitions", () => {
    const definition = {
      ...validDefinition(),
      blueprintVersion: "0.0.0",
    };
    const plan = resolveAgentToolRequirements({
      requirements: [],
      candidates: [],
    });

    const result = validateAgentReadiness({
      definition,
      blueprint: aiInquiryV1AgentBlueprint,
      toolResolutionPlan: plan,
      mcpTools: [],
    });

    expect(result.ready).toBe(false);
    expect(result.blockingReasons).toContain("AGENT_DEFINITION_INVALID");
  });

  it("blocks missing required capabilities", () => {
    const definition = {
      ...validDefinition(),
      capabilities: ["AI_RESPONSE"] as AgentDefinition["capabilities"],
    };
    const plan = resolveAgentToolRequirements({
      requirements: [],
      candidates: [],
    });

    const result = validateAgentReadiness({
      definition,
      blueprint: aiInquiryV1AgentBlueprint,
      toolResolutionPlan: plan,
      mcpTools: [],
    });

    expect(result.blockingReasons).toContain("REQUIRED_CAPABILITY_MISSING");
    expect(result.safeDetails).toContainEqual({
      reason: "REQUIRED_CAPABILITY_MISSING",
      capability: "INQUIRY_CLASSIFICATION",
    });
  });

  it("blocks unresolved required tool dependencies", () => {
    const plan = resolveAgentToolRequirements({
      requirements: [
        {
          id: "requirement.calendar-read",
          capability: "CALENDAR_READ",
          required: true,
        },
      ],
      candidates: [resolvedCandidate()],
    });

    const result = validateAgentReadiness({
      definition: validDefinition(),
      blueprint: aiInquiryV1AgentBlueprint,
      toolResolutionPlan: plan,
      mcpTools: [baseTool],
    });

    expect(result.blockingReasons).toContain("REQUIRED_TOOL_UNSUPPORTED");
    expect(result.ready).toBe(false);
  });

  it("blocks user-action and approval-required states", () => {
    const plan = resolveAgentToolRequirements({
      requirements: [
        {
          id: "requirement.email-read",
          capability: "EMAIL_READ",
          required: true,
        },
      ],
      candidates: [
        {
          id: "candidate.gmail-read",
          credentialAvailable: false,
          tool: baseTool,
        },
      ],
    });

    const result = validateAgentReadiness({
      definition: validDefinition(),
      blueprint: aiInquiryV1AgentBlueprint,
      toolResolutionPlan: plan,
      mcpTools: [baseTool],
    });

    expect(result.blockingReasons).toContain("USER_ACTION_REQUIRED");
    expect(result.ready).toBe(false);
  });

  it("blocks selected tools with missing contracts or unsafe result policy", () => {
    const unsafeTool = toolWith({
      safeResultPolicy: {
        ...baseTool.safeResultPolicy,
        storeRawResult: true as false,
      },
      permissionPolicy: {
        ...baseTool.permissionPolicy,
        approvalRequirement: "NONE",
      },
    });
    const plan = resolveAgentToolRequirements({
      requirements: [
        {
          id: "requirement.email-read",
          capability: "EMAIL_READ",
          required: true,
        },
      ],
      candidates: [resolvedCandidate(unsafeTool)],
    });

    const result = validateAgentReadiness({
      definition: validDefinition(),
      blueprint: aiInquiryV1AgentBlueprint,
      toolResolutionPlan: plan,
      mcpTools: [unsafeTool],
    });

    expect(result.blockingReasons).toContain(
      "SELECTED_TOOL_RAW_RESULT_UNSAFE",
    );
  });

  it("blocks inconsistent tool resolution summaries", () => {
    const candidate = resolvedCandidate();
    const plan = resolveAgentToolRequirements({
      requirements: [
        {
          id: "requirement.email-read",
          capability: "EMAIL_READ",
          required: true,
        },
      ],
      candidates: [candidate],
    });

    const result = validateAgentReadiness({
      definition: validDefinition(),
      blueprint: aiInquiryV1AgentBlueprint,
      toolResolutionPlan: {
        ...plan,
        summary: { ...plan.summary, resolved: 0 },
      },
      mcpTools: [candidate.tool],
    });

    expect(result.blockingReasons).toContain(
      "TOOL_RESOLUTION_SUMMARY_INVALID",
    );
  });

  it("does not execute tools, read vault data, or persist READY state", () => {
    const candidate = resolvedCandidate();
    const plan = resolveAgentToolRequirements({
      requirements: [
        {
          id: "requirement.email-read",
          capability: "EMAIL_READ",
          required: true,
        },
      ],
      candidates: [candidate],
    });

    const serialized = JSON.stringify(
      validateAgentReadiness({
        definition: validDefinition(),
        blueprint: aiInquiryV1AgentBlueprint,
        toolResolutionPlan: plan,
        mcpTools: [candidate.tool],
      }),
    );

    expect(serialized).not.toContain("execute");
    expect(serialized).not.toContain("invoke");
    expect(serialized).not.toContain("vault");
    expect(serialized).not.toContain("provider");
    expect(serialized).not.toContain("persist");
  });
});
