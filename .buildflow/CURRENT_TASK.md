# Current Task

## Task ID

AGENT-GENERATOR-001

## Title

Agent Tool Resolution Planner

## Status

REVIEW

## Goal

Agent Capability Requirement와 MCP Tool Contract 후보를 받아
`RESOLVED`, `UNSUPPORTED`, `USER_ACTION_REQUIRED`, `APPROVAL_REQUIRED`
상태의 Agent Tool Resolution Plan을 생성하는 순수 함수와 타입을 구현한다.

이번 Sprint는 실제 Agent 실행이나 MCP Tool 호출을 구현하지 않는다. 목적은
향후 Agent Generator가 Requirement, Agent Blueprint, MCP Tool Contract를
안전하게 조합하기 위한 Source of Truth를 만드는 것이다.

## Scope

- Agent Capability Requirement type
- MCP Tool Candidate type
- Tool Resolution Status:
  - `RESOLVED`
  - `UNSUPPORTED`
  - `USER_ACTION_REQUIRED`
  - `APPROVAL_REQUIRED`
- `resolveAgentToolRequirements` pure function
- Capability ↔ MCP Tool capability matching
- Credential availability check by input flag only
- Approval requirement check by contract only
- Unresolved dependency report
- Unit tests

## Excluded

- Actual MCP Tool Invocation
- Gateway Runtime execution
- Provider execution
- Marketplace implementation
- UI implementation
- DB migration
- Provisioning execution path integration
- Live Credential or Vault access
- Credential validation
- Requirement Engine direct integration
- Build Planner direct integration
- Agent Runtime Compiler
- LLM prompt-based arbitrary Tool selection
- Automatic Commit
- Push

## First Safe Implementation Unit

Only the following files may be created or modified for the first implementation
unit:

- `src/features/agents/tool-resolution.ts`
- `src/features/agents/tool-resolution.test.ts`
- `src/features/agents/index.ts`

The first unit must remain pure TypeScript contract and resolver work. It must
not call external services, read Credentials, create database tables, execute
Provider commands, invoke MCP Tools, or connect to any Runtime path.

## Current Stage

- MCP-FOUNDATION-001 closed and pushed: PASS
- AGENT-GENERATOR-001 approved: PASS
- Scope frozen: PASS
- Sprint documents created: PASS
- First implementation unit: PASS
- Agent Capability Requirement type: PASS
- MCP Tool Candidate type: PASS
- Tool Resolution Status contract: PASS
- `resolveAgentToolRequirements` pure function: PASS
- Capability to MCP Tool capability matching: PASS
- Credential availability check by input flag only: PASS
- Approval requirement check by contract only: PASS
- Unresolved dependency report: PASS
- Unit tests: PASS
- Out-of-scope MCP Tool Invocation, Gateway Runtime, Provider, Marketplace, UI, DB, Provisioning, Credential, Requirement Engine, Build Planner, Agent Runtime Compiler, and LLM arbitrary Tool selection changes: NOT INCLUDED
- Final quality gate: PASS
- Next required step: PM/CTO Review

## Product Direction Note

BuildFlow의 신규 제품 개발 기본 방향은 AI Agent 자동 구축, 배포, 검증,
BPS Package 공유다. AGENT-GENERATOR-001은 Agent가 사용할 Tool 후보를
선택·차단·사용자 작업·승인 필요 상태로 분류하는 계획 계층이며, 실제 실행
또는 Runtime 연결은 이후 별도 Sprint에서 다룬다.

## Preserved Work

`CAPABILITY-002`, `LIVE-EVIDENCE-001/002`, `STABILIZE-READY-001`,
`AGENT-FOUNDATION-001`, `MCP-FOUNDATION-001`, `PROJECT-REVIEW-001`,
`PRODUCT-REVIEW-003.5`, `HARDEN-003`, `MCP-STRATEGY-001`의 완료 문서와
커밋 이력을 삭제하거나 덮어쓰지 않는다.
