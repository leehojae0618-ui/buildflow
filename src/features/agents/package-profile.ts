import type { McpToolDefinition } from "../mcp";
import type { AgentToolResolutionPlan } from "./tool-resolution";
import type {
  AgentCapability,
  AgentDefinition,
  AgentProviderReference,
  DeliveryMode,
  InterfaceMode,
} from "./types";
import type { AgentValidationGateResult } from "./validation-gate";

export const agentPackageReadinessStatuses = [
  "READY",
  "BLOCKED",
] as const;
export type AgentPackageReadinessStatus =
  (typeof agentPackageReadinessStatuses)[number];

export type AgentPackageCredentialReference = {
  id: string;
  provider: AgentProviderReference | string;
  required: boolean;
  referenceOnly: true;
  scopes: string[];
};

export type AgentPackageMcpDependency = {
  serverId: string;
  toolName: string;
  toolVersion: string;
  capabilities: string[];
  required: boolean;
};

export type AgentPackagePermissionRequirement = {
  dependencyId: string;
  permissions: string[];
  riskClass: string;
  approvalRequirement: string;
  externalWrite: boolean;
  costImpact: string;
};

export type AgentPackageVerificationRule = {
  id: string;
  required: boolean;
  kind:
    | "AGENT_VALIDATION"
    | "MCP_DEPENDENCY_CONTRACT"
    | "SECRET_FREE_EXPORT"
    | "FUNCTIONAL_EVIDENCE";
  description: string;
};

export type AgentPackageFallbackPolicy = {
  unsupportedDependency: "BLOCK_EXPORT" | "ALLOW_WITH_WARNING";
  missingCredential: "BLOCK_EXPORT" | "REQUIRE_USER_ACTION";
  approvalRequired: "BLOCK_EXPORT" | "REQUIRE_APPROVAL";
};

export type AgentPackageProfile = {
  packageId: string;
  packageVersion: string;
  buildflowVersion: string;
  format: "BPS_AI_AGENT_PROFILE";
  agent: {
    id: string;
    blueprintId: string;
    blueprintVersion: string;
    name: string;
    deliveryMode: DeliveryMode;
    interfaceModes: InterfaceMode[];
    capabilities: AgentCapability[];
  };
  dependencies: {
    providers: Array<{
      provider: AgentProviderReference;
      required: boolean;
    }>;
    mcp: AgentPackageMcpDependency[];
  };
  credentials: AgentPackageCredentialReference[];
  permissions: AgentPackagePermissionRequirement[];
  verificationRules: AgentPackageVerificationRule[];
  fallbackPolicy: AgentPackageFallbackPolicy;
  exportSafety: {
    secretFree: true;
    rawProviderResponsesIncluded: false;
    liveCredentialValuesIncluded: false;
    archiveWritten: false;
    marketplacePublished: false;
  };
};

export type AgentPackageProfileInput = {
  packageId: string;
  packageVersion: string;
  buildflowVersion: string;
  definition: AgentDefinition;
  toolResolutionPlan: AgentToolResolutionPlan;
  validationGate: AgentValidationGateResult;
  mcpTools: McpToolDefinition[];
};

export type AgentPackageReadinessIssue =
  | "PACKAGE_ID_MISSING"
  | "PACKAGE_VERSION_MISSING"
  | "BUILDFLOW_VERSION_MISSING"
  | "AGENT_VALIDATION_NOT_READY"
  | "UNRESOLVED_REQUIRED_DEPENDENCY"
  | "MCP_TOOL_CONTRACT_MISSING"
  | "MCP_TOOL_RAW_RESULT_UNSAFE"
  | "CREDENTIAL_REFERENCE_NOT_REFERENCE_ONLY"
  | "SECRET_LIKE_VALUE_DETECTED"
  | "EXPORT_SAFETY_POLICY_INVALID";

export type AgentPackageReadinessResult = {
  status: AgentPackageReadinessStatus;
  exportReady: boolean;
  issues: AgentPackageReadinessIssue[];
  safeDetails: Array<{
    issue: AgentPackageReadinessIssue;
    dependencyId?: string;
    field?: string;
  }>;
};

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function dependencyId(serverId: string, toolName: string, toolVersion: string) {
  return `${serverId}:${toolName}@${toolVersion}`;
}

function selectedMcpDependencies(
  input: AgentPackageProfileInput,
): AgentPackageMcpDependency[] {
  return input.toolResolutionPlan.resolutions
    .filter((resolution) => Boolean(resolution.selectedTool))
    .map((resolution) => {
      const selectedTool = resolution.selectedTool!;
      const contract = input.mcpTools.find(
        (tool) =>
          tool.serverId === selectedTool.serverId &&
          tool.name === selectedTool.toolName &&
          tool.version === selectedTool.toolVersion,
      );

      return {
        serverId: selectedTool.serverId,
        toolName: selectedTool.toolName,
        toolVersion: selectedTool.toolVersion,
        capabilities: contract?.capabilities ?? [resolution.capability],
        required: resolution.required,
      };
    });
}

function credentialReferences(
  tools: McpToolDefinition[],
): AgentPackageCredentialReference[] {
  return tools.map((tool) => ({
    id: `${tool.serverId}:${tool.name}:credential`,
    provider: tool.serverId,
    required: true,
    referenceOnly: tool.credential.referenceOnly,
    scopes: [...tool.credential.requiredScopes],
  }));
}

function permissionRequirements(
  tools: McpToolDefinition[],
): AgentPackagePermissionRequirement[] {
  return tools.map((tool) => ({
    dependencyId: dependencyId(tool.serverId, tool.name, tool.version),
    permissions: [...tool.permissionPolicy.permissions],
    riskClass: tool.permissionPolicy.riskClass,
    approvalRequirement: tool.permissionPolicy.approvalRequirement,
    externalWrite: tool.permissionPolicy.externalWrite,
    costImpact: tool.permissionPolicy.costImpact,
  }));
}

function findSelectedTool(
  dependency: AgentPackageMcpDependency,
  tools: McpToolDefinition[],
) {
  return tools.find(
    (tool) =>
      tool.serverId === dependency.serverId &&
      tool.name === dependency.toolName &&
      tool.version === dependency.toolVersion,
  );
}

function containsSecretLikeValue(value: unknown): boolean {
  if (typeof value === "string") {
    return (
      /sk-[A-Za-z0-9_-]{20,}/.test(value) ||
      /ghp_[A-Za-z0-9_]{20,}/.test(value) ||
      /github_pat_[A-Za-z0-9_]{20,}/.test(value)
    );
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsSecretLikeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => containsSecretLikeValue(item));
  }

  return false;
}

export function createAgentPackageProfile(
  input: AgentPackageProfileInput,
): AgentPackageProfile {
  const mcpDependencies = selectedMcpDependencies(input);
  const selectedTools = mcpDependencies
    .map((dependency) => findSelectedTool(dependency, input.mcpTools))
    .filter((tool): tool is McpToolDefinition => Boolean(tool));

  return {
    packageId: input.packageId,
    packageVersion: input.packageVersion,
    buildflowVersion: input.buildflowVersion,
    format: "BPS_AI_AGENT_PROFILE",
    agent: {
      id: input.definition.id,
      blueprintId: input.definition.blueprintId,
      blueprintVersion: input.definition.blueprintVersion,
      name: input.definition.name,
      deliveryMode: input.definition.deliveryMode,
      interfaceModes: [...input.definition.interfaceModes],
      capabilities: [...input.definition.capabilities],
    },
    dependencies: {
      providers: input.definition.providerReferences.map((provider) => ({
        provider,
        required: true,
      })),
      mcp: mcpDependencies,
    },
    credentials: credentialReferences(selectedTools),
    permissions: permissionRequirements(selectedTools),
    verificationRules: [
      {
        id: "agent.validation-gate",
        required: true,
        kind: "AGENT_VALIDATION",
        description: "Agent definition and tool resolution must pass validation.",
      },
      {
        id: "mcp.dependency-contract",
        required: mcpDependencies.length > 0,
        kind: "MCP_DEPENDENCY_CONTRACT",
        description: "MCP dependencies must resolve to safe allowlisted contracts.",
      },
      {
        id: "export.secret-free",
        required: true,
        kind: "SECRET_FREE_EXPORT",
        description: "Package profile must not include secrets or raw responses.",
      },
    ],
    fallbackPolicy: {
      unsupportedDependency: "BLOCK_EXPORT",
      missingCredential: "REQUIRE_USER_ACTION",
      approvalRequired: "REQUIRE_APPROVAL",
    },
    exportSafety: {
      secretFree: true,
      rawProviderResponsesIncluded: false,
      liveCredentialValuesIncluded: false,
      archiveWritten: false,
      marketplacePublished: false,
    },
  };
}

export function validateAgentPackageReadiness(
  profile: AgentPackageProfile,
  input: Pick<
    AgentPackageProfileInput,
    "toolResolutionPlan" | "validationGate" | "mcpTools"
  >,
): AgentPackageReadinessResult {
  const safeDetails: AgentPackageReadinessResult["safeDetails"] = [];

  if (!profile.packageId.trim()) {
    safeDetails.push({ issue: "PACKAGE_ID_MISSING", field: "packageId" });
  }
  if (!profile.packageVersion.trim()) {
    safeDetails.push({
      issue: "PACKAGE_VERSION_MISSING",
      field: "packageVersion",
    });
  }
  if (!profile.buildflowVersion.trim()) {
    safeDetails.push({
      issue: "BUILDFLOW_VERSION_MISSING",
      field: "buildflowVersion",
    });
  }
  if (!input.validationGate.ready) {
    safeDetails.push({ issue: "AGENT_VALIDATION_NOT_READY" });
  }
  for (const unresolved of input.toolResolutionPlan.unresolvedDependencies) {
    if (unresolved.required) {
      safeDetails.push({
        issue: "UNRESOLVED_REQUIRED_DEPENDENCY",
        dependencyId: unresolved.requirementId,
      });
    }
  }
  for (const dependency of profile.dependencies.mcp) {
    const tool = findSelectedTool(dependency, input.mcpTools);
    const id = dependencyId(
      dependency.serverId,
      dependency.toolName,
      dependency.toolVersion,
    );

    if (!tool) {
      safeDetails.push({
        issue: "MCP_TOOL_CONTRACT_MISSING",
        dependencyId: id,
      });
      continue;
    }
    if (tool.safeResultPolicy.storeRawResult) {
      safeDetails.push({
        issue: "MCP_TOOL_RAW_RESULT_UNSAFE",
        dependencyId: id,
      });
    }
  }
  for (const credential of profile.credentials) {
    if (!credential.referenceOnly) {
      safeDetails.push({
        issue: "CREDENTIAL_REFERENCE_NOT_REFERENCE_ONLY",
        dependencyId: credential.id,
      });
    }
  }
  if (containsSecretLikeValue(profile)) {
    safeDetails.push({ issue: "SECRET_LIKE_VALUE_DETECTED" });
  }
  if (
    !profile.exportSafety.secretFree ||
    profile.exportSafety.rawProviderResponsesIncluded ||
    profile.exportSafety.liveCredentialValuesIncluded ||
    profile.exportSafety.archiveWritten ||
    profile.exportSafety.marketplacePublished
  ) {
    safeDetails.push({ issue: "EXPORT_SAFETY_POLICY_INVALID" });
  }

  const issues = unique(safeDetails.map((detail) => detail.issue));
  return {
    status: issues.length === 0 ? "READY" : "BLOCKED",
    exportReady: issues.length === 0,
    issues,
    safeDetails,
  };
}
