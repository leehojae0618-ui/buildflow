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
import {
  fixtureBinding,
  runApprovalExpiry,
  runApprovalLifecycle,
} from "./approval-validation-runner";
import type { CountResult, LiveDbRecordCounter } from "./runtime-record-counters";
import { hasStagingUnsafeValue } from "./staging-evidence";
import { LIVE_DB_TEST_PREFIX } from "./types";

const hex = (seed: string) => createHash("sha256").update(seed).digest("hex");

const core = {
  projectId: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
  scope: "CORE_RUNTIME_PROVIDER_EXECUTION" as const,
  runtimeExecutionRequestId: `${LIVE_DB_TEST_PREFIX}request`,
  runtimeExecutionRequestChecksum: hex("request-1"),
  runtimePlanId: `${LIVE_DB_TEST_PREFIX}plan`,
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
 * refuses it. A stale checksum would be rejected locally and APR-04 would never
 * reach the database.
 */
const mismatchedCore = { ...core, safeInputChecksum: hex("input-tampered") };
const mismatchedBinding: RuntimeApprovalBinding = {
  ...mismatchedCore,
  bindingChecksum: checksumRuntimeApprovalBinding(mismatchedCore),
};

const ok = <T>(value: T): RuntimeApprovalRepositoryResult<T> => ({ status: "OK", value, failures: [] });
const failed = (code: RuntimeApprovalFailureCode): RuntimeApprovalRepositoryResult<never> => ({
  status: "FAILED",
  failures: [{ code }],
});

const NOW = Date.parse("2026-08-17T00:00:00.000Z");
const TTL_MS = 900_000;

/**
 * In-memory stand-in for `SupabaseRuntimeApprovalRepository`.
 *
 * It reproduces the real precondition order deliberately — the binding is
 * validated locally before anything else, exactly as the repository does ahead
 * of its RPC — then follows the SQL function's own ordering, in which the
 * binding is compared last. It also enforces the UNIQUE `binding_checksum` and
 * records lifecycle events, because both are things the runner is supposed to
 * depend on and a looser double would hide.
 */
class FakeApprovalRepository implements RuntimeApprovalRepository {
  protected readonly rows = new Map<string, RuntimeApprovalRequest>();
  readonly events = new Map<string, string[]>();
  private sequence = 0;
  protected now = NOW;

  private record(approvalId: string, event: string) {
    this.events.set(approvalId, [...(this.events.get(approvalId) ?? []), event]);
  }

  private expired(row: RuntimeApprovalRequest) {
    return Date.parse(row.expiresAt) <= this.now;
  }

  async create(input: CreateRuntimeApprovalInput) {
    if (!validateRuntimeApprovalBinding(input.binding)) return failed("RUNTIME_APPROVAL_INVALID");
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
      createdAt: new Date(this.now).toISOString(),
      expiresAt: new Date(this.now + TTL_MS).toISOString(),
    };
    this.rows.set(approvalId, value);
    this.record(approvalId, "CREATED");
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
      this.record(input.approvalId, "EXPIRED");
      return failed("RUNTIME_APPROVAL_EXPIRED");
    }
    const allowed =
      (input.decision !== "REVOKE" && row.status === "PENDING") ||
      (input.decision === "REVOKE" && (row.status === "PENDING" || row.status === "APPROVED"));
    if (!allowed) return failed("RUNTIME_APPROVAL_NOT_APPROVED");

    const status =
      input.decision === "APPROVE" ? "APPROVED" : input.decision === "REJECT" ? "REJECTED" : "REVOKED";
    const value = { ...row, status } as RuntimeApprovalRequest;
    this.rows.set(input.approvalId, value);
    this.record(input.approvalId, status);
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
      this.record(input.approvalId, "EXPIRED");
      return failed("RUNTIME_APPROVAL_EXPIRED");
    }
    if (row.status !== "APPROVED") return failed("RUNTIME_APPROVAL_NOT_APPROVED");
    // Compared last, exactly as consume_runtime_approval_request does.
    if (row.bindingChecksum !== input.binding.bindingChecksum) {
      return failed("RUNTIME_APPROVAL_BINDING_MISMATCH");
    }

    const value = { ...row, status: "CONSUMED" } as RuntimeApprovalRequest;
    this.rows.set(input.approvalId, value);
    this.record(input.approvalId, "CONSUMED");
    return ok(value);
  }

  async get(approvalId: string) {
    const row = this.rows.get(approvalId);
    return row ? ok(row) : failed("RUNTIME_APPROVAL_NOT_FOUND");
  }
}

const counterFor = (repository: FakeApprovalRepository, evidenceCount = 0): LiveDbRecordCounter => ({
  countApprovalEvents: async (approvalId, eventType): Promise<CountResult> => ({
    status: "COUNTED",
    count: (repository.events.get(approvalId) ?? []).filter((item) => item === eventType).length,
  }),
  countRuntimeEvidence: async (): Promise<CountResult> => ({
    status: "COUNTED",
    count: evidenceCount,
  }),
});

const runLifecycle = (
  overrides: Partial<Parameters<typeof runApprovalLifecycle>[0]> = {},
  repository: FakeApprovalRepository = new FakeApprovalRepository(),
) =>
  runApprovalLifecycle({
    repository,
    counter: counterFor(repository),
    binding,
    mismatchedBinding,
    ...overrides,
  });

describe("ST-B approval lifecycle (APR-01..04)", () => {
  it("fails closed when no repository or counter is injected", async () => {
    expect(await runLifecycle({ repository: undefined })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_REPOSITORY_NOT_INJECTED",
      caseResults: [],
    });
    expect(await runLifecycle({ counter: undefined })).toMatchObject({
      safeErrorCode: "LIVE_DB_COUNTER_NOT_INJECTED",
    });
  });

  it("fails closed when the primary binding fixture is not itself valid", async () => {
    expect(await runLifecycle({ binding: { ...binding, bindingChecksum: "nope" } })).toMatchObject({
      safeErrorCode: "LIVE_DB_APPROVAL_BINDING_FIXTURE_INVALID",
    });
  });

  it("requires the cleanup prefix on both fixture identifiers", async () => {
    const unprefixedCore = { ...core, runtimeExecutionRequestId: "request-without-prefix" };
    const unprefixed = {
      ...unprefixedCore,
      bindingChecksum: checksumRuntimeApprovalBinding(unprefixedCore),
    };
    expect(await runLifecycle({ binding: unprefixed })).toMatchObject({
      safeErrorCode: "LIVE_DB_FIXTURE_PREFIX_REQUIRED",
    });

    const unprefixedPlanCore = { ...core, runtimePlanId: "plan-without-prefix" };
    expect(
      await runLifecycle({
        binding: {
          ...unprefixedPlanCore,
          bindingChecksum: checksumRuntimeApprovalBinding(unprefixedPlanCore),
        },
      }),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_FIXTURE_PREFIX_REQUIRED" });
  });

  it("rejects a stale-checksum mismatch fixture, which never reaches the database", async () => {
    const stale: RuntimeApprovalBinding = {
      ...core,
      safeInputChecksum: hex("input-tampered"),
      bindingChecksum: binding.bindingChecksum,
    };
    expect(validateRuntimeApprovalBinding(stale)).toBe(false);
    expect(await runLifecycle({ mismatchedBinding: stale })).toMatchObject({
      safeErrorCode: "LIVE_DB_APPROVAL_MISMATCH_FIXTURE_INVALID",
    });
  });

  it("rejects a mismatch fixture that matches the row APR-04 will target", async () => {
    expect(
      await runLifecycle({ mismatchedBinding: fixtureBinding(binding, "apr04-mismatch") }),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_APPROVAL_MISMATCH_FIXTURE_INVALID" });
  });

  it("passes the lifecycle in the order the plan numbers the cases", async () => {
    const result = await runLifecycle();
    expect(result.status).toBe("PASSED");
    expect(result.caseResults.map((item) => item.caseId)).toEqual([
      "approval-create",
      "approval-approve",
      "approval-reject",
      "approval-revoke",
      "approval-consume",
      "consume-replay-blocked",
      "approval-binding-mismatch",
    ]);
    expect(result.caseResults.every((item) => item.verdict === "PASS")).toBe(true);
  });

  it("creates the expiry fixture first, so its TTL runs down during the rest", async () => {
    const repository = new FakeApprovalRepository();
    const createSpy = vi.spyOn(repository, "create");
    const result = await runLifecycle({}, repository);

    expect(result.expiry).toMatchObject({ approvalId: "approval-1" });
    expect(result.expiry?.expiresAtMs).toBe(NOW + TTL_MS);
    expect(result.triggerProbeApprovalId).toBe("approval-1");
    // expiry, consume, reject, revoke, mismatch.
    expect(createSpy).toHaveBeenCalledTimes(5);
    const checksums = createSpy.mock.calls.map(([call]) => call.binding.bindingChecksum);
    expect(new Set(checksums).size).toBe(5);
    expect(checksums).not.toContain(binding.bindingChecksum);
  });

  it("would fail on the real UNIQUE constraint if fixtures shared one binding", async () => {
    const repository = new FakeApprovalRepository();
    expect((await repository.create({ binding })).status).toBe("OK");
    expect(await repository.create({ binding })).toMatchObject({
      status: "FAILED",
      failures: [{ code: "RUNTIME_APPROVAL_PERSISTENCE_FAILED" }],
    });
  });

  it("checks the event count the matrix expects beside each case", async () => {
    const repository = new FakeApprovalRepository();
    const result = await runLifecycle({}, repository);
    expect(result.status).toBe("PASSED");
    // approval-1 is the untouched expiry fixture; approval-2 is APR-01/03.
    expect(repository.events.get("approval-1")).toEqual(["CREATED"]);
    expect(repository.events.get("approval-2")).toEqual(["CREATED", "APPROVED", "CONSUMED"]);
    expect(repository.events.get("approval-3")).toEqual(["CREATED", "REJECTED"]);
    expect(repository.events.get("approval-4")).toEqual(["CREATED", "APPROVED", "REVOKED"]);
    expect(repository.events.get("approval-5")).toEqual(["CREATED", "APPROVED"]);
  });

  it("fails when the journal records the wrong transition, not merely the wrong number", async () => {
    // A request left APPROVED but journalled as REJECTED still totals two
    // events, so a bare count would call this correct.
    class MisjournallingRepository extends FakeApprovalRepository {
      override async decide(input: DecideRuntimeApprovalInput) {
        const result = await super.decide(input);
        if (input.decision === "APPROVE") {
          const events = this.events.get(input.approvalId) ?? [];
          this.events.set(
            input.approvalId,
            events.map((event) => (event === "APPROVED" ? "REJECTED" : event)),
          );
        }
        return result;
      }
    }
    const repository = new MisjournallingRepository();
    const result = await runLifecycle({}, repository);

    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH");
    expect(result.caseResults.at(-1)).toMatchObject({ caseId: "approval-approve", verdict: "FAIL" });
    // The total is right, which is exactly why the per-type check is needed.
    expect(repository.events.get("approval-2")).toHaveLength(2);
  });

  it("fails a case whose event count is wrong even when the RPC result looked right", async () => {
    const repository = new FakeApprovalRepository();
    const counter: LiveDbRecordCounter = {
      ...counterFor(repository),
      // An RPC that succeeded but recorded no event: a silent audit-trail gap.
      countApprovalEvents: async () => ({ status: "COUNTED", count: 0 }),
    };
    const result = await runLifecycle({ counter }, repository);
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH");
    expect(result.caseResults.at(-1)).toMatchObject({ caseId: "approval-create", verdict: "FAIL" });
  });

  it("does not accept RUNTIME_APPROVAL_INVALID as proof of a binding mismatch", async () => {
    class LocallyRefusingRepository extends FakeApprovalRepository {
      override async consume(input: ConsumeRuntimeApprovalInput) {
        return input.binding.bindingChecksum === mismatchedBinding.bindingChecksum
          ? failed("RUNTIME_APPROVAL_INVALID")
          : super.consume(input);
      }
    }
    const repository = new LocallyRefusingRepository();
    const result = await runLifecycle({}, repository);
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({
      caseId: "approval-binding-mismatch",
      verdict: "FAIL",
    });
  });

  it("reports a failure when a replayed consume is allowed to succeed", async () => {
    class ReplayableRepository extends FakeApprovalRepository {
      override async consume(input: ConsumeRuntimeApprovalInput) {
        const current = await super.consume(input);
        if (current.status === "FAILED" && current.failures.some((f) => f.code === "RUNTIME_APPROVAL_CONSUMED")) {
          return ok(this.rows.get(input.approvalId) as RuntimeApprovalRequest);
        }
        return current;
      }
    }
    const repository = new ReplayableRepository();
    const result = await runLifecycle({}, repository);
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({
      caseId: "consume-replay-blocked",
      verdict: "FAIL",
    });
  });

  it("does not accept a persistence failure as proof that replay was blocked", async () => {
    class UnreachableOnReplayRepository extends FakeApprovalRepository {
      private consumeCount = 0;
      override async consume(input: ConsumeRuntimeApprovalInput) {
        this.consumeCount += 1;
        return this.consumeCount === 2 ? failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED") : super.consume(input);
      }
    }
    const repository = new UnreachableOnReplayRepository();
    const result = await runLifecycle({}, repository);
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({ caseId: "consume-replay-blocked" });
  });

  it("makes no network call and leaks nothing", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await runLifecycle();
    expect(result.status).toBe("PASSED");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(hasStagingUnsafeValue(result)).toBe(false);
    fetchSpy.mockRestore();
  });
});

describe("ST-B approval expiry (APR-02 expire)", () => {
  const expiryDeps = (repository: FakeApprovalRepository, clockMs: number, expiresAtMs: number) => ({
    repository,
    counter: counterFor(repository),
    binding,
    expiry: { approvalId: "approval-1", expiresAtMs },
    clock: () => clockMs,
    wait: vi.fn(async () => undefined),
  });

  it("fails closed without a repository or an expiry handle", async () => {
    const repository = new FakeApprovalRepository();
    expect(
      await runApprovalExpiry({ ...expiryDeps(repository, NOW, NOW), repository: undefined }),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_APPROVAL_REPOSITORY_NOT_INJECTED" });
    expect(
      await runApprovalExpiry({ ...expiryDeps(repository, NOW, NOW), expiry: undefined }),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_APPROVAL_EXPIRED_FIXTURE_NOT_INJECTED" });
  });

  it("refuses to sit on a TTL further away than ST-B should ever wait", async () => {
    const repository = new FakeApprovalRepository();
    const result = await runApprovalExpiry({
      ...expiryDeps(repository, NOW, NOW + 60 * 60 * 1000),
      maxWaitMs: 60_000,
    });
    expect(result).toMatchObject({ safeErrorCode: "LIVE_DB_EXPIRY_WAIT_EXCEEDED" });
  });

  it("waits out the remaining TTL before probing", async () => {
    const repository = new FakeApprovalRepository();
    await repository.create({ binding: fixtureBinding(binding, "apr02-expire") });
    repository["now"] = NOW + TTL_MS + 5_000;

    const wait = vi.fn(async () => undefined);
    const result = await runApprovalExpiry({
      repository,
      counter: counterFor(repository),
      binding,
      expiry: { approvalId: "approval-1", expiresAtMs: NOW + TTL_MS },
      clock: () => NOW + TTL_MS + 5_000,
      wait,
    });

    expect(result.status).toBe("PASSED");
    expect(result.caseResults).toEqual([
      { caseId: "approval-expiry", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
    ]);
    // The clock is already past the TTL, so no sleep was needed.
    expect(wait).not.toHaveBeenCalled();
  });

  it("blocks when the wait did not actually carry the clock past the TTL", async () => {
    const repository = new FakeApprovalRepository();
    const result = await runApprovalExpiry({
      repository,
      counter: counterFor(repository),
      binding,
      expiry: { approvalId: "approval-1", expiresAtMs: NOW + TTL_MS },
      clock: () => NOW,
      wait: vi.fn(async () => undefined),
    });
    expect(result).toMatchObject({ safeErrorCode: "LIVE_DB_EXPIRY_WAIT_EXCEEDED" });
  });

  it("accepts only RUNTIME_APPROVAL_EXPIRED, not a status-based refusal", async () => {
    class AlreadyExpiredRepository extends FakeApprovalRepository {
      override async decide() {
        // What a fixture already transitioned to EXPIRED answers: the TTL check
        // never runs, so this must not count as proof that expiry fired.
        return failed("RUNTIME_APPROVAL_NOT_APPROVED");
      }
    }
    const alreadyExpired = new AlreadyExpiredRepository();
    const result = await runApprovalExpiry({
      repository: alreadyExpired,
      counter: counterFor(alreadyExpired),
      binding,
      expiry: { approvalId: "approval-1", expiresAtMs: NOW },
      clock: () => NOW + 10_000,
      wait: vi.fn(async () => undefined),
    });
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({ caseId: "approval-expiry", verdict: "FAIL" });
  });

  it("requires the expiry to be journalled, not just refused", async () => {
    // The RPC answers EXPIRED but no EXPIRED event is written: the refusal is
    // real and the audit trail is not, which the count check has to catch.
    class SilentExpiryRepository extends FakeApprovalRepository {
      override async decide() {
        return failed("RUNTIME_APPROVAL_EXPIRED");
      }
    }
    const repository = new SilentExpiryRepository();
    await repository.create({ binding: fixtureBinding(binding, "apr02-expire") });

    const result = await runApprovalExpiry({
      repository,
      counter: counterFor(repository),
      binding,
      expiry: { approvalId: "approval-1", expiresAtMs: NOW },
      clock: () => NOW + 10_000,
      wait: vi.fn(async () => undefined),
    });

    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH");
    expect(result.caseResults.at(-1)).toMatchObject({ caseId: "approval-expiry", verdict: "FAIL" });
  });

  it("fails closed without a counter, since the journal cannot be checked", async () => {
    const repository = new FakeApprovalRepository();
    expect(
      await runApprovalExpiry({
        ...expiryDeps(repository, NOW + 10_000, NOW),
        counter: undefined,
      }),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_COUNTER_NOT_INJECTED" });
  });

  it("fails when the pre-aged fixture is accepted instead of refused", async () => {
    class NeverExpiringRepository extends FakeApprovalRepository {
      override async decide() {
        return ok({ ...binding, approvalId: "approval-1", status: "APPROVED" } as RuntimeApprovalRequest);
      }
    }
    const neverExpiring = new NeverExpiringRepository();
    const result = await runApprovalExpiry({
      repository: neverExpiring,
      counter: counterFor(neverExpiring),
      binding,
      expiry: { approvalId: "approval-1", expiresAtMs: NOW },
      clock: () => NOW + 10_000,
      wait: vi.fn(async () => undefined),
    });
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults.at(-1)).toMatchObject({ caseId: "approval-expiry", verdict: "FAIL" });
  });
});
