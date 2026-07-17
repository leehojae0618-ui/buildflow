import { describe, expect, it } from "vitest";
import { sampleMcpServerDefinition, type McpToolDefinition } from "../mcp";
import {
  createAgentPackageProfile,
  validateAgentPackageReadiness,
  type AgentPackageProfile,
} from "./package-profile";
import {
  AgentPackageExportError,
  exportAgentPackageArtifact,
  stableSerializeAgentPackage,
} from "./package-export";
import { resolveAgentToolRequirements } from "./tool-resolution";
import { aiInquiryV1AgentBlueprint } from "./types";
import { definitionFromBlueprint } from "./validator";
import { validateAgentReadiness } from "./validation-gate";

const baseTool = sampleMcpServerDefinition.tools[0];

function toolWith(overrides: Partial<McpToolDefinition>): McpToolDefinition {
  return {
    ...baseTool,
    ...overrides,
    credential: {
      ...baseTool.credential,
      ...overrides.credential,
    },
    permissionPolicy: {
      ...baseTool.permissionPolicy,
      ...overrides.permissionPolicy,
    },
    safeResultPolicy: {
      ...baseTool.safeResultPolicy,
      ...overrides.safeResultPolicy,
    },
  };
}

function validExportInput() {
  const tool = toolWith({
    permissionPolicy: {
      ...baseTool.permissionPolicy,
      approvalRequirement: "NONE",
    },
  });
  const definition = definitionFromBlueprint({
    projectId: "agent-package-export-project",
    name: "AI Inquiry Agent",
    blueprint: aiInquiryV1AgentBlueprint,
    deliveryMode: "CHAT",
    interfaceModes: ["WEB_CHAT"],
  });
  const toolResolutionPlan = resolveAgentToolRequirements({
    requirements: [
      {
        id: "requirement.email-read",
        capability: "EMAIL_READ",
        required: true,
      },
    ],
    candidates: [
      {
        id: "candidate.gmail-read",
        credentialAvailable: true,
        tool,
      },
    ],
  });
  const validationGate = validateAgentReadiness({
    definition,
    blueprint: aiInquiryV1AgentBlueprint,
    toolResolutionPlan,
    mcpTools: [tool],
  });
  const profile = createAgentPackageProfile({
    packageId: "pkg.ai-inquiry-agent",
    packageVersion: "1.0.0",
    buildflowVersion: "0.1.0",
    definition,
    toolResolutionPlan,
    validationGate,
    mcpTools: [tool],
  });
  const readiness = validateAgentPackageReadiness(profile, {
    toolResolutionPlan,
    validationGate,
    mcpTools: [tool],
  });

  return {
    formatVersion: "bps-agent-profile-artifact-1.0" as const,
    profile,
    readiness,
  };
}

function expectExportError(
  action: () => unknown,
  code: AgentPackageExportError["code"],
) {
  try {
    action();
    throw new Error("Expected export to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(AgentPackageExportError);
    expect((error as AgentPackageExportError).code).toBe(code);
  }
}

describe("agent package artifact export", () => {
  it("exports a valid package profile as a deterministic JSON artifact", () => {
    const artifact = exportAgentPackageArtifact(validExportInput());
    const parsed = JSON.parse(artifact.payload);

    expect(artifact.metadata).toMatchObject({
      formatVersion: "bps-agent-profile-artifact-1.0",
      contentType: "application/vnd.buildflow.agent-package-profile+json",
      packageId: "pkg.ai-inquiry-agent",
      packageVersion: "1.0.0",
      deterministic: true,
    });
    expect(artifact.metadata.checksumSha256).toHaveLength(64);
    expect(artifact.metadata.byteLength).toBe(
      Buffer.byteLength(artifact.payload),
    );
    expect(parsed.formatVersion).toBe("bps-agent-profile-artifact-1.0");
    expect(parsed.profile.packageId).toBe("pkg.ai-inquiry-agent");
    expect(parsed.readiness.exportReady).toBe(true);
  });

  it("produces identical artifacts for identical input", () => {
    const first = exportAgentPackageArtifact(validExportInput());
    const second = exportAgentPackageArtifact(validExportInput());

    expect(first.payload).toBe(second.payload);
    expect(first.metadata).toEqual(second.metadata);
  });

  it("rejects missing required identifiers", () => {
    const input = validExportInput();

    expectExportError(
      () =>
        exportAgentPackageArtifact({
          ...input,
          profile: { ...input.profile, packageId: "" },
        }),
      "PACKAGE_IDENTIFIER_MISSING",
    );

    expectExportError(
      () =>
        exportAgentPackageArtifact({
          ...input,
          profile: { ...input.profile, packageVersion: "" },
        }),
      "PACKAGE_VERSION_MISSING",
    );
  });

  it("rejects unsupported package artifact format versions", () => {
    expectExportError(
      () =>
        exportAgentPackageArtifact({
          ...validExportInput(),
          formatVersion: "unsupported" as "bps-agent-profile-artifact-1.0",
        }),
      "UNSUPPORTED_FORMAT_VERSION",
    );
  });

  it("blocks validation failures and not-ready packages", () => {
    const input = validExportInput();

    expectExportError(
      () =>
        exportAgentPackageArtifact({
          ...input,
          readiness: {
            status: "BLOCKED",
            exportReady: false,
            issues: ["AGENT_VALIDATION_NOT_READY"],
            safeDetails: [{ issue: "AGENT_VALIDATION_NOT_READY" }],
          },
        }),
      "PACKAGE_NOT_READY",
    );
  });

  it("blocks raw secrets and credential values", () => {
    const input = validExportInput();
    const profile = {
      ...input.profile,
      credentials: [
        ...input.profile.credentials,
        {
          id: "raw-credential",
          provider: "gmail.mcp",
          required: true,
          referenceOnly: true,
          scopes: [],
          accessToken: ["ghp", "123456789012345678901234567890"].join("_"),
        },
      ],
    } as unknown as AgentPackageProfile;

    expectExportError(
      () => exportAgentPackageArtifact({ ...input, profile }),
      "SECRET_OR_CREDENTIAL_VALUE_DETECTED",
    );
  });

  it("keeps allowed credential references without raw values", () => {
    const artifact = exportAgentPackageArtifact(validExportInput());
    const serialized = artifact.payload;

    expect(serialized).toContain("\"referenceOnly\": true");
    expect(serialized).toContain("\"gmail.readonly\"");
    expect(serialized).not.toContain("accessToken");
    expect(serialized).not.toContain("refreshToken");
    expect(serialized).not.toContain("password");
  });

  it("does not mutate the input object during export", () => {
    const input = validExportInput();
    const before = stableSerializeAgentPackage(input);

    exportAgentPackageArtifact(input);

    expect(stableSerializeAgentPackage(input)).toBe(before);
  });

  it("rejects unsupported serialization values", () => {
    const input = validExportInput();

    expectExportError(
      () =>
        exportAgentPackageArtifact({
          ...input,
          profile: {
            ...input.profile,
            agent: {
              ...input.profile.agent,
              unsupported: BigInt(1),
            },
          } as unknown as AgentPackageProfile,
        }),
      "SERIALIZATION_UNSUPPORTED",
    );
  });
});
