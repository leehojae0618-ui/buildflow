# BuildFlow Project Bible

## Product Definition

BuildFlow는 사용자가 원하는 결과를 설명하면 요구사항을 정리하고, AI 시스템을 설계하고, 가능한 범위까지 구축·설치·테스트하여 실제 사용할 수 있도록 돕는 AI System Builder Platform이다.

기존 Recommendation, Workflow, Template 기능은 이 Builder 경험을 구성하는 현재 MVP 기반 도메인으로 유지한다.

## Service Definition

1. 요구사항 이해
2. 부족한 정보 확인
3. 제약과 책임 분류
4. 사용자 동의
5. AI 시스템 설계
6. Build Plan 작성
7. 자동·보조 구축
8. 사용자 작업 안내
9. 설치와 테스트
10. 사용 가능한 상태로 전달

## Core Philosophy

- 기술은 최대한 숨기고 사용자는 원하는 결과를 중심으로 판단한다.
- 자동화 가능 여부를 먼저 판단하고, 불가능한 부분은 사용자 작업·전문가 작업·물리 작업·법적 제한으로 명확히 분류한다.
- 제한을 이유로 목표를 즉시 거절하지 않고 가능한 범위와 책임을 설명한다.
- 실행 결과와 설정은 재현 가능한 Snapshot과 Version으로 보존한다.
- 사용자의 동의 없이 외부 계정 연결, 데이터 전송, 설치, 실행을 진행하지 않는다.
- 질문의 품질이 설계의 품질을 결정한다.
- BuildFlow는 바로 답하기보다 먼저 목표를 이해하고 필요한 질문을 통해 Requirement를 완성한다.

## Product Scope

### MVP Foundation

- Project, 인증, 기준 Tool과 Blueprint 데이터
- Requirement와 Recommendation 기반의 초기 Build Session 진입
- Blueprint Preview와 Guided Execution
- 진행 상태 저장, Prompt Asset, Tool 탐색
- Goal Parser, Requirement Snapshot, Clarification 질문, Constraint 분류, Consent 요구사항

### Builder Expansion

- Requirement Engine
- Clarification Engine
- Constraint Engine
- Consent Engine
- Architecture Engine
- Build Planner
- Build Engine
- Installation Wizard
- Test Engine

### Marketplace Expansion

- AI System Package 공유
- Version Snapshot
- 복제와 설치
- Creator 및 Listing 모델

## BuildFlow Responsibility

BuildFlow는 요구사항을 구조화하고, 설계·구축 계획·자동화 가능한 작업을 제안하며, 사용자가 수행해야 할 작업과 검증 조건을 안내한다. 지원되는 범위에서는 구축·설치·테스트 과정을 자동화하거나 보조한다.

## Automation Boundary

자동 구축은 권한·보안·외부 Provider 정책·데이터 민감도·실행 가능성이 확인된 범위로 제한한다. 외부 OAuth 승인, Credential 입력, 결제, 법적 동의, 민감 데이터 제출은 기본적으로 사용자의 명시적 작업으로 남긴다.

## User Work Boundary

사용자는 목표와 부족한 정보를 제공하고, 제약·권한·외부 계정·비용·설치·최종 결과를 확인하며 필요한 동의를 수행한다. BuildFlow는 사용자가 해야 할 작업을 단계·준비물·완료 조건으로 안내한다.

## Limitations

- BuildFlow는 모든 외부 Tool의 실행을 보장하지 않는다.
- Provider 정책, OAuth, Credential, 비용, 데이터 품질에 따라 자동 구축 범위가 달라진다.
- 법률·보안·운영 책임을 BuildFlow가 자동으로 대체하지 않는다.
- 실제 외부 연결과 실행은 별도 승인과 검증이 필요하다.

## Marketplace Direction

Marketplace의 공유 단위는 `AI System Package`다. Package는 다음을 포함한다.

- Requirement
- Blueprint
- Prompt
- Build Plan
- Environment
- Installer
- Version
- Artifacts

Package는 Secret과 사용자 개인정보를 포함하지 않는 안전한 Version Snapshot이어야 하며, 다른 사용자는 지원되는 범위에서 이를 검토·재구축·설치할 수 있다.

## Domain Language

| Legacy/Product UI | Builder Domain | Meaning |
|---|---|---|
| Recommendation | Build Session | 요구사항에서 설계·구축 흐름으로 진입하는 실행 단위 |
| Workflow | Build Plan | AI 시스템을 만들기 위한 단계와 실행 계획 |
| Template | Blueprint | 검증된 시스템 구조의 기준 정의 |
| Tool Explorer | Component Catalog | 시스템을 구성하는 Tool·Provider 기준 데이터 |
| Workflow Library | Blueprint Library | 재사용 가능한 Blueprint 탐색 공간 |
| Dashboard | Build Center | Project, Build Session, Build Plan 진행을 모아보는 작업 공간 |
