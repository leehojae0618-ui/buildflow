import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

/**
 * The composition root builds its own repositories, so the adapters are mocked
 * rather than injected. `state` is hoisted because a vi.mock factory runs
 * before the module body.
 */
const state = vi.hoisted(() => ({
  approvalConstructions: [] as unknown[],
  evidenceConstructions: [] as unknown[],
}));

vi.mock("../../src/features/runtime-approval/runtime-approval-supabase", async () => {
  const { validateRuntimeApprovalBinding } = await import(
    "../../src/features/runtime-approval/validator"
  );
  const NOW = Date.parse("2026-08-17T00:00:00.000Z");
  const ok = (value: unknown) => ({ status: "OK", value, failures: [] });
  const failed = (code: string) => ({ status: "FAILED", failures: [{ code }] });

  return {
    SupabaseRuntimeApprovalRepository: class {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      private readonly rows = new Map<string, any>();
      private sequence = 0;

      constructor(readonly client: unknown) {
        state.approvalConstructions.push(client);
        this.rows.set("approval-pre-aged", {
          approvalId: "approval-pre-aged",
          bindingChecksum: "pre-aged-fixture-checksum",
          status: "PENDING",
          expiresAt: new Date(NOW - 60_000).toISOString(),
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async create(input: any) {
        if (!validateRuntimeApprovalBinding(input.binding)) return failed("RUNTIME_APPROVAL_INVALID");
        const duplicate = [...this.rows.values()].some(
          (row) => row.bindingChecksum === input.binding.bindingChecksum,
        );
        if (duplicate) return failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED");
        this.sequence += 1;
        const value = {
          ...input.binding,
          approvalId: `approval-${this.sequence}`,
          status: "PENDING",
          expiresAt: new Date(NOW + 900_000).toISOString(),
        };
        this.rows.set(value.approvalId, value);
        return ok(value);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async decide(input: any) {
        const row = this.rows.get(input.approvalId);
        if (!row) return failed("RUNTIME_APPROVAL_NOT_FOUND");
        if (Date.parse(row.expiresAt) <= NOW) return failed("RUNTIME_APPROVAL_EXPIRED");
        const status =
          input.decision === "APPROVE" ? "APPROVED" : input.decision === "REJECT" ? "REJECTED" : "REVOKED";
        const value = { ...row, status };
        this.rows.set(input.approvalId, value);
        return ok(value);
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
        const value = { ...row, status: "CONSUMED" };
        this.rows.set(input.approvalId, value);
        return ok(value);
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
import type { LiveDbClientFactory } from "./live-db-client";
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
import type { LiveDbClientIdentityCandidate } from "./types";
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

const confirmFixture = vi.fn(async (): Promise<LiveDbRlsFixtureCheck> => ({ status: "PRESENT" }));
const clientFactory: LiveDbClientFactory = vi.fn(() => ({ marker: "live-db" }) as never);

const rlsInput = (overrides: Partial<StagingValidationRunInput["rls"]> = {}) => ({
  approvalId: "approval-1",
  confirmFixture,
  actors: passingActors(),
  identity: validIdentity,
  ...overrides,
});

const run = (overrides: Partial<StagingValidationRunInput> = {}) =>
  runStagingValidation({
    environment: loadLiveDbEnvironment("connection", validStagingSource),
    migrationExecutor: appliedExecutor,
    clientFactory,
    approval: { binding, mismatchedBinding, expiredApprovalId: "approval-pre-aged" },
    rls: rlsInput(),
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

  it("builds the approval repository from the guarded environment rather than accepting one", async () => {
    state.approvalConstructions.length = 0;
    state.evidenceConstructions.length = 0;

    const result = await run();

    expect(result.status).toBe("PASSED");
    // The repository was constructed here, with the client this root built, so
    // it cannot have fallen back to createSupabaseAdminClient().
    expect(state.approvalConstructions).toHaveLength(1);
    expect(state.approvalConstructions[0]).toMatchObject({ marker: "live-db" });
    expect(state.evidenceConstructions).toHaveLength(1);
    expect(clientFactory).toHaveBeenCalledWith(
      `https://${stagingRef}.supabase.co`,
      "test-service-role-placeholder",
    );
  });

  it("cannot open a connection when no client factory is injected", async () => {
    const rls = rlsInput();
    const result = await run({ clientFactory: undefined, rls });

    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED");
    expect(rls.actors[0].read).not.toHaveBeenCalled();
  });

  it("blocks when the RLS actors carry no identity attestation", async () => {
    const rls = rlsInput({ identity: undefined });
    const result = await run({ rls });

    expect(result.safeErrorCode).toBe("LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED");
    expect(rls.actors[0].read).not.toHaveBeenCalled();
  });

  it("blocks an RLS attestation that admits an application or admin factory", async () => {
    for (const [field, code] of [
      ["appClientFactoryUsed", "LIVE_DB_APP_CLIENT_FACTORY_USED"],
      ["adminClientFactoryUsed", "LIVE_DB_ADMIN_CLIENT_FACTORY_USED"],
      ["serverClientFactoryUsed", "LIVE_DB_SERVER_CLIENT_FACTORY_USED"],
    ] as const) {
      const result = await run({
        rls: rlsInput({ identity: { ...validIdentity, [field]: true } }),
      });
      expect(result.safeErrorCode).toBe(code);
    }

    expect(
      (await run({ rls: rlsInput({ identity: { ...validIdentity, supabaseClientMode: "other" } }) }))
        .safeErrorCode,
    ).toBe("LIVE_DB_CLIENT_MODE_INVALID");
    expect(
      (
        await run({
          rls: rlsInput({ identity: { ...validIdentity, repositoryDefaultClientFallbackUsed: true } }),
        })
      ).safeErrorCode,
    ).toBe("LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED");
  });

  it("stops before touching approvals when the migration boundary blocks", async () => {
    state.approvalConstructions.length = 0;
    const rls = rlsInput();

    const result = await run({
      environment: loadLiveDbEnvironment("connection", {
        ...validStagingSource,
        // The database URL now points at the production project.
        LIVE_DB_DATABASE_URL: `postgresql://postgres:pw@db.${productionRef}.supabase.co:5432/postgres`,
      }),
      rls,
    });

    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_DB_URL_TARGET_MISMATCH");
    // No client and no repository are built once the target is in doubt.
    expect(state.approvalConstructions).toHaveLength(0);
    expect(rls.actors[0].read).not.toHaveBeenCalled();
    expect(result.evidence).toMatchObject({
      migrationApplied: false,
      appliedMigrationCount: 0,
      maskedProjectRef: "unavailable",
      verdict: "FAIL",
    });
  });

  it("blocks when no migration executor is injected", async () => {
    const rls = rlsInput();
    const result = await run({ migrationExecutor: undefined, rls });

    expect(result.safeErrorCode).toBe("LIVE_DB_MIGRATION_EXECUTOR_NOT_INJECTED");
    expect(rls.actors[0].read).not.toHaveBeenCalled();
  });

  it("stops before RLS when approval validation blocks", async () => {
    const rls = rlsInput();
    const result = await run({
      approval: { binding, mismatchedBinding, expiredApprovalId: undefined },
      rls,
    });

    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_APPROVAL_EXPIRED_FIXTURE_NOT_INJECTED");
    expect(rls.actors[0].read).not.toHaveBeenCalled();
    expect(result.evidence.verdict).toBe("FAIL");
  });

  it("blocks and records the failed case when RLS finds an access violation", async () => {
    const actors = passingActors();
    const invoked: LiveDbRlsRpcOutcome = { status: "INVOKED" };
    actors[2].rpc = vi.fn(async () => invoked);

    const result = await run({ rls: rlsInput({ actors }) });

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
