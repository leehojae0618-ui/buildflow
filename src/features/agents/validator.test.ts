import { describe, expect, it } from "vitest";
import {
  aiInquiryV1AgentBlueprint,
  type AgentBlueprint,
} from "./types";
import {
  definitionFromBlueprint,
  validateAgentBlueprint,
  validateAgentDefinition,
} from "./validator";

describe("agent contract validator", () => {
  it("accepts the ai-inquiry-v1 compatibility mapping", () => {
    expect(validateAgentBlueprint(aiInquiryV1AgentBlueprint)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("creates a definition from a valid blueprint contract", () => {
    const definition = definitionFromBlueprint({
      projectId: "d10bcbd6-b588-4c36-87ee-7881538e0218",
      name: "AI Inquiry Agent",
      blueprint: aiInquiryV1AgentBlueprint,
      deliveryMode: "CHAT",
      interfaceModes: ["WEB_CHAT"],
    });
    expect(
      validateAgentDefinition(definition, aiInquiryV1AgentBlueprint),
    ).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("rejects duplicate block ids", () => {
    const blueprint: AgentBlueprint = {
      ...aiInquiryV1AgentBlueprint,
      blocks: [
        aiInquiryV1AgentBlueprint.blocks[0],
        aiInquiryV1AgentBlueprint.blocks[0],
      ],
    };
    expect(validateAgentBlueprint(blueprint).errors).toContain(
      "AGENT_BLOCK_ID_DUPLICATE",
    );
  });

  it("rejects unsupported delivery or interface choices in definitions", () => {
    const definition = definitionFromBlueprint({
      projectId: "project-1",
      name: "Invalid surface",
      blueprint: aiInquiryV1AgentBlueprint,
      deliveryMode: "HEADLESS",
      interfaceModes: ["SCHEDULE"],
    });
    const result = validateAgentDefinition(
      definition,
      aiInquiryV1AgentBlueprint,
    );
    expect(result.errors).toContain("AGENT_DEFINITION_DELIVERY_NOT_ALLOWED");
    expect(result.errors).toContain("AGENT_DEFINITION_INTERFACE_NOT_ALLOWED");
  });

  it("allows MCP references as contract data without runtime execution", () => {
    const blueprint: AgentBlueprint = {
      ...aiInquiryV1AgentBlueprint,
      capabilities: [...aiInquiryV1AgentBlueprint.capabilities, "TOOL_USE"],
      blocks: [
        ...aiInquiryV1AgentBlueprint.blocks,
        {
          id: "tool.crm-lookup",
          kind: "TOOL",
          name: "CRM lookup",
          required: false,
          capability: "TOOL_USE",
          mcp: {
            serverId: "crm.server",
            toolCapability: "CONTACT_READ",
            permission: "READ",
            approval: "USER_APPROVAL",
            inputSchema: { id: "contact-query", version: "1.0.0" },
            outputSchema: { id: "contact-result", version: "1.0.0" },
          },
        },
      ],
    };
    expect(validateAgentBlueprint(blueprint)).toEqual({
      valid: true,
      errors: [],
    });
    expect(JSON.stringify(blueprint)).not.toContain("execute");
    expect(JSON.stringify(blueprint)).not.toContain("invoke");
  });

  it("rejects invalid MCP reference schemas", () => {
    const blueprint: AgentBlueprint = {
      ...aiInquiryV1AgentBlueprint,
      blocks: [
        ...aiInquiryV1AgentBlueprint.blocks,
        {
          id: "tool.invalid",
          kind: "TOOL",
          name: "Invalid tool",
          required: false,
          capability: "TOOL_USE",
          mcp: {
            serverId: "crm.server",
            toolCapability: "CONTACT_READ",
            permission: "READ",
            approval: "USER_APPROVAL",
            inputSchema: { id: "contact-query", version: "draft" },
            outputSchema: { id: "", version: "1.0.0" },
          },
        },
      ],
    };
    const result = validateAgentBlueprint(blueprint);
    expect(result.errors).toContain("AGENT_MCP_REFERENCE_INVALID");
  });
});
