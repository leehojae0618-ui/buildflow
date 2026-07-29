import type {
  ProviderAdapter,
  ProviderExecutionCommand,
  ProviderInvocationResult,
} from "../../src/features/agents/runtime-provider";
import { digestProviderSafeValue } from "../../src/features/agents/runtime-provider";
import {
  LIVE_DB_PROVIDER_ADAPTER_IDENTITY,
  LIVE_DB_PROVIDER_MODE,
  type LiveDbProviderIdentity,
  type LiveDbSafeErrorCode,
} from "./types";

export type LiveDbFakeProvider = ProviderAdapter & LiveDbProviderIdentity & {
  readonly invocationCount: number;
};

export type FakeProviderValidation =
  | { status: "VALID" }
  | { status: "INVALID"; safeErrorCode: LiveDbSafeErrorCode };

/** A deterministic ProviderAdapter that never imports or invokes an SDK. */
export function createLiveDbFakeProvider(): LiveDbFakeProvider {
  let invocationCount = 0;
  return {
    providerMode: LIVE_DB_PROVIDER_MODE,
    providerAdapterIdentity: LIVE_DB_PROVIDER_ADAPTER_IDENTITY,
    externalProviderCallCount: 0,
    defaultProviderFallbackUsed: false,
    openAIAdapterConstructedByHarness: false,
    openAIAdapterCalled: false,
    get invocationCount() {
      return invocationCount;
    },
    async execute(command: ProviderExecutionCommand): Promise<ProviderInvocationResult> {
      invocationCount += 1;
      return {
        status: "SUCCEEDED",
        providerRequestReference: `fake-provider-request:${command.runtimeExecutionId}`,
        outputReference: `fake-provider-output:${command.runtimeStepAttemptId}`,
        outputChecksum: digestProviderSafeValue({
          adapter: LIVE_DB_PROVIDER_ADAPTER_IDENTITY,
          runtimeExecutionId: command.runtimeExecutionId,
          runtimeStepId: command.runtimeStepId,
          safeInputChecksum: command.safeInputChecksum,
        }),
        latencyMs: 0,
      };
    },
  };
}

export function validateLiveDbFakeProvider(provider: unknown): FakeProviderValidation {
  if (!provider || typeof provider !== "object") {
    return { status: "INVALID", safeErrorCode: "LIVE_DB_PROVIDER_NOT_INJECTED" };
  }
  const candidate = provider as Partial<LiveDbProviderIdentity>;
  if (candidate.providerMode !== LIVE_DB_PROVIDER_MODE ||
    candidate.providerAdapterIdentity !== LIVE_DB_PROVIDER_ADAPTER_IDENTITY) {
    return { status: "INVALID", safeErrorCode: "LIVE_DB_PROVIDER_IDENTITY_INVALID" };
  }
  if (candidate.externalProviderCallCount !== 0 ||
    candidate.defaultProviderFallbackUsed !== false ||
    candidate.openAIAdapterConstructedByHarness !== false ||
    candidate.openAIAdapterCalled !== false) {
    return { status: "INVALID", safeErrorCode: "LIVE_DB_EXTERNAL_PROVIDER_CALL_DETECTED" };
  }
  return { status: "VALID" };
}
