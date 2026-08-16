import type { LiveDbSafeErrorCode } from "./types";

/**
 * Postgres/PostgREST error codes that mean "the database refused this on
 * authorization grounds", split by which safe code they map to.
 *
 * `42501` is `insufficient_privilege`. Postgres raises it both for a missing
 * GRANT (an anon client calling a service-role-only function) and for an INSERT
 * that a row-level policy rejects, so the code alone cannot tell the two apart —
 * `policyViolationMarkers` below does that, on the message, without the message
 * ever leaving this module.
 */
const authorizationCodes = new Set(["42501", "PGRST301", "PGRST302"]);

/** Codes that prove the object itself is missing rather than protected. */
const missingObjectCodes = new Set(["42P01", "42883", "PGRST202", "PGRST205"]);

/**
 * Substrings that identify a row-level-security refusal specifically. Matched
 * case-insensitively against the driver message and then discarded: the message
 * is never returned, stored, or logged, because raw database errors are
 * prohibited in Evidence.
 */
const policyViolationMarkers = ["row-level security", "row level security"];

export type DbErrorLike = {
  code?: unknown;
  message?: unknown;
};

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

/** Extracts the driver's error code without assuming a shape. */
function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  return asString((error as DbErrorLike).code).trim();
}

function errorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  return asString((error as DbErrorLike).message);
}

/**
 * Classifies a database error into the harness's safe vocabulary.
 *
 * Only an authorization-class refusal can ever be read as a policy holding.
 * Everything else — connection resets, timeouts, unknown driver faults, an
 * error object of an unexpected shape — becomes
 * `LIVE_DB_RLS_INFRASTRUCTURE_ERROR`, which the RLS runner treats as a failure
 * rather than as denial. Nothing derived from the message is returned.
 */
export function classifyRlsError(error: unknown): LiveDbSafeErrorCode {
  const code = errorCode(error);
  if (!authorizationCodes.has(code)) return "LIVE_DB_RLS_INFRASTRUCTURE_ERROR";

  const message = errorMessage(error).toLowerCase();
  return policyViolationMarkers.some((marker) => message.includes(marker))
    ? "LIVE_DB_RLS_POLICY_VIOLATION"
    : "LIVE_DB_RLS_PERMISSION_DENIED";
}

/**
 * True when the error says the table or function does not exist, which is how
 * MIG-01 distinguishes "the migration did not create this object" from "the
 * object exists and refused this particular call".
 */
export function isMissingObjectError(error: unknown): boolean {
  return missingObjectCodes.has(errorCode(error));
}

/**
 * True when an error came from the RPC body rather than from the RPC being
 * absent. A `RAISE` inside a plpgsql function surfaces as `P0001`, so an
 * approval function that refuses a probe proves it was there to refuse it.
 */
export function isFunctionRaisedError(error: unknown): boolean {
  return errorCode(error) === "P0001";
}
