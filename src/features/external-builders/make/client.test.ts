import { describe, expect, it } from "vitest";
import { createInitialInquiryBlueprint, withApprovalGate } from "../../verification-loop/canonical-blueprint";
import { MockExternalBuilderTransport } from "../client/transport";
import type { ExternalBuilderClientConfig, ExternalBuilderRequestContext } from "../client/types";
import { compileMakeScenario } from "./compiler";
import { createMakeDryRun, runMakeClient } from "./client";

const credentialReference = "MAKE_CONNECTION_SLACK_REFERENCE_REQUIRED";
const config: ExternalBuilderClientConfig = {
  platform: "MAKE",
  baseUrl: "https://make.example.invalid",
  credentialReference,
  timeoutMs: 1_000,
  retryPolicy: { maxAttempts: 2, initialDelayMs: 10, maxDelayMs: 100, backoffMultiplier: 2, retryableStatusCodes: [408, 429, 502, 503, 504] },
  pollingPolicy: { intervalMs: 10, maxAttempts: 3, overallTimeoutMs: 100, terminalStatuses: ["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"] },
  dryRun: true,
};

function context(overrides: Partial<ExternalBuilderRequestContext> = {}): ExternalBuilderRequestContext {
  return { requestId: "make-request-1", projectId: "project-1", blueprintChecksum: "blueprint-checksum", credentialReference, dryRun: true, ...overrides };
}

describe("Make live client foundation", () => {
  it("does not invoke transport during a dry-run and returns no real workflow id", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 200, headers: {}, body: { id: "unused", status: "SUCCEEDED" }, receivedAt: "2026-08-06T02:00:00.000Z" }));
    const result = await runMakeClient({ config, operation: "CREATE", context: context(), artifact: compileMakeScenario({ blueprint: withApprovalGate(createInitialInquiryBlueprint()) }).artifact, transport, now: "2026-08-06T02:00:00.000Z" });
    expect(result).toMatchObject({ networkCallPerformed: false, actualExternalAction: false });
    expect("status" in result).toBe(false);
    expect(transport.requests).toHaveLength(0);
    expect("externalWorkflowId" in result).toBe(false);
  });

  it("allows a dry-run preview without approval but marks the approval requirement", () => {
    const preview = createMakeDryRun({ config: { ...config, dryRun: false }, operation: "CREATE", context: context({ dryRun: false }), artifact: compileMakeScenario({ blueprint: createInitialInquiryBlueprint() }).artifact });
    expect(preview).toMatchObject({ approvalRequired: true, approvalReferencePresent: false, networkCallPerformed: false, credentialReference });
  });

  it("blocks a non-dry create without approval before transport", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 200, headers: {}, body: { id: "unexpected", status: "SUCCEEDED" }, receivedAt: "2026-08-06T02:00:00.000Z" }));
    const result = await runMakeClient({ config: { ...config, dryRun: false }, operation: "CREATE", context: context({ dryRun: false }), transport, now: "2026-08-06T02:00:00.000Z" });
    expect(result).toMatchObject({ status: "FAILED", normalizedError: { code: "APPROVAL_REQUIRED" }, actualExternalAction: false });
    expect(transport.requests).toHaveLength(0);
  });

  it("blocks a non-dry execute without approval before transport", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 200, headers: {}, body: { executionId: "unexpected", status: "SUCCEEDED" }, receivedAt: "2026-08-06T02:00:00.000Z" }));
    const result = await runMakeClient({ config: { ...config, dryRun: false }, operation: "EXECUTE", context: context({ dryRun: false }), transport, now: "2026-08-06T02:00:00.000Z" });
    expect(result).toMatchObject({ status: "FAILED", normalizedError: { code: "APPROVAL_REQUIRED" }, actualExternalAction: false });
    expect(transport.requests).toHaveLength(0);
  });

  it("rejects an actual credential-shaped reference before a request is prepared", async () => {
    await expect(runMakeClient({ config: { ...config, credentialReference: `sk-${"a".repeat(24)}` }, operation: "GET", context: context({ credentialReference: `sk-${"a".repeat(24)}` }) })).rejects.toThrow("CREDENTIAL_REFERENCE_UNSAFE");
  });

  it("normalizes malformed successful responses instead of treating them as success", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 200, headers: {}, body: { status: "UNRECOGNIZED" }, receivedAt: "2026-08-06T02:00:00.000Z" }));
    const result = await runMakeClient({ config: { ...config, dryRun: false }, operation: "GET", context: context({ dryRun: false }), transport, now: "2026-08-06T02:00:00.000Z" });
    expect(result).toMatchObject({ status: "FAILED", normalizedError: { code: "INVALID_PLATFORM_RESPONSE", retryable: false } });
  });

  it("rejects an oversized platform response without exposing its contents", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 200, headers: {}, body: { id: "scenario-1", status: "SUCCEEDED", ignored: "x".repeat(64 * 1024) }, receivedAt: "2026-08-06T02:00:00.000Z" }));
    const result = await runMakeClient({ config: { ...config, dryRun: false }, operation: "GET", context: context({ dryRun: false }), transport, now: "2026-08-06T02:00:00.000Z" });
    expect(result).toMatchObject({ status: "FAILED", normalizedError: { code: "INVALID_PLATFORM_RESPONSE" } });
    expect(JSON.stringify(result)).not.toContain("ignored");
  });
});
