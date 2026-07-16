# Current Task

## Task ID

CAPABILITY-002

## Title

General CRUD Web App Blueprint

## Status

REVIEW

## Goal

Task Manager를 예외적으로 하드코딩하지 않고 Auth, 사용자별 CRUD, 검색,
상태 관리, 관리자 조회, 반응형 UI를 제공하는 일반 CRUD Web App
Blueprint를 추가한다.

## Scope

- Application Capability Model
- AI 문의 Blueprint와 General CRUD Blueprint 분리
- Capability 기반 Artifact, Schema, RLS, Verification 생성
- 잘못된 Blueprint 매칭 차단
- 기존 GitHub, Supabase, Vercel Adapter 재사용
- 실제 Auth, CRUD, 검색, 상태 변경, 관리자 읽기, Cross-user 차단 검증
- TEST B Live Evidence와 LIVE-EVIDENCE-002 재판정

## Excluded

- UI/UX 전면 개편
- Marketplace
- 신규 Provider
- 백업 또는 모니터링 구현
- 자연어 범용 앱 생성으로 과장
- Mock 또는 Placeholder 성공
- 자동 Commit
- Push

## Current Stage

- Application Capability Model: PASS
- General CRUD Blueprint implementation: PASS
- Actual TEST B GitHub/Supabase/Vercel build: PASS
- Auth, CRUD, search, status, administrator, Cross-user Verification: PASS
- Idempotent re-run: PASS
- PM/CTO Review required

## Product Direction Note

CAPABILITY-002 결과는 실제 자동 구축 범위를 검증한 Evidence로 보존한다.
그러나 2026-07-17 Product Owner 지시에 따라 신규 제품 개발은 AI Agent
자동 구축에 집중한다. General CRUD Web App과 범용 Platform 확장은 현재
제품 Roadmap에서 중단하며, 후속 작업의 기본 산출물은 배포·검증 가능한
AI Agent와 BPS 기반 AI Agent Package다.

## Preserved Work

`LIVE-EVIDENCE-001/002`, `STABILIZE-READY-001`, `PROJECT-REVIEW-001`,
`PRODUCT-REVIEW-003.5`, `HARDEN-003`의 미커밋 작업을 삭제하거나
덮어쓰지 않는다.
