# LV5-DUAL-EXTERNAL-BUILDER-ADAPTER-001 Task

## Status

```text
IMPLEMENTATION AUTHORIZED
EXTERNAL PLATFORM CALLS: NOT APPROVED
CREDENTIAL USE: NOT APPROVED
DB / MIGRATION: NOT APPROVED
COMMIT / PUSH / DEPLOY: NOT APPROVED
```

## Objective

Compile the existing simulated inquiry Canonical Blueprint into deterministic
internal Make Scenario and n8n Workflow previews, normalize fixture results,
and send them through the shared simulated Evidence and Acceptance Verdict
flow.

## Scope

- New isolated `src/features/external-builders/` compilers, result adapters,
  capability matrix, fixtures, tests, and `/app/builder-adapter-lab` Route.
- Reuse of existing verification-loop contracts only; no change to their types
  or to Core Runtime, Provider, MCP, or Product Runtime.

## Explicit Limit

Every artifact is an internal preview. Actual Make/n8n module and node schemas,
credentials, scenario/workflow creation, activation, execution, result logs,
and platform API compatibility remain `REQUIRES_REAL_PLATFORM_VALIDATION`.
