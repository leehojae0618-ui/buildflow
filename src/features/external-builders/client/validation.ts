import type { ExternalBuilderOperation, ParsedPlatformResponse } from "./types";
import type { ExternalBuilderPlatform } from "../types";

const secretPattern = /(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|Bearer\s+[A-Za-z0-9._~+/=-]{10,})/i;
const knownStatuses = new Set(["PENDING", "RUNNING", "WAITING", "SUCCEEDED", "SUCCESS", "FAILED", "ERROR", "CANCELLED", "TIMED_OUT"]);
const maximumResponseBytes = 64 * 1024;

export function isSafeCredentialReference(value: string): boolean {
  return Boolean(value) && value.length <= 160 && !secretPattern.test(value);
}

export function validateExternalBaseUrl(baseUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("BASE_URL_INVALID");
  }
  const host = parsed.hostname.toLowerCase();
  const privateIpv4 = /^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(host)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || host === "localhost" || host.endsWith(".localhost") || privateIpv4 || host === "::1" || host.startsWith("fe80:")) {
    throw new Error("BASE_URL_UNSAFE");
  }
  return parsed.toString().replace(/\/$/, "");
}

export function assertNoSecretShapedValue(value: unknown): void {
  if (typeof value === "string") {
    if (secretPattern.test(value)) throw new Error("INPUT_CONTAINS_SECRET_SHAPED_VALUE");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(assertNoSecretShapedValue);
    return;
  }
  if (value && typeof value === "object") Object.values(value).forEach(assertNoSecretShapedValue);
}

export function parsePlatformResponse(
  platform: ExternalBuilderPlatform,
  operation: ExternalBuilderOperation,
  body: unknown,
  responseReference: string,
): ParsedPlatformResponse {
  try {
    if (Buffer.byteLength(JSON.stringify(body), "utf8") > maximumResponseBytes) throw new Error("RESPONSE_BODY_TOO_LARGE");
  } catch {
    throw new Error("INVALID_PLATFORM_RESPONSE");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("INVALID_PLATFORM_RESPONSE");
  const candidate = body as Record<string, unknown>;
  const status = typeof candidate.status === "string" ? candidate.status.toUpperCase() : undefined;
  if (!status || !knownStatuses.has(status)) throw new Error("INVALID_PLATFORM_RESPONSE");
  const workflowId = typeof candidate.workflowId === "string" ? candidate.workflowId : typeof candidate.id === "string" ? candidate.id : undefined;
  const executionId = typeof candidate.executionId === "string" ? candidate.executionId : undefined;
  if ((operation === "CREATE" || operation === "GET") && !workflowId) throw new Error("INVALID_PLATFORM_RESPONSE");
  if ((operation === "EXECUTE" || operation === "GET_EXECUTION" || operation === "GET_EXECUTION_LOGS") && !executionId) throw new Error("INVALID_PLATFORM_RESPONSE");
  return {
    ...(workflowId === undefined ? {} : { externalWorkflowId: `${platform.toLowerCase()}.mock.workflow.${workflowId}` }),
    ...(executionId === undefined ? {} : { externalExecutionId: `${platform.toLowerCase()}.mock.execution.${executionId}` }),
    status: status === "SUCCESS" ? "SUCCEEDED" : status === "ERROR" ? "FAILED" : status as ParsedPlatformResponse["status"],
    responseReference,
  };
}
