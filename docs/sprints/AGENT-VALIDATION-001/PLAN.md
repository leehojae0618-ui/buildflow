# AGENT-VALIDATION-001 — Plan

## Status

APPROVED / SCOPE FROZEN

## Objective

Create a pure validation gate that checks Agent Definition and Tool Resolution
Plan readiness before any runtime execution, persistence, or READY decision.

## Work Units

### Unit 1 — Validation Gate Contract and Pure Validator

Target files:

- `src/features/agents/validation-gate.ts`
- `src/features/agents/validation-gate.test.ts`
- `src/features/agents/index.ts`

Scope:

- Validation input and output types
- Safe blocking reason codes
- Agent Definition and Blueprint consistency check
- Tool Resolution Plan validation
- Required capability coverage validation
- Approval/user-action unresolved dependency handling
- Permission/risk contract checks
- Unit tests

Validation:

- `npx vitest run src/features/agents/validation-gate.test.ts`
- `npm run typecheck`
- `git diff --check`

### Unit 2 — Contract Review and Boundary Check

Scope:

- Confirm no MCP Tool Invocation exists
- Confirm no Gateway Runtime execution exists
- Confirm no Provider execution path is imported
- Confirm no live Credential or Vault access exists
- Confirm no READY persistence or Verification persistence integration exists
- Confirm validator responsibility does not replace Runtime Compiler

Validation:

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- Secret pattern scan

### Unit 3 — Sprint Report and PM/CTO Review

Target files:

- `docs/sprints/AGENT-VALIDATION-001/REPORT.md`
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
- No Runtime Compiler integration
- No READY persistence integration
- No Verification persistence integration

## Risk Controls

- Keep Unit 1 implementation inside `src/features/agents/`.
- Use pure functions only.
- Accept Agent Definition, Blueprint, Tool Resolution Plan, and MCP contracts as
  explicit input data.
- Do not import Vault, Provider, Supabase, Runtime, Marketplace, Provisioning,
  or Verification persistence modules.
- Return explicit safe blocking reasons instead of executing or mutating
  anything.

## Review Gates

1. Unit implementation review
2. Full quality gate
3. Sprint report
4. PM/CTO Review
5. Commit Approval
6. Push Approval
