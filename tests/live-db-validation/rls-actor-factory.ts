import { classifyRlsError } from "./db-safe-error";
import type {
  LiveDbRlsActor,
  LiveDbRlsMutateOutcome,
  LiveDbRlsReadOutcome,
  LiveDbRlsRpcOutcome,
} from "./rls-validation-runner";
import type { LiveDbCountOutcome } from "./schema-verification";
import { LIVE_DB_CLIENT_MODE, type LiveDbClientIdentity, type LiveDbSafeErrorCode } from "./types";

/**
 * The structural subset of a Supabase client an RLS actor drives. Kept minimal
 * so an actor can be exercised by a small fake, and so nothing here depends on
 * the SDK surface beyond what a probe actually calls.
 */
export type LiveDbActorClient = {
  from(table: string): {
    select(columns: string, options: { head: true; count: "exact" }): {
      eq(column: string, value: string): PromiseLike<LiveDbCountOutcome>;
    };
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): PromiseLike<{ error: unknown; count?: number | null }>;
    };
  };
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ error: unknown; data: unknown }>;
};

export type LiveDbAuthClient = LiveDbActorClient & {
  auth: {
    signInWithPassword(credentials: { email: string; password: string }): PromiseLike<{
      error: unknown;
    }>;
  };
};

export type LiveDbActorCredentials = { email: string; password: string };

export type RlsActorSetInput = {
  /** Signed-in client for the approval owner. */
  ownerClient: LiveDbAuthClient | undefined;
  owner: LiveDbActorCredentials | undefined;
  /** Signed-in client for a different authenticated user. */
  otherClient: LiveDbAuthClient | undefined;
  other: LiveDbActorCredentials | undefined;
  /** Anon-key client with no session established. */
  anonClient: LiveDbActorClient | undefined;
};

export type RlsActorSetResult =
  | { status: "READY"; actors: readonly LiveDbRlsActor[]; identity: LiveDbClientIdentity }
  | { status: "BLOCKED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * The identity these actors are built with.
 *
 * It is an attestation, not a proof. This module constructs the probes from
 * clients it is handed, and records that no application, admin or server
 * factory was involved — but a caller could still hand it a client built some
 * other way. The approval repository avoids this by being constructed from the
 * guarded environment directly; actors cannot be, because building them would
 * mean owning owner/other/anon session creation.
 */
const attestedIdentity = (): LiveDbClientIdentity => ({
  supabaseClientMode: LIVE_DB_CLIENT_MODE,
  appClientFactoryUsed: false,
  adminClientFactoryUsed: false,
  serverClientFactoryUsed: false,
});

/** RLS-01/02/03 SELECT: the owner's row, read under the actor's own credentials. */
function readProbe(client: LiveDbActorClient) {
  return async (approvalId: string): Promise<LiveDbRlsReadOutcome> => {
    let outcome: LiveDbCountOutcome;
    try {
      outcome = await client
        .from("runtime_approval_requests")
        .select("*", { head: true, count: "exact" })
        .eq("id", approvalId);
    } catch (error) {
      return { status: "REJECTED", safeErrorCode: classifyRlsError(error) };
    }
    if (outcome.error) {
      return { status: "REJECTED", safeErrorCode: classifyRlsError(outcome.error) };
    }
    return { status: "READ", rowCount: outcome.count ?? 0 };
  };
}

/**
 * RLS-02/03 direct write. Targets `status`, which is not one of the columns the
 * immutability trigger protects, so a refusal here is attributable to the row
 * -level policy rather than to the trigger firing for an unrelated reason.
 */
function mutateProbe(client: LiveDbActorClient) {
  return async (approvalId: string): Promise<LiveDbRlsMutateOutcome> => {
    let error: unknown;
    let count: number | null | undefined;
    try {
      ({ error, count } = await client
        .from("runtime_approval_requests")
        .update({ status: "CONSUMED" })
        .eq("id", approvalId));
    } catch (thrown) {
      return { status: "REJECTED", safeErrorCode: classifyRlsError(thrown) };
    }
    if (error) return { status: "REJECTED", safeErrorCode: classifyRlsError(error) };
    // A policy that filters rather than raises leaves the statement successful
    // and the row untouched, which the runner reads as denial.
    return { status: "APPLIED", changedRowCount: count ?? 0 };
  };
}

/** RLS-03 direct RPC. The approval functions are granted to service_role only. */
function rpcProbe(client: LiveDbActorClient) {
  return async (approvalId: string): Promise<LiveDbRlsRpcOutcome> => {
    let error: unknown;
    try {
      ({ error } = await client.rpc("decide_runtime_approval_request", {
        p_approval_id: approvalId,
        p_project_id: "00000000-0000-4000-8000-000000000000",
        p_user_id: "00000000-0000-4000-8000-000000000000",
        p_decision: "APPROVE",
      }));
    } catch (thrown) {
      return { status: "REJECTED", safeErrorCode: classifyRlsError(thrown) };
    }
    // Reaching the function body at all is the violation: an unprivileged role
    // should not get past the EXECUTE grant, whatever the function then decides.
    return error
      ? { status: "REJECTED", safeErrorCode: classifyRlsError(error) }
      : { status: "INVOKED" };
  };
}

async function signIn(
  client: LiveDbAuthClient,
  credentials: LiveDbActorCredentials,
): Promise<boolean> {
  try {
    const { error } = await client.auth.signInWithPassword(credentials);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Builds the three RLS actors, establishing a session for the two
 * authenticated ones.
 *
 * Sign-in uses pre-existing staging users: creating users is not in this
 * boundary's authority, so absent or wrong credentials block rather than
 * provision anything. The anon actor deliberately gets no session — an
 * anon-key client with a session is simply another authenticated user and would
 * make RLS-03 prove nothing.
 */
export async function createRlsActorSet(input: RlsActorSetInput): Promise<RlsActorSetResult> {
  const { ownerClient, otherClient, anonClient, owner, other } = input;
  if (!ownerClient || !otherClient || !anonClient) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED" };
  }
  if (!owner?.email?.trim() || !owner.password || !other?.email?.trim() || !other.password) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_RLS_CREDENTIALS_MISSING" };
  }
  if (owner.email.trim().toLowerCase() === other.email.trim().toLowerCase()) {
    // Two sessions for the same user would make RLS-02 a second owner read.
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_RLS_ACTOR_CLASS_INVALID" };
  }

  if (!(await signIn(ownerClient, owner)) || !(await signIn(otherClient, other))) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_RLS_CREDENTIALS_MISSING" };
  }

  return {
    status: "READY",
    identity: attestedIdentity(),
    actors: [
      { actorClass: "OWNER", read: readProbe(ownerClient) },
      {
        actorClass: "OTHER_AUTHENTICATED",
        read: readProbe(otherClient),
        mutate: mutateProbe(otherClient),
      },
      {
        actorClass: "ANONYMOUS",
        read: readProbe(anonClient),
        mutate: mutateProbe(anonClient),
        rpc: rpcProbe(anonClient),
      },
    ],
  };
}
