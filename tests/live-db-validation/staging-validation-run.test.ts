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
import { loadLiveDbEnvironment } from "./environment-loader";
import type {
  LiveDbRlsActor,
  LiveDbRlsFixtureCheck,
  LiveDbRlsMutateOutcome,
  LiveDbRlsReadOutcome,
  LiveDbRlsRpcOutcome,
} from "./rls-validation-runner";
import { hasStagingUnsafeValue } from "./staging-evidence";
import type {
  LiveDbMigrationExecutor,
  LiveDbMigrationExecutorOutcome,
} from "./staging-migration-executor";
import { runStagingValidation, type StagingValidationRunInput } from "./staging-validation-run";

const stagingRef = "stagingabc";
const productionRef = "productionxyz";

const validStagingSource = {
  LIVE_DB_TARGET_ENV: "staging",
  LIVE_DB_SUPABASE_URL: `https://${stagingRef}.supabase.co`,
  LIVE_DB_SUPABASE_SERVICE_ROLE_KEY: "test-service-role-placeholder",
  LIVE_DB_DATABASE_URL: `postgresql://postgres:pw-placeholder@db.${stagingRef}.supabase.co:5432/postgres`,
  LIVE_DB_EXECUTION_CONFIRMED: "true",
  LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF: productionRef,
};

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
const binding: RuntimeApprovalBinding = { ...core, bindingChecksum: checksumRuntimeApprovalBinding(core) };
const mismatchedCore = { ...core, safeInputChecksum: hex("input-tampered") };
const mismatchedBinding: RuntimeApprovalBinding = {
  ...mismatchedCore,
  bindingChecksum: checksumRuntimeApprovalBinding(mismatchedCore),
};

const NOW = Date.parse("2026-08-17T00:00:00.000Z");
const EXPIRED_APPROVAL_ID = "approval-pre-aged";

const ok = <T>(value: T): RuntimeApprovalRepositoryResult<T> => ({ status: "OK", value, failures: [] });
const failed = (code: RuntimeApprovalFailureCode): RuntimeApprovalRepositoryResult<never> => ({
  status: "FAILED",
  failures: [{ code }],
});

/** Follows the same precondition order as the Supabase-backed repository. */
class FakeRepository implements RuntimeApprovalRepository {
  private readonly rows = new Map<string, RuntimeApprovalRequest>();
  private sequence = 0;

  constructor() {
    this.rows.set(EXPIRED_APPROVAL_ID, {
      ...binding,
      approvalId: EXPIRED_APPROVAL_ID,
      status: "PENDING",
      createdAt: new Date(NOW - 3_600_000).toISOString(),
      expiresAt: new Date(NOW - 60_000).toISOString(),
    });
  }

  async create(input: CreateRuntimeApprovalInput) {
    if (!validateRuntimeApprovalBinding(input.binding)) return failed("RUNTIME_APPROVAL_INVALID");
    this.sequence += 1;
    const value: RuntimeApprovalRequest = {
      ...input.binding,
      approvalId: `approval-${this.sequence}`,
      status: "PENDING",
      createdAt: new Date(NOW).toISOString(),
      expiresAt: new Date(NOW + 900_000).toISOString(),
    };
    this.rows.set(value.approvalId, value);
    return ok(value);
  }

  async decide(input: DecideRuntimeApprovalInput) {
    const row = this.rows.get(input.approvalId);
    if (!row) return failed("RUNTIME_APPROVAL_NOT_FOUND");
    if (Date.parse(row.expiresAt) <= NOW) return failed("RUNTIME_APPROVAL_EXPIRED");
    const status =
      input.decision === "APPROVE" ? "APPROVED" : input.decision === "REJECT" ? "REJECTED" : "REVOKED";
    const value = { ...row, status } as RuntimeApprovalRequest;
    this.rows.set(input.approvalId, value);
    return ok(value);
  }

  async consume(input: ConsumeRuntimeApprovalInput) {
    if (!validateRuntimeApprovalBinding(input.binding)) return failed("RUNTIME_APPROVAL_INVALID");
    const row = this.rows.get(input.approvalId);
    if (!row) return failed("RUNTIME_APPROVAL_NOT_FOUND");
    if (row.status === "CONSUMED") return failed("RUNTIME_APPROVAL_CONSUMED");
    if (row.status !== "APPROVED") return failed("RUNTIME_APPROVAL_NOT_APPROVED");
    if (row.bindingChecksum !== input.binding.bindingChecksum) {
      return failed("RUNTIME_APPROVAL_BINDING_MISMATCH");
    }
    const value = { ...row, status: "CONSUMED" } as RuntimeApprovalRequest;
    this.rows.set(input.approvalId, value);
    return ok(value);
  }

  async get(approvalId: string) {
    const row = this.rows.get(approvalId);
    return row ? ok(row) : failed("RUNTIME_APPROVAL_NOT_FOUND");
  }
}

const visible: LiveDbRlsReadOutcome = { status: "READ", rowCount: 1 };
const filtered: LiveDbRlsReadOutcome = { status: "READ", rowCount: 0 };
const noRowsChanged: LiveDbRlsMutateOutcome = { status: "APPLIED", changedRowCount: 0 };
const writeDenied: LiveDbRlsMutateOutcome = {
  status: "REJECTED",
  safeErrorCode: "LIVE_DB_RLS_POLICY_VIOLATION",
};
const rpcDenied: LiveDbRlsRpcOutcome = {
  status: "REJECTED",
  safeErrorCode: "LIVE_DB_RLS_PERMISSION_DENIED",
};

const passingActors = (): LiveDbRlsActor[] => [
  { actorClass: "OWNER", read: vi.fn(async () => visible) },
  {
    actorClass: "OTHER_AUTHENTICATED",
    read: vi.fn(async () => filtered),
    mutate: vi.fn(async () => noRowsChanged),
  },
  {
    actorClass: "ANONYMOUS",
    read: vi.fn(async () => filtered),
    mutate: vi.fn(async () => writeDenied),
    rpc: vi.fn(async () => rpcDenied),
  },
];

const appliedExecutor: LiveDbMigrationExecutor = vi.fn(
  async (): Promise<LiveDbMigrationExecutorOutcome> => ({
    status: "APPLIED",
    appliedMigrationCount: 3,
  }),
);

const confirmFixture = vi.fn(async (): Promise<LiveDbRlsFixtureCheck> => ({ status: "PRESENT" }));

const run = (overrides: Partial<StagingValidationRunInput> = {}) =>
  runStagingValidation({
    environment: loadLiveDbEnvironment("connection", validStagingSource),
    migrationExecutor: appliedExecutor,
    approval: {
      repository: new FakeRepository(),
      binding,
      mismatchedBinding,
      expiredApprovalId: EXPIRED_APPROVAL_ID,
    },
    rls: { approvalId: "approval-1", confirmFixture, actors: passingActors() },
    timestamp: "2026-08-17T00:00:00.000Z",
    forbiddenProjectRefs: [stagingRef, productionRef],
    ...overrides,
  });

describe("ST-B staging validation composition root", () => {
  it("runs guard, migration, approval, RLS and evidence as one path", async () => {
    const result = await run();

    expect(result.status).toBe("PASSED");
    expect(result.evidence).toMatchObject({
      targetEnvironment: "staging",
      executionMode: "STAGING",
      maskedProjectRef: "stag…gabc",
      migrationApplied: true,
      appliedMigrationCount: 3,
      secretExposureDetected: false,
      verdict: "PASS",
      failedCaseIds: [],
    });
    expect(result.evidence.executedCaseIds).toEqual([
      "approval-create",
      "approval-approve",
      "approval-reject",
      "approval-revoke",
      "approval-expiry",
      "approval-consume",
      "consume-replay-blocked",
      "approval-binding-mismatch",
      "rls-owner-read",
      "rls-cross-user-denied",
      "rls-anon-denied",
    ]);
  });

  it("stops before touching approvals when the migration boundary blocks", async () => {
    const repository = new FakeRepository();
    const createSpy = vi.spyOn(repository, "create");
    const actors = passingActors();

    const result = await run({
      environment: loadLiveDbEnvironment("connection", {
        ...validStagingSource,
        // The database URL now points at the production project.
        LIVE_DB_DATABASE_URL: `postgresql://postgres:pw@db.${productionRef}.supabase.co:5432/postgres`,
      }),
      approval: { repository, binding, mismatchedBinding, expiredApprovalId: EXPIRED_APPROVAL_ID },
      rls: { approvalId: "approval-1", confirmFixture, actors },
    });

    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_DB_URL_TARGET_MISMATCH");
    expect(createSpy).not.toHaveBeenCalled();
    expect(actors[0].read).not.toHaveBeenCalled();
    expect(result.evidence).toMatchObject({
      migrationApplied: false,
      appliedMigrationCount: 0,
      maskedProjectRef: "unavailable",
      verdict: "FAIL",
    });
  });

  it("blocks when no migration executor is injected", async () => {
    const actors = passingActors();
    const result = await run({
      migrationExecutor: undefined,
      rls: { approvalId: "approval-1", confirmFixture, actors },
    });

    expect(result.safeErrorCode).toBe("LIVE_DB_MIGRATION_EXECUTOR_NOT_INJECTED");
    expect(actors[0].read).not.toHaveBeenCalled();
  });

  it("stops before RLS when approval validation blocks", async () => {
    const actors = passingActors();
    const result = await run({
      approval: {
        repository: new FakeRepository(),
        binding,
        mismatchedBinding,
        expiredApprovalId: undefined,
      },
      rls: { approvalId: "approval-1", confirmFixture, actors },
    });

    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_APPROVAL_EXPIRED_FIXTURE_NOT_INJECTED");
    expect(actors[0].read).not.toHaveBeenCalled();
    expect(result.evidence.verdict).toBe("FAIL");
  });

  it("blocks and records the failed case when RLS finds an access violation", async () => {
    const actors = passingActors();
    const invoked: LiveDbRlsRpcOutcome = { status: "INVOKED" };
    actors[2].rpc = vi.fn(async () => invoked);

    const result = await run({ rls: { approvalId: "approval-1", confirmFixture, actors } });

    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_RLS_ACCESS_VIOLATION");
    expect(result.evidence.failedCaseIds).toEqual(["rls-anon-denied"]);
    expect(result.evidence.verdict).toBe("FAIL");
  });

  it("blocks a run whose evidence would carry a secret, even when every case passed", async () => {
    // A run id that embeds the full project ref: passing cases, unsafe record.
    const result = await run({ validationRunId: `live-db-validation-001-${stagingRef}` });

    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_SECRET_EXPOSURE_DETECTED");
    expect(result.evidence.secretExposureDetected).toBe(true);
    expect(result.evidence.validationRunId).toBe("unavailable");
    expect(hasStagingUnsafeValue(result.evidence, { forbiddenProjectRefs: [stagingRef] })).toBe(false);
  });

  it("keeps the database URL and full ref out of evidence on every path", async () => {
    const passed = await run();
    const blocked = await run({ migrationExecutor: undefined });
    for (const result of [passed, blocked]) {
      expect(
        hasStagingUnsafeValue(result.evidence, { forbiddenProjectRefs: [stagingRef, productionRef] }),
      ).toBe(false);
    }
  });

  it("carries the migration failure code through instead of a generic block", async () => {
    const failedOutcome: LiveDbMigrationExecutorOutcome = {
      status: "FAILED",
      safeErrorCode: "LIVE_DB_MIGRATION_EXECUTION_FAILED",
    };
    const result = await run({ migrationExecutor: vi.fn(async () => failedOutcome) });
    expect(result.safeErrorCode).toBe("LIVE_DB_MIGRATION_EXECUTION_FAILED");
  });
});
