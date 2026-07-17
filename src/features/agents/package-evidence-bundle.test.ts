import { describe, expect, it } from "vitest";
import { sampleMcpServerDefinition, type McpToolDefinition } from "../mcp";
import { exportAgentPackageArtifact, stableSerializeAgentPackage } from "./package-export";
import {
  buildPackageEvidenceBundle,
  type PackageEvidenceBundleBuildInput,
} from "./package-evidence-bundle";
import {
  createAgentPackageProfile,
  validateAgentPackageReadiness,
} from "./package-profile";
import { verifyAgentPackageArtifact, type PackageVerificationReport } from "./package-verification";
import { resolveAgentToolRequirements } from "./tool-resolution";
import { aiInquiryV1AgentBlueprint } from "./types";
import { definitionFromBlueprint } from "./validator";
import { validateAgentReadiness } from "./validation-gate";

const baseTool = sampleMcpServerDefinition.tools[0];

function toolWith(overrides: Partial<McpToolDefinition> = {}): McpToolDefinition {
  return {
    ...baseTool,
    ...overrides,
    credential: {
      ...baseTool.credential,
      ...overrides.credential,
    },
    permissionPolicy: {
      ...baseTool.permissionPolicy,
      approvalRequirement: "NONE",
      ...overrides.permissionPolicy,
    },
    safeResultPolicy: {
      ...baseTool.safeResultPolicy,
      ...overrides.safeResultPolicy,
    },
  };
}

function validInput(): PackageEvidenceBundleBuildInput {
  const tool = toolWith();
  const definition = definitionFromBlueprint({
    projectId: "agent-evidence-bundle-project",
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
  const packageArtifact = exportAgentPackageArtifact({
    formatVersion: "bps-agent-profile-artifact-1.0",
    profile,
    readiness,
  });
  const verificationReport = verifyAgentPackageArtifact(packageArtifact);

  return {
    packageArtifact,
    verificationReport,
    packageArtifactReference: "artifact://pkg.ai-inquiry-agent/1.0.0/profile",
    verificationReportReference:
      "verification://pkg.ai-inquiry-agent/1.0.0/report",
  };
}

function build(input: Partial<PackageEvidenceBundleBuildInput> = {}) {
  return buildPackageEvidenceBundle({
    ...validInput(),
    ...input,
  });
}

describe("package evidence bundle", () => {
  it("returns VALID_WITH_LIMITATIONS for a valid artifact and report", () => {
    expect(build().status).toBe("VALID_WITH_LIMITATIONS");
  });

  it("produces the same bundleId for the same input", () => {
    expect(build().bundle.bundleId).toBe(build().bundle.bundleId);
  });

  it("produces the same deterministic core for the same input", () => {
    expect(build().bundle.deterministicCore).toEqual(
      build().bundle.deterministicCore,
    );
  });

  it("produces the same bundle integrity checksum for the same input", () => {
    expect(build().bundle.bundleIntegrityChecksum).toBe(
      build().bundle.bundleIntegrityChecksum,
    );
  });

  it("deduplicates duplicate evidence references", () => {
    const input = validInput();
    const duplicate = input.verificationReport.evidenceReferences[0];
    const result = build({
      verificationReport: {
        ...input.verificationReport,
        evidenceReferences: [
          duplicate,
          ...input.verificationReport.evidenceReferences,
          duplicate,
        ],
      },
    });

    expect(result.bundle.evidenceReferences.filter((item) => item.reference === duplicate)).toHaveLength(1);
  });

  it("produces the same result when evidence order changes", () => {
    const input = validInput();
    const reversed = {
      ...input.verificationReport,
      evidenceReferences: [...input.verificationReport.evidenceReferences].reverse(),
    };

    expect(build({ verificationReport: reversed }).bundle.deterministicCore).toEqual(
      build({ verificationReport: input.verificationReport }).bundle.deterministicCore,
    );
  });

  it("returns INVALID for packageId mismatch", () => {
    const input = validInput();
    const result = build({
      packageArtifact: {
        ...input.packageArtifact,
        metadata: {
          ...input.packageArtifact.metadata,
          packageId: "pkg.other",
        },
      },
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((failure) => failure.code)).toContain("CONTRACT_ERROR");
  });

  it("returns INVALID for packageVersion mismatch", () => {
    const input = validInput();
    const result = build({
      packageArtifact: {
        ...input.packageArtifact,
        metadata: {
          ...input.packageArtifact.metadata,
          packageVersion: "2.0.0",
        },
      },
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((failure) => failure.code)).toContain("CONTRACT_ERROR");
  });

  it("returns INVALID for artifact checksum mismatch", () => {
    const input = validInput();
    const result = build({
      packageArtifact: {
        ...input.packageArtifact,
        metadata: {
          ...input.packageArtifact.metadata,
          checksumSha256: "0".repeat(64),
        },
      },
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((failure) => failure.code)).toContain("INTEGRITY_ERROR");
  });

  it("returns INVALID when verification report is INVALID", () => {
    const input = validInput();
    const result = build({
      verificationReport: {
        ...input.verificationReport,
        overallStatus: "INVALID",
      },
    });

    expect(result.status).toBe("INVALID");
  });

  it("returns INCOMPLETE when verification report is UNVERIFIED", () => {
    const input = validInput();
    const result = build({
      verificationReport: {
        ...input.verificationReport,
        overallStatus: "UNVERIFIED",
      },
    });

    expect(result.status).toBe("INCOMPLETE");
  });

  it("returns INCOMPLETE when required evidence references are missing", () => {
    const input = validInput();
    const result = build({
      verificationReport: {
        ...input.verificationReport,
        evidenceReferences: [],
      },
    });

    expect(result.status).toBe("INCOMPLETE");
    expect(result.failures.map((failure) => failure.code)).toContain("EVIDENCE_MISSING");
  });

  it("returns INVALID with SECRET_SAFETY_ERROR for raw secrets", () => {
    const rawSecret = ["sk", "123456789012345678901234567890"].join("-");
    const result = build({
      approvalReference: rawSecret,
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((failure) => failure.code)).toContain("SECRET_SAFETY_ERROR");
  });

  it("allows credential references", () => {
    const input = validInput();
    const result = build({
      verificationReport: {
        ...input.verificationReport,
        evidenceReferences: [
          ...input.verificationReport.evidenceReferences,
          "credential-reference:gmail.mcp:gmail.read-message",
        ],
      },
    });

    expect(result.status).toBe("VALID_WITH_LIMITATIONS");
  });

  it("records a limitation when approval reference is absent", () => {
    expect(build().bundle.limitations).toContain("Approval reference is not present.");
  });

  it("includes approval reference in deterministic core", () => {
    const result = build({
      approvalReference: "approval://pkg.ai-inquiry-agent/approval-1",
    });

    expect(result.bundle.deterministicCore.approvalReference).toBe(
      "approval://pkg.ai-inquiry-agent/approval-1",
    );
  });

  it("does not return VALID in the first implementation", () => {
    expect(build().status).not.toBe("VALID");
  });

  it("does not mutate the input", () => {
    const input = validInput();
    const before = stableSerializeAgentPackage(input);

    buildPackageEvidenceBundle(input);

    expect(stableSerializeAgentPackage(input)).toBe(before);
  });

  it("keeps deterministic output stable when metadata changes", () => {
    const first = build({
      metadata: { generatedAt: "2026-07-17T00:00:00.000Z" },
    });
    const second = build({
      metadata: { generatedAt: "2026-07-18T00:00:00.000Z" },
    });

    expect(first.bundle.deterministicCore).toEqual(second.bundle.deterministicCore);
    expect(first.bundle.bundleIntegrityChecksum).toBe(
      second.bundle.bundleIntegrityChecksum,
    );
  });

  it("does not expose raw secret values in failure messages", () => {
    const rawSecret = ["ghp", "123456789012345678901234567890"].join("_");
    const result = build({
      verificationReport: {
        ...validInput().verificationReport,
        evidenceReferences: [rawSecret],
      } as PackageVerificationReport,
    });

    expect(result.status).toBe("INVALID");
    expect(JSON.stringify(result.failures)).not.toContain(rawSecret);
  });
});
