import { describe, expect, it, vi } from "vitest";

import {
  runRlsValidation,
  type LiveDbRlsActor,
  type LiveDbRlsFixtureCheck,
  type LiveDbRlsMutateOutcome,
  type LiveDbRlsReadOutcome,
  type LiveDbRlsRpcOutcome,
} from "./rls-validation-runner";
import { hasStagingUnsafeValue } from "./staging-evidence";

const approvalId = "approval-under-test";

const read = {
  visible: (rowCount = 1): LiveDbRlsReadOutcome => ({ status: "READ", rowCount }),
  filtered: { status: "READ", rowCount: 0 } as LiveDbRlsReadOutcome,
  connectionLost: {
    status: "REJECTED",
    safeErrorCode: "LIVE_DB_RLS_INFRASTRUCTURE_ERROR",
  } as LiveDbRlsReadOutcome,
  // Even an authorization-shaped rejection is not how RLS denies a SELECT.
  permissionDenied: {
    status: "REJECTED",
    safeErrorCode: "LIVE_DB_RLS_PERMISSION_DENIED",
  } as LiveDbRlsReadOutcome,
};

const mutate = {
  denied: {
    status: "REJECTED",
    safeErrorCode: "LIVE_DB_RLS_POLICY_VIOLATION",
  } as LiveDbRlsMutateOutcome,
  noRowsChanged: { status: "APPLIED", changedRowCount: 0 } as LiveDbRlsMutateOutcome,
  applied: { status: "APPLIED", changedRowCount: 1 } as LiveDbRlsMutateOutcome,
  timedOut: {
    status: "REJECTED",
    safeErrorCode: "LIVE_DB_RLS_INFRASTRUCTURE_ERROR",
  } as LiveDbRlsMutateOutcome,
};

const rpc = {
  denied: {
    status: "REJECTED",
    safeErrorCode: "LIVE_DB_RLS_PERMISSION_DENIED",
  } as LiveDbRlsRpcOutcome,
  invoked: { status: "INVOKED" } as LiveDbRlsRpcOutcome,
  errored: {
    status: "REJECTED",
    safeErrorCode: "LIVE_DB_RLS_INFRASTRUCTURE_ERROR",
  } as LiveDbRlsRpcOutcome,
};

const owner = (outcome: LiveDbRlsReadOutcome = read.visible()): LiveDbRlsActor => ({
  actorClass: "OWNER",
  read: vi.fn(async () => outcome),
});

const other = (
  readOutcome: LiveDbRlsReadOutcome = read.filtered,
  mutateOutcome: LiveDbRlsMutateOutcome = mutate.denied,
): LiveDbRlsActor => ({
  actorClass: "OTHER_AUTHENTICATED",
  read: vi.fn(async () => readOutcome),
  mutate: vi.fn(async () => mutateOutcome),
});

const anon = (
  readOutcome: LiveDbRlsReadOutcome = read.filtered,
  mutateOutcome: LiveDbRlsMutateOutcome = mutate.denied,
  rpcOutcome: LiveDbRlsRpcOutcome = rpc.denied,
): LiveDbRlsActor => ({
  actorClass: "ANONYMOUS",
  read: vi.fn(async () => readOutcome),
  mutate: vi.fn(async () => mutateOutcome),
  rpc: vi.fn(async () => rpcOutcome),
});

const present = vi.fn(async (): Promise<LiveDbRlsFixtureCheck> => ({ status: "PRESENT" }));

const run = (
  actors: readonly LiveDbRlsActor[] | undefined = [owner(), other(), anon()],
  confirmFixture: RlsConfirm = present,
) => runRlsValidation({ approvalId, confirmFixture, actors });

type RlsConfirm = ((approvalId: string) => Promise<LiveDbRlsFixtureCheck>) | undefined;

describe("ST-B RLS validation runner (RLS-01..03)", () => {
  // These two call runRlsValidation directly: a default parameter would treat
  // an explicitly injected `undefined` as "argument omitted" and quietly test
  // the happy path instead of the fail-closed one.
  it("fails closed when the actor set is missing or incomplete", async () => {
    expect(await runRlsValidation({ approvalId, confirmFixture: present, actors: undefined })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_RLS_ACTOR_NOT_INJECTED",
      caseResults: [],
    });
    expect(await run([owner()])).toMatchObject({ safeErrorCode: "LIVE_DB_RLS_ACTOR_NOT_INJECTED" });
  });

  it("rejects a duplicated actor class instead of silently collapsing actors", async () => {
    expect(await run([owner(), owner(), anon()])).toMatchObject({
      safeErrorCode: "LIVE_DB_RLS_ACTOR_CLASS_INVALID",
    });
  });

  it("requires each actor class to supply the probes its case needs", async () => {
    const withoutMutate: LiveDbRlsActor = { actorClass: "OTHER_AUTHENTICATED", read: vi.fn(async () => read.filtered) };
    expect(await run([owner(), withoutMutate, anon()])).toMatchObject({
      safeErrorCode: "LIVE_DB_RLS_PROBE_NOT_INJECTED",
    });

    const withoutRpc: LiveDbRlsActor = {
      actorClass: "ANONYMOUS",
      read: vi.fn(async () => read.filtered),
      mutate: vi.fn(async () => mutate.denied),
    };
    expect(await run([owner(), other(), withoutRpc])).toMatchObject({
      safeErrorCode: "LIVE_DB_RLS_PROBE_NOT_INJECTED",
    });
  });

  it("blocks when the fixture cannot be confirmed, so a missing row is not read as a policy failure", async () => {
    const absent = vi.fn(async (): Promise<LiveDbRlsFixtureCheck> => ({ status: "ABSENT" }));
    const actors = [owner(), other(), anon()];
    expect(await run(actors, absent)).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_RLS_FIXTURE_NOT_VISIBLE",
      caseResults: [],
    });
    // No actor probe runs once the fixture is in doubt.
    expect(actors[0].read).not.toHaveBeenCalled();
  });

  it("blocks when the fixture check itself errors", async () => {
    const errored = vi.fn(
      async (): Promise<LiveDbRlsFixtureCheck> => ({
        status: "ERRORED",
        safeErrorCode: "LIVE_DB_RLS_INFRASTRUCTURE_ERROR",
      }),
    );
    expect(await run([owner(), other(), anon()], errored)).toMatchObject({
      safeErrorCode: "LIVE_DB_RLS_INFRASTRUCTURE_ERROR",
    });
  });

  it("blocks when no fixture check is injected at all", async () => {
    const actors = [owner(), other(), anon()];
    expect(await runRlsValidation({ approvalId, confirmFixture: undefined, actors })).toMatchObject({
      safeErrorCode: "LIVE_DB_RLS_PROBE_NOT_INJECTED",
    });
    expect(actors[0].read).not.toHaveBeenCalled();
  });

  it("passes when the owner reads and every other probe is denied", async () => {
    const actors = [owner(), other(), anon()];
    const result = await run(actors);

    expect(result.status).toBe("PASSED");
    expect(result.caseResults).toEqual([
      { caseId: "rls-owner-read", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
      { caseId: "rls-cross-user-denied", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
      { caseId: "rls-anon-denied", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
    ]);
    expect(present).toHaveBeenCalledWith(approvalId);
    for (const item of actors) {
      expect(item.read).toHaveBeenCalledWith(approvalId);
    }
    expect(actors[1].mutate).toHaveBeenCalledWith(approvalId);
    expect(actors[2].rpc).toHaveBeenCalledWith(approvalId);
  });

  it("accepts a zero-change write as denial, which is how RLS refuses an UPDATE", async () => {
    const result = await run([owner(), other(read.filtered, mutate.noRowsChanged), anon()]);
    expect(result.status).toBe("PASSED");
  });

  it("does not accept a rejected SELECT as denial, because RLS filters rather than raises", async () => {
    const result = await run([owner(), other(read.permissionDenied), anon()]);
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_RLS_INFRASTRUCTURE_ERROR");
    expect(result.caseResults).toContainEqual({
      caseId: "rls-cross-user-denied",
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: "LIVE_DB_RLS_INFRASTRUCTURE_ERROR",
    });
  });

  it("does not accept an infrastructure fault on a write as denial", async () => {
    const result = await run([owner(), other(read.filtered, mutate.timedOut), anon()]);
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_RLS_INFRASTRUCTURE_ERROR");
  });

  it("does not accept an infrastructure fault on an RPC as denial", async () => {
    const result = await run([owner(), other(), anon(read.filtered, mutate.denied, rpc.errored)]);
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_RLS_INFRASTRUCTURE_ERROR");
  });

  it("fails the owner case on an errored read rather than calling it a violation", async () => {
    const result = await run([owner(read.connectionLost), other(), anon()]);
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults[0]).toMatchObject({
      caseId: "rls-owner-read",
      safeErrorCode: "LIVE_DB_RLS_INFRASTRUCTURE_ERROR",
    });
  });

  it("reports an access violation when another authenticated user can read the record", async () => {
    const result = await run([owner(), other(read.visible()), anon()]);
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_RLS_ACCESS_VIOLATION");
    expect(result.caseResults).toContainEqual({
      caseId: "rls-cross-user-denied",
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: "LIVE_DB_RLS_ACCESS_VIOLATION",
    });
  });

  it("reports an access violation when another authenticated user can write the record", async () => {
    const result = await run([owner(), other(read.filtered, mutate.applied), anon()]);
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_RLS_ACCESS_VIOLATION");
  });

  it("reports an access violation when anonymous can invoke the approval RPC", async () => {
    const result = await run([owner(), other(), anon(read.filtered, mutate.denied, rpc.invoked)]);
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults).toContainEqual({
      caseId: "rls-anon-denied",
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: "LIVE_DB_RLS_ACCESS_VIOLATION",
    });
  });

  it("reports an access violation when anonymous can write directly", async () => {
    const result = await run([owner(), other(), anon(read.filtered, mutate.applied)]);
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_RLS_ACCESS_VIOLATION");
  });

  it("fails the owner case when the owner cannot read their own record", async () => {
    const result = await run([owner(read.filtered), other(), anon()]);
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults[0]).toMatchObject({
      caseId: "rls-owner-read",
      verdict: "FAIL",
      safeErrorCode: "LIVE_DB_RLS_ACCESS_VIOLATION",
    });
  });

  it("prefers an access violation over an infrastructure fault at run level", async () => {
    const result = await run([
      owner(read.connectionLost),
      other(read.visible()),
      anon(),
    ]);
    expect(result.safeErrorCode).toBe("LIVE_DB_RLS_ACCESS_VIOLATION");
  });

  it("evaluates every actor even after one fails, and leaks nothing", async () => {
    const actors = [owner(read.filtered), other(read.visible()), anon()];
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await run(actors);

    expect(result.caseResults).toHaveLength(3);
    for (const item of actors) {
      expect(item.read).toHaveBeenCalledOnce();
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(hasStagingUnsafeValue(result)).toBe(false);
    fetchSpy.mockRestore();
  });
});
