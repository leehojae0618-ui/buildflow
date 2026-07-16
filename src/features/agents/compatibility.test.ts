import { describe, expect, it } from "vitest";
import {
  aiInquiryV1Compatibility,
  mapApplicationBlueprintToAgent,
} from "./compatibility";
import { aiInquiryV1AgentBlueprint } from "./types";

describe("agent compatibility mapping", () => {
  it("maps ai-inquiry-v1 to the agent blueprint contract", () => {
    const result = mapApplicationBlueprintToAgent("ai-inquiry-v1");

    expect(result).toEqual({
      supported: true,
      mapping: aiInquiryV1Compatibility,
    });
    expect(result.supported && result.mapping).toMatchObject({
      applicationBlueprintId: "ai-inquiry-v1",
      agentBlueprintId: "ai-inquiry-v1",
      agentBlueprintVersion: "1.0.0",
      requiredProviders: ["openai", "supabase", "github", "vercel"],
      expectedCapabilities: [
        "AI_RESPONSE",
        "INQUIRY_CLASSIFICATION",
        "RESPONSE_DRAFT",
      ],
      deliveryModes: ["CHAT", "BUSINESS"],
      interfaceModes: ["WEB_CHAT", "API"],
      verification: {
        profile: "AI_INQUIRY",
        expectedTables: ["buildflow_inquiries"],
        requiredEvidence: ["HEALTH_CHECK", "AI_RESPONSE", "DB_WRITE"],
      },
    });
  });

  it("keeps the mapping in sync with the ai-inquiry-v1 agent blueprint", () => {
    expect(aiInquiryV1Compatibility.agentBlueprintId).toBe(
      aiInquiryV1AgentBlueprint.id,
    );
    expect(aiInquiryV1Compatibility.agentBlueprintVersion).toBe(
      aiInquiryV1AgentBlueprint.version,
    );
    expect(aiInquiryV1Compatibility.requiredProviders).toBe(
      aiInquiryV1AgentBlueprint.requiredProviders,
    );
    expect(aiInquiryV1Compatibility.expectedCapabilities).toBe(
      aiInquiryV1AgentBlueprint.capabilities,
    );
    expect(aiInquiryV1Compatibility.deliveryModes).toBe(
      aiInquiryV1AgentBlueprint.deliveryModes,
    );
    expect(aiInquiryV1Compatibility.interfaceModes).toBe(
      aiInquiryV1AgentBlueprint.interfaceModes,
    );
  });

  it("does not promote general-crud-v1 to an agent blueprint", () => {
    expect(mapApplicationBlueprintToAgent("general-crud-v1")).toEqual({
      supported: false,
      reason: "APPLICATION_BLUEPRINT_NOT_AGENT",
    });
  });

  it("returns an explicit unsupported result for unknown blueprints", () => {
    expect(mapApplicationBlueprintToAgent("platform-v1")).toEqual({
      supported: false,
      reason: "APPLICATION_BLUEPRINT_UNKNOWN",
    });
  });

  it("contains no runtime execution behavior", () => {
    const source = JSON.stringify(aiInquiryV1Compatibility);
    expect(source).not.toContain("fetch");
    expect(source).not.toContain("execute");
    expect(source).not.toContain("invoke");
    expect(source).not.toContain("provision");
  });
});
