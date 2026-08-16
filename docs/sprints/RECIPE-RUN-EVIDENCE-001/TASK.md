# RECIPE-RUN-EVIDENCE-001 Task

## Authority

```text
RISK TIER: R2 (data already computed server-side, now surfaced to the UI;
no new external call, no live execution performed by this Sprint)
SCOPE + IMPLEMENTATION AUTHORITY: APPROVED 2026-08-16
COMMIT + PUSH: streamlined per 2026-08-16 user direction
```

## Goal

Roadmap Step 10 ("Evidence / Result UX"), completion bar: "성공/실패/사용
서비스/시간/결과 표시" (show success/failure, services used, time, result).

## Finding

`runApprovedSlackDigestWrite` already computes a structured
`LiveRecipeEvidence` (attemptId, service, actionType, requestedAt,
completedAt, status, safeExternalReference) for every call, but
`RECIPE-MANUAL-RUN-001`'s action wrappers discarded it, only forwarding
`safeSlackReference`. C1/C2 (fetch/summary) don't produce their own
`LiveRecipeEvidence` (only C3 goes through the guarded live-recipe-service),
so there was nothing to show a service name or completion time for those
steps either.

## Scope Completed

- `live-ai-news/actions.ts`: `runAiNewsFetchStep`/`runAiNewsSummaryStep` now
  also return a `service` label ("OpenAI News RSS", `Groq (<model>)`) and a
  `completedAt` timestamp captured at that step's resolution.
  `runAiNewsSlackWriteStep` now returns the full `evidence:
  LiveRecipeEvidence` object from `runApprovedSlackDigestWrite`, not just
  `safeSlackReference`.
- `recipe-first-experience.tsx`: the step checklist now shows each step's
  service; on success, the final result renders a structured card (사용
  서비스 / 완료 시각 from the real Evidence `completedAt` / 결과 / Slack
  참조) instead of one plain sentence; on failure it's labeled "실행 실패:
  ...".

## Out of Scope

- Persisting the Evidence anywhere (component state only, lost on refresh)
  — that's Step 11/12 territory and depends on `LIVE-DB-VALIDATION-001`,
  which remains PAUSED / BLOCKED BY LOCAL ENVIRONMENT.
- No change to `runApprovedSlackDigestWrite`, `runNewsFetchGate`, or any
  already-verified guarded function — only what the wrappers *forward* to
  the client changed.

## Verification

```text
npm run typecheck / lint / vitest run
PASS — 963 tests, 0 regressions (no new tests: the changed fields are
deterministic additions to already-tested success paths, and the existing
failure-path fetch-spy tests are unaffected since they short-circuit before
these fields are computed)

npm run dev + curl http://localhost:3000
HTTP 200, SSR shell renders, no server error
```

Full interactive browser click-through not performed — see
`RECIPE-CLARIFICATION-COMPLETION-001/TASK.md` for the standing limitation.
