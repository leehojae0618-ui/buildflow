import {
  agentCapabilities,
  agentBlockKinds,
  deliveryModes,
  interfaceModes,
  type AgentBlock,
  type AgentBlueprint,
  type AgentCapability,
  type AgentDefinition,
  type DeliveryMode,
  type InterfaceMode,
} from "./types";

export type AgentValidationCode =
  | "AGENT_ID_INVALID"
  | "AGENT_VERSION_INVALID"
  | "AGENT_CAPABILITY_UNSUPPORTED"
  | "AGENT_DELIVERY_MODE_UNSUPPORTED"
  | "AGENT_INTERFACE_MODE_UNSUPPORTED"
  | "AGENT_BLOCK_ID_DUPLICATE"
  | "AGENT_BLOCK_KIND_UNSUPPORTED"
  | "AGENT_BLOCK_REQUIRED_FIELD_MISSING"
  | "AGENT_BLUEPRINT_CAPABILITY_MISSING"
  | "AGENT_DEFINITION_BLUEPRINT_MISMATCH"
  | "AGENT_DEFINITION_DELIVERY_NOT_ALLOWED"
  | "AGENT_DEFINITION_INTERFACE_NOT_ALLOWED"
  | "AGENT_DEFINITION_CAPABILITY_NOT_ALLOWED"
  | "AGENT_MCP_REFERENCE_INVALID";

export type AgentValidationResult = {
  valid: boolean;
  errors: AgentValidationCode[];
};

const idPattern = /^[a-z][a-z0-9.-]{2,80}$/;
const versionPattern = /^\d+\.\d+\.\d+$/;

function unique<T>(items: T[]) {
  return new Set(items).size === items.length;
}

function isCapability(value: string): value is AgentCapability {
  return agentCapabilities.includes(value as AgentCapability);
}

function isDeliveryMode(value: string): value is DeliveryMode {
  return deliveryModes.includes(value as DeliveryMode);
}

function isInterfaceMode(value: string): value is InterfaceMode {
  return interfaceModes.includes(value as InterfaceMode);
}

function validateBlock(block: AgentBlock): AgentValidationCode[] {
  const errors: AgentValidationCode[] = [];
  if (!idPattern.test(block.id) || !block.name) {
    errors.push("AGENT_BLOCK_REQUIRED_FIELD_MISSING");
  }
  if (!agentBlockKinds.includes(block.kind)) {
    errors.push("AGENT_BLOCK_KIND_UNSUPPORTED");
  }
  if (block.kind === "MODEL" && (!block.provider || !block.model)) {
    errors.push("AGENT_BLOCK_REQUIRED_FIELD_MISSING");
  }
  if (block.kind === "PROMPT" && !block.promptRef) {
    errors.push("AGENT_BLOCK_REQUIRED_FIELD_MISSING");
  }
  if (block.kind === "TRIGGER" && block.interfaces.some((item) => !isInterfaceMode(item))) {
    errors.push("AGENT_INTERFACE_MODE_UNSUPPORTED");
  }
  if (block.kind === "TOOL") {
    if (!isCapability(block.capability)) {
      errors.push("AGENT_CAPABILITY_UNSUPPORTED");
    }
    if (block.mcp) {
      const invalidReference =
        !idPattern.test(block.mcp.serverId) ||
        !block.mcp.toolCapability ||
        !block.mcp.inputSchema.id ||
        !block.mcp.outputSchema.id ||
        !versionPattern.test(block.mcp.inputSchema.version) ||
        !versionPattern.test(block.mcp.outputSchema.version);
      if (invalidReference) errors.push("AGENT_MCP_REFERENCE_INVALID");
    }
  }
  if (block.kind === "OUTPUT" && (!block.schema.id || !versionPattern.test(block.schema.version))) {
    errors.push("AGENT_BLOCK_REQUIRED_FIELD_MISSING");
  }
  if (
    block.kind === "DELIVERY_SURFACE" &&
    (!isDeliveryMode(block.deliveryMode) ||
      block.interfaces.some((item) => !isInterfaceMode(item)))
  ) {
    errors.push("AGENT_DELIVERY_MODE_UNSUPPORTED");
  }
  return errors;
}

export function validateAgentBlueprint(
  blueprint: AgentBlueprint,
): AgentValidationResult {
  const errors: AgentValidationCode[] = [];
  if (!idPattern.test(blueprint.id)) errors.push("AGENT_ID_INVALID");
  if (!versionPattern.test(blueprint.version)) {
    errors.push("AGENT_VERSION_INVALID");
  }
  if (blueprint.capabilities.some((item) => !isCapability(item))) {
    errors.push("AGENT_CAPABILITY_UNSUPPORTED");
  }
  if (blueprint.deliveryModes.some((item) => !isDeliveryMode(item))) {
    errors.push("AGENT_DELIVERY_MODE_UNSUPPORTED");
  }
  if (blueprint.interfaceModes.some((item) => !isInterfaceMode(item))) {
    errors.push("AGENT_INTERFACE_MODE_UNSUPPORTED");
  }
  if (!unique(blueprint.blocks.map((block) => block.id))) {
    errors.push("AGENT_BLOCK_ID_DUPLICATE");
  }
  for (const block of blueprint.blocks) errors.push(...validateBlock(block));
  const blockCapabilities = new Set(
    blueprint.blocks
      .filter((block): block is Extract<AgentBlock, { kind: "TOOL" }> => block.kind === "TOOL")
      .map((block) => block.capability),
  );
  const outputExists = blueprint.blocks.some((block) => block.kind === "OUTPUT");
  const modelExists = blueprint.blocks.some((block) => block.kind === "MODEL");
  if (
    blueprint.capabilities.includes("TOOL_USE") &&
    !blockCapabilities.has("TOOL_USE")
  ) {
    errors.push("AGENT_BLUEPRINT_CAPABILITY_MISSING");
  }
  if (blueprint.capabilities.includes("AI_RESPONSE") && (!modelExists || !outputExists)) {
    errors.push("AGENT_BLUEPRINT_CAPABILITY_MISSING");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateAgentDefinition(
  definition: AgentDefinition,
  blueprint: AgentBlueprint,
): AgentValidationResult {
  const errors: AgentValidationCode[] = [];
  const blueprintResult = validateAgentBlueprint(blueprint);
  errors.push(...blueprintResult.errors);
  if (
    definition.blueprintId !== blueprint.id ||
    definition.blueprintVersion !== blueprint.version
  ) {
    errors.push("AGENT_DEFINITION_BLUEPRINT_MISMATCH");
  }
  if (!blueprint.deliveryModes.includes(definition.deliveryMode)) {
    errors.push("AGENT_DEFINITION_DELIVERY_NOT_ALLOWED");
  }
  if (
    definition.interfaceModes.some(
      (item) => !blueprint.interfaceModes.includes(item),
    )
  ) {
    errors.push("AGENT_DEFINITION_INTERFACE_NOT_ALLOWED");
  }
  if (
    definition.capabilities.some(
      (item) => !blueprint.capabilities.includes(item),
    )
  ) {
    errors.push("AGENT_DEFINITION_CAPABILITY_NOT_ALLOWED");
  }
  if (!unique(definition.blocks.map((block) => block.id))) {
    errors.push("AGENT_BLOCK_ID_DUPLICATE");
  }
  for (const block of definition.blocks) errors.push(...validateBlock(block));
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function definitionFromBlueprint(
  input: {
    projectId: string;
    name: string;
    blueprint: AgentBlueprint;
    deliveryMode: DeliveryMode;
    interfaceModes: InterfaceMode[];
  },
): AgentDefinition {
  return {
    id: `agent.${input.projectId}`,
    blueprintId: input.blueprint.id,
    blueprintVersion: input.blueprint.version,
    name: input.name,
    capabilities: input.blueprint.capabilities,
    deliveryMode: input.deliveryMode,
    interfaceModes: input.interfaceModes,
    blocks: input.blueprint.blocks,
    providerReferences: input.blueprint.requiredProviders,
    validationStatus: "UNVALIDATED",
  };
}
