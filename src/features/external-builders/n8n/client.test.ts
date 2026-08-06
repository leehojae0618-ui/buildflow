import { describe, expect, it } from "vitest";
import { createInitialInquiryBlueprint, withApprovalGate } from "../../verification-loop/canonical-blueprint";
import { MockExternalBuilderTransport } from "../client/transport";
import type { ExternalBuilderClientConfig, ExternalBuilderRequestContext } from "../client/types";
import { compileN8nWorkflow } from "./compiler";
import { createN8nDryRun, runN8nClient } from "./client";

const credentialReference = "N8N_CREDENTIAL_SLACK_REFERENCE_REQUIRED";
const config: ExternalBuilderClientConfig = {
  platform: "N8N",
  baseUrl: "https://n8n.example.invalid",
  credentialReference,
  timeoutMs: 1_000,
  retryPolicy: { maxAttempts: 2, initialDelayMs: 10, maxDelayMs: 100, backoffMultiplier: 2, retryableStatusCodes: [408, 429, 502, 503, 504] },
  pollingPolicy: { intervalMs: 10, maxAttempts: 3, overallTimeoutMs: 100, terminalStatuses: ["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"] },
  dryRun: true,
};

function context(overrides: Partial<ExternalBuilderRequestContext> = {}): ExternalBuilderRequestContext {
  return { requestId: "n8n-request-1", projectId: "project-1", blueprintChecksum: "blueprint-checksum", credentialReference, dryRun: true, ...overrides };
}

describe("n8n live client foundation", () => {
  it("does not invoke transport during a dry-run and excludes credentials from the body", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 200, headers: {}, body: { id: "unused", status: "SUCCEEDED" }, receivedAt: "2026-08-06T02:00:00.000Z" }));
    const artifact = compileN8nWorkflow({ blueprint: withApprovalGate(createInitialInquiryBlueprint()) }).artifact;
    const result = await runN8nClient({ config, operation: "CREATE", context: context(), artifact, transport, now: "2026-08-06T02:00:00.000Z" });
    expect(result).toMatchObject({ networkCallPerformed: false, actualExternalAction: false });
    expect("status" in result).toBe(false);
    expect(transport.requests).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain("authorization");
  });

  it("creates a safe n8n dry-run with a credential reference only", () => {
    const preview = createN8nDryRun({ config, operation: "CREATE", context: context(), artifact: compileN8nWorkflow({ blueprint: createInitialInquiryBlueprint() }).artifact });
    expect(preview).toMatchObject({ credentialReference, networkCallPerformed: false, actualExternalAction: false });
    expect(preview.headerNames).not.toContain("authorization");
  });

  it("rejects unsafe and local n8n inputs", async () => {
    await expect(runN8nClient({ config: { ...config, baseUrl: "http://127.0.0.1:5678" }, operation: "GET", context: context() })).rejects.toThrow("BASE_URL_UNSAFE");
    await expect(runN8nClient({ config: { ...config, credentialReference: `xoxb-${"a".repeat(16)}` }, operation: "GET", context: context({ credentialReference: `xoxb-${"a".repeat(16)}` }) })).rejects.toThrow("CREDENTIAL_REFERENCE_UNSAFE");
  });

  it("normalizes n8n waiting responses without claiming verification", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 200, headers: {}, body: { executionId: "waiting-1", status: "WAITING" }, receivedAt: "2026-08-06T02:00:00.000Z" }));
    const result = await runN8nClient({ config: { ...config, dryRun: false }, operation: "GET_EXECUTION", context: context({ dryRun: false }), transport, now: "2026-08-06T02:00:00.000Z" });
    expect(result).toMatchObject({ status: "WAITING", actualExternalAction: false });
  });

  it("rejects malformed successful n8n responses", async () => {
    const transport = new MockExternalBuilderTransport(() => ({ status: 200, headers: {}, body: { status: "SUCCEEDED" }, receivedAt: "2026-08-06T02:00:00.000Z" }));
    const result = await runN8nClient({ config: { ...config, dryRun: false }, operation: "GET", context: context({ dryRun: false }), transport, now: "2026-08-06T02:00:00.000Z" });
    expect(result).toMatchObject({ status: "FAILED", normalizedError: { code: "INVALID_PLATFORM_RESPONSE" } });
  });
});
