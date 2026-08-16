import { describe, expect, it, vi } from "vitest";

import {
  createRlsActorSet,
  type LiveDbActorClient,
  type LiveDbAuthClient,
} from "./rls-actor-factory";
import { runRlsValidation, type LiveDbRlsFixtureCheck } from "./rls-validation-runner";
import { hasStagingUnsafeValue } from "./staging-evidence";

const permissionDenied = { code: "42501", message: "permission denied for function" };
const policyViolation = {
  code: "42501",
  message: 'new row violates row-level security policy for table "runtime_approval_requests"',
};
const connectionLost = { code: "08006", message: "connection failure" };

type ClientBehaviour = {
  selectCount?: number;
  selectError?: unknown;
  updateError?: unknown;
  updateCount?: number;
  rpcError?: unknown;
  signInError?: unknown;
};

const makeClient = (behaviour: ClientBehaviour = {}) => {
  const client = {
    from: () => ({
      select: () => ({
        eq: async () => ({
          error: behaviour.selectError ?? null,
          count: behaviour.selectCount ?? 0,
        }),
      }),
      update: () => ({
        eq: async () => ({ error: behaviour.updateError ?? null, count: behaviour.updateCount ?? 0 }),
      }),
    }),
    rpc: async () => ({ error: behaviour.rpcError ?? permissionDenied, data: null }),
    auth: {
      signInWithPassword: vi.fn(async () => ({ error: behaviour.signInError ?? null })),
    },
  };
  return client as unknown as LiveDbAuthClient & { auth: { signInWithPassword: ReturnType<typeof vi.fn> } };
};

const owner = { email: "owner@example.test", password: "owner-pw" };
const other = { email: "other@example.test", password: "other-pw" };

const build = (
  clients: {
    ownerClient?: LiveDbAuthClient;
    otherClient?: LiveDbAuthClient;
    anonClient?: LiveDbActorClient;
  } = {},
  credentials: { owner?: typeof owner; other?: typeof other } = {},
) =>
  // `in` rather than `??` throughout: an explicit `undefined` is the
  // not-injected case these checks exist for, and `??` would replace it with a
  // working default.
  createRlsActorSet({
    ownerClient: "ownerClient" in clients ? clients.ownerClient : makeClient({ selectCount: 1 }),
    otherClient:
      "otherClient" in clients ? clients.otherClient : makeClient({ selectCount: 0, updateCount: 0 }),
    anonClient:
      "anonClient" in clients
        ? clients.anonClient
        : makeClient({ selectCount: 0, updateError: policyViolation }),
    owner: "owner" in credentials ? credentials.owner : owner,
    other: "other" in credentials ? credentials.other : other,
  });

describe("createRlsActorSet", () => {
  it("fails closed when any client is missing", async () => {
    expect(await build({ anonClient: undefined })).toMatchObject({
      safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED",
    });
  });

  it("fails closed when credentials are absent", async () => {
    expect(await build({}, { owner: undefined })).toMatchObject({
      safeErrorCode: "LIVE_DB_RLS_CREDENTIALS_MISSING",
    });
    expect(
      await build({}, { other: { email: "  ", password: "" } as typeof other }),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_RLS_CREDENTIALS_MISSING" });
  });

  it("refuses two sessions for the same user, which would make RLS-02 a second owner read", async () => {
    expect(await build({}, { other: { ...owner } })).toMatchObject({
      safeErrorCode: "LIVE_DB_RLS_ACTOR_CLASS_INVALID",
    });
  });

  it("blocks when sign-in fails rather than provisioning a user", async () => {
    expect(await build({ otherClient: makeClient({ signInError: { message: "bad" } }) })).toMatchObject(
      { safeErrorCode: "LIVE_DB_RLS_CREDENTIALS_MISSING" },
    );
  });

  it("signs in the two authenticated actors and leaves anon without a session", async () => {
    const ownerClient = makeClient({ selectCount: 1 });
    const otherClient = makeClient({ selectCount: 0, updateCount: 0 });
    const anonClient = makeClient({ selectCount: 0, updateError: policyViolation });

    const result = await build({ ownerClient, otherClient, anonClient });

    expect(result.status).toBe("READY");
    expect(ownerClient.auth.signInWithPassword).toHaveBeenCalledWith(owner);
    expect(otherClient.auth.signInWithPassword).toHaveBeenCalledWith(other);
    expect(anonClient.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("attests an explicit client identity without claiming it is proven", async () => {
    const result = await build();
    expect(result.status === "READY" && result.identity).toEqual({
      supabaseClientMode: "LIVE_DB_EXPLICIT_INJECTION",
      appClientFactoryUsed: false,
      adminClientFactoryUsed: false,
      serverClientFactoryUsed: false,
    });
  });

  it("supplies exactly the probes each actor class needs", async () => {
    const result = await build();
    if (result.status !== "READY") throw new Error("expected READY");
    const byClass = Object.fromEntries(result.actors.map((actor) => [actor.actorClass, actor]));
    expect(typeof byClass.OWNER.read).toBe("function");
    expect(byClass.OWNER.mutate).toBeUndefined();
    expect(typeof byClass.OTHER_AUTHENTICATED.mutate).toBe("function");
    expect(byClass.OTHER_AUTHENTICATED.rpc).toBeUndefined();
    expect(typeof byClass.ANONYMOUS.rpc).toBe("function");
  });
});

describe("actor probes against the strict RLS runner", () => {
  const confirmFixture = async (): Promise<LiveDbRlsFixtureCheck> => ({ status: "PRESENT" });

  it("passes a correctly configured database end to end", async () => {
    const result = await build();
    if (result.status !== "READY") throw new Error("expected READY");

    const validation = await runRlsValidation({
      approvalId: "approval-1",
      confirmFixture,
      actors: result.actors,
    });
    expect(validation.status).toBe("PASSED");
  });

  it("maps a permission-denied RPC to denial, which is what anon must get", async () => {
    const result = await build({
      anonClient: makeClient({ selectCount: 0, updateError: policyViolation, rpcError: permissionDenied }),
    });
    if (result.status !== "READY") throw new Error("expected READY");
    const anon = result.actors.find((actor) => actor.actorClass === "ANONYMOUS");
    expect(await anon?.rpc?.("approval-1")).toEqual({
      status: "REJECTED",
      safeErrorCode: "LIVE_DB_RLS_PERMISSION_DENIED",
    });
  });

  it("does not let a connection fault masquerade as a policy holding", async () => {
    const result = await build({
      anonClient: makeClient({ selectCount: 0, updateError: connectionLost, rpcError: connectionLost }),
    });
    if (result.status !== "READY") throw new Error("expected READY");

    const validation = await runRlsValidation({
      approvalId: "approval-1",
      confirmFixture,
      actors: result.actors,
    });
    expect(validation.status).toBe("BLOCKED");
    expect(validation.safeErrorCode).toBe("LIVE_DB_RLS_INFRASTRUCTURE_ERROR");
  });

  it("reports an access violation when anon can actually write", async () => {
    const result = await build({
      anonClient: makeClient({ selectCount: 0, updateCount: 1 }),
    });
    if (result.status !== "READY") throw new Error("expected READY");

    const validation = await runRlsValidation({
      approvalId: "approval-1",
      confirmFixture,
      actors: result.actors,
    });
    expect(validation.status).toBe("BLOCKED");
    expect(validation.safeErrorCode).toBe("LIVE_DB_RLS_ACCESS_VIOLATION");
  });

  it("emits no raw database message through any probe", async () => {
    const leaky = {
      code: "42501",
      message: "permission denied; postgresql://postgres:pw@db.stagingabc.supabase.co:5432/postgres",
    };
    const result = await build({
      anonClient: makeClient({ selectCount: 0, updateError: leaky, rpcError: leaky }),
    });
    if (result.status !== "READY") throw new Error("expected READY");
    const anon = result.actors.find((actor) => actor.actorClass === "ANONYMOUS");
    expect(hasStagingUnsafeValue(await anon?.mutate?.("approval-1"))).toBe(false);
    expect(hasStagingUnsafeValue(await anon?.rpc?.("approval-1"))).toBe(false);
  });
});
