import type { CanonicalBlueprint, VerificationLoopObservation } from "../verification-loop/types";

export const externalBuilderPlatforms = ["MAKE", "N8N"] as const;
export type ExternalBuilderPlatform = (typeof externalBuilderPlatforms)[number];

export const externalBuilderCapabilities = [
  "trigger",
  "transform",
  "approvalGate",
  "externalAction",
  "scheduling",
  "webhook",
  "resultCollection",
] as const;
export type ExternalBuilderCapability = (typeof externalBuilderCapabilities)[number];

export type CapabilitySupport = "SUPPORTED" | "PARTIAL" | "UNSUPPORTED" | "REQUIRES_REAL_PLATFORM_VALIDATION";

export type CredentialRequirement = {
  provider: "SLACK";
  reference: string;
  mode: "PLACEHOLDER_ONLY";
};

export type CompileResult<TArtifact> = {
  platform: ExternalBuilderPlatform;
  artifact: TArtifact;
  warnings: readonly string[];
  unsupportedCapabilities: readonly ExternalBuilderCapability[];
  credentialRequirements: readonly CredentialRequirement[];
  deterministicChecksum: string;
  actualExternalCreation: false;
};

export type CanonicalExternalExecutionResult = {
  platform: ExternalBuilderPlatform;
  executionMode: "SIMULATED";
  externalWorkflowId: string;
  externalExecutionId: string;
  status: "SUCCEEDED" | "FAILED" | "WAITING";
  startedAt: string;
  finishedAt: string;
  observations: readonly VerificationLoopObservation[];
  errors: readonly string[];
  rawReference: string;
  actualExternalExecution: false;
};

export type AdapterInput = {
  blueprint: CanonicalBlueprint;
  credentialReference?: string;
};
