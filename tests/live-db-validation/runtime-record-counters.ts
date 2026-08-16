import type { LiveDbSchemaClient } from "./schema-verification";
import type { LiveDbSafeErrorCode } from "./types";

/**
 * Counts the rows the validation matrix expects alongside each approval case.
 *
 * `LOCAL_VALIDATION_PLAN.md`'s matrix asks for more than a safe RPC result: one
 * `CREATED` event for APR-01, one matching event for each APR-02 transition, one
 * `CONSUMED` for APR-03, and zero Runtime Evidence rows throughout ST-B. The
 * `RuntimeApprovalRepository` port exposes no event access at all, so these
 * counts need their own read-only boundary.
 *
 * It only ever asks for counts. No row content is read, so nothing here can
 * carry a payload into Evidence.
 */
export type LiveDbRecordCounter = {
  countApprovalEvents: (approvalId: string) => Promise<CountResult>;
  countRuntimeEvidence: () => Promise<CountResult>;
};

export type CountResult =
  | { status: "COUNTED"; count: number }
  | { status: "ERRORED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * Builds the counter over a service-role client. Service role bypasses RLS, so
 * a zero here means the row genuinely is not there rather than that the reader
 * could not see it — which is the whole point for the "evidence 0" assertion.
 */
export function createLiveDbRecordCounter(client: LiveDbSchemaClient): LiveDbRecordCounter {
  const count = async (
    run: () => PromiseLike<{ error: unknown; count: number | null }>,
  ): Promise<CountResult> => {
    let error: unknown;
    let value: number | null;
    try {
      ({ error, count: value } = await run());
    } catch {
      return { status: "ERRORED", safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" };
    }
    if (error || value === null) {
      return { status: "ERRORED", safeErrorCode: "LIVE_DB_SCHEMA_VERIFICATION_FAILED" };
    }
    return { status: "COUNTED", count: value };
  };

  return {
    countApprovalEvents: (approvalId) =>
      count(() =>
        client
          .from("runtime_approval_events")
          .select("*", { head: true, count: "exact" })
          .eq("approval_id", approvalId),
      ),
    countRuntimeEvidence: () =>
      count(() => client.from("runtime_evidence_records").select("*", { head: true, count: "exact" })),
  };
}
