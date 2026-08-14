# RECIPE-FIRST-BUILD-PACKAGE-001 Plan

## Status

```text
STATUS: ACTIVE / LOCAL IMPLEMENTATION ONLY
COMMIT / PUSH / DEPLOY: NOT AUTHORIZED
LIVE PROVIDER / API / OAUTH / EXTERNAL ENGINE / DB: NOT AUTHORIZED
```

## Objective

Extend the existing Recipe-First vertical slice from recommendation to a
truthful, engine-independent BuildPackage with connection, configuration,
missing-information, and test planning before any live connection begins.

## In Scope

- Explicit Recipe selection and selectable supported engine alternatives.
- Deterministic engine compatibility and recommendation.
- Canonical BuildPackage, ConnectionPlan, ConfigurationPlan, missing details,
  and TestPlan.
- Build Preparation UI with a no-op, truthful connection-start state.

## Exclusions

No OAuth, credentials, Provider/API calls, external workflow creation or
execution, DB migration, MCP invocation, Commit, Push, Deploy, or new runtime.
