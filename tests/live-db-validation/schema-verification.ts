import { isFunctionRaisedError, isMissingObjectError } from "./db-safe-error";
import type { LiveDbSafeErrorCode } from "./types";

/**
 * The structural subset of a Supabase client this module needs. Declared here
 * rather than imported so the verification logic can be driven by a small fake,
 * and so nothing in this file depends on the SDK's full surface.
 */
export type LiveDbCountOutcome = { error: unknown; count: number | null };

/** Chainable and awaitable, matching how PostgREST builders behave. */
export type LiveDbCountQuery = PromiseLike<LiveDbCountOutcome> & {
  eq(column: string, value: string): PromiseLike<LiveDbCountOutcome>;
};

export type LiveDbSchemaClient = {
  from(table: string): {
    select(columns: string, options: { head: true; count: "exact" }): LiveDbCountQuery;
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): PromiseLike<{ error: unknown }>;
    };
  };
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ error: unknown; data: unknown }>;
};

export const requiredTables = [
  "runtime_approval_requests",
  "runtime_approval_events",
  "runtime_evidence_records",
] as const;

export const requiredFunctions = [
  "create_runtime_approval_request",
  "decide_runtime_approval_request",
  "consume_runtime_approval_request",
] as const;

/** A uuid that cannot match a real row, used to make every probe a no-op. */
const ABSENT_UUID = "00000000-0000-4000-8000-000000000000";
const PLACEHOLDER_CHECKSUM = "0".repeat(64);

/**
 * Arguments that reach each function's first guard and stop there.
 *
 * `create_runtime_approval_request` checks `auth.role()` and then project
 * ownership before it inserts, so an absent project id makes the call raise
 * without writing a row. The two others resolve their approval id first and
 * raise `RUNTIME_APPROVAL_NOT_FOUND`. Every parameter is supplied because
 * PostgREST resolves an overload by its full argument list — omitting one
 * reports the function as missing rather than probing it.
 */
const functionProbeArgs: Record<(typeof requiredFunctions)[number], Record<string, unknown>> = {
  create_runtime_approval_request: {
    p_project_id: ABSENT_UUID,
    p_user_id: ABSENT_UUID,
    p_scope: "CORE_RUNTIME_PROVIDER_EXECUTION",
    p_runtime_execution_request_id: "schema-probe",
    p_runtime_execution_request_checksum: PLACEHOLDER_CHECKSUM,
    p_runtime_plan_id: "schema-probe",
    p_runtime_plan_checksum: PLACEHOLDER_CHECKSUM,
    p_provider: "openai",
    p_model: "schema-probe",
    p_safe_input_checksum: PLACEHOLDER_CHECKSUM,
    p_binding_checksum: PLACEHOLDER_CHECKSUM,
  },
  decide_runtime_approval_request: {
    p_approval_id: ABSENT_UUID,
    p_project_id: ABSENT_UUID,
    p_user_id: ABSENT_UUID,
    p_decision: "APPROVE",
  },
  consume_runtime_approval_request: {
    p_approval_id: ABSENT_UUID,
    p_project_id: ABSENT_UUID,
    p_user_id: ABSENT_UUID,
    p_scope: "CORE_RUNTIME_PROVIDER_EXECUTION",
    p_runtime_execution_request_id: "schema-probe",
    p_runtime_execution_request_checksum: PLACEHOLDER_CHECKSUM,
    p_runtime_plan_id: "schema-probe",
    p_runtime_plan_checksum: PLACEHOLDER_CHECKSUM,
    p_provider: "openai",
    p_model: "schema-probe",
    p_safe_input_checksum: PLACEHOLDER_CHECKSUM,
    p_binding_checksum: PLACEHOLDER_CHECKSUM,
  },
};

export type SchemaVerificationResult =
  | { status: "VERIFIED"; tableCount: number; functionCount: number }
  | { status: "BLOCKED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * MIG-01, structural half: every table and RPC the migration is supposed to
 * create is reachable.
 *
 * Tables are probed with a head-only count, and functions with arguments that
 * hit their first guard, so this writes nothing. A function that answers with a
 * plpgsql `RAISE` has demonstrably executed — that is the proof it exists,
 * since a missing function reports `42883`/`PGRST202` instead.
 *
 * Policies are not inspected here: they live in `pg_catalog`, which PostgREST
 * does not expose, and no Postgres driver is available to this harness. They
 * are proven behaviourally by RLS-01 through RLS-03 instead, and the immutable
 * -binding trigger by `verifyImmutabilityTrigger` below.
 */
export async function verifyStagingSchema(
  client: LiveDbSchemaClient | undefined,
): Promise<SchemaVerificationResult> {
  if (!client) return { status: "BLOCKED", safeErrorCode: "LIVE_DB_COUNTER_NOT_INJECTED" };

  for (const table of requiredTables) {
    let error: unknown;
    try {
      ({ error } = await client.from(table).select("*", { head: true, count: "exact" }));
    } catch {
      return { status: "BLOCKED", safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" };
    }
    if (error) {
      return {
        status: "BLOCKED",
        safeErrorCode: isMissingObjectError(error)
          ? "LIVE_DB_SCHEMA_OBJECT_MISSING"
          : "LIVE_DB_SCHEMA_VERIFICATION_FAILED",
      };
    }
  }

  for (const fn of requiredFunctions) {
    let error: unknown;
    try {
      ({ error } = await client.rpc(fn, functionProbeArgs[fn]));
    } catch {
      return { status: "BLOCKED", safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" };
    }
    if (!error) {
      // The probe was built to be refused. A success means the function is not
      // the one this migration defines.
      return { status: "BLOCKED", safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" };
    }
    if (isMissingObjectError(error)) {
      return { status: "BLOCKED", safeErrorCode: "LIVE_DB_SCHEMA_OBJECT_MISSING" };
    }
    if (!isFunctionRaisedError(error)) {
      return { status: "BLOCKED", safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" };
    }
  }

  return {
    status: "VERIFIED",
    tableCount: requiredTables.length,
    functionCount: requiredFunctions.length,
  };
}

export type TriggerVerificationResult =
  | { status: "VERIFIED" }
  | { status: "BLOCKED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * MIG-01, behavioural half: the immutable-binding trigger is attached and fires.
 *
 * It needs an existing row because the trigger is `BEFORE UPDATE FOR EACH ROW` —
 * an update matching nothing never reaches it. The probe sets `expires_at` to a
 * value the trigger must reject, so a correctly migrated database refuses it and
 * the row is left exactly as it was. An update that *succeeds* means the trigger
 * is missing, which is a partial migration and blocks the gate.
 */
export async function verifyImmutabilityTrigger(
  client: LiveDbSchemaClient | undefined,
  approvalId: string,
): Promise<TriggerVerificationResult> {
  if (!client) return { status: "BLOCKED", safeErrorCode: "LIVE_DB_COUNTER_NOT_INJECTED" };

  let error: unknown;
  try {
    ({ error } = await client
      .from("runtime_approval_requests")
      // A fixed past instant: it cannot equal a live row's TTL, so the trigger's
      // "is distinct from" test always sees a change and must raise.
      .update({ expires_at: "2000-01-01T00:00:00.000Z" })
      .eq("id", approvalId));
  } catch {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" };
  }

  if (!error) return { status: "BLOCKED", safeErrorCode: "LIVE_DB_IMMUTABILITY_TRIGGER_MISSING" };
  return isFunctionRaisedError(error)
    ? { status: "VERIFIED" }
    : { status: "BLOCKED", safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" };
}
