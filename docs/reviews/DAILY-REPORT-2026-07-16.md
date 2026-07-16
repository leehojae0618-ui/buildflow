# DAILY REPORT — 2026-07-16

## BuildFlow Development Review

**Author:** PM / CTO Review  
**Status:** Strategic Direction Updated  
**Current-state audit:** 2026-07-17

## Executive Summary

BuildFlow는 단순 기능 추가보다 제품 방향을 다시 정의하는 전환점을
맞았다. 가장 중요한 성과는 실제 Provider 환경에서 AI 문의 Agent를
자동 구축한 LIVE-EVIDENCE TEST A다.

BuildFlow의 활성 제품 범위는 범용 Web App 또는 Platform 생성이 아니라
AI Agent의 설계, 구축, 배포, 검증, Package 공유에 집중한다.

기존 General CRUD Web App 구축 결과는 삭제하지 않는다. CAPABILITY-002에서
Task Manager의 실제 구축과 Auth, CRUD, RLS, 배포, Verification이 PASS했기
때문이다. 다만 이 결과는 자동 구축 엔진의 Capability Evidence로 보존하며
추가 범용 Web App 확장의 근거로 사용하지 않는다.

## Today's Major Achievement

### LIVE-EVIDENCE TEST A

대표 AI 문의 Agent의 실제 자동 구축이 성공했다.

- GitHub Private Repository 생성
- Source Upload
- Supabase Schema 생성
- RLS 적용
- Vercel Deployment
- 실제 URL 생성
- Health Check
- OpenAI 실제 호출
- DB 저장
- Verification PASS

이 Evidence로 BuildFlow는 `ai-inquiry-v1` Agent와 필요한 Delivery Surface를
실제 GitHub, Supabase, Vercel, OpenAI 환경에 구축할 수 있음을 증명했다.

## Current Capability

### 핵심 제품 경로

```text
AI Agent Goal
→ Requirement
→ Architecture
→ Credential / Consent / Approval
→ Repository
→ Runtime and Database
→ Deployment
→ Functional Verification
→ READY_WITH_WARNINGS
```

### 검증된 Blueprint

- `ai-inquiry-v1`: 핵심 AI Agent 제품 경로
- `general-crud-v1`: 보존된 자동 구축 엔진 회귀 Evidence

### 아직 지원하지 않는 범위

- 임의 목표를 처리하는 범용 AI Agent 생성
- Block 조합 기반 Agent 생성
- Agent별 Headless, Chat, Business Delivery Mode 자동 선택
- MCP Server를 통해 외부 Tool을 발견·승인·실행하는 Agent Runtime
- 검증된 Agent의 Marketplace Listing과 배포
- 자동 Block·Blueprint 생성 및 Learning Engine

현재 가장 큰 제약은 Provider Execution Engine이 아니라 범용화된 Agent
Capability, Block Contract, MCP Tool Contract, Blueprint Contract,
Generator Contract의 부재다.

## Strategic Decision

### Before

```text
BuildFlow
→ AI Agent
→ Web App
→ Platform
→ 모든 유형 자동 구축
```

이 범위는 MVP의 검증 가능성과 출시 집중도를 떨어뜨린다.

### After

```text
BuildFlow
→ AI Agent Automatic Builder
→ Verification
→ AI Agent Package
→ Marketplace Sharing
```

Web UI, API, Database, Auth, Hosting은 독립적인 제품 생성 목표가 아니라
AI Agent를 사용하고 관리하고 운영하는 데 필요한 Delivery Surface로
취급한다.

## New Product Vision

BuildFlow는 웹사이트 생성기가 아니라 검증 가능한 AI Agent Factory다.

BuildFlow는 사용자의 목표를 Agent 계약으로 구조화하고, 필요한 Block과
Provider를 선택하고, 승인된 범위에서 구축·배포한 뒤 기능 Evidence를
저장한다.

## Agent Delivery Modes

AI Agent에 항상 UI가 필요한 것은 아니다.

### Headless Agent

- Scheduler
- Email automation
- Slack automation
- Event-driven processing

### Chat Agent

- AI 문의
- AI 상담
- 지식 검색

### Business Agent

- 승인
- 실행 기록
- 설정
- 제한된 운영 Dashboard

Agent Blueprint는 Delivery Mode를 명시해야 하며 Generator는 Requirement와
Capability에 따라 필요한 Surface만 생성해야 한다.

## Target Architecture

```text
Agent Capability Model
→ Block Library
→ MCP Server Registry and Gateway
→ Agent Blueprint Library
→ Agent Generator
→ Validator
→ BPS Package Builder
→ Publisher
```

`Learning Engine`, 자동 Block 생성, 자동 Blueprint 생성은 실제 사용과
검증 Evidence가 충분히 축적된 이후의 Future 범위다.

## MCP Architecture

MCP는 Agent가 외부 시스템의 Tool과 Resource를 사용하는 표준 Runtime
경계다. BuildFlow는 MCP Tool을 단순 호출하는 Client가 아니라 소유권,
Credential, Approval, Risk, Retry, Evidence를 통제하는 MCP Orchestrator
역할을 해야 한다.

### 역할 분리

```text
Connector Registry
→ 외부 서비스와 Capability 설명

Provider Adapter
→ GitHub, Supabase, Vercel 리소스 구축·배포

MCP Server
→ 구축된 Agent가 업무 중 사용할 Tool과 Resource 제공

BuildFlow MCP Gateway
→ Server 연결, Tool 발견, 승인, 실행, 결과 정제, Evidence 저장

Generated Agent MCP Server
→ 검증된 Agent 기능을 다른 AI Client가 사용할 Tool로 제공
```

Provider Adapter는 Provisioning Plane이고 MCP는 Agent Runtime Tool
Plane이다. 두 계층은 서로 대체하지 않는다.

BuildFlow의 MCP 역할은 양방향이다.

1. **MCP Consumer** — Agent가 승인된 외부 MCP Server의 Tool을 사용한다.
2. **MCP Publisher** — 검증된 Agent를 선택적으로 MCP Server로 배포한다.

Agent를 MCP Server로 공개하는 작업은 별도 공개·권한 Approval과
Verification을 통과해야 한다.

### MCP Server Contract

각 MCP Server 정의에는 최소한 다음 정보가 필요하다.

- stable server ID와 version
- Tool과 Resource Capability
- Tool input/output schema
- Credential Reference와 인증 방식
- Permission과 Scope
- read, write, destructive, cost Risk Class
- 사용자 Approval 필요 여부
- timeout, retry, idempotency 정책
- safe Evidence와 결과 sanitization 규칙
- Runtime compatibility
- health와 availability 상태

Secret 원문은 Agent Prompt, Blueprint, Package, Event, Error, Evidence에
포함하지 않는다. MCP 실행 시 서버 측 Credential Resolver만 Secret을
사용한다.

### MCP Security Boundary

- Blueprint에 승인된 MCP Server와 Tool allowlist만 실행한다.
- Tool schema와 입력을 서버에서 재검증한다.
- 비용, 외부 쓰기, 삭제, 공개, 권한 변경은 Approval Gate를 적용한다.
- MCP 응답 본문 전체를 저장하지 않고 safe result만 보존한다.
- 모든 실행에서 사용자와 Project 소유권을 확인한다.
- Prompt injection으로 승인 범위를 확대할 수 없게 한다.

### MCP Package Rule

AI Agent Package에는 MCP Secret이나 live session을 넣지 않는다.

- required 또는 optional MCP Server ID
- compatible version range
- required Tool Capability
- Permission과 Approval 요구사항
- Credential Definition
- Verification Rule
- 설치 후 사용자가 연결할 항목
- Package가 제공하는 MCP Tool, Resource, Prompt interface

## Marketplace Vision

생성된 Agent는 즉시 Marketplace에 등록하지 않는다.

```text
Generate
→ Validate
→ Functional Evidence
→ Security Review
→ Versioned Package
→ Marketplace
```

Marketplace 공유 단위는 Secret과 개인정보를 포함하지 않는 BPS-compatible
`AI Agent Package`다.

## Development Philosophy

GPT와 Codex는 BuildFlow 자체를 개발한다. BuildFlow는 사용자를 대신해
AI Agent를 설계·구축·검증·배포한다.

핵심 경쟁력은 코드 생성량이 아니라 다음 자산의 축적이다.

- 검증된 Agent Capability
- 안전한 Block Contract
- 재현 가능한 Blueprint
- 실제 Provider Evidence
- Versioned AI Agent Package

## Current Risks

### P0 — Release and work integrity

- CAPABILITY-002가 구현과 Live Evidence를 완료했지만 아직 REVIEW 상태다.
- 현재 Worktree에는 여러 승인 대기 작업이 함께 보존되어 있다.
- 새 Agent 구현을 섞기 전에 CAPABILITY-002 Review와 Commit 범위를
  확정해야 한다.

### P1 — Agent domain foundation

- Application Capability는 있지만 Agent Capability Source of Truth가 없다.
- Prompt, Model, Trigger, Tool, Memory, Knowledge, Guardrail, Output,
  Delivery Surface를 표현하는 Block Contract가 없다.
- Tool Block이 MCP Server, Tool Schema, Permission, Approval Scope를
  참조하는 계약이 없다.
- Blueprint가 생성 파일 Template 선택에 결합되어 있다.
- Agent Generator의 입력·출력·검증 계약이 없다.

### P2 — MCP runtime foundation

- MCP Server Registry가 없다.
- MCP Tool discovery Snapshot과 compatibility 검증이 없다.
- MCP Credential, Permission, Approval, Result Sanitization 경계가 없다.
- MCP 실행 결과를 Verification Evidence로 연결하는 계약이 없다.

### P3 — Completion and validation

- Agent별 기능 성공 조건을 일반화한 Validator가 없다.
- Headless Agent와 event-driven Agent의 Health 및 functional Evidence
  규칙이 없다.
- Package Builder가 Agent 전용 Manifest Profile을 생성하지 않는다.

### P4 — Distribution

- Package Listing, Publisher, Version promotion, deprecation, trust policy가
  구현되지 않았다.
- Marketplace는 검증된 Agent Package가 준비된 뒤 진행해야 한다.

### Future

- Block Generator
- Blueprint Generator
- Learning Engine
- 범용 Web App과 Platform Builder

## Prioritized Development Order

1. CAPABILITY-002 Review와 변경 범위 확정
2. AGENT-FOUNDATION-001 — Agent Capability and Contract Foundation
3. MCP-FOUNDATION-001 — MCP Server Registry and Secure Gateway Contract
4. AGENT-GENERATOR-001 — Deterministic Agent Generator
5. AGENT-VALIDATION-001 — Agent Functional and Security Validator
6. AGENT-PACKAGE-001 — BPS AI Agent Package and MCP Dependency Profile
7. AGENT-EVIDENCE-001 — MCP Tool을 사용하는 두 번째 Agent Live Evidence
8. MARKETPLACE-AGENT-001 — 검증된 Agent Package Listing
9. Self Evolution — Pilot Evidence 이후 별도 승인

## Recommended Next Sprint

```text
TASK ID

AGENT-FOUNDATION-001

TITLE

AI Agent Capability and Contract Foundation
```

권장 범위:

- Agent Capability Model
- Agent Delivery Mode
- Agent Interface Mode: API, Webhook, Schedule, Web Chat, MCP Server
- Block Contract
- MCP Server와 Tool을 참조하는 Tool Block Contract
- Agent Blueprint Contract
- Agent Definition
- 결정론적 Blueprint 선택 계약
- Contract Validator
- 기존 `ai-inquiry-v1`의 Agent Blueprint 변환
- BPS 확장을 위한 Version 필드

제외:

- Marketplace UI
- 신규 Provider
- Learning Engine
- 자연어 범용 Agent 생성 주장
- 기존 Provider Execution 재구현
- 실제 외부 MCP Server 연결 또는 실행
- Migration

## Final Conclusion

BuildFlow는 실제 AI 문의 Agent 자동 구축에 성공했고, General CRUD 구축을
통해 Execution Engine의 두 번째 경로도 검증했다. 다음 경쟁력은 더 많은
Web App Template가 아니라, 검증 가능한 Agent Capability와 Block,
Blueprint, Evidence를 축적할 수 있는 구조다.

활성 제품 정의는 다음과 같다.

> BuildFlow는 사용자의 목표를 실제 동작하는 AI Agent로 구축·검증·배포하고,
> 완성된 Agent를 안전한 Package로 공유하게 하는 AI Agent Factory다.
