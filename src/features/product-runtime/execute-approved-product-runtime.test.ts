import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { stableSerializeAgentPackage } from "../agents/package-export";
import { buildRuntimeExecutionRequest, type RuntimeExecutionRequest } from "../agents/runtime-execution-request";
import type { RuntimePlan } from "../agents/runtime-plan";
import type { PackageApprovalGateResult } from "../agents/package-approval-gate";
import type { RuntimeApprovalRepository } from "../runtime-approval/repository";
import type { RuntimeApprovalRequest } from "../runtime-approval/types";
import { buildRuntimeApprovalBinding } from "../runtime-approval/validator";
import { executeApprovedProductRuntime } from "./execute-approved-product-runtime";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("../agents/runtime-evidence-supabase", () => ({
  SupabaseRuntimeEvidenceRepository: class {},
}));
vi.mock("../runtime-approval/runtime-approval-supabase", () => ({
  SupabaseRuntimeApprovalRepository: class {},
}));
vi.mock("../../services/openai/runtime-provider-adapter", () => ({
  createOpenAIRuntimeProviderAdapter: vi.fn(),
}));

const checksum = (value: unknown) => createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");
const fixedNow = new Date("2026-07-28T00:00:00.000Z");

function approvalGate(): PackageApprovalGateResult {
  const hash = (seed: string) => seed.repeat(64).slice(0, 64);
  const gate: PackageApprovalGateResult = {
    formatVersion: "buildflow.package-approval-gate.v1",
    packageId: "agent.runtime-test",
    packageVersion: "1.0.0",
    evidenceReportReference: { reportId: "report.1", reportIntegrityChecksum: hash("a"), reportStatus: "VALID_WITH_LIMITATIONS", packageReadiness: "CONDITIONALLY_READY" },
    requestReference: { approvalRequestId: "package.approval.1", integrityChecksum: hash("b"), requestStatus: "PENDING" },
    decisionReferences: [], requestedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"], grantedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"], deniedScopes: [], pendingScopes: [], staleScopes: [], revokedScopes: [],
    gateStatus: "APPROVED_WITH_LIMITATIONS",
    authorization: { authorizationStatus: "AUTHORIZED_WITH_LIMITATIONS", requestedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"], grantedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"], deniedScopes: [], pendingScopes: [], staleScopes: [], revokedScopes: [], reasonCodes: ["ACCEPTED_RISK"], limitations: [], sourceApprovalReferences: ["package.approval.1"] },
    failures: [], warnings: [], limitations: [],
    deterministicCore: { formatVersion: "buildflow.package-approval-gate.v1", packageId: "agent.runtime-test", packageVersion: "1.0.0", evidenceReportId: "report.1", evidenceReportIntegrityChecksum: hash("a"), sourceReferences: { packageId: "agent.runtime-test", packageVersion: "1.0.0", evidenceReportId: "report.1", evidenceReportIntegrityChecksum: hash("a"), packageArtifactChecksum: hash("c"), verificationReportChecksum: hash("d"), evidenceBundleChecksum: hash("e"), pipelineSummaryChecksum: hash("f") }, approvalRequestId: "package.approval.1", requestIntegrityChecksum: hash("b"), requestedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"], executionScopes: ["RUNTIME_EXECUTION"], activeDecisions: [], gateStatus: "APPROVED_WITH_LIMITATIONS", authorizationStatus: "AUTHORIZED_WITH_LIMITATIONS", grantedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"], deniedScopes: [], pendingScopes: [], staleScopes: [], revokedScopes: [], expirationEvaluation: { evaluated: false, status: "NOT_EVALUATED", evaluationTime: null, expiresAt: null }, failures: [], limitations: [], packageReadiness: "CONDITIONALLY_READY" },
    integrityChecksum: hash("g"), metadata: {},
  };
  gate.integrityChecksum = checksum(gate.deterministicCore);
  return gate;
}

function request(): RuntimeExecutionRequest {
  const built = buildRuntimeExecutionRequest({
    approvalGate: approvalGate(), requestedExecutionMode: "STANDARD",
    executionProfileReference: { referenceId: "profile.1", integrityChecksum: "a".repeat(64) },
    requestedBy: { actorType: "USER", actorId: "user.1" },
    inputArtifactReferences: [{ artifactId: "input.1", artifactType: "RUNTIME_INPUT", integrityChecksum: "b".repeat(64) }],
    requestedCapabilityReferences: [{ capabilityId: "AI_RESPONSE", integrityChecksum: "c".repeat(64) }],
    expirationPolicy: { mode: "EXPLICIT_TIME", evaluationTime: "2026-07-28T00:00:00.000Z", expiresAt: "2026-07-29T00:00:00.000Z" },
  });
  if (built.status !== "VALID") throw new Error(JSON.stringify(built.failures));
  return built.value;
}

function plan(runtimeRequest: RuntimeExecutionRequest, transient = { systemInstruction: "Respond safely.", userInput: "Summarize this request." }): RuntimePlan {
  const core = {
    formatVersion: "buildflow.runtime-plan.v1" as const, runtimeVersion: "1.0.0" as const,
    runtimeExecutionRequestReference: { runtimeExecutionRequestId: runtimeRequest.runtimeExecutionRequestId, integrityChecksum: runtimeRequest.integrityChecksum },
    blueprintReference: { id: "blueprint.1", version: "1", integrityChecksum: "c".repeat(64) },
    agentDefinitionReference: { id: "agent.1", version: "1", integrityChecksum: "d".repeat(64) },
    steps: [{ runtimePlanStepId: "step.1", sequence: 1 as const, invocationBoundary: "PROVIDER" as const, provider: "openai" as const, model: "gpt-test", promptReference: { referenceId: "prompt.1", integrityChecksum: "e".repeat(64), referenceType: "PROMPT_TEMPLATE" }, inputArtifactReference: { referenceId: "input.1", integrityChecksum: "b".repeat(64), referenceType: "RUNTIME_INPUT" }, safeInputChecksum: checksum(transient), retryAllowed: false as const }] as const,
  };
  const runtimePlanId = checksum(core);
  return { ...core, runtimePlanId, integrityChecksum: checksum({ ...core, runtimePlanId }) };
}

function withRecomputedIntegrity(runtimePlan: RuntimePlan): RuntimePlan {
  const deterministicCore = {
    formatVersion: runtimePlan.formatVersion,
    runtimeVersion: runtimePlan.runtimeVersion,
    runtimeExecutionRequestReference: runtimePlan.runtimeExecutionRequestReference,
    blueprintReference: runtimePlan.blueprintReference,
    agentDefinitionReference: runtimePlan.agentDefinitionReference,
    steps: runtimePlan.steps,
  };
  const runtimePlanId = checksum(deterministicCore);
  return { ...runtimePlan, runtimePlanId, integrityChecksum: checksum({ ...deterministicCore, runtimePlanId }) };
}

function approved(input: { runtimeExecutionRequest: RuntimeExecutionRequest; runtimePlan: RuntimePlan }): RuntimeApprovalRequest {
  const built = buildRuntimeApprovalBinding({
    projectId: "project.1",
    userId: "user.1",
    runtimeExecutionRequest: input.runtimeExecutionRequest,
    runtimePlan: input.runtimePlan,
  });
  if (built.status !== "VALID") throw new Error("expected valid approval binding fixture");
  return {
    ...built.value,
    approvalId: "runtime.approval.1",
    status: "CONSUMED",
    createdAt: fixedNow.toISOString(),
    expiresAt: "2026-07-28T00:15:00.000Z",
    consumedAt: fixedNow.toISOString(),
  };
}

function input() {
  const runtimeExecutionRequest = request();
  const transientProviderInput = { systemInstruction: "Respond safely.", userInput: "Summarize this request." };
  const runtimePlan = plan(runtimeExecutionRequest, transientProviderInput);
  return { projectId: "project.1", approvalRequestId: "runtime.approval.1", runtimeExecutionRequest, runtimePlan, transientProviderInput };
}

function dependencies(values = input(), events: string[] = []) {
  const persistedApproval = approved(values);
  const get = vi.fn();
  get.mockResolvedValue({ status: "OK" as const, value: persistedApproval, failures: [] as [] });
  const consume = vi.fn();
  consume.mockImplementation(async () => { events.push("consume"); return { status: "OK" as const, value: approved(values), failures: [] as [] }; });
  const approvalRepository = { get, consume } as unknown as RuntimeApprovalRepository;
  const executeRuntime = vi.fn();
  executeRuntime.mockImplementation(async () => {
    events.push("runtime");
    return {
      status: "SUCCEEDED", userMessage: "ok", events: [],
      runtimeExecutionStart: { runtimeExecutionId: "execution.1" },
      result: { runtimeExecutionResultId: "result.1", integrityChecksum: "1".repeat(64) },
      evidence: { runtimeEvidenceId: "evidence.1", integrityChecksum: "2".repeat(64), runtimeExecutionId: "execution.1", eventType: "RUNTIME_COMPLETED", status: "SUCCEEDED", occurredAt: fixedNow.toISOString() },
    };
  });
  const evidenceAppend = vi.fn();
  return { resolveOwnedProject: async () => ({ projectId: "project.1", userId: "user.1" }), approvalRepository, executeRuntime: executeRuntime as never, provider: { execute: async () => { events.push("provider"); return { status: "SUCCEEDED" as const, providerRequestReference: "p", outputReference: "o", outputChecksum: "3".repeat(64), latencyMs: 1 }; } } as never, evidenceRepository: { append: evidenceAppend } as never, isProviderConfigured: () => true, now: () => fixedNow, _get: get, _consume: consume, _execute: executeRuntime, _evidenceAppend: evidenceAppend };
}

describe("executeApprovedProductRuntime", () => {
  it("rejects unauthenticated requests before consume", async () => {
    const result = await executeApprovedProductRuntime(input(), { resolveOwnedProject: async () => "UNAUTHENTICATED" });
    expect(result).toMatchObject({ status: "REJECTED", errorCode: "UNAUTHENTICATED" });
  });
  it("rejects a non-owner before consume", async () => {
    const result = await executeApprovedProductRuntime(input(), { resolveOwnedProject: async () => "PROJECT_ACCESS_DENIED" });
    expect(result).toMatchObject({ status: "REJECTED", errorCode: "PROJECT_ACCESS_DENIED" });
  });
  it("rejects an invalid plan before consume", async () => {
    const values = input(); const deps = dependencies(values); values.runtimePlan = { ...values.runtimePlan, integrityChecksum: "x" };
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ errorCode: "INVALID_RUNTIME_PLAN" }); expect(deps._consume).not.toHaveBeenCalled();
  });
  it("rejects a transient input checksum mismatch before consume", async () => {
    const values = input(); const deps = dependencies(values); values.transientProviderInput = { ...values.transientProviderInput, userInput: "changed" };
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ errorCode: "RUNTIME_BINDING_MISMATCH" }); expect(deps._consume).not.toHaveBeenCalled();
  });
  it("uses only the approved transient input fields for the checksum and Runtime handoff", async () => {
    const values = input(); const deps = dependencies(values);
    values.transientProviderInput = {
      ...values.transientProviderInput,
      ignoredRuntimeOnlyValue: "must-not-affect-binding",
    } as typeof values.transientProviderInput;
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result.status).toBe("SUCCEEDED");
    expect(deps._consume).toHaveBeenCalledWith(expect.objectContaining({
      binding: expect.objectContaining({ safeInputChecksum: checksum({ systemInstruction: "Respond safely.", userInput: "Summarize this request." }) }),
    }));
    expect((deps._execute.mock.calls[0][0] as { transientProviderInput: unknown }).transientProviderInput)
      .toEqual({ systemInstruction: "Respond safely.", userInput: "Summarize this request." });
  });
  it("does not execute Runtime when consume fails", async () => {
    const values = input(); const deps = dependencies(values); deps._consume.mockResolvedValue({ status: "FAILED", failures: [{ code: "RUNTIME_APPROVAL_CONSUMED" }] });
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ errorCode: "APPROVAL_NOT_USABLE" }); expect(deps._execute).not.toHaveBeenCalled();
  });
  it("consumes before its one Runtime invocation", async () => {
    const values = input(); const events: string[] = []; const deps = dependencies(values, events);
    await executeApprovedProductRuntime(values, deps);
    expect(events).toEqual(["consume", "runtime"]); expect(deps._execute).toHaveBeenCalledTimes(1);
  });
  it("passes the consumed approval id through the evidence context", async () => {
    const values = input(); const deps = dependencies(values);
    await executeApprovedProductRuntime(values, deps);
    const runtimeInput = deps._execute.mock.calls[0][0] as { evidenceContext: unknown };
    expect(runtimeInput.evidenceContext).toEqual({ projectId: "project.1", userId: "user.1", approvalRequestId: "runtime.approval.1" });
  });
  it("returns reference-only Package Evidence without prompt or output", async () => {
    const values = input(); const result = await executeApprovedProductRuntime(values, dependencies(values));
    expect(result.status).toBe("SUCCEEDED"); const serialized = JSON.stringify(result);
    expect(serialized).toContain("evidence.1"); expect(serialized).not.toContain(values.transientProviderInput.userInput); expect(serialized).not.toContain("sdkPayload");
  });
  it("does not attempt approval rollback after a provider/runtime failure", async () => {
    const values = input(); const deps = dependencies(values); deps._execute.mockResolvedValue({ status: "FAILED", userMessage: "safe", errorCode: "PROVIDER_TIMEOUT", events: [] });
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ status: "FAILED", runtimeResult: { safeErrorCode: "PROVIDER_TIMEOUT" } }); expect(deps._consume).toHaveBeenCalledTimes(1);
  });
  it("does not invoke Runtime when provider configuration is unavailable", async () => {
    const values = input(); const deps = dependencies(values); deps.isProviderConfigured = () => false;
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ errorCode: "INVALID_RUNTIME_REQUEST" }); expect(deps._consume).not.toHaveBeenCalled();
  });
  it("rejects an invalid RuntimeExecutionRequest before consume", async () => {
    const values = input(); const deps = dependencies(values); values.runtimeExecutionRequest = { ...values.runtimeExecutionRequest, integrityChecksum: "invalid" };
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ errorCode: "INVALID_RUNTIME_REQUEST" }); expect(deps._consume).not.toHaveBeenCalled();
  });
  it("rejects a Request/Plan reference mismatch before consume", async () => {
    const values = input(); const deps = dependencies(values); values.runtimePlan = { ...values.runtimePlan, runtimeExecutionRequestReference: { ...values.runtimePlan.runtimeExecutionRequestReference, runtimeExecutionRequestId: "other" } };
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ errorCode: "INVALID_RUNTIME_PLAN" }); expect(deps._consume).not.toHaveBeenCalled();
  });
  it("does not execute Runtime on a provider-bound approval mismatch", async () => {
    const values = input(); const deps = dependencies(values); deps._consume.mockResolvedValue({ status: "FAILED", failures: [{ code: "RUNTIME_APPROVAL_BINDING_MISMATCH" }] });
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ errorCode: "APPROVAL_NOT_USABLE" }); expect(deps._execute).not.toHaveBeenCalled();
  });
  it("rejects a directly tampered plan provider before consume", async () => {
    const values = input(); const deps = dependencies(values);
    values.runtimePlan = {
      ...values.runtimePlan,
      steps: [{ ...values.runtimePlan.steps[0], provider: "tampered-provider" }],
    } as unknown as RuntimePlan;
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ status: "REJECTED", errorCode: "INVALID_RUNTIME_PLAN" });
    expect(deps._get).not.toHaveBeenCalled(); expect(deps._consume).not.toHaveBeenCalled(); expect(deps._execute).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("tampered-provider");
  });
  it("rejects a directly tampered plan model before consume", async () => {
    const values = input(); const deps = dependencies(values);
    values.runtimePlan = withRecomputedIntegrity({
      ...values.runtimePlan,
      steps: [{ ...values.runtimePlan.steps[0], model: "tampered-model" }],
    } as RuntimePlan);
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ status: "REJECTED", errorCode: "RUNTIME_BINDING_MISMATCH" });
    expect(deps._get).toHaveBeenCalledTimes(1);
    expect(deps._consume).not.toHaveBeenCalled(); expect(deps._execute).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("tampered-model");
  });
  it("does not execute Runtime on a model-bound approval mismatch", async () => {
    const values = input(); const deps = dependencies(values); deps._consume.mockResolvedValue({ status: "FAILED", failures: [{ code: "RUNTIME_APPROVAL_BINDING_MISMATCH" }] });
    await executeApprovedProductRuntime(values, deps);
    expect(deps._consume).toHaveBeenCalledWith(expect.objectContaining({ binding: expect.objectContaining({ model: "gpt-test" }) })); expect(deps._execute).not.toHaveBeenCalled();
  });
  it("passes a checksum recomputed from the safe transient input to consume", async () => {
    const values = input(); const deps = dependencies(values);
    await executeApprovedProductRuntime(values, deps);
    expect(deps._consume).toHaveBeenCalledWith(expect.objectContaining({ binding: expect.objectContaining({ safeInputChecksum: checksum(values.transientProviderInput) }) }));
  });
  it("rejects the same approval on a second execution without a second Runtime call", async () => {
    const values = input(); const deps = dependencies(values); deps._consume.mockResolvedValueOnce({ status: "OK", value: approved(values), failures: [] }).mockResolvedValueOnce({ status: "FAILED", failures: [{ code: "RUNTIME_APPROVAL_CONSUMED" }] });
    await executeApprovedProductRuntime(values, deps); const second = await executeApprovedProductRuntime(values, deps);
    expect(second).toMatchObject({ errorCode: "APPROVAL_NOT_USABLE" }); expect(deps._execute).toHaveBeenCalledTimes(1);
  });
  it("does not append evidence itself in addition to Core Runtime", async () => {
    const values = input(); const deps = dependencies(values);
    await executeApprovedProductRuntime(values, deps);
    expect(deps._evidenceAppend).not.toHaveBeenCalled();
  });
  it("normalizes an ownership dependency exception without exposing its message", async () => {
    const internalMessage = "ownership-query-internal-detail";
    const result = await executeApprovedProductRuntime(input(), {
      resolveOwnedProject: async () => { throw new Error(internalMessage); },
    });
    expect(result).toMatchObject({ status: "REJECTED", errorCode: "APPROVAL_NOT_USABLE" });
    expect(JSON.stringify(result)).not.toContain(internalMessage);
    expect(JSON.stringify(result)).not.toContain("Error:");
  });
  it("normalizes an approval consume exception without invoking Runtime", async () => {
    const values = input(); const deps = dependencies(values); const internalMessage = "approval-rpc-internal-detail";
    deps._consume.mockRejectedValue(new Error(internalMessage));
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ status: "REJECTED", errorCode: "APPROVAL_NOT_USABLE" });
    expect(deps._execute).not.toHaveBeenCalled(); expect(JSON.stringify(result)).not.toContain(internalMessage);
  });
  it("normalizes a Runtime dependency exception after consume without restoring approval", async () => {
    const values = input(); const deps = dependencies(values); const internalMessage = "provider-sdk-internal-detail";
    deps._execute.mockRejectedValue(new Error(internalMessage));
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ status: "FAILED", runtimeResult: { safeErrorCode: "RUNTIME_EXECUTION_FAILED" } });
    expect(deps._consume).toHaveBeenCalledTimes(1); expect(JSON.stringify(result)).not.toContain(internalMessage);
  });
  it("fails safely when Runtime Evidence append throws after approval consumption", async () => {
    const values = input(); const deps = dependencies(values); const internalMessage = "evidence-insert-internal-detail";
    deps._evidenceAppend.mockRejectedValue(new Error(internalMessage));
    deps._execute.mockImplementation(async (runtimeInput: { evidenceSink: { append: (value: never, context: never) => Promise<unknown> }; evidenceContext: never }) => {
      await runtimeInput.evidenceSink.append(undefined as never, runtimeInput.evidenceContext);
      throw new Error("unexpected");
    });
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ status: "FAILED", runtimeResult: { safeErrorCode: "RUNTIME_EXECUTION_FAILED" } });
    expect(deps._consume).toHaveBeenCalledTimes(1); expect(JSON.stringify(result)).not.toContain(internalMessage);
  });
  it("returns a safe failed result when Core Runtime fails before evidence", async () => {
    const values = input(); const deps = dependencies(values); deps._execute.mockResolvedValue({ status: "FINALIZATION_FAILED", userMessage: "safe", errorCode: "RUNTIME_EVIDENCE_CONSTRUCTION_FAILED", events: [] });
    const result = await executeApprovedProductRuntime(values, deps);
    expect(result).toMatchObject({ status: "FAILED", runtimeResult: { safeErrorCode: "RUNTIME_EVIDENCE_CONSTRUCTION_FAILED" } }); expect(JSON.stringify(result)).not.toContain("Respond safely.");
  });
  it("keeps Core Runtime free of Supabase imports", () => {
    const source = readFileSync("src/features/agents/runtime-orchestrator.ts", "utf8");
    expect(source).not.toMatch(/supabase/i);
  });
  it("does not expose an SDK payload when a runtime fake includes one", async () => {
    const values = input(); const deps = dependencies(values); deps._execute.mockResolvedValue({ status: "FAILED", userMessage: "safe", errorCode: "PROVIDER_REQUEST_FAILED", events: [], sdkPayload: { hidden: true } });
    const result = await executeApprovedProductRuntime(values, deps);
    expect(JSON.stringify(result)).not.toContain("sdkPayload");
  });
});
