# MCP-FOUNDATION-001 — Plan

## Status

APPROVED / SCOPE FROZEN

## Objective

Create the MCP contract foundation that allows future BuildFlow Agents to
discover, evaluate, approve, and verify external MCP Tools without executing
them in this Sprint.

## Work Units

### Unit 1 — MCP Contract Types and Validators

Target files:

- `src/features/mcp/types.ts`
- `src/features/mcp/validator.ts`
- `src/features/mcp/index.ts`
- `src/features/mcp/validator.test.ts`

Scope:

- MCP Server Registry type
- MCP Tool Definition type
- Discovery Snapshot type
- Credential Reference type
- Permission / Risk / Approval policy type
- Timeout / Retry / Idempotency / Rate Limit policy type
- Safe Result / Evidence contract type
- BPS dependency mapping type
- Pure validators
- Unit tests

Validation:

- `npx vitest run src/features/mcp/validator.test.ts`
- `npm run typecheck`
- `git diff --check`

### Unit 2 — Contract Review and Boundary Check

Scope:

- Confirm no runtime connection exists
- Confirm no Provider execution path is imported
- Confirm no Credential secret access exists
- Confirm validator responsibility does not overlap Agent Foundation validator
- Confirm BPS mapping remains contract-only

Validation:

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- Secret pattern scan

### Unit 3 — Sprint Report and PM/CTO Review

Target files:

- `docs/sprints/MCP-FOUNDATION-001/REPORT.md`
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

- No actual MCP connection
- No Tool Invocation
- No Gateway Runtime
- No Provider execution
- No Marketplace implementation
- No UI implementation
- No DB migration
- No Agent Generator integration
- No Provisioning execution integration
- No Generated Agent MCP Server publication

## Risk Controls

- Keep all implementation inside `src/features/mcp/` for Unit 1.
- Use pure functions only.
- Do not import Provider, Vault, Supabase, Runtime, or Marketplace modules.
- Treat all Tool result examples as sanitized fixtures.
- Keep BPS references as dependency declaration contracts only.

## Review Gates

1. Unit implementation review
2. Full quality gate
3. Sprint report
4. PM/CTO Review
5. Commit Approval
6. Push Approval
