# Current Task

## Task ID

MCP-FOUNDATION-001

## Title

MCP Server Registry and Secure Gateway Contract

## Status

CLOSED

## Goal

BuildFlow Agent가 외부 시스템에서 안전하게 행동할 수 있도록 MCP Server,
Tool, Discovery, Permission, Risk, Approval, Safety, Evidence의 계약과
순수 검증 계층을 만든다.

이번 Sprint는 실제 MCP Server 연결이나 Tool 실행을 구현하지 않는다. 목적은
향후 Agent Generator, Agent Validator, Agent Package, Marketplace가 공통으로
사용할 MCP 계약의 Source of Truth를 만드는 것이다.

## Scope

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

## Excluded

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
- Automatic Commit
- Push

## First Safe Implementation Unit

Only the following files may be created or modified for the first implementation
unit:

- `src/features/mcp/types.ts`
- `src/features/mcp/validator.ts`
- `src/features/mcp/index.ts`
- `src/features/mcp/validator.test.ts`

The first unit must remain pure TypeScript contract and validator work. It must
not call external services, read Credentials, create database tables, execute
Provider commands, or connect to any Runtime path.

## Current Stage

- AGENT-FOUNDATION-001 closed and pushed: PASS
- MCP-FOUNDATION-001 approved: PASS
- Scope frozen: PASS
- Sprint documents created: PASS
- First implementation unit: PASS
- MCP Server Registry contract: PASS
- MCP Tool Definition contract: PASS
- Tool Discovery Snapshot contract: PASS
- Compatibility, version, trust, and health contract: PASS
- Credential Reference isolation contract: PASS
- Permission, Risk, and Approval policy contract: PASS
- Tool allowlist and server-side input validation contract: PASS
- Timeout, retry, idempotency, and rate-limit policy contract: PASS
- Safe Result and sanitized Verification Evidence contract: PASS
- BPS MCP dependency mapping contract: PASS
- Registry / Tool / Discovery validator pure functions: PASS
- Unit tests: PASS
- Out-of-scope runtime, Provider, DB, Marketplace, UI, Agent Generator, and Provisioning execution changes: NOT INCLUDED
- Final quality gate: PASS
- PM/CTO Review: PASS
- Sprint closure: PASS
- Next required step: Select and approve the next Sprint candidate

## Product Direction Note

BuildFlow의 신규 제품 개발 기본 방향은 AI Agent 자동 구축, 배포, 검증,
BPS Package 공유다. MCP는 Agent가 외부 세계에서 행동하기 위한 표준 Tool
계층이지만, 실행 권한은 Compatibility, Permission, Risk, Approval,
Verification Gate를 통과한 경우에만 부여된다.

## Closure Note

MCP-FOUNDATION-001은 PM/CTO Review 완료 후 CLOSED 상태로 전환되었다.
현재 활성 구현 Sprint는 없다. 다음 Sprint는 `.buildflow/NEXT_TASK.md`의
후보를 PM/CTO가 승인하고 APPROVED / SCOPE FROZEN 상태로 확정한 뒤에만
시작할 수 있다.

## Preserved Work

`CAPABILITY-002`, `LIVE-EVIDENCE-001/002`, `STABILIZE-READY-001`,
`AGENT-FOUNDATION-001`, `PROJECT-REVIEW-001`, `PRODUCT-REVIEW-003.5`,
`HARDEN-003`, `MCP-STRATEGY-001`의 완료 문서와 커밋 이력을 삭제하거나
덮어쓰지 않는다.
