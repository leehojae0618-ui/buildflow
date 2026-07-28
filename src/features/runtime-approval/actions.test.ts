import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  buildRuntimeApprovalBinding: vi.fn(),
  create: vi.fn(),
  decide: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock("./validator", () => ({
  buildRuntimeApprovalBinding: mocks.buildRuntimeApprovalBinding,
}));
vi.mock("./runtime-approval-supabase", () => ({
  SupabaseRuntimeApprovalRepository: class {
    create = mocks.create;
    decide = mocks.decide;
  },
}));

import {
  createRuntimeApprovalRequest,
  decideRuntimeApprovalRequest,
} from "./actions";

const binding = {
  projectId: "project.1", userId: "user.1", scope: "CORE_RUNTIME_PROVIDER_EXECUTION" as const,
  runtimeExecutionRequestId: "request.1", runtimeExecutionRequestChecksum: "a".repeat(64),
  runtimePlanId: "plan.1", runtimePlanChecksum: "b".repeat(64), provider: "openai" as const,
  model: "gpt-test", safeInputChecksum: "c".repeat(64), bindingChecksum: "d".repeat(64),
};

const approval = {
  ...binding, approvalId: "approval.1", status: "PENDING" as const,
  createdAt: "2026-07-28T00:00:00.000Z", expiresAt: "2026-07-28T00:15:00.000Z",
};

function supabase(userId: string | null, projectExists = true) {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: projectExists ? { id: "project.1" } : null }),
  };
  return {
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null } }) },
    from: () => query,
  };
}

describe("Runtime Approval server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createSupabaseServerClient.mockResolvedValue(supabase("user.1"));
    mocks.buildRuntimeApprovalBinding.mockReturnValue({ status: "VALID", value: binding, failures: [] });
    mocks.create.mockResolvedValue({ status: "OK", value: approval, failures: [] });
    mocks.decide.mockResolvedValue({ status: "OK", value: { ...approval, status: "APPROVED" }, failures: [] });
  });

  it("rejects an unauthenticated create request without invoking the repository", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue(supabase(null));
    const result = await createRuntimeApprovalRequest("project.1", {} as never, {} as never);
    expect(result).toEqual({ ok: false, error: "NOT_AUTHORIZED" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects a missing or non-owned project without invoking the repository", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue(supabase("user.1", false));
    const result = await createRuntimeApprovalRequest("project.1", {} as never, {} as never);
    expect(result).toEqual({ ok: false, error: "NOT_AUTHORIZED" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects invalid approval inputs before persistence", async () => {
    mocks.buildRuntimeApprovalBinding.mockReturnValue({ status: "INVALID", failures: [{ code: "RUNTIME_APPROVAL_INVALID" }] });
    const result = await createRuntimeApprovalRequest("project.1", {} as never, {} as never);
    expect(result).toEqual({ ok: false, error: "RUNTIME_APPROVAL_INVALID" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns the structured result from a normal approval create", async () => {
    const result = await createRuntimeApprovalRequest("project.1", {} as never, {} as never);
    expect(result).toEqual({ ok: true, approval });
    expect(mocks.create).toHaveBeenCalledWith({ binding });
  });

  it("preserves a structured repository failure without creating an exception path", async () => {
    mocks.create.mockResolvedValue({ status: "FAILED", failures: [{ code: "RUNTIME_APPROVAL_NOT_APPROVED" }] });
    const result = await createRuntimeApprovalRequest("project.1", {} as never, {} as never);
    expect(result).toEqual({ ok: false, error: "RUNTIME_APPROVAL_NOT_APPROVED" });
  });

  it("normalizes a thrown ownership dependency without exposing its error", async () => {
    const internalMessage = "supabase-auth-internal-detail";
    mocks.createSupabaseServerClient.mockRejectedValue(new Error(internalMessage));
    const result = await createRuntimeApprovalRequest("project.1", {} as never, {} as never);
    expect(result).toEqual({ ok: false, error: "RUNTIME_APPROVAL_PERSISTENCE_FAILED" });
    expect(JSON.stringify(result)).not.toContain(internalMessage);
  });

  it("normalizes a thrown repository dependency without exposing its error", async () => {
    const internalMessage = "supabase-rpc-internal-detail";
    mocks.create.mockRejectedValue(new Error(internalMessage));
    const result = await createRuntimeApprovalRequest("project.1", {} as never, {} as never);
    expect(result).toEqual({ ok: false, error: "RUNTIME_APPROVAL_PERSISTENCE_FAILED" });
    expect(JSON.stringify(result)).not.toContain(internalMessage);
  });

  it("returns the structured result from a normal approval decision", async () => {
    const result = await decideRuntimeApprovalRequest("project.1", "approval.1", "APPROVE");
    expect(result).toEqual({ ok: true, approval: { ...approval, status: "APPROVED" } });
    expect(mocks.decide).toHaveBeenCalledWith({ approvalId: "approval.1", projectId: "project.1", userId: "user.1", decision: "APPROVE" });
  });
});
