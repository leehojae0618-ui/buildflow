# Current Task

## Task ID

NONE

## Title

Between Sprints

## Status

BETWEEN_SPRINTS

## Goal

No active implementation Sprint is currently open.

The previous Sprint, `AGENT-PACKAGE-001`, is closed after PM/CTO Review and
remote push. The repository is ready for the next Sprint to be reviewed,
approved, and scope frozen before any implementation begins.

## Scope

- Preserve the completed `AGENT-PACKAGE-001` implementation and report.
- Keep the repository in a clean BETWEEN_SPRINTS state.
- Use `.buildflow/NEXT_TASK.md` for the next candidate only.

## Excluded

- Implementation work
- Code changes
- DB migration
- Provider execution
- MCP Tool Invocation
- Gateway Runtime execution
- Runtime implementation
- Deployment
- Marketplace implementation
- UI implementation
- Automatic Commit
- Push

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
- AGENT-PACKAGE-001 PM/CTO Review: COMPLETE
- AGENT-PACKAGE-001 push: COMPLETE
- Current active Sprint: NONE
- Current workflow state: BETWEEN_SPRINTS
- Next candidate: LIVE-EVIDENCE-AGENT-001
- Next required step: LIVE-EVIDENCE-AGENT-001 approval review before activation

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
