export const agentCapabilities = [
  "AI_RESPONSE",
  "INQUIRY_CLASSIFICATION",
  "RESPONSE_DRAFT",
  "CONVERSATION",
  "TOOL_USE",
  "SCHEDULED_AUTOMATION",
  "HUMAN_HANDOFF",
  "EVIDENCE_REPORTING",
] as const;

export type AgentCapability = (typeof agentCapabilities)[number];

export const deliveryModes = ["HEADLESS", "CHAT", "BUSINESS"] as const;
export type DeliveryMode = (typeof deliveryModes)[number];

export const interfaceModes = [
  "API",
  "WEBHOOK",
  "SCHEDULE",
  "WEB_CHAT",
  "MCP_SERVER",
] as const;
export type InterfaceMode = (typeof interfaceModes)[number];

export const agentBlockKinds = [
  "MODEL",
  "PROMPT",
  "TRIGGER",
  "TOOL",
  "MEMORY",
  "KNOWLEDGE",
  "GUARDRAIL",
  "OUTPUT",
  "DELIVERY_SURFACE",
] as const;
export type AgentBlockKind = (typeof agentBlockKinds)[number];

export type AgentProviderReference =
  | "openai"
  | "supabase"
  | "github"
  | "vercel";

export type AgentSchemaReference = {
  id: string;
  version: string;
};

export type AgentMcpReference = {
  serverId: string;
  toolCapability: string;
  permission: "READ" | "WRITE" | "EXECUTE";
  approval: "NONE" | "USER_APPROVAL" | "HIGH_RISK_APPROVAL";
  inputSchema: AgentSchemaReference;
  outputSchema: AgentSchemaReference;
};

export type BaseAgentBlock = {
  id: string;
  kind: AgentBlockKind;
  name: string;
  required: boolean;
  safeMetadata?: Record<string, string | number | boolean | null>;
};

export type AgentBlock =
  | (BaseAgentBlock & {
      kind: "MODEL";
      provider: AgentProviderReference;
      model: string;
    })
  | (BaseAgentBlock & { kind: "PROMPT"; promptRef: string })
  | (BaseAgentBlock & {
      kind: "TRIGGER";
      interfaces: InterfaceMode[];
    })
  | (BaseAgentBlock & {
      kind: "TOOL";
      capability: AgentCapability;
      mcp?: AgentMcpReference;
    })
  | (BaseAgentBlock & { kind: "MEMORY"; store: "NONE" | "SUPABASE" })
  | (BaseAgentBlock & { kind: "KNOWLEDGE"; sourceRefs: string[] })
  | (BaseAgentBlock & {
      kind: "GUARDRAIL";
      rules: Array<"NO_SECRET_EXPOSURE" | "NO_UNAPPROVED_TOOL_EXECUTION">;
    })
  | (BaseAgentBlock & { kind: "OUTPUT"; schema: AgentSchemaReference })
  | (BaseAgentBlock & {
      kind: "DELIVERY_SURFACE";
      deliveryMode: DeliveryMode;
      interfaces: InterfaceMode[];
    });

export type AgentBlueprint = {
  id: string;
  version: string;
  displayName: string;
  capabilities: AgentCapability[];
  deliveryModes: DeliveryMode[];
  interfaceModes: InterfaceMode[];
  blocks: AgentBlock[];
  requiredProviders: AgentProviderReference[];
  compatibility: {
    minBuildFlowVersion: string;
    minRuntimeVersion: string;
  };
};

export type AgentDefinition = {
  id: string;
  blueprintId: string;
  blueprintVersion: string;
  name: string;
  capabilities: AgentCapability[];
  deliveryMode: DeliveryMode;
  interfaceModes: InterfaceMode[];
  blocks: AgentBlock[];
  providerReferences: AgentProviderReference[];
  validationStatus: "UNVALIDATED" | "VALID" | "INVALID";
};

export type AgentDefinitionGeneratorInput = {
  projectId: string;
  goal: string;
  blueprint: AgentBlueprint;
  selectedDeliveryMode: DeliveryMode;
  selectedInterfaceModes: InterfaceMode[];
};

export type AgentDefinitionGeneratorOutput = {
  definition: AgentDefinition;
  warnings: string[];
};

export const aiInquiryV1AgentBlueprint: AgentBlueprint = {
  id: "ai-inquiry-v1",
  version: "1.0.0",
  displayName: "AI Inquiry Agent",
  capabilities: ["AI_RESPONSE", "INQUIRY_CLASSIFICATION", "RESPONSE_DRAFT"],
  deliveryModes: ["CHAT", "BUSINESS"],
  interfaceModes: ["WEB_CHAT", "API"],
  requiredProviders: ["openai", "supabase", "github", "vercel"],
  compatibility: {
    minBuildFlowVersion: "0.1.0",
    minRuntimeVersion: "1.0.0",
  },
  blocks: [
    {
      id: "model.openai",
      kind: "MODEL",
      name: "OpenAI response model",
      required: true,
      provider: "openai",
      model: "gpt-5-mini",
    },
    {
      id: "prompt.inquiry",
      kind: "PROMPT",
      name: "Inquiry classification and draft prompt",
      required: true,
      promptRef: "prompts/ai-inquiry-v1/system",
    },
    {
      id: "trigger.web-chat",
      kind: "TRIGGER",
      name: "Web chat submission",
      required: true,
      interfaces: ["WEB_CHAT", "API"],
    },
    {
      id: "memory.inquiries",
      kind: "MEMORY",
      name: "Inquiry persistence",
      required: true,
      store: "SUPABASE",
    },
    {
      id: "guardrail.secrets",
      kind: "GUARDRAIL",
      name: "Secret and tool execution guardrail",
      required: true,
      rules: ["NO_SECRET_EXPOSURE", "NO_UNAPPROVED_TOOL_EXECUTION"],
    },
    {
      id: "output.response-draft",
      kind: "OUTPUT",
      name: "Response draft output",
      required: true,
      schema: { id: "ai-inquiry-response-draft", version: "1.0.0" },
    },
    {
      id: "delivery.web",
      kind: "DELIVERY_SURFACE",
      name: "Web chat delivery",
      required: true,
      deliveryMode: "CHAT",
      interfaces: ["WEB_CHAT"],
    },
  ],
};
