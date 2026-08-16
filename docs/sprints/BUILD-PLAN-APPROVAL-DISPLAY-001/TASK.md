# BUILD-PLAN-APPROVAL-DISPLAY-001 Task

## Authority

```text
RISK TIER: R2 (UI only, no live external write, no DB, no OAuth)
SCOPE + IMPLEMENTATION AUTHORITY: covered by 2026-08-16 direction to
confirm/complete roadmap Steps 5-7 in order before Step 8
COMMIT + PUSH: streamlined per 2026-08-16 user direction
```

## Goal

Roadmap Step 5 ("Build Plan / 비용 / 권한 화면"), completion bar: "연결
서비스·비용·권한·실행 계획 표시" (show connected services, cost, permissions,
execution plan).

## Finding

`createBuildPackage` already computes `connections` (services), `testPlan`
(execution plan), `costProfile` (cost), and `approvals` (permission/approval
requirements) — but `recipe-first-experience.tsx`'s `BuildPreparation` panel
only rendered `connections` and `testPlan`. `costProfile` and `approvals`
were computed and never shown to the user once a Recipe was selected.

## Scope Completed

- Added the Build Package's `costProfile.label` to the existing "선택한
  Recipe" summary card.
- Added a new "필요한 승인" section listing `buildPackage.approvals`
  (e.g. "첫 Slack 채널 선택 확인"), with a plain-language fallback when a
  Recipe has none.

No new function, no schema change, no server action — pure additional
rendering of data the package already produced.

## Verification

```text
npm run typecheck / lint / vitest run
PASS — 956 tests, 0 regressions (no new tests: no React component test
infra exists in this repo — no @testing-library dependency, no .test.tsx
files anywhere)

npm run dev + curl http://localhost:3000
HTTP 200, SSR shell renders, no server error
```

Full interactive browser click-through was not performed (see
`RECIPE-CLARIFICATION-COMPLETION-001/TASK.md` "Verification Note" for why).

## Out of Scope

- Step 6 (Connection UX beyond Slack) and Step 7 (Approval UX beyond the
  test-write flow) — assessed separately, not bundled into this change.
