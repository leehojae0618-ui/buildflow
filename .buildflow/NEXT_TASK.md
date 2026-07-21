# Next Task

## Candidate

RUNTIME-STEP-CONTRACT-001

## Status

```text
NOT APPROVED
NOT ACTIVE
NOT SCOPE FROZEN
```

## Required Pre-Activation Gate

Scope Freeze review is required before this candidate can move to
`.buildflow/CURRENT_TASK.md`.

## Context

`ARCHITECTURE-AI-RUNTIME-REVIEW-001` is closed. The approved long-term AI
Runtime Decision Lock is recorded in:

- Architecture Review Checkpoint: `b2802de`
- Decision Lock Checkpoint: `38c589b`
- Decision Recommendation: `KEEP CURRENT`
- Decision Lock: APPROVED

## Candidate Boundary

The next task candidate should be reviewed as a contract-only Runtime Step scope
before approval. This candidate is not approval for:

- Runtime execution implementation;
- Provider Invocation implementation;
- MCP Invocation or Gateway Runtime implementation;
- Runtime Planner or Runtime Compiler implementation;
- Budget Router implementation;
- DB, API, UI, deployment, or Marketplace work.

## Next Action

PM/CTO should review and scope-freeze `RUNTIME-STEP-CONTRACT-001` before any
work begins.
