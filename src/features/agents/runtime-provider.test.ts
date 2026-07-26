import { describe, expect, it } from "vitest";
import { digestProviderSafeValue, isValidProviderInvocationResult } from "./runtime-provider";

describe("Runtime Provider contract", () => {
  it("has a deterministic checksum for safe values", () => {
    expect(digestProviderSafeValue({ value: "safe" })).toBe(digestProviderSafeValue({ value: "safe" }));
  });

  it("accepts a normalized success without raw output", () => {
    expect(isValidProviderInvocationResult({
      status: "SUCCEEDED",
      providerRequestReference: "provider.request.1",
      outputReference: "provider.output.1",
      outputChecksum: "a".repeat(64),
      usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
      latencyMs: 4,
    })).toBe(true);
  });

  it("accepts normalized timeout and failure outcomes with retry disabled", () => {
    expect(isValidProviderInvocationResult({ status: "TIMED_OUT", errorCode: "PROVIDER_TIMEOUT", latencyMs: 1, retryEligible: false })).toBe(true);
    expect(isValidProviderInvocationResult({ status: "FAILED", errorCode: "PROVIDER_AUTHENTICATION_FAILED", latencyMs: 1, retryEligible: false })).toBe(true);
  });

  it("rejects a malformed success result", () => {
    expect(isValidProviderInvocationResult({
      status: "SUCCEEDED",
      providerRequestReference: "provider.request.1",
      outputReference: "",
      outputChecksum: "not-a-checksum",
      latencyMs: -1,
    })).toBe(false);
  });

  it.each([
    null,
    undefined,
    "provider response",
    1,
    true,
    () => undefined,
    [],
    {},
    { value: "missing-status" },
    { status: "UNKNOWN" },
    { status: "SUCCEEDED", providerRequestReference: "request.1" },
    { status: "FAILED", latencyMs: 1, retryEligible: false },
  ])("rejects malformed provider envelopes without throwing: %o", (value) => {
    expect(() => isValidProviderInvocationResult(value)).not.toThrow();
    expect(isValidProviderInvocationResult(value)).toBe(false);
  });
});
