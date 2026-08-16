# BuildFlow Status

Current-state-only. Completed/historical Sprint detail lives in
`docs/SPRINT_HISTORY.md`; per-Sprint evidence lives in `docs/sprints/<id>/`.

## Repository / HEAD

- Local HEAD: `1a2d41b` (Governance v2, Risk Tier R0-R3) — ahead of
  `origin/main` (`69a6aef`) by 1 commit; Push not yet performed.
- Working Tree: not clean — Composite Manual Recipe E2E implementation
  pending Commit Approval (see Current Sprint below).

## Current Sprint

- Sprint: `LIVE-RECIPE-AI-NEWS-001`
- Gate: C1 (News RSS), C2 (Groq summary), and the C3 guarded Slack-write path
  are each **VERIFIED independently**. The Composite C1→C2→C3 Recipe E2E code
  path (`runNewsToGroqToSlackGate`) is now **IMPLEMENTED and mock-verified**,
  with a dedicated opt-in live test added
  (`BUILDFLOW_LIVE_COMPOSITE_RECIPE_E2E=1`). It remains **NOT VERIFIED LIVE**
  — the opt-in test was not executed with real credentials in this change.
  Detail: `docs/sprints/LIVE-RECIPE-AI-NEWS-001/REPORT.md`,
  `docs/sprints/LIVE-RECIPE-AI-NEWS-001/TASK.md`.
- Implementation Authority: APPROVED — guarded C3 safety remediation, plus
  Composite Manual Recipe E2E Scope + Implementation Authority approved
  2026-08-16 (implementation + test only; live composite execution remains a
  separate gate). Governance v2 doc changes (this file and the three files
  below) separately approved 2026-08-16, scoped to doc edit + Commit; Push
  approved separately.

## Current Verified Capability

- C1 News RSS fetch: VERIFIED (live)
- C2 Groq summary: VERIFIED (live)
- C3 guarded Slack write (`runApprovedSlackDigestWrite`): VERIFIED (live,
  one-shot; write kill switch restored to `false` immediately after)
- Composite News → Groq → Guarded Slack single-path code
  (`runNewsToGroqToSlackGate`): IMPLEMENTED, mock-verified; live opt-in test
  added and skipped by default
- Controlled runtime: IMPLEMENTED IN CODE, present in `main`

## Current NOT VERIFIED

- Composite News → Groq → Guarded Slack single-path E2E — **live execution**
  (code path and test now exist; running it with real credentials needs a
  separate approval)
- Persistent DB Evidence
- Production readiness / Deploy

## Known Procedural Finding (historical, not hidden)

- Commit `c7674f0` was made during guarded C3 verification without a
  separate Commit approval beyond the live-execution approval (P1 gap).
  Retention of that commit was separately approved 2026-08-16, not
  retroactively asserted as originally authorized.

## Blockers

- None currently blocking `LIVE-RECIPE-AI-NEWS-001`.
- `LIVE-DB-VALIDATION-001` remains PAUSED / BLOCKED BY LOCAL ENVIRONMENT
  (Local Supabase healthcheck failure on the 8GB M1 environment); see
  `docs/SPRINT_HISTORY.md` Section 2.

## Next Eligible Action

- User decision: authorize the one-time live execution of the Composite
  Manual Recipe E2E test (`BUILDFLOW_LIVE_COMPOSITE_RECIPE_E2E=1`, real
  credentials, real Slack write to the approved channel), or move to the next
  roadmap step (Recipe Execution Contract). Live execution requires its own
  separate approval per `DEVELOPMENT_CHARTER.md` §11.

## Prohibited Without Separate Approval

Additional Slack write, Scheduler, production Pipedream, DB migration, MCP
invocation, additional news/API sources, Deploy, Merge, Release.
