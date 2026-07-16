# AGENT-PACKAGE-001 — Plan

## Status

APPROVED / SCOPE FROZEN

## Objective

Create the contract and pure validation layer that determines whether a
validated Agent can be represented as a BPS-compatible, secret-free Agent
Package/Profile.

## Work Units

### Unit 1 — Agent Package Profile Contract and Readiness Validator

Target files:

- `src/features/agents/package-profile.ts`
- `src/features/agents/package-profile.test.ts`
- `src/features/agents/index.ts`

Scope:

- Agent Package/Profile input and output types
- Package metadata checks
- Agent Definition reference checks
- MCP Server and Tool dependency declaration checks
- Capability and Interface declaration checks
- Credential Definition reference checks
- Permission, Risk, and Approval Requirement declaration checks
- Verification Rule and Fallback Policy declaration checks
- Secret-free export readiness checks
- Unit tests

Validation:

- `npx vitest run src/features/agents/package-profile.test.ts`
- `npm run typecheck`
- `git diff --check`

### Unit 2 — Contract Review and Boundary Check

Scope:

- Confirm no package archive writing exists
- Confirm no Marketplace publishing exists
- Confirm no Installer implementation change exists
- Confirm no MCP Tool Invocation exists
- Confirm no Gateway Runtime execution exists
- Confirm no Provider execution path is imported
- Confirm no live Credential or Vault access exists
- Confirm no UI or DB migration exists

Validation:

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- Secret pattern scan

### Unit 3 — Sprint Report and PM/CTO Review

Target files:

- `docs/sprints/AGENT-PACKAGE-001/REPORT.md`
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

- No Marketplace implementation
- No Package publishing
- No UI implementation
- No DB migration
- No actual MCP Tool Invocation
- No Gateway Runtime execution
- No Provider execution
- No live Credential or Vault access
- No Agent Runtime Compiler
- No BPS archive writing or file export
- No Installer implementation changes

## Risk Controls

- Keep Unit 1 implementation inside `src/features/agents/`.
- Use pure functions only.
- Accept Agent Definition, Tool Resolution, Validation Gate, and MCP package
  dependency data as explicit input.
- Do not import Vault, Provider, Supabase, Runtime, Marketplace, Installer,
  Provisioning, or file archive modules.
- Return explicit safe readiness issues instead of exporting, publishing, or
  mutating anything.

## Review Gates

1. Unit implementation review
2. Full quality gate
3. Sprint report
4. PM/CTO Review
5. Commit Approval
6. Push Approval
