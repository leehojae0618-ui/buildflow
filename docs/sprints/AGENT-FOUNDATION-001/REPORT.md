# AGENT-FOUNDATION-001 — Report

## Status

CLOSED / COMPLETE / INDEPENDENT DOCUMENTATION REVIEW COMPLETE

## Summary

AGENT-FOUNDATION-001 created BuildFlow's first AI Agent contract foundation.
The Sprint stayed within the approved Scope Frozen boundary: it defines Agent
capabilities, block contracts, blueprint and definition contracts, a pure Agent
Definition generator, validation rules, and the `ai-inquiry-v1` compatibility
mapping.

This original Sprint did not connect the contract layer to Provider execution,
Provisioning, MCP Runtime, Marketplace, UI, or database migrations.

## Completed Scope

- Agent Capability Model
- Delivery Mode
  - `HEADLESS`
  - `CHAT`
  - `BUSINESS`
- Interface Mode
  - `API`
  - `WEBHOOK`
  - `SCHEDULE`
  - `WEB_CHAT`
  - `MCP_SERVER`
- Block Contract
  - Model
  - Prompt
  - Trigger
  - Tool
  - Memory
  - Knowledge
  - Guardrail
  - Output
  - Delivery Surface
- MCP Reference Contract
  - MCP Server ID
  - Tool Capability
  - Permission
  - Approval
  - Input schema reference
  - Output schema reference
- Agent Blueprint Contract and Version
- Agent Definition Generator contract and pure function
- Contract Validator
- `ai-inquiry-v1` compatibility mapping
- Unit tests

## Implemented Files

- `src/features/agents/types.ts`
- `src/features/agents/validator.ts`
- `src/features/agents/generator.ts`
- `src/features/agents/compatibility.ts`
- `src/features/agents/index.ts`
- `src/features/agents/validator.test.ts`
- `src/features/agents/generator.test.ts`
- `src/features/agents/compatibility.test.ts`

## Scope Boundaries Confirmed

- DB migration: not included
- Provider execution: not included
- MCP Runtime: not included
- MCP Registry or Gateway: not included
- Marketplace: not included
- UI: not included
- Provisioning execution path integration: not included
- Requirement analysis integration: not included
- Credential calculation: not included
- `general-crud-v1` Agent promotion: not included

## Later Related Work — Not Retroactive Scope

The following later Agent-related work is present at current `origin/main`, but
is not part of this Sprint's original completed scope:

- Tool Resolution planner: `54a438a`
- Agent Validation Gate: `2d38d91`
- Agent package profile and evidence contracts: `8fe65ad`, `16593e1`, and
  later package checkpoints
- Runtime Plan integration: `6060a67` and its follow-up runtime work

Runtime Plan consumes validated Agent Blueprint and Definition contracts to
construct a plan. Agent Foundation itself does not directly invoke a Provider
or MCP tool, execute Runtime work, persist raw results, bypass approval, or own
queue and retry loops.

## Product Direction

This Sprint supports the product decision that BuildFlow's primary direction is
AI Agent automatic build, deployment, verification, and BPS Package sharing.

`general-crud-v1` remains preserved as regression and live evidence from
CAPABILITY-002, but it was not promoted into the Agent contract model.

## Validation Status

Current validation baseline: PASS

- Agent-focused tests: PASS — 20 files / 418 tests
- Full suite: PASS — 63 files / 668 tests; 1 gated live test skipped
- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- Secret pattern scan: PASS

Independent documentation review found no implementation finding. Current
closeout status is recorded in `CLOSEOUT.md`.

## MVP Impact

Qualitative impact: High.

BuildFlow now has an explicit Agent contract layer. This turns the existing
AI Inquiry service from a template-only implementation into the first mapped
Agent Blueprint candidate, while keeping runtime execution and MCP integration
out of scope. The impact is not quantified because there is no agreed metric
for Agent contract completeness yet.

## Technical Debt and Follow-up

- MCP Registry and Gateway were later addressed only as contract foundation
  work in `MCP-FOUNDATION-001`; live invocation remains outside this Sprint.
- Tool invocation remains outside this Sprint. Tool Resolution exists as later
  related work and is not retroactively included here.
- Agent Generator integration with Requirement and Blueprint selection remains
  a future approved Sprint.
- Marketplace publishing remains outside this Sprint.

## Commit and Push

- Original implementation: `2fce847 feat: add agent foundation contracts`
- Generator: `01f2350 feat: add agent definition generator`
- Compatibility mapping: `a822640 feat: add ai inquiry agent compatibility mapping`
- Original report: `38ec6ad docs: report agent foundation implementation`
- Historical implementation checkpoints are included in `origin/main`.
- No new commit or push is authorized by this report.
