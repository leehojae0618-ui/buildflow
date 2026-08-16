import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

/**
 * The composition root builds its own clients and repositories, so the adapters
 * and the Supabase SDK are mocked rather than injected. `state` is hoisted
 * because a vi.mock factory runs before the module body.
 */
const state = vi.hoisted(() => ({
  approvalConstructions: [] as unknown[],
  evidenceConstructions: [] as unknown[],
  createdClients: [] as { url: string; key: string }[],
  /** Every table/rpc call the root's service-role client made. */
  calls: [] as string[],
  events: new Map<string, string[]>(),
  evidenceRows: 0,
  triggerRejects: true,
  schemaPresent: true,
  /**
   * The fake database's clock. The root reads it and the injected `wait`
   * advances it, so the expiry case exercises the real wait-then-probe path
   * instead of starting out already past the TTL.
   */
  nowMs: Date.parse("2026-08-17T00:00:00.000Z"),
  reset() {
    this.approvalConstructions.length = 0;
    this.evidenceConstructions.length = 0;
    this.createdClients.length = 0;
    this.calls.length = 0;
    this.events.clear();
    this.evidenceRows = 0;
    this.triggerRejects = true;
    this.schemaPresent = true;
    this.nowMs = Date.parse("2026-08-17T00:00:00.000Z");
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (url: string, key: string) => {
    state.createdClients.push({ url, key });
    const missing = { code: "PGRST205", message: "not found" };
    const raised = { code: "P0001", message: "RUNTIME_APPROVAL_NOT_FOUND" };
    return {
      from(table: string) {
        state.calls.push(`from:${table}`);
        return {
          select() {
            const outcome = state.schemaPresent
              ? { error: null, count: table === "runtime_evidence_records" ? state.evidenceRows : 0 }
              : { error: missing, count: null };
            return {
              then: (resolve: (value: unknown) => unknown) => Promise.resolve(outcome).then(resolve),
              eq: (_column: string, value: string) =>
                Promise.resolve(
                  table === "runtime_approval_events"
                    ? { error: null, count: (state.events.get(value) ?? []).length }
                    : outcome,
                ),
            };
          },
          update() {
            return {
              eq: async () => ({ error: state.triggerRejects ? raised : null }),
            };
          },
        };
      },
      rpc(fn: string) {
        state.calls.push(`rpc:${fn}`);
        return Promise.resolve({ error: state.schemaPresent ? raised : missing, data: null });
      },
    };
  },
}));

vi.mock("../../src/features/runtime-approval/runtime-approval-supabase", async () => {
  const { validateRuntimeApprovalBinding } = await import(
    "../../src/features/runtime-approval/validator"
  );
  const TTL_MS = 900_000;
  const ok = (value: unknown) => ({ status: "OK", value, failures: [] });
  const failed = (code: string) => ({ status: "FAILED", failures: [{ code }] });

  return {
    SupabaseRuntimeApprovalRepository: class {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      private readonly rows = new Map<string, any>();
      private sequence = 0;

      constructor(readonly client: unknown) {
        state.approvalConstructions.push(client);
      }

      private record(approvalId: string, event: string) {
        state.events.set(approvalId, [...(state.events.get(approvalId) ?? []), event]);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async create(input: any) {
        if (!validateRuntimeApprovalBinding(input.binding)) return failed("RUNTIME_APPROVAL_INVALID");
        if ([...this.rows.values()].some((row) => row.bindingChecksum === input.binding.bindingChecksum)) {
          return failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED");
        }
        this.sequence += 1;
        const value = {
          ...input.binding,
          approvalId: `approval-${this.sequence}`,
          status: "PENDING",
          expiresAt: new Date(state.nowMs + TTL_MS).toISOString(),
        };
        this.rows.set(value.approvalId, value);
        this.record(value.approvalId, "CREATED");
        return ok(value);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async decide(input: any) {
        const row = this.rows.get(input.approvalId);
        if (!row) return failed("RUNTIME_APPROVAL_NOT_FOUND");
        if (row.status === "EXPIRED") return failed("RUNTIME_APPROVAL_NOT_APPROVED");
        // The TTL is checked before the transition, as decide_runtime_approval
        // _request does, so a fixture left alone long enough answers EXPIRED.
        if (Date.parse(row.expiresAt) <= state.nowMs) {
          this.rows.set(input.approvalId, { ...row, status: "EXPIRED" });
          this.record(input.approvalId, "EXPIRED");
          return failed("RUNTIME_APPROVAL_EXPIRED");
        }
        const status =
          input.decision === "APPROVE" ? "APPROVED" : input.decision === "REJECT" ? "REJECTED" : "REVOKED";
        this.rows.set(input.approvalId, { ...row, status });
        this.record(input.approvalId, status);
        return ok({ ...row, status });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async consume(input: any) {
        if (!validateRuntimeApprovalBinding(input.binding)) return failed("RUNTIME_APPROVAL_INVALID");
        const row = this.rows.get(input.approvalId);
        if (!row) return failed("RUNTIME_APPROVAL_NOT_FOUND");
        if (row.status === "CONSUMED") return failed("RUNTIME_APPROVAL_CONSUMED");
        if (row.status !== "APPROVED") return failed("RUNTIME_APPROVAL_NOT_APPROVED");
        if (row.bindingChecksum !== input.binding.bindingChecksum) {
          return failed("RUNTIME_APPROVAL_BINDING_MISMATCH");
        }
        this.rows.set(input.approvalId, { ...row, status: "CONSUMED" });
        this.record(input.approvalId, "CONSUMED");
        return ok({ ...row, status: "CONSUMED" });
      }

      async get(approvalId: string) {
        const row = this.rows.get(approvalId);
        return row ? ok(row) : failed("RUNTIME_APPROVAL_NOT_FOUND");
      }
    },
  };
});

vi.mock("../../src/features/agents/runtime-evidence-supabase", () => ({
  SupabaseRuntimeEvidenceRepository: class {
    constructor(readonly client: unknown) {
      state.evidenceConstructions.push(client);
    }
  },
}));

import type { RuntimeApprovalBinding } from "../../src/features/runtime-approval/types";
import { checksumRuntimeApprovalBinding } from "../../src/features/runtime-approval/validator";
import { loadLiveDbEnvironment } from "./environment-loader";
import type {
  LiveDbRlsActor,
  LiveDbRlsMutateOutcome,
  LiveDbRlsReadOutcome,
  LiveDbRlsRpcOutcome,
} from "./rls-validation-runner";
import { hasStagingUnsafeValue } from "./staging-evidence";
import type {
  LiveDbMigrationExecutor,
  LiveDbMigrationExecutorOutcome,
} from "./staging-migration-executor";
import { LIVE_DB_TEST_PREFIX, type LiveDbClientIdentityCandidate } from "./types";
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
  runtimeExecutionRequestId: `${LIVE_DB_TEST_PREFIX}request`,
  runtimeExecutionRequestChecksum: hex("request-1"),
  runtimePlanId: `${LIVE_DB_TEST_PREFIX}plan`,
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

const validIdentity: LiveDbClientIdentityCandidate = {
  supabaseClientMode: "LIVE_DB_EXPLICIT_INJECTION",
  appClientFactoryUsed: false,
  adminClientFactoryUsed: false,
  serverClientFactoryUsed: false,
};

const appliedExecutor: LiveDbMigrationExecutor = vi.fn(
  async (): Promise<LiveDbMigrationExecutorOutcome> => ({
    status: "APPLIED",
    appliedMigrationCount: 3,
  }),
);

/** `setup` runs after the reset, so a test can shape the fake database. */
const run = (overrides: Partial<StagingValidationRunInput> = {}, setup?: () => void) => {
  state.reset();
  setup?.();
  return runStagingValidation({
    environment: loadLiveDbEnvironment("connection", validStagingSource),
    migrationExecutor: appliedExecutor,
    approval: { binding, mismatchedBinding },
    rls: { actors: passingActors(), identity: validIdentity },
    timestamp: "2026-08-17T00:00:00.000Z",
    clock: () => state.nowMs,
    // Advancing the fake clock is what makes the fixture expire, so the run
    // genuinely waits the TTL out rather than starting past it.
    wait: async (milliseconds: number) => {
      state.nowMs += milliseconds;
    },
    forbiddenProjectRefs: [stagingRef, productionRef],
    ...overrides,
  });
};

describe("ST-B staging validation composition root", () => {
  it("runs preflight, migration, MIG-01, APR, RLS, expiry and evidence as one path", async () => {
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
      "migration-schema-objects",
      "approval-create",
      "approval-approve",
      "approval-reject",
      "approval-revoke",
      "approval-consume",
      "consume-replay-blocked",
      "approval-binding-mismatch",
      "migration-immutability-trigger",
      "rls-owner-read",
      "rls-cross-user-denied",
      "rls-anon-denied",
      "approval-expiry",
    ]);
  });

  it("records the client identity CONTRACT.md requires", async () => {
    const { evidence } = await run();
    expect(evidence).toMatchObject({
      supabaseClientMode: "LIVE_DB_EXPLICIT_INJECTION",
      appClientFactoryUsed: false,
      adminClientFactoryUsed: false,
      serverClientFactoryUsed: false,
    });
  });

  it("builds its own clients from the guarded environment, accepting none", async () => {
    const result = await run();

    expect(result.status).toBe("PASSED");
    expect(state.createdClients).toEqual([
      { url: `https://${stagingRef}.supabase.co`, key: "test-service-role-placeholder" },
      { url: `https://${stagingRef}.supabase.co`, key: "test-service-role-placeholder" },
    ]);
    // The repository was constructed here, so it cannot have fallen back to
    // createSupabaseAdminClient().
    expect(state.approvalConstructions).toHaveLength(1);
    expect(state.evidenceConstructions).toHaveLength(1);
  });

  describe("preflight runs before anything irreversible", () => {
    const cases: [string, Partial<StagingValidationRunInput>, string][] = [
      [
        "a target the guard rejects",
        {
          environment: loadLiveDbEnvironment("connection", {
            ...validStagingSource,
            LIVE_DB_DATABASE_URL: `postgresql://postgres:pw@db.${productionRef}.supabase.co:5432/postgres`,
          }),
        },
        "LIVE_DB_DB_URL_TARGET_MISMATCH",
      ],
      ["a missing migration executor", { migrationExecutor: undefined }, "LIVE_DB_MIGRATION_EXECUTOR_NOT_INJECTED"],
      [
        "an incomplete actor set",
        { rls: { actors: [passingActors()[0]], identity: validIdentity } },
        "LIVE_DB_RLS_ACTOR_NOT_INJECTED",
      ],
      [
        "a missing identity attestation",
        { rls: { actors: passingActors(), identity: undefined } },
        "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED",
      ],
      [
        "an admin-factory attestation",
        { rls: { actors: passingActors(), identity: { ...validIdentity, adminClientFactoryUsed: true } } },
        "LIVE_DB_ADMIN_CLIENT_FACTORY_USED",
      ],
      [
        "an unprefixed fixture identifier",
        {
          approval: {
            binding: (() => {
              const unprefixed = { ...core, runtimeExecutionRequestId: "no-prefix" };
              return { ...unprefixed, bindingChecksum: checksumRuntimeApprovalBinding(unprefixed) };
            })(),
            mismatchedBinding,
          },
        },
        "LIVE_DB_FIXTURE_PREFIX_REQUIRED",
      ],
      ["an unusable timestamp", { timestamp: "2026-08-17 00:00:00" }, "LIVE_DB_PREFLIGHT_INCOMPLETE"],
    ];

    it.each(cases)("blocks on %s without applying a migration", async (_label, overrides, code) => {
      const executor = vi.fn(
        async (): Promise<LiveDbMigrationExecutorOutcome> => ({
          status: "APPLIED",
          appliedMigrationCount: 3,
        }),
      );
      const result = await run({
        ...(overrides.migrationExecutor === undefined && "migrationExecutor" in overrides
          ? {}
          : { migrationExecutor: executor }),
        ...overrides,
      });

      expect(result.status).toBe("BLOCKED");
      expect(result.safeErrorCode).toBe(code);
      expect(executor).not.toHaveBeenCalled();
      // Nothing was constructed either, so no connection could have opened.
      expect(state.createdClients).toHaveLength(0);
      expect(state.approvalConstructions).toHaveLength(0);
      expect(result.evidence).toMatchObject({
        migrationApplied: false,
        appliedMigrationCount: 0,
        maskedProjectRef: "unavailable",
        verdict: "FAIL",
      });
    });
  });

  it("blocks when the migration left a required object missing", async () => {
    // The executor reported success, but the objects are not there — which is
    // exactly the partial migration MIG-01 exists to catch.
    const result = await run({}, () => {
      state.schemaPresent = false;
    });
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_SCHEMA_OBJECT_MISSING");
    expect(result.evidence.failedCaseIds).toEqual(["migration-schema-objects"]);
  });

  it("blocks when the immutability trigger does not reject the probe", async () => {
    const result = await run({}, () => {
      // The update succeeds, which means the trigger is not attached.
      state.triggerRejects = false;
    });
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_IMMUTABILITY_TRIGGER_MISSING");
    expect(result.evidence.failedCaseIds).toEqual(["migration-immutability-trigger"]);
  });

  it("blocks and records the failed case when RLS finds an access violation", async () => {
    const actors = passingActors();
    const invoked: LiveDbRlsRpcOutcome = { status: "INVOKED" };
    actors[2].rpc = vi.fn(async () => invoked);

    const result = await run({ rls: { actors, identity: validIdentity } });

    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_RLS_ACCESS_VIOLATION");
    expect(result.evidence.failedCaseIds).toEqual(["rls-anon-denied"]);
  });

  it("blocks when ST-B left Runtime Evidence behind, which is ST-C's gate", async () => {
    const result = await run({}, () => {
      state.evidenceRows = 1;
    });
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_RUNTIME_EVIDENCE_UNEXPECTED");
  });

  it("blocks a run whose evidence would carry a secret, even when every case passed", async () => {
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
