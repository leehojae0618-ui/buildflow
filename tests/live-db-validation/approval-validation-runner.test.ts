import { describe, expect, it, vi } from "vitest";

import type {
  RuntimeApprovalRepository,
  RuntimeApprovalRepositoryResult,
} from "../../src/features/runtime-approval/repository";
import type {
  ConsumeRuntimeApprovalInput,
  CreateRuntimeApprovalInput,
  DecideRuntimeApprovalInput,
  RuntimeApprovalBinding,
  RuntimeApprovalFailureCode,
  RuntimeApprovalRequest,
} from "../../src/features/runtime-approval/types";
import { runApprovalValidation } from "./approval-validation-runner";
import { hasStagingUnsafeValue } from "./staging-evidence";

const binding: RuntimeApprovalBinding = {
  projectId: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
  scope: "CORE_RUNTIME_PROVIDER_EXECUTION",
  runtimeExecutionRequestId: "33333333-3333-4333-8333-333333333333",
  runtimeExecutionRequestChecksum: "checksum-request-1",
  runtimePlanId: "44444444-4444-4444-8444-444444444444",
  runtimePlanChecksum: "checksum-plan-1",
  provider: "openai",
  model: "gpt-4o-mini",
  safeInputChecksum: "checksum-input-1",
  bindingChecksum: "checksum-binding-1",
};

const mismatchedBinding: RuntimeApprovalBinding = {
  ...binding,
  safeInputChecksum: "checksum-input-tampered",
  bindingChecksum: "checksum-binding-tampered",
};

const ok = <T>(value: T): RuntimeApprovalRepositoryResult<T> => ({ status: "OK", value, failures: [] });
const failed = (code: RuntimeApprovalFailureCode): RuntimeApprovalRepositoryResult<never> => ({
  status: "FAILED",
  failures: [{ code }],
});

/**
 * In-memory stand-in for the Supabase-backed repository. It mirrors the RPC
 * lifecycle closely enough to exercise APR-01..04 with no database present.
 */
class FakeApprovalRepository implements RuntimeApprovalRepository {
  private readonly rows = new Map<string, RuntimeApprovalRequest>();
  private sequence = 0;
  /** Set to check status before binding, as a stricter RPC ordering would. */
  constructor(private readonly statusBeforeBinding = false) {}

  async create(input: CreateRuntimeApprovalInput) {
    this.sequence += 1;
    const approvalId = `approval-${this.sequence}`;
    const value: RuntimeApprovalRequest = {
      ...input.binding,
      approvalId,
      status: "PENDING",
      createdAt: "2026-08-17T00:00:00.000Z",
      expiresAt: "2026-08-17T01:00:00.000Z",
    };
    this.rows.set(approvalId, value);
    return ok(value);
  }

  async decide(input: DecideRuntimeApprovalInput) {
    const row = this.rows.get(input.approvalId);
    if (!row) return failed("RUNTIME_APPROVAL_NOT_FOUND");
    if (row.projectId !== input.projectId || row.userId !== input.userId) {
      return failed("RUNTIME_APPROVAL_NOT_AUTHORIZED");
    }
    const status = input.decision === "APPROVE" ? "APPROVED" : input.decision === "REJECT" ? "REJECTED" : "REVOKED";
    const value = { ...row, status } as RuntimeApprovalRequest;
    this.rows.set(input.approvalId, value);
    return ok(value);
  }

  async consume(input: ConsumeRuntimeApprovalInput) {
    const row = this.rows.get(input.approvalId);
    if (!row) return failed("RUNTIME_APPROVAL_NOT_FOUND");

    const bindingMatches = row.bindingChecksum === input.binding.bindingChecksum;
    if (this.statusBeforeBinding && row.status === "CONSUMED") return failed("RUNTIME_APPROVAL_CONSUMED");
    if (!bindingMatches) return failed("RUNTIME_APPROVAL_BINDING_MISMATCH");
    if (row.status === "CONSUMED") return failed("RUNTIME_APPROVAL_CONSUMED");
    if (row.status !== "APPROVED") return failed("RUNTIME_APPROVAL_NOT_APPROVED");

    const value = { ...row, status: "CONSUMED", consumedAt: "2026-08-17T00:30:00.000Z" } as RuntimeApprovalRequest;
    this.rows.set(input.approvalId, value);
    return ok(value);
  }

  async get(approvalId: string) {
    const row = this.rows.get(approvalId);
    return row ? ok(row) : failed("RUNTIME_APPROVAL_NOT_FOUND");
  }
}

describe("ST-B approval validation runner (APR-01..04)", () => {
  it("fails closed when no repository is injected", async () => {
    expect(await runApprovalValidation({ repository: undefined, binding, mismatchedBinding })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_REPOSITORY_NOT_INJECTED",
      caseResults: [],
    });
  });

  it("passes the full lifecycle against an explicitly injected repository", async () => {
    const result = await runApprovalValidation({
      repository: new FakeApprovalRepository(),
      binding,
      mismatchedBinding,
    });
    expect(result.status).toBe("PASSED");
    expect(result.caseResults.map((item) => item.caseId)).toEqual([
      "approval-create",
      "approval-approve",
      "approval-consume",
      "consume-replay-blocked",
      "approval-binding-mismatch",
    ]);
    expect(result.caseResults.every((item) => item.verdict === "PASS")).toBe(true);
  });

  it("still proves the binding mismatch when the repository checks status first", async () => {
    // APR-04 runs against a freshly approved request, so ordering inside the
    // RPC cannot turn a mismatch block into a CONSUMED answer.
    const result = await runApprovalValidation({
      repository: new FakeApprovalRepository(true),
      binding,
      mismatchedBinding,
    });
    expect(result.status).toBe("PASSED");
  });

  it("reports a failure when a replayed consume is allowed to succeed", async () => {
    class ReplayableRepository extends FakeApprovalRepository {
      override async consume(input: ConsumeRuntimeApprovalInput) {
        const current = await super.consume(input);
        if (current.status === "FAILED" && current.failures.some((f) => f.code === "RUNTIME_APPROVAL_CONSUMED")) {
          const replayed: RuntimeApprovalRequest = {
            ...binding,
            approvalId: input.approvalId,
            status: "CONSUMED",
            createdAt: "2026-08-17T00:00:00.000Z",
            expiresAt: "2026-08-17T01:00:00.000Z",
          };
          return ok(replayed);
        }
        return current;
      }
    }
    const result = await runApprovalValidation({
      repository: new ReplayableRepository(),
      binding,
      mismatchedBinding,
    });
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME");
    expect(result.caseResults.at(-1)).toMatchObject({
      caseId: "consume-replay-blocked",
      verdict: "FAIL",
    });
  });

  it("accepts a status-based refusal as proof that replay was blocked", async () => {
    class StatusRefusalRepository extends FakeApprovalRepository {
      private consumeCount = 0;
      override async consume(input: ConsumeRuntimeApprovalInput) {
        this.consumeCount += 1;
        // An RPC that reports the replay as "no longer approved" rather than
        // naming CONSUMED explicitly.
        return this.consumeCount === 2 ? failed("RUNTIME_APPROVAL_NOT_APPROVED") : super.consume(input);
      }
    }
    const result = await runApprovalValidation({
      repository: new StatusRefusalRepository(),
      binding,
      mismatchedBinding,
    });
    expect(result.status).toBe("PASSED");
    expect(result.caseResults).toContainEqual({
      caseId: "consume-replay-blocked",
      executionStatus: "EXECUTED_PASS",
      verdict: "PASS",
    });
  });

  it("does not accept a persistence failure as proof that replay was blocked", async () => {
    class UnreachableOnReplayRepository extends FakeApprovalRepository {
      private consumeCount = 0;
      override async consume(input: ConsumeRuntimeApprovalInput) {
        this.consumeCount += 1;
        // The second consume answers with the repository's generic fallback,
        // which is what an unreachable database produces.
        return this.consumeCount === 2 ? failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED") : super.consume(input);
      }
    }
    const result = await runApprovalValidation({
      repository: new UnreachableOnReplayRepository(),
      binding,
      mismatchedBinding,
    });
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({
      caseId: "consume-replay-blocked",
      verdict: "FAIL",
    });
  });

  it("uses only the injected repository and makes no network call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const repository = new FakeApprovalRepository();
    const createSpy = vi.spyOn(repository, "create");
    const consumeSpy = vi.spyOn(repository, "consume");

    const result = await runApprovalValidation({ repository, binding, mismatchedBinding });

    expect(result.status).toBe("PASSED");
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(consumeSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("emits no secret-shaped value in its results", async () => {
    const result = await runApprovalValidation({
      repository: new FakeApprovalRepository(),
      binding,
      mismatchedBinding,
    });
    expect(hasStagingUnsafeValue(result)).toBe(false);
  });
});
