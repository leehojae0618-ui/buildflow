import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "../../agents/package-export";
import { compileWarnings, unsupportedCapabilities } from "../capabilities";
import type { AdapterInput, CompileResult, CredentialRequirement } from "../types";

export type MakeScenarioPreview = {
  format: "BUILDFLOW_INTERNAL_MAKE_SCENARIO_PREVIEW_V1";
  name: string;
  blueprint: { modules: readonly { id: string; label: string; role: string; dependsOn: readonly string[] }[] };
  scheduling: { mode: "ON_DEMAND"; serialized: string };
  teamIdPlaceholder: "MAKE_TEAM_ID_REQUIRED";
  folderIdPlaceholder: "MAKE_FOLDER_ID_OPTIONAL";
};

const secretPattern = /(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|Bearer\s+[A-Za-z0-9._~+/=-]{10,})/i;

export function isSafeCredentialReference(value: string): boolean {
  return Boolean(value) && value.length <= 160 && !secretPattern.test(value);
}

function checksum(value: unknown): string {
  return createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");
}

export function compileMakeScenario(input: AdapterInput): CompileResult<MakeScenarioPreview> {
  const credentialReference = input.credentialReference ?? "MAKE_CONNECTION_SLACK_REFERENCE_REQUIRED";
  if (!isSafeCredentialReference(credentialReference)) throw new Error("CREDENTIAL_REFERENCE_UNSAFE");
  const preview: MakeScenarioPreview = {
    format: "BUILDFLOW_INTERNAL_MAKE_SCENARIO_PREVIEW_V1",
    name: `BuildFlow ${input.blueprint.id}`,
    blueprint: {
      modules: input.blueprint.steps.map((step) => ({
        id: step.id,
        label: step.label,
        role: step.type,
        dependsOn: [...step.dependsOn],
      })),
    },
    scheduling: {
      mode: "ON_DEMAND",
      serialized: stableSerializeAgentPackage({ mode: "ON_DEMAND", blueprintId: input.blueprint.id }),
    },
    teamIdPlaceholder: "MAKE_TEAM_ID_REQUIRED",
    folderIdPlaceholder: "MAKE_FOLDER_ID_OPTIONAL",
  };
  const credentialRequirements: readonly CredentialRequirement[] = [{ provider: "SLACK", reference: credentialReference, mode: "PLACEHOLDER_ONLY" }];
  const payload = { platform: "MAKE" as const, preview, credentialRequirements };
  return {
    platform: "MAKE",
    artifact: preview,
    warnings: [...compileWarnings("MAKE"), "MAKE_MODULE_SCHEMA_REQUIRES_REAL_PLATFORM_VALIDATION"],
    unsupportedCapabilities: unsupportedCapabilities("MAKE"),
    credentialRequirements,
    deterministicChecksum: checksum(payload),
    actualExternalCreation: false,
  };
}
