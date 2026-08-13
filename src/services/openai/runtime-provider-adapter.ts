import "server-only";
import { hasOpenAIEnv } from "../../lib/env/server";
import {
  digestProviderSafeValue,
  type ProviderAdapter,
  type ProviderExecutionCommand,
  type ProviderInvocationResult,
} from "../../features/agents/runtime-provider";
import { createOpenAIClient } from "./client";

type OpenAIErrorShape = {
  status?: unknown;
  name?: unknown;
  code?: unknown;
};

export type OpenAIRuntimeProviderAdapterDependencies = {
  isConfigured?: () => boolean;
  createClient?: typeof createOpenAIClient;
  onOutputText?: (output: string) => void;
};

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = (error as OpenAIErrorShape).status;
  return typeof status === "number" ? status : undefined;
}

function errorName(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const name = (error as OpenAIErrorShape).name;
  return typeof name === "string" ? name : "";
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const code = (error as OpenAIErrorShape).code;
  return typeof code === "string" ? code : "";
}

export function normalizeOpenAIProviderError(
  error: unknown,
  latencyMs: number,
  providerRequestReference: string,
): ProviderInvocationResult {
  const status = errorStatus(error);
  const name = errorName(error);
  const code = errorCode(error);
  if (name === "AbortError") {
    return {
      status: "CANCELLED",
      errorCode: "PROVIDER_CANCELLED",
      providerRequestReference,
      latencyMs,
      retryEligible: false,
    };
  }
  if (name.includes("Timeout")) {
    return {
      status: "TIMED_OUT",
      errorCode: "PROVIDER_TIMEOUT",
      providerRequestReference,
      latencyMs,
      retryEligible: false,
    };
  }
  if (status === 401 || status === 403) {
    return {
      status: "FAILED",
      errorCode: "PROVIDER_AUTHENTICATION_FAILED",
      providerRequestReference,
      latencyMs,
      retryEligible: false,
    };
  }
  if (status === 404 || code === "model_not_found") {
    return {
      status: "FAILED",
      errorCode: "PROVIDER_MODEL_UNAVAILABLE",
      providerRequestReference,
      latencyMs,
      retryEligible: false,
    };
  }
  if (status === 429) {
    return {
      status: "FAILED",
      errorCode: "PROVIDER_RATE_LIMITED",
      providerRequestReference,
      latencyMs,
      retryEligible: false,
    };
  }
  return {
    status: "FAILED",
    errorCode: "PROVIDER_REQUEST_FAILED",
    providerRequestReference,
    latencyMs,
    retryEligible: false,
  };
}

export function createOpenAIRuntimeProviderAdapter(
  now: () => number = () => Date.now(),
  dependencies: OpenAIRuntimeProviderAdapterDependencies = {},
): ProviderAdapter {
  return {
    async execute(command: ProviderExecutionCommand): Promise<ProviderInvocationResult> {
      const startedAt = now();
      const providerRequestReference = `openai.request.${digestProviderSafeValue({
        runtimeExecutionId: command.runtimeExecutionId,
        runtimeStepId: command.runtimeStepId,
        runtimeStepAttemptId: command.runtimeStepAttemptId,
        model: command.model,
        safeInputChecksum: command.safeInputChecksum,
      })}`;
      const isConfigured = dependencies.isConfigured ?? (() => hasOpenAIEnv);
      if (!isConfigured()) {
        return {
          status: "BLOCKED",
          errorCode: "PROVIDER_CONFIGURATION_MISSING",
          providerRequestReference,
          latencyMs: Math.max(0, now() - startedAt),
          retryEligible: false,
        };
      }
      try {
        const createClient = dependencies.createClient ?? createOpenAIClient;
        const client = createClient();
        const response = await client.responses.create(
          {
            model: command.model,
            input: [
              { role: "system", content: command.transientInput.systemInstruction },
              { role: "user", content: command.transientInput.userInput },
            ],
          },
          command.signal ? { signal: command.signal } : undefined,
        );
        const output = response.output_text?.trim();
        const latencyMs = Math.max(0, now() - startedAt);
        if (!output) {
          return {
            status: "FAILED",
            errorCode: "PROVIDER_EMPTY_RESPONSE",
            providerRequestReference,
            latencyMs,
            retryEligible: false,
          };
        }
        try {
          dependencies.onOutputText?.(output);
        } catch {
          return {
            status: "FAILED",
            errorCode: "PROVIDER_REQUEST_FAILED",
            providerRequestReference,
            latencyMs,
            retryEligible: false,
          };
        }
        const usage = response.usage;
        return {
          status: "SUCCEEDED",
          providerRequestReference,
          outputReference: `openai.output.${digestProviderSafeValue(output)}`,
          outputChecksum: digestProviderSafeValue(output),
          ...(usage
            ? {
                usage: {
                  ...(typeof usage.input_tokens === "number"
                    ? { inputTokens: usage.input_tokens }
                    : {}),
                  ...(typeof usage.output_tokens === "number"
                    ? { outputTokens: usage.output_tokens }
                    : {}),
                  ...(typeof usage.total_tokens === "number"
                    ? { totalTokens: usage.total_tokens }
                    : {}),
                },
              }
            : {}),
          latencyMs,
        };
      } catch (error) {
        return normalizeOpenAIProviderError(
          error,
          Math.max(0, now() - startedAt),
          providerRequestReference,
        );
      }
    },
  };
}
