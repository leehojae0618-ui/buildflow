import { describe, expect, it } from "vitest";
import { generateAgentDefinition } from "./generator";
import {
  executeMinimumRuntime,
  type ExecuteMinimumRuntimeInput,
} from "./runtime-orchestrator";
import { InMemoryRuntimeEvidenceSink, type RuntimeEvidenceSink } from "./runtime-evidence";
import { buildRuntimePlan } from "./runtime-plan";
import type { ProviderAdapter, ProviderInvocationResult } from "./runtime-provider";
import { buildRuntimeExecutionRequest } from "./runtime-execution-request";
import {
  buildRuntimePreflightResult,
  type RuntimePreflightResult,
} from "./runtime-execution-start";
import { aiInquiryV1AgentBlueprint } from "./types";
import type { PackageApprovalGateResult } from "./package-approval-gate";

const checksum = (seed: string) => seed.padEnd(64, seed).slice(0, 64);
const startedAt = "2026-07-26T00:00:00.000Z";
const completedAt = "2026-07-26T00:00:01.000Z";

function approvalGate(): PackageApprovalGateResult {
  return {
    formatVersion: "buildflow.package-approval-gate.v1",
    packageId: "agent.ai-inquiry",
    packageVersion: "1.0.0",
    evidenceReportReference: {
      reportId: "report.ai-inquiry",
      reportIntegrityChecksum: checksum("b"),
      reportStatus: "VALID_WITH_LIMITATIONS",
      packageReadiness: "CONDITIONALLY_READY",
    },
    requestReference: { approvalRequestId: "approval.request.1", integrityChecksum: checksum("c"), requestStatus: "PENDING" },
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
      evidenceReportIntegrityChecksum: checksum("b"),
      sourceReferences: {
        packageId: "agent.ai-inquiry",
        packageVersion: "1.0.0",
        evidenceReportId: "report.ai-inquiry",
        evidenceReportIntegrityChecksum: checksum("b"),
        packageArtifactChecksum: checksum("a"),
        verificationReportChecksum: checksum("c"),
        evidenceBundleChecksum: checksum("d"),
        pipelineSummaryChecksum: checksum("e"),
      },
      approvalRequestId: "approval.request.1",
      requestIntegrityChecksum: checksum("c"),
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
      expirationEvaluation: { evaluated: false, status: "NOT_EVALUATED", evaluationTime: null, expiresAt: null },
      failures: [],
      limitations: [],
      packageReadiness: "CONDITIONALLY_READY",
    },
    integrityChecksum: checksum("d"),
    metadata: {},
  };
}

function runtimeRequest() {
  const built = buildRuntimeExecutionRequest({
    approvalGate: approvalGate(),
    requestedExecutionMode: "STANDARD",
    executionProfileReference: { referenceId: "runtime.profile.1", integrityChecksum: checksum("a") },
    runtimePolicyReference: { referenceId: "runtime.policy.1", integrityChecksum: checksum("b") },
    requestedBy: { actorType: "USER", actorId: "user.1" },
    inputArtifactReferences: [{ artifactId: "input.runtime.1", artifactType: "RUNTIME_INPUT", integrityChecksum: checksum("c") }],
    requestedCapabilityReferences: [{ capabilityId: "AI_RESPONSE", integrityChecksum: checksum("d") }],
    expirationPolicy: { mode: "EXPLICIT_TIME", evaluationTime: "2026-07-26T00:00:00.000Z", expiresAt: "2026-07-27T00:00:00.000Z" },
  });
  if (built.status !== "VALID") throw new Error("runtime request fixture is invalid");
  return built.value;
}

function preflight(request = runtimeRequest()): RuntimePreflightResult {
  const built = buildRuntimePreflightResult({
    runtimeExecutionRequest: request,
    approvalStatusSnapshot: {
      approvalReferenceId: request.approvalBinding.approvalRequestId,
      status: "APPROVED",
      scopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      packageBinding: request.packageBinding,
      evidenceBinding: request.evidenceBinding,
      runtimeExecutionRequestBinding: { runtimeExecutionRequestId: request.runtimeExecutionRequestId, integrityChecksum: request.integrityChecksum },
      approvedAt: startedAt,
      checksum: checksum("a"),
    },
    connectionReadinessSnapshots: [{ connectionReferenceId: "connection.openai", serviceReference: "openai", grantedCapabilityReferences: ["AI_RESPONSE"], status: "CONNECTED", checksum: checksum("b") }],
    credentialReadinessSnapshots: [{ credentialReferenceId: "credential.openai", connectionReferenceId: "connection.openai", status: "ACTIVE", checksum: checksum("c") }],
    capabilityReadinessSnapshots: [{ capabilityReferenceId: "AI_RESPONSE", supportedByBlock: true, supportedByTool: true, grantedByConnection: true, permittedByPolicy: true, coveredByApproval: true, status: "AVAILABLE", checksum: checksum("d") }],
    providerReadinessSnapshots: [{ providerReference: "openai", modelReference: "gpt-5-mini", status: "READY", checksum: checksum("e") }],
    mcpReadinessSnapshots: [],
    runtimePolicySnapshot: { runtimePolicyReference: request.runtimePolicyReference!, status: "ACTIVE", allowedExecutionModes: ["STANDARD"], checksum: checksum("f") },
    cancellationSnapshot: { runtimeExecutionRequestId: request.runtimeExecutionRequestId, status: "NONE", checksum: checksum("a") },
    idempotencySnapshot: { runtimeExecutionRequestId: request.runtimeExecutionRequestId, status: "AVAILABLE", evaluatedAt: startedAt, checksum: checksum("b") },
    evaluatedAt: startedAt,
  });
  if (built.status !== "VALID") throw new Error("preflight fixture is invalid");
  return built.value;
}

function successProvider(): ProviderAdapter {
  return {
    execute: async (): Promise<ProviderInvocationResult> => ({
      status: "SUCCEEDED",
      providerRequestReference: "provider.request.1",
      outputReference: "provider.output.1",
      outputChecksum: checksum("f"),
      usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 },
      latencyMs: 5,
    }),
  };
}

function executionInput(overrides: Partial<ExecuteMinimumRuntimeInput> = {}): ExecuteMinimumRuntimeInput {
  const request = overrides.runtimeExecutionRequest ?? runtimeRequest();
  const blueprint = structuredClone(aiInquiryV1AgentBlueprint);
  const definition = generateAgentDefinition({ projectId: "project.runtime", goal: "Respond safely.", blueprint, selectedDeliveryMode: "CHAT", selectedInterfaceModes: ["WEB_CHAT"] }).definition;
  const transientProviderInput = overrides.transientProviderInput ?? { systemInstruction: "Respond safely.", userInput: "Summarize the request." };
  const builtPlan = buildRuntimePlan({
    runtimeExecutionRequest: request,
    blueprint,
    blueprintIntegrityChecksum: checksum("a"),
    agentDefinition: definition,
    agentDefinitionIntegrityChecksum: checksum("b"),
    inputArtifactReference: request.inputArtifactReferences[0],
    transientProviderInput,
  });
  if (builtPlan.status !== "VALID") throw new Error("runtime plan fixture is invalid");
  return {
    runtimeExecutionRequest: request,
    runtimePreflightResult: overrides.runtimePreflightResult ?? preflight(request),
    runtimePlan: overrides.runtimePlan ?? builtPlan.value,
    initiatedByActorReference: { actorType: "USER", actorId: "user.1" },
    executionSequence: "runtime-sequence-1",
    startedAt,
    completedAt,
    transientProviderInput,
    provider: overrides.provider ?? successProvider(),
    evidenceSink: overrides.evidenceSink ?? new InMemoryRuntimeEvidenceSink(),
    ...overrides,
  };
}

describe("executeMinimumRuntime", () => {
  it("executes a valid single provider step and links result and evidence", async () => {
    const outcome = await executeMinimumRuntime(executionInput());
    expect(outcome.status).toBe("SUCCEEDED");
    expect(outcome.runtimeStep?.status).toBe("SUCCESS");
    expect(outcome.runtimeStepAttempt?.status).toBe("SUCCESS");
    expect(outcome.result?.status).toBe("SUCCEEDED");
    expect(outcome.result?.evidenceReferences?.[0].referenceId).toBe(outcome.evidence?.runtimeEvidenceId);
  });

  it("emits runtime, provider, step, evidence, and completion events", async () => {
    const outcome = await executeMinimumRuntime(executionInput());
    expect(outcome.events.map((item) => item.eventType)).toEqual(expect.arrayContaining([
      "PLAN_ACCEPTED", "RUNTIME_STARTED", "PROVIDER_INVOCATION_STARTED", "PROVIDER_INVOCATION_COMPLETED", "STEP_COMPLETED", "EVIDENCE_APPENDED", "RUNTIME_COMPLETED",
    ]));
  });

  it.each([
    ["PROVIDER_AUTHENTICATION_FAILED", "FAILED"],
    ["PROVIDER_RATE_LIMITED", "FAILED"],
    ["PROVIDER_REQUEST_FAILED", "FAILED"],
  ] as const)("normalizes %s as a failed terminal runtime", async (errorCode, status) => {
    const outcome = await executeMinimumRuntime(executionInput({ provider: { execute: async () => ({ status: "FAILED", errorCode, latencyMs: 1, retryEligible: false }) } }));
    expect(outcome.status).toBe(status);
    expect(outcome.errorCode).toBe(errorCode);
    expect(outcome.runtimeStepAttempt?.retryDecision?.decision).toBe("RETRY_DENIED");
  });

  it("normalizes a timeout without retry", async () => {
    const outcome = await executeMinimumRuntime(executionInput({ provider: { execute: async () => ({ status: "TIMED_OUT", errorCode: "PROVIDER_TIMEOUT", latencyMs: 1, retryEligible: false }) } }));
    expect(outcome.status).toBe("TIMED_OUT");
    expect(outcome.runtimeStep?.status).toBe("TIMEOUT");
    expect(outcome.runtimeStepAttempt?.status).toBe("TIMEOUT");
  });

  it.each([
    ["empty", { status: "FAILED", errorCode: "PROVIDER_EMPTY_RESPONSE", latencyMs: 1, retryEligible: false }],
    ["malformed", { status: "SUCCEEDED", providerRequestReference: "request.1", outputReference: "", outputChecksum: "invalid", latencyMs: 1 }],
  ] as const)("does not treat a %s provider response as Runtime success", async (_label, providerResult) => {
    const outcome = await executeMinimumRuntime(executionInput({ provider: { execute: async () => providerResult } }));
    expect(outcome.status).toBe("FAILED");
    expect(outcome.errorCode).toBe(_label === "empty" ? "PROVIDER_EMPTY_RESPONSE" : "PROVIDER_OUTPUT_INVALID");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["string", "unexpected provider response"],
    ["number", 1],
    ["boolean", true],
    ["function", () => undefined],
    ["array", []],
    ["empty object", {}],
    ["object without status", { value: "missing-status" }],
    ["object with invalid status", { status: "UNKNOWN" }],
    ["malformed succeeded envelope", { status: "SUCCEEDED", providerRequestReference: "request.1" }],
    ["malformed failed envelope", { status: "FAILED", latencyMs: 1, retryEligible: false }],
  ])("normalizes a malformed %s provider envelope without throwing", async (_label, malformedValue) => {
    let calls = 0;
    const execution = executeMinimumRuntime(executionInput({
      provider: {
        execute: async () => {
          calls += 1;
          return malformedValue as never;
        },
      },
    }));
    await expect(execution).resolves.toMatchObject({
      status: "FAILED",
      errorCode: "PROVIDER_OUTPUT_INVALID",
      runtimeStep: { status: "FAILED" },
      runtimeStepAttempt: { status: "FAILED", retryDecision: { decision: "RETRY_DENIED" } },
      result: { status: "FAILED" },
      evidence: { status: "FAILED", errorCode: "PROVIDER_OUTPUT_INVALID" },
    });
    const outcome = await execution;
    expect(calls).toBe(1);
    expect(outcome.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ eventType: "PROVIDER_INVOCATION_FAILED", safeCode: "PROVIDER_OUTPUT_INVALID" }),
      expect.objectContaining({ eventType: "RUNTIME_FAILED", safeCode: "PROVIDER_OUTPUT_INVALID" }),
    ]));
    expect(JSON.stringify(outcome)).not.toContain("unexpected provider response");
  });

  it("normalizes provider configuration as blocked and does not claim success", async () => {
    const outcome = await executeMinimumRuntime(executionInput({ provider: { execute: async () => ({ status: "BLOCKED", errorCode: "PROVIDER_CONFIGURATION_MISSING", latencyMs: 0, retryEligible: false }) } }));
    expect(outcome.status).toBe("BLOCKED");
    expect(outcome.runtimeStep?.status).toBe("WAITING");
    expect(outcome.result?.status).toBe("BLOCKED");
  });

  it("rejects an invalid request before provider invocation", async () => {
    let calls = 0;
    const values = executionInput();
    const request = { ...values.runtimeExecutionRequest, integrityChecksum: "invalid" };
    const outcome = await executeMinimumRuntime({ ...values, runtimeExecutionRequest: request, provider: { execute: async () => { calls += 1; return successProvider().execute({} as never); } } });
    expect(outcome.errorCode).toBe("RUNTIME_REQUEST_INVALID");
    expect(calls).toBe(0);
  });

  it("rejects an invalid plan binding before provider invocation", async () => {
    let calls = 0;
    const values = executionInput();
    const outcome = await executeMinimumRuntime({ ...values, runtimePlan: { ...values.runtimePlan, runtimeExecutionRequestReference: { ...values.runtimePlan.runtimeExecutionRequestReference, runtimeExecutionRequestId: "different" } }, provider: { execute: async () => { calls += 1; return successProvider().execute({} as never); } } });
    expect(outcome.errorCode).toBe("RUNTIME_PLAN_INVALID");
    expect(calls).toBe(0);
  });

  it("rejects a transient input that does not match the plan checksum", async () => {
    const values = executionInput();
    const outcome = await executeMinimumRuntime({ ...values, transientProviderInput: { ...values.transientProviderInput, userInput: "changed" } });
    expect(outcome.errorCode).toBe("RUNTIME_PLAN_INVALID");
  });

  it("rejects secret-shaped transient input before provider invocation", async () => {
    let calls = 0;
    const values = executionInput();
    const outcome = await executeMinimumRuntime({
      ...values,
      transientProviderInput: { systemInstruction: "safe", userInput: `sk-${"x".repeat(24)}` },
      provider: { execute: async () => { calls += 1; return successProvider().execute({} as never); } },
    });
    expect(outcome.errorCode).toBe("RUNTIME_PLAN_INVALID");
    expect(calls).toBe(0);
  });

  it("cancels before provider invocation", async () => {
    let calls = 0;
    const outcome = await executeMinimumRuntime(executionInput({ cancelBeforeInvocation: true, provider: { execute: async () => { calls += 1; return successProvider().execute({} as never); } } }));
    expect(outcome.status).toBe("CANCELLED");
    expect(calls).toBe(0);
  });

  it("fails closed when evidence append fails", async () => {
    const failingSink: RuntimeEvidenceSink = { append: async () => ({ status: "FAILED", failures: [{ code: "RUNTIME_EVIDENCE_INTERNAL_ERROR" }] }) };
    const outcome = await executeMinimumRuntime(executionInput({ evidenceSink: failingSink }));
    expect(outcome.status).toBe("FINALIZATION_FAILED");
    expect(outcome.errorCode).toBe("RUNTIME_EVIDENCE_CONSTRUCTION_FAILED");
  });

  it("fails closed when the identity factory cannot construct a step", async () => {
    const outcome = await executeMinimumRuntime(executionInput({ identityFactory: { createStepId: () => "", createAttemptId: () => "attempt.1" } }));
    expect(outcome.errorCode).toBe("RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED");
  });

  it("fails closed when final result construction cannot validate the completion time", async () => {
    const outcome = await executeMinimumRuntime(executionInput({ completedAt: "2025-01-01T00:00:00.000Z" }));
    expect(outcome.status).toBe("FINALIZATION_FAILED");
    expect(outcome.errorCode).toBe("RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED");
  });

  it("does not retry a provider failure", async () => {
    let calls = 0;
    const outcome = await executeMinimumRuntime(executionInput({ provider: { execute: async () => { calls += 1; return { status: "FAILED", errorCode: "PROVIDER_RATE_LIMITED", latencyMs: 1, retryEligible: false }; } } }));
    expect(outcome.status).toBe("FAILED");
    expect(calls).toBe(1);
    expect(outcome.runtimeStepAttempt?.attemptNumber).toBe(1);
  });

  it("keeps raw prompt and output out of runtime records", async () => {
    const outcome = await executeMinimumRuntime(executionInput());
    const serialized = JSON.stringify(outcome);
    expect(serialized).not.toContain("Respond safely.");
    expect(serialized).not.toContain("Summarize the request.");
    expect(serialized).not.toContain("raw provider output");
  });
});
