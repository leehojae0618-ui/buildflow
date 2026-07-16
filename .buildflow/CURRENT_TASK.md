# Current Task

## Task ID

AGENT-PACKAGE-001

## Title

Agent Package Profile and Export Contract

## Status

APPROVED / SCOPE FROZEN

## Goal

Define the BPS-compatible AI Agent Package/Profile contract and secret-free
export readiness validation layer.

This Sprint does not implement Marketplace publishing, archive writing, package
installation, UI, runtime execution, or live Provider/MCP actions. Its purpose is
to make a validated Agent Definition and Tool Resolution Plan portable as a
reviewable Package/Profile contract.

## Scope

- BPS AI Agent Profile contract
- Agent Definition package metadata
- MCP Server and Tool dependency declarations
- Capability and Interface declarations
- Credential Definition references
- Permission, Risk, and Approval Requirement declarations
- Verification Rule and Fallback Policy declarations
- Secret-free package validation contract
- Package export readiness checks as pure functions
- Unit tests

## Excluded

- Marketplace implementation
- Package publishing
- UI implementation
- DB migration
- Actual MCP Tool Invocation
- Gateway Runtime execution
- Provider execution
- Live Credential or Vault access
- Agent Runtime Compiler
- BPS archive writing or file export
- Installer implementation changes
- Automatic Commit
- Push

## First Safe Implementation Unit

Only the following files may be created or modified for the first implementation
unit:

- `src/features/agents/package-profile.ts`
- `src/features/agents/package-profile.test.ts`
- `src/features/agents/index.ts`

The first unit must remain pure TypeScript contract and validation work. It must
not write package archives, access Credentials, invoke MCP Tools, execute
Provider commands, create database records, or connect to Marketplace,
Installer, Runtime, or UI paths.

## Current Stage

- AGENT-VALIDATION-001 closed and pushed: PASS
- AGENT-PACKAGE-001 approved: PASS
- Scope frozen: PASS
- Sprint documents created: PASS
- First implementation unit: PASS
- BPS AI Agent Profile contract: PASS
- Agent Definition package metadata: PASS
- MCP Server and Tool dependency declarations: PASS
- Capability and Interface declarations: PASS
- Credential Definition references: PASS
- Permission, Risk, and Approval Requirement declarations: PASS
- Verification Rule and Fallback Policy declarations: PASS
- Secret-free package validation contract: PASS
- Package export readiness checks as pure functions: PASS
- Unit tests: PASS
- Out-of-scope Marketplace, Package publishing, UI, DB, MCP Invocation, Gateway Runtime, Provider, Vault, Runtime Compiler, archive writing, and Installer changes: NOT INCLUDED
- Final quality gate: PASS
- Next required step: PM/CTO Review

## Product Direction Note

BuildFlow의 신규 제품 개발 기본 방향은 AI Agent 자동 구축, 배포, 검증,
BPS Package 공유다. AGENT-PACKAGE-001은 검증된 Agent Definition과 Tool
Resolution Plan을 BPS 호환 Agent Package/Profile로 표현하는 계약 계층이다.
실제 Marketplace 등록, archive export, installer 변경은 이후 별도 Sprint에서
다룬다.

## Preserved Work

`CAPABILITY-002`, `LIVE-EVIDENCE-001/002`, `STABILIZE-READY-001`,
`AGENT-FOUNDATION-001`, `MCP-FOUNDATION-001`, `AGENT-GENERATOR-001`,
`AGENT-VALIDATION-001`, `PROJECT-REVIEW-001`, `PRODUCT-REVIEW-003.5`,
`HARDEN-003`, `MCP-STRATEGY-001`의 완료 문서와 커밋 이력을 삭제하거나
덮어쓰지 않는다.
