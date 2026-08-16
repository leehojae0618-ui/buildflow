# RECIPE-MANUAL-RUN-PROVENANCE-001 Task

## Authority

```text
RISK TIER: R2 (code path change only, no live external write/DB/OAuth;
default kill switches remain false)
SCOPE + IMPLEMENTATION AUTHORITY: APPROVED 2026-08-16 (user picked
"attempt token, server-side in-memory" over SSE-streaming and
reverting to the single combined action)
COMMIT + PUSH: streamlined per 2026-08-16 user direction
```

## Finding

An independent audit of `RECIPE-EXECUTION-PROGRESS-001` (roadmap Step 9)
found that its three granular Server Actions —
`runAiNewsSummaryStep(selectedItems)` and
`runAiNewsSlackWriteStep(selectedItems, summary)` — took the C1/C2
results back from the browser with TypeScript types only, no runtime
validation and no server-side proof that the values actually came from
this server's own `runAiNewsFetchStep`/`runAiNewsSummaryStep` calls.
`recipe-first-experience.tsx` round-tripped `fetchResult.selectedItems`
and `summaryResult.summary` through component state back into the next
Server Action call. The live write itself stayed protected by the kill
switch / channel lock / idempotency, so there was no live-risk while
`BUILDFLOW_LIVE_SLACK_WRITE_ENABLED=false`, but a forged direct POST to
`runAiNewsSlackWriteStep` (bypassing C1/C2 in the browser) could, once
live, cause `LiveRecipeEvidence` to record `AI_NEWS_DIGEST` for Slack
content BuildFlow never actually generated from News/Groq.

## Design

Server-owned "attempt" store: `runAiNewsFetchStep` generates an opaque
`attemptId` (`randomUUID()`) and stores the real `selectedItems` in a
module-level `Map<string, DigestAttempt>` (`digestAttempts` in
`live-ai-news/actions.ts`), keyed by `attemptId`. The browser receives
only `attemptId` plus display counts (`selectedItemCount`, `service`,
`completedAt`) — never the news items or summary text.
`runAiNewsSummaryStep(attemptId)` and `runAiNewsSlackWriteStep(attemptId)`
look the real data up from `digestAttempts` server-side; an unknown or
stale `attemptId` (forged, expired, or a write attempted before the
summary step ran) returns a new `ATTEMPT_NOT_FOUND` error instead of
proceeding. Entries expire after a 10-minute TTL (`pruneExpiredAttempts`,
checked on each fetch call) and are deleted once the write step
terminates (success or failure), so the map cannot grow unbounded.

In-memory only — no DB. Chosen over the SSE/streaming-route alternative
(stronger, but needs a Route Handler restructure) as the smallest diff
that removes client-suppliable content from the trust boundary while
keeping the existing Server Action shape and the Step 9 per-step
checklist UI intact. Revisit if/when Recipe runs move behind a real
DB-backed attempt record (Step 11/12 persistence work).

## Scope Completed

- `live-ai-news/actions.ts`: added `digestAttempts` map + `pruneExpiredAttempts`;
  `runAiNewsFetchStep` now returns `attemptId` instead of raw
  `selectedItems`; `runAiNewsSummaryStep`/`runAiNewsSlackWriteStep` now take
  `attemptId: string` instead of `SelectedNewsItem[]`/`NewsDigestSummary`
  and look the real values up server-side; added `ATTEMPT_NOT_FOUND` to
  `AiNewsDigestGateErrorCode`.
- `recipe-first-experience.tsx`: `approveDigestRun` passes
  `fetchResult.attemptId` through the summary/write calls instead of the
  raw step results; added the `ATTEMPT_NOT_FOUND` UI error label.
- `live-ai-news/actions.test.ts`: updated the two existing Step 9 gate
  tests for the new signature; added 3 new tests proving a forged/unknown
  `attemptId` is rejected at both the summary and write step, and that
  calling the write step before the summary step populates the attempt is
  also rejected.
- `.buildflow/STATUS.md`: corrected self-contradictory HEAD/tree state and
  Step 3 status (separate, pre-existing doc defect found during the same
  audit), moved Step 9/10 closure notes out of `## Blockers` into
  `## Current Sprint`, and recorded this provenance gap while open.

## Out of Scope

- No live execution performed; kill switches remain `false` at rest.
- No DB-backed attempt persistence (still in-memory, still lost on
  process restart) — that's Step 11/12 territory (`LIVE-DB-VALIDATION-001`,
  currently PAUSED).
- SSE/streaming execution route not built — the attempt-token approach
  keeps the existing Server Action + sequential-await UI pattern.

## Verification

```text
npx vitest run src/features/live-ai-news/actions.test.ts
PASS — 10/10 (5 new/changed for provenance)

npx tsc --noEmit
PASS — no errors

npx eslint src/features/live-ai-news/actions.ts \
  src/features/live-ai-news/actions.test.ts \
  src/features/recipes/components/recipe-first-experience.tsx
PASS — no findings

npx vitest run (full suite)
PASS — 966 tests, 5 skipped, 0 regressions
```

Full interactive browser click-through not performed — see
`RECIPE-CLARIFICATION-COMPLETION-001/TASK.md` for the standing limitation
(no headless-browser tool in this environment). The provenance property is
proven directly by the `actions.test.ts` `ATTEMPT_NOT_FOUND` tests.
