# Next Task

## Candidate

RUNTIME-STEP-CONTRACT-001

## Status

```text
APPROVED
NOT ACTIVE
SCOPE FROZEN
```

## Required Pre-Activation Gate

Scope Freeze is approved. A checkpoint commit and separate activation approval
are required before this candidate can move to `.buildflow/CURRENT_TASK.md`.

Scope review draft:

- `docs/sprints/RUNTIME-STEP-CONTRACT-001/TASK.md`

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

PM/CTO should approve a separate activation checkpoint before any
`RUNTIME-STEP-CONTRACT-001` work begins.
