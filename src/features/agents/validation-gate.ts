import type { McpToolDefinition } from "../mcp";
import type { AgentBlueprint, AgentDefinition } from "./types";
import type {
  AgentToolResolutionPlan,
  ToolResolutionStatus,
} from "./tool-resolution";
import { validateAgentDefinition } from "./validator";

export const agentValidationGateStatuses = ["VALID", "BLOCKED"] as const;
export type AgentValidationGateStatus =
  (typeof agentValidationGateStatuses)[number];

export type AgentValidationBlockingReason =
  | "AGENT_DEFINITION_INVALID"
  | "REQUIRED_CAPABILITY_MISSING"
  | "TOOL_RESOLUTION_SUMMARY_INVALID"
  | "REQUIRED_TOOL_UNSUPPORTED"
  | "USER_ACTION_REQUIRED"
  | "APPROVAL_REQUIRED"
  | "SELECTED_TOOL_CONTRACT_MISSING"
  | "SELECTED_TOOL_NOT_ALLOWLISTED"
  | "SELECTED_TOOL_RAW_RESULT_UNSAFE"
  | "SELECTED_TOOL_APPROVAL_MISMATCH";

export type AgentValidationGateInput = {
  definition: AgentDefinition;
  blueprint: AgentBlueprint;
  toolResolutionPlan: AgentToolResolutionPlan;
  mcpTools: McpToolDefinition[];
};

export type AgentValidationGateResult = {
  status: AgentValidationGateStatus;
  ready: boolean;
  blockingReasons: AgentValidationBlockingReason[];
  safeDetails: Array<{
    reason: AgentValidationBlockingReason;
    requirementId?: string;
    capability?: string;
    toolName?: string;
  }>;
};

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function findMcpTool(
  resolution: AgentToolResolutionPlan["resolutions"][number],
  mcpTools: McpToolDefinition[],
) {
  if (!resolution.selectedTool) return undefined;
  return mcpTools.find(
    (tool) =>
      tool.serverId === resolution.selectedTool?.serverId &&
      tool.name === resolution.selectedTool.toolName &&
      tool.version === resolution.selectedTool.toolVersion,
  );
}

function countStatus(
  resolutions: AgentToolResolutionPlan["resolutions"],
  status: ToolResolutionStatus,
) {
  return resolutions.filter((resolution) => resolution.status === status)
    .length;
}

function validateSummary(
  plan: AgentToolResolutionPlan,
): AgentValidationBlockingReason[] {
  const expected = {
    total: plan.resolutions.length,
    resolved: countStatus(plan.resolutions, "RESOLVED"),
    unsupported: countStatus(plan.resolutions, "UNSUPPORTED"),
    userActionRequired: countStatus(plan.resolutions, "USER_ACTION_REQUIRED"),
    approvalRequired: countStatus(plan.resolutions, "APPROVAL_REQUIRED"),
    ready: plan.resolutions.every(
      (resolution) => resolution.status === "RESOLVED" || !resolution.required,
    ),
  };

  const valid =
    plan.summary.total === expected.total &&
    plan.summary.resolved === expected.resolved &&
    plan.summary.unsupported === expected.unsupported &&
    plan.summary.userActionRequired === expected.userActionRequired &&
    plan.summary.approvalRequired === expected.approvalRequired &&
    plan.summary.ready === expected.ready;

  return valid ? [] : ["TOOL_RESOLUTION_SUMMARY_INVALID"];
}

function hasRiskRequiringApproval(tool: McpToolDefinition) {
  return (
    tool.permissionPolicy.riskClass === "HIGH" ||
    tool.permissionPolicy.riskClass === "CRITICAL" ||
    tool.permissionPolicy.externalWrite ||
    tool.permissionPolicy.costImpact !== "NONE" ||
    tool.permissionPolicy.permissions.some((permission) =>
      ["WRITE", "DELETE", "PUBLIC_CHANGE", "COST_INCURRING"].includes(
        permission,
      ),
    )
  );
}

export function validateAgentReadiness(
  input: AgentValidationGateInput,
): AgentValidationGateResult {
  const safeDetails: AgentValidationGateResult["safeDetails"] = [];

  const definitionResult = validateAgentDefinition(
    input.definition,
    input.blueprint,
  );
  if (!definitionResult.valid) {
    safeDetails.push({ reason: "AGENT_DEFINITION_INVALID" });
  }

  for (const capability of input.blueprint.capabilities) {
    if (!input.definition.capabilities.includes(capability)) {
      safeDetails.push({
        reason: "REQUIRED_CAPABILITY_MISSING",
        capability,
      });
    }
  }

  for (const reason of validateSummary(input.toolResolutionPlan)) {
    safeDetails.push({ reason });
  }

  for (const resolution of input.toolResolutionPlan.resolutions) {
    if (resolution.required && resolution.status === "UNSUPPORTED") {
      safeDetails.push({
        reason: "REQUIRED_TOOL_UNSUPPORTED",
        requirementId: resolution.requirementId,
        capability: resolution.capability,
      });
    }
    if (resolution.required && resolution.status === "USER_ACTION_REQUIRED") {
      safeDetails.push({
        reason: "USER_ACTION_REQUIRED",
        requirementId: resolution.requirementId,
        capability: resolution.capability,
      });
    }
    if (resolution.required && resolution.status === "APPROVAL_REQUIRED") {
      safeDetails.push({
        reason: "APPROVAL_REQUIRED",
        requirementId: resolution.requirementId,
        capability: resolution.capability,
      });
    }

    if (!resolution.selectedTool) continue;
    const tool = findMcpTool(resolution, input.mcpTools);
    if (!tool) {
      safeDetails.push({
        reason: "SELECTED_TOOL_CONTRACT_MISSING",
        requirementId: resolution.requirementId,
        capability: resolution.capability,
        toolName: resolution.selectedTool.toolName,
      });
      continue;
    }
    if (!tool.allowlisted) {
      safeDetails.push({
        reason: "SELECTED_TOOL_NOT_ALLOWLISTED",
        requirementId: resolution.requirementId,
        capability: resolution.capability,
        toolName: tool.name,
      });
    }
    if (tool.safeResultPolicy.storeRawResult) {
      safeDetails.push({
        reason: "SELECTED_TOOL_RAW_RESULT_UNSAFE",
        requirementId: resolution.requirementId,
        capability: resolution.capability,
        toolName: tool.name,
      });
    }
    if (
      resolution.status === "RESOLVED" &&
      (tool.permissionPolicy.approvalRequirement !== "NONE" ||
        hasRiskRequiringApproval(tool))
    ) {
      safeDetails.push({
        reason: "SELECTED_TOOL_APPROVAL_MISMATCH",
        requirementId: resolution.requirementId,
        capability: resolution.capability,
        toolName: tool.name,
      });
    }
  }

  const blockingReasons = unique(safeDetails.map((detail) => detail.reason));
  return {
    status: blockingReasons.length === 0 ? "VALID" : "BLOCKED",
    ready: blockingReasons.length === 0,
    blockingReasons,
    safeDetails,
  };
}
