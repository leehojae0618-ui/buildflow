# MCP-STRATEGY-001 Report

## Status

**DOCUMENTATION AND ARCHITECTURE CONTRACT PLANNING COMPLETE — PM REVIEW REQUIRED**

## Task

`MCP-STRATEGY-001 — MCP-First Agent Architecture`

Type: Documentation / Architecture / Contract Planning

## Purpose

BuildFlow의 AI Agent Factory 방향에서 MCP를 단순 Connector 보조 기능이
아니라 생성 Agent가 외부 세계와 상호작용하는 핵심 Tool Ecosystem으로
정의했다.

이번 작업은 MCP Runtime을 구현하지 않는다. 현재 Roadmap 순서
`AGENT-FOUNDATION-001 → MCP-FOUNDATION-001 → AGENT-GENERATOR-001`을
유지하면서, 각 Sprint가 사용할 Capability, Tool, Registry, Permission,
Verification 계약을 문서 수준에서 명확히 했다.

## Modified Documents

- `docs/reviews/PROJECT-INTEGRATED-REPORT-2026-07-17.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/ROADMAP.md`
- `docs/project/TECH_DEBT.md`
- `docs/sprints/MCP-STRATEGY-001/REPORT.md`

## Product Philosophy

공식 철학:

> BuildFlow는 외부 서비스 기능을 모두 직접 구현하는 플랫폼이 아니다.
> BuildFlow는 Agent가 수행해야 할 Capability를 정의하고, 검증된 MCP Tool을
> 발견·선택·통제·검증하여 안전한 Agent로 조립한다.

> BuildFlow는 Agent의 두뇌와 개발팀이며, MCP는 Agent가 외부 세계에서
> 행동하기 위한 표준화된 손과 도구다.

> MCP Tool이 존재한다는 이유만으로 사용할 수 있는 것은 아니다.
> Compatibility, Permission, Risk, Approval, Verification Gate를 통과해야
> 한다.

모든 Agent가 MCP를 반드시 사용하지는 않는다. 순수 LLM 응답, 내부 계산,
자체 Runtime 기능은 MCP 없이 실행할 수 있다. 외부 시스템 상호작용이
필요한 경우 MCP를 우선 검토하되 공식 SDK 또는 Provider Adapter가 더
안전하고 검증 가능한 경우 이를 허용한다.

## Added Architecture

목표 Pipeline:

```text
User Goal
→ Requirement Engine
→ Capability Engine
→ Blueprint Engine
→ Agent Generator
→ MCP Registry
→ Tool Resolver
→ Agent Validator
→ Runtime Compiler
→ Provider Provisioning
→ Agent Runtime
→ MCP Gateway
→ Functional Verification
→ Package
→ Marketplace
```

각 Layer를 `IMPLEMENTED`, `PARTIAL`, `PLANNED`, `FUTURE`로 구분했다.
현재 구현되지 않은 MCP Registry, Tool Resolver, MCP Gateway, Runtime
Compiler, Marketplace를 완료된 것처럼 표현하지 않는다.

## Provider Adapter and MCP Separation

### Provider Adapter

- GitHub Repository
- Supabase Database, Auth, RLS
- Vercel 또는 Runtime Hosting
- Infrastructure Provisioning
- Deployment

### MCP Server

- Agent Runtime의 외부 업무 Tool
- Gmail, Slack, Notion, Drive, Calendar, CRM 등
- 외부 읽기·쓰기·검색·전송·실행
- 구조화된 결과 반환

동일 서비스가 Provider와 MCP Tool 역할을 모두 수행할 수 있지만
Credential Scope, Approval, Execution, Verification Evidence 계약은
분리한다.

## MCP Registry Contract

Registry 최소 항목:

- Server ID, Version, Publisher
- Transport
- Health Policy
- Trust Status
- Tool, Resource, Prompt 목록
- Input/Output Schema
- Capability Mapping
- Credential Definition
- Permission
- Risk Class
- Approval Scope
- Timeout
- Retry
- Idempotency
- Rate Limit
- Output Size Limit
- Verification Rule
- Compatibility
- Deprecation Status

Registry 등록 자체는 실행 권한이 아니다. Project Ownership, Credential,
Blueprint allowlist, Permission, Approval을 실행마다 검증한다.

## Tool Selection Rules

Agent Generator는 특정 Tool 이름보다 Capability Requirement를 먼저
처리한다.

선택 기준:

- Capability 충족
- Input/Output 호환성
- Credential 사용 가능 여부
- 사용자 소유 Provider
- 최소 권한
- 비용
- Region과 데이터 정책
- Health
- Version 호환성
- Verification Evidence
- 성공률
- 사용자 선호
- Fallback 가능성
- Retry와 Idempotency 안전성

결과 상태:

- `RESOLVED`
- `USER_ACTION_REQUIRED`
- `APPROVAL_REQUIRED`
- `UNSUPPORTED`
- `BLOCKED`

LLM이 임의 Tool 이름이나 Command를 생성해 바로 실행하는 구조는 금지한다.

## Minimum Contract Model

문서 수준에서 다음 계약을 정의했다.

### AgentCapability

- `id`
- `version`
- `category`
- `inputTypes`
- `outputTypes`
- `requiredPermissions`
- `riskClass`

### McpServerDefinition

- `id`
- `version`
- `transport`
- `publisher`
- `healthPolicy`
- `trustStatus`

### McpToolDefinition

- `serverId`
- `toolName`
- `capabilities`
- `inputSchema`
- `outputSchema`
- `credentialDefinition`
- `permissions`
- `riskClass`
- `approvalRequirement`
- `timeout`
- `retryPolicy`
- `idempotencyPolicy`
- `verificationRules`

### AgentBlueprint

- `requiredCapabilities`
- `optionalCapabilities`
- `preferredToolSelectors`
- `forbiddenTools`
- `deliveryMode`
- `interfaceMode`
- `approvalPlan`
- `verificationPlan`

### AgentDefinition

- `resolvedBlocks`
- `resolvedMcpTools`
- `unresolvedDependencies`
- `credentialRequirements`
- `permissions`
- `runtimeDefinition`
- `validationStatus`

## Security Boundary

- Server allowlist
- Tool allowlist
- Version pinning
- 서버 측 Input Schema 재검증
- Credential Reference 격리
- Secret 원문 비노출
- Project Ownership 재확인
- 비용·쓰기·삭제·공개·권한 확대 Approval
- Prompt Injection Permission 확대 차단
- Raw Tool Response 저장 금지
- Safe Result Sanitization
- Timeout과 제한된 Retry
- Idempotency
- Rate Limit
- Output Size Limit
- Audit Evidence
- Tool 실행 전후 위험도 재평가

## Verification and Evidence

MCP를 사용하는 Agent는 다음 Evidence 없이 READY가 될 수 없다.

- Server Health
- Tool Discovery
- Server와 Tool Version
- Input Schema
- 최소 권한
- Credential Reference 유효성
- 실제 Tool 호출
- Output Schema
- Safe Evidence
- Approval Scope
- Timeout·Retry·실패 경로

Credential, Tool Version, Trust Status, Permission, Contract가 변경되면 기존
Verification을 무효화한다.

## Package and Marketplace Relationship

### MCP Registry

사용 가능한 Server와 Tool의 Trust, Health, Version, Capability,
Permission, Risk, Evidence를 관리한다.

### Agent Marketplace

검증된 Agent Blueprint, MCP Dependency, Permission, Cost, Evidence,
Versioned BPS Package를 배포한다.

Publish Gate:

```text
Generate
→ Contract Validate
→ MCP Dependency Resolve
→ Provision
→ Functional Verification
→ Security Review
→ Evidence
→ Versioned Package
→ Publish
```

BPS Agent Profile은 Server ID, Version Range, Capability, Tool Selector,
Input/Output Contract, Credential Definition, Permission, Approval, Risk,
Verification, Fallback Policy를 포함한다.

Secret, Token, Private Key, Live Session, Raw Response, Unredacted Log는
포함하지 않는다.

## Roadmap Alignment

큰 순서는 변경하지 않았다.

1. CAPABILITY-002 Review and Commit Boundary
2. AGENT-FOUNDATION-001
3. MCP-FOUNDATION-001
4. AGENT-GENERATOR-001
5. AGENT-VALIDATION-001
6. AGENT-PACKAGE-001
7. AGENT-EVIDENCE-001
8. MARKETPLACE-AGENT-001

각 Sprint의 관계와 책임만 상세화했다.

## Technical Debt Added

- TD-018 MCP Trust Registry
- TD-019 MCP Version Drift
- TD-020 MCP Prompt Injection
- TD-021 MCP Excess Permission
- TD-022 MCP Raw Result Exposure
- TD-023 MCP Cost Runaway
- TD-024 MCP Non-idempotent Retry
- TD-025 MCP Availability and Fallback
- TD-026 MCP Marketplace Trust
- TD-027 Generated Agent MCP Authentication

## Current and Planned Status

### Implemented

- Requirement and Clarification
- 기존 Application Blueprint 선택
- GitHub, Supabase, Vercel Provisioning
- Provider·기능 Verification
- BPS Builder와 Installer

### Partial

- Application Capability
- 제한된 Blueprint Runtime
- Agent Validator의 Provider·기능 검증 부분

### Planned

- Agent Capability와 Block Contract
- MCP Reference Contract
- MCP Registry
- Tool Resolver
- Agent Generator
- 일반 Agent Validator
- Runtime Compiler
- MCP Gateway
- BPS Agent MCP Profile

### Future

- Generated Agent MCP Publisher Runtime
- Agent Marketplace
- Learning Engine

## Open Questions

다음 항목은 이번 작업에서 임의로 확정하지 않았다.

1. MCP Registry를 BuildFlow 내부 DB로 운영할지
2. 외부 Registry와 연동할지
3. Remote MCP Transport 우선순위
4. OAuth와 API Key의 Credential UX
5. MCP Server Publisher Trust 등급
6. Tool Version Pinning 정책
7. Tool Fallback 자동 전환 정책
8. Generated Agent를 MCP Server로 제공할 Runtime
9. 유료 MCP Tool의 비용 정산 책임
10. 사용자 데이터의 Region·보존 정책

## MVP Impact

이번 작업은 새로운 Runtime 기능을 추가하지 않는다. AI Agent Factory의
다음 구현에서 Capability, MCP Tool, Provider Adapter, Agent Generator가
서로 다른 책임을 갖도록 Source of Truth를 정비하여 범위 과장과 보안 경계
혼동을 줄인다.

정량적 MVP Impact는 합의된 측정 기준이 없어 기록하지 않는다.

## Git Diff Summary

문서 변경:

- Integrated Report에 `15.1`~`15.15` MCP-First 독립 장 추가
- Integrated Report MCP 장 570줄 추가
- Architecture MCP Pipeline, 상태, 계약 약 203줄 추가
- Roadmap Sprint 관계 약 77줄 추가
- MCP 위험 Technical Debt 10건 추가
- Sprint Report 430줄 생성

현재 Git 기준으로 추적 중인 세 Project 문서의 전체 미커밋 Diff는 다음과
같다. 이 수치에는 MCP-STRATEGY-001 이전부터 존재하던 Product Direction
변경도 포함된다.

```text
docs/project/ARCHITECTURE.md | 257 insertions
docs/project/ROADMAP.md      | 138 insertions, 7 deletions
docs/project/TECH_DEBT.md    | 17 insertions, 4 deletions
```

Integrated Report와 Sprint Report는 untracked 파일이므로 일반 `git diff
--stat`에는 포함되지 않는다.

현재 Worktree에는 CAPABILITY-002, LIVE-EVIDENCE, STABILIZE-READY,
Product Direction 등 다른 미커밋 변경이 함께 존재한다. 본 Report는
MCP-STRATEGY-001 변경과 기존 Worktree 변경이 섞여 있음을 명시하며 기존
변경을 삭제하거나 덮어쓰지 않는다.

## Validation

- `git diff --check`: PASS
- Untracked Markdown 별도 `--check`: PASS
- Markdown heading continuity: PASS — Integrated Report 1~18
- Table of Contents anchors: PASS — 18/18
- MCP subsection continuity: PASS — 15.1~15.15
- Existing content deletion check: PASS — 기존 장 유지, 후속 장 번호만 순연
- Implementation versus Planned status check: PASS
- Architecture and Roadmap terminology check: PASS
- Capability, Block, Blueprint, MCP, Generator terminology check: PASS
- Secret and Credential value scan: PASS
- Existing Live Evidence URL preservation: PASS — Repository와 Deployment URL 4개 유지
- Technical Debt ID collision check: PASS — TD-018~TD-027
- Trailing whitespace check: PASS

문서 전용 작업이므로 tests, lint, typecheck, production build는 생략한다.
코드, Runtime, Execution, Credential 저장 방식, Migration을 변경하지 않았다.

## Commit

Commit하지 않았다. Push하지 않았다.

## Review Gate

PM Review를 요청한다.
