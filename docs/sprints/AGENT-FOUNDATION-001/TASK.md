# AGENT-FOUNDATION-001 — Task

## Status

APPROVED / SCOPE FROZEN

## Goal

BuildFlow의 AI Agent Builder 방향에 맞춰 Agent Capability, Block, Blueprint,
Agent Definition, Contract Validator의 공식 계약을 만든다.

이번 Sprint는 Agent Foundation이다. 기존 `ai-inquiry-v1`을 첫 Agent
Blueprint compatibility mapping으로 정리하지만, 실제 Provider Execution,
MCP Server 연결, Marketplace Publishing은 구현하지 않는다.

## Scope

- Agent Capability Model
- Delivery Mode
  - `HEADLESS`
  - `CHAT`
  - `BUSINESS`
- Interface Mode
  - `API`
  - `WEBHOOK`
  - `SCHEDULE`
  - `WEB_CHAT`
  - `MCP_SERVER`
- Block Contract
  - Model
  - Prompt
  - Trigger
  - Tool
  - Memory
  - Knowledge
  - Guardrail
  - Output
  - Delivery Surface
- Tool Block MCP Reference Contract
  - MCP Server ID
  - Tool Capability
  - Permission
  - Approval
  - Input schema reference
  - Output schema reference
- Agent Blueprint Contract and Version
- Agent Definition Generator contract
- Contract Validator
- `ai-inquiry-v1` compatibility mapping
- Unit tests
- Sprint report

## Excluded

- General Web App 또는 Platform Blueprint 추가
- Marketplace UI 또는 Publishing
- 신규 Provider
- 실제 MCP Server 연결
- 실제 MCP Tool Invocation
- MCP Registry 또는 Gateway 구현
- Learning Engine
- 자연어 범용 Agent 생성 주장
- Migration
- 자동 Commit
- Push

## Required Product Principles

- BuildFlow는 AI Agent Builder / AI Agent Factory에 집중한다.
- Capability First 원칙을 따른다.
- Tool과 Provider는 Capability 이후에 선택된다.
- LLM은 임의 Tool 또는 Command를 직접 실행하지 않는다.
- Agent Definition은 검증 가능한 계약이어야 한다.
- 실제 Evidence 없는 READY를 금지한다.
- MCP Reference는 정의하지만 실행하지 않는다.

## Required Deliverables

- `src/features/agents/` 계약 모듈
- Agent Capability 타입과 validator
- Block Contract 타입과 validator
- Agent Blueprint 타입과 validator
- Agent Definition 타입과 validator
- `ai-inquiry-v1` compatibility mapping
- Unit tests
- `docs/sprints/AGENT-FOUNDATION-001/REPORT.md`

## Definition of Done

- Tests PASS
- Lint PASS
- Typecheck PASS
- Build PASS
- `git diff --check` PASS
- Secret pattern scan PASS
- Scope does not include real MCP execution
- Scope does not include Marketplace implementation
- Sprint Report 작성
- Commit 금지 until PM Review and Commit Approval
- Push 금지

