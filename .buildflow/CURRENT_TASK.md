# Current Task

## Task ID

AGENT-FOUNDATION-001

## Title

AI Agent Capability and Contract Foundation

## Status

REVIEW

## Goal

BuildFlow의 제품 방향을 AI Agent Builder / AI Agent Factory로 고정하기 위해
Agent Capability, Delivery Mode, Interface Mode, Block Contract, Agent
Blueprint, Agent Definition, Contract Validator의 Source of Truth를 만든다.

기존 `ai-inquiry-v1`을 첫 Agent Blueprint compatibility mapping으로
정리하되, Provider Execution과 실제 MCP 실행은 재구현하지 않는다.

## Scope

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
- 실제 MCP Server 연결 또는 실행
- MCP Registry 또는 Gateway 구현
- Learning Engine
- 자연어 범용 Agent 생성 주장
- Migration
- 자동 Commit
- Push

## Current Stage

- Sprint activated from `NEXT_TASK.md`: PASS
- CAPABILITY-002 implementation and evidence preserved: PASS
- Agent Capability Model: PASS
- Delivery Mode and Interface Mode contract: PASS
- Block Contract and MCP Reference Contract: PASS
- Agent Blueprint and Agent Definition contract: PASS
- Agent Definition Generator pure function: PASS
- Contract Validator: PASS
- `ai-inquiry-v1` compatibility mapping: PASS
- Unit tests: PASS
- Out-of-scope runtime, Provider, DB, Marketplace, UI, and Provisioning execution changes: NOT INCLUDED
- Final quality gate: PASS
- Next required step: PM/CTO Review

## Product Direction Note

BuildFlow의 신규 제품 개발 기본 방향은 AI Agent 자동 구축, 배포, 검증,
BPS Package 공유다. General Web App과 Platform 확장은 회귀 Evidence와
장기 Roadmap으로 보존하며, AGENT-FOUNDATION-001에서는 Agent 계약과 검증
가능한 Definition 기반만 만든다.

## Preserved Work

`CAPABILITY-002`, `LIVE-EVIDENCE-001/002`, `STABILIZE-READY-001`,
`PROJECT-REVIEW-001`, `PRODUCT-REVIEW-003.5`, `HARDEN-003`,
`MCP-STRATEGY-001`의 완료 문서와 커밋 이력을 삭제하거나 덮어쓰지 않는다.
