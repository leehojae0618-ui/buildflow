# MCP-FOUNDATION-001 — Report

## Status

CLOSED / COMPLETE — INDEPENDENT RE-REVIEW PASS

## Summary

MCP-FOUNDATION-001 created the contract foundation for BuildFlow Agents to
discover, evaluate, approve, and verify external MCP Tools without executing
them in this Sprint.

The Sprint added pure TypeScript contracts and validators for MCP Server
Registry, Tool Definition, Discovery Snapshot, Permission, Risk, Approval,
Safety, and Evidence. It does not connect to any MCP Server and does not invoke
any Tool.

## Completed Scope

- MCP Server Registry contract
- MCP Tool Definition contract
- Tool Discovery Snapshot contract
- Compatibility, version, trust, and health contract
- Credential Reference isolation contract
- Permission, Risk, and Approval policy contract
- Tool allowlist and server-side input validation contract
- Timeout, retry, idempotency, and rate-limit policy contract
- Safe Result and sanitized Verification Evidence contract
- BPS MCP dependency mapping contract
- Registry / Tool / Discovery validator pure functions
- Unit tests

## Implemented Files

- `src/features/mcp/types.ts`
- `src/features/mcp/validator.ts`
- `src/features/mcp/index.ts`
- `src/features/mcp/validator.test.ts`

## Scope Boundaries Confirmed

The following work was intentionally not included:

- Actual MCP Server connection
- Tool Invocation
- Gateway Runtime execution
- Provider execution
- Marketplace implementation
- UI implementation
- DB migration
- Agent Generator integration
- Provisioning execution path integration
- Generated Agent MCP Server publication
- Secret access or Vault read

## Security Notes

- Credential contracts are reference-only.
- Secret values are not represented in contracts, tests, snapshots, errors, or
  evidence.
- Raw MCP Tool results are not stored.
- Safe Result contracts require `storeRawResult: false`.
- External writes, destructive actions, cost impact, and permission expansion
  require approval by contract.

## Validation Status

Final quality gate after remediation: PASS

- MCP focused tests: PASS — 18 tests
- `npm test`: PASS — 63 files / 668 tests, 1 gated live test skipped
- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- Secret pattern scan: PASS

The independent review identified P1-001, P1-002, and P2-001. The approved
remediation was committed at `619b480`; its independent re-review passed with
P0/P1/P2 `0/0/0`.

## MVP Impact

MCP-FOUNDATION-001 strengthens the AI Agent Builder direction by defining how
Agents may safely reference external MCP Servers and Tools before runtime
execution is implemented.

This is a qualitative MVP impact. A quantified percentage is not recorded
because the Sprint adds a contract foundation rather than a user-facing runtime
capability.

## Technical Debt and Follow-up

MCP-FOUNDATION-001 reduces the design risk captured in:

- TD-018 MCP Trust Registry
- TD-019 MCP Version Drift
- TD-020 MCP Prompt Injection
- TD-021 MCP Excess Permission
- TD-022 MCP Raw Result Exposure
- TD-023 MCP Cost Runaway
- TD-024 MCP Non-idempotent Retry
- TD-025 MCP Availability and Fallback

Remaining follow-up belongs to later approved Sprints:

- Actual MCP Registry persistence
- Gateway Runtime execution
- Tool Invocation and result sanitization
- Agent Generator MCP Tool resolution
- Agent Validation evidence gate integration
- Agent Package MCP dependency export
- Marketplace MCP trust display

## Commit and Push

- Implementation commit: `e3344f2 feat: add mcp foundation contracts`
- Report and remediation commits: included in `origin/main`
- Push: complete for the approved closeout baseline

## PM/CTO Review Request

MCP-FOUNDATION-001 is closed. Any follow-up requires a new approved Sprint.
