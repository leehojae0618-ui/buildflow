# RECIPE-MANUAL-RUN-001 Task

## Authority

```text
RISK TIER: R2 for this change (code path added, default-OFF, no live call
performed by this Sprint itself). Any actual click-through execution once
the kill switches are on is its own R3 live-external-write event, gated
exactly like the existing verified C3 path — not authorized by this Sprint.
SCOPE + IMPLEMENTATION AUTHORITY: APPROVED 2026-08-16, with an explicit
required safety property (see below)
COMMIT + PUSH: streamlined per 2026-08-16 user direction
```

## Goal

Roadmap Steps 7 ("Approval UX + Guard 연결") and 8 ("Manual Run UI"),
combined: give the user an actual button that runs the live-verified
composite AI-news Recipe (`runNewsToGroqToSlackGate`), with an explicit
approval step that shows destination and action before anything happens.

## Safety Finding That Shaped This Design

`runApprovedSlackDigestWrite` (C3) is gated by
`BUILDFLOW_LIVE_CONNECT_ENABLED`/`BUILDFLOW_LIVE_SLACK_WRITE_ENABLED` at the
service layer. But `runNewsFetchGate`/`runNewsToGroqSummaryGate` (C1/C2) have
**no runtime-level guard** — until now they were only ever reachable through
a developer's own `it.skipIf(...)`-gated opt-in test run. A UI button
calling `runNewsToGroqToSlackGate` directly would call C1 (real RSS fetch)
and C2 (real Groq call, real cost) *before* reaching C3's guard, regardless
of the Slack kill switch — a materially bigger blast radius than exists
today.

## Required Safety Property (verified, see Verification below)

The new Server Action boundary
(`src/features/live-ai-news/actions.ts`) re-checks
`liveConnectEnabled`/`liveSlackWriteEnabled`/`approvedSlackChannelId`/
`GROQ_API_KEY` **before** constructing `OpenAiNewsRssSource` or
`GroqSummaryAdapter` or calling `runNewsToGroqToSlackGate` at all. With the
kill switches at their current at-rest values (`BUILDFLOW_LIVE_SLACK_WRITE_
ENABLED=false`), clicking the button performs **zero** external calls.

## Scope Completed

- `src/features/live-ai-news/actions.ts` (new, `"use server"`):
  - `prepareAiNewsDigestRun()` — reads environment only, no external call;
    returns the server-resolved destination (never client-supplied) or a
    gate error code.
  - `requestApprovedAiNewsDigestRun()` — re-checks the same gate, then (only
    if it passes) runs the composite C1->C2->C3 gate with a fresh
    `slack-digest-ui-run-<uuid>` request id.
- `recipe-first-experience.tsx`: new "Recipe 실행" section (shown only for
  `recipe.ai-news-slack-digest`) with a two-step flow — "Recipe 실행 준비"
  (preview: shows destination + action, no call) then "실행 승인" (the
  actual guarded run) — mirroring the existing Slack test-write two-step
  pattern already in this file.
- `src/features/live-ai-news/actions.test.ts` (new): 5 tests proving the
  gate short-circuits before any `fetch` call at every failure mode
  (LIVE_DISABLED, WRITE_DISABLED, CONFIGURATION_MISSING), and that a fully
  configured preview resolves the destination server-side with zero calls.

## Out of Scope

- Actually running this live (kill switches stay at their current values;
  no `.env.local` change was made).
- Scheduler, additional Destinations, DB persistence of run results.
- Full interactive browser click-through — see Verification.

## Verification

```text
npx vitest run src/features/live-ai-news/actions.test.ts
PASS — 5/5, including 2 tests that spy on globalThis.fetch and assert it
is never called when the kill switch is off

npm run typecheck / lint / vitest run
PASS — 961 tests, 0 regressions

npm run dev + curl http://localhost:3000
HTTP 200, SSR shell renders, no server error
```

Full interactive browser click-through (click "Recipe 실행 준비", observe
the WRITE_DISABLED notice given this environment's current
`BUILDFLOW_LIVE_SLACK_WRITE_ENABLED=false`) was not performed — no
headless-browser tool available in this environment; see
`RECIPE-CLARIFICATION-COMPLETION-001/TASK.md` for the same standing
limitation. The safety-critical property (no external call when disabled)
is instead proven deterministically by the `actions.test.ts` `fetch` spy
tests, which is the part that actually matters for this Sprint's risk.
