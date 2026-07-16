import { describe, expect, it } from "vitest";
import { generateAgentDefinition } from "./generator";
import {
  aiInquiryV1AgentBlueprint,
  type AgentBlueprint,
  type DeliveryMode,
  type InterfaceMode,
} from "./types";

describe("agent definition generator", () => {
  it("generates a valid definition from the ai-inquiry-v1 blueprint", () => {
    const output = generateAgentDefinition({
      projectId: "d10bcbd6-b588-4c36-87ee-7881538e0218",
      goal: "문의 내용을 분류하고 답변 초안을 만드는 AI를 만들어줘.",
      blueprint: aiInquiryV1AgentBlueprint,
      selectedDeliveryMode: "CHAT",
      selectedInterfaceModes: ["WEB_CHAT"],
    });

    expect(output.warnings).toEqual([]);
    expect(output.definition).toMatchObject({
      id: "agent.d10bcbd6-b588-4c36-87ee-7881538e0218",
      blueprintId: "ai-inquiry-v1",
      blueprintVersion: "1.0.0",
      validationStatus: "VALID",
      deliveryMode: "CHAT",
      interfaceModes: ["WEB_CHAT"],
      providerReferences: ["openai", "supabase", "github", "vercel"],
    });
    expect(output.definition.blocks).toBe(aiInquiryV1AgentBlueprint.blocks);
  });

  it("marks a definition invalid when delivery mode is not allowed", () => {
    const output = generateAgentDefinition({
      projectId: "project-1",
      goal: "AI 문의 Agent",
      blueprint: aiInquiryV1AgentBlueprint,
      selectedDeliveryMode: "HEADLESS",
      selectedInterfaceModes: ["WEB_CHAT"],
    });

    expect(output.definition.validationStatus).toBe("INVALID");
    expect(output.warnings).toContain("AGENT_DELIVERY_MODE_NOT_ALLOWED");
    expect(output.warnings).toContain("AGENT_DEFINITION_INVALID");
  });

  it("marks a definition invalid when an interface mode is not allowed", () => {
    const output = generateAgentDefinition({
      projectId: "project-1",
      goal: "AI 문의 Agent",
      blueprint: aiInquiryV1AgentBlueprint,
      selectedDeliveryMode: "CHAT",
      selectedInterfaceModes: ["SCHEDULE"],
    });

    expect(output.definition.validationStatus).toBe("INVALID");
    expect(output.warnings).toContain("AGENT_INTERFACE_MODE_NOT_ALLOWED");
    expect(output.warnings).toContain("AGENT_DEFINITION_INVALID");
  });

  it("returns blueprint and definition warnings for invalid blueprint input", () => {
    const invalidBlueprint: AgentBlueprint = {
      ...aiInquiryV1AgentBlueprint,
      version: "draft",
      blocks: [
        aiInquiryV1AgentBlueprint.blocks[0],
        aiInquiryV1AgentBlueprint.blocks[0],
      ],
    };
    const output = generateAgentDefinition({
      projectId: "project-1",
      goal: "AI 문의 Agent",
      blueprint: invalidBlueprint,
      selectedDeliveryMode: "CHAT",
      selectedInterfaceModes: ["WEB_CHAT"],
    });

    expect(output.definition.validationStatus).toBe("INVALID");
    expect(output.warnings).toContain("AGENT_BLUEPRINT_INVALID");
    expect(output.warnings).toContain("AGENT_DEFINITION_INVALID");
  });

  it("does not include execution or external-call behavior", () => {
    const source = JSON.stringify(
      generateAgentDefinition({
        projectId: "project-1",
        goal: "AI 문의 Agent",
        blueprint: aiInquiryV1AgentBlueprint,
        selectedDeliveryMode: "CHAT",
        selectedInterfaceModes: ["WEB_CHAT"],
      }),
    );

    expect(source).not.toContain("fetch");
    expect(source).not.toContain("execute");
    expect(source).not.toContain("invoke");
  });

  it("preserves typed input boundaries for delivery and interface modes", () => {
    const deliveryMode: DeliveryMode = "BUSINESS";
    const interfaceModes: InterfaceMode[] = ["API"];
    const output = generateAgentDefinition({
      projectId: "project-1",
      goal: "AI 문의 Agent",
      blueprint: aiInquiryV1AgentBlueprint,
      selectedDeliveryMode: deliveryMode,
      selectedInterfaceModes: interfaceModes,
    });

    expect(output.definition.deliveryMode).toBe("BUSINESS");
    expect(output.definition.interfaceModes).toEqual(["API"]);
    expect(output.definition.validationStatus).toBe("VALID");
  });
});
