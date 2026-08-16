# RECIPE-MANUAL-RUN-PROVENANCE-001 Report

## Status

```text
STATUS: IMPLEMENTED / VALIDATED
FINDING: independent audit of roadmap Step 9's stepped Server Actions
found selectedItems/summary round-tripped through the browser with no
runtime validation or server-side provenance binding
FIX: server-owned attemptId (in-memory Map) replaces client-supplied
selectedItems/summary on the wire between steps
LIVE EXECUTION: NONE
COMMIT / PUSH: to follow this report
```

## Scope Completed

See `TASK.md`. `runAiNewsFetchStep` now hands the browser an opaque
`attemptId` instead of the real news items; `runAiNewsSummaryStep` and
`runAiNewsSlackWriteStep` take only that `attemptId` and read the actual
`selectedItems`/`summary` back out of server memory, rejecting anything
that doesn't resolve to a real, in-order attempt with `ATTEMPT_NOT_FOUND`.

## MVP Impact

Qualitative: closes the client-trust gap the audit flagged before it
could matter — once Live is enabled, a forged direct call to
`runAiNewsSlackWriteStep` can no longer substitute attacker-controlled
content into a Slack write that BuildFlow's own Evidence would then
misrepresent as News→Groq-derived. No UX change — the Step 9 checklist
behaves identically from the browser's point of view.

## Next Gate

The attempt store is still in-memory only (lost on process restart, not
shared across instances) — real durability requires the same
`LIVE-DB-VALIDATION-001`-blocked persistence layer that Steps 11/12
(Save Agent/Recipe, Run Again/Replay) need. STATUS.md's "Next Eligible
Action" (deciding how to proceed on that DB block) is unchanged by this
Sprint.
