import type { McpToolDefinition } from "../mcp";
import type { AgentCapability } from "./types";

export const toolResolutionStatuses = [
  "RESOLVED",
  "UNSUPPORTED",
  "USER_ACTION_REQUIRED",
  "APPROVAL_REQUIRED",
] as const;

export type ToolResolutionStatus = (typeof toolResolutionStatuses)[number];

export type AgentCapabilityRequirement = {
  id: string;
  capability: AgentCapability | string;
  required: boolean;
  description?: string;
};

export type McpToolCandidate = {
  id: string;
  tool: McpToolDefinition;
  credentialAvailable: boolean;
};

export type ToolResolutionReason =
  | "MATCHED"
  | "NO_COMPATIBLE_TOOL"
  | "TOOL_NOT_ALLOWLISTED"
  | "CREDENTIAL_REQUIRED"
  | "APPROVAL_REQUIRED";

export type AgentToolResolution = {
  requirementId: string;
  capability: string;
  required: boolean;
  status: ToolResolutionStatus;
  reason: ToolResolutionReason;
  selectedTool?: {
    candidateId: string;
    serverId: string;
    toolName: string;
    toolVersion: string;
    approvalRequirement: McpToolDefinition["permissionPolicy"]["approvalRequirement"];
  };
};

export type UnresolvedDependency = {
  requirementId: string;
  capability: string;
  required: boolean;
  status: Exclude<ToolResolutionStatus, "RESOLVED">;
  reason: ToolResolutionReason;
};

export type AgentToolResolutionInput = {
  requirements: AgentCapabilityRequirement[];
  candidates: McpToolCandidate[];
};

export type AgentToolResolutionPlan = {
  resolutions: AgentToolResolution[];
  unresolvedDependencies: UnresolvedDependency[];
  summary: {
    total: number;
    resolved: number;
    unsupported: number;
    userActionRequired: number;
    approvalRequired: number;
    ready: boolean;
  };
};

function findCompatibleCandidate(
  requirement: AgentCapabilityRequirement,
  candidates: McpToolCandidate[],
) {
  return candidates.find((candidate) =>
    candidate.tool.capabilities.includes(requirement.capability),
  );
}

function toSelectedTool(candidate: McpToolCandidate) {
  return {
    candidateId: candidate.id,
    serverId: candidate.tool.serverId,
    toolName: candidate.tool.name,
    toolVersion: candidate.tool.version,
    approvalRequirement: candidate.tool.permissionPolicy.approvalRequirement,
  };
}

function resolveRequirement(
  requirement: AgentCapabilityRequirement,
  candidates: McpToolCandidate[],
): AgentToolResolution {
  const candidate = findCompatibleCandidate(requirement, candidates);

  if (!candidate) {
    return {
      requirementId: requirement.id,
      capability: requirement.capability,
      required: requirement.required,
      status: "UNSUPPORTED",
      reason: "NO_COMPATIBLE_TOOL",
    };
  }

  if (!candidate.tool.allowlisted) {
    return {
      requirementId: requirement.id,
      capability: requirement.capability,
      required: requirement.required,
      status: "UNSUPPORTED",
      reason: "TOOL_NOT_ALLOWLISTED",
    };
  }

  if (!candidate.credentialAvailable) {
    return {
      requirementId: requirement.id,
      capability: requirement.capability,
      required: requirement.required,
      status: "USER_ACTION_REQUIRED",
      reason: "CREDENTIAL_REQUIRED",
      selectedTool: toSelectedTool(candidate),
    };
  }

  if (candidate.tool.permissionPolicy.approvalRequirement !== "NONE") {
    return {
      requirementId: requirement.id,
      capability: requirement.capability,
      required: requirement.required,
      status: "APPROVAL_REQUIRED",
      reason: "APPROVAL_REQUIRED",
      selectedTool: toSelectedTool(candidate),
    };
  }

  return {
    requirementId: requirement.id,
    capability: requirement.capability,
    required: requirement.required,
    status: "RESOLVED",
    reason: "MATCHED",
    selectedTool: toSelectedTool(candidate),
  };
}

export function resolveAgentToolRequirements(
  input: AgentToolResolutionInput,
): AgentToolResolutionPlan {
  const resolutions = input.requirements.map((requirement) =>
    resolveRequirement(requirement, input.candidates),
  );

  const unresolvedDependencies = resolutions
    .filter(
      (
        resolution,
      ): resolution is AgentToolResolution & {
        status: Exclude<ToolResolutionStatus, "RESOLVED">;
      } => resolution.status !== "RESOLVED",
    )
    .map((resolution) => ({
      requirementId: resolution.requirementId,
      capability: resolution.capability,
      required: resolution.required,
      status: resolution.status,
      reason: resolution.reason,
    }));

  const summary = {
    total: resolutions.length,
    resolved: resolutions.filter((item) => item.status === "RESOLVED").length,
    unsupported: resolutions.filter((item) => item.status === "UNSUPPORTED").length,
    userActionRequired: resolutions.filter(
      (item) => item.status === "USER_ACTION_REQUIRED",
    ).length,
    approvalRequired: resolutions.filter(
      (item) => item.status === "APPROVAL_REQUIRED",
    ).length,
    ready: resolutions.every(
      (item) => item.status === "RESOLVED" || !item.required,
    ),
  };

  return { resolutions, unresolvedDependencies, summary };
}
