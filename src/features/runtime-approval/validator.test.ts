import { describe, expect, it } from "vitest";
import { generateAgentDefinition } from "../agents/generator";
import { buildRuntimePlan } from "../agents/runtime-plan";
import { aiInquiryV1AgentBlueprint } from "../agents/types";
import type { RuntimeExecutionRequest } from "../agents/runtime-execution-request";
import {
  buildRuntimeApprovalBinding,
  canonicalSerializeRuntimeApprovalBinding,
  checksumRuntimeApprovalBinding,
  validateRuntimeApprovalBinding,
} from "./validator";

const checksum = (seed: string) => seed.padEnd(64, seed).slice(0, 64);

function fixture() {
  const request = {
    runtimeExecutionRequestId: "request.runtime.approval.1",
    integrityChecksum: checksum("a"),
    inputArtifactReferences: [
      { artifactId: "input.runtime.1", artifactType: "RUNTIME_INPUT", integrityChecksum: checksum("b") },
    ],
  } as RuntimeExecutionRequest;
  const blueprint = structuredClone(aiInquiryV1AgentBlueprint);
  const definition = generateAgentDefinition({
    projectId: "11111111-1111-4111-8111-111111111111",
    goal: "Create a safe runtime approval fixture.",
    blueprint,
    selectedDeliveryMode: "CHAT",
    selectedInterfaceModes: ["WEB_CHAT"],
  }).definition;
  const plan = buildRuntimePlan({
    runtimeExecutionRequest: request,
    blueprint,
    blueprintIntegrityChecksum: checksum("c"),
    agentDefinition: definition,
    agentDefinitionIntegrityChecksum: checksum("d"),
    inputArtifactReference: request.inputArtifactReferences[0],
    transientProviderInput: { systemInstruction: "Respond safely.", userInput: "Summarize the request." },
  });
  if (plan.status !== "VALID") throw new Error("expected valid runtime plan fixture");
  return { request, plan: plan.value };
}

describe("Runtime Approval binding", () => {
  it("creates a binding from an immutable request and plan", () => {
    const { request, plan } = fixture();
    const result = buildRuntimeApprovalBinding({
      projectId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      runtimeExecutionRequest: request,
      runtimePlan: plan,
    });
    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") return;
    expect(result.value).toMatchObject({
      scope: "CORE_RUNTIME_PROVIDER_EXECUTION",
      provider: "openai",
      runtimeExecutionRequestId: request.runtimeExecutionRequestId,
      runtimePlanId: plan.runtimePlanId,
      safeInputChecksum: plan.steps[0].safeInputChecksum,
    });
    expect(validateRuntimeApprovalBinding(result.value)).toBe(true);
  });

  it("uses deterministic key-sorted canonical serialization", () => {
    const first = {
      projectId: "project", userId: "user", scope: "CORE_RUNTIME_PROVIDER_EXECUTION" as const,
      runtimeExecutionRequestId: "request", runtimeExecutionRequestChecksum: checksum("a"),
      runtimePlanId: "plan", runtimePlanChecksum: checksum("b"), provider: "openai" as const,
      model: "gpt-test", safeInputChecksum: checksum("c"),
    };
    const second = {
      model: "gpt-test", provider: "openai" as const, runtimePlanChecksum: checksum("b"),
      runtimePlanId: "plan", safeInputChecksum: checksum("c"), scope: "CORE_RUNTIME_PROVIDER_EXECUTION" as const,
      userId: "user", runtimeExecutionRequestChecksum: checksum("a"),
      runtimeExecutionRequestId: "request", projectId: "project",
    };
    expect(canonicalSerializeRuntimeApprovalBinding(first)).toBe(canonicalSerializeRuntimeApprovalBinding(second));
    expect(checksumRuntimeApprovalBinding(first)).toBe(checksumRuntimeApprovalBinding(second));
  });

  it("rejects an invalid request checksum", () => {
    const value = fixture();
    const result = buildRuntimeApprovalBinding({
      projectId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      runtimeExecutionRequest: { ...value.request, integrityChecksum: "invalid" },
      runtimePlan: value.plan,
    });
    expect(result.status).toBe("INVALID");
  });

  it("rejects an invalid plan checksum", () => {
    const value = fixture();
    const result = buildRuntimeApprovalBinding({
      projectId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      runtimeExecutionRequest: value.request,
      runtimePlan: { ...value.plan, integrityChecksum: "invalid" },
    });
    expect(result.status).toBe("INVALID");
  });

  it("rejects a plan bound to a different request", () => {
    const { request, plan } = fixture();
    const result = buildRuntimeApprovalBinding({
      projectId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      runtimeExecutionRequest: { ...request, runtimeExecutionRequestId: "changed" },
      runtimePlan: plan,
    });
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") {
      expect(result.failures.some((failure) => failure.code === "RUNTIME_APPROVAL_BINDING_MISMATCH")).toBe(true);
    }
  });

  it("rejects a tampered binding checksum", () => {
    const { request, plan } = fixture();
    const result = buildRuntimeApprovalBinding({
      projectId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      runtimeExecutionRequest: request,
      runtimePlan: plan,
    });
    if (result.status !== "VALID") throw new Error("expected valid binding");
    expect(validateRuntimeApprovalBinding({ ...result.value, bindingChecksum: checksum("f") })).toBe(false);
  });

  it("does not serialize provider input or prompt content into the binding", () => {
    const { request, plan } = fixture();
    const result = buildRuntimeApprovalBinding({
      projectId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      runtimeExecutionRequest: request,
      runtimePlan: plan,
    });
    if (result.status !== "VALID") throw new Error("expected valid binding");
    expect(JSON.stringify(result.value)).not.toContain("Summarize the request.");
    expect(JSON.stringify(result.value)).not.toContain("Respond safely.");
  });
});
