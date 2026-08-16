# BuildFlow Status

Current-state-only. Completed/historical Sprint detail lives in
`docs/SPRINT_HISTORY.md`; per-Sprint evidence lives in `docs/sprints/<id>/`.

## Repository / HEAD

- Local HEAD: matches `origin/main`, working tree clean, immediately
  after this commit is pushed (this file is committed together with the
  code change it describes, so run `git rev-parse HEAD` for the exact
  hash rather than trusting a hardcoded one here — a hardcoded hash in
  this file can only ever name a commit *before* itself, which is exactly
  the self-contradiction an earlier audit found: `b024292`, the commit
  that introduced this convention, named `3e123d0` as "Local HEAD" and
  was immediately one commit stale on arrival).

## Current Sprint

- No active implementation Sprint. Roadmap Steps 1-2 are CLOSED / COMPLETE.
  Step 3 (natural-language → Recipe) was found already implemented by an
  earlier Sprint (`RECIPE-FIRST-BUILD-PACKAGE-001`, `ebd0290`, pushed
  pre-2026-08-16) — `analyzeRecipeIntent` + `recommendRecipes` already turn
  e.g. "매일 AI 뉴스를 찾아서 중요한 것만 요약해서 Slack으로 보내줘" into a
  ranked, structured Recipe; confirmed still passing (14/14 tests). It is a
  fixed-catalog keyword/pattern matcher (21 seed Recipes), not an LLM-based
  open-ended generator; the user accepted this as meeting Step 3's stated
  bar and deferred any LLM-based expansion to a later, separately-scoped
  roadmap item.
- `RECIPE-CLARIFICATION-COMPLETION-001` (roadmap Step 4) is IMPLEMENTED /
  VALIDATED: `applyBuildPackageClarification` lets a user answer a Build
  Package's `missingInformation` questions and complete it client-side; the
  UI (`recipe-first-experience.tsx`) now has real inputs instead of a
  read-only question list. Detail:
  `docs/sprints/RECIPE-CLARIFICATION-COMPLETION-001/TASK.md`,
  `docs/sprints/RECIPE-CLARIFICATION-COMPLETION-001/REPORT.md`. Browser
  interaction was not verified (no headless-browser tool in this
  environment) — see that Sprint's TASK.md "Verification Note".
- `BUILD-PLAN-APPROVAL-DISPLAY-001` (roadmap Step 5) closed a display gap:
  `createBuildPackage` already computed `costProfile` and `approvals` but
  the UI never rendered them. Both are now shown once a Recipe is selected.
  Detail: `docs/sprints/BUILD-PLAN-APPROVAL-DISPLAY-001/`.
- Roadmap Step 6 (Connection UX) assessed as already adequately satisfied:
  every required service shows READY/NOT_CONNECTED status, and Slack (the
  one live-integrated service) has a real guarded connect flow; the other 7
  catalog services are explicitly documented as OAuth-not-performed-yet
  (existing, intentional scope — Step 19 territory, not a gap).
- `RECIPE-MANUAL-RUN-001` (roadmap Steps 7+8, combined) closed the
  confirmed gap: a real "Recipe 실행" button now exists in
  `recipe-first-experience.tsx`, gated by a new Server Action boundary
  (`src/features/live-ai-news/actions.ts`) that re-checks the live kill
  switches *before* any News/Groq call — a safety property C3's own guard
  alone did not provide, since it only gated the final Slack write, not C1
  RSS fetch or C2 Groq call. Proven by 5 unit tests that spy on
  `globalThis.fetch` and assert it is never called while disabled. No live
  execution occurred; `BUILDFLOW_LIVE_SLACK_WRITE_ENABLED` remains `false`
  at rest. Detail: `docs/sprints/RECIPE-MANUAL-RUN-001/`.
- `RECIPE-EXECUTION-PROGRESS-001` (roadmap Step 9) closed: "Recipe 실행"
  now sequences 3 granular Server Actions (fetch/summarize/write), each
  independently gated the same way, and shows a live step-by-step checklist
  between the preview and the final result. Detail:
  `docs/sprints/RECIPE-EXECUTION-PROGRESS-001/`.
- `RECIPE-RUN-EVIDENCE-001` (roadmap Step 10) closed: the Manual Run's
  final result now shows a structured card (사용 서비스 / 완료 시각, from
  the real `LiveRecipeEvidence` / 결과 / Slack 참조) built from the
  Evidence `runApprovedSlackDigestWrite` already computed but previously
  discarded. Detail: `docs/sprints/RECIPE-RUN-EVIDENCE-001/`.
- `RECIPE-MANUAL-RUN-PROVENANCE-001` closed: an independent audit found
  Step 9's stepped Server Actions (`runAiNewsSummaryStep`,
  `runAiNewsSlackWriteStep`) took `selectedItems`/`summary` back from the
  browser with no runtime validation or server-side provenance binding.
  Fixed by an opaque server-owned `attemptId` (in-memory `digestAttempts`
  Map in `live-ai-news/actions.ts`) — the browser now only ever sees
  `attemptId` + display counts; an unknown/forged/out-of-order attempt
  returns `ATTEMPT_NOT_FOUND`. In-memory only (no DB yet). Detail:
  `docs/sprints/RECIPE-MANUAL-RUN-PROVENANCE-001/`.
- `RECIPE-MANUAL-RUN-PROVENANCE-002` closed: a follow-up audit of -001
  found two remaining attempt-lifecycle gaps — concurrent
  `runAiNewsSlackWriteStep` calls for the same `attemptId` each minted a
  fresh idempotency `requestId`, so they could both reach a live Slack
  write; and the 10-minute attempt TTL was only swept in
  `runAiNewsFetchStep`, not checked in the summary/write steps. Fixed by
  a `FETCHED`/`SUMMARIZED`/`WRITING` state machine on `DigestAttempt`
  (the write step claims `WRITING` synchronously, before any `await`, so
  a second concurrent call observes the wrong state and is rejected
  before it can build a Slack request), a deterministic per-attempt
  `requestId` (`slack-digest-attempt-${attemptId}`), and a per-request
  `expiresAt` check (`getLiveAttempt`) in every step. Detail:
  `docs/sprints/RECIPE-MANUAL-RUN-PROVENANCE-002/`.
- Implementation Authority: per 2026-08-16 user direction, R2 roadmap steps
  with no live external write/DB/OAuth proceed through Commit + Push
  without a separate pause once Scope is approved per step; live external
  actions always remain their own separate approval gate.

## Current Verified Capability

- C1 News RSS fetch: VERIFIED (live)
- C2 Groq summary: VERIFIED (live)
- C3 guarded Slack write (`runApprovedSlackDigestWrite`): VERIFIED (live,
  one-shot; write kill switch restored to `false` immediately after)
- Composite News → Groq → Guarded Slack single-path
  (`runNewsToGroqToSlackGate`): VERIFIED LIVE (one continuous execution,
  one-shot; write kill switch restored to `false` immediately after)
- Recipe Execution Contract (Trigger/Input/Processor/Destination/Approval/
  Evidence): IMPLEMENTED, adapters mock-verified against the AI-news Recipe
  (970 tests passing, 5 skipped, 0 regressions as of `RECIPE-MANUAL-RUN-PROVENANCE-002`);
  no live execution needed for this step
- Controlled runtime: IMPLEMENTED IN CODE, present in `main`
- Attempt-token lifecycle (single-process): concurrent duplicate-Slack-send
  and stale-TTL-reuse both closed by `RECIPE-MANUAL-RUN-PROVENANCE-002`,
  proven by 4 unit tests (expired-at-C2, expired-at-C3, concurrent-C3,
  consumed-attempt-replay); no live execution needed for this step

## Current NOT VERIFIED

- Persistent DB Evidence
- Production readiness / Deploy
- Durable full-run Evidence provenance beyond a single process: the
  attempt store is still in-memory only (lost on process restart, not
  shared across instances) — `RECIPE-MANUAL-RUN-PROVENANCE-002` hardened
  its single-process lifecycle (concurrency + TTL) but did not add
  persistence. Real durability still routes through
  `LIVE-DB-VALIDATION-001` (PAUSED).

## Known Procedural Finding (historical, not hidden)

- Commit `c7674f0` was made during guarded C3 verification without a
  separate Commit approval beyond the live-execution approval (P1 gap).
  Retention of that commit was separately approved 2026-08-16, not
  retroactively asserted as originally authorized.

## Blockers

- None currently blocking.
- `LIVE-DB-VALIDATION-001` remains PAUSED / BLOCKED BY LOCAL ENVIRONMENT
  (Local Supabase healthcheck failure on the 8GB M1 environment); see
  `docs/SPRINT_HISTORY.md` Section 2.

## Next Eligible Action

- Roadmap Steps 11 (Save Agent/Recipe) and 12 (Run Again/Replay) both need
  persistence beyond component state (currently lost on refresh), which
  routes through `LIVE-DB-VALIDATION-001` (PAUSED / BLOCKED BY LOCAL
  ENVIRONMENT) — next real decision is how to proceed given that block.
  Live external actions (including an actual click-through of the Manual
  Run button with the kill switches on) still require their own separate
  approval regardless of the streamlined R2 Commit/Push flow noted above.

## Prohibited Without Separate Approval

Additional Slack write, Scheduler, production Pipedream, DB migration, MCP
invocation, additional news/API sources, Deploy, Merge, Release.
