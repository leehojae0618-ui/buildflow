# Next Task

## Task ID

AGENT-FOUNDATION-001

## Title

AI Agent Capability and Contract Foundation

## Scope

APPROVED / SCOPE FROZEN

## Activation

BLOCKED until CAPABILITY-002 review and commit-boundary approval.

This is the next Sprint candidate only. Do not move it to `CURRENT_TASK.md` or
start implementation until CAPABILITY-002 review, commit-boundary approval, and
worktree boundary cleanup are complete.

## Goal

CAPABILITY-002 Review 이후 Agent Capability, Delivery Mode, Block,
Blueprint, Agent Definition, Contract Validator의 Source of Truth를 만든다.
기존 `ai-inquiry-v1`을 첫 Agent Blueprint로 변환하되 Provider Execution을
재구현하지 않는다.

## Proposed Scope

- Agent Capability Model
- `HEADLESS`, `CHAT`, `BUSINESS` Delivery Mode
- `API`, `WEBHOOK`, `SCHEDULE`, `WEB_CHAT`, `MCP_SERVER` Interface Mode
- Model, Prompt, Trigger, Tool, Memory, Knowledge, Guardrail, Output,
  Delivery Surface Block Contract
- Tool Block의 MCP Server ID, Tool Capability, Permission, Approval,
  input/output schema 참조 계약
- Agent Blueprint Contract와 Version
- Agent Definition Generator 계약
- Contract Validator
- `ai-inquiry-v1` compatibility mapping
- Unit tests and Sprint documents

## Excluded

- General Web App 또는 Platform Blueprint 추가
- Marketplace UI와 Publishing
- 신규 Provider
- 실제 MCP Server 연결·실행
- Learning Engine
- 자연어 범용 Agent 생성 주장
- Migration
- 자동 Commit
- Push

## Following Candidate

`MCP-FOUNDATION-001 — MCP Server Registry and Secure Gateway Contract`

- MCP Server Registry
- Tool discovery Snapshot
- compatibility and health contract
- Credential Reference isolation
- Permission, Risk, Approval policy
- Tool allowlist and server-side input validation
- timeout, retry, idempotency
- safe result sanitization and Verification Evidence
- BPS MCP dependency mapping
- generated Agent MCP Server publication contract
