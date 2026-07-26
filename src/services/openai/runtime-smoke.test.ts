import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { runOpenAIRuntimeSmokeTest } from "./runtime-smoke";

const checksum = "f".repeat(64);

describe("OpenAI Runtime smoke harness", () => {
  it("uses one injected provider invocation and returns only safe Runtime and Evidence metadata", async () => {
    const execute = vi.fn().mockResolvedValue({
      status: "SUCCEEDED",
      providerRequestReference: "provider.request.safe",
      outputReference: "provider.output.safe",
      outputChecksum: checksum,
      usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 },
      latencyMs: 12,
    });

    const result = await runOpenAIRuntimeSmokeTest({
      provider: { execute },
      now: () => new Date("2026-07-26T00:00:00.000Z"),
    });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: "SUCCEEDED",
      resultStatus: "SUCCEEDED",
      evidence: {
        count: 1,
        status: "SUCCEEDED",
        provider: "openai",
        hasSafeInputChecksum: true,
        hasSafeOutputChecksum: true,
        hasProviderRequestReference: true,
        usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 },
      },
    });
    expect(result.eventTypes).toEqual([
      "PLAN_ACCEPTED",
      "RUNTIME_STARTED",
      "PROVIDER_INVOCATION_STARTED",
      "PROVIDER_INVOCATION_COMPLETED",
      "EVIDENCE_APPENDED",
      "STEP_COMPLETED",
      "RUNTIME_COMPLETED",
    ]);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/"(?:systemInstruction|userInput|prompt|outputReference|outputChecksum)"/i);
  });

  it("preserves a normalized provider error in the safe smoke summary", async () => {
    const result = await runOpenAIRuntimeSmokeTest({
      provider: {
        execute: async () => ({
          status: "FAILED",
          errorCode: "PROVIDER_MODEL_UNAVAILABLE",
          latencyMs: 12,
          retryEligible: false,
        }),
      },
      now: () => new Date("2026-07-26T00:00:00.000Z"),
    });

    expect(result).toMatchObject({
      status: "FAILED",
      errorCode: "PROVIDER_MODEL_UNAVAILABLE",
      resultStatus: "FAILED",
      evidence: {
        count: 1,
        status: "FAILED",
        errorCode: "PROVIDER_MODEL_UNAVAILABLE",
        hasSafeInputChecksum: true,
        hasSafeOutputChecksum: false,
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/"(?:systemInstruction|userInput|prompt|outputReference|outputChecksum)"/i);
  });
});
