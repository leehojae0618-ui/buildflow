import type { ExternalBuilderOperation, NormalizedExternalBuilderError, RetryPolicy } from "./types";

const retryableCodes = new Set(["TIMEOUT", "NETWORK_ERROR", "RATE_LIMITED", "PLATFORM_UNAVAILABLE"]);

export function shouldRetryOperation(
  operation: ExternalBuilderOperation,
  error: Pick<NormalizedExternalBuilderError, "code" | "httpStatus">,
  attempt: number,
  policy: RetryPolicy,
): boolean {
  if (operation === "CREATE" || attempt >= policy.maxAttempts) return false;
  return retryableCodes.has(error.code) || (error.httpStatus !== undefined && policy.retryableStatusCodes.includes(error.httpStatus));
}

export function retryDelayMs(attempt: number, policy: RetryPolicy): number {
  const delay = policy.initialDelayMs * policy.backoffMultiplier ** Math.max(0, attempt - 1);
  return Math.min(policy.maxDelayMs, Math.round(delay));
}
