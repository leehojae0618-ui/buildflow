# MCP-FOUNDATION-001 — Task

## Status

APPROVED / SCOPE FROZEN

## Title

MCP Server Registry and Secure Gateway Contract

## Goal

BuildFlow Agent가 외부 시스템에서 안전하게 행동할 수 있도록 MCP Server,
Tool, Discovery, Permission, Risk, Approval, Safety, Evidence의 계약과
순수 검증 계층을 정의한다.

이번 Sprint는 MCP를 실제로 호출하는 Sprint가 아니다. MCP Server Registry와
Secure Gateway가 향후 구현될 때 따라야 할 contract와 validator를 만든다.

## Product Context

BuildFlow는 AI Agent Builder / AI Agent Factory다. Agent는 외부 시스템과
상호작용할 때 MCP Tool을 사용할 수 있지만, Tool 존재만으로 실행 권한이
생기지 않는다.

MCP-FOUNDATION-001은 다음 원칙을 Source of Truth로 만든다.

- Capability first, Tool second
- Registry 등록과 실행 권한 분리
- Credential Reference isolation
- Permission / Risk / Approval boundary
- Safe Result and sanitized Evidence
- No READY without sufficient MCP contract and Verification evidence

## Implementation Scope

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

## First Safe Implementation Unit

Target files:

- `src/features/mcp/types.ts`
- `src/features/mcp/validator.ts`
- `src/features/mcp/index.ts`
- `src/features/mcp/validator.test.ts`

Allowed work:

- TypeScript types
- Pure validation functions
- Deterministic test fixtures
- Unit tests

## Explicitly Out of Scope

- Actual MCP Server connection
- Actual Tool Invocation
- Gateway Runtime execution
- Provider execution
- Marketplace implementation
- UI implementation
- DB migration
- Agent Generator integration
- Provisioning execution path integration
- Generated Agent MCP Server publication
- Secret access or Vault reads
- LLM-generated arbitrary Tool or Command execution
- Automatic Commit
- Push

## Security Rules

- Secret values must never be represented in contracts, tests, logs, snapshots,
  errors, or evidence.
- Credential contracts may reference only credential identifiers, types, scopes,
  and requirements.
- Raw MCP Tool results are out of scope and must not be stored.
- Safe Result and sanitized Evidence contracts must exclude secrets, private
  provider diagnostics, and raw response bodies.
- Approval is required for external writes, cost, destructive actions, public
  changes, and permission expansion.

## Definition of Done

- Contract types implemented
- Pure validators implemented
- Unit tests PASS
- `npm test` PASS
- `npm run lint` PASS
- `npm run typecheck` PASS
- `npm run build` PASS
- `git diff --check` PASS
- Secret pattern scan PASS
- Sprint Report written
- PM/CTO Review requested
- Commit not created until explicit Commit Approval
- Push not performed until explicit Push Approval
