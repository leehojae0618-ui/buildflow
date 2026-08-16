# RECIPE-MANUAL-RUN-001 Report

## Status

```text
STATUS: IMPLEMENTED / VALIDATED
ROADMAP STEPS 7+8: closed — a real "Recipe 실행" button now exists, gated
by a two-step preview -> approve flow that shows destination + action
before any external call, and by the same live kill switches used
elsewhere
LIVE EXECUTION: NONE (kill switch remains at its current at-rest value;
no .env.local change made)
COMMIT / PUSH: to follow this report
```

## Scope Completed

See `TASK.md` and `CONTRACT.md`. Summary: new
`src/features/live-ai-news/actions.ts` Server Action boundary
(`prepareAiNewsDigestRun`, `requestApprovedAiNewsDigestRun`) that re-checks
the live kill switches *before* any News/Groq call — closing a safety gap
found during design (C1/C2 previously had no runtime-level guard, only a
test-time opt-in flag) — wired into a new two-step "Recipe 실행" UI section
in `recipe-first-experience.tsx`.

## Validation

```text
npx vitest run src/features/live-ai-news/actions.test.ts
PASS — 5/5

npm run typecheck / lint / vitest run
PASS — 94 test files passed, 3 skipped; 961 tests passed, 5 skipped
(956 -> 961: +5 new tests, 0 regressions)

npm run dev + curl http://localhost:3000
HTTP 200, SSR shell renders, no server error
```

Full interactive browser click-through not performed (see TASK.md
Verification section) — no headless-browser tool available in this
environment. The safety-critical property (zero external calls while
disabled) is proven directly by unit tests spying on `globalThis.fetch`,
which is the part of this Sprint that actually carries risk.

## Out Of Scope Preserved

- No live execution performed; `.env.local`'s
  `BUILDFLOW_LIVE_SLACK_WRITE_ENABLED` remains `false` at rest, unchanged
  by this Sprint.
- No Scheduler, no additional Destination, no DB persistence of run
  results (Steps 9-12 and later).

## MVP Impact

Qualitative: this is the first point where a user could, with the
operator's kill switches on, press one button in the actual product UI and
get the real AI-news Slack digest — the gap identified earlier in this
session between "the runtime is live-verified" (Step 1) and "a user can
trigger it" is now closed at the code level. Not quantified — no live run
was performed to measure against, and this UI path has no existing usage
baseline.

## Next Gate

Roadmap Step 9 (Execution Progress UI) and Step 10 (Evidence/Result UX) —
the current "Recipe 실행" section shows only a final success/failure
message, not step-by-step progress or persisted Evidence.
