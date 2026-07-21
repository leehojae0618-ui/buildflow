import { describe, expect, it } from "vitest";
import type { PackageApprovalGateResult } from "./package-approval-gate";
import { stableSerializeAgentPackage } from "./package-export";
import { buildRuntimeExecutionRequest } from "./runtime-execution-request";
import {
  RUNTIME_EXECUTION_START_FORMAT_VERSION,
  RUNTIME_PREFLIGHT_RESULT_FORMAT_VERSION,
  buildRuntimeExecutionStart,
  buildRuntimePreflightResult,
  type BuildRuntimePreflightInput,
  type RuntimeApprovalStatusSnapshot,
  type RuntimeCapabilityReadinessSnapshot,
  type RuntimeConnectionReadinessSnapshot,
  type RuntimeCredentialReadinessSnapshot,
  type RuntimeExecutionStart,
  type RuntimeIdempotencySnapshot,
  type RuntimeMcpReadinessSnapshot,
  type RuntimePreflightResult,
  type RuntimeProviderReadinessSnapshot,
} from "./runtime-execution-start";

const checksumA = "a".repeat(64);
const checksumB = "b".repeat(64);
const checksumC = "c".repeat(64);
const checksumD = "d".repeat(64);
const checksumE = "e".repeat(64);
const checksumF = "f".repeat(64);

function approvalGate(): PackageApprovalGateResult {
  return {
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
        pipelineSummaryChecksum: checksumE,
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
}

function runtimeRequest() {
  const result = buildRuntimeExecutionRequest({
    approvalGate: approvalGate(),
    requestedExecutionMode: "STANDARD",
    executionProfileReference: {
      referenceId: "runtime-profile.agent-v1",
      integrityChecksum: checksumA,
    },
    runtimePolicyReference: {
      referenceId: "runtime-policy.agent-v1",
      integrityChecksum: checksumB,
    },
    requestedBy: {
      actorType: "USER",
      actorId: "user.reference.1",
    },
    inputArtifactReferences: [
      {
        artifactId: "agent-package",
        artifactType: "agent-package-profile",
        integrityChecksum: checksumC,
      },
    ],
    requestedCapabilityReferences: [
      {
        capabilityId: "AI_INQUIRY_RESPONSE",
        integrityChecksum: checksumD,
      },
    ],
    expirationPolicy: {
      mode: "EXPLICIT_TIME",
      evaluationTime: "2026-07-17T00:00:00+09:00",
      expiresAt: "2026-07-18T00:00:00+09:00",
    },
  });
  if (result.status !== "VALID") throw new Error("expected runtime request");
  return result.value;
}

function validApprovalSnapshot(
  request = runtimeRequest(),
): RuntimeApprovalStatusSnapshot {
  return {
    approvalReferenceId: request.approvalBinding.approvalRequestId,
    status: "APPROVED",
    scopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
    packageBinding: request.packageBinding,
    evidenceBinding: request.evidenceBinding,
    runtimeExecutionRequestBinding: {
      runtimeExecutionRequestId: request.runtimeExecutionRequestId,
      integrityChecksum: request.integrityChecksum,
    },
    approvedAt: "2026-07-17T00:00:00Z",
    checksum: checksumA,
  };
}

const connected: RuntimeConnectionReadinessSnapshot = {
  connectionReferenceId: "connection.github",
  serviceReference: "github",
  grantedCapabilityReferences: ["AI_INQUIRY_RESPONSE"],
  status: "CONNECTED",
  checksum: checksumB,
};

const activeCredential: RuntimeCredentialReadinessSnapshot = {
  credentialReferenceId: "credential.github",
  connectionReferenceId: "connection.github",
  status: "ACTIVE",
  checksum: checksumC,
};

const availableCapability: RuntimeCapabilityReadinessSnapshot = {
  capabilityReferenceId: "AI_INQUIRY_RESPONSE",
  supportedByBlock: true,
  supportedByTool: true,
  grantedByConnection: true,
  permittedByPolicy: true,
  coveredByApproval: true,
  status: "AVAILABLE",
  checksum: checksumD,
};

const providerReady: RuntimeProviderReadinessSnapshot = {
  providerReference: "openai",
  modelReference: "gpt-test",
  status: "READY",
  checksum: checksumE,
};

const mcpReady: RuntimeMcpReadinessSnapshot = {
  mcpServerReference: "mcp.gmail",
  mcpToolSnapshotReference: "tool.gmail.send",
  toolDefinitionChecksum: checksumF,
  status: "READY",
  checksum: checksumF,
};

function validIdempotency(request = runtimeRequest()): RuntimeIdempotencySnapshot {
  return {
    runtimeExecutionRequestId: request.runtimeExecutionRequestId,
    status: "AVAILABLE",
    evaluatedAt: "2026-07-17T00:00:00Z",
    checksum: checksumD,
  };
}

function validPreflightInput(
  overrides: Partial<BuildRuntimePreflightInput> = {},
): BuildRuntimePreflightInput {
  const request = overrides.runtimeExecutionRequest ?? runtimeRequest();
  return {
    runtimeExecutionRequest: request,
    approvalStatusSnapshot: validApprovalSnapshot(request),
    connectionReadinessSnapshots: [connected],
    credentialReadinessSnapshots: [activeCredential],
    capabilityReadinessSnapshots: [availableCapability],
    providerReadinessSnapshots: [providerReady],
    mcpReadinessSnapshots: [mcpReady],
    runtimePolicySnapshot: {
      runtimePolicyReference: request.runtimePolicyReference!,
      status: "ACTIVE",
      allowedExecutionModes: ["STANDARD"],
      checksum: checksumE,
    },
    cancellationSnapshot: {
      runtimeExecutionRequestId: request.runtimeExecutionRequestId,
      status: "NONE",
      checksum: checksumF,
    },
    idempotencySnapshot: validIdempotency(request),
    evaluatedAt: "2026-07-17T01:00:00+09:00",
    ...overrides,
  };
}

function readyPreflight(): RuntimePreflightResult {
  const result = buildRuntimePreflightResult(validPreflightInput());
  if (result.status !== "VALID") throw new Error("expected preflight");
  return result.value;
}

function validStart(): RuntimeExecutionStart {
  const request = runtimeRequest();
  const preflight = buildRuntimePreflightResult(validPreflightInput({ runtimeExecutionRequest: request }));
  if (preflight.status !== "VALID") throw new Error("expected preflight");
  const result = buildRuntimeExecutionStart({
    runtimeExecutionRequest: request,
    runtimePreflightResult: preflight.value,
    executionIntent: "INITIAL",
    executionSequence: "sequence-001",
    initiatedByActorReference: {
      actorType: "USER",
      actorId: "user.reference.1",
    },
    startedAt: "2026-07-17T01:10:00+09:00",
  });
  if (result.status !== "VALID") throw new Error("expected start");
  return result.value;
}

describe("buildRuntimePreflightResult", () => {
  it("builds a deterministic READY preflight result from safe snapshots", () => {
    const first = buildRuntimePreflightResult(validPreflightInput());
    const second = buildRuntimePreflightResult(validPreflightInput());

    expect(first.status).toBe("VALID");
    expect(second.status).toBe("VALID");
    if (first.status !== "VALID" || second.status !== "VALID") {
      throw new Error("expected valid preflight");
    }
    expect(first.value.formatVersion).toBe(RUNTIME_PREFLIGHT_RESULT_FORMAT_VERSION);
    expect(first.value.preflightStatus).toBe("READY");
    expect(first.value.runtimePreflightResultId).toBe(second.value.runtimePreflightResultId);
    expect(first.value.integrityChecksum).toBe(second.value.integrityChecksum);
    expect(first.value.limitationCodes).toContain("NO_LIVE_CREDENTIAL_ATTESTATION");
  });

  it("returns VALID with WAITING_FOR_CONNECTION when a connection is not ready", () => {
    const result = buildRuntimePreflightResult(
      validPreflightInput({
        connectionReadinessSnapshots: [
          { ...connected, status: "DISCONNECTED", checksum: checksumB },
        ],
      }),
    );

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") throw new Error("expected valid preflight");
    expect(result.value.preflightStatus).toBe("WAITING_FOR_CONNECTION");
    expect(result.value.safeFailureCodes).toContain("PREFLIGHT_CONNECTION_NOT_READY");
  });

  it("returns VALID with WAITING_FOR_CREDENTIAL when a credential is expired", () => {
    const result = buildRuntimePreflightResult(
      validPreflightInput({
        credentialReadinessSnapshots: [
          { ...activeCredential, status: "EXPIRED", checksum: checksumC },
        ],
      }),
    );

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") throw new Error("expected valid preflight");
    expect(result.value.preflightStatus).toBe("WAITING_FOR_CREDENTIAL");
    expect(result.value.safeFailureCodes).toContain("PREFLIGHT_CREDENTIAL_EXPIRED");
  });

  it("returns VALID with WAITING_FOR_APPROVAL for missing runtime approval scope", () => {
    const result = buildRuntimePreflightResult(
      validPreflightInput({
        approvalStatusSnapshot: {
          ...validApprovalSnapshot(),
          scopes: ["PACKAGE_ACCEPTANCE"],
          checksum: checksumA,
        },
      }),
    );

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") throw new Error("expected valid preflight");
    expect(result.value.preflightStatus).toBe("WAITING_FOR_APPROVAL");
    expect(result.value.safeFailureCodes).toContain("PREFLIGHT_APPROVAL_SCOPE_MISSING");
  });

  it("blocks when provider, MCP, capability, or policy snapshots are not ready", () => {
    const result = buildRuntimePreflightResult(
      validPreflightInput({
        capabilityReadinessSnapshots: [
          {
            ...availableCapability,
            status: "TOOL_DEFINITION_CHANGED",
            supportedByTool: false,
          },
        ],
        providerReadinessSnapshots: [{ ...providerReady, status: "DEGRADED" }],
        mcpReadinessSnapshots: [{ ...mcpReady, status: "TOOL_DEFINITION_CHANGED" }],
        runtimePolicySnapshot: {
          ...validPreflightInput().runtimePolicySnapshot!,
          allowedExecutionModes: ["DRY_RUN"],
        },
      }),
    );

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") throw new Error("expected valid preflight");
    expect(result.value.preflightStatus).toBe("BLOCKED");
    expect(result.value.safeFailureCodes).toEqual(
      expect.arrayContaining([
        "PREFLIGHT_CAPABILITY_UNAVAILABLE",
        "PREFLIGHT_EXECUTION_MODE_DENIED",
        "PREFLIGHT_MCP_TOOL_DEFINITION_CHANGED",
        "PREFLIGHT_PROVIDER_NOT_READY",
      ]),
    );
  });

  it("marks cancellation and idempotency conflicts as non-ready statuses", () => {
    const cancelled = buildRuntimePreflightResult(
      validPreflightInput({
        cancellationSnapshot: {
          runtimeExecutionRequestId: runtimeRequest().runtimeExecutionRequestId,
          status: "REQUESTED",
          checksum: checksumF,
        },
      }),
    );
    expect(cancelled.status).toBe("VALID");
    if (cancelled.status !== "VALID") throw new Error("expected valid preflight");
    expect(cancelled.value.preflightStatus).toBe("CANCELLED");

    const request = runtimeRequest();
    const conflict = buildRuntimePreflightResult(
      validPreflightInput({
        runtimeExecutionRequest: request,
        idempotencySnapshot: {
          ...validIdempotency(request),
          status: "CONFLICT",
        },
      }),
    );
    expect(conflict.status).toBe("VALID");
    if (conflict.status !== "VALID") throw new Error("expected valid preflight");
    expect(conflict.value.preflightStatus).toBe("BLOCKED");
    expect(conflict.value.safeFailureCodes).toContain("PREFLIGHT_IDEMPOTENCY_CONFLICT");
  });

  it("rejects malformed checksums, duplicate conflicts, and tampered request integrity", () => {
    const request = {
      ...runtimeRequest(),
      integrityChecksum: checksumA,
    };
    const result = buildRuntimePreflightResult(
      validPreflightInput({
        runtimeExecutionRequest: request,
        approvalStatusSnapshot: validApprovalSnapshot(request),
        connectionReadinessSnapshots: [
          connected,
          { ...connected, checksum: checksumC },
        ],
        credentialReadinessSnapshots: [
          { ...activeCredential, checksum: "not-a-checksum" },
        ],
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid preflight");
    expect(result.failures.map((failure) => failure.code)).toEqual(
      expect.arrayContaining(["PREFLIGHT_REQUEST_INVALID", "PREFLIGHT_SNAPSHOT_INVALID"]),
    );
  });

  it("rejects secret-like values without echoing them", () => {
    const rawSecret = `sk-${"x".repeat(32)}`;
    const result = buildRuntimePreflightResult({
      ...validPreflightInput(),
      connectionReadinessSnapshots: [
        {
          ...connected,
          serviceReference: rawSecret,
        },
      ],
    });

    expect(result.status).toBe("INVALID");
    expect(JSON.stringify(result)).not.toContain(rawSecret);
  });

  it("does not mutate the caller input", () => {
    const input = validPreflightInput();
    const before = stableSerializeAgentPackage(input);
    buildRuntimePreflightResult(input);
    expect(stableSerializeAgentPackage(input)).toBe(before);
  });
});

describe("buildRuntimeExecutionStart", () => {
  it("creates a deterministic READY execution start without starting runtime work", () => {
    const first = validStart();
    const second = validStart();

    expect(first.formatVersion).toBe(RUNTIME_EXECUTION_START_FORMAT_VERSION);
    expect(first.initialRuntimeStatus).toBe("READY");
    expect(first.runtimeExecutionId).toBe(second.runtimeExecutionId);
    expect(first.runtimeExecutionStartId).toBe(second.runtimeExecutionStartId);
    expect(stableSerializeAgentPackage(first)).not.toContain("RUNNING");
  });

  it("rejects non-ready preflight results", () => {
    const request = runtimeRequest();
    const preflight = buildRuntimePreflightResult(
      validPreflightInput({
        runtimeExecutionRequest: request,
        connectionReadinessSnapshots: [
          { ...connected, status: "DISCONNECTED" },
        ],
      }),
    );
    if (preflight.status !== "VALID") throw new Error("expected preflight");
    const result = buildRuntimeExecutionStart({
      runtimeExecutionRequest: request,
      runtimePreflightResult: preflight.value,
      executionIntent: "INITIAL",
      executionSequence: "sequence-001",
      initiatedByActorReference: { actorType: "USER", actorId: "user.reference.1" },
      startedAt: "2026-07-17T01:10:00+09:00",
    });

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid start");
    expect(result.failures.map((failure) => failure.code)).toContain(
      "RUNTIME_START_PREFLIGHT_NOT_READY",
    );
  });

  it("validates execution intent relationships", () => {
    const request = runtimeRequest();
    const preflight = readyPreflight();
    const initial = buildRuntimeExecutionStart({
      runtimeExecutionRequest: request,
      runtimePreflightResult: preflight,
      executionIntent: "INITIAL",
      executionSequence: "sequence-001",
      previousRuntimeExecutionReference: "runtime.execution.previous",
      initiatedByActorReference: { actorType: "USER", actorId: "user.reference.1" },
      startedAt: "2026-07-17T01:10:00+09:00",
    });
    const retry = buildRuntimeExecutionStart({
      runtimeExecutionRequest: request,
      runtimePreflightResult: preflight,
      executionIntent: "RETRY",
      executionSequence: "sequence-002",
      initiatedByActorReference: { actorType: "USER", actorId: "user.reference.1" },
      startedAt: "2026-07-17T01:10:00+09:00",
    });

    expect(initial.status).toBe("INVALID");
    expect(retry.status).toBe("INVALID");
    if (initial.status !== "INVALID" || retry.status !== "INVALID") {
      throw new Error("expected invalid starts");
    }
    expect(initial.failures.map((failure) => failure.code)).toContain(
      "RUNTIME_START_PREVIOUS_EXECUTION_FORBIDDEN",
    );
    expect(retry.failures.map((failure) => failure.code)).toContain(
      "RUNTIME_START_PREVIOUS_EXECUTION_REQUIRED",
    );
  });

  it("changes runtime execution identity across retry attempts", () => {
    const request = runtimeRequest();
    const preflight = buildRuntimePreflightResult(validPreflightInput({ runtimeExecutionRequest: request }));
    if (preflight.status !== "VALID") throw new Error("expected preflight");
    const initial = buildRuntimeExecutionStart({
      runtimeExecutionRequest: request,
      runtimePreflightResult: preflight.value,
      executionIntent: "INITIAL",
      executionSequence: "sequence-001",
      initiatedByActorReference: { actorType: "USER", actorId: "user.reference.1" },
      startedAt: "2026-07-17T01:10:00+09:00",
    });
    const retry = buildRuntimeExecutionStart({
      runtimeExecutionRequest: request,
      runtimePreflightResult: preflight.value,
      executionIntent: "RETRY",
      executionSequence: "sequence-002",
      previousRuntimeExecutionReference:
        initial.status === "VALID" ? initial.value.runtimeExecutionId : "previous",
      initiatedByActorReference: { actorType: "USER", actorId: "user.reference.1" },
      startedAt: "2026-07-17T01:11:00+09:00",
    });

    expect(initial.status).toBe("VALID");
    expect(retry.status).toBe("VALID");
    if (initial.status !== "VALID" || retry.status !== "VALID") {
      throw new Error("expected valid starts");
    }
    expect(retry.value.runtimeExecutionId).not.toBe(initial.value.runtimeExecutionId);
  });

  it("rejects invalid timestamps before creating a start contract", () => {
    const result = buildRuntimeExecutionStart({
      runtimeExecutionRequest: runtimeRequest(),
      runtimePreflightResult: { ...readyPreflight(), integrityChecksum: checksumA },
      executionIntent: "INITIAL",
      executionSequence: "sequence-001",
      initiatedByActorReference: { actorType: "USER", actorId: " " },
      startedAt: "2026-02-30T01:10:00+09:00",
    });

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid start");
    expect(result.failures.map((failure) => failure.code)).toEqual([
      "RUNTIME_START_TIMESTAMP_INVALID",
    ]);
  });

  it("rejects tampered preflight integrity and blank actors", () => {
    const result = buildRuntimeExecutionStart({
      runtimeExecutionRequest: runtimeRequest(),
      runtimePreflightResult: { ...readyPreflight(), integrityChecksum: checksumA },
      executionIntent: "INITIAL",
      executionSequence: "sequence-001",
      initiatedByActorReference: { actorType: "USER", actorId: " " },
      startedAt: "2026-07-17T01:10:00+09:00",
    });

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") throw new Error("expected invalid start");
    expect(result.failures.map((failure) => failure.code)).toEqual(
      expect.arrayContaining([
        "RUNTIME_START_PREFLIGHT_INVALID",
        "RUNTIME_START_INTENT_INVALID",
      ]),
    );
  });

  it("rejects secret-like input without echoing the value", () => {
    const rawSecret = `ghp_${"x".repeat(32)}`;
    const result = buildRuntimeExecutionStart({
      runtimeExecutionRequest: runtimeRequest(),
      runtimePreflightResult: readyPreflight(),
      executionIntent: "INITIAL",
      executionSequence: rawSecret,
      initiatedByActorReference: { actorType: "USER", actorId: "user.reference.1" },
      startedAt: "2026-07-17T01:10:00+09:00",
    });

    expect(result.status).toBe("INVALID");
    expect(JSON.stringify(result)).not.toContain(rawSecret);
  });

  it("does not mutate caller input", () => {
    const request = runtimeRequest();
    const preflight = buildRuntimePreflightResult(validPreflightInput({ runtimeExecutionRequest: request }));
    if (preflight.status !== "VALID") throw new Error("expected preflight");
    const input = {
      runtimeExecutionRequest: request,
      runtimePreflightResult: preflight.value,
      executionIntent: "INITIAL" as const,
      executionSequence: "sequence-001",
      initiatedByActorReference: { actorType: "USER" as const, actorId: "user.reference.1" },
      startedAt: "2026-07-17T01:10:00+09:00",
    };
    const before = stableSerializeAgentPackage(input);
    buildRuntimeExecutionStart(input);
    expect(stableSerializeAgentPackage(input)).toBe(before);
  });
});
