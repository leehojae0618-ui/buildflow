# BuildFlow Project Integrated Report

## Current Product, Engineering Status, and Planned Development

**Report date:** 2026-07-17

**Document type:** PM / CTO / Product / Engineering Integrated Review

**Status:** Current-state consolidated report

**Product direction:** AI Agent Builder and Marketplace

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Official Product Definition](#2-official-product-definition)
3. [Product Principles](#3-product-principles)
4. [Current Project Status](#4-current-project-status)
5. [Implemented Product and Engineering Capabilities](#5-implemented-product-and-engineering-capabilities)
6. [Live Evidence](#6-live-evidence)
7. [Current Architecture](#7-current-architecture)
8. [AI Agent Target Model](#8-ai-agent-target-model)
9. [BPS and Marketplace Direction](#9-bps-and-marketplace-direction)
10. [Security and Ownership Status](#10-security-and-ownership-status)
11. [Technical Debt and Open Risks](#11-technical-debt-and-open-risks)
12. [Development Priority](#12-development-priority)
13. [Planned Roadmap](#13-planned-roadmap)
14. [User Experience Philosophy](#14-user-experience-philosophy)
15. [MCP-First Agent Engineering Philosophy](#15-mcp-first-agent-engineering-philosophy)
16. [Recommended Immediate Action](#16-recommended-immediate-action)
17. [Final Assessment](#17-final-assessment)
18. [Source Documents](#18-source-documents)

---

## 1. Executive Summary

BuildFlow는 사용자가 원하는 AI 업무 결과를 설명하면 요구사항을 정리하고,
AI Agent를 설계·구축·배포·검증한 뒤, 완성된 Agent를 BPS Package로
공유할 수 있게 하는 AI Agent Builder and Marketplace다.

현재 BuildFlow는 단순한 설계 도구나 코드 생성기가 아니다. Requirement,
Architecture, Build Plan, Credential, Approval, Provisioning, Deployment,
Verification을 연결하는 자동 구축 기반을 보유하고 있으며, 실제 GitHub,
Supabase, Vercel, OpenAI 환경에서 대표 AI 문의 Agent를 구축한 Evidence를
확보했다.

또한 General CRUD Task Manager를 실제 구축하여 Execution Engine의 두 번째
경로를 검증했다. 다만 제품 전략은 범용 Web App과 Platform 생성이 아니라
AI Agent 자동 구축에 집중하도록 변경되었다. CRUD 결과는 삭제하지 않고
회귀 검증 자산으로 보존한다.

현재 가장 중요한 다음 과제는 Provider Adapter를 더 추가하는 것이 아니다.
Agent Capability, Block, Blueprint, MCP Tool, Generator, Validator를
일관된 계약으로 정의하는 것이다.

```text
현재 핵심 성과

Requirement
→ Architecture
→ Build Plan
→ Credential / Consent / Approval
→ GitHub / Supabase / Vercel Provisioning
→ OpenAI 기능 실행
→ Health Check
→ Verification Persistence
→ READY_WITH_WARNINGS
```

```text
다음 핵심 확장

Agent Capability
→ Block Contract
→ MCP Server Contract
→ Agent Blueprint
→ Agent Generator
→ Agent Validator
→ AI Agent Package
→ Marketplace
```

---

## 2. Official Product Definition

### 2.1 Product identity

> BuildFlow는 사용자의 목표를 실제 동작하는 AI Agent로 구축·검증·배포하고,
> 완성된 Agent를 안전한 Package로 공유하게 하는 AI Agent Factory다.

BuildFlow의 역할은 다음과 같다.

1. 사용자의 목표를 이해한다.
2. 필요한 정보만 질문한다.
3. 제약, 비용, 권한, 사용자 작업을 분류한다.
4. Agent Architecture를 설계한다.
5. 실행 가능한 Build Plan을 만든다.
6. 필요한 Credential, Consent, Approval을 준비한다.
7. 외부 Provider에 리소스를 구축한다.
8. Agent 기능과 연결 상태를 실제로 검증한다.
9. 사용 가능한 주소와 운영 상태를 전달한다.
10. 검증된 Agent를 Versioned Package로 공유할 수 있게 한다.

### 2.2 Product focus

현재 핵심 제품 범위:

- AI Agent 자동 설계
- AI Agent Runtime과 Delivery Surface 생성
- Credential·Consent·Approval 관리
- Agent 배포
- 기능 및 Provider Verification
- AI Agent Package Export·Import
- 검증된 Agent의 Marketplace 공유
- MCP Tool 소비와 Agent MCP Server 제공

현재 핵심 범위가 아닌 항목:

- 범용 Web App Builder
- 범용 SaaS Builder
- 범용 Platform Builder
- 모든 자연어 요청을 임의 코드로 생성하는 범용 개발 Agent
- 검증 없이 생성 결과를 Marketplace에 게시하는 기능

Web UI, API, Database, Auth, Hosting은 독립적인 제품 목표가 아니라 AI
Agent를 사용·관리·운영하는 데 필요한 Delivery Surface로 취급한다.
범용 Web App과 Platform Builder는 현재 개발 대상이 아니며, 실제 Agent
사용 Evidence와 시장 요구가 충분히 확인된 이후의 장기 Roadmap으로만
유지한다.

---

## 3. Product Principles

### 3.1 Outcome First

사용자는 기술 구성보다 완료 후 사용할 수 있는 결과를 먼저 본다.

```text
완료되면 사용할 수 있는 기능
→ 현재 AI 작업
→ 진행률
→ 예상 시간
→ 예상 비용
→ 사용자 작업
→ 기술 상세
```

### 3.2 AI Chief Engineer

BuildFlow는 조용하지만 유능한 AI Chief Engineer처럼 행동한다.

- 과장하지 않는다.
- 확정된 것만 확정적으로 말한다.
- 문제를 숨기지 않는다.
- 기술보다 결과와 영향을 설명한다.
- 실패 시 원인, 영향, 해결 방법, 자동 재개 여부를 함께 말한다.

### 3.3 Evidence before READY

메모리 상태나 구조 검증만으로 READY를 선언하지 않는다.

READY 판단에는 다음 Evidence가 필요하다.

- 필수 Provider Credential 유효성
- 실제 Provisioning 결과
- Deployment 상태
- Health Check
- Agent 기능 테스트
- 유효하고 만료되지 않은 Verification
- Critical 오류 없음

백업, 장기 모니터링, 운영 정책처럼 확인되지 않은 항목은 Warning으로
분리한다.

### 3.4 Security by boundary

- Secret 원문은 LLM Prompt에 전달하지 않는다.
- Secret은 Event, Snapshot, Error, Report, Package에 저장하지 않는다.
- Provider Adapter 또는 MCP Gateway의 서버 경로만 Credential을 사용한다.
- Client가 전달하는 실행 Command나 성공 Evidence를 신뢰하지 않는다.
- 비용, 외부 쓰기, 삭제, 공개, 권한 변경은 Approval Gate를 통과한다.
- 모든 Action은 사용자와 Project 소유권을 다시 확인한다.

---

## 4. Current Project Status

### 4.1 Operational state

| Item | Current state |
|---|---|
| Workflow status (internal) | `REVIEW` |
| Active task | `CAPABILITY-002 — General CRUD Web App Blueprint` |
| Active task result | Implementation and Live Evidence complete |
| Required action | PM/CTO Review and commit-scope decision |
| Next candidate | `AGENT-FOUNDATION-001` |
| Next candidate status | `AWAITING_APPROVAL` |
| Latest committed baseline | `d3c0753 docs: define ai communication language` |
| Push | Not performed |
| Product focus | AI Agent automatic build and Marketplace sharing |

### 4.2 Worktree condition

현재 Worktree에는 다음 변경이 함께 보존되어 있다.

- STABILIZE-READY-001 기반 변경
- LIVE-EVIDENCE-001/002
- CAPABILITY-002
- HARDEN-003 일부 문서
- PROJECT/PRODUCT Review 문서
- Product direction, Agent, MCP 문서 변경
- Provider Credential Vault 및 Verification 관련 Migration

따라서 다음 Agent 구현을 즉시 추가하면 여러 Sprint의 변경이 한 Commit
범위에 섞일 위험이 있다.

우선 해결해야 할 작업 무결성 문제:

1. 현재 미커밋 파일의 Sprint 소유권을 분류한다.
2. 선행 Stabilize와 Live Evidence 의존성을 확인한다.
3. CAPABILITY-002 Commit 범위를 PM/CTO가 승인한다.
4. 코드 Commit과 Review 문서 Commit을 분리한다.
5. 이후 Agent Foundation을 별도 Sprint로 시작한다.

---

## 5. Implemented Product and Engineering Capabilities

### 5.1 Requirement and planning

- 자연어 Goal Parser
- Requirement Snapshot
- Clarification Question
- Constraint Classification
- Consent Requirement
- Build Preference
- Architecture Candidate
- 선택 Architecture Snapshot
- Build Intelligence
  - 예상 구축 시간
  - 예상 비용
  - Risk
  - Confidence
  - Automation
- Build Plan과 Dependency

### 5.2 Autonomous orchestration

- Autonomous Build Session 영구 저장
- 상태 전환
  - 분석
  - Credential 대기
  - Consent 대기
  - Approval 대기
  - Provisioning
  - Verification
  - Recovery
  - READY
  - READY_WITH_WARNINGS
  - BLOCKED
  - FAILED
  - CANCELLED
- 사용자 작업 완료 후 자동 재개
- 성공 단계 중복 실행 방지
- 제한된 재시도
- Fatigue Metrics
- Session 복원

### 5.3 Credential and approval

- GitHub Credential Reference
- Supabase Credential Reference
- Vercel Credential Reference
- OpenAI Credential Reference
- Supabase Vault 기반 암호화 저장
- Credential Version
- 유효성 상태
- Credential 변경 시 Verification 무효화
- 통합 Consent와 Approval Evidence
- Approval Scope Version

### 5.4 Provider provisioning

구현된 Provider 경로:

- GitHub
  - Private Repository 생성
  - Source 파일 반영
  - 기존 성공 결과 재사용
- Supabase
  - 기존 Project 검증
  - Schema 적용
  - RLS와 Policy 적용
  - Auth 설정
- Vercel
  - Project 생성
  - GitHub Repository 연결
  - Environment Reference 설정
  - Deployment 생성
  - Deployment 상태 확인
- OpenAI
  - 실제 Responses API 기능 호출

### 5.5 Verification persistence

- Verification Run
- Verification Target
- Verification Attempt
- safe Evidence
- safe Error
- 결과 만료
- 최신 완료 결과 선택
- Credential 변경 무효화
- 필수·선택 Provider 구분
- READY, READY_WITH_WARNINGS, BLOCKED, FAILED 계산
- Worker용 owner-checked persistence
- 다른 사용자 접근 차단

### 5.6 Deployment and delivery

- Deployment Session
- 예상 시간과 비용
- 자동화율
- 사용자 작업 수
- Deployment URL
- Health Check
- Production Ready 판단 계약
- 기술 상세 접기
- 결과 중심 Delivery UI

### 5.7 Package foundation

- BPS v1.0 Specification
- Package Builder
- `.bfpkg` Export
- Package Preview
- Manifest와 Artifact Validation
- Checksum
- Package Installer
- Compatibility Check
- Secret 제외
- 설치 후 Verification이 필요한 상태 구분

Marketplace UI와 Publishing은 아직 구현하지 않는다.

### 5.8 UX, design, and brand

- Guided Build Experience
- Progress Experience
- Outcome First
- AI Narrative
- BuildFlow Design Language
- Visual Token과 Panel System
- AI Communication Language
- Confidence Language
- AI Chief Engineer Tone

---

## 6. Live Evidence

### 6.1 TEST A — AI Inquiry Agent

판정: **PASS / PM APPROVED**

실제 확인된 결과:

- GitHub Private Repository 생성
- Source 파일 업로드
- Supabase `buildflow_inquiries` Schema 생성
- RLS 적용
- Vercel Production Deployment
- 공개 웹 화면 HTTP 200
- Health Check HTTP 200
- 실제 OpenAI 응답 성공
- Inquiry DB 저장
- GitHub, Supabase, Vercel, OpenAI Verification `VERIFIED`
- Verification 최종 상태 `READY`
- Autonomous Session `READY_WITH_WARNINGS`
- 재실행 멱등성 PASS
- Cross-user Project·Session·Verification 접근 차단 PASS

대표 Repository:

`https://github.com/leehojae0618-ui/live-evidence-ai-d10bcbd6`

대표 Deployment:

`https://live-evidence-ai-d10bcbd6-2bd9kilz8-leehojae0618-uis-projects.vercel.app`

Warning:

- Backup 미검증
- 장기 Monitoring 미검증
- Auth와 관리자 화면은 TEST A v1 범위가 아님

### 6.2 TEST B — General CRUD Task Manager

판정: **PASS / CAPABILITY-002 PM REVIEW REQUIRED**

실제 확인된 결과:

- GitHub Private Repository 생성
- Supabase Auth 회원가입·로그인
- 사용자별 Todo CRUD
- 검색과 상태 필터
- 상태 변경
- 관리자 전체 읽기
- Cross-user Todo 접근 차단
- Supabase RLS와 Policy
- Vercel Deployment
- Home, Admin, Health HTTP 200
- Verification 최종 상태 `READY`
- Autonomous Session `READY_WITH_WARNINGS`
- 재실행 멱등성 PASS

대표 Repository:

`https://github.com/leehojae0618-ui/live-evidence-task-manager-8e42f7c9`

대표 Deployment:

`https://live-evidence-ta[REDACTED_OPENAI_KEY].vercel.app`

전략적 처리:

- 구현과 Evidence는 보존한다.
- AI Agent Engine의 회귀 검증에 활용한다.
- 범용 Web App 제품 확장은 진행하지 않는다.

### 6.3 Quality evidence

CAPABILITY-002 완료 보고 기준:

- Test files: 37 PASS
- Tests: 163 PASS
- Lint: PASS
- Typecheck: PASS
- Production build: PASS
- `git diff --check`: PASS
- Linked Supabase DB lint: PASS
- Migration alignment: `20260718001200`까지 PASS로 기록
- Database Types regenerated
- Secret scan: PASS
- `.env.local`: ignored and untracked

---

## 7. Current Architecture

### 7.1 Main layers

```text
User Goal
→ Requirement Engine
→ Clarification / Constraint / Consent
→ Architecture Engine
→ Build Intelligence
→ Build Planner
→ Autonomous Orchestrator
→ Provider Provisioning
→ Deployment
→ Verification
→ Delivery
→ BPS Package
```

### 7.2 Provisioning plane

Provider Adapter는 Agent Runtime을 구축하는 역할을 한다.

```text
GitHub Adapter
→ Repository and Source

Supabase Adapter
→ Database, RLS, Auth, safe settings

Vercel Adapter
→ Project, environment, deployment

OpenAI Adapter path
→ Agent functional AI response
```

### 7.3 Agent runtime plane

현재 Agent Runtime은 `ai-inquiry-v1`처럼 고정된 Blueprint와 Artifact
Generator를 통해 만들어진다.

아직 부족한 일반 계약:

- Agent Capability
- Agent Delivery Mode
- Agent Interface Mode
- Block Contract
- Agent Blueprint Contract
- Agent Definition
- Agent Validator
- MCP Tool Contract

### 7.4 MCP runtime plane

MCP는 Provider Adapter를 대체하지 않는다.

| Layer | Responsibility |
|---|---|
| Connector Registry | 외부 서비스와 Capability 설명 |
| Provider Adapter | Repository, DB, Hosting 구축·배포 |
| MCP Server | Agent가 실행 중 사용할 Tool과 Resource 제공 |
| BuildFlow MCP Gateway | 발견, 호환성, Credential, Permission, Approval, 실행, 정제, Evidence |
| Generated Agent MCP Server | 검증된 Agent 기능을 다른 AI Client에 제공 |

BuildFlow의 MCP 역할은 양방향이다.

1. **MCP Consumer**

   Agent가 승인된 외부 MCP Server의 Tool을 사용한다.

2. **MCP Publisher**

   검증된 Agent를 선택적으로 MCP Server로 배포한다.

MCP 실행 보안 원칙:

- Server와 Tool allowlist
- 서버 측 input schema 재검증
- Credential Reference 격리
- 비용·쓰기·삭제·공개·권한 변경 Approval
- Timeout·Retry·Idempotency
- Safe Result Sanitization
- Raw response body 미저장
- Prompt injection에 의한 권한 확대 차단
- Project Ownership 재검증

---

## 8. AI Agent Target Model

### 8.1 Delivery modes

| Mode | Purpose | Example |
|---|---|---|
| `HEADLESS` | UI 없이 자동 실행 | Scheduler, Email automation |
| `CHAT` | 대화형 Agent | 문의 Agent, 지식 검색 |
| `BUSINESS` | 승인·기록·설정 중심 | 운영 Agent, 업무 승인 Agent |

### 8.2 Interface modes

| Interface | Purpose |
|---|---|
| `API` | 외부 서비스 호출 |
| `WEBHOOK` | Event 기반 실행 |
| `SCHEDULE` | 주기적 자동 실행 |
| `WEB_CHAT` | 사용자 대화 화면 |
| `MCP_SERVER` | 다른 AI Client에 Tool로 제공 |

### 8.3 Planned block types

- Model
- Prompt
- Trigger
- Tool
- Memory
- Knowledge
- Guardrail
- Output
- Delivery Surface

Tool Block은 다음 MCP 정보를 참조해야 한다.

- MCP Server ID
- MCP Server Version
- Tool Capability
- Input/Output Schema
- Credential Definition
- Permission
- Risk Class
- Approval Scope
- Retry와 Timeout
- Verification Rule

---

## 9. BPS and Marketplace Direction

### 9.1 Package Source of Truth

BPS v1.0은 Package transport format의 Source of Truth로 유지한다.

AI Agent 제품 방향에서는 BPS 위에 AI Agent Package Profile을 정의한다.

Package 포함 대상:

- Requirement
- Agent Capability
- Agent Blueprint
- Prompt
- Build Plan
- Connector Definition
- Credential Definition
- MCP Dependency
- Permission과 Approval Requirement
- Environment Template
- Verification Rule
- Installer
- Version
- Artifact
- Integrity Checksum

Package 금지 대상:

- Secret
- Access Token
- Private Key
- 개인정보
- Provider Response Body
- Live Session
- Unredacted Log

### 9.2 Marketplace publication gate

Agent는 생성 직후 Marketplace에 등록하지 않는다.

```text
Generate
→ Contract Validate
→ Provision
→ Functional Verification
→ Security Review
→ Evidence
→ Versioned Package
→ Publish
```

Marketplace에서 필요한 후속 기능:

- Package Listing
- Version Promotion
- Deprecation
- Compatibility
- Trust Policy
- Creator
- Installation
- Evidence 표시
- Permission과 비용 표시

Search, Rating, Community, Payment는 Agent Package의 검증된 배포 경로가
확립된 이후 진행한다.

---

## 10. Security and Ownership Status

### 10.1 Implemented controls

- Supabase Authentication
- Project owner RLS
- Server Action 소유권 재확인
- Credential Vault 저장
- Secret-safe Provider Result
- Raw Provider response body 미저장
- Atomic Verification Persistence
- Service-role-only Worker RPC
- Client READY Evidence 위조 차단
- Credential 변경 시 Verification 무효화
- Cross-user Project·Session·Verification 접근 차단 Evidence
- Private GitHub Repository 기본값
- 위험 SQL validation
- Approval Scope 저장

### 10.2 Remaining security and release evidence

- 전체 브라우저·Device Matrix 재검증
- 반복 가능한 Multi-account E2E Suite
- MCP Prompt Injection 방어 계약
- MCP Tool Permission과 Risk Registry
- Package Signature와 Trust Policy
- Verified-email Auth 정책
- 운영 Backup과 Monitoring Evidence

---

## 11. Technical Debt and Open Risks

### P0 — Work and release integrity

- CAPABILITY-002가 아직 REVIEW 상태다.
- 여러 Sprint 변경이 하나의 Worktree에 함께 존재한다.
- 새 Agent 구현 전 Commit 경계와 문서 경계를 확정해야 한다.

### P1 — Agent foundation

- Agent Capability Source of Truth 없음
- Agent Delivery와 Interface Mode 계약 없음
- Block Contract 없음
- Agent Blueprint와 Artifact Template 결합
- Agent Definition Validator 없음

### P2 — MCP foundation

- MCP Server Registry 없음
- Tool Discovery Snapshot 없음
- MCP Compatibility와 Health 계약 없음
- MCP Credential·Permission·Approval 정책 없음
- MCP Safe Result와 Verification Evidence 연결 없음
- Generated Agent MCP Server 공개 계약 없음

### P3 — Runtime and operations

- 전용 Queue Worker 없음
- Vercel 최종 Polling이 Project UI 재진입에 의존
- Worker restart, lease, heartbeat, backoff 실증 부족
- Backup과 장기 Monitoring 미검증

### P4 — Product and business

- Billing-grade Pricing Catalog 없음
- 무료·유료 Plan Boundary 미확정
- Pilot 고객 성공률과 지불 의사 Evidence 없음
- Agent Marketplace Trust와 책임 정책 미확정

### Preserved regression debt

- General CRUD v1은 자동 이메일 확인을 사용한다.
- 이메일 소유권 검증이 필요한 Production Agent에는 별도 SMTP와 Confirmation
  Policy가 필요하다.

---

## 12. Development Priority

### Priority 0 — Close current work safely

1. CAPABILITY-002 PM/CTO Review
2. LIVE-EVIDENCE-002 최종 판정 확정
3. 미커밋 변경의 Sprint별 파일 분류
4. Code Commit과 Review Document Commit 분리
5. Commit 승인 전 전체 Quality Gate 재실행

### Priority 1 — Agent contract foundation

`AGENT-FOUNDATION-001`

목표:

- Agent Capability Model
- Delivery Mode
- Interface Mode
- Block Contract
- MCP Reference Contract
- Agent Blueprint Contract
- Agent Definition
- Contract Validator
- `ai-inquiry-v1` compatibility mapping

실제 외부 MCP 연결과 Marketplace는 포함하지 않는다.

### Priority 2 — MCP foundation

`MCP-FOUNDATION-001`

목표:

- MCP Server Registry
- Tool Discovery Snapshot
- Compatibility와 Health
- Credential Reference isolation
- Permission, Risk, Approval Policy
- Tool allowlist
- 서버 측 Input Validation
- Timeout, Retry, Idempotency
- Safe Result Sanitization
- Verification Evidence
- Generated Agent MCP Server publication contract

### Priority 3 — Agent generator

`AGENT-GENERATOR-001`

목표:

- 검증된 Block 조합
- Requirement에서 결정론적 Agent Blueprint 선택
- Delivery Mode와 Interface 자동 선택
- Artifact와 Runtime Definition 생성
- 지원하지 않는 조합 사전 차단

LLM이 임의의 실행 Command를 직접 생성하고 실행하는 구조는 허용하지 않는다.

### Priority 4 — Agent validator

`AGENT-VALIDATION-001`

목표:

- Agent Contract Validation
- Tool Permission Validation
- Prompt와 Guardrail Validation
- Headless·Chat·Business 기능 검증
- MCP Tool functional test
- Security Evidence
- READY 판단 연결

### Priority 5 — Agent package

`AGENT-PACKAGE-001`

목표:

- BPS AI Agent Profile
- MCP Dependency
- Capability와 Interface 선언
- Permission과 Approval Requirement
- Agent Verification Rule
- Secret-free Export·Import Round-trip

### Priority 6 — Live evidence

`AGENT-EVIDENCE-001`

두 번째 AI Agent는 기존 Chat Agent와 다른 실행 형태를 선택한다.

권장 대상:

```text
Headless Agent
→ Schedule 또는 Webhook
→ MCP Tool 호출
→ 결과 저장 또는 전달
→ Functional Verification
→ Package Export
```

성공 기준:

- 실제 MCP Server 연결
- 실제 Tool 실행
- Secret 비노출
- 승인 범위 준수
- 실제 결과 Evidence
- 재실행 멱등성
- READY 또는 명확한 Warning

### Priority 7 — Marketplace

`MARKETPLACE-AGENT-001`

검증된 Agent Package만 Listing할 수 있도록 한다.

---

## 13. Planned Roadmap

```text
CAPABILITY-002 Review and Commit Boundary

↓

AGENT-FOUNDATION-001
Agent Capability and Contract Foundation

↓

MCP-FOUNDATION-001
MCP Server Registry and Secure Gateway Contract

↓

AGENT-GENERATOR-001
Deterministic Agent Generator

↓

AGENT-VALIDATION-001
Agent Functional and Security Validator

↓

AGENT-PACKAGE-001
BPS AI Agent and MCP Package Profile

↓

AGENT-EVIDENCE-001
Second Agent Live Evidence

↓

MARKETPLACE-AGENT-001
Verified Agent Package Listing

↓

RC Security / Resilience / Operations Evidence

↓

Beta

↓

Launch
```

Future:

- Block Generator
- Blueprint Generator
- Learning Engine
- Advanced Self-Healing
- Alternative Provider selection
- Enterprise policy
- 범용 Web App과 Platform Builder

Future 기능은 실제 Agent 사용 Evidence가 충분히 쌓인 이후 별도 승인한다.

---

## 14. User Experience Philosophy

### 14.1 Experience definition

BuildFlow의 사용자 경험은 Workflow를 편집하거나 AI와 대화하는 경험으로
정의하지 않는다.

> 사용자는 AI Agent를 직접 설계하는 기술자가 아니라, AI 개발팀에 원하는
> 결과를 맡기고 중요한 결정을 승인하는 책임자다.

BuildFlow는 사용자의 목표를 받아 Requirement를 정리하고, Agent를
설계·구축·배포·검증한 뒤 결과와 Evidence를 보고한다. 사용자가 느껴야
하는 핵심 경험은 “도구를 조작했다”가 아니라 “AI 개발팀이 프로젝트를
완료했다”는 것이다.

```text
사용자
→ 원하는 결과 설명
→ 필요한 질문에 답변
→ 비용·권한·외부 변경 승인
→ AI 개발팀의 진행 상황 확인
→ 검증된 Agent 인수
```

### 14.2 BuildFlow is not a Workflow Tool

Workflow는 BuildFlow 내부에서 Agent 구축 단계를 실행하고 Dependency를
관리하기 위한 구현 구조다. 사용자가 직접 노드를 연결하거나 실행 순서를
설계하는 것이 기본 경험이 되어서는 안 된다.

사용자에게 Workflow 자체를 요구하면 다음 문제가 발생한다.

- 사용자가 내부 기술 구조를 이해해야 한다.
- 목표보다 구현 순서를 먼저 고민하게 된다.
- BuildFlow가 자동 구축 플랫폼이 아니라 자동화 편집기로 보인다.
- 구축 책임이 AI가 아니라 사용자에게 다시 돌아간다.

따라서 기본 UI는 Workflow, Task, Command, Adapter, Provider Log를 전면에
노출하지 않는다. 내부 실행 과정은 BuildFlow가 관리하고 사용자는 다음만
우선 확인한다.

- 무엇이 완성되는가
- 현재 AI가 무엇을 하고 있는가
- 얼마나 남았는가
- 비용이나 권한 변화가 있는가
- 사용자가 지금 해야 할 일이 있는가
- 어떤 Evidence로 완료가 확인되었는가

Workflow와 기술 로그는 문제 분석이나 전문가 검토가 필요한 경우에만
`상세 보기`에서 제공한다.

### 14.3 BuildFlow is not ChatGPT

채팅은 BuildFlow의 제품 그 자체가 아니라 Requirement를 수집하고
Clarification을 진행하는 인터페이스 중 하나다.

ChatGPT형 경험은 일반적으로 답변이 생성되는 순간 대화가 끝난다.
BuildFlow의 경험은 대화 이후부터 본격적으로 시작한다.

```text
대화
→ Requirement Snapshot
→ Agent Architecture
→ Build Plan
→ Credential / Consent / Approval
→ Provisioning
→ Deployment
→ Functional Verification
→ Delivery
```

채팅 응답이 좋아도 Agent가 실제로 구축·배포·검증되지 않았다면 BuildFlow의
핵심 결과는 완료되지 않은 것이다. 반대로 사용자가 채팅을 많이 하지
않더라도 필요한 정보가 충분하다면 BuildFlow는 구축 단계로 빠르게
진행해야 한다.

따라서 채팅 UI는 다음 원칙을 따른다.

- 이미 알고 있는 내용을 반복 질문하지 않는다.
- 현재 단계에서 필요한 정보만 질문한다.
- 질문의 이유와 결과에 미치는 영향을 설명한다.
- 자유로운 대화보다 결정 가능한 선택을 우선한다.
- 답변을 받으면 별도 수동 명령 없이 다음 단계로 이어간다.

### 14.4 AI Agent Command Center

BuildFlow의 기본 제품 형태는 Project Dashboard가 아니라 `AI Agent
Command Center`다.

사용자는 여러 기술 메뉴를 탐색하는 것으로 시작하지 않는다. 첫 화면에서
AI 개발팀에게 무엇을 구축할지 설명한다.

```text
무엇을 자동화하고 싶으신가요?

예:
고객 문의를 분류하고 답변 초안을 작성한 뒤
담당자에게 전달하는 AI Agent를 만들어 주세요.
```

첫 입력 이후 BuildFlow는 다음을 한 화면에서 이해할 수 있게 정리한다.

- 사용자가 얻게 될 Agent의 기능
- Agent가 처리할 입력과 출력
- 필요한 외부 계정과 데이터
- 자동화 가능한 범위
- 예상 구축 시간
- 예상 비용
- 사용자에게 필요한 작업
- 중요한 Approval 항목
- 완료 후 제공될 Interface

Project 목록, Session, Deployment, Verification은 여전히 필요하지만 첫
경험의 중심은 아니다. 이 정보들은 AI 개발팀에 맡긴 업무를 추적하고
관리하는 Command Center의 하위 구조다.

### 14.5 User is a goal owner, not a prompt engineer

사용자는 Prompt Engineering, Model Parameter, Tool Schema, Database Policy,
Deployment 설정을 학습할 필요가 없어야 한다.

사용자의 책임:

- 원하는 업무 결과 설명
- 대상 사용자와 입력·출력 설명
- 중요한 제약과 금지 조건 제공
- 비용·권한·데이터 사용 승인
- 최종 결과 확인

BuildFlow의 책임:

- 모호한 목표를 구조화
- 부족한 정보 식별
- 필요한 질문만 생성
- Requirement와 Constraint 정리
- 적합한 Agent Capability와 Blueprint 선택
- 안전한 Block과 MCP Tool 구성
- Build Plan 생성
- 구축·배포·검증
- 실패 복구 또는 필요한 사용자 작업 안내

사용자에게 “좋은 Prompt를 작성해야 좋은 결과가 나온다”는 책임을
전가하지 않는다. 사용자의 자연스러운 목표 설명을 BuildFlow가 실행 가능한
Agent Definition으로 변환해야 한다.

### 14.6 Outcome First experience

모든 주요 화면은 개발 과정보다 결과를 먼저 보여준다.

Build 시작 전:

```text
완료되면 사용할 수 있습니다.

✓ 고객 문의 자동 분류
✓ 답변 초안 생성
✓ 문의 내역 저장
✓ 담당자 전달
✓ 사용 가능한 API 또는 화면
```

구축 중:

```text
AI가 고객 문의 Agent를 구축하고 있습니다.

✓ 데이터 저장 준비 완료
✓ AI 응답 구성 완료
▶ 외부 서비스 연결 검증 중

예상 남은 시간: 약 8분
사용자가 해야 할 작업: 없음
```

완료 후:

```text
고객 문의 Agent를 사용할 준비가 완료되었습니다.

사용 주소
관리 주소
연결된 서비스
검증 결과
예상 운영비
확인이 필요한 Warning
Package Export
다음 권장 작업
```

사용자는 Build Plan의 Task 개수보다 자신이 얻게 될 업무 능력을 먼저
이해해야 한다.

### 14.7 Controlled autonomy and approval

BuildFlow는 가능한 범위에서 자율적으로 진행하되, 영향이 큰 순간에는
반드시 사용자의 승인을 받는다.

승인이 필요한 대표 상황:

- 비용 발생 또는 승인된 비용 범위 증가
- GitHub, Supabase, Vercel 등 외부 Provider 리소스 생성
- Database Schema, RLS, Auth 설정 변경
- 외부 데이터 쓰기 또는 민감 데이터 전송
- 공개 Deployment
- 권한 범위 확대
- 삭제 또는 되돌리기 어려운 작업
- MCP Tool을 통한 외부 쓰기·삭제·비용 발생
- AI Agent Package의 Marketplace Publish

반복 승인을 줄이기 위해 동일 Build Session에서 예상 가능한 작업은 하나의
Approval Plan으로 묶는다.

```text
AI가 다음 작업을 진행하려고 합니다.

생성
- Private GitHub Repository
- Supabase Schema와 RLS
- Vercel Deployment

영향
- 공개 서비스 주소 생성
- 예상 추가 비용: 무료 범위
- 삭제 또는 Rollback 가능 여부 안내

진행을 승인하시겠습니까?
```

승인된 범위 안에서의 안전한 준비, 검증, 재시도, 상태 확인은 추가 승인을
요청하지 않는다. 비용·권한·공개 범위가 변경될 때만 추가 승인을 요청한다.

### 14.8 Transparency without technical overload

자율성은 불투명함을 의미하지 않는다. BuildFlow는 내부 기술 작업을 기본
화면에서 숨기되, 사용자가 현재 상태와 판단 근거를 이해할 수 있게 한다.

기본 화면:

- 현재 만드는 Agent
- 완료 후 사용할 결과
- 현재 AI 작업
- 전체 진행률
- 예상 남은 시간
- 예상·발생 비용
- 사용자 작업
- 자동 재개 여부
- Warning 또는 Blocker

상세 화면:

- Build Plan
- Provider Command
- MCP Tool 실행
- Retry와 Recovery
- Verification Attempt
- Safe Error Code
- 기술 로그와 Evidence

기술 상세를 숨기는 것은 정보를 제거하는 것이 아니다. 일반 사용자에게
필요한 정보와 전문가에게 필요한 정보를 분리하는 것이다.

### 14.9 Trust and confidence language

BuildFlow는 검증되지 않은 상태를 완료로 표현하지 않는다.

잘못된 표현:

```text
완벽하게 구축되었습니다.
모든 설정이 정상입니다.
```

BuildFlow 표현:

```text
자동 구축과 기능 검증이 완료되었습니다.

현재 확인된 항목
- 서비스 접근
- AI 응답
- 데이터 저장

추가 확인이 필요한 항목
- 장기 Monitoring
- Backup 운영
```

실패도 공포스럽게 표현하지 않는다.

```text
OpenAI 연결을 확인하지 못했습니다.

원인
API Key의 사용 한도가 부족합니다.

영향
Agent 구축 결과는 보존되어 있지만 AI 응답 검증을 완료할 수 없습니다.

다음 작업
사용 가능한 Key를 연결하면 저장된 단계부터 자동으로 이어갑니다.
```

신뢰는 성공 메시지의 강도가 아니라 Evidence와 정직한 상태 구분에서
만들어진다.

### 14.10 First-screen philosophy

첫 화면의 핵심 질문은 “어떤 Project를 열겠습니까?”가 아니다.

> “무엇을 대신할 AI Agent를 구축할까요?”

첫 화면의 우선 구조:

1. Agent Command Input
2. 만들 수 있는 결과 예시
3. 최근 맡긴 Agent 작업
4. 진행 중이거나 사용자 작업이 필요한 Build
5. 검증 완료된 Agent
6. Package와 Marketplace 진입

첫 화면에서 피해야 할 구조:

- 빈 Dashboard와 지표 중심 화면
- Workflow Template 선택 강요
- Provider부터 선택하게 하는 흐름
- Model과 기술 Stack부터 고르게 하는 흐름
- 긴 설정 Form
- Chat만 제공하고 다음 구축 단계가 보이지 않는 흐름

### 14.11 User experience principles

#### Simplicity

사용자는 목표와 중요한 제약만 제공한다. 내부 기술 선택과 실행 순서는
BuildFlow가 관리한다.

#### Outcome First

기능명, Provider, Task보다 완료 후 사용할 업무 결과를 먼저 설명한다.

#### Transparency

현재 상태, 남은 시간, 비용, Warning, 사용자 작업, Verification 근거를
명확히 표시한다.

#### Trust

확정된 사실과 추정, 검증 완료와 검증 대기를 구분한다. READY를 과장하지
않는다.

#### Controlled Autonomy

승인된 범위에서는 AI가 중단 없이 진행하고, 영향 범위가 바뀔 때만
사용자를 호출한다.

#### Human Approval

비용, 권한, 외부 변경, 공개, 삭제, Marketplace Publish는 사용자가 최종
통제한다.

#### Evidence First

완료 판단은 실제 Health, 기능 결과, Provider 상태, Security Evidence를
기준으로 한다.

#### Progressive Disclosure

일반 사용자에게는 결과와 현재 행동을 보여주고, 기술 정보는 상세 보기에서
제공한다.

#### Resume by Default

사용자가 페이지를 닫거나 다시 로그인해도 저장된 Session에서 이어진다는
사실을 명확히 안내한다.

#### Recovery with direction

실패 시 원인만 표시하지 않고 영향, 자동 복구 여부, 필요한 사용자 작업,
완료 후 자동 재개를 함께 설명한다.

### 14.12 Target emotional outcome

BuildFlow UX의 최종 목표는 사용자가 AI 기능을 조작하고 있다고 느끼게
하는 것이 아니다.

사용자는 다음과 같이 느껴야 한다.

- “내 목표를 이해했다.”
- “필요한 것만 물어본다.”
- “지금 AI 개발팀이 계속 일하고 있다.”
- “비용과 권한은 내가 통제한다.”
- “문제가 생겨도 무엇을 하면 되는지 알 수 있다.”
- “완료됐다는 판단에 실제 근거가 있다.”
- “이 Agent를 바로 사용하거나 Package로 공유할 수 있다.”

> BuildFlow UX의 성공은 사용자가 AI를 사용했다는 느낌이 아니라,
> AI 개발팀을 운영해 검증된 결과를 인수했다는 느낌으로 측정한다.

### 14.13 Official visual identity — Design Language v1

BuildFlow의 공식 시각 정체성은 `docs/design/DESIGN_LANGUAGE.md`의
**BuildFlow Design Language v1**을 Source of Truth로 사용한다.

핵심 정의:

- Product identity: `AI Agent Command Center`
- Experience: `Outcome First`
- AI presence: `Living Neural Network`
- Completion trust: `Evidence First`
- Visual character: `Dark Luxury`와 절제된 JARVIS-inspired workspace

기본 Canvas는 `#05070D`, AI active는 Electric Blue `#53D8FF`, 연결과
보조 강조는 Neon Violet `#7B61FF`를 사용한다. Orange는 승인·주의·비용,
Green은 검증 완료, Red는 실패·차단·파괴적 위험에만 사용한다.

Neural background, glass, blur, glow, pulse는 AI가 실제로 일하는 상태를
설명하는 경우에만 사용한다. 과도한 SF 장식, 지속적인 particle noise,
가독성을 해치는 glass, 상태와 무관한 가짜 activity는 허용하지 않는다.

첫 화면은 Dashboard metric이 아니라 다음 Agent Command Input으로
시작한다.

> 무엇을 대신할 AI Agent를 구축할까요?

사용자는 결과를 설명하고 BuildFlow는 필요한 질문, 설계, 구축, 검증을
이어간다. Workflow, Task, Provider, MCP, Adapter, Command, raw Log는
기본 화면에서 숨기고 전문가용 상세 정보로 분리한다.

Design Language v1의 채택은 기존 UI 전체가 이미 적용 완료됐다는 의미가
아니다. 현재 코드는 초기 token과 일부 Outcome First 화면을 포함하며,
Living Neural Network, 새 token, navigation, responsive·reduced-motion
QA와 전체 Design Review는 별도 승인된 UI 적용 작업에서 검증해야 한다.

---

## 15. MCP-First Agent Engineering Philosophy

### 15.1 MCP position in BuildFlow

MCP는 단순 Connector 보조 기능이 아니라 생성된 AI Agent가 외부 세계와
상호작용하는 표준 Tool Ecosystem이다.

BuildFlow는 외부 서비스의 모든 기능을 직접 구현하는 플랫폼을 목표로 하지
않는다. BuildFlow는 Agent가 수행해야 할 Capability를 정의하고, 검증된
MCP Tool을 발견·선택·통제·검증하여 안전한 Agent로 조립한다.

```text
Capability
→ Agent가 무엇을 해야 하는가

MCP Tool
→ 외부 세계에서 어떤 도구로 수행하는가

Blueprint
→ Capability와 Tool Requirement를 어떻게 연결하는가

Agent Generator
→ Registry에서 어떤 Tool을 선택하고 Agent에 포함하는가

Validator
→ 권한·위험·계약·실행 결과가 안전하고 유효한가
```

모든 Agent가 MCP를 반드시 사용해야 하는 것은 아니다.

- 순수 LLM 응답
- 내부 계산
- 자체 Runtime 기능
- 외부 상호작용이 없는 Agent

이러한 Agent는 MCP 없이 실행할 수 있다. 외부 시스템과 상호작용해야 하는
경우 MCP를 우선 검토하되, 공식 SDK 또는 기존 Provider Adapter가 더
안전하고 검증 가능하다면 해당 경로를 허용한다.

MCP Server 수가 많다는 이유만으로 지원 범위가 넓다고 주장하지 않는다.
실제 Tool 호출 Evidence가 없으면 해당 Capability를 `VERIFIED`로 표시하지
않는다.

### 15.2 BuildFlow Brain and MCP Hands

> BuildFlow는 Agent의 두뇌와 개발팀이며, MCP는 Agent가 외부 세계에서
> 행동하기 위한 표준화된 손과 도구다.

BuildFlow가 담당하는 영역:

- Goal 해석
- Requirement 구조화
- Capability 결정
- Blueprint 선택·생성
- Tool Requirement 정의
- 권한·비용·승인 정책
- Agent Definition 생성
- Runtime과 Delivery Surface 구축
- 기능·보안 검증
- Package 생성
- Marketplace Publish Gate

MCP가 담당하는 영역:

- Tool Discovery
- Resource Access
- 외부 서비스 읽기
- 외부 서비스 쓰기
- 검색
- 전송
- 실행
- 구조화된 결과 반환

BuildFlow는 MCP Tool이 반환한 내용을 그대로 신뢰하지 않는다. Tool
호출 전에는 입력, 권한, 위험, Approval Scope를 검증하고, 호출 후에는
Output Schema, 크기, 안전성, Evidence를 검증한다.

### 15.3 Capability before MCP Tool

Agent Capability를 특정 Provider, MCP Server 또는 Tool 이름에 종속시키지
않는다.

예:

```text
EMAIL_READ Capability
→ Gmail MCP Tool
또는
→ Microsoft Graph MCP Tool
또는
→ IMAP MCP Tool
```

```text
TEAM_MESSAGE_SEND Capability
→ Slack MCP Tool
또는
→ Microsoft Teams MCP Tool
```

Blueprint는 가능한 경우 특정 Tool 이름보다 Capability Requirement를 먼저
선언한다.

```text
requiredCapability: EMAIL_READ
inputType: email-query
outputType: email-message-list
permission: email.read
riskClass: READ_EXTERNAL
```

특정 Tool이 제품 계약상 반드시 필요한 경우에만 Version이 지정된 Tool
Dependency를 선언한다. 이를 통해 Tool 교체 가능성, 사용자 소유 Provider,
지역·보존 정책, 장애 시 대체 경로를 평가할 수 있다.

### 15.4 MCP Registry

MCP Registry는 사용 가능한 MCP Server와 Tool의 단순 목록이 아니다.
BuildFlow가 Tool을 신뢰하고 선택할 수 있도록 호환성, 보안, 운영 Evidence를
제공하는 Source of Truth다.

향후 Registry가 관리해야 할 최소 정보:

- MCP Server ID
- Version
- Publisher
- Transport
- Endpoint 또는 connection profile
- Health Policy와 현재 Health
- Tool 목록
- Resource 목록
- Prompt 목록
- Input Schema
- Output Schema
- Capability Mapping
- Credential Definition
- Permission
- Risk Class
- Approval Scope
- Timeout
- Retry Policy
- Idempotency Policy
- Rate Limit Policy
- Output Size Limit
- Verification Rule
- Trust Status
- Deprecation Status
- Compatibility 범위
- 최근 검증 Evidence

Registry에 등록되었다는 사실만으로 실행 가능한 것은 아니다. Project,
Agent Blueprint, Credential, Permission, Approval, Runtime compatibility를
모두 통과해야 한다.

### 15.5 MCP Tool Selection

Agent Generator는 Requirement에서 도출된 Capability Requirement를 MCP
Registry의 Tool 후보와 비교한다.

선택 기준:

1. Capability 충족 여부
2. Input/Output Schema 호환성
3. Credential 사용 가능 여부
4. 사용자가 소유하거나 승인한 Provider
5. 최소 권한
6. 예상 비용
7. Region과 데이터 처리 정책
8. Server Health
9. Version compatibility
10. Verification Evidence
11. 실제 성공률
12. 사용자 선호
13. 대체 Tool 존재 여부
14. Retry와 Idempotency 안전성

선택 결과:

- 단일 안전 Tool을 결정할 수 있으면 `RESOLVED`
- Credential 또는 사용자 선택이 필요하면 `USER_ACTION_REQUIRED`
- 호환 Tool이 없으면 `UNSUPPORTED`
- 권한·위험·비용이 승인 범위를 넘으면 `APPROVAL_REQUIRED`
- Registry나 Health가 불확실하면 `BLOCKED`

LLM이 임의 Tool 이름이나 임의 Command를 생성해 바로 실행해서는 안 된다.
LLM은 Capability와 의도를 제안할 수 있지만, 실제 Tool Resolution과 입력
검증은 서버의 Registry와 Policy를 기준으로 결정한다.

### 15.6 Provider Adapter and MCP separation

Provider Adapter와 MCP Server는 목적과 실행 시점이 다르다.

| Boundary | Provider Adapter | MCP Server |
|---|---|---|
| Primary role | Agent 실행 환경 구축 | Agent 업무 실행 Tool 제공 |
| Lifecycle | Build·Provisioning·Deployment | Runtime Invocation |
| Examples | GitHub, Supabase, Vercel | Gmail, Slack, Notion, Drive, Calendar, CRM |
| Main output | Repository, Database, Hosting, Deployment | External read, write, search, send, execute result |
| Approval | 리소스 생성·DB 변경·공개 배포 | 외부 쓰기·삭제·비용·권한 |
| Evidence | Resource와 Deployment Verification | Tool invocation과 Output Verification |

Provider Adapter:

- GitHub Repository
- Supabase Database, Auth, RLS
- Vercel 또는 Runtime Hosting
- Infrastructure Provisioning
- Deployment

MCP Server:

- Agent 실행 중 외부 업무 Tool 제공
- Runtime Tool Invocation
- 외부 Resource 검색과 접근
- 구조화된 결과 반환

동일 외부 서비스가 Provider와 Tool 역할을 모두 가질 수 있다. 예를 들어
GitHub는 Repository Provisioning Provider이면서 Issue·Pull Request 업무를
수행하는 MCP Tool이 될 수 있다. 이 경우에도 Credential Scope, Command,
Approval, Evidence 계약은 분리한다.

### 15.7 MCP Consumer and Publisher

BuildFlow는 MCP Consumer와 Publisher 역할을 모두 지원하는 방향으로
설계한다.

#### MCP Consumer

- 생성 Agent가 외부 MCP Tool 사용
- Registry에서 Server와 Tool 발견
- Capability Requirement를 Tool로 Resolve
- Credential Reference와 Permission 확인
- 실행 전 Approval과 Risk 검증
- 실행 후 Safe Evidence 저장

#### MCP Publisher

- 검증된 Agent를 다른 AI Client가 사용할 MCP Server로 제공
- Agent Capability를 Tool Interface로 노출
- Tool Schema와 Permission 명시
- 인증·Rate Limit·운영 정책 적용
- Agent Version과 Verification Evidence 연결

Publisher는 Agent가 존재한다는 이유만으로 자동 생성하지 않는다. 다음
조건이 필요하다.

- Agent Capability가 명확함
- Input/Output Schema가 안정적임
- Permission과 데이터 범위가 선언됨
- Functional Verification 통과
- 공개 범위 Approval 완료
- 인증과 사용량 정책 준비
- Versioned Package와 연결

### 15.8 MCP security boundary

MCP Tool이 존재한다는 이유만으로 사용할 수 있는 것은 아니다. BuildFlow의
Compatibility, Permission, Risk, Approval, Verification Gate를 통과해야
한다.

필수 보안 경계:

- MCP Server allowlist
- Tool allowlist
- Version pinning 또는 허용 Version Range
- 서버 측 Input Schema 재검증
- Credential Reference 격리
- Secret 원문 비노출
- Project Ownership 재확인
- Agent와 Package Permission 확인
- 비용·쓰기·삭제·공개·권한 확대 Approval
- Prompt Injection이 Tool Permission을 변경하지 못하도록 차단
- Raw Tool Response 저장 금지
- Safe Result Sanitization
- Timeout
- 제한된 Retry
- Idempotency 확인
- Rate Limit
- Output Size Limit
- Audit Evidence
- Tool 실행 전후 위험도 재평가

실행 전 위험도 재평가:

- 실제 입력이 승인된 데이터 범위를 벗어나는가
- Read로 선언된 Tool이 Write 효과를 발생시키는가
- 예상 비용이 승인 범위를 넘는가
- 공개 또는 삭제 효과가 새로 발생하는가
- Tool Version이나 Permission이 변경됐는가

실행 후 위험도 재평가:

- 결과에 Secret 또는 개인정보가 포함되었는가
- Output Schema와 크기 제한을 지켰는가
- 외부 변경이 승인된 범위와 일치하는가
- 후속 Tool 호출이 추가 권한을 요구하는가

### 15.9 MCP validation and evidence

MCP를 사용하는 Agent는 다음 Evidence 없이 READY가 될 수 없다.

- MCP Server Health 확인
- Tool Discovery 성공
- Server와 Tool Version 확인
- Input Schema 검증
- 최소 권한 확인
- Credential Reference 유효성
- 실제 Tool 호출
- Output Schema 검증
- Safe Evidence 저장
- Approval Scope 준수
- Timeout과 Retry 정책 확인
- 실패 및 복구 경로 확인

Verification 무효화 조건:

- Credential 변경
- Tool Version 변경
- Server Trust Status 변경
- Permission 또는 Scope 변경
- Input/Output Contract Breaking Change
- Verification 만료
- Health Policy 위반

MCP Verification Evidence에는 Secret, Raw Response, 개인정보 원문을
저장하지 않는다. 저장 가능한 예:

- Server ID와 Version
- Tool Name
- Capability
- 상태
- latency
- safe result class
- schema validation 결과
- permission class
- retry count
- timestamp
- safe error code

### 15.10 MCP dependency in Agent Package

BPS AI Agent Profile은 Agent가 요구하는 MCP Dependency를 선언해야 한다.

포함:

- Server ID
- Server Version Range
- Tool Capability
- Tool Name 또는 Tool Selector
- Input Contract
- Output Contract
- Credential Definition
- Permission
- Approval Requirement
- Risk Class
- Verification Rule
- Fallback Policy
- Optional 또는 Required 상태
- Compatibility 조건

제외:

- Secret
- Access Token
- Private Key
- Live Session
- Raw Response
- Unredacted Log
- Provider Credential 원문

Package Import는 MCP Dependency를 실행하지 않는다. 설치 전에 Registry
Resolution, Compatibility, Credential Requirement, Permission, Approval,
Verification Plan을 Preview한다.

### 15.11 MCP marketplace relationship

MCP Registry와 Agent Marketplace는 서로 다른 제품 경계다.

#### MCP Registry

- 사용 가능한 Server와 Tool 정보
- Publisher와 Trust
- Version과 Compatibility
- Capability Mapping
- Permission과 Risk
- Health와 Verification Evidence
- Deprecation

#### Agent Marketplace

- 검증된 Agent Blueprint
- Capability와 Block
- MCP Dependency
- Permission과 비용
- Verification Rule과 Evidence
- Versioned BPS Package
- Installer

Marketplace Publish Gate:

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

MCP Dependency가 해결되지 않았거나 실제 Tool 호출 Evidence가 없는 Agent는
검증 완료 Package로 Publish할 수 없다. 선택 Dependency 미확인은 명시적
Warning으로 표시할 수 있지만, 필수 Dependency 미확인은 Publish 또는
설치를 차단한다.

### 15.12 MCP-first target experience

사용자는 MCP라는 기술 용어를 기본 화면에서 몰라도 된다.

기본 화면:

```text
Gmail 연결이 필요합니다.

AI가 새 메일을 읽을 수 있도록
읽기 권한만 요청합니다.
```

```text
Slack 메시지 전송 승인이 필요합니다.

AI가 지정된 채널에만 메시지를 보냅니다.
```

```text
이 작업은 외부 데이터를 수정합니다.

변경 대상과 되돌릴 수 있는지 확인한 뒤 승인해 주세요.
```

기술 상세 보기:

- MCP Server
- Tool
- Version
- Input Schema
- Output Schema
- Credential Reference 상태
- Permission
- Risk
- Approval Scope
- Invocation Evidence

기본 UX에서는 Tool 이름보다 업무 결과와 권한 영향을 먼저 설명한다.
MCP는 중요한 Engineering Architecture이지만 사용자에게 학습을 요구하는
제품 용어가 되어서는 안 된다.

### 15.13 Minimum document-level contracts

이번 단계에서는 코드를 구현하지 않지만 향후 TypeScript Contract로 옮길 수
있는 최소 필드를 정의한다.

#### AgentCapability

| Field | Meaning |
|---|---|
| `id` | Stable Capability ID |
| `version` | Capability contract version |
| `category` | Read, write, transform, communicate, automate 등 |
| `inputTypes` | 허용 입력 형식 |
| `outputTypes` | 보장 출력 형식 |
| `requiredPermissions` | 필요한 최소 권한 |
| `riskClass` | Capability 기본 위험 등급 |

#### McpServerDefinition

| Field | Meaning |
|---|---|
| `id` | Stable MCP Server ID |
| `version` | Server contract version |
| `transport` | 지원 Transport |
| `publisher` | Server 제공자 |
| `healthPolicy` | Health와 가용성 기준 |
| `trustStatus` | Unreviewed, verified, restricted, blocked 등 |

#### McpToolDefinition

| Field | Meaning |
|---|---|
| `serverId` | 소속 MCP Server |
| `toolName` | Server 내 Tool 이름 |
| `capabilities` | 제공 Capability 목록 |
| `inputSchema` | 서버 재검증 입력 계약 |
| `outputSchema` | 결과 검증 계약 |
| `credentialDefinition` | Secret 없는 Credential 요구사항 |
| `permissions` | 최소 Permission과 Scope |
| `riskClass` | Read, write, destructive, cost 등 |
| `approvalRequirement` | 사용자 승인 조건 |
| `timeout` | 실행 제한 시간 |
| `retryPolicy` | 제한된 재시도 규칙 |
| `idempotencyPolicy` | 중복 실행 안전성 |
| `verificationRules` | Health와 기능 Evidence 조건 |

#### AgentBlueprint

| Field | Meaning |
|---|---|
| `requiredCapabilities` | 반드시 해결해야 하는 Capability |
| `optionalCapabilities` | 없어도 Agent가 동작 가능한 Capability |
| `preferredToolSelectors` | Tool 선택 선호 조건 |
| `forbiddenTools` | 사용 금지 Server 또는 Tool |
| `deliveryMode` | HEADLESS, CHAT, BUSINESS |
| `interfaceMode` | API, WEBHOOK, SCHEDULE, WEB_CHAT, MCP_SERVER |
| `approvalPlan` | 비용·권한·외부 변경 승인 계획 |
| `verificationPlan` | Agent와 Tool 검증 계획 |

#### AgentDefinition

| Field | Meaning |
|---|---|
| `resolvedBlocks` | 선택 완료된 Agent Block |
| `resolvedMcpTools` | Registry에서 해결된 MCP Tool |
| `unresolvedDependencies` | 사용자 작업 또는 미지원 Dependency |
| `credentialRequirements` | Secret 없는 Credential Definition |
| `permissions` | Agent 전체 Permission 집합 |
| `runtimeDefinition` | 실행 Runtime 계약 |
| `validationStatus` | Contract Validation 결과 |

### 15.14 Implementation status

| Architecture element | Status | Current evidence |
|---|---|---|
| Requirement Engine | `IMPLEMENTED` | Requirement Snapshot과 Clarification |
| Existing Application Capability | `PARTIAL` | AI Inquiry와 General CRUD 중심 |
| Agent Capability Contract | `PLANNED` | AGENT-FOUNDATION-001 |
| Block Contract | `PLANNED` | AGENT-FOUNDATION-001 |
| Agent Blueprint Contract | `PLANNED` | AGENT-FOUNDATION-001 |
| Provider Provisioning | `IMPLEMENTED` | GitHub, Supabase, Vercel Live Evidence |
| MCP Reference Contract | `PLANNED` | AGENT-FOUNDATION-001 |
| MCP Registry | `PLANNED` | MCP-FOUNDATION-001 |
| Tool Resolver | `PLANNED` | MCP-FOUNDATION-001 / AGENT-GENERATOR-001 |
| MCP Gateway Runtime | `PLANNED` | 별도 구현 승인 필요 |
| Agent Generator | `PLANNED` | AGENT-GENERATOR-001 |
| Agent Validator | `PARTIAL` | Provider·기능 Verification은 구현, 일반 Agent Contract는 계획 |
| Runtime Compiler | `PLANNED` | Agent Generator 이후 |
| Agent MCP Publisher | `FUTURE` | Runtime·인증 정책 Open Question |
| Agent Marketplace | `FUTURE` | 검증된 Package 기반 후속 단계 |

### 15.15 Open questions

다음 항목은 MCP-STRATEGY-001에서 임의로 확정하지 않는다.

1. MCP Registry를 BuildFlow 내부 DB로 운영할지
2. 외부 Registry와 연동할지
3. Remote MCP Transport의 우선순위
4. OAuth와 API Key의 Credential UX
5. MCP Server Publisher Trust 등급
6. Tool Version Pinning 정책
7. Tool Fallback 자동 전환 정책
8. Generated Agent를 MCP Server로 제공할 Runtime
9. 유료 MCP Tool의 비용 정산 책임
10. 사용자 데이터의 Region과 보존 정책

이 결정들은 MCP-FOUNDATION-001 또는 후속 Product Review에서 Security,
운영 복잡도, 사용자 피로도, Marketplace 책임을 함께 평가한 뒤 확정한다.

---

## 16. Recommended Immediate Action

현재 가장 안전한 다음 행동은 Agent 코드를 추가하는 것이 아니다.

### Step 1

CAPABILITY-002의 PM/CTO Review를 완료한다.

### Step 2

현재 Worktree 변경을 다음 범주로 분리한다.

- Autonomous, Provisioning, Credential, Verification 기반
- LIVE-EVIDENCE 관련 수정
- CAPABILITY-002
- Product Direction 문서
- Review 문서

### Step 3

각 범주의 Commit 순서와 포함 파일을 승인한다.

### Step 4

Commit 전 다음 Quality Gate를 다시 실행한다.

- Tests
- Lint
- Typecheck
- Build
- `git diff --check`
- Supabase DB lint
- Migration alignment
- Database Types
- Secret scan
- `.env.local` tracking check

### Step 5

`AGENT-FOUNDATION-001`을 `APPROVED / SCOPE FROZEN`으로 전환하고 별도
변경 묶음으로 개발한다.

---

## 17. Final Assessment

### Product

BuildFlow는 설계·계획 중심 MVP를 넘어 실제 외부 Provider에 Agent Runtime을
구축하고 검증하는 단계까지 도달했다.

### Engineering

Requirement, Architecture, Orchestration, Credential, Provider, Deployment,
Verification, Package 기반은 상당 부분 준비되어 있다. 현재 병목은
Provisioning 자체가 아니라 Agent와 MCP의 일반화된 계약이다.

### Security

Secret 격리, Vault, RLS, Ownership, Approval, Verification Evidence 경계는
제품의 강점이다. MCP 확장에서도 이 경계를 그대로 유지해야 한다.

### Product strategy

범용 Web App과 Platform 생성 범위를 축소하고 AI Agent에 집중한 결정은
개발 복잡도와 출시 리스크를 줄인다. Marketplace도 일반 Template가 아니라
검증된 AI Agent Package를 중심으로 설계해야 한다.

### Release readiness

대표 Live Build는 성공했지만 공개 Beta를 선언하기에는 다음 Evidence가
추가로 필요하다.

- 반복 가능한 Agent 구축 성공률
- Multi-account와 Device E2E
- Background Worker Resilience
- Backup과 Monitoring
- MCP Tool Security
- 두 번째 Agent 유형 Live Evidence
- Package Export·Import·Install Evidence

### Overall conclusion

BuildFlow의 다음 경쟁력은 더 많은 하드코딩 Template가 아니다.

> 검증 가능한 Agent Capability, Block, MCP Server, Blueprint, Evidence,
> Package가 축적되고 재사용되는 구조가 BuildFlow의 핵심 자산이다.

현재 프로젝트는 AI Agent Factory로 전환할 수 있는 충분한 기반을 갖췄다.
다음 개발은 현재 Worktree와 CAPABILITY-002를 안전하게 종료한 뒤,
Agent Contract와 MCP Contract부터 순서대로 진행하는 것이 가장 적절하다.

---

## 18. Source Documents

이 보고서는 다음 Source of Truth와 Evidence를 통합했다.

- `.buildflow/CURRENT_TASK.md`
- `.buildflow/STATUS.md`
- `.buildflow/NEXT_TASK.md`
- `docs/project/PROJECT_BIBLE.md`
- `docs/project/MASTER_PRD.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/ROADMAP.md`
- `docs/project/TECH_DEBT.md`
- `docs/project/PRODUCT_REVIEW.md`
- `docs/specs/BPS-1.0.md`
- `docs/sprints/STABILIZE-READY-001/REPORT.md`
- `docs/sprints/LIVE-EVIDENCE-002/REPORT.md`
- `docs/sprints/CAPABILITY-002/REPORT.md`
- `docs/reviews/DAILY-REPORT-2026-07-16.md`

상태가 충돌할 경우 `.buildflow/CURRENT_TASK.md`, 해당 Sprint Report,
`.buildflow/STATUS.md` 순서로 현재 운영 상태를 판단한다.
