import {
  aiInquiryV1AgentBlueprint,
  type AgentBlueprint,
  type AgentCapability,
  type AgentProviderReference,
  type DeliveryMode,
  type InterfaceMode,
} from "./types";

export type SupportedApplicationBlueprintId = "ai-inquiry-v1";
export type KnownApplicationBlueprintId =
  | SupportedApplicationBlueprintId
  | "general-crud-v1";

export type AgentCompatibilityMapping = {
  applicationBlueprintId: SupportedApplicationBlueprintId;
  agentBlueprintId: AgentBlueprint["id"];
  agentBlueprintVersion: AgentBlueprint["version"];
  requiredProviders: AgentProviderReference[];
  expectedCapabilities: AgentCapability[];
  deliveryModes: DeliveryMode[];
  interfaceModes: InterfaceMode[];
  verification: {
    profile: "AI_INQUIRY";
    expectedTables: string[];
    requiredEvidence: Array<"HEALTH_CHECK" | "AI_RESPONSE" | "DB_WRITE">;
  };
};

export type AgentCompatibilityResult =
  | {
      supported: true;
      mapping: AgentCompatibilityMapping;
    }
  | {
      supported: false;
      reason: "APPLICATION_BLUEPRINT_NOT_AGENT" | "APPLICATION_BLUEPRINT_UNKNOWN";
    };

export const aiInquiryV1Compatibility: AgentCompatibilityMapping = {
  applicationBlueprintId: "ai-inquiry-v1",
  agentBlueprintId: aiInquiryV1AgentBlueprint.id,
  agentBlueprintVersion: aiInquiryV1AgentBlueprint.version,
  requiredProviders: aiInquiryV1AgentBlueprint.requiredProviders,
  expectedCapabilities: aiInquiryV1AgentBlueprint.capabilities,
  deliveryModes: aiInquiryV1AgentBlueprint.deliveryModes,
  interfaceModes: aiInquiryV1AgentBlueprint.interfaceModes,
  verification: {
    profile: "AI_INQUIRY",
    expectedTables: ["buildflow_inquiries"],
    requiredEvidence: ["HEALTH_CHECK", "AI_RESPONSE", "DB_WRITE"],
  },
};

export function mapApplicationBlueprintToAgent(
  applicationBlueprintId: KnownApplicationBlueprintId | string,
): AgentCompatibilityResult {
  if (applicationBlueprintId === "ai-inquiry-v1") {
    return { supported: true, mapping: aiInquiryV1Compatibility };
  }
  if (applicationBlueprintId === "general-crud-v1") {
    return { supported: false, reason: "APPLICATION_BLUEPRINT_NOT_AGENT" };
  }
  return { supported: false, reason: "APPLICATION_BLUEPRINT_UNKNOWN" };
}
