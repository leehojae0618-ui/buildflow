import type { PlatformExecutionStatus, PollingPolicy } from "./types";

export type PollingDecision = "CONTINUE" | "COMPLETE" | "TIMED_OUT";

export function decidePolling(
  status: PlatformExecutionStatus,
  attempt: number,
  startedAtMs: number,
  nowMs: number,
  policy: PollingPolicy,
): PollingDecision {
  if (policy.terminalStatuses.includes(status)) return "COMPLETE";
  if (attempt >= policy.maxAttempts || nowMs - startedAtMs >= policy.overallTimeoutMs) return "TIMED_OUT";
  return "CONTINUE";
}
