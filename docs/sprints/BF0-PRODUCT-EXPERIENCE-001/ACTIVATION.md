# BF0 Product Experience Activation Record

## Activation

```text
SPRINT ID: BF0-PRODUCT-EXPERIENCE-001
ACTIVATION DATE: 2026-08-03 (Asia/Seoul)
ACTIVATED BY: USER / PRODUCT OWNER
PREVIOUS PHASE: SCOPE FREEZE / DOCUMENTATION
CURRENT PHASE: ACTIVE / UI-ONLY IMPLEMENTATION
SCOPE STATUS: FROZEN
IMPLEMENTATION AUTHORITY: APPROVED — FROZEN UI-ONLY SCOPE
COMMIT AUTHORITY: NONE
PUSH AUTHORITY: NONE
DEPLOY AUTHORITY: NONE
```

## Approved Scope

- Recreate the BF_0 onboarding-to-design-draft journey with Next.js and
  TypeScript UI components.
- Keep choice state, workflow projection, cost/access copy, and build-plan
  generation in a client-side, non-persistent ViewModel.
- Provide keyboard-accessible controls, responsive layouts, and
  reduced-motion behavior.
- Add focused UI/ViewModel tests and run the approved local validation suite.

## Explicit Exclusions

- No database, migration, RLS, server Draft persistence, API Route, Server
  Action, authentication, Runtime, Provider, Evidence, Approval, MCP, queue,
  retry, streaming, OAuth, or external-service integration.
- No fake connection, cost, execution, completion, or Agent-built claim.
- No package dependency addition, Commit, Push, Merge, Release, Deploy, or
  live external action.

## Existing Change Preservation

Existing dirty and untracked files remain user-owned. In particular, the
Visual Closed Beta Slice route, requirement summary, autonomous journey files,
and their Sprint documents must not be reset, overwritten, or automatically
staged. Any overlap that cannot be preserved is a stop condition.

## Stop Conditions

- A required UI behavior needs persistence, DB, Runtime, Provider, external
  service, dependency, or contract changes.
- The frozen BF0 scope cannot be implemented without overwriting an existing
  user change.
- A Secret, credential, or live external action is required.
- Commit, Push, Deploy, or other unapproved authority is needed.

## Next Gate

After implementation and validation, Codex submits the implementation report
for independent Claude UI implementation audit. No Commit is authorized.
