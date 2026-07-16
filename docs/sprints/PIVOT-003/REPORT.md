# PIVOT-003 Report

## Technical Deliverable

- `src/features/requirements/types.ts`에 AutomationLevel, Capability, CapabilitySummary 추가
- `constraints.ts`에 Capability Calculator 추가
- Consent가 있는 외부 연결을 USER_ACTION으로 분류
- Requirement Snapshot에 capabilities와 capabilitySummary 저장
- Requirement Summary에 자동 구축률, 사용자 작업, 전문가 필요, 지원 범위 외 표시
- 기존 Recommendation과 DB schema는 변경하지 않음

## Product Deliverable

- BuildFlow가 단순 추천이 아니라 구축 가능 범위를 설명하기 시작함
- 사용자는 자동 구축과 직접 해야 할 작업을 구분해서 확인할 수 있음
- 향후 Build Planner, Installation Wizard, Marketplace가 Capability를 재사용할 수 있음

## Verification

- Migration: 없음
- Tests: 88 passing (9 files)
- lint: passed
- typecheck: passed
- build: passed (Turbopack sandbox retry required)
- Git diff: `git diff --check` passed
- Authenticated browser QA: 로그인 세션 부재 시 보류

## Git

- Commit: `055446b` (`feat: add constraint classification foundation`).
- Push: not performed.

## Next Sprint

PIVOT-004 — Clarification Experience Foundation
