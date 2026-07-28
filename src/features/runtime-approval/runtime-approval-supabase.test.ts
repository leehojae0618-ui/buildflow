import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/admin", () => ({ createSupabaseAdminClient: () => ({}) }));

import { SupabaseRuntimeApprovalRepository } from "./runtime-approval-supabase";
import { checksumRuntimeApprovalBinding } from "./validator";
import type { RuntimeApprovalBinding } from "./types";

const checksum = (seed: string) => seed.padEnd(64, seed).slice(0, 64);

function binding(): RuntimeApprovalBinding {
  const core = {
    projectId: "11111111-1111-4111-8111-111111111111",
    userId: "22222222-2222-4222-8222-222222222222",
    scope: "CORE_RUNTIME_PROVIDER_EXECUTION" as const,
    runtimeExecutionRequestId: "runtime-request-1",
    runtimeExecutionRequestChecksum: checksum("a"),
    runtimePlanId: "runtime-plan-1",
    runtimePlanChecksum: checksum("b"),
    provider: "openai" as const,
    model: "gpt-test",
    safeInputChecksum: checksum("c"),
  };
  return { ...core, bindingChecksum: checksumRuntimeApprovalBinding(core) };
}

function row(overrides: Record<string, unknown> = {}) {
  const value = binding();
  return {
    id: "33333333-3333-4333-8333-333333333333",
    project_id: value.projectId,
    requester_user_id: value.userId,
    scope: value.scope,
    status: "APPROVED",
    runtime_execution_request_id: value.runtimeExecutionRequestId,
    runtime_execution_request_checksum: value.runtimeExecutionRequestChecksum,
    runtime_plan_id: value.runtimePlanId,
    runtime_plan_checksum: value.runtimePlanChecksum,
    provider: value.provider,
    model: value.model,
    safe_input_checksum: value.safeInputChecksum,
    binding_checksum: value.bindingChecksum,
    expires_at: "2026-07-28T00:15:00.000Z",
    created_at: "2026-07-28T00:00:00.000Z",
    approved_at: "2026-07-28T00:01:00.000Z",
    approved_by_user_id: value.userId,
    rejected_at: null,
    rejected_by_user_id: null,
    revoked_at: null,
    revoked_by_user_id: null,
    consumed_at: null,
    ...overrides,
  };
}

function client(options: { rpc?: { data: string | null; error: { message?: string } | null }; stored?: Record<string, unknown> | null } = {}) {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: options.stored ?? row(), error: null }),
  };
  return {
    calls,
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push({ name, args });
      return options.rpc ?? { data: row().id, error: null };
    },
    from: () => query,
  };
}

describe("SupabaseRuntimeApprovalRepository", () => {
  it("sends only safe canonical binding fields to the create RPC", async () => {
    const fake = client();
    const value = binding();
    const result = await new SupabaseRuntimeApprovalRepository(fake as never).create({ binding: value });
    expect(result.status).toBe("OK");
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]).toMatchObject({ name: "create_runtime_approval_request" });
    expect(JSON.stringify(fake.calls[0].args)).not.toMatch(/prompt|credential|sdkPayload|rawOutput/i);
  });

  it("normalizes a consumed approval RPC failure without exposing database detail", async () => {
    const fake = client({ rpc: { data: null, error: { message: "RUNTIME_APPROVAL_CONSUMED" } } });
    const result = await new SupabaseRuntimeApprovalRepository(fake as never).consume({
      approvalId: row().id,
      binding: binding(),
    });
    expect(result).toEqual({ status: "FAILED", failures: [{ code: "RUNTIME_APPROVAL_CONSUMED" }] });
  });

  it("treats a persisted expiry as a safe consume failure", async () => {
    const fake = client({ stored: row({ status: "EXPIRED" }) });
    const result = await new SupabaseRuntimeApprovalRepository(fake as never).consume({
      approvalId: row().id,
      binding: binding(),
    });
    expect(result).toEqual({ status: "FAILED", failures: [{ code: "RUNTIME_APPROVAL_EXPIRED" }] });
  });

  it("treats a rejected approval as a safe terminal consume failure", async () => {
    const fake = client({
      stored: row({
        status: "REJECTED",
        rejected_at: "2026-07-28T00:02:00.000Z",
        rejected_by_user_id: binding().userId,
      }),
    });
    const result = await new SupabaseRuntimeApprovalRepository(fake as never).consume({
      approvalId: row().id,
      binding: binding(),
    });
    expect(result).toEqual({ status: "FAILED", failures: [{ code: "RUNTIME_APPROVAL_NOT_APPROVED" }] });
    expect(JSON.stringify(result)).not.toContain("REJECTED");
  });

  it("normalizes a thrown Supabase consume call without exposing its error", async () => {
    const fake = client();
    fake.rpc = async () => { throw new Error("database transport internal detail"); };
    const result = await new SupabaseRuntimeApprovalRepository(fake as never).consume({
      approvalId: row().id,
      binding: binding(),
    });
    expect(result).toEqual({ status: "FAILED", failures: [{ code: "RUNTIME_APPROVAL_PERSISTENCE_FAILED" }] });
    expect(JSON.stringify(result)).not.toContain("database transport internal detail");
  });

  it("returns a rejected approval as a successfully persisted decision", async () => {
    const fake = client({
      stored: row({
        status: "REJECTED",
        rejected_at: "2026-07-28T00:02:00.000Z",
        rejected_by_user_id: binding().userId,
      }),
    });
    const result = await new SupabaseRuntimeApprovalRepository(fake as never).decide({
      approvalId: row().id,
      projectId: binding().projectId,
      userId: binding().userId,
      decision: "REJECT",
    });
    expect(result.status).toBe("OK");
    if (result.status === "OK") expect(result.value.status).toBe("REJECTED");
  });

  it("uses exactly one consume RPC before reading the immutable result", async () => {
    const fake = client({ stored: row({ status: "CONSUMED", consumed_at: "2026-07-28T00:02:00.000Z" }) });
    const result = await new SupabaseRuntimeApprovalRepository(fake as never).consume({
      approvalId: row().id,
      binding: binding(),
    });
    expect(result.status).toBe("OK");
    expect(fake.calls.map((call) => call.name)).toEqual(["consume_runtime_approval_request"]);
  });
});
