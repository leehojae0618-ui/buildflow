import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "./package-export";
import type { ReferenceIdentifier } from "./runtime-execution-request";
import type { RuntimeTransientProviderInput } from "./runtime-plan";

export const RUNTIME_PROVIDER_FORMAT_VERSION = "buildflow.runtime-provider.v1" as const;

export type ProviderErrorCode =
  | "PROVIDER_CONFIGURATION_MISSING"
  | "PROVIDER_AUTHENTICATION_FAILED"
  | "PROVIDER_MODEL_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_EMPTY_RESPONSE"
  | "PROVIDER_OUTPUT_INVALID"
  | "PROVIDER_CANCELLED"
  | "PROVIDER_REQUEST_FAILED";

export type ProviderExecutionCommand = {
  formatVersion: typeof RUNTIME_PROVIDER_FORMAT_VERSION;
  provider: "openai";
  model: string;
  promptReference: ReferenceIdentifier;
  inputReference: ReferenceIdentifier;
  safeInputChecksum: string;
  transientInput: RuntimeTransientProviderInput;
  timeoutMs: number;
  signal?: AbortSignal;
  runtimeExecutionId: string;
  runtimeStepId: string;
  runtimeStepAttemptId: string;
};

export type ProviderUsageFacts = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type ProviderInvocationSucceeded = {
  status: "SUCCEEDED";
  providerRequestReference: string;
  outputReference: string;
  outputChecksum: string;
  usage?: ProviderUsageFacts;
  latencyMs: number;
};

export type ProviderInvocationFailed = {
  status: "FAILED" | "TIMED_OUT" | "CANCELLED" | "BLOCKED";
  providerRequestReference?: string;
  errorCode: ProviderErrorCode;
  latencyMs: number;
  retryEligible: false;
};

export type ProviderInvocationResult =
  | ProviderInvocationSucceeded
  | ProviderInvocationFailed;

export interface ProviderAdapter {
  execute(command: ProviderExecutionCommand): Promise<ProviderInvocationResult>;
}

export function digestProviderSafeValue(value: unknown) {
  return createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");
}

export function isValidProviderInvocationResult(
  value: unknown,
): value is ProviderInvocationResult {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const result = value as Record<string, unknown>;
    if (result.status === "SUCCEEDED") {
      return (
        typeof result.providerRequestReference === "string" &&
        result.providerRequestReference.trim().length > 0 &&
        typeof result.outputReference === "string" &&
        result.outputReference.trim().length > 0 &&
        typeof result.outputChecksum === "string" &&
        /^[a-f0-9]{64}$/.test(result.outputChecksum) &&
        typeof result.latencyMs === "number" &&
        Number.isFinite(result.latencyMs) &&
        result.latencyMs >= 0
      );
    }
    if (
      result.status !== "FAILED" &&
      result.status !== "TIMED_OUT" &&
      result.status !== "CANCELLED" &&
      result.status !== "BLOCKED"
    ) {
      return false;
    }
    return (
      typeof result.errorCode === "string" &&
      result.errorCode.trim().length > 0 &&
      typeof result.latencyMs === "number" &&
      Number.isFinite(result.latencyMs) &&
      result.latencyMs >= 0 &&
      result.retryEligible === false &&
      (result.providerRequestReference === undefined ||
        (typeof result.providerRequestReference === "string" &&
          result.providerRequestReference.trim().length > 0))
    );
  } catch {
    return false;
  }
}
