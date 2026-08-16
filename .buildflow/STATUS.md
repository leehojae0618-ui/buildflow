# BuildFlow Status

Current-state-only. Completed/historical Sprint detail lives in
`docs/SPRINT_HISTORY.md`; per-Sprint evidence lives in `docs/sprints/<id>/`.

## Repository / HEAD

- Local HEAD: `234b07a` — matches `origin/main` (pushed 2026-08-16).
- Working Tree: CLEAN.

## Current Sprint

- No active implementation Sprint. `LIVE-RECIPE-AI-NEWS-001` (roadmap
  Step 1) and `RECIPE-EXECUTION-CONTRACT-001` (roadmap Step 2) are both
  CLOSED / COMPLETE — committed (`234b07a`) and pushed. Detail:
  `docs/sprints/RECIPE-EXECUTION-CONTRACT-001/TASK.md`,
  `docs/sprints/RECIPE-EXECUTION-CONTRACT-001/CONTRACT.md`,
  `docs/sprints/RECIPE-EXECUTION-CONTRACT-001/REPORT.md`.
- `RECIPE-EXECUTION-CONTRACT-001` scope: added
  `src/features/recipes/execution-contract.ts` (generic
  `RecipeInputPort`/`RecipeProcessorPort`/`RecipeDestinationPort`, reusing
  `Recipe["trigger"]` and `LiveRecipeEvidence` rather than redefining them),
  plus three thin adapter functions in
  `src/features/live-ai-news/real-adapters.ts` that conform the existing
  AI-news Recipe's News/Groq/Slack pieces to it. No existing guarded file
  (`live-recipe-service.ts`, `pipedream-real-adapter.ts`,
  `pipedream-port.ts`) was modified; no live execution occurred.
- Implementation Authority: `RECIPE-EXECUTION-CONTRACT-001` Scope +
  Implementation Authority approved 2026-08-16 (R2; implementation + test +
  Commit bundled per `DEVELOPMENT_CHARTER.md` §11); Commit and Push both
  performed. Per 2026-08-16 user direction, subsequent R2 roadmap steps with
  no live external write/DB/OAuth may proceed through Commit + Push without
  a separate pause at each one (Scope approval per step is still required;
  live external actions always remain their own separate approval gate).

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
  (953 tests passing, 0 regressions); no live execution needed for this step
- Controlled runtime: IMPLEMENTED IN CODE, present in `main`

## Current NOT VERIFIED

- Persistent DB Evidence
- Production readiness / Deploy
- Natural-language → Recipe conversion (roadmap Step 3, not started)

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

- Roadmap Step 3: natural-language → Recipe conversion. Scope proposal to
  follow; live external actions still require their own separate approval
  regardless of the streamlined R2 Commit/Push flow noted above.

## Prohibited Without Separate Approval

Additional Slack write, Scheduler, production Pipedream, DB migration, MCP
invocation, additional news/API sources, Deploy, Merge, Release.
