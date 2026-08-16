import { createHash } from "node:crypto";
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
import {
  checksumRuntimeApprovalBinding,
  validateRuntimeApprovalBinding,
} from "../../src/features/runtime-approval/validator";
import { fixtureBinding, runApprovalValidation } from "./approval-validation-runner";
import { hasStagingUnsafeValue } from "./staging-evidence";

const hex = (seed: string) => createHash("sha256").update(seed).digest("hex");

const core = {
  projectId: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
  scope: "CORE_RUNTIME_PROVIDER_EXECUTION" as const,
  runtimeExecutionRequestId: "33333333-3333-4333-8333-333333333333",
  runtimeExecutionRequestChecksum: hex("request-1"),
  runtimePlanId: "44444444-4444-4444-8444-444444444444",
  runtimePlanChecksum: hex("plan-1"),
  provider: "openai" as const,
  model: "gpt-4o-mini",
  safeInputChecksum: hex("input-1"),
};

const binding: RuntimeApprovalBinding = {
  ...core,
  bindingChecksum: checksumRuntimeApprovalBinding(core),
};

/**
 * Differs from `binding` in a bound field *and* carries a recomputed checksum,
 * so `validateRuntimeApprovalBinding` accepts it and the RPC is the thing that
 * refuses it. A stale checksum here would be rejected locally and APR-04 would
 * never reach the database at all.
 */
const mismatchedCore = { ...core, safeInputChecksum: hex("input-tampered") };
const mismatchedBinding: RuntimeApprovalBinding = {
  ...mismatchedCore,
  bindingChecksum: checksumRuntimeApprovalBinding(mismatchedCore),
};

/** What the pre-ST-B0-FIX fixture looked like: altered payload, stale checksum. */
const staleChecksumBinding: RuntimeApprovalBinding = {
  ...core,
  safeInputChecksum: hex("input-tampered"),
  bindingChecksum: binding.bindingChecksum,
};

const ok = <T>(value: T): RuntimeApprovalRepositoryResult<T> => ({ status: "OK", value, failures: [] });
const failed = (code: RuntimeApprovalFailureCode): RuntimeApprovalRepositoryResult<never> => ({
  status: "FAILED",
  failures: [{ code }],
});

const NOW = Date.parse("2026-08-17T00:00:00.000Z");
const EXPIRED_APPROVAL_ID = "approval-pre-aged";

/**
 * In-memory stand-in for `SupabaseRuntimeApprovalRepository`.
 *
 * It reproduces the real precondition order deliberately: the binding is
 * validated locally *before* anything else, exactly as the repository does
 * ahead of its RPC, and the consume path then follows the SQL function's own
 * ordering (not found, consumed, revoked, expiry, non-approved status, and only
 * then the binding comparison). A looser fake would let the runner pass on
 * paths the real repository never takes.
 */
class FakeApprovalRepository implements RuntimeApprovalRepository {
  protected readonly rows = new Map<string, RuntimeApprovalRequest>();
  private sequence = 0;

  constructor() {
    // The pre-aged fixture an operator supplies: past its TTL, still PENDING,
    // and created from its own binding so it does not occupy a checksum this
    // run needs.
    this.rows.set(EXPIRED_APPROVAL_ID, {
      ...fixtureBinding(binding, "operator-expired"),
      approvalId: EXPIRED_APPROVAL_ID,
      status: "PENDING",
      createdAt: new Date(NOW - 3_600_000).toISOString(),
      expiresAt: new Date(NOW - 60_000).toISOString(),
    });
  }

  private expired(row: RuntimeApprovalRequest) {
    return Date.parse(row.expiresAt) <= NOW;
  }

  async create(input: CreateRuntimeApprovalInput) {
    if (!validateRuntimeApprovalBinding(input.binding)) return failed("RUNTIME_APPROVAL_INVALID");
    // runtime_approval_requests.binding_checksum is UNIQUE. The RPC surfaces the
    // violation as an error the repository cannot map, so it lands on its
    // generic persistence failure.
    const duplicate = [...this.rows.values()].some(
      (row) => row.bindingChecksum === input.binding.bindingChecksum,
    );
    if (duplicate) return failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED");
    this.sequence += 1;
    const approvalId = `approval-${this.sequence}`;
    const value: RuntimeApprovalRequest = {
      ...input.binding,
      approvalId,
      status: "PENDING",
      createdAt: new Date(NOW).toISOString(),
      expiresAt: new Date(NOW + 900_000).toISOString(),
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
    if (["CONSUMED", "REJECTED", "REVOKED", "EXPIRED"].includes(row.status)) {
      return failed("RUNTIME_APPROVAL_NOT_APPROVED");
    }
    if (this.expired(row)) {
      this.rows.set(input.approvalId, { ...row, status: "EXPIRED" });
      return failed("RUNTIME_APPROVAL_EXPIRED");
    }
    const allowed =
      (input.decision === "APPROVE" && row.status === "PENDING") ||
      (input.decision === "REJECT" && row.status === "PENDING") ||
      (input.decision === "REVOKE" && (row.status === "PENDING" || row.status === "APPROVED"));
    if (!allowed) return failed("RUNTIME_APPROVAL_NOT_APPROVED");

    const status =
      input.decision === "APPROVE" ? "APPROVED" : input.decision === "REJECT" ? "REJECTED" : "REVOKED";
    const value = { ...row, status } as RuntimeApprovalRequest;
    this.rows.set(input.approvalId, value);
    return ok(value);
  }

  async consume(input: ConsumeRuntimeApprovalInput) {
    // Mirrors the repository's own local precondition, ahead of the RPC.
    if (!validateRuntimeApprovalBinding(input.binding)) return failed("RUNTIME_APPROVAL_INVALID");

    const row = this.rows.get(input.approvalId);
    if (!row) return failed("RUNTIME_APPROVAL_NOT_FOUND");
    if (row.status === "CONSUMED") return failed("RUNTIME_APPROVAL_CONSUMED");
    if (row.status === "REVOKED") return failed("RUNTIME_APPROVAL_REVOKED");
    if (this.expired(row)) {
      this.rows.set(input.approvalId, { ...row, status: "EXPIRED" });
      return failed("RUNTIME_APPROVAL_EXPIRED");
    }
    if (row.status !== "APPROVED") return failed("RUNTIME_APPROVAL_NOT_APPROVED");
    // The binding is compared last, exactly as consume_runtime_approval_request does.
    if (row.bindingChecksum !== input.binding.bindingChecksum) {
      return failed("RUNTIME_APPROVAL_BINDING_MISMATCH");
    }

    const value = { ...row, status: "CONSUMED", consumedAt: new Date(NOW).toISOString() } as RuntimeApprovalRequest;
    this.rows.set(input.approvalId, value);
    return ok(value);
  }

  async get(approvalId: string) {
    const row = this.rows.get(approvalId);
    return row ? ok(row) : failed("RUNTIME_APPROVAL_NOT_FOUND");
  }
}

const run = (overrides: Partial<Parameters<typeof runApprovalValidation>[0]> = {}) =>
  runApprovalValidation({
    repository: new FakeApprovalRepository(),
    binding,
    mismatchedBinding,
    expiredApprovalId: EXPIRED_APPROVAL_ID,
    ...overrides,
  });

describe("ST-B approval validation runner (APR-01..04)", () => {
  it("fails closed when no repository is injected", async () => {
    expect(await run({ repository: undefined })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_REPOSITORY_NOT_INJECTED",
      caseResults: [],
    });
  });

  it("fails closed when the primary binding fixture is not itself valid", async () => {
    const result = await run({ binding: { ...binding, bindingChecksum: "not-a-checksum" } });
    expect(result).toMatchObject({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_BINDING_FIXTURE_INVALID",
    });
  });

  it("rejects a stale-checksum mismatch fixture, which never reaches the database", async () => {
    // The real repository refuses this locally with RUNTIME_APPROVAL_INVALID
    // before issuing the RPC, so it can prove nothing about the stored row.
    expect(validateRuntimeApprovalBinding(staleChecksumBinding)).toBe(false);
    expect(await run({ mismatchedBinding: staleChecksumBinding })).toMatchObject({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_MISMATCH_FIXTURE_INVALID",
    });
  });

  it("rejects a mismatch fixture that matches the row APR-04 will target", async () => {
    // The template is never stored, so equality has to be judged against the
    // binding the mismatch target is actually created from.
    expect(await run({ mismatchedBinding: fixtureBinding(binding, "apr04-mismatch") })).toMatchObject(
      { safeErrorCode: "LIVE_DB_APPROVAL_MISMATCH_FIXTURE_INVALID" },
    );
  });

  it("rejects a mismatch fixture owned by a different user", async () => {
    const otherOwnerCore = { ...mismatchedCore, userId: "99999999-9999-4999-8999-999999999999" };
    expect(
      await run({
        mismatchedBinding: {
          ...otherOwnerCore,
          bindingChecksum: checksumRuntimeApprovalBinding(otherOwnerCore),
        },
      }),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_APPROVAL_MISMATCH_FIXTURE_INVALID" });
  });

  it("fails closed when no pre-aged expiry fixture is injected", async () => {
    expect(await run({ expiredApprovalId: undefined })).toMatchObject({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_EXPIRED_FIXTURE_NOT_INJECTED",
    });
    expect(await run({ expiredApprovalId: "   " })).toMatchObject({
      safeErrorCode: "LIVE_DB_APPROVAL_EXPIRED_FIXTURE_NOT_INJECTED",
    });
  });

  it("passes the full lifecycle in the order the plan numbers the cases", async () => {
    const result = await run();
    expect(result.status).toBe("PASSED");
    expect(result.caseResults.map((item) => item.caseId)).toEqual([
      "approval-create",
      "approval-approve",
      "approval-reject",
      "approval-revoke",
      "approval-expiry",
      "approval-consume",
      "consume-replay-blocked",
      "approval-binding-mismatch",
    ]);
    expect(result.caseResults.every((item) => item.verdict === "PASS")).toBe(true);
  });

  it("uses an isolated fixture per lifecycle case", async () => {
    const repository = new FakeApprovalRepository();
    const createSpy = vi.spyOn(repository, "create");
    const result = await run({ repository });

    expect(result.status).toBe("PASSED");
    // approve, reject, revoke and binding-mismatch each get their own request.
    expect(createSpy).toHaveBeenCalledTimes(4);
    const created = await Promise.all(createSpy.mock.results.map((item) => item.value));
    const approvalIds = created.map((item) => (item.status === "OK" ? item.value.approvalId : null));
    expect(new Set(approvalIds).size).toBe(4);
    expect(approvalIds).not.toContain(null);

    // Each fixture also needs its own binding, because binding_checksum is UNIQUE.
    const checksums = createSpy.mock.calls.map(([call]) => call.binding.bindingChecksum);
    expect(new Set(checksums).size).toBe(4);
    expect(checksums).not.toContain(binding.bindingChecksum);
  });

  it("would fail on the real UNIQUE constraint if fixtures shared one binding", async () => {
    // Guards the fake itself: if it stops modelling the constraint, this test
    // stops proving that per-fixture bindings are what keep the run working.
    const repository = new FakeApprovalRepository();
    const first = await repository.create({ binding });
    expect(first.status).toBe("OK");
    const second = await repository.create({ binding });
    expect(second).toMatchObject({
      status: "FAILED",
      failures: [{ code: "RUNTIME_APPROVAL_PERSISTENCE_FAILED" }],
    });
  });

  it("derives a distinct, still-valid binding per label", () => {
    const left = fixtureBinding(binding, "one");
    const right = fixtureBinding(binding, "two");
    expect(validateRuntimeApprovalBinding(left)).toBe(true);
    expect(validateRuntimeApprovalBinding(right)).toBe(true);
    expect(left.bindingChecksum).not.toBe(right.bindingChecksum);
    expect(left.bindingChecksum).not.toBe(binding.bindingChecksum);
    expect(left.projectId).toBe(binding.projectId);
    expect(left.userId).toBe(binding.userId);
  });

  it("does not accept RUNTIME_APPROVAL_INVALID as proof of a binding mismatch", async () => {
    // The repository answers with its local precondition code rather than the
    // database's comparison. Before ST-B0-FIX this passed APR-04.
    class LocallyRefusingRepository extends FakeApprovalRepository {
      override async consume(input: ConsumeRuntimeApprovalInput) {
        return input.binding.bindingChecksum === mismatchedBinding.bindingChecksum
          ? failed("RUNTIME_APPROVAL_INVALID")
          : super.consume(input);
      }
    }
    const result = await run({ repository: new LocallyRefusingRepository() });
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({
      caseId: "approval-binding-mismatch",
      verdict: "FAIL",
    });
  });

  it("does not accept a not-approved refusal as proof of a binding mismatch", async () => {
    class StatusRefusingRepository extends FakeApprovalRepository {
      override async consume(input: ConsumeRuntimeApprovalInput) {
        return input.binding.bindingChecksum === mismatchedBinding.bindingChecksum
          ? failed("RUNTIME_APPROVAL_NOT_APPROVED")
          : super.consume(input);
      }
    }
    const result = await run({ repository: new StatusRefusingRepository() });
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({ caseId: "approval-binding-mismatch" });
  });

  it("reports a failure when a mismatched binding is consumed anyway", async () => {
    class PermissiveRepository extends FakeApprovalRepository {
      override async consume(input: ConsumeRuntimeApprovalInput) {
        const row = this.rows.get(input.approvalId);
        if (row?.status === "APPROVED" && row.bindingChecksum !== input.binding.bindingChecksum) {
          return ok({ ...row, status: "CONSUMED" } as RuntimeApprovalRequest);
        }
        return super.consume(input);
      }
    }
    const result = await run({ repository: new PermissiveRepository() });
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME");
  });

  it("requires the expiry case to be refused on the TTL, not on status", async () => {
    class AlreadyExpiredRepository extends FakeApprovalRepository {
      override async decide(input: DecideRuntimeApprovalInput) {
        // What a fixture already transitioned to EXPIRED answers: the TTL check
        // never runs, so this must not count as proof that expiry fired.
        return input.approvalId === EXPIRED_APPROVAL_ID
          ? failed("RUNTIME_APPROVAL_NOT_APPROVED")
          : super.decide(input);
      }
    }
    const result = await run({ repository: new AlreadyExpiredRepository() });
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({
      caseId: "approval-expiry",
      verdict: "FAIL",
    });
  });

  it("fails the expiry case when the pre-aged fixture is accepted instead of refused", async () => {
    class NeverExpiringRepository extends FakeApprovalRepository {
      override async decide(input: DecideRuntimeApprovalInput) {
        const row = this.rows.get(input.approvalId);
        return input.approvalId === EXPIRED_APPROVAL_ID && row
          ? ok({ ...row, status: "APPROVED" } as RuntimeApprovalRequest)
          : super.decide(input);
      }
    }
    const result = await run({ repository: new NeverExpiringRepository() });
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({ caseId: "approval-expiry", verdict: "FAIL" });
  });

  it("reports a failure when a replayed consume is allowed to succeed", async () => {
    class ReplayableRepository extends FakeApprovalRepository {
      override async consume(input: ConsumeRuntimeApprovalInput) {
        const current = await super.consume(input);
        if (current.status === "FAILED" && current.failures.some((f) => f.code === "RUNTIME_APPROVAL_CONSUMED")) {
          const row = this.rows.get(input.approvalId) as RuntimeApprovalRequest;
          return ok({ ...row, status: "CONSUMED" } as RuntimeApprovalRequest);
        }
        return current;
      }
    }
    const result = await run({ repository: new ReplayableRepository() });
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
    const result = await run({ repository: new StatusRefusalRepository() });
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
    const result = await run({ repository: new UnreachableOnReplayRepository() });
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({
      caseId: "consume-replay-blocked",
      verdict: "FAIL",
    });
  });

  it("uses only the injected repository and makes no network call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const repository = new FakeApprovalRepository();
    const consumeSpy = vi.spyOn(repository, "consume");

    const result = await run({ repository });

    expect(result.status).toBe("PASSED");
    // consume, replay, mismatch.
    expect(consumeSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("emits no secret-shaped value in its results", async () => {
    expect(hasStagingUnsafeValue(await run())).toBe(false);
  });
});
