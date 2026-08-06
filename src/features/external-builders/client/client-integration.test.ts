import { describe, expect, it } from "vitest";
import { deliveryBeforeApprovalTest, validInquiryApprovedTest } from "../../verification-loop/fixtures";
import { evaluateAcceptance } from "../../verification-loop/verdict";
import { verifyMockClientResult } from "./integration";
import { decidePolling } from "./polling";
import { retryDelayMs, shouldRetryOperation } from "./retry";
import { MockExternalBuilderTransport } from "./transport";
import type { ExternalBuilderClientConfig, ExternalBuilderRequestContext } from "./types";
import { assertNoSecretShapedValue } from "./validation";
import { runMakeClient } from "../make/client";

const credentialReference = "MAKE_CONNECTION_SLACK_REFERENCE_REQUIRED";
const config: ExternalBuilderClientConfig = {
  platform: "MAKE",
  baseUrl: "https://make.example.invalid",
  credentialReference,
  timeoutMs: 1_000,
  retryPolicy: { maxAttempts: 2, initialDelayMs: 10, maxDelayMs: 100, backoffMultiplier: 2, retryableStatusCodes: [408, 429, 502, 503, 504] },
  pollingPolicy: { intervalMs: 10, maxAttempts: 3, overallTimeoutMs: 100, terminalStatuses: ["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"] },
  dryRun: false,
};
const context: ExternalBuilderRequestContext = { requestId: "mock-execution-1", projectId: "project-1", blueprintChecksum: "checksum-1", approvalReference: "approval.mock.1", credentialReference, dryRun: false };
const now = "2026-08-06T02:00:00.000Z";

describe("external builder client integration", () => {
  it("allows 429 retry but blocks 401 and all create retries", () => {
    expect(shouldRetryOperation("GET", { code: "RATE_LIMITED", httpStatus: 429 }, 1, config.retryPolicy)).toBe(true);
    expect(shouldRetryOperation("GET", { code: "UNAUTHORIZED", httpStatus: 401 }, 1, config.retryPolicy)).toBe(false);
    expect(shouldRetryOperation("CREATE", { code: "PLATFORM_UNAVAILABLE", httpStatus: 503 }, 1, config.retryPolicy)).toBe(false);
    expect(retryDelayMs(2, config.retryPolicy)).toBe(20);
  });

  it("stops polling on terminal, failure, and max-attempt boundaries without treating unknown as success", () => {
    expect(decidePolling("SUCCEEDED", 1, 0, 10, config.pollingPolicy)).toBe("COMPLETE");
    expect(decidePolling("FAILED", 1, 0, 10, config.pollingPolicy)).toBe("COMPLETE");
    expect(decidePolling("UNKNOWN", 3, 0, 10, config.pollingPolicy)).toBe("TIMED_OUT");
    expect(decidePolling("UNKNOWN", 1, 0, 10, config.pollingPolicy)).toBe("CONTINUE");
  });

  it("normalizes a mock success to simulated evidence and still fails forbidden observations", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 200, headers: {}, body: { workflowId: "scenario-1", executionId: "execution-1", status: "SUCCEEDED" }, receivedAt: now }));
    const result = await runMakeClient({ config, operation: "EXECUTE", context, transport, now });
    if (!("status" in result)) throw new Error("unexpected dry run");
    const verified = verifyMockClientResult(deliveryBeforeApprovalTest, result, ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL"]);
    expect(verified.evidence.sourceType).toBe("SIMULATED_FIXTURE");
    expect(verified.execution.actualExternalExecution).toBe(false);
    expect(verified.verdict).toMatchObject({ status: "FAILED", failureCode: "FORBIDDEN_OBSERVATION_DETECTED" });
  });

  it("keeps missing evidence as NOT_VERIFIED and never converts dry-run into evidence", async () => {
    expect(evaluateAcceptance(validInquiryApprovedTest)).toMatchObject({ status: "NOT_VERIFIED", failureCode: "EVIDENCE_MISSING" });
    const dryRun = await runMakeClient({ config: { ...config, dryRun: true }, operation: "EXECUTE", context: { ...context, dryRun: true }, now });
    expect(() => verifyMockClientResult(validInquiryApprovedTest, dryRun as never, [])).toThrow("MOCK_EXECUTION_REQUIRED");
  });

  it("keeps normalized external errors safe and does not leak input body tokens", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 401, headers: {}, body: { message: "ignored" }, receivedAt: now }));
    const result = await runMakeClient({ config, operation: "GET", context, transport, now });
    if (!("status" in result)) throw new Error("unexpected dry run");
    expect(result.normalizedError).toMatchObject({ code: "UNAUTHORIZED", retryable: false });
    expect(JSON.stringify(result.normalizedError)).not.toContain("Bearer");
  });

  it("normalizes timeout responses and rejects secret-shaped body values", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 408, headers: {}, body: {}, receivedAt: now }));
    const result = await runMakeClient({ config, operation: "GET", context, transport, now });
    if (!("status" in result)) throw new Error("unexpected dry run");
    expect(result.normalizedError).toMatchObject({ code: "TIMEOUT", retryable: true, httpStatus: 408 });
    expect(() => assertNoSecretShapedValue({ credential: `sk-${"a".repeat(24)}` })).toThrow("INPUT_CONTAINS_SECRET_SHAPED_VALUE");
  });
});
