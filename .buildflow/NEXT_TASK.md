# Next Task

## Status

NEXT CANDIDATE / NOT APPROVED / NOT SCOPE FROZEN

## Candidate

LIVE-EVIDENCE-AGENT-001

## Title

AI Agent Live Evidence and Package Readiness QA

## Candidate Status

NOT APPROVED / NOT SCOPE FROZEN

This document is a candidate placeholder only. It does not authorize
implementation, live execution, deployment, or Provider actions.

LIVE-EVIDENCE-AGENT-001 must receive explicit PM/CTO approval and Scope Frozen
status before it can move to `.buildflow/CURRENT_TASK.md`.

## Context

The completed Agent foundation now includes:

- Agent Definition contracts
- MCP Registry and Tool contracts
- Agent Tool Resolution Planner
- Agent Validation Gate
- BPS-compatible Agent Package/Profile contract

The natural next step is to verify, with explicit approval, whether the Agent
path can produce live evidence for a representative AI Agent and package
readiness flow. This is aligned with the Roadmap's Agent Evidence step, but this
candidate name uses `LIVE-EVIDENCE-AGENT-001` to emphasize evidence-first QA.

## Candidate Scope Draft

- Confirm the representative Agent target and evidence checklist
- Reuse existing validated Agent Definition and Package/Profile contracts
- Verify required Provider Credentials are present before any live action
- Verify approval boundaries before any external resource action
- Collect safe Evidence for Agent build, deployment, verification, and package
  readiness where supported
- Record explicit PASS / BLOCKED / NOT SUPPORTED states
- Preserve secret-safe logs, snapshots, and reports

## Candidate Exclusions

- Unapproved live execution
- Unapproved deployment
- Runtime implementation
- New Provider implementation
- MCP Tool Invocation unless separately approved and scoped
- Gateway Runtime implementation
- Marketplace implementation
- Package publishing
- UI implementation
- DB migration
- Credential or Vault value exposure
- Mock success or placeholder READY

## Candidate Risks

- Live Credential availability and quota may block evidence.
- Provider account policy may require user action.
- Existing Agent Runtime may support only the representative `ai-inquiry-v1`
  path.
- Package/Profile contract readiness does not equal Marketplace publish
  readiness.

## Candidate Notes

Do not start implementation or live QA from this placeholder. The candidate must
be reviewed and either approved as a live evidence Sprint or renamed/aligned with
the Roadmap's `AGENT-EVIDENCE-001` before activation.

## Draft Task Document

Draft scope has been prepared in:

- `docs/sprints/LIVE-EVIDENCE-AGENT-001/TASK.md`

The draft is not approval. It exists to support PM/CTO review of the live action
boundary, Credential boundary, cost boundary, and Evidence requirements.

## Approval Questions Before Activation

1. Will LIVE-EVIDENCE-AGENT-001 allow actual live execution and deployment, or
   only checklist-based QA against existing Evidence?
2. Which representative Agent Project is in scope?
3. Which Provider Credentials may be used, and are they test-only?
4. What exact external resource actions are approved?
5. Is any cost-incurring action approved?
6. Is MCP Tool Invocation included, or explicitly deferred?
