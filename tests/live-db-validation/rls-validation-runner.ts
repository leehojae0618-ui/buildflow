import type { LiveDbCaseResult, LiveDbSafeErrorCode } from "./types";

export const liveDbRlsActorClasses = ["OWNER", "OTHER_AUTHENTICATED", "ANONYMOUS"] as const;
export type LiveDbRlsActorClass = (typeof liveDbRlsActorClasses)[number];

/**
 * Outcome of one actor's read attempt.
 *
 * `READ` means the statement completed; `rowCount` then decides the verdict.
 * This distinction matters because Postgres RLS denies a SELECT by filtering
 * rows away, not by raising an error — a denied owner-scoped read normally
 * returns `READ` with `rowCount: 0`, not `REJECTED`. Treating only `REJECTED`
 * as denial would therefore report a false access violation.
 */
export type LiveDbRlsReadOutcome =
  | { status: "READ"; rowCount: number }
  | { status: "REJECTED"; safeErrorCode: LiveDbSafeErrorCode };

export type LiveDbRlsActor = {
  actorClass: LiveDbRlsActorClass;
  /** Reads the owner's validation record under this actor's own credentials. */
  read: (approvalId: string) => Promise<LiveDbRlsReadOutcome>;
};

export type RlsValidationInput = {
  approvalId: string;
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

/** An actor is denied when the read was rejected or returned no rows. */
function isDenied(outcome: LiveDbRlsReadOutcome): boolean {
  return outcome.status === "REJECTED" || outcome.rowCount === 0;
}

function validateActors(
  actors: readonly LiveDbRlsActor[] | undefined,
): { status: "VALID" } | { status: "INVALID"; safeErrorCode: LiveDbSafeErrorCode } {
  if (!actors || actors.length !== liveDbRlsActorClasses.length) {
    return { status: "INVALID", safeErrorCode: "LIVE_DB_RLS_ACTOR_NOT_INJECTED" };
  }
  const seen = new Set<LiveDbRlsActorClass>();
  for (const actor of actors) {
    if (typeof actor?.read !== "function") {
      return { status: "INVALID", safeErrorCode: "LIVE_DB_RLS_ACTOR_NOT_INJECTED" };
    }
    if (!liveDbRlsActorClasses.includes(actor.actorClass) || seen.has(actor.actorClass)) {
      return { status: "INVALID", safeErrorCode: "LIVE_DB_RLS_ACTOR_CLASS_INVALID" };
    }
    seen.add(actor.actorClass);
  }
  return { status: "VALID" };
}

/**
 * Executes RLS-01 through RLS-03 against three explicitly separated actors.
 *
 * RLS-01  owner                 expects the owned record to be readable
 * RLS-02  other authenticated   expects denial
 * RLS-03  anonymous             expects denial
 *
 * Reads happen through each actor's injected `read`, so this function creates
 * no client, no auth user, and issues no query of its own.
 */
export async function runRlsValidation(input: RlsValidationInput): Promise<RlsValidationResult> {
  const actorCheck = validateActors(input.actors);
  if (actorCheck.status === "INVALID") {
    return { status: "BLOCKED", safeErrorCode: actorCheck.safeErrorCode, caseResults: [] };
  }
  const actors = input.actors as readonly LiveDbRlsActor[];

  const caseResults: LiveDbCaseResult[] = [];
  let violated = false;

  for (const actorClass of liveDbRlsActorClasses) {
    const actor = actors.find((item) => item.actorClass === actorClass) as LiveDbRlsActor;
    const caseId = caseIdByActor[actorClass];
    const outcome = await actor.read(input.approvalId);

    const satisfied =
      actorClass === "OWNER"
        ? outcome.status === "READ" && outcome.rowCount > 0
        : isDenied(outcome);

    if (satisfied) {
      caseResults.push({ caseId, executionStatus: "EXECUTED_PASS", verdict: "PASS" });
      continue;
    }
    violated = true;
    caseResults.push({
      caseId,
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: "LIVE_DB_RLS_ACCESS_VIOLATION",
    });
  }

  return violated
    ? { status: "BLOCKED", safeErrorCode: "LIVE_DB_RLS_ACCESS_VIOLATION", caseResults }
    : { status: "PASSED", caseResults };
}
