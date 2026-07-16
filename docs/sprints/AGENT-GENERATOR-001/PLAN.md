# AGENT-GENERATOR-001 — Plan

## Status

APPROVED / SCOPE FROZEN

## Objective

Create a pure Agent Tool Resolution Planner that can evaluate Agent capability
requirements against MCP Tool contract candidates without executing Tools or
connecting to Runtime systems.

## Work Units

### Unit 1 — Tool Resolution Contract and Pure Resolver

Target files:

- `src/features/agents/tool-resolution.ts`
- `src/features/agents/tool-resolution.test.ts`
- `src/features/agents/index.ts`

Scope:

- Agent Capability Requirement type
- MCP Tool Candidate type
- Tool Resolution Status
- `resolveAgentToolRequirements`
- Capability matching
- Credential availability check by input flag
- Approval requirement check by Tool contract
- Unresolved dependency report
- Unit tests

Validation:

- `npx vitest run src/features/agents/tool-resolution.test.ts`
- `npm run typecheck`
- `git diff --check`

### Unit 2 — Contract Review and Boundary Check

Scope:

- Confirm no MCP Tool Invocation exists
- Confirm no Gateway Runtime execution exists
- Confirm no Provider execution path is imported
- Confirm no live Credential or Vault access exists
- Confirm no Requirement Engine or Build Planner direct integration exists
- Confirm resolver responsibility does not replace Agent Foundation generator

Validation:

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- Secret pattern scan

### Unit 3 — Sprint Report and PM/CTO Review

Target files:

- `docs/sprints/AGENT-GENERATOR-001/REPORT.md`
- `.buildflow/CURRENT_TASK.md`
- `.buildflow/STATUS.md`

Scope:

- Completed scope
- Excluded scope confirmation
- Quality gate result
- MVP Impact
- Remaining Technical Debt
- PM/CTO Review request

## Non-Goals

- No actual MCP Tool Invocation
- No Gateway Runtime execution
- No Provider execution
- No Marketplace implementation
- No UI implementation
- No DB migration
- No Provisioning execution path integration
- No live Credential or Vault access
- No Credential validation
- No Requirement Engine direct integration
- No Build Planner direct integration
- No Agent Runtime Compiler
- No LLM prompt-based arbitrary Tool selection

## Risk Controls

- Keep Unit 1 implementation inside `src/features/agents/`.
- Use pure functions only.
- Accept Tool candidates as explicit input data.
- Do not import Vault, Provider, Supabase, Runtime, Marketplace, Requirement
  Engine, or Build Planner modules.
- Return explicit status instead of executing or mutating anything.

## Review Gates

1. Unit implementation review
2. Full quality gate
3. Sprint report
4. PM/CTO Review
5. Commit Approval
6. Push Approval
