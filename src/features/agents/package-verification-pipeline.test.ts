import { describe, expect, it } from "vitest";
import { sampleMcpServerDefinition, type McpToolDefinition } from "../mcp";
import {
  exportAgentPackageArtifact,
  stableSerializeAgentPackage,
  type AgentPackageExportArtifact,
  type AgentPackageExportInput,
} from "./package-export";
import {
  buildPackageEvidenceBundle,
  type PackageEvidenceBundleBuildResult,
} from "./package-evidence-bundle";
import {
  createAgentPackageProfile,
  validateAgentPackageReadiness,
  type AgentPackageProfile,
} from "./package-profile";
import {
  runPackageVerificationPipeline,
  type PackageVerificationPipelineInput,
} from "./package-verification-pipeline";
import {
  verifyAgentPackageArtifact,
  type PackageVerificationReport,
} from "./package-verification";
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

function validExportInput(): AgentPackageExportInput {
  const tool = toolWith();
  const definition = definitionFromBlueprint({
    projectId: "agent-package-verification-pipeline-project",
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

function validPipelineInput(
  overrides: Partial<PackageVerificationPipelineInput> = {},
): PackageVerificationPipelineInput {
  return {
    ...validExportInput(),
    packageArtifactReference: "artifact://pkg.ai-inquiry-agent/1.0.0/profile",
    verificationReportReference:
      "verification://pkg.ai-inquiry-agent/1.0.0/report",
    ...overrides,
  };
}

function run(input: Partial<PackageVerificationPipelineInput> = {}) {
  return runPackageVerificationPipeline(validPipelineInput(input));
}

function pipelineArtifacts() {
  const input = validPipelineInput();
  const artifact = exportAgentPackageArtifact(input);
  const report = verifyAgentPackageArtifact(artifact);
  const bundle = buildPackageEvidenceBundle({
    packageArtifact: artifact,
    verificationReport: report,
    packageArtifactReference: input.packageArtifactReference,
    verificationReportReference: input.verificationReportReference,
    approvalReference: input.approvalReference,
    metadata: input.metadata,
  });

  return { input, artifact, report, bundle };
}

function withDependencies(overrides: {
  exportPackageArtifact?: (input: AgentPackageExportInput) => AgentPackageExportArtifact;
  verifyPackageArtifact?: (
    artifact: AgentPackageExportArtifact,
  ) => PackageVerificationReport;
  buildEvidenceBundle?: (
    input: Parameters<typeof buildPackageEvidenceBundle>[0],
  ) => PackageEvidenceBundleBuildResult;
}) {
  return {
    exportPackageArtifact: overrides.exportPackageArtifact ?? exportAgentPackageArtifact,
    verifyPackageArtifact: overrides.verifyPackageArtifact ?? verifyAgentPackageArtifact,
    buildEvidenceBundle: overrides.buildEvidenceBundle ?? buildPackageEvidenceBundle,
  };
}

describe("package verification pipeline", () => {
  it("returns COMPLETED_WITH_LIMITATIONS for a valid package pipeline", () => {
    const result = run();

    expect(result.status).toBe("COMPLETED_WITH_LIMITATIONS");
    expect(result.checksums.exportArtifact).toHaveLength(64);
    expect(result.checksums.verificationReport).toHaveLength(64);
    expect(result.checksums.evidenceBundle).toHaveLength(64);
  });

  it("produces the same export checksum for the same input", () => {
    expect(run().checksums.exportArtifact).toBe(run().checksums.exportArtifact);
  });

  it("produces the same verification report checksum for the same input", () => {
    expect(run().checksums.verificationReport).toBe(
      run().checksums.verificationReport,
    );
  });

  it("produces the same bundle checksum for the same input", () => {
    expect(run().checksums.evidenceBundle).toBe(run().checksums.evidenceBundle);
  });

  it("produces the same deterministic pipeline summary for the same input", () => {
    expect(run().deterministicSummary).toEqual(run().deterministicSummary);
  });

  it("keeps deterministic output stable when metadata timestamp changes", () => {
    const first = run({
      metadata: { generatedAt: "2026-07-17T00:00:00.000Z" },
    });
    const second = run({
      metadata: { generatedAt: "2026-07-18T00:00:00.000Z" },
    });

    expect(first.checksums.exportArtifact).toBe(second.checksums.exportArtifact);
    expect(first.checksums.verificationReport).toBe(
      second.checksums.verificationReport,
    );
    expect(first.checksums.evidenceBundle).toBe(second.checksums.evidenceBundle);
    expect(first.deterministicSummary).toEqual(second.deterministicSummary);
  });

  it("returns FAILED when package export fails", () => {
    const input = validPipelineInput({
      readiness: {
        status: "BLOCKED",
        exportReady: false,
        issues: ["AGENT_VALIDATION_NOT_READY"],
        safeDetails: [{ issue: "AGENT_VALIDATION_NOT_READY" }],
      },
    });
    const result = runPackageVerificationPipeline(input);

    expect(result.status).toBe("FAILED");
    expect(result.failures.map((item) => item.code)).toContain("EXPORT_FAILED");
  });

  it("returns FAILED when verification is INVALID", () => {
    const { report } = pipelineArtifacts();
    const invalidReport: PackageVerificationReport = {
      ...report,
      overallStatus: "INVALID",
    };
    const result = runPackageVerificationPipeline(
      validPipelineInput(),
      withDependencies({ verifyPackageArtifact: () => invalidReport }),
    );

    expect(result.status).toBe("FAILED");
    expect(result.failures.map((item) => item.code)).toContain(
      "VERIFICATION_INVALID",
    );
  });

  it("returns INCOMPLETE when verification is UNVERIFIED", () => {
    const { report } = pipelineArtifacts();
    const unverifiedReport: PackageVerificationReport = {
      ...report,
      overallStatus: "UNVERIFIED",
    };
    const result = runPackageVerificationPipeline(
      validPipelineInput(),
      withDependencies({ verifyPackageArtifact: () => unverifiedReport }),
    );

    expect(result.status).toBe("INCOMPLETE");
    expect(result.stages.find((stage) => stage.stage === "EVIDENCE_BUNDLE")?.executed).toBe(true);
  });

  it("returns FAILED when the evidence bundle is INVALID", () => {
    const { bundle } = pipelineArtifacts();
    const invalidBundle: PackageEvidenceBundleBuildResult = {
      ...bundle,
      status: "INVALID",
      bundle: { ...bundle.bundle, status: "INVALID" },
    };
    const result = runPackageVerificationPipeline(
      validPipelineInput(),
      withDependencies({ buildEvidenceBundle: () => invalidBundle }),
    );

    expect(result.status).toBe("FAILED");
    expect(result.failures.map((item) => item.code)).toContain(
      "EVIDENCE_BUNDLE_INVALID",
    );
  });

  it("returns INCOMPLETE when the evidence bundle is INCOMPLETE", () => {
    const { bundle } = pipelineArtifacts();
    const incompleteBundle: PackageEvidenceBundleBuildResult = {
      ...bundle,
      status: "INCOMPLETE",
      bundle: { ...bundle.bundle, status: "INCOMPLETE" },
    };
    const result = runPackageVerificationPipeline(
      validPipelineInput(),
      withDependencies({ buildEvidenceBundle: () => incompleteBundle }),
    );

    expect(result.status).toBe("INCOMPLETE");
    expect(result.failures.map((item) => item.code)).toContain(
      "EVIDENCE_BUNDLE_INCOMPLETE",
    );
  });

  it("returns FAILED for export/report checksum conflicts", () => {
    const { report } = pipelineArtifacts();
    const conflictingReport: PackageVerificationReport = {
      ...report,
      artifactChecksum: "0".repeat(64),
    };
    const result = runPackageVerificationPipeline(
      validPipelineInput(),
      withDependencies({ verifyPackageArtifact: () => conflictingReport }),
    );

    expect(result.status).toBe("FAILED");
    expect(result.failures.map((item) => item.code)).toContain("CHECKSUM_CONFLICT");
  });

  it("returns FAILED for report/bundle checksum conflicts", () => {
    const { bundle } = pipelineArtifacts();
    const conflictingBundle: PackageEvidenceBundleBuildResult = {
      ...bundle,
      bundle: {
        ...bundle.bundle,
        verificationReport: {
          ...bundle.bundle.verificationReport,
          checksum: "0".repeat(64),
        },
      },
    };
    const result = runPackageVerificationPipeline(
      validPipelineInput(),
      withDependencies({ buildEvidenceBundle: () => conflictingBundle }),
    );

    expect(result.status).toBe("FAILED");
    expect(result.failures.map((item) => item.code)).toContain("CHECKSUM_CONFLICT");
  });

  it("returns FAILED for packageId conflicts", () => {
    const { report } = pipelineArtifacts();
    const conflictingReport: PackageVerificationReport = {
      ...report,
      packageId: "pkg.other",
    };
    const result = runPackageVerificationPipeline(
      validPipelineInput(),
      withDependencies({ verifyPackageArtifact: () => conflictingReport }),
    );

    expect(result.status).toBe("FAILED");
    expect(result.failures.map((item) => item.code)).toContain("PACKAGE_ID_CONFLICT");
  });

  it("returns FAILED for packageVersion conflicts", () => {
    const { report } = pipelineArtifacts();
    const conflictingReport: PackageVerificationReport = {
      ...report,
      packageVersion: "2.0.0",
    };
    const result = runPackageVerificationPipeline(
      validPipelineInput(),
      withDependencies({ verifyPackageArtifact: () => conflictingReport }),
    );

    expect(result.status).toBe("FAILED");
    expect(result.failures.map((item) => item.code)).toContain(
      "PACKAGE_VERSION_CONFLICT",
    );
  });

  it("does not return COMPLETED in the first implementation", () => {
    expect(run().status).not.toBe("COMPLETED");
  });

  it("includes Runtime, MCP, and Provider limitations", () => {
    const limitations = run().limitations.join(" ");

    expect(limitations).toContain("Runtime");
    expect(limitations).toContain("MCP");
    expect(limitations).toContain("Provider");
  });

  it("does not treat missing approval as approved", () => {
    const result = run();

    expect(result.status).toBe("COMPLETED_WITH_LIMITATIONS");
    expect(result.references.approval).toBeNull();
    expect(result.limitations).toContain("Approval reference is not present.");
  });

  it("returns FAILED for raw secret input without exposing the value", () => {
    const rawSecret = ["sk", "123456789012345678901234567890"].join("-");
    const input = validPipelineInput({
      profile: {
        ...validExportInput().profile,
        agent: {
          ...validExportInput().profile.agent,
          name: rawSecret,
        },
      } as AgentPackageProfile,
    });
    const result = runPackageVerificationPipeline(input);

    expect(result.status).toBe("FAILED");
    expect(result.failures.map((item) => item.code)).toContain(
      "SECRET_SAFETY_ERROR",
    );
    expect(JSON.stringify(result)).not.toContain(rawSecret);
  });

  it("allows credential references", () => {
    expect(run().status).toBe("COMPLETED_WITH_LIMITATIONS");
  });

  it("does not mutate the input", () => {
    const input = validPipelineInput();
    const before = stableSerializeAgentPackage(input);

    runPackageVerificationPipeline(input);

    expect(stableSerializeAgentPackage(input)).toBe(before);
  });

  it("sets each stage executed and success state accurately", () => {
    const result = run();

    expect(result.stages.map((stage) => [stage.stage, stage.executed, stage.success])).toEqual([
      ["EXPORT", true, true],
      ["VERIFICATION", true, true],
      ["EVIDENCE_BUNDLE", true, true],
    ]);
  });

  it("does not execute downstream stages when export fails", () => {
    const input = validPipelineInput({
      formatVersion: "unsupported" as "bps-agent-profile-artifact-1.0",
    });
    const result = runPackageVerificationPipeline(input);

    expect(result.status).toBe("FAILED");
    expect(result.stages).toEqual([
      expect.objectContaining({ stage: "EXPORT", executed: true, success: false }),
      expect.objectContaining({
        stage: "VERIFICATION",
        executed: false,
        success: false,
      }),
      expect.objectContaining({
        stage: "EVIDENCE_BUNDLE",
        executed: false,
        success: false,
      }),
    ]);
  });

  it("normalizes evidence references by trimming, deduplicating, and sorting", () => {
    const { report } = pipelineArtifacts();
    const evidenceReferences = [
      "  evidence:mcp.dependency-contract  ",
      "evidence:agent.validation-gate",
      "evidence:mcp.dependency-contract",
      "Evidence:mcp.dependency-contract",
    ];
    const result = runPackageVerificationPipeline(
      validPipelineInput(),
      withDependencies({
        verifyPackageArtifact: () => ({
          ...report,
          evidenceReferences,
        }),
      }),
    );
    const bundleStage = result.stages.find(
      (stage) => stage.stage === "EVIDENCE_BUNDLE",
    );

    expect(result.status).toBe("COMPLETED_WITH_LIMITATIONS");
    expect(bundleStage?.warnings).toContain(
      "Evidence references were normalized or deduplicated.",
    );
    expect(result.deterministicSummary.limitations).toContain(
      "Actual MCP Invocation evidence is not present.",
    );
  });
});
