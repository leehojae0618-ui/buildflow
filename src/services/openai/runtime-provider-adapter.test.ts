import { describe, expect, it, vi } from "vitest";
import type { ProviderExecutionCommand } from "../../features/agents/runtime-provider";

vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({ createOpenAIClient: vi.fn() }));

import {
  createOpenAIRuntimeProviderAdapter,
  normalizeOpenAIProviderError,
} from "./runtime-provider-adapter";

const checksum = "a".repeat(64);

function command(signal?: AbortSignal): ProviderExecutionCommand {
  return {
    formatVersion: "buildflow.runtime-provider.v1",
    provider: "openai",
    model: "gpt-5-mini",
    promptReference: { referenceId: "prompt.runtime.1", integrityChecksum: checksum },
    inputReference: { referenceId: "input.runtime.1", integrityChecksum: checksum },
    safeInputChecksum: checksum,
    transientInput: { systemInstruction: "System instruction", userInput: "User input" },
    timeoutMs: 12_000,
    runtimeExecutionId: "execution.1",
    runtimeStepId: "step.1",
    runtimeStepAttemptId: "attempt.1",
    ...(signal ? { signal } : {}),
  };
}

function adapterFor(
  create: ReturnType<typeof vi.fn>,
  options: { configured?: boolean; now?: () => number } = {},
) {
  return createOpenAIRuntimeProviderAdapter(options.now ?? (() => 100), {
    isConfigured: () => options.configured ?? true,
    createClient: () => ({ responses: { create } }) as never,
  });
}

describe("OpenAI Runtime Provider Adapter", () => {
  it("normalizes authentication errors without exposing the source error", () => {
    const result = normalizeOpenAIProviderError({ status: 401, message: "do-not-expose" }, 5, "request.1");
    expect(result).toEqual({
      status: "FAILED",
      errorCode: "PROVIDER_AUTHENTICATION_FAILED",
      providerRequestReference: "request.1",
      latencyMs: 5,
      retryEligible: false,
    });
    expect(JSON.stringify(result)).not.toContain("do-not-expose");
  });

  it("normalizes rate limits and timeouts", () => {
    expect(normalizeOpenAIProviderError({ status: 429 }, 3, "request.1")).toMatchObject({
      status: "FAILED",
      errorCode: "PROVIDER_RATE_LIMITED",
      retryEligible: false,
    });
    expect(normalizeOpenAIProviderError({ name: "APIConnectionTimeoutError" }, 3, "request.1")).toMatchObject({
      status: "TIMED_OUT",
      errorCode: "PROVIDER_TIMEOUT",
      retryEligible: false,
    });
    expect(normalizeOpenAIProviderError({ status: 404, code: "model_not_found" }, 3, "request.1")).toMatchObject({
      status: "FAILED",
      errorCode: "PROVIDER_MODEL_UNAVAILABLE",
      retryEligible: false,
    });
  });

  it("normalizes aborts and unknown errors without a stack trace", () => {
    expect(normalizeOpenAIProviderError({ name: "AbortError" }, 2, "request.1")).toMatchObject({
      status: "CANCELLED",
      errorCode: "PROVIDER_CANCELLED",
    });
    const result = normalizeOpenAIProviderError({ stack: "private stack trace" }, 2, "request.1");
    expect(result).toMatchObject({ status: "FAILED", errorCode: "PROVIDER_REQUEST_FAILED" });
    expect(JSON.stringify(result)).not.toContain("private stack trace");
  });

  it("returns a safe blocked result without constructing a client when configuration is absent", async () => {
    const create = vi.fn();
    const result = await adapterFor(create, { configured: false }).execute(command());
    expect(create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: "BLOCKED",
      errorCode: "PROVIDER_CONFIGURATION_MISSING",
      retryEligible: false,
    });
  });

  it("maps a bounded non-streaming OpenAI response to safe success metadata", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: "Raw SDK output must not escape.",
      usage: { input_tokens: 2, output_tokens: 3, total_tokens: 5 },
      sdkPayload: { private: "do-not-return" },
    });
    const now = vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(125);
    const result = await adapterFor(create, { now }).execute(command());

    expect(create).toHaveBeenCalledWith({
      model: "gpt-5-mini",
      input: [
        { role: "system", content: "System instruction" },
        { role: "user", content: "User input" },
      ],
    }, undefined);
    expect(create.mock.calls[0]?.[0]).not.toHaveProperty("stream");
    expect(result).toMatchObject({
      status: "SUCCEEDED",
      usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 },
      latencyMs: 25,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("Raw SDK output must not escape.");
    expect(serialized).not.toContain("do-not-return");
    expect(serialized).not.toContain("sdkPayload");
  });

  it("does not treat an empty OpenAI response as success", async () => {
    const create = vi.fn().mockResolvedValue({ output_text: "   " });
    const result = await adapterFor(create).execute(command());
    expect(result).toMatchObject({
      status: "FAILED",
      errorCode: "PROVIDER_EMPTY_RESPONSE",
      retryEligible: false,
    });
  });

  it("forwards the supplied AbortSignal to the SDK call", async () => {
    const create = vi.fn().mockResolvedValue({ output_text: "safe" });
    const controller = new AbortController();
    await adapterFor(create).execute(command(controller.signal));
    expect(create.mock.calls[0]?.[1]).toEqual({ signal: controller.signal });
  });

  it.each([
    ["authentication", { status: 401 }, "PROVIDER_AUTHENTICATION_FAILED"],
    ["timeout", { name: "APIConnectionTimeoutError" }, "PROVIDER_TIMEOUT"],
    ["rate limit", { status: 429 }, "PROVIDER_RATE_LIMITED"],
    ["model unavailable", { status: 404, code: "model_not_found" }, "PROVIDER_MODEL_UNAVAILABLE"],
    ["unknown SDK error", { stack: "private stack trace" }, "PROVIDER_REQUEST_FAILED"],
  ])("normalizes a %s error through the actual adapter path", async (_label, error, errorCode) => {
    const create = vi.fn().mockRejectedValue(error);
    const result = await adapterFor(create).execute(command());
    expect(result).toMatchObject({ status: errorCode === "PROVIDER_TIMEOUT" ? "TIMED_OUT" : "FAILED", errorCode, retryEligible: false });
    expect(JSON.stringify(result)).not.toContain("private stack trace");
  });
});
