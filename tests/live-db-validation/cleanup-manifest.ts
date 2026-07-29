import { LIVE_DB_TEST_PREFIX } from "./types";

export type LiveDbCleanupManifest = {
  validationRunId: string;
  recordPrefix: typeof LIVE_DB_TEST_PREFIX;
  plannedArtifacts: readonly ("runtime_approval_requests" | "runtime_approval_events" | "runtime_evidence_records")[];
  cleanupExecuted: false;
  cleanupStatus: "NOT_EXECUTED_DRY_MODE";
};

/** Dry mode records cleanup intent but never deletes data. */
export function createLiveDbCleanupManifest(validationRunId: string): LiveDbCleanupManifest {
  return Object.freeze({
    validationRunId,
    recordPrefix: LIVE_DB_TEST_PREFIX,
    plannedArtifacts: Object.freeze([
      "runtime_approval_requests",
      "runtime_approval_events",
      "runtime_evidence_records",
    ] as const),
    cleanupExecuted: false,
    cleanupStatus: "NOT_EXECUTED_DRY_MODE",
  });
}
