# PRODUCT-RUNTIME-REAL-AI-SLICE-001 Plan

## Status

```text
STATUS: IMPLEMENTATION IN PROGRESS
IMPLEMENTATION AUTHORITY: APPROVED — CURRENT SCOPE ONLY
COMMIT / PUSH / DEPLOY AUTHORITY: NONE
LIVE OPENAI / EXTERNAL / DB AUTHORITY: NONE
```

## Objective

Implement one direct-input customer-reply path. A BF0 design describes the
Agent; a separate runtime input is the only text eligible for Provider user
input. The product may display a successful AI draft only from invocation-local
product output capture.

## Boundaries

- Reuse the existing projection, approval, Core Runtime, and in-memory Evidence
  contracts without adding raw output to any Core result or Evidence record.
- Require direct input, local browser result, no external source/destination,
  and explicit user action.
- Require both configured OpenAI and an explicit feature flag; the flag defaults
  to false.
- Validate with injected mocks only. No OpenAI request, DB operation, external
  service action, Commit, Push, or Deploy is part of this Sprint.
