# AGENT-VALIDATION-001 — Task

## Status

APPROVED / SCOPE FROZEN

## Title

Agent Definition and Tool Resolution Validation Gate

## Goal

Agent Definition, Agent Blueprint, MCP Tool Contract, Tool Resolution Plan을
실행 전에 검증하는 순수 Validation Gate를 구현한다.

이번 Sprint는 실제 MCP Tool 호출, Gateway Runtime, Provider 실행, READY
영구 저장을 구현하지 않는다.

## Product Context

BuildFlow는 AI Agent Builder / AI Agent Factory다. Agent 생성 계획이
존재하더라도, 실행 전에 Agent Definition과 Tool Resolution Plan이 안전하고
완전한지 검증해야 한다.

AGENT-VALIDATION-001은 다음 원칙을 Source of Truth로 만든다.

- No execution without validation
- READY is blocked by unresolved required dependencies
- Approval-required dependencies must be explicit
- User-action-required dependencies must be explicit
- MCP Tool permissions and risk are validated by contract only
- Validation returns safe blocking reasons, not runtime side effects

## Implementation Scope

- Agent Definition validation against Agent Blueprint
- Tool Resolution Plan validation
- Required capability coverage validation
- MCP Tool permission and risk validation by contract
- Approval requirement coverage validation
- Credential / user-action unresolved dependency validation
- Safe READY-blocking reasons
- Pure validation functions
- Unit tests

## First Safe Implementation Unit

Target files:

- `src/features/agents/validation-gate.ts`
- `src/features/agents/validation-gate.test.ts`
- `src/features/agents/index.ts`

Allowed work:

- TypeScript types
- Pure validation function
- Deterministic test fixtures
- Unit tests

## Explicitly Out of Scope

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

## Security Rules

- Secret values must never be represented in contracts, tests, logs, snapshots,
  errors, or evidence.
- Validation must not read Vault or Provider Credential state.
- Validation must not execute Tools, Providers, Runtime, or external services.
- Blocking reasons must be safe to store and display.
- Approval-required and user-action-required states must not be silently treated
  as READY.

## Definition of Done

- Validation types implemented
- Pure validation function implemented
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
