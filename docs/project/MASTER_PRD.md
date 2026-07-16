# BuildFlow Master PRD

## Status

Draft v2 — Product Pivot aligned in PIVOT-001. Current implementation remains MVP Foundation; Builder Engines are not implemented yet.

## Product Positioning

BuildFlow는 AI Recommendation Platform이 아니라 사용자의 목표를 실제 AI System으로 전환하는 AI System Builder Platform이다.

## Primary User Flow

목표 입력
→ Requirement Analysis
→ 부족한 정보 질문
→ Constraint Classification
→ 사용자 동의
→ Architecture 설계
→ Build Plan
→ 자동 및 보조 Build
→ 사용자 작업
→ Installation
→ Test
→ 사용 가능 상태

## Current Implementation

- Authentication
- Project CRUD
- Tool reference data (Builder Domain: Component Catalog)
- Workflow template data (Builder Domain: Blueprint)
- Recommendation engine (Builder Domain: initial Build Session entry)
- OpenAI explanation fallback
- Guided workflow (Builder Domain: Build Plan execution basis)
- Workflow progress persistence
- Dashboard (Builder Domain: Build Center direction)
- Tool Explorer
- Workflow Library
- Step details
- Prompt assets
- Requirement Foundation: Goal Parser, Requirement Snapshot, Clarification Questions, Constraint Assessment, Consent Requirements
- Build Intelligence Foundation: Build Score, Cost, Time, Risk, Confidence, and Build Receipt
- Architecture Foundation: Component Registry, Selection Engine, Graph, Dependency Model, and Architecture Snapshot

These are implemented foundations, not claims that the future Builder Engines are complete. Authenticated browser QA remains pending where previously recorded.

## Requirement Foundation

The first Builder layer converts a natural-language goal into a versioned Requirement Snapshot. The snapshot contains Business Goal, Goal Type, Category, Expected Output, Primary User, Automation Level, Budget, Deadline, Current Tools, Restrictions, and Required Integrations. Missing information becomes prioritized Clarification Questions with skip logic; the snapshot exposes completeness, build readiness, conversation state, missing requirements, and the next question. Known operating limits become Constraint Assessments; external access needs become Consent Requirements. Capability Calculator classifies buildable components as AUTO, PARTIAL, CONSENT_REQUIRED, MANUAL, EXPERT, or UNSUPPORTED and calculates five capability measures.

Requirement is the source layer for future Build Sessions. Existing Recommendation remains compatible and is not removed or replaced in this Sprint.

## Domain Engines

1. Requirement Engine — 자연어 목표와 입력을 구조화한다.
2. Clarification Engine — 부족한 정보와 불확실성을 질문한다.
3. Constraint Engine — 기술·권한·비용·보안·법적 제한을 분류한다.
4. Consent Engine — 외부 연결·데이터·비용·설치에 대한 동의를 관리한다.
5. Architecture Engine — 목표에 맞는 AI System 구조를 설계한다.
6. Build Planner — 설계를 실행 가능한 Build Plan으로 분해한다.
7. Build Engine — 승인된 자동 구축 작업을 수행하거나 보조한다.
8. Installation Wizard — Credential·환경·배포 준비를 안내한다.
9. Test Engine — 연결·입력·출력·회귀 조건을 검증한다.
10. Marketplace Engine — AI System Package의 Version·공유·복제·Listing을 관리한다.

## Domain Mapping

| Current Implementation Term | Target Builder Term |
|---|---|
| Recommendation | Build Session |
| Workflow | Build Plan |
| Template | Blueprint |
| Tool Explorer | Component Catalog |
| Workflow Library | Blueprint Library |
| Dashboard | Build Center |

This is a domain-language decision only. No database table, API, Server Action, route, or UI rename is performed in PIVOT-001.

## Marketplace Package

The Marketplace sharing unit is an `AI System Package` containing Requirement, Blueprint, Prompt, Build Plan, Environment, Installer, Version, and Artifacts. Secrets and personal data must never be packaged.

## Required Expansion

- Requirement Engine
- Clarification Engine
- Constraint Engine
- Consent Engine
- Architecture Engine
- Build Planner
- Build Engine
- Installation Wizard
- Test Engine
- Marketplace Engine and Package model
