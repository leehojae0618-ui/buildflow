import { createDryRunPreview, operationRequiresApproval } from "./dry-run";
import { createNormalizedError, errorCodeForHttpStatus } from "./errors";
import { isSafeCredentialReference, parsePlatformResponse, validateExternalBaseUrl, assertNoSecretShapedValue } from "./validation";
import type {
  DryRunPreview,
  ExternalBuilderClientConfig,
  ExternalBuilderClientResult,
  ExternalBuilderOperation,
  ExternalBuilderRequestContext,
  ExternalBuilderTransport,
  ExternalBuilderTransportRequest,
} from "./types";

export type MockClientRunInput = {
  config: ExternalBuilderClientConfig;
  operation: ExternalBuilderOperation;
  context: ExternalBuilderRequestContext;
  method: ExternalBuilderTransportRequest["method"];
  path: string;
  body?: unknown;
  warnings: readonly string[];
  transport?: ExternalBuilderTransport;
  now?: string;
};

function safeTimestamp(now?: string): string {
  return now ?? new Date().toISOString();
}

function failedResult(
  input: MockClientRunInput,
  code: Parameters<typeof createNormalizedError>[2],
  options: Omit<Parameters<typeof createNormalizedError>[4], "retryable"> & { retryable?: boolean },
): ExternalBuilderClientResult {
  const occurredAt = safeTimestamp(input.now);
  return {
    platform: input.config.platform,
    operation: input.operation,
    requestId: input.context.requestId,
    status: "FAILED",
    normalizedError: createNormalizedError(input.config.platform, input.operation, code, occurredAt, { retryable: options.retryable ?? false, ...options }),
    actualExternalAction: false,
    startedAt: occurredAt,
    finishedAt: occurredAt,
  };
}

export function buildExternalBuilderTransportRequest(input: MockClientRunInput): ExternalBuilderTransportRequest {
  const baseUrl = validateExternalBaseUrl(input.config.baseUrl);
  if (!isSafeCredentialReference(input.config.credentialReference) || !isSafeCredentialReference(input.context.credentialReference)) {
    throw new Error("CREDENTIAL_REFERENCE_UNSAFE");
  }
  if (input.config.credentialReference !== input.context.credentialReference) throw new Error("CREDENTIAL_REFERENCE_MISMATCH");
  assertNoSecretShapedValue(input.body);
  return {
    method: input.method,
    url: `${baseUrl}${input.path}`,
    headers: { accept: "application/json", "content-type": "application/json" },
    ...(input.body === undefined ? {} : { body: input.body }),
    timeoutMs: input.config.timeoutMs,
    requestId: input.context.requestId,
    signal: new AbortController().signal,
  };
}

export async function runMockClient(input: MockClientRunInput): Promise<DryRunPreview | ExternalBuilderClientResult> {
  const request = buildExternalBuilderTransportRequest(input);
  if (input.config.dryRun || input.context.dryRun) {
    return createDryRunPreview(input.config.platform, input.operation, request, input.context, input.warnings);
  }
  if (operationRequiresApproval(input.operation) && !input.context.approvalReference) {
    return failedResult(input, "APPROVAL_REQUIRED", {});
  }
  if (!input.transport || input.transport.mode !== "MOCK") {
    return failedResult(input, "UNSUPPORTED_OPERATION", {});
  }

  const startedAt = safeTimestamp(input.now);
  try {
    const response = await input.transport.request(request);
    if (response.status < 200 || response.status >= 300) {
      const code = errorCodeForHttpStatus(response.status);
      return failedResult(input, code, { httpStatus: response.status, retryable: code === "RATE_LIMITED" || code === "TIMEOUT" || code === "PLATFORM_UNAVAILABLE" });
    }
    try {
      const parsed = parsePlatformResponse(input.config.platform, input.operation, response.body, `mock.${input.config.platform.toLowerCase()}.response.${input.context.requestId}`);
      return {
        platform: input.config.platform,
        operation: input.operation,
        requestId: input.context.requestId,
        status: parsed.status,
        ...(parsed.externalWorkflowId === undefined ? {} : { externalWorkflowId: parsed.externalWorkflowId }),
        ...(parsed.externalExecutionId === undefined ? {} : { externalExecutionId: parsed.externalExecutionId }),
        responseReference: parsed.responseReference,
        actualExternalAction: false,
        startedAt,
        finishedAt: response.receivedAt,
      };
    } catch {
      return failedResult(input, "INVALID_PLATFORM_RESPONSE", {});
    }
  } catch {
    return failedResult(input, "NETWORK_ERROR", { retryable: true });
  }
}
