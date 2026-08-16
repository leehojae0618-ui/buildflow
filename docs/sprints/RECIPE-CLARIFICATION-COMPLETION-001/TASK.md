# RECIPE-CLARIFICATION-COMPLETION-001 Task

## Authority

```text
RISK TIER: R2 (UI + pure client-side logic, no live external write, no DB, no OAuth)
SCOPE + IMPLEMENTATION AUTHORITY: APPROVED 2026-08-16
COMMIT + PUSH: streamlined per 2026-08-16 user direction (no separate pause)
```

## Goal

Roadmap Step 4 ("Clarification → Recipe 보완"): `createBuildPackage` already
generates `missingInformation` questions (e.g. "몇 시에 실행할까요?"), but
there was no way to answer them — the UI only displayed the questions
read-only, and the answers were never merged back into the package.

## Requirements

- Add `applyBuildPackageClarification(buildPackage, answers)` to
  `build-package.ts`: for each `missingInformation` item with a non-empty
  trimmed answer, set the matching `configurationRequirements[].defaultValue`
  and drop it from `missingInformation`; re-validate with
  `buildPackageSchema`. Ignore answers for ids that either don't exist or
  are already resolved (no fabricated values).
- Wire it into `recipe-first-experience.tsx`: replace the read-only
  "추가로 필요한 정보" list with one input + submit per question; once all
  are answered, show a completion message instead of the list.
- Add unit tests: partial answers, full completion, empty/whitespace
  answers ignored, unknown ids ignored.

## Out of Scope

- Persisting answers server-side / to a DB (Step 11, Save Agent/Recipe).
- Wiring the completed package into an actual Recipe run (Step 8, Manual
  Run UI — still not connected to any server action).
- Validating answer *content* beyond non-empty (e.g. time-format parsing)
  — out of scope until a concrete need appears.

## Verification Note

Full interactive browser click-through (typing an answer, clicking 답변,
watching the list update) was **not** performed — no headless-browser tool
(`chromium-cli`/Playwright) is installed in this environment, and installing
one was out of this Sprint's approved scope. What was verified: `npm run
dev` serves the homepage with HTTP 200 and no server-side render error
after this change (SSR shell renders, includes the expected
`#recipe-goal` input), and the full unit/typecheck/lint suite passes. Manual
browser QA by the user is recommended before treating this as fully proven.
