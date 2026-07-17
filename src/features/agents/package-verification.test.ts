import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sampleMcpServerDefinition, type McpToolDefinition } from "../mcp";
import { exportAgentPackageArtifact, stableSerializeAgentPackage } from "./package-export";
import {
  createAgentPackageProfile,
  validateAgentPackageReadiness,
  type AgentPackageProfile,
  type AgentPackageReadinessResult,
} from "./package-profile";
import { verifyAgentPackageArtifact } from "./package-verification";
import { resolveAgentToolRequirements } from "./tool-resolution";
import { aiInquiryV1AgentBlueprint } from "./types";
import { definitionFromBlueprint } from "./validator";
import { validateAgentReadiness } from "./validation-gate";

const baseTool = sampleMcpServerDefinition.tools[0];

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

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

function validExportArtifact() {
  const tool = toolWith();
  const definition = definitionFromBlueprint({
    projectId: "agent-package-verification-project",
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

  return exportAgentPackageArtifact({
    formatVersion: "bps-agent-profile-artifact-1.0",
    profile,
    readiness,
  });
}

function artifactWithPayload(
  artifact = validExportArtifact(),
  payload: string,
) {
  return {
    ...artifact,
    metadata: {
      ...artifact.metadata,
      checksumSha256: sha256(payload),
      byteLength: Buffer.byteLength(payload),
    },
    payload,
  };
}

function parsedArtifact(artifact = validExportArtifact()) {
  return JSON.parse(artifact.payload) as {
    formatVersion: "bps-agent-profile-artifact-1.0";
    profile: AgentPackageProfile;
    readiness: AgentPackageReadinessResult;
  };
}

describe("agent package verification", () => {
  it("returns VERIFIED_WITH_LIMITATIONS for a valid deterministic artifact", () => {
    const report = verifyAgentPackageArtifact(validExportArtifact());

    expect(report.reportFormatVersion).toBe(
      "buildflow.package-verification-report.v1",
    );
    expect(report.overallStatus).toBe("VERIFIED_WITH_LIMITATIONS");
    expect(report.packageId).toBe("pkg.ai-inquiry-agent");
    expect(report.failures).toEqual([]);
  });

  it("produces the same deterministic core for the same artifact", () => {
    const artifact = validExportArtifact();
    const first = verifyAgentPackageArtifact(artifact, {
      generatedAt: "2026-07-17T00:00:00.000Z",
    });
    const second = verifyAgentPackageArtifact(artifact, {
      generatedAt: "2026-07-18T00:00:00.000Z",
    });

    expect(first.deterministicCore).toEqual(second.deterministicCore);
  });

  it("produces the same report integrity checksum for the same artifact", () => {
    const artifact = validExportArtifact();

    expect(verifyAgentPackageArtifact(artifact).reportIntegrityChecksum).toBe(
      verifyAgentPackageArtifact(artifact).reportIntegrityChecksum,
    );
  });

  it("returns INVALID with INTEGRITY_ERROR for checksum mismatch", () => {
    const artifact = validExportArtifact();
    const report = verifyAgentPackageArtifact({
      ...artifact,
      metadata: {
        ...artifact.metadata,
        checksumSha256: "0".repeat(64),
      },
    });

    expect(report.overallStatus).toBe("INVALID");
    expect(report.failures.map((failure) => failure.code)).toContain(
      "INTEGRITY_ERROR",
    );
  });

  it("returns INVALID with INTEGRITY_ERROR for byte length mismatch", () => {
    const artifact = validExportArtifact();
    const report = verifyAgentPackageArtifact({
      ...artifact,
      metadata: {
        ...artifact.metadata,
        byteLength: artifact.metadata.byteLength + 1,
      },
    });

    expect(report.overallStatus).toBe("INVALID");
    expect(report.failures.map((failure) => failure.code)).toContain(
      "INTEGRITY_ERROR",
    );
  });

  it("returns INVALID with VERSION_UNSUPPORTED for unsupported format version", () => {
    const artifact = validExportArtifact();
    const report = verifyAgentPackageArtifact({
      ...artifact,
      metadata: {
        ...artifact.metadata,
        formatVersion: "unsupported" as "bps-agent-profile-artifact-1.0",
      },
    });

    expect(report.overallStatus).toBe("INVALID");
    expect(report.failures.map((failure) => failure.code)).toContain(
      "VERSION_UNSUPPORTED",
    );
  });

  it("returns INVALID with FORMAT_ERROR for malformed JSON", () => {
    const report = verifyAgentPackageArtifact(
      artifactWithPayload(validExportArtifact(), "{not-json"),
    );

    expect(report.overallStatus).toBe("INVALID");
    expect(report.failures.map((failure) => failure.code)).toContain(
      "FORMAT_ERROR",
    );
  });

  it("returns INVALID with CONTRACT_ERROR for invalid Package/Profile shape", () => {
    const parsed = parsedArtifact();
    const invalidProfile = { ...parsed.profile } as Record<string, unknown>;
    delete invalidProfile.packageId;
    const payload = stableSerializeAgentPackage({
      ...parsed,
      profile: invalidProfile,
    });
    const report = verifyAgentPackageArtifact(artifactWithPayload(undefined, payload));

    expect(report.overallStatus).toBe("INVALID");
    expect(report.failures.map((failure) => failure.code)).toContain(
      "CONTRACT_ERROR",
    );
  });

  it("returns INVALID with READINESS_ERROR for not-ready artifacts", () => {
    const parsed = parsedArtifact();
    const payload = stableSerializeAgentPackage({
      ...parsed,
      readiness: {
        status: "BLOCKED",
        exportReady: false,
        issues: ["AGENT_VALIDATION_NOT_READY"],
        safeDetails: [{ issue: "AGENT_VALIDATION_NOT_READY" }],
      },
    });
    const report = verifyAgentPackageArtifact(artifactWithPayload(undefined, payload));

    expect(report.overallStatus).toBe("INVALID");
    expect(report.failures.map((failure) => failure.code)).toContain(
      "READINESS_ERROR",
    );
  });

  it("returns INVALID with SECRET_SAFETY_ERROR for raw secrets", () => {
    const parsed = parsedArtifact();
    const rawSecret = ["sk", "123456789012345678901234567890"].join("-");
    const payload = stableSerializeAgentPackage({
      ...parsed,
      profile: {
        ...parsed.profile,
        agent: {
          ...parsed.profile.agent,
          name: rawSecret,
        },
      },
    });
    const report = verifyAgentPackageArtifact(artifactWithPayload(undefined, payload));

    expect(report.overallStatus).toBe("INVALID");
    expect(report.failures.map((failure) => failure.code)).toContain(
      "SECRET_SAFETY_ERROR",
    );
    expect(JSON.stringify(report.failures)).not.toContain(rawSecret);
  });

  it("allows credential references without raw credential values", () => {
    const report = verifyAgentPackageArtifact(validExportArtifact());

    expect(report.secretSafety).toEqual({
      status: "PASS",
      rawSecretDetected: false,
      credentialValueDetected: false,
      credentialReferencesAllowed: true,
    });
  });

  it("returns INVALID with EVIDENCE_MISSING for missing required evidence references", () => {
    const parsed = parsedArtifact();
    const payload = stableSerializeAgentPackage({
      ...parsed,
      profile: {
        ...parsed.profile,
        verificationRules: parsed.profile.verificationRules.filter(
          (rule) => rule.id !== "export.secret-free",
        ),
      },
    });
    const report = verifyAgentPackageArtifact(artifactWithPayload(undefined, payload));

    expect(report.overallStatus).toBe("INVALID");
    expect(report.failures.map((failure) => failure.code)).toContain(
      "EVIDENCE_MISSING",
    );
  });

  it("includes limitations for runtime, MCP, and Marketplace evidence", () => {
    const report = verifyAgentPackageArtifact(validExportArtifact());
    const limitations = report.limitations.join(" ");

    expect(limitations).toContain("Runtime execution has not been verified.");
    expect(limitations).toContain("Actual MCP Tool Invocation has not been verified.");
    expect(limitations).toContain("Marketplace publish readiness has not been verified.");
  });

  it("marks approval as required", () => {
    expect(verifyAgentPackageArtifact(validExportArtifact()).approvalRequired).toBe(
      true,
    );
  });

  it("sets approvalStatus to PENDING", () => {
    expect(verifyAgentPackageArtifact(validExportArtifact()).approvalStatus).toBe(
      "PENDING",
    );
  });

  it("does not return VERIFIED in the first verifier implementation", () => {
    expect(verifyAgentPackageArtifact(validExportArtifact()).overallStatus).not.toBe(
      "VERIFIED",
    );
  });

  it("does not mutate the input artifact", () => {
    const artifact = validExportArtifact();
    const before = JSON.stringify(artifact);

    verifyAgentPackageArtifact(artifact);

    expect(JSON.stringify(artifact)).toBe(before);
  });

  it("does not expose raw secret values in failure messages", () => {
    const parsed = parsedArtifact();
    const rawSecret = ["ghp", "123456789012345678901234567890"].join("_");
    const payload = stableSerializeAgentPackage({
      ...parsed,
      profile: {
        ...parsed.profile,
        credentials: [
          ...parsed.profile.credentials,
          {
            id: "unsafe",
            provider: "gmail.mcp",
            required: true,
            referenceOnly: true,
            scopes: [],
            accessToken: rawSecret,
          },
        ],
      },
    });
    const report = verifyAgentPackageArtifact(artifactWithPayload(undefined, payload));

    expect(report.overallStatus).toBe("INVALID");
    expect(JSON.stringify(report)).not.toContain(rawSecret);
  });
});
