# AGENT-FOUNDATION-001 — Report

## Status

IMPLEMENTATION COMPLETE — PM/CTO REVIEW REQUIRED

## Summary

AGENT-FOUNDATION-001 created BuildFlow's first AI Agent contract foundation.
The Sprint stayed within the approved Scope Frozen boundary: it defines Agent
capabilities, block contracts, blueprint and definition contracts, a pure Agent
Definition generator, validation rules, and the `ai-inquiry-v1` compatibility
mapping.

This Sprint did not connect the contract layer to Provider execution,
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

## Product Direction

This Sprint supports the product decision that BuildFlow's primary direction is
AI Agent automatic build, deployment, verification, and BPS Package sharing.

`general-crud-v1` remains preserved as regression and live evidence from
CAPABILITY-002, but it was not promoted into the Agent contract model.

## Validation Status

Final quality gate: PASS

- `npm test`: PASS — 40 test files, 180 tests
- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- Secret pattern scan: PASS

PM/CTO Review is required before Commit Approval.

## MVP Impact

Qualitative impact: High.

BuildFlow now has an explicit Agent contract layer. This turns the existing
AI Inquiry service from a template-only implementation into the first mapped
Agent Blueprint candidate, while keeping runtime execution and MCP integration
out of scope. The impact is not quantified because there is no agreed metric
for Agent contract completeness yet.

## Technical Debt and Follow-up

- MCP Registry and Gateway remain planned for `MCP-FOUNDATION-001`.
- Tool invocation and Tool Resolver remain outside this Sprint.
- Agent Generator integration with Requirement and Blueprint selection remains
  a future Sprint.
- Marketplace publishing remains outside this Sprint.

## Commit and Push

- Commit: pending PM Review and Commit Approval
- Push: prohibited until separate approval
