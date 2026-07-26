import { describe, expect, it } from "vitest";
import { generateAgentDefinition } from "./generator";
import { buildRuntimePlan, validateRuntimePlan } from "./runtime-plan";
import { aiInquiryV1AgentBlueprint } from "./types";

const checksum = (seed: string) => seed.padEnd(64, seed).slice(0, 64);

function input(overrides: Record<string, unknown> = {}) {
  const blueprint = structuredClone(aiInquiryV1AgentBlueprint);
  const definition = generateAgentDefinition({
    projectId: "project.runtime",
    goal: "Create a safe runtime response.",
    blueprint,
    selectedDeliveryMode: "CHAT",
    selectedInterfaceModes: ["WEB_CHAT"],
  }).definition;
  return {
    runtimeExecutionRequest: {
      runtimeExecutionRequestId: "request.runtime.1",
      integrityChecksum: checksum("a"),
      inputArtifactReferences: [
        { artifactId: "input.runtime.1", artifactType: "RUNTIME_INPUT", integrityChecksum: checksum("b") },
      ],
    },
    blueprint,
    blueprintIntegrityChecksum: checksum("c"),
    agentDefinition: definition,
    agentDefinitionIntegrityChecksum: checksum("d"),
    inputArtifactReference: {
      artifactId: "input.runtime.1",
      artifactType: "RUNTIME_INPUT",
      integrityChecksum: checksum("b"),
    },
    transientProviderInput: {
      systemInstruction: "Respond briefly and safely.",
      userInput: "Summarize the request.",
    },
    ...overrides,
  };
}

describe("buildRuntimePlan", () => {
  it("builds one immutable OpenAI provider step without retaining raw input", () => {
    const result = buildRuntimePlan(input());
    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") return;
    expect(result.value.steps).toHaveLength(1);
    expect(result.value.steps[0]).toMatchObject({
      sequence: 1,
      invocationBoundary: "PROVIDER",
      provider: "openai",
      retryAllowed: false,
    });
    expect(JSON.stringify(result.value)).not.toContain("Summarize the request.");
    expect(Object.isFrozen(result.value)).toBe(true);
  });

  it("rejects a request input artifact that is not bound to the request", () => {
    const result = buildRuntimePlan(input({ inputArtifactReference: { artifactId: "different", artifactType: "RUNTIME_INPUT", integrityChecksum: checksum("e") } }));
    expect(result).toMatchObject({ status: "INVALID" });
    if (result.status === "INVALID") {
      expect(result.failures.some((item) => item.code === "RUNTIME_PLAN_INPUT_INVALID")).toBe(true);
    }
  });

  it("rejects an Agent Definition that does not match the Blueprint", () => {
    const values = input();
    const result = buildRuntimePlan({
      ...values,
      agentDefinition: { ...values.agentDefinition, blueprintVersion: "9.9.9" },
    });
    expect(result).toMatchObject({ status: "INVALID" });
  });

  it("rejects an unsupported provider model block", () => {
    const values = input();
    const result = buildRuntimePlan({
      ...values,
      agentDefinition: {
        ...values.agentDefinition,
        blocks: values.agentDefinition.blocks.map((block) =>
          block.kind === "MODEL" ? { ...block, provider: "supabase" } : block,
        ),
      },
    });
    expect(result).toMatchObject({ status: "INVALID" });
  });

  it("rejects secret-shaped transient input before it becomes a plan checksum", () => {
    const result = buildRuntimePlan(input({ transientProviderInput: { systemInstruction: "safe", userInput: `sk-${"x".repeat(24)}` } }));
    expect(result).toMatchObject({ status: "INVALID" });
    if (result.status === "INVALID") {
      expect(result.failures.some((item) => item.code === "RUNTIME_PLAN_INPUT_SECRET_DETECTED")).toBe(true);
    }
  });

  it("rejects a plan whose immutable checksum was changed", () => {
    const result = buildRuntimePlan(input());
    expect(result.status).toBe("VALID");
    if (result.status === "VALID") {
      expect(validateRuntimePlan({ ...result.value, runtimePlanId: "changed" }).valid).toBe(false);
    }
  });

  it.each([
    ["top-level raw prompt", (plan: Record<string, unknown>) => ({ ...plan, rawPrompt: "do not retain this" })],
    ["top-level raw output", (plan: Record<string, unknown>) => ({ ...plan, rawOutput: "do not retain this" })],
    ["top-level credentials", (plan: Record<string, unknown>) => ({ ...plan, credentials: "do not retain this" })],
    ["top-level SDK payload", (plan: Record<string, unknown>) => ({ ...plan, sdkPayload: { output: "do not retain this" } })],
    ["step unknown field", (plan: Record<string, unknown>) => ({
      ...plan,
      steps: [{ ...(plan.steps as Array<Record<string, unknown>>)[0], unknownField: true }],
    })],
    ["prompt reference unknown field", (plan: Record<string, unknown>) => {
      const step = (plan.steps as Array<Record<string, unknown>>)[0];
      return {
        ...plan,
        steps: [{
          ...step,
          promptReference: { ...(step.promptReference as Record<string, unknown>), rawPrompt: "do not retain this" },
        }],
      };
    }],
  ])("rejects a plan with an unknown %s", (_label, mutate) => {
    const result = buildRuntimePlan(input());
    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") return;
    expect(validateRuntimePlan(mutate(structuredClone(result.value) as Record<string, unknown>)).valid).toBe(false);
  });
});
