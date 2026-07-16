import type {
  AgentDefinitionGeneratorInput,
  AgentDefinitionGeneratorOutput,
  DeliveryMode,
  InterfaceMode,
} from "./types";
import {
  definitionFromBlueprint,
  validateAgentBlueprint,
  validateAgentDefinition,
} from "./validator";

export type AgentDefinitionGeneratorWarning =
  | "AGENT_BLUEPRINT_INVALID"
  | "AGENT_DELIVERY_MODE_NOT_ALLOWED"
  | "AGENT_INTERFACE_MODE_NOT_ALLOWED"
  | "AGENT_DEFINITION_INVALID";

function includesDeliveryMode(
  values: readonly DeliveryMode[],
  value: DeliveryMode,
) {
  return values.includes(value);
}

function includesInterfaceMode(
  values: readonly InterfaceMode[],
  value: InterfaceMode,
) {
  return values.includes(value);
}

export function generateAgentDefinition(
  input: AgentDefinitionGeneratorInput,
): AgentDefinitionGeneratorOutput {
  const warnings: AgentDefinitionGeneratorWarning[] = [];
  const blueprintResult = validateAgentBlueprint(input.blueprint);
  if (!blueprintResult.valid) warnings.push("AGENT_BLUEPRINT_INVALID");

  if (
    !includesDeliveryMode(
      input.blueprint.deliveryModes,
      input.selectedDeliveryMode,
    )
  ) {
    warnings.push("AGENT_DELIVERY_MODE_NOT_ALLOWED");
  }

  if (
    input.selectedInterfaceModes.some(
      (mode) => !includesInterfaceMode(input.blueprint.interfaceModes, mode),
    )
  ) {
    warnings.push("AGENT_INTERFACE_MODE_NOT_ALLOWED");
  }

  const definition = definitionFromBlueprint({
    projectId: input.projectId,
    name: input.blueprint.displayName,
    blueprint: input.blueprint,
    deliveryMode: input.selectedDeliveryMode,
    interfaceModes: input.selectedInterfaceModes,
  });
  const definitionResult = validateAgentDefinition(definition, input.blueprint);
  if (!definitionResult.valid) warnings.push("AGENT_DEFINITION_INVALID");

  return {
    definition: {
      ...definition,
      validationStatus:
        warnings.length === 0 && definitionResult.valid ? "VALID" : "INVALID",
    },
    warnings: [...new Set(warnings)],
  };
}
