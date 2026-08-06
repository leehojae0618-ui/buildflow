import type {
  ExternalBuilderOperation,
  NormalizedExternalBuilderError,
  NormalizedExternalBuilderErrorCode,
} from "./types";
import type { ExternalBuilderPlatform } from "../types";

const safeMessages: Readonly<Record<NormalizedExternalBuilderErrorCode, string>> = {
  CREDENTIAL_REQUIRED: "Credential reference is required before this operation can be prepared.",
  UNAUTHORIZED: "The external platform rejected authorization for this request.",
  FORBIDDEN: "The external platform denied this operation.",
  NOT_FOUND: "The requested external resource was not found.",
  RATE_LIMITED: "The external platform temporarily limited this request.",
  TIMEOUT: "The external platform request timed out.",
  NETWORK_ERROR: "The external platform request could not be completed.",
  INVALID_REQUEST: "The external platform request is invalid.",
  INVALID_PLATFORM_RESPONSE: "외부 플랫폼 응답 형식이 예상과 다릅니다.",
  PLATFORM_UNAVAILABLE: "The external platform is temporarily unavailable.",
  EXECUTION_FAILED: "The external platform reported an execution failure.",
  UNSUPPORTED_OPERATION: "This external platform operation is not implemented in BuildFlow.",
  APPROVAL_REQUIRED: "Approval reference is required before this external operation can be prepared.",
  UNKNOWN_EXTERNAL_ERROR: "The external platform returned an unexpected safe error state.",
};

export function createNormalizedError(
  platform: ExternalBuilderPlatform,
  operation: ExternalBuilderOperation,
  code: NormalizedExternalBuilderErrorCode,
  occurredAt: string,
  options: Pick<NormalizedExternalBuilderError, "retryable" | "httpStatus" | "externalReference" | "detailsReference">,
): NormalizedExternalBuilderError {
  return {
    platform,
    operation,
    code,
    safeMessage: safeMessages[code],
    retryable: options.retryable,
    ...(options.httpStatus === undefined ? {} : { httpStatus: options.httpStatus }),
    ...(options.externalReference === undefined ? {} : { externalReference: options.externalReference }),
    ...(options.detailsReference === undefined ? {} : { detailsReference: options.detailsReference }),
    occurredAt,
  };
}

export function errorCodeForHttpStatus(status: number): NormalizedExternalBuilderErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status === 408) return "TIMEOUT";
  if (status >= 500) return "PLATFORM_UNAVAILABLE";
  if (status >= 400) return "INVALID_REQUEST";
  return "UNKNOWN_EXTERNAL_ERROR";
}
