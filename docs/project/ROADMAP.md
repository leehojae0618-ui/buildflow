# BuildFlow Roadmap

## Product Pivot

PIVOT-001 changed the product from recommendation to system building. The
2026-07-17 Product Direction Amendment narrows the active product promise to AI
Agent automatic build and Marketplace sharing. Existing Web App and CRUD work
is retained as technical Evidence, not as the direction for further Blueprint
expansion.

## Phase 1 — AI Agent Builder MVP

- Requirement analysis
- Clarification
- Constraint and consent
- AI Agent design
- Build planning
- Agent artifact and runtime build
- MCP Server integration and secure Tool execution
- Installation wizard
- Agent functional Verification
- Existing Discovery and Guided Execution foundations

## Phase 2 — Beta

- Error recovery
- Usage control
- Operational monitoring
- User feedback
- Deployment and onboarding

## Phase 3 — Marketplace

- AI Agent sharing
- Version snapshots
- Clone and installation
- Creator model
- Paid listings
- Hosted agents

Marketplace unit: BPS-compatible `AI Agent Package` with Requirement, Agent
Blueprint, Prompt, Build Plan, Environment, Installer, Version, Verification
Rules, and Artifacts.

MARKET-001 defines `docs/specs/BPS-1.0.md` as the canonical Package Format and Source of Truth. Package Builder and Installer implementation follow the specification; Marketplace UI follows those foundations.

## Product Review Freeze

Product Review 001 freezes the next five implementation targets: PIVOT-005 Architecture Foundation, PIVOT-006 Build Intelligence, PIVOT-007 Build Planner, PIVOT-008 Installation Wizard, and PIVOT-009 Test Engine. Mid-Sprint product direction changes require change control and are recorded in `docs/project/PRODUCT_REVIEW.md`.

## Release Path

```text
Feature Sprint → Stabilize Sprint → Product Review → RC → Beta → Launch
```

RC permits only bug fixes, performance improvements, QA, and stabilization. No new feature enters RC.

## Autonomous Build Readiness

STABILIZE-READY-001 connects the existing Autonomous Session to a representative
AI web-service build path:

```text
User goal
→ Credential / Consent / bundled Approval
→ Private GitHub Repository and generated files
→ existing Supabase Project Schema and RLS
→ Vercel production deployment
→ Health and functional verification
→ persisted READY_WITH_WARNINGS
```

Live GitHub, Supabase, Vercel, and OpenAI Evidence passed for the representative
AI inquiry Agent path. Repeated pilot success, dedicated background continuation,
and operations Evidence remain release gates.

During MVP, ideas outside this frozen roadmap are classified as MVP-required, Beta backlog, or Future backlog and are not started without Product Review approval.

## Blueprint Direction

- Core product Blueprint: `ai-inquiry-v1`, with live Provider and functional
  Evidence from LIVE-EVIDENCE-002 TEST A
- Preserved regression Blueprint: `general-crud-v1`, with live Evidence from
  CAPABILITY-002 / LIVE-EVIDENCE-002 TEST B

New work must improve AI Agent definition, tool use, deployment, Verification,
Package export/import, or Marketplace sharing. Additional generic entity models,
SaaS categories, and Platform Blueprints are on hold.

## Agent and MCP Sequence

```text
AGENT-FOUNDATION-001
→ MCP-FOUNDATION-001
→ AGENT-GENERATOR-001
→ AGENT-VALIDATION-001
→ AGENT-PACKAGE-001
→ AGENT-EVIDENCE-001
→ MARKETPLACE-AGENT-001
```

Agent Foundation defines MCP references but does not connect to an external MCP
Server. MCP Foundation owns the secure Registry and Gateway contract. Agent
Generator consumes only validated MCP Tool capabilities.

## Sprint Relationship

### 1. CAPABILITY-002 Review and Commit Boundary

- General CRUD Live Evidence와 회귀 자산 보존
- 현재 Worktree의 선행 Stabilize·Evidence 의존성 정리
- Agent·MCP 신규 구현과 기존 변경을 분리

### 2. AGENT-FOUNDATION-001

- Agent Capability 기본 계약
- Model, Prompt, Trigger, Tool, Memory, Knowledge, Guardrail, Output,
  Delivery Surface Block 계약
- Agent Blueprint와 Agent Definition 계약
- Delivery Mode와 Interface Mode
- MCP Server와 Tool Reference를 소비할 수 있는 Tool Block 구조

실제 MCP Registry, Discovery, Invocation은 포함하지 않는다.

### 3. MCP-FOUNDATION-001

- MCP Server Registry
- Tool, Resource, Prompt Discovery Snapshot
- MCP Server와 Tool Contract
- Capability Mapping
- Credential Reference isolation
- Permission, Risk, Approval
- Health, Compatibility, Version, Trust
- Timeout, Retry, Idempotency, Rate Limit
- Safe Result와 Verification Evidence

### 4. AGENT-GENERATOR-001

- Requirement의 Capability Requirement를 MCP Tool 후보로 Resolve
- Input/Output, Credential, Permission, 비용, Region, Health, Version,
  Evidence 기준으로 Tool 선택
- Tool이 없으면 `UNSUPPORTED`
- 사용자 연결이 필요하면 `USER_ACTION_REQUIRED`
- 승인 범위를 넘으면 `APPROVAL_REQUIRED`
- 임의 Tool 이름 또는 Command 직접 실행 금지

### 5. AGENT-VALIDATION-001

- Agent Definition Graph 검증
- Block Dependency 검증
- MCP Tool Permission과 Risk 검증
- 실제 MCP Tool 기능 검증
- Output Schema와 Safe Result 검증
- Evidence 저장과 READY Gate 연결

### 6. AGENT-PACKAGE-001

- BPS AI Agent Profile
- MCP Server와 Tool Dependency
- Capability와 Interface 선언
- Credential Definition
- Permission, Risk, Approval Requirement
- Verification Rule와 Fallback Policy
- Secret-free Export·Import

### 7. AGENT-EVIDENCE-001

- MCP Tool을 사용하는 두 번째 Agent Live Build
- 실제 Tool Invocation
- Approval, Result Sanitization, Verification
- 재실행 멱등성
- Package Export Evidence

### 8. MARKETPLACE-AGENT-001

- 검증된 Agent Package Listing
- MCP Dependency Resolution 상태
- Permission, 비용, Risk, Evidence 표시
- 검증되지 않은 필수 Tool Dependency Publish 차단

큰 Roadmap 순서는 변경하지 않는다. 이 절은 각 Sprint가 Agent Capability와
MCP Tool Ecosystem을 어떻게 연결하는지 명확히 한다.
