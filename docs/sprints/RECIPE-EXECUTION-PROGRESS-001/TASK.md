# RECIPE-EXECUTION-PROGRESS-001 Task

## Authority

```text
RISK TIER: R2 (code path added, default-OFF, no live call performed by
this Sprint itself — same standing as RECIPE-MANUAL-RUN-001)
SCOPE + IMPLEMENTATION AUTHORITY: APPROVED 2026-08-16
COMMIT + PUSH: streamlined per 2026-08-16 user direction
```

## Goal

Roadmap Step 9 ("Execution Progress UI"), completion bar: "입력→AI→Tool→
결과 단계 실시간/단계별 표시" (show input->AI->tool->result stages
step-by-step / in real time).

## Finding

`RECIPE-MANUAL-RUN-001`'s "Recipe 실행" button awaited one combined Server
Action (`requestApprovedAiNewsDigestRun`) and only showed a final
success/failure message — no visibility into which of C1 (fetch) / C2
(summarize) / C3 (Slack write) was currently running.

## Design

Added three granular Server Actions to `live-ai-news/actions.ts`
(`runAiNewsFetchStep`, `runAiNewsSummaryStep`, `runAiNewsSlackWriteStep`),
each independently re-checking the same gate as
`prepareAiNewsDigestRun`/`requestApprovedAiNewsDigestRun` before doing
anything — calling any one of them in isolation is exactly as safe as the
combined run. The client now calls them in sequence and updates a
step-by-step checklist between each awaited call, so progress is visible as
each network round-trip resolves (no WebSocket/SSE infrastructure needed —
manual one-shot runs complete in a few seconds per the Step 1 live
evidence, so sequential awaited calls are sufficient for real-time-feeling
progress).

`requestApprovedAiNewsDigestRun` (the combined, single-call variant from
`RECIPE-MANUAL-RUN-001`) is left in place, unmodified, and still tested —
just no longer called by the UI, which now uses the granular sequence.

## Scope Completed

- `live-ai-news/actions.ts`: 3 new exports
  (`runAiNewsFetchStep`/`runAiNewsSummaryStep`/`runAiNewsSlackWriteStep`),
  each gated identically to the existing actions.
- `live-ai-news/actions.test.ts`: 2 new tests proving every granular step
  independently blocks (LIVE_DISABLED, WRITE_DISABLED) with zero external
  calls, matching the existing safety-test pattern.
- `recipe-first-experience.tsx`: `approveDigestRun` now sequences the 3
  steps, updating a `digestSteps` checklist (✓ completed steps with detail,
  a "진행 중..." marker for the current one) rendered between the preview
  and the final result message.

## Out of Scope

- No live execution performed.
- No persisted Evidence record (Step 10).
- No WebSocket/SSE streaming infrastructure — sequential awaited Server
  Action calls were judged sufficient for a single manual one-shot run.

## Verification

```text
npx vitest run src/features/live-ai-news/actions.test.ts
PASS — 7/7 (2 new)

npm run typecheck / lint / vitest run
PASS — 963 tests, 0 regressions

npm run dev + curl http://localhost:3000
HTTP 200, SSR shell renders, no server error
```

Full interactive browser click-through not performed — see
`RECIPE-CLARIFICATION-COMPLETION-001/TASK.md` for the standing limitation
(no headless-browser tool in this environment). The safety-critical
property is proven directly by the `actions.test.ts` fetch-spy tests.
