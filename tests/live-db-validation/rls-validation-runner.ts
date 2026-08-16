import type { LiveDbCaseResult, LiveDbSafeErrorCode } from "./types";

export const liveDbRlsActorClasses = ["OWNER", "OTHER_AUTHENTICATED", "ANONYMOUS"] as const;
export type LiveDbRlsActorClass = (typeof liveDbRlsActorClasses)[number];

export const liveDbRlsProbes = ["read", "mutate", "rpc"] as const;
export type LiveDbRlsProbe = (typeof liveDbRlsProbes)[number];

/**
 * The only safe error codes that count as the database refusing an actor on
 * authorization grounds.
 *
 * Kept to codes the harness's own adapters are contracted to emit — Postgres
 * `42501 permission denied` and `new row violates row-level security policy`.
 * Every other rejection (connection reset, timeout, unknown driver error, a
 * persistence fallback) is an infrastructure fault, and an infrastructure fault
 * must never be mistaken for proof that a policy held.
 */
export const rlsAuthorizationDenialCodes: readonly LiveDbSafeErrorCode[] = [
  "LIVE_DB_RLS_PERMISSION_DENIED",
  "LIVE_DB_RLS_POLICY_VIOLATION",
];

/**
 * Outcome of one actor's SELECT.
 *
 * `READ` means the statement completed; `rowCount` then decides the verdict.
 * Postgres denies a SELECT by filtering rows away rather than by raising, so a
 * denied non-owner read is `READ` with `rowCount: 0`. A rejected SELECT is
 * therefore *not* evidence of a policy: it is treated as an infrastructure
 * fault and fails.
 */
export type LiveDbRlsReadOutcome =
  | { status: "READ"; rowCount: number }
  | { status: "REJECTED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * Outcome of one actor's direct write against the owner's row.
 *
 * Unlike SELECT, a denied INSERT raises, while a denied UPDATE or DELETE simply
 * matches no rows. Both shapes count as denial: an authorization-class
 * rejection, or a completed statement that changed nothing.
 */
export type LiveDbRlsMutateOutcome =
  | { status: "APPLIED"; changedRowCount: number }
  | { status: "REJECTED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * Outcome of one actor's RPC attempt. The runtime approval functions are
 * revoked from `public`, `anon` and `authenticated` and granted only to
 * `service_role`, so any successful invocation at all is a violation.
 */
export type LiveDbRlsRpcOutcome =
  | { status: "INVOKED" }
  | { status: "REJECTED"; safeErrorCode: LiveDbSafeErrorCode };

export type LiveDbRlsActor = {
  actorClass: LiveDbRlsActorClass;
  /** Reads the owner's validation record under this actor's own credentials. */
  read: (approvalId: string) => Promise<LiveDbRlsReadOutcome>;
  /** Attempts a direct write against the owner's row. */
  mutate?: (approvalId: string) => Promise<LiveDbRlsMutateOutcome>;
  /** Attempts a runtime-approval RPC against the owner's row. */
  rpc?: (approvalId: string) => Promise<LiveDbRlsRpcOutcome>;
};

/**
 * Probes each actor class must supply, mirroring the plan matrix: RLS-01 owner
 * `select`, RLS-02 other authenticated `select/mutate`, RLS-03 anon
 * `select/direct write/RPC`.
 */
export const requiredProbesByActorClass: Record<LiveDbRlsActorClass, readonly LiveDbRlsProbe[]> = {
  OWNER: ["read"],
  OTHER_AUTHENTICATED: ["read", "mutate"],
  ANONYMOUS: ["read", "mutate", "rpc"],
};

/**
 * Independent confirmation that the fixture row exists, taken with credentials
 * that bypass RLS. Without it, an owner reading zero rows is ambiguous between
 * "the policy is broken" and "there was never a row", and the run would report
 * a policy failure for missing test data.
 */
export type LiveDbRlsFixtureCheck =
  | { status: "PRESENT" }
  | { status: "ABSENT" }
  | { status: "ERRORED"; safeErrorCode: LiveDbSafeErrorCode };

export type RlsValidationInput = {
  approvalId: string;
  /** Service-role existence check, run before any actor probe. */
  confirmFixture: ((approvalId: string) => Promise<LiveDbRlsFixtureCheck>) | undefined;
  /** All three actor classes must be supplied explicitly and be distinct. */
  actors: readonly LiveDbRlsActor[] | undefined;
};

export type RlsValidationResult = {
  status: "PASSED" | "BLOCKED";
  safeErrorCode?: LiveDbSafeErrorCode;
  caseResults: readonly LiveDbCaseResult[];
};

const caseIdByActor: Record<LiveDbRlsActorClass, string> = {
  OWNER: "rls-owner-read",
  OTHER_AUTHENTICATED: "rls-cross-user-denied",
  ANONYMOUS: "rls-anon-denied",
};

/**
 * Verdict for a single probe. `SATISFIED` means the probe produced what its
 * case requires — a readable row for the owner, a denial for everyone else.
 * Infrastructure faults are kept as their own value so they can never be
 * counted as a policy holding.
 */
type ProbeVerdict = "SATISFIED" | "VIOLATION" | "INFRASTRUCTURE_ERROR";

const isAuthorizationDenial = (safeErrorCode: LiveDbSafeErrorCode): boolean =>
  rlsAuthorizationDenialCodes.includes(safeErrorCode);

/** RLS-01: the owner must actually see the row. */
function ownerReadVerdict(outcome: LiveDbRlsReadOutcome): ProbeVerdict {
  if (outcome.status === "REJECTED") return "INFRASTRUCTURE_ERROR";
  return outcome.rowCount > 0 ? "SATISFIED" : "VIOLATION";
}

/** RLS-02/03 SELECT: denial is a filtered read, never a raised error. */
function deniedReadVerdict(outcome: LiveDbRlsReadOutcome): ProbeVerdict {
  if (outcome.status === "REJECTED") return "INFRASTRUCTURE_ERROR";
  return outcome.rowCount === 0 ? "SATISFIED" : "VIOLATION";
}

function deniedMutateVerdict(outcome: LiveDbRlsMutateOutcome): ProbeVerdict {
  if (outcome.status === "REJECTED") {
    return isAuthorizationDenial(outcome.safeErrorCode) ? "SATISFIED" : "INFRASTRUCTURE_ERROR";
  }
  return outcome.changedRowCount === 0 ? "SATISFIED" : "VIOLATION";
}

function deniedRpcVerdict(outcome: LiveDbRlsRpcOutcome): ProbeVerdict {
  if (outcome.status === "INVOKED") return "VIOLATION";
  return isAuthorizationDenial(outcome.safeErrorCode) ? "SATISFIED" : "INFRASTRUCTURE_ERROR";
}

function validateActors(
  actors: readonly LiveDbRlsActor[] | undefined,
): { status: "VALID" } | { status: "INVALID"; safeErrorCode: LiveDbSafeErrorCode } {
  if (!actors || actors.length !== liveDbRlsActorClasses.length) {
    return { status: "INVALID", safeErrorCode: "LIVE_DB_RLS_ACTOR_NOT_INJECTED" };
  }
  const seen = new Set<LiveDbRlsActorClass>();
  for (const actor of actors) {
    if (!actor || !liveDbRlsActorClasses.includes(actor.actorClass) || seen.has(actor.actorClass)) {
      return { status: "INVALID", safeErrorCode: "LIVE_DB_RLS_ACTOR_CLASS_INVALID" };
    }
    seen.add(actor.actorClass);
    for (const probe of requiredProbesByActorClass[actor.actorClass]) {
      if (typeof actor[probe] !== "function") {
        return { status: "INVALID", safeErrorCode: "LIVE_DB_RLS_PROBE_NOT_INJECTED" };
      }
    }
  }
  return { status: "VALID" };
}

/** Runs one actor's required probes and reduces them to a single case verdict. */
async function runActorProbes(
  actor: LiveDbRlsActor,
  approvalId: string,
): Promise<{ verdict: ProbeVerdict }> {
  const isOwner = actor.actorClass === "OWNER";
  let worst: ProbeVerdict = "SATISFIED";
  const record = (verdict: ProbeVerdict) => {
    // A violation outranks an infrastructure fault: if any probe got through,
    // that is the finding worth reporting.
    if (verdict === "VIOLATION") worst = "VIOLATION";
    else if (verdict === "INFRASTRUCTURE_ERROR" && worst !== "VIOLATION") worst = verdict;
  };

  for (const probe of requiredProbesByActorClass[actor.actorClass]) {
    if (probe === "read") {
      const outcome = await actor.read(approvalId);
      record(isOwner ? ownerReadVerdict(outcome) : deniedReadVerdict(outcome));
      continue;
    }
    if (probe === "mutate") {
      const mutate = actor.mutate as NonNullable<LiveDbRlsActor["mutate"]>;
      record(deniedMutateVerdict(await mutate(approvalId)));
      continue;
    }
    const rpc = actor.rpc as NonNullable<LiveDbRlsActor["rpc"]>;
    record(deniedRpcVerdict(await rpc(approvalId)));
  }
  return { verdict: worst };
}

/**
 * Executes RLS-01 through RLS-03 against three explicitly separated actors.
 *
 * RLS-01  owner                 select owned records, expects them readable
 * RLS-02  other authenticated   select + direct write, expects denial
 * RLS-03  anonymous             select + direct write + RPC, expects denial
 *
 * Denial is fail-closed: only a filtered SELECT, a zero-change write, or an
 * authorization-class rejection prove a policy. Connection faults, timeouts and
 * unknown errors fail the case instead of passing it.
 *
 * Probes happen through each actor's injected functions, so this function
 * creates no client, no auth user, and issues no query of its own.
 */
export async function runRlsValidation(input: RlsValidationInput): Promise<RlsValidationResult> {
  const actorCheck = validateActors(input.actors);
  if (actorCheck.status === "INVALID") {
    return { status: "BLOCKED", safeErrorCode: actorCheck.safeErrorCode, caseResults: [] };
  }
  const actors = input.actors as readonly LiveDbRlsActor[];

  if (typeof input.confirmFixture !== "function") {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_RLS_PROBE_NOT_INJECTED", caseResults: [] };
  }
  const fixture = await input.confirmFixture(input.approvalId);
  if (fixture.status !== "PRESENT") {
    return {
      status: "BLOCKED",
      safeErrorCode:
        fixture.status === "ABSENT" ? "LIVE_DB_RLS_FIXTURE_NOT_VISIBLE" : fixture.safeErrorCode,
      caseResults: [],
    };
  }

  const caseResults: LiveDbCaseResult[] = [];
  let blockingCode: LiveDbSafeErrorCode | undefined;

  for (const actorClass of liveDbRlsActorClasses) {
    const actor = actors.find((item) => item.actorClass === actorClass) as LiveDbRlsActor;
    const caseId = caseIdByActor[actorClass];
    const { verdict } = await runActorProbes(actor, input.approvalId);

    if (verdict === "SATISFIED") {
      caseResults.push({ caseId, executionStatus: "EXECUTED_PASS", verdict: "PASS" });
      continue;
    }
    const safeErrorCode: LiveDbSafeErrorCode =
      verdict === "VIOLATION" ? "LIVE_DB_RLS_ACCESS_VIOLATION" : "LIVE_DB_RLS_INFRASTRUCTURE_ERROR";
    // An access violation is the more serious finding, so it wins the run-level
    // code even if an infrastructure fault was recorded first.
    if (!blockingCode || safeErrorCode === "LIVE_DB_RLS_ACCESS_VIOLATION") {
      blockingCode = safeErrorCode;
    }
    caseResults.push({ caseId, executionStatus: "EXECUTED_FAIL", verdict: "FAIL", safeErrorCode });
  }

  return blockingCode
    ? { status: "BLOCKED", safeErrorCode: blockingCode, caseResults }
    : { status: "PASSED", caseResults };
}
