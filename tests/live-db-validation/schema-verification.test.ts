import { describe, expect, it, vi } from "vitest";

import { createLiveDbRecordCounter } from "./runtime-record-counters";
import {
  requiredFunctions,
  requiredTables,
  verifyImmutabilityTrigger,
  verifyStagingSchema,
  type LiveDbSchemaClient,
} from "./schema-verification";

const raised = { code: "P0001", message: "RUNTIME_APPROVAL_NOT_FOUND" };
const missingTable = { code: "PGRST205", message: "table not found" };
const missingFunction = { code: "42883", message: "function does not exist" };
const connectionLost = { code: "08006", message: "connection failure" };

type Overrides = {
  tableError?: (table: string) => unknown;
  rpcError?: (fn: string) => unknown;
  updateError?: unknown;
  counts?: Record<string, number>;
};

const clientWith = (overrides: Overrides = {}) => {
  const calls: string[] = [];
  // `in` rather than `??`: an override of `null` means "this call succeeds",
  // which is exactly the case these probes must reject, and `??` would swallow it.
  const updateError = "updateError" in overrides ? overrides.updateError : raised;
  const client: LiveDbSchemaClient = {
    from(table) {
      calls.push(`from:${table}`);
      const outcome = {
        error: overrides.tableError ? overrides.tableError(table) : null,
        count: overrides.counts?.[table] ?? 0,
      };
      return {
        select() {
          return {
            then: (resolve: (value: unknown) => unknown) => Promise.resolve(outcome).then(resolve),
            eq: async () => outcome,
          } as never;
        },
        update(values: Record<string, unknown>) {
          calls.push(`update:${table}:${Object.keys(values).join(",")}`);
          return { eq: async () => ({ error: updateError }) };
        },
      };
    },
    async rpc(fn) {
      calls.push(`rpc:${fn}`);
      return { error: overrides.rpcError ? overrides.rpcError(fn) : raised, data: null };
    },
  };
  return { client, calls };
};

describe("verifyStagingSchema (MIG-01, structural)", () => {
  it("fails closed without a client", async () => {
    expect(await verifyStagingSchema(undefined)).toMatchObject({
      safeErrorCode: "LIVE_DB_COUNTER_NOT_INJECTED",
    });
  });

  it("verifies every required table and function", async () => {
    const { client, calls } = clientWith();
    expect(await verifyStagingSchema(client)).toEqual({
      status: "VERIFIED",
      tableCount: requiredTables.length,
      functionCount: requiredFunctions.length,
    });
    for (const table of requiredTables) expect(calls).toContain(`from:${table}`);
    for (const fn of requiredFunctions) expect(calls).toContain(`rpc:${fn}`);
  });

  it("writes nothing: the probes only read or are refused", async () => {
    const { client, calls } = clientWith();
    await verifyStagingSchema(client);
    expect(calls.some((call) => call.startsWith("update:"))).toBe(false);
  });

  it("reports a missing table as a partial migration", async () => {
    const { client } = clientWith({
      tableError: (table) => (table === "runtime_evidence_records" ? missingTable : null),
    });
    expect(await verifyStagingSchema(client)).toMatchObject({
      safeErrorCode: "LIVE_DB_SCHEMA_OBJECT_MISSING",
    });
  });

  it("reports a missing function as a partial migration", async () => {
    const { client } = clientWith({
      rpcError: (fn) => (fn === "consume_runtime_approval_request" ? missingFunction : raised),
    });
    expect(await verifyStagingSchema(client)).toMatchObject({
      safeErrorCode: "LIVE_DB_SCHEMA_OBJECT_MISSING",
    });
  });

  it("does not read an infrastructure fault as a missing object", async () => {
    expect(
      await verifyStagingSchema(clientWith({ tableError: () => connectionLost }).client),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" });
    expect(
      await verifyStagingSchema(clientWith({ rpcError: () => connectionLost }).client),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" });
  });

  it("blocks when a probe built to be refused succeeds instead", async () => {
    // A function that accepts an absent project id is not the one the migration
    // defines, whatever else it may be.
    const { client } = clientWith({ rpcError: () => null });
    expect(await verifyStagingSchema(client)).toMatchObject({
      safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED",
    });
  });

  it("survives a throwing client", async () => {
    const client = {
      from: () => {
        throw new Error("boom");
      },
    } as unknown as LiveDbSchemaClient;
    expect(await verifyStagingSchema(client)).toMatchObject({
      safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED",
    });
  });
});

describe("verifyImmutabilityTrigger (MIG-01, behavioural)", () => {
  it("passes when the trigger refuses the update", async () => {
    const { client, calls } = clientWith();
    expect(await verifyImmutabilityTrigger(client, "approval-1")).toEqual({ status: "VERIFIED" });
    // It probes expires_at, which the trigger protects.
    expect(calls).toContain("update:runtime_approval_requests:expires_at");
  });

  it("blocks when the update succeeds, which means no trigger is attached", async () => {
    const { client } = clientWith({ updateError: null });
    expect(await verifyImmutabilityTrigger(client, "approval-1")).toMatchObject({
      safeErrorCode: "LIVE_DB_IMMUTABILITY_TRIGGER_MISSING",
    });
  });

  it("does not accept an unrelated failure as the trigger firing", async () => {
    const { client } = clientWith({ updateError: connectionLost });
    expect(await verifyImmutabilityTrigger(client, "approval-1")).toMatchObject({
      safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED",
    });
  });

  it("fails closed without a client", async () => {
    expect(await verifyImmutabilityTrigger(undefined, "approval-1")).toMatchObject({
      safeErrorCode: "LIVE_DB_COUNTER_NOT_INJECTED",
    });
  });
});

describe("createLiveDbRecordCounter", () => {
  it("counts events for one approval and evidence rows overall", async () => {
    const { client } = clientWith({
      counts: { runtime_approval_events: 3, runtime_evidence_records: 0 },
    });
    const counter = createLiveDbRecordCounter(client);
    expect(await counter.countApprovalEvents("approval-1")).toEqual({ status: "COUNTED", count: 3 });
    expect(await counter.countRuntimeEvidence()).toEqual({ status: "COUNTED", count: 0 });
  });

  it("reports an error rather than a zero when the count is unavailable", async () => {
    const { client } = clientWith({ tableError: () => connectionLost });
    const counter = createLiveDbRecordCounter(client);
    expect(await counter.countRuntimeEvidence()).toMatchObject({ status: "ERRORED" });
  });

  it("treats a null count as an error, since zero would be a false all-clear", async () => {
    const client: LiveDbSchemaClient = {
      from: () => ({
        select: () =>
          ({
            then: (resolve: (value: unknown) => unknown) =>
              Promise.resolve({ error: null, count: null }).then(resolve),
            eq: async () => ({ error: null, count: null }),
          }) as never,
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
      rpc: vi.fn(),
    } as unknown as LiveDbSchemaClient;
    expect(await createLiveDbRecordCounter(client).countRuntimeEvidence()).toMatchObject({
      status: "ERRORED",
    });
  });
});
