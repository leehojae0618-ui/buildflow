import { describe, expect, it } from "vitest";
import { createLiveDbFakeProvider, validateLiveDbFakeProvider } from "./fake-provider";

describe("LIVE-DB fake provider", () => {
  it("returns a deterministic safe provider result without external calls", async () => {
    const provider = createLiveDbFakeProvider();
    const result = await provider.execute({
      formatVersion: "buildflow.runtime-provider.v1",
      provider: "openai",
      model: "test-model",
      promptReference: { referenceType: "AGENT_PACKAGE", referenceId: "prompt-ref" },
      inputReference: { referenceType: "AGENT_PACKAGE", referenceId: "input-ref" },
      safeInputChecksum: "a".repeat(64),
      transientInput: { systemInstruction: "test instruction", userInput: "test input" },
      timeoutMs: 1,
      runtimeExecutionId: "run-1",
      runtimeStepId: "step-1",
      runtimeStepAttemptId: "attempt-1",
    });
    expect(result).toMatchObject({ status: "SUCCEEDED", latencyMs: 0 });
    expect(provider.invocationCount).toBe(1);
    expect(provider.externalProviderCallCount).toBe(0);
    expect(validateLiveDbFakeProvider(provider)).toEqual({ status: "VALID" });
  });

  it("rejects missing, default, or external provider identities", () => {
    expect(validateLiveDbFakeProvider(undefined)).toEqual({ status: "INVALID", safeErrorCode: "LIVE_DB_PROVIDER_NOT_INJECTED" });
    expect(validateLiveDbFakeProvider({ providerMode: "FAKE" })).toEqual({ status: "INVALID", safeErrorCode: "LIVE_DB_PROVIDER_IDENTITY_INVALID" });
    const provider = createLiveDbFakeProvider() as unknown as { externalProviderCallCount: number };
    provider.externalProviderCallCount = 1;
    expect(validateLiveDbFakeProvider(provider)).toEqual({ status: "INVALID", safeErrorCode: "LIVE_DB_EXTERNAL_PROVIDER_CALL_DETECTED" });
  });
});
