import { describe, expect, it } from "vitest";
import { sampleMcpServerDefinition, type McpToolDefinition } from "../mcp";
import { resolveAgentToolRequirements } from "./tool-resolution";
import { aiInquiryV1AgentBlueprint } from "./types";
import { definitionFromBlueprint } from "./validator";
import { validateAgentReadiness } from "./validation-gate";
import {
  createAgentPackageProfile,
  validateAgentPackageReadiness,
  type AgentPackageProfile,
} from "./package-profile";

const baseTool = sampleMcpServerDefinition.tools[0];

function toolWith(overrides: Partial<McpToolDefinition>): McpToolDefinition {
  return {
    ...baseTool,
    ...overrides,
    credential: {
      ...baseTool.credential,
      ...overrides.credential,
    },
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

function validInput(tool = toolWith({
  permissionPolicy: {
    ...baseTool.permissionPolicy,
    approvalRequirement: "NONE",
  },
})) {
  const definition = definitionFromBlueprint({
    projectId: "agent-package-project",
    name: "AI Inquiry Agent",
    blueprint: aiInquiryV1AgentBlueprint,
    deliveryMode: "CHAT",
    interfaceModes: ["WEB_CHAT"],
  });
  const toolResolutionPlan = resolveAgentToolRequirements({
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
        credentialAvailable: true,
        tool,
      },
    ],
  });
  const validationGate = validateAgentReadiness({
    definition,
    blueprint: aiInquiryV1AgentBlueprint,
    toolResolutionPlan,
    mcpTools: [tool],
  });

  return {
    packageId: "pkg.ai-inquiry-agent",
    packageVersion: "1.0.0",
    buildflowVersion: "0.1.0",
    definition,
    toolResolutionPlan,
    validationGate,
    mcpTools: [tool],
  };
}

describe("agent package profile", () => {
  it("creates a BPS AI Agent profile from validated agent contracts", () => {
    const input = validInput();
    const profile = createAgentPackageProfile(input);

    expect(profile).toMatchObject({
      packageId: "pkg.ai-inquiry-agent",
      packageVersion: "1.0.0",
      buildflowVersion: "0.1.0",
      format: "BPS_AI_AGENT_PROFILE",
      agent: {
        blueprintId: "ai-inquiry-v1",
        deliveryMode: "CHAT",
        interfaceModes: ["WEB_CHAT"],
      },
      exportSafety: {
        secretFree: true,
        rawProviderResponsesIncluded: false,
        liveCredentialValuesIncluded: false,
        archiveWritten: false,
        marketplacePublished: false,
      },
    });
    expect(profile.dependencies.providers).toContainEqual({
      provider: "openai",
      required: true,
    });
    expect(profile.dependencies.mcp).toEqual([
      {
        serverId: "gmail.mcp",
        toolName: "gmail.read-message",
        toolVersion: "1.0.0",
        capabilities: ["EMAIL_READ"],
        required: true,
      },
    ]);
    expect(profile.credentials).toEqual([
      {
        id: "gmail.mcp:gmail.read-message:credential",
        provider: "gmail.mcp",
        required: true,
        referenceOnly: true,
        scopes: ["gmail.readonly"],
      },
    ]);
  });

  it("marks a complete and secret-free package profile as export ready", () => {
    const input = validInput();
    const profile = createAgentPackageProfile(input);

    expect(
      validateAgentPackageReadiness(profile, {
        toolResolutionPlan: input.toolResolutionPlan,
        validationGate: input.validationGate,
        mcpTools: input.mcpTools,
      }),
    ).toEqual({
      status: "READY",
      exportReady: true,
      issues: [],
      safeDetails: [],
    });
  });

  it("blocks export when agent validation is not ready", () => {
    const input = validInput();
    const profile = createAgentPackageProfile(input);

    const result = validateAgentPackageReadiness(profile, {
      toolResolutionPlan: input.toolResolutionPlan,
      validationGate: {
        status: "BLOCKED",
        ready: false,
        blockingReasons: ["AGENT_DEFINITION_INVALID"],
        safeDetails: [{ reason: "AGENT_DEFINITION_INVALID" }],
      },
      mcpTools: input.mcpTools,
    });

    expect(result.exportReady).toBe(false);
    expect(result.issues).toContain("AGENT_VALIDATION_NOT_READY");
  });

  it("blocks unresolved required dependencies", () => {
    const input = validInput();
    const unresolvedPlan = resolveAgentToolRequirements({
      requirements: [
        {
          id: "requirement.calendar-read",
          capability: "CALENDAR_READ",
          required: true,
        },
      ],
      candidates: [],
    });
    const profile = createAgentPackageProfile({
      ...input,
      toolResolutionPlan: unresolvedPlan,
    });

    const result = validateAgentPackageReadiness(profile, {
      toolResolutionPlan: unresolvedPlan,
      validationGate: input.validationGate,
      mcpTools: input.mcpTools,
    });

    expect(result.issues).toContain("UNRESOLVED_REQUIRED_DEPENDENCY");
    expect(result.safeDetails).toContainEqual({
      issue: "UNRESOLVED_REQUIRED_DEPENDENCY",
      dependencyId: "requirement.calendar-read",
    });
  });

  it("blocks missing MCP contracts and unsafe raw-result policies", () => {
    const unsafeTool = toolWith({
      permissionPolicy: {
        ...baseTool.permissionPolicy,
        approvalRequirement: "NONE",
      },
      safeResultPolicy: {
        ...baseTool.safeResultPolicy,
        storeRawResult: true as false,
      },
    });
    const input = validInput(unsafeTool);
    const profile = createAgentPackageProfile(input);

    expect(
      validateAgentPackageReadiness(profile, {
        toolResolutionPlan: input.toolResolutionPlan,
        validationGate: input.validationGate,
        mcpTools: [],
      }).issues,
    ).toContain("MCP_TOOL_CONTRACT_MISSING");

    expect(
      validateAgentPackageReadiness(profile, {
        toolResolutionPlan: input.toolResolutionPlan,
        validationGate: input.validationGate,
        mcpTools: [unsafeTool],
      }).issues,
    ).toContain("MCP_TOOL_RAW_RESULT_UNSAFE");
  });

  it("blocks profiles that include credential values or unsafe export state", () => {
    const input = validInput();
    const profile = {
      ...createAgentPackageProfile(input),
      packageId: ["sk", "123456789012345678901234567890"].join("-"),
      exportSafety: {
        secretFree: true,
        rawProviderResponsesIncluded: false,
        liveCredentialValuesIncluded: true,
        archiveWritten: true,
        marketplacePublished: false,
      },
    } as unknown as AgentPackageProfile;

    const result = validateAgentPackageReadiness(profile, {
      toolResolutionPlan: input.toolResolutionPlan,
      validationGate: input.validationGate,
      mcpTools: input.mcpTools,
    });

    expect(result.issues).toContain("SECRET_LIKE_VALUE_DETECTED");
    expect(result.issues).toContain("EXPORT_SAFETY_POLICY_INVALID");
  });

  it("does not write archives, publish packages, invoke tools, or access vaults", () => {
    const input = validInput();
    const serialized = JSON.stringify(
      validateAgentPackageReadiness(createAgentPackageProfile(input), {
        toolResolutionPlan: input.toolResolutionPlan,
        validationGate: input.validationGate,
        mcpTools: input.mcpTools,
      }),
    );

    expect(serialized).not.toContain("archive");
    expect(serialized).not.toContain("publish");
    expect(serialized).not.toContain("invoke");
    expect(serialized).not.toContain("vault");
  });
});
