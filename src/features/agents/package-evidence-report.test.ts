import { describe, expect, it } from "vitest";
import { sampleMcpServerDefinition, type McpToolDefinition } from "../mcp";
import {
  exportAgentPackageArtifact,
  stableSerializeAgentPackage,
  type AgentPackageExportInput,
} from "./package-export";
import { buildPackageEvidenceBundle } from "./package-evidence-bundle";
import {
  buildPackageEvidenceReport,
  type PackageEvidenceReportBuildInput,
} from "./package-evidence-report";
import {
  createAgentPackageProfile,
  validateAgentPackageReadiness,
} from "./package-profile";
import { runPackageVerificationPipeline } from "./package-verification-pipeline";
import { verifyAgentPackageArtifact } from "./package-verification";
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

function exportInput(): AgentPackageExportInput {
  const tool = toolWith();
  const definition = definitionFromBlueprint({
    projectId: "agent-package-evidence-report-project",
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
    formatVersion: "bps-agent-profile-artifact-1.0",
    profile,
    readiness,
  };
}

function validInput(
  overrides: Partial<PackageEvidenceReportBuildInput> = {},
): PackageEvidenceReportBuildInput {
  const packageArtifact = exportAgentPackageArtifact(exportInput());
  const verificationReport = verifyAgentPackageArtifact(packageArtifact);
  const evidenceBundleResult = buildPackageEvidenceBundle({
    packageArtifact,
    verificationReport,
    packageArtifactReference: "artifact://pkg.ai-inquiry-agent/1.0.0/profile",
    verificationReportReference:
      "verification://pkg.ai-inquiry-agent/1.0.0/report",
  });
  const verificationPipeline = runPackageVerificationPipeline({
    ...exportInput(),
    packageArtifactReference: "artifact://pkg.ai-inquiry-agent/1.0.0/profile",
    verificationReportReference:
      "verification://pkg.ai-inquiry-agent/1.0.0/report",
  });

  return {
    packageArtifact,
    verificationReport,
    evidenceBundleResult,
    verificationPipeline,
    sourceReferences: {
      packageArtifact: "artifact://pkg.ai-inquiry-agent/1.0.0/profile",
      verificationReport: "verification://pkg.ai-inquiry-agent/1.0.0/report",
      evidenceBundle: "bundle://pkg.ai-inquiry-agent/1.0.0/evidence",
      verificationPipeline: "pipeline://pkg.ai-inquiry-agent/1.0.0/summary",
    },
    ...overrides,
  };
}

function build(overrides: Partial<PackageEvidenceReportBuildInput> = {}) {
  return buildPackageEvidenceReport(validInput(overrides));
}

describe("package evidence report", () => {
  it("returns VALID_WITH_LIMITATIONS for a normal pipeline result", () => {
    expect(build().status).toBe("VALID_WITH_LIMITATIONS");
  });

  it("does not return VALID in v1", () => {
    expect(build().status).not.toBe("VALID");
  });

  it("produces the same reportId for the same input", () => {
    expect(build().report.reportId).toBe(build().report.reportId);
  });

  it("produces the same deterministicCore for the same input", () => {
    expect(build().report.deterministicCore).toEqual(
      build().report.deterministicCore,
    );
  });

  it("produces the same reportIntegrityChecksum for the same input", () => {
    expect(build().report.reportIntegrityChecksum).toBe(
      build().report.reportIntegrityChecksum,
    );
  });

  it("keeps generatedAt outside deterministic output", () => {
    const first = build({ metadata: { generatedAt: "2026-07-17T00:00:00Z" } });
    const second = build({ metadata: { generatedAt: "2026-07-18T00:00:00Z" } });

    expect(first.report.reportId).toBe(second.report.reportId);
    expect(first.report.deterministicCore).toEqual(second.report.deterministicCore);
    expect(first.report.reportIntegrityChecksum).toBe(
      second.report.reportIntegrityChecksum,
    );
  });

  it("keeps metadata changes outside deterministic output", () => {
    const first = build({ metadata: { generatedAt: "a" } });
    const second = build({ metadata: {} });

    expect(first.report.deterministicCore).toEqual(second.report.deterministicCore);
  });

  it("keeps human-readable changes outside deterministic output", () => {
    const first = build({
      humanReadable: { title: "First title", nextRequiredActions: ["Review"] },
    });
    const second = build({
      humanReadable: { title: "Second title", nextRequiredActions: ["Approve"] },
    });

    expect(first.report.reportId).toBe(second.report.reportId);
    expect(first.report.deterministicCore).toEqual(second.report.deterministicCore);
    expect(first.report.reportIntegrityChecksum).toBe(
      second.report.reportIntegrityChecksum,
    );
  });

  it("returns INVALID for packageId mismatch", () => {
    const input = validInput();
    const result = build({
      verificationReport: { ...input.verificationReport, packageId: "pkg.other" },
    });

    expect(result.status).toBe("INVALID");
  });

  it("returns INVALID for packageVersion mismatch", () => {
    const input = validInput();
    const result = build({
      verificationReport: { ...input.verificationReport, packageVersion: "2.0.0" },
    });

    expect(result.status).toBe("INVALID");
  });

  it("returns INVALID for package artifact checksum mismatch", () => {
    const input = validInput();
    const result = build({
      verificationReport: {
        ...input.verificationReport,
        artifactChecksum: "0".repeat(64),
      },
    });

    expect(result.status).toBe("INVALID");
  });

  it("returns INVALID for verification checksum mismatch", () => {
    const input = validInput();
    const result = build({
      evidenceBundleResult: {
        ...input.evidenceBundleResult,
        bundle: {
          ...input.evidenceBundleResult.bundle,
          verificationReport: {
            ...input.evidenceBundleResult.bundle.verificationReport,
            checksum: "0".repeat(64),
          },
        },
      },
    });

    expect(result.status).toBe("INVALID");
  });

  it("returns INVALID for bundle checksum mismatch", () => {
    const input = validInput();
    const result = build({
      verificationPipeline: {
        ...input.verificationPipeline,
        checksums: {
          ...input.verificationPipeline.checksums,
          evidenceBundle: "0".repeat(64),
        },
      },
    });

    expect(result.status).toBe("INVALID");
  });

  it("returns INVALID for pipeline checksum mismatch", () => {
    const input = validInput();
    const result = build({
      verificationPipeline: {
        ...input.verificationPipeline,
        checksums: {
          ...input.verificationPipeline.checksums,
          exportArtifact: "0".repeat(64),
        },
      },
    });

    expect(result.status).toBe("INVALID");
  });

  it("returns INVALID when pipeline FAILED", () => {
    const input = validInput();
    const result = build({
      verificationPipeline: {
        ...input.verificationPipeline,
        status: "FAILED",
      },
    });

    expect(result.status).toBe("INVALID");
  });

  it("returns INCOMPLETE when pipeline INCOMPLETE", () => {
    const input = validInput();
    const result = build({
      verificationPipeline: {
        ...input.verificationPipeline,
        status: "INCOMPLETE",
      },
    });

    expect(result.status).toBe("INCOMPLETE");
  });

  it("returns INVALID when verification INVALID", () => {
    const input = validInput();
    const result = build({
      verificationReport: {
        ...input.verificationReport,
        overallStatus: "INVALID",
      },
    });

    expect(result.status).toBe("INVALID");
  });

  it("returns INVALID when bundle INVALID", () => {
    const input = validInput();
    const result = build({
      evidenceBundleResult: {
        ...input.evidenceBundleResult,
        status: "INVALID",
        bundle: { ...input.evidenceBundleResult.bundle, status: "INVALID" },
      },
    });

    expect(result.status).toBe("INVALID");
  });

  it("returns INCOMPLETE for missing required package artifact reference", () => {
    const input = validInput();
    const result = build({
      sourceReferences: {
        ...input.sourceReferences,
        packageArtifact: undefined,
      },
    });

    expect(result.status).toBe("INCOMPLETE");
  });

  it("records optional Runtime evidence absence as a limitation", () => {
    expect(build().report.limitations.join(" ")).toContain("Runtime");
  });

  it("keeps runtime readiness NOT_VERIFIED", () => {
    expect(build().report.readiness.runtimeReadiness).toBe("NOT_VERIFIED");
  });

  it("keeps deployment readiness NOT_VERIFIED", () => {
    expect(build().report.readiness.deploymentReadiness).toBe("NOT_VERIFIED");
  });

  it("keeps marketplace readiness NOT_VERIFIED", () => {
    expect(build().report.readiness.marketplaceReadiness).toBe("NOT_VERIFIED");
  });

  it("keeps package readiness CONDITIONALLY_READY", () => {
    expect(build().report.packageReadiness).toBe("CONDITIONALLY_READY");
  });

  it("records missing approval reference without approving", () => {
    const result = build();

    expect(result.report.approval.reference).toBeNull();
    expect(result.report.approval.statusSnapshot).toBe("UNKNOWN");
  });

  it("keeps approval PENDING informational only", () => {
    const result = build({
      approvalReference: "approval://pkg.ai-inquiry-agent/approval-1",
      approvalStatusSnapshot: "PENDING",
    });

    expect(result.report.approval.informationalOnly).toBe(true);
    expect(result.status).toBe("VALID_WITH_LIMITATIONS");
  });

  it("returns INVALID when APPROVED snapshot lacks reference", () => {
    const result = build({ approvalStatusSnapshot: "APPROVED" });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((failure) => failure.code)).toContain(
      "APPROVAL_CONFLICT",
    );
  });

  it("does not infer approval completion from report success", () => {
    const result = build();

    expect(result.status).toBe("VALID_WITH_LIMITATIONS");
    expect(result.report.readiness.approvalReadiness).toBe("NOT_READY");
  });

  it("returns INVALID for raw secret input", () => {
    const rawSecret = ["sk", "123456789012345678901234567890"].join("-");
    const result = build({
      approvalReference: rawSecret,
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((failure) => failure.code)).toContain(
      "SECRET_SAFETY_ERROR",
    );
  });

  it("does not expose raw secret values in failure messages", () => {
    const rawSecret = ["ghp", "123456789012345678901234567890"].join("_");
    const result = build({
      humanReadable: {
        executiveSummary: rawSecret,
      },
    });

    expect(JSON.stringify(result.failures)).not.toContain(rawSecret);
  });

  it("allows credential references", () => {
    const result = build({
      approvalReference: "credential-reference:gmail.mcp:gmail.read-message",
    });

    expect(result.status).toBe("VALID_WITH_LIMITATIONS");
  });

  it("orders evidence categories deterministically", () => {
    expect(build().report.evidenceSummary.present.map((item) => item.category)).toEqual([
      "STRUCTURAL",
      "EXPORT",
      "VERIFICATION",
      "BUNDLE",
      "PIPELINE",
    ]);
  });

  it("normalizes duplicate warnings and limitations", () => {
    const input = validInput();
    const result = build({
      verificationPipeline: {
        ...input.verificationPipeline,
        warnings: ["same", "same"],
        limitations: ["same limitation", "same limitation"],
      },
    });

    expect(result.report.warnings.filter((item) => item === "same")).toHaveLength(1);
    expect(
      result.report.limitations.filter((item) => item === "same limitation"),
    ).toHaveLength(1);
  });

  it("does not mutate the input", () => {
    const input = validInput();
    const before = stableSerializeAgentPackage(input);

    buildPackageEvidenceReport(input);

    expect(stableSerializeAgentPackage(input)).toBe(before);
  });

  it("does not copy full upstream payloads into report output", () => {
    const input = validInput();
    const result = buildPackageEvidenceReport(input);
    const serialized = stableSerializeAgentPackage(result.report);

    expect(serialized).not.toContain(input.packageArtifact.payload);
    expect(serialized).not.toContain(
      stableSerializeAgentPackage(input.verificationReport),
    );
    expect(serialized).not.toContain(
      stableSerializeAgentPackage(input.evidenceBundleResult.bundle),
    );
    expect(serialized).not.toContain(
      stableSerializeAgentPackage(input.verificationPipeline),
    );
  });

  it("does not upgrade INCOMPLETE pipeline to success", () => {
    const input = validInput();
    const result = build({
      verificationPipeline: {
        ...input.verificationPipeline,
        status: "INCOMPLETE",
      },
    });

    expect(result.status).toBe("INCOMPLETE");
  });

  it("does not infer deployability from report success", () => {
    const result = build();

    expect(result.status).toBe("VALID_WITH_LIMITATIONS");
    expect(result.report.deployability.status).toBe("NOT_VERIFIED");
  });

  it("does not infer marketplace publishability from report success", () => {
    const result = build();

    expect(result.status).toBe("VALID_WITH_LIMITATIONS");
    expect(result.report.marketplaceReadiness.status).toBe("NOT_VERIFIED");
  });

  it("checks human-readable fields for secrets", () => {
    const rawSecret = ["sk", "123456789012345678901234567890"].join("-");
    const result = build({
      humanReadable: {
        title: rawSecret,
      },
    });

    expect(result.status).toBe("INVALID");
    expect(JSON.stringify(result.report.humanReadable)).not.toContain(rawSecret);
    expect(JSON.stringify(result.failures)).not.toContain(rawSecret);
  });

  it("returns a sanitized internal error report", () => {
    const result = buildPackageEvidenceReport(undefined as never);

    expect(result.status).toBe("INVALID");
    expect(result.failures).toEqual([
      expect.objectContaining({
        code: "INTERNAL_REPORT_ERROR",
        message: "Evidence report builder could not complete.",
      }),
    ]);
  });
});
