import { describe, expect, it } from "vitest";
import type { PackageApprovalGateResult } from "./package-approval-gate";
import {
  RUNTIME_EXECUTION_REQUEST_FORMAT_VERSION,
  buildRuntimeExecutionRequest,
  type BuildRuntimeExecutionRequestInput,
} from "./runtime-execution-request";

const checksumA = "a".repeat(64);
const checksumB = "b".repeat(64);
const checksumC = "c".repeat(64);
const checksumD = "d".repeat(64);

function approvalGate(
  overrides: Partial<PackageApprovalGateResult> = {},
): PackageApprovalGateResult {
  const base: PackageApprovalGateResult = {
    formatVersion: "buildflow.package-approval-gate.v1",
    packageId: "agent.ai-inquiry",
    packageVersion: "1.0.0",
    evidenceReportReference: {
      reportId: "report.ai-inquiry",
      reportIntegrityChecksum: checksumB,
      reportStatus: "VALID_WITH_LIMITATIONS",
      packageReadiness: "CONDITIONALLY_READY",
    },
    requestReference: {
      approvalRequestId: "approval.request.1",
      integrityChecksum: checksumC,
      requestStatus: "PENDING",
    },
    decisionReferences: [],
    requestedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
    grantedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
    deniedScopes: [],
    pendingScopes: [],
    staleScopes: [],
    revokedScopes: [],
    gateStatus: "APPROVED_WITH_LIMITATIONS",
    authorization: {
      authorizationStatus: "AUTHORIZED_WITH_LIMITATIONS",
      requestedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      grantedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      deniedScopes: [],
      pendingScopes: [],
      staleScopes: [],
      revokedScopes: [],
      reasonCodes: ["ACCEPTED_RISK"],
      limitations: [],
      sourceApprovalReferences: ["approval.request.1"],
    },
    failures: [],
    warnings: [],
    limitations: [],
    deterministicCore: {
      formatVersion: "buildflow.package-approval-gate.v1",
      packageId: "agent.ai-inquiry",
      packageVersion: "1.0.0",
      evidenceReportId: "report.ai-inquiry",
      evidenceReportIntegrityChecksum: checksumB,
      sourceReferences: {
        packageId: "agent.ai-inquiry",
        packageVersion: "1.0.0",
        evidenceReportId: "report.ai-inquiry",
        evidenceReportIntegrityChecksum: checksumB,
        packageArtifactChecksum: checksumA,
        verificationReportChecksum: checksumC,
        evidenceBundleChecksum: checksumD,
        pipelineSummaryChecksum: "e".repeat(64),
      },
      approvalRequestId: "approval.request.1",
      requestIntegrityChecksum: checksumC,
      requestedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      executionScopes: ["RUNTIME_EXECUTION"],
      activeDecisions: [],
      gateStatus: "APPROVED_WITH_LIMITATIONS",
      authorizationStatus: "AUTHORIZED_WITH_LIMITATIONS",
      grantedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      deniedScopes: [],
      pendingScopes: [],
      staleScopes: [],
      revokedScopes: [],
      expirationEvaluation: {
        evaluated: false,
        status: "NOT_EVALUATED",
        evaluationTime: null,
        expiresAt: null,
      },
      failures: [],
      limitations: [],
      packageReadiness: "CONDITIONALLY_READY",
    },
    integrityChecksum: checksumD,
    metadata: {},
  };
  return { ...base, ...overrides };
}

function validInput(
  overrides: Partial<BuildRuntimeExecutionRequestInput> = {},
): BuildRuntimeExecutionRequestInput {
  return {
    approvalGate: approvalGate(),
    requestedExecutionMode: "STANDARD",
    executionProfileReference: {
      referenceId: "runtime-profile.safe",
      integrityChecksum: checksumA,
      referenceType: "runtime-profile",
    },
    runtimePolicyReference: {
      referenceId: "runtime-policy.safe",
      integrityChecksum: checksumB,
    },
    requestedBy: {
      actorType: "USER",
      actorId: "user.reference.1",
      roleReference: "owner",
    },
    inputArtifactReferences: [
      {
        artifactId: "input.bundle",
        artifactType: "package-input",
        integrityChecksum: checksumC,
        mediaType: "application/json",
        storageReference: "artifact://input.bundle",
      },
    ],
    requestedCapabilityReferences: [
      {
        capabilityId: "MCP_CALL",
        policyReference: "policy://mcp-call",
        integrityChecksum: checksumD,
      },
    ],
    expirationPolicy: {
      mode: "EXPLICIT_TIME",
      evaluationTime: "2026-07-17T00:00:00+09:00",
      expiresAt: "2026-07-18T00:00:00+09:00",
    },
    ...overrides,
  };
}

describe("buildRuntimeExecutionRequest", () => {
  it("builds a deterministic Runtime Execution Request", () => {
    const result = buildRuntimeExecutionRequest(validInput());

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") throw new Error("expected valid result");
    expect(result.value.formatVersion).toBe(RUNTIME_EXECUTION_REQUEST_FORMAT_VERSION);
    expect(result.value.approvalBinding.grantedScopes).toEqual([
      "PACKAGE_ACCEPTANCE",
      "RUNTIME_EXECUTION",
    ]);
    expect(result.value.expirationPolicy).toEqual({
      mode: "EXPLICIT_TIME",
      evaluationTime: "2026-07-16T15:00:00.000Z",
      expiresAt: "2026-07-17T15:00:00.000Z",
    });
    expect(result.value.limitations).toEqual([
      "NO_MCP_ATTESTATION",
      "NO_PERSISTENCE_ATTESTATION",
      "NO_PROVIDER_ATTESTATION",
      "NO_RUNTIME_POLICY_ENFORCEMENT",
    ]);
  });

  it("supports DRY_RUN mode and reference-only expiration", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        requestedExecutionMode: "DRY_RUN",
        expirationPolicy: {
          mode: "REFERENCE_ONLY",
          expirationReference: "approval-expiration://safe-reference",
        },
      }),
    );

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") throw new Error("expected valid result");
    expect(result.value.requestedExecutionMode).toBe("DRY_RUN");
    expect(result.value.expirationPolicy).toEqual({
      mode: "REFERENCE_ONLY",
      expirationReference: "approval-expiration://safe-reference",
    });
  });

  it("deduplicates and sorts scopes, artifacts, capabilities, and limitations", () => {
    const gate = approvalGate({
      authorization: {
        ...approvalGate().authorization,
        grantedScopes: [
          "RUNTIME_EXECUTION",
          "PACKAGE_ACCEPTANCE",
          "RUNTIME_EXECUTION",
        ],
      },
    });
    const result = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: gate,
        inputArtifactReferences: [
          {
            artifactId: "z-artifact",
            artifactType: "input",
            integrityChecksum: checksumC,
          },
          {
            artifactId: "a-artifact",
            artifactType: "input",
            integrityChecksum: checksumA,
          },
          {
            artifactId: "a-artifact",
            artifactType: "input",
            integrityChecksum: checksumA,
          },
        ],
        requestedCapabilityReferences: [
          { capabilityId: "Z_CAPABILITY" },
          { capabilityId: "A_CAPABILITY" },
          { capabilityId: "A_CAPABILITY" },
        ],
        limitations: [
          "NO_PROVIDER_ATTESTATION",
          "NO_MCP_ATTESTATION",
          "NO_PROVIDER_ATTESTATION",
        ],
      }),
    );

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") throw new Error("expected valid result");
    expect(result.value.inputArtifactReferences.map((item) => item.artifactId)).toEqual([
      "a-artifact",
      "z-artifact",
    ]);
    expect(result.value.requestedCapabilityReferences.map((item) => item.capabilityId)).toEqual([
      "A_CAPABILITY",
      "Z_CAPABILITY",
    ]);
    expect(result.value.limitations).toEqual([
      "NO_MCP_ATTESTATION",
      "NO_PERSISTENCE_ATTESTATION",
      "NO_PROVIDER_ATTESTATION",
      "NO_RUNTIME_POLICY_ENFORCEMENT",
    ]);
  });

  it("is deterministic regardless of scope, artifact, and capability ordering", () => {
    const first = buildRuntimeExecutionRequest(validInput());
    const second = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: approvalGate({
          authorization: {
            ...approvalGate().authorization,
            grantedScopes: ["RUNTIME_EXECUTION", "PACKAGE_ACCEPTANCE"],
          },
        }),
        inputArtifactReferences: [...validInput().inputArtifactReferences!].reverse(),
        requestedCapabilityReferences: [
          ...validInput().requestedCapabilityReferences!,
        ].reverse(),
      }),
    );

    expect(first.status).toBe("VALID");
    expect(second.status).toBe("VALID");
    if (first.status !== "VALID" || second.status !== "VALID") {
      throw new Error("expected valid results");
    }
    expect(first.value.runtimeExecutionRequestId).toBe(
      second.value.runtimeExecutionRequestId,
    );
    expect(first.value.integrityChecksum).toBe(second.value.integrityChecksum);
  });

  it("rejects missing RUNTIME_EXECUTION scope", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: approvalGate({
          authorization: {
            ...approvalGate().authorization,
            grantedScopes: ["PACKAGE_ACCEPTANCE"],
          },
        }),
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "AUTHORIZATION_SCOPE_MISSING",
    );
    expect("value" in result).toBe(false);
  });

  it("rejects unknown approval scopes", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: approvalGate({
          authorization: {
            ...approvalGate().authorization,
            grantedScopes: ["RUNTIME_EXECUTION", "UNKNOWN_SCOPE" as never],
          },
        }),
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "AUTHORIZATION_BINDING_INVALID",
    );
  });

  it("rejects non-approved gate or authorization status", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: approvalGate({
          gateStatus: "PENDING_APPROVAL",
          authorization: {
            ...approvalGate().authorization,
            authorizationStatus: "PENDING",
          },
        }),
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "AUTHORIZATION_BINDING_INVALID",
    );
  });

  it("rejects stale or revoked authorization state", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: approvalGate({
          staleScopes: ["RUNTIME_EXECUTION"],
        }),
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "AUTHORIZATION_BINDING_INVALID",
    );
  });

  it("rejects package binding mismatch against approval source", () => {
    const gate = approvalGate();
    const result = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: {
          ...gate,
          packageId: "agent.other",
        },
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "PACKAGE_BINDING_MISMATCH",
    );
  });

  it("rejects package version mismatch and malformed package artifact checksum", () => {
    const gate = approvalGate();
    const versionMismatch = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: {
          ...gate,
          packageVersion: "2.0.0",
        },
      }),
    );
    const malformedChecksum = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: {
          ...gate,
          deterministicCore: {
            ...gate.deterministicCore,
            sourceReferences: {
              ...gate.deterministicCore.sourceReferences!,
              packageArtifactChecksum: "not-a-checksum",
            },
          },
        },
      }),
    );

    expect(versionMismatch.status).toBe("INVALID");
    if (versionMismatch.status !== "INVALID") {
      throw new Error("expected invalid result");
    }
    expect(versionMismatch.failures.map((item) => item.code)).toContain(
      "PACKAGE_BINDING_MISMATCH",
    );
    expect(malformedChecksum.status).toBe("INVALID");
    if (malformedChecksum.status !== "INVALID") {
      throw new Error("expected invalid result");
    }
    expect(malformedChecksum.failures.map((item) => item.code)).toContain(
      "ARTIFACT_INTEGRITY_ERROR",
    );
  });

  it("rejects evidence binding mismatch against approval source", () => {
    const gate = approvalGate();
    const result = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: {
          ...gate,
          evidenceReportReference: {
            ...gate.evidenceReportReference,
            reportId: "report.other",
          },
        },
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "EVIDENCE_BINDING_MISMATCH",
    );
  });

  it("rejects evidence checksum mismatch and malformed evidence checksum", () => {
    const gate = approvalGate();
    const checksumMismatch = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: {
          ...gate,
          evidenceReportReference: {
            ...gate.evidenceReportReference,
            reportIntegrityChecksum: checksumA,
          },
        },
      }),
    );
    const malformedChecksum = buildRuntimeExecutionRequest(
      validInput({
        approvalGate: {
          ...gate,
          evidenceReportReference: {
            ...gate.evidenceReportReference,
            reportIntegrityChecksum: "not-a-checksum",
          },
        },
      }),
    );

    expect(checksumMismatch.status).toBe("INVALID");
    if (checksumMismatch.status !== "INVALID") {
      throw new Error("expected invalid result");
    }
    expect(checksumMismatch.failures.map((item) => item.code)).toContain(
      "EVIDENCE_BINDING_MISMATCH",
    );
    expect(malformedChecksum.status).toBe("INVALID");
    if (malformedChecksum.status !== "INVALID") {
      throw new Error("expected invalid result");
    }
    expect(malformedChecksum.failures.map((item) => item.code)).toContain(
      "ARTIFACT_INTEGRITY_ERROR",
    );
  });

  it("rejects unsupported execution mode", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({ requestedExecutionMode: "VALIDATION_ONLY" as never }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "RUNTIME_REQUEST_INVALID",
    );
  });

  it("changes request id and checksum when execution mode, actor, or references change", () => {
    const base = buildRuntimeExecutionRequest(validInput());
    const dryRun = buildRuntimeExecutionRequest(
      validInput({ requestedExecutionMode: "DRY_RUN" }),
    );
    const differentActor = buildRuntimeExecutionRequest(
      validInput({
        requestedBy: {
          actorType: "SERVICE",
          actorId: "service.reference.1",
        },
      }),
    );
    const differentReference = buildRuntimeExecutionRequest(
      validInput({
        executionProfileReference: {
          referenceId: "runtime-profile.other",
          integrityChecksum: checksumA,
        },
      }),
    );

    expect(base.status).toBe("VALID");
    expect(dryRun.status).toBe("VALID");
    expect(differentActor.status).toBe("VALID");
    expect(differentReference.status).toBe("VALID");
    if (
      base.status !== "VALID" ||
      dryRun.status !== "VALID" ||
      differentActor.status !== "VALID" ||
      differentReference.status !== "VALID"
    ) {
      throw new Error("expected valid results");
    }
    expect(base.value.runtimeExecutionRequestId).not.toBe(
      dryRun.value.runtimeExecutionRequestId,
    );
    expect(base.value.integrityChecksum).not.toBe(dryRun.value.integrityChecksum);
    expect(base.value.runtimeExecutionRequestId).not.toBe(
      differentActor.value.runtimeExecutionRequestId,
    );
    expect(base.value.runtimeExecutionRequestId).not.toBe(
      differentReference.value.runtimeExecutionRequestId,
    );
  });

  it("rejects secret-like values without returning a request id or checksum", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        executionProfileReference: {
          referenceId: "https://storage.example.test/artifact?token=forbidden-reference",
        },
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures).toEqual([
      expect.objectContaining({ code: "SECRET_SAFETY_ERROR" }),
    ]);
    expect(JSON.stringify(result)).not.toContain("forbidden-reference");
    expect(JSON.stringify(result)).not.toContain("runtimeExecutionRequestId");
    expect(JSON.stringify(result)).not.toContain("integrityChecksum");
  });

  it("rejects forbidden credential and connection key names without blocking safe references", () => {
    const safe = buildRuntimeExecutionRequest(
      validInput({
        executionProfileReference: {
          referenceId: "credentialReferenceId.safe-reference",
        },
      }),
    );
    const unsafe = buildRuntimeExecutionRequest(
      validInput({
        runtimePolicyReference: {
          referenceId: "runtime-policy",
          connectionString: "postgresql://user:pass@example.test/db" as never,
        } as never,
      }),
    );

    expect(safe.status).toBe("VALID");
    expect(unsafe.status).toBe("INVALID");
    if (unsafe.status !== "INVALID") throw new Error("expected invalid result");
    expect(unsafe.failures.map((item) => item.code)).toContain("SECRET_SAFETY_ERROR");
    expect(JSON.stringify(unsafe)).not.toContain("postgresql://");
  });

  it("rejects forbidden payload keys", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        inputArtifactReferences: [
          {
            artifactId: "artifact",
            artifactType: "input",
            integrityChecksum: checksumA,
            providerResponse: "raw body" as never,
          } as never,
        ],
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain("SECRET_SAFETY_ERROR");
    expect(JSON.stringify(result)).not.toContain("raw body");
  });

  it("rejects duplicate artifact id with different checksum", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        inputArtifactReferences: [
          {
            artifactId: "artifact",
            artifactType: "input",
            integrityChecksum: checksumA,
          },
          {
            artifactId: "artifact",
            artifactType: "input",
            integrityChecksum: checksumB,
          },
        ],
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "DUPLICATE_ARTIFACT_CONFLICT",
    );
  });

  it("rejects duplicate artifact id and checksum with conflicting metadata", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        inputArtifactReferences: [
          {
            artifactId: "artifact",
            artifactType: "input",
            integrityChecksum: checksumA,
          },
          {
            artifactId: "artifact",
            artifactType: "different-input",
            integrityChecksum: checksumA,
          },
        ],
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "DUPLICATE_ARTIFACT_CONFLICT",
    );
  });

  it("rejects duplicate capability id with different policy reference", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        requestedCapabilityReferences: [
          { capabilityId: "MCP_CALL", policyReference: "policy://one" },
          { capabilityId: "MCP_CALL", policyReference: "policy://two" },
        ],
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "DUPLICATE_CAPABILITY_CONFLICT",
    );
  });

  it("rejects expired explicit-time requests", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        expirationPolicy: {
          mode: "EXPLICIT_TIME",
          evaluationTime: "2026-07-18T00:00:00.000Z",
          expiresAt: "2026-07-18T00:00:00.000Z",
        },
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "RUNTIME_REQUEST_EXPIRED",
    );
  });

  it("rejects invalid explicit time values", () => {
    const result = buildRuntimeExecutionRequest(
      validInput({
        expirationPolicy: {
          mode: "EXPLICIT_TIME",
          evaluationTime: "not-a-date",
          expiresAt: "also-not-a-date",
        },
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures.map((item) => item.code)).toContain(
      "EXPIRATION_POLICY_INVALID",
    );
  });

  it("rejects date-only and impossible explicit time values", () => {
    const dateOnly = buildRuntimeExecutionRequest(
      validInput({
        expirationPolicy: {
          mode: "EXPLICIT_TIME",
          evaluationTime: "2026-07-17",
          expiresAt: "2026-07-18T00:00:00.000Z",
        },
      }),
    );
    const impossibleDate = buildRuntimeExecutionRequest(
      validInput({
        expirationPolicy: {
          mode: "EXPLICIT_TIME",
          evaluationTime: "2026-02-30T00:00:00.000Z",
          expiresAt: "2026-07-18T00:00:00.000Z",
        },
      }),
    );

    expect(dateOnly.status).toBe("INVALID");
    expect(impossibleDate.status).toBe("INVALID");
    if (dateOnly.status !== "INVALID" || impossibleDate.status !== "INVALID") {
      throw new Error("expected invalid results");
    }
    expect(dateOnly.failures.map((item) => item.code)).toContain(
      "EXPIRATION_POLICY_INVALID",
    );
    expect(impossibleDate.failures.map((item) => item.code)).toContain(
      "EXPIRATION_POLICY_INVALID",
    );
  });

  it("does not mutate nested input objects", () => {
    const input = validInput();
    const before = JSON.stringify(input);

    buildRuntimeExecutionRequest(input);

    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not include payload sentinel fields in a successful request", () => {
    const result = buildRuntimeExecutionRequest(validInput());

    expect(result.status).toBe("VALID");
    expect(JSON.stringify(result)).not.toContain("providerRequest");
    expect(JSON.stringify(result)).not.toContain("providerResponse");
    expect(JSON.stringify(result)).not.toContain("mcpRequest");
    expect(JSON.stringify(result)).not.toContain("mcpResponse");
    expect(JSON.stringify(result)).not.toContain("rawLogs");
    expect(JSON.stringify(result)).not.toContain("authClaims");
    expect(JSON.stringify(result)).not.toContain("environmentVariables");
    expect(JSON.stringify(result)).not.toContain("prompt");
    expect(JSON.stringify(result)).not.toContain("privateInput");
  });

  it("sanitizes unexpected internal errors", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const result = buildRuntimeExecutionRequest(
      validInput({
        executionProfileReference: circular as never,
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid result");
    expect(result.failures).toEqual([
      expect.objectContaining({
        code: "INTERNAL_RUNTIME_EXECUTION_REQUEST_ERROR",
      }),
    ]);
    expect(JSON.stringify(result)).not.toContain("Converting circular structure");
    expect(JSON.stringify(result)).not.toContain("stack");
  });

  it("does not infer runtime, provider, deployment, or marketplace success", () => {
    const result = buildRuntimeExecutionRequest(validInput());

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") throw new Error("expected valid result");
    expect(JSON.stringify(result.value)).not.toContain("STARTED");
    expect(JSON.stringify(result.value)).not.toContain("COMPLETED");
    expect(JSON.stringify(result.value)).not.toContain("DEPLOYED");
    expect(JSON.stringify(result.value)).not.toContain("MARKETPLACE");
  });
});
