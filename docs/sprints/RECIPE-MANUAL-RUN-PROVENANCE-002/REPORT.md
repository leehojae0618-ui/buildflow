# RECIPE-MANUAL-RUN-PROVENANCE-002 Report

## Status

```text
STATUS: IMPLEMENTED / VALIDATED
FINDING: follow-up audit of RECIPE-MANUAL-RUN-PROVENANCE-001 found
concurrent C3 calls could each mint a fresh idempotency requestId
(duplicate Slack send risk) and TTL was only swept in C1, not checked in
C2/C3
FIX: attempt state machine (FETCHED/SUMMARIZED/WRITING) with a
synchronous pre-await state transition on the write step, deterministic
per-attempt requestId, and a real per-request expiresAt check in every
step
LIVE EXECUTION: NONE
COMMIT / PUSH: to follow this report
```

## Scope Completed

See `TASK.md`. `runAiNewsSlackWriteStep` now claims an attempt
synchronously (`state = "WRITING"`, no `await` before the write) so a
second concurrent call for the same `attemptId` is rejected with
`ATTEMPT_NOT_FOUND` before it can reach the Slack write, and every step
now evicts an attempt whose `expiresAt` has passed instead of relying on
the next `runAiNewsFetchStep` call to sweep it.

## MVP Impact

Qualitative: closes the last live-risk gap identified before Live Slack
write is ever turned on for real use — a double-click, a retried
request, or a race between two browser tabs on the same attempt can no
longer produce two Slack messages from one Manual Run. No UX change; the
Step 9 checklist behaves identically from the browser's point of view.

## Next Gate

Still in-memory only — real durability, cross-instance attempt sharing,
and DB-backed persistence remain `LIVE-DB-VALIDATION-001` territory
(PAUSED). STATUS.md's "Next Eligible Action" (deciding how to proceed on
that DB block) is unchanged by this Sprint; per the follow-up audit's own
recommendation, this was the last small R2-tier hardening pass before
that decision.
