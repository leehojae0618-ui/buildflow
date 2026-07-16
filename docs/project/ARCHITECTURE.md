# BuildFlow Architecture

## Current Stack

- Next.js
- TypeScript
- Supabase PostgreSQL
- Supabase Authentication
- Supabase RLS
- OpenAI Responses API
- Vitest

## Target Domain Engines

- Requirement Engine
- Clarification Engine
- Constraint Engine
- Consent Engine
- Architecture Engine
- Build Planner
- Build Engine
- Installation Wizard
- Test Engine
- Marketplace Engine

## Requirement Foundation

`src/features/requirements/` contains the first domain layer: Goal Parser, prioritized Clarification Queue, Conversation State, Missing Requirement detection, Summary generation, Constraint assessment, Consent requirements, Capability Calculator, and Requirement Snapshot creation. Project creation stores the snapshot inside the existing `projects.goal_constraints` JSONB field, so no Migration is needed. Recommendation code remains a downstream-compatible layer. Future Build Planner and Installation Wizard components consume `Snapshot.capabilities` rather than inventing their own constraint vocabulary.

`intelligence.ts` derives a deterministic Build Intelligence result from the Snapshot. It estimates build/setup time, monthly cost, risk, confidence, and Build Score without calling an external AI or changing the database schema.

`src/features/architecture/` owns the Component Registry and deterministic Component Selection Engine. It creates an `architecture-v1` snapshot with components, connections, and dependencies; the snapshot is embedded in the existing project JSONB payload until a later schema decision.

## Domain Translation

- Recommendation → Build Session
- Workflow → Build Plan
- Template → Blueprint
- Tool Explorer → Component Catalog
- Workflow Library → Blueprint Library
- Dashboard → Build Center

These names describe the target domain. Existing database tables and routes remain unchanged until a separately approved implementation task defines a migration and compatibility plan.

## AI System Package

Marketplace packages are versioned snapshots containing Requirement, Blueprint, Prompt, Build Plan, Environment, Installer, Version, and Artifacts. Secrets and personal data are excluded.

The BPS transport format remains compatible with the existing AI System Package
specification. The product-level Marketplace profile is now an `AI Agent
Package`: it must describe an Agent goal, model/tool behavior, required
connectors, permissions, deployment surface, and Verification rules.

## Architecture Rule

기존 기능을 폐기하기보다 새로운 Planning 및 Build Domain의 기반으로 확장한다.

## Application Blueprint Runtime

`src/features/capabilities/application.ts` is the Source of Truth for supported
application capabilities. `src/features/provisioning/blueprints.ts` selects an
explicit Blueprint and blocks unsupported or ambiguous matching.

Current executable Blueprints:

- `ai-inquiry-v1`
- `general-crud-v1`

`ai-inquiry-v1` is the core product path because it provisions and verifies an
AI Agent and its delivery surface.

The General CRUD Blueprint removes OpenAI from the default Architecture and
uses Supabase Auth, Supabase Database, GitHub, and Vercel. It remains preserved
as engine capability and regression Evidence, but no additional generic Web App
or Platform Blueprint work is planned under the current product focus.

This is a bounded Blueprint system, not an unrestricted natural-language
application generator.

## AI Agent Runtime Boundary

The AI Agent is the primary build artifact. Repository, database, authentication,
API, web UI, and hosting are supporting runtime components only when required to
operate or manage that Agent. The Orchestrator remains responsible for state,
approval, ownership, Provider execution, recovery, and evidence-backed
Verification.

## MCP Runtime Boundary

MCP is the AI Agent runtime tool plane and does not replace the existing
Provider Adapters.

- Connector Registry describes available services and capabilities.
- Provider Adapters provision and deploy repositories, databases, and hosting.
- MCP Servers expose runtime tools and resources used by an Agent.
- The BuildFlow MCP Gateway controls discovery, compatibility, Credential
  resolution, Permission, Approval, execution, sanitization, and Evidence.
- A verified generated Agent may expose an MCP Server interface for other AI
  clients, subject to separate publication, permission, and security approval.

Agent Blueprints may reference only allowlisted MCP Server and Tool capabilities.
MCP Secrets and raw responses are excluded from Snapshots, Events, Errors,
Evidence, and BPS Packages. External writes, cost, destructive actions, public
changes, and permission changes remain behind the Approval boundary.

## MCP-First Agent Architecture

BuildFlow는 외부 서비스 기능을 모두 직접 구현하는 플랫폼이 아니다.
BuildFlow는 Agent가 수행해야 할 Capability를 정의하고, 검증된 MCP Tool을
발견·선택·통제·검증하여 안전한 Agent로 조립한다.

BuildFlow는 Agent의 두뇌와 개발팀이며, MCP는 Agent가 외부 세계에서
행동하기 위한 표준화된 손과 도구다.

MCP Tool이 존재한다는 이유만으로 실행할 수 있는 것은 아니다. BuildFlow의
Compatibility, Permission, Risk, Approval, Verification Gate를 통과해야
한다.

모든 Agent가 MCP를 사용하는 것은 아니다. 순수 LLM 응답, 내부 계산, 자체
Runtime 기능은 MCP 없이 실행할 수 있다. 외부 시스템 상호작용이 필요한
경우 MCP를 우선 검토하되, 공식 SDK 또는 기존 Provider Adapter가 더
안전하고 검증 가능한 경우 해당 경로를 허용한다.

## Target Agent Build Pipeline

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

현재 구현 상태:

| Layer | Status | Notes |
|---|---|---|
| User Goal and Requirement Engine | `IMPLEMENTED` | Requirement Snapshot, Clarification, Constraint, Consent |
| Capability Engine | `PARTIAL` | Application Capability는 존재하나 Agent Capability Contract는 계획 |
| Blueprint Engine | `PARTIAL` | `ai-inquiry-v1`, `general-crud-v1` 결정론적 선택 |
| Agent Generator | `PLANNED` | AGENT-GENERATOR-001 |
| MCP Registry | `PLANNED` | MCP-FOUNDATION-001 |
| Tool Resolver | `PLANNED` | Registry와 Generator 사이의 Capability Resolution |
| Agent Validator | `PARTIAL` | Provider·기능 Verification은 구현, 일반 Agent Contract 검증은 계획 |
| Runtime Compiler | `PLANNED` | Resolved Agent Definition을 실행 Artifact로 변환 |
| Provider Provisioning | `IMPLEMENTED` | GitHub, Supabase, Vercel Live Evidence |
| Agent Runtime | `PARTIAL` | `ai-inquiry-v1` 고정 Runtime Evidence |
| MCP Gateway | `PLANNED` | Discovery, Permission, Approval, Invocation, Sanitization |
| Functional Verification | `IMPLEMENTED` | 두 대표 Blueprint Live Evidence |
| Package | `IMPLEMENTED` | BPS Builder·Installer; Agent MCP Profile은 계획 |
| Marketplace | `FUTURE` | 검증된 Agent Package 이후 |

`IMPLEMENTED`는 현재 코드와 Evidence가 있는 항목이다. `PARTIAL`은 제한된
Blueprint 또는 계약만 존재하는 항목이며, `PLANNED`와 `FUTURE`는 구현
완료를 의미하지 않는다.

## Capability and Tool Resolution

Capability는 Agent가 무엇을 해야 하는지를 정의하고 특정 Provider 또는
MCP Tool에 종속되지 않는다.

```text
EMAIL_READ
→ Gmail MCP Tool
→ Microsoft Graph MCP Tool
→ IMAP MCP Tool
```

Blueprint는 `requiredCapabilities`와 Tool Requirement를 선언한다. Agent
Generator는 MCP Registry에서 다음 기준으로 Tool을 선택한다.

- Capability 충족
- Input/Output Schema 호환성
- Credential 사용 가능 여부
- 사용자 소유 Provider
- 최소 권한
- 비용
- Region과 데이터 정책
- Health
- Version compatibility
- Verification Evidence와 성공률
- 사용자 선호
- Fallback 가능성

LLM이 임의 Tool 이름이나 Command를 생성해 바로 실행하지 않는다. 호환
Tool이 없으면 `UNSUPPORTED`, 사용자 연결이 필요하면
`USER_ACTION_REQUIRED`, 승인 범위를 넘으면 `APPROVAL_REQUIRED`로 처리한다.

## Provider Adapter and MCP Separation

| Boundary | Provider Adapter | MCP Server |
|---|---|---|
| Purpose | Agent 실행 인프라 구축 | Agent Runtime 업무 Tool |
| Examples | GitHub Repository, Supabase DB/Auth/RLS, Vercel Hosting | Gmail, Slack, Notion, Drive, Calendar, CRM |
| Execution phase | Provisioning and Deployment | Runtime Invocation |
| Evidence | Resource, Deployment, Health | Tool Input/Output Contract와 Invocation |

동일 서비스가 두 역할을 가질 수 있지만 계약, Credential Scope, Approval,
Execution, Evidence는 분리한다.

## MCP Registry Contract

Registry는 다음 정보를 관리해야 한다.

- Server ID, Version, Publisher
- Transport
- Health Policy와 Trust Status
- Tool, Resource, Prompt 목록
- Input/Output Schema
- Capability Mapping
- Credential Definition
- Permission, Risk Class, Approval Scope
- Timeout, Retry, Idempotency, Rate Limit
- Output Size Limit
- Compatibility와 Verification Rule
- Deprecation Status

Registry 등록만으로 실행 권한이 생기지 않는다. Project Ownership,
Credential, Blueprint allowlist, Permission, Approval을 실행마다 확인한다.

## Minimum Contract Model

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

## MCP Security and Verification

- Server allowlist와 Tool allowlist
- Version pinning
- 서버 측 Input Schema 재검증
- Credential Reference 격리
- Secret 원문 비노출
- Project Ownership 재확인
- 비용·쓰기·삭제·공개·권한 확대 Approval
- Prompt Injection에 의한 Permission 변경 차단
- Raw Tool Response 미저장
- Safe Result Sanitization
- Timeout, Retry, Idempotency, Rate Limit, Output Size Limit
- 실행 전후 위험도 재평가
- Audit Evidence

MCP를 사용하는 Agent는 Server Health, Tool Discovery, Version,
Input/Output Schema, 최소 권한, 실제 Tool 호출, Approval Scope Evidence가
없으면 READY가 될 수 없다. Credential, Tool Version, Trust, Permission이
변경되면 기존 Verification을 무효화하고 재검증한다.
