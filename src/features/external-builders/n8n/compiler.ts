import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "../../agents/package-export";
import { compileWarnings, unsupportedCapabilities } from "../capabilities";
import type { AdapterInput, CompileResult, CredentialRequirement } from "../types";

export type N8nWorkflowPreview = {
  format: "BUILDFLOW_INTERNAL_N8N_WORKFLOW_PREVIEW_V1";
  name: string;
  nodes: readonly { id: string; name: string; role: string; credentialReference?: string }[];
  connections: readonly { from: string; to: string }[];
  settings: { executionOrder: "v1"; requiresRealPlatformValidation: true };
  active: false;
};

const tokenPattern = /(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|Bearer\s+[A-Za-z0-9._~+/=-]{10,})/i;

function checksum(value: unknown): string {
  return createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");
}

export function compileN8nWorkflow(input: AdapterInput): CompileResult<N8nWorkflowPreview> {
  const credentialReference = input.credentialReference ?? "N8N_CREDENTIAL_SLACK_REFERENCE_REQUIRED";
  if (!credentialReference || credentialReference.length > 160 || tokenPattern.test(credentialReference)) {
    throw new Error("CREDENTIAL_REFERENCE_UNSAFE");
  }
  const preview: N8nWorkflowPreview = {
    format: "BUILDFLOW_INTERNAL_N8N_WORKFLOW_PREVIEW_V1",
    name: `BuildFlow ${input.blueprint.id}`,
    nodes: input.blueprint.steps.map((step) => ({
      id: step.id,
      name: step.label,
      role: step.type,
      ...(step.id === "deliver-slack" ? { credentialReference } : {}),
    })),
    connections: input.blueprint.steps.flatMap((step) => step.dependsOn.map((dependency) => ({ from: dependency, to: step.id }))),
    settings: { executionOrder: "v1", requiresRealPlatformValidation: true },
    active: false,
  };
  const credentialRequirements: readonly CredentialRequirement[] = [{ provider: "SLACK", reference: credentialReference, mode: "PLACEHOLDER_ONLY" }];
  const payload = { platform: "N8N" as const, preview, credentialRequirements };
  return {
    platform: "N8N",
    artifact: preview,
    warnings: [...compileWarnings("N8N"), "N8N_NODE_SCHEMA_REQUIRES_REAL_PLATFORM_VALIDATION"],
    unsupportedCapabilities: unsupportedCapabilities("N8N"),
    credentialRequirements,
    deterministicChecksum: checksum(payload),
    actualExternalCreation: false,
  };
}
