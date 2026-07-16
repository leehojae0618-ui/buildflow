# Current Task

## Task ID

AGENT-VALIDATION-001

## Title

Agent Definition and Tool Resolution Validation Gate

## Status

REVIEW

## Goal

Agent Definition, Agent Blueprint, MCP Tool Contract, Tool Resolution Plan을
실행 전에 검증하는 순수 Validation Gate를 만든다.

이번 Sprint는 실제 MCP Tool 호출, Gateway Runtime, Provider 실행, READY
영구 저장을 구현하지 않는다. 목적은 Agent Runtime 또는 READY 판단 이전에
어떤 조합이 안전하고 완전한지 판단할 수 있는 Source of Truth를 만드는
것이다.

## Scope

- Agent Definition validation against Agent Blueprint
- Tool Resolution Plan validation
- Required capability coverage validation
- MCP Tool permission and risk validation by contract
- Approval requirement coverage validation
- Credential / user-action unresolved dependency validation
- Safe READY-blocking reasons
- Pure validation functions
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
- Runtime Compiler integration
- READY persistence integration
- Verification persistence integration
- Automatic Commit
- Push

## First Safe Implementation Unit

Only the following files may be created or modified for the first implementation
unit:

- `src/features/agents/validation-gate.ts`
- `src/features/agents/validation-gate.test.ts`
- `src/features/agents/index.ts`

The first unit must remain pure TypeScript validation work. It must not call
external services, read Credentials, create database tables, execute Provider
commands, invoke MCP Tools, or connect to any Runtime path.

## Current Stage

- AGENT-GENERATOR-001 closed and pushed: PASS
- AGENT-VALIDATION-001 approved: PASS
- Scope frozen: PASS
- Sprint documents created: PASS
- First implementation unit: PASS
- Agent Definition validation against Agent Blueprint: PASS
- Tool Resolution Plan validation: PASS
- Required capability coverage validation: PASS
- MCP Tool permission and risk validation by contract: PASS
- Approval requirement coverage validation: PASS
- Credential / user-action unresolved dependency validation: PASS
- Safe READY-blocking reasons: PASS
- Pure validation functions: PASS
- Unit tests: PASS
- Out-of-scope MCP Tool Invocation, Gateway Runtime, Provider, Marketplace, UI, DB, Provisioning, Vault, Runtime Compiler, READY persistence, and Verification persistence changes: NOT INCLUDED
- Final quality gate: PASS
- Next required step: PM/CTO Review

## Product Direction Note

BuildFlow의 신규 제품 개발 기본 방향은 AI Agent 자동 구축, 배포, 검증,
BPS Package 공유다. AGENT-VALIDATION-001은 Agent Definition과 Tool
Resolution Plan이 안전하게 실행 가능한지 판정하는 검증 계층이며, 실제 실행
또는 READY 저장은 이후 별도 Sprint에서 다룬다.

## Preserved Work

`CAPABILITY-002`, `LIVE-EVIDENCE-001/002`, `STABILIZE-READY-001`,
`AGENT-FOUNDATION-001`, `MCP-FOUNDATION-001`, `AGENT-GENERATOR-001`,
`PROJECT-REVIEW-001`, `PRODUCT-REVIEW-003.5`, `HARDEN-003`,
`MCP-STRATEGY-001`의 완료 문서와 커밋 이력을 삭제하거나 덮어쓰지 않는다.
