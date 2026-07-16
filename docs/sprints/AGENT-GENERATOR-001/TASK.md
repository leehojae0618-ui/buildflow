# AGENT-GENERATOR-001 — Task

## Status

APPROVED / SCOPE FROZEN

## Title

Agent Tool Resolution Planner

## Goal

Agent Capability Requirement와 MCP Tool Contract 후보를 받아
`RESOLVED`, `UNSUPPORTED`, `USER_ACTION_REQUIRED`, `APPROVAL_REQUIRED`
상태의 Agent Tool Resolution Plan을 생성하는 순수 함수와 타입을 구현한다.

이번 Sprint는 실제 MCP Tool을 호출하지 않는다. Requirement Engine, Build
Planner, Provider 실행 경로와도 직접 연결하지 않는다.

## Product Context

BuildFlow는 AI Agent Builder / AI Agent Factory다. Agent는 Capability를
요구하고, BuildFlow는 MCP Tool 후보를 검토해 어떤 요구가 해결 가능한지,
무엇이 사용자 작업이나 승인을 요구하는지 안전하게 판단해야 한다.

AGENT-GENERATOR-001은 다음 원칙을 Source of Truth로 만든다.

- Capability first, Tool second
- No arbitrary LLM Tool or Command execution
- Credential availability is input-only in this Sprint
- Approval requirement is contract-only in this Sprint
- Unsupported and unresolved dependencies are explicit
- Runtime execution is out of scope

## Implementation Scope

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

## First Safe Implementation Unit

Target files:

- `src/features/agents/tool-resolution.ts`
- `src/features/agents/tool-resolution.test.ts`
- `src/features/agents/index.ts`

Allowed work:

- TypeScript types
- Pure resolver function
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
- Credential validation
- Requirement Engine direct integration
- Build Planner direct integration
- Agent Runtime Compiler
- LLM prompt-based arbitrary Tool selection
- Automatic Commit
- Push

## Security Rules

- Secret values must never be represented in contracts, tests, logs, snapshots,
  errors, or evidence.
- Credential availability is represented only as an input flag.
- The resolver must not read Vault or Provider Credential state.
- Tool selection must use explicit Tool Contract candidates only.
- Approval-required actions must return `APPROVAL_REQUIRED`, not execute.
- Missing credentials must return `USER_ACTION_REQUIRED`, not bypass.

## Definition of Done

- Resolution types implemented
- Pure resolver implemented
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
