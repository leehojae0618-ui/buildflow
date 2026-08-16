# RECIPE-MANUAL-RUN-PROVENANCE-002 Task

## Authority

```text
RISK TIER: R2 (in-memory attempt-store logic + tests only; no live
external write/DB/OAuth; default kill switches remain false)
SCOPE + IMPLEMENTATION AUTHORITY: APPROVED 2026-08-16 (PM/CTO follow-up
audit of RECIPE-MANUAL-RUN-PROVENANCE-001 specified the exact attempt
state machine, stable requestId, and TTL-check design to implement)
COMMIT + PUSH: streamlined per 2026-08-16 user direction
```

## Finding

A follow-up independent audit of `RECIPE-MANUAL-RUN-PROVENANCE-001`
confirmed the client-content-forgery gap it closed stayed closed, but
found two remaining gaps in the attempt-token lifecycle itself:

- **P1 — concurrent duplicate Slack send.** `runAiNewsSlackWriteStep`
  generated a fresh `requestId: slack-digest-ui-run-${randomUUID()}` on
  every call. `runApprovedSlackDigestWrite`'s idempotency guard keys on
  that `requestId`, so two near-simultaneous calls for the *same*
  `attemptId` each got a different `requestId`, each passed the
  idempotency check, and each could reach the live Slack write —
  a real duplicate-message risk once Live is enabled.
- **P2 — TTL not enforced on every step.** `pruneExpiredAttempts()` (the
  10-minute TTL sweep) only ran inside `runAiNewsFetchStep`. Neither
  `runAiNewsSummaryStep` nor `runAiNewsSlackWriteStep` checked an
  attempt's age before using it, so a >10-minute-old attempt stayed
  usable for C2/C3 as long as no newer C1 fetch happened to trigger a
  sweep in the meantime — TTL was a cleanup side effect, not a real
  per-request expiry check.

Both were verified directly against `live-ai-news/actions.ts` (git
`02c7783`) before fixing, not taken on the audit report's word alone.

## Design

Added a small state machine to `DigestAttempt` (`FETCHED` ->
`SUMMARIZED` -> `WRITING`, then deleted/"consumed") plus a per-attempt
`expiresAt`, replacing the bare `createdAt` + sweep-only prune:

- `getLiveAttempt(attemptId)` replaces raw `Map.get` in every step: it
  evicts and returns `undefined` if `expiresAt` has passed, so expiry is
  now a real check on every C2/C3 call, not just a side effect of the
  next C1 fetch.
- `runAiNewsSummaryStep` only proceeds from state `FETCHED`, and
  transitions to `SUMMARIZED` after a successful Groq call.
- `runAiNewsSlackWriteStep` reads the attempt and writes
  `state = "WRITING"` in one synchronous block with no `await` in
  between. Node's event loop only switches between concurrent async
  calls at an `await` boundary, so whichever of two concurrent calls for
  the same `attemptId` resumes first claims the attempt; the other
  observes `state !== "SUMMARIZED"` and is rejected with
  `ATTEMPT_NOT_FOUND` before it ever builds a Slack request. This is the
  primary fix for the P1 race.
- `requestId` for the Slack write is now deterministic —
  `slack-digest-attempt-${attemptId}` instead of a fresh
  `randomUUID()` per call — so the existing idempotency guard in
  `live-recipe-service.ts` is a second, independent line of defense
  against the same duplicate-send scenario if the state-machine guard
  were ever bypassed.

Reused the existing `ATTEMPT_NOT_FOUND` error code for all rejection
cases (unknown, expired, wrong-state, already-consumed) rather than
adding new codes — the UI's Korean label ("실행 정보를 찾을 수 없습니다.
처음부터 다시 실행해 주세요.") already reads correctly for all four, and
this avoids touching `recipe-first-experience.tsx`'s error-label map.

## Scope Completed

- `live-ai-news/actions.ts`: `DigestAttempt` gained `state`
  (`FETCHED`/`SUMMARIZED`/`WRITING`) and `expiresAt`; added
  `getLiveAttempt` for per-request TTL enforcement; `runAiNewsFetchStep`,
  `runAiNewsSummaryStep`, `runAiNewsSlackWriteStep` updated to use it and
  to drive the state machine; write-step `requestId` is now
  `slack-digest-attempt-${attemptId}` instead of a random UUID per call.
- `live-ai-news/actions.test.ts`: added `vi.mock` for
  `live-recipe-service` (to count/observe Slack-write calls without a
  real Pipedream/network round trip) and for `GroqSummaryAdapter` (to
  reach `SUMMARIZED` state without a real Groq/OpenAI network call).
  Added 4 new tests: expired attempt rejected at C2, expired attempt
  rejected at C3, two concurrent C3 calls for the same attempt reach the
  Slack adapter exactly once, and re-running C3 on an already-consumed
  attempt is rejected.

## Out of Scope

- No live execution performed; kill switches remain `false` at rest.
- Still in-memory only, still lost on process restart, still not shared
  across instances — real durability remains `LIVE-DB-VALIDATION-001`
  territory (PAUSED), unchanged by this Sprint.
- No new error codes / no UI changes — `ATTEMPT_NOT_FOUND` covers all
  rejection paths as before.

## Verification

```text
npx vitest run src/features/live-ai-news/actions.test.ts
PASS — 14/14 (4 new for lifecycle hardening)

npx tsc --noEmit
PASS — no errors

npx eslint src/features/live-ai-news/actions.ts \
  src/features/live-ai-news/actions.test.ts
PASS — no findings

npx vitest run (full suite)
PASS — 970 tests, 5 skipped, 0 regressions
```
