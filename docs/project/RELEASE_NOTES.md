# BuildFlow Release Notes

This file records user-visible product changes. Internal refactoring, documentation updates, tests, operational process changes, and Technical Debt entries are intentionally excluded.

## Unreleased

No unreleased user-visible changes.

## v0.3.0 — Builder Foundation

- Requirement 입력을 Goal Type, Category, Expected Output과 구조화된 Requirement Snapshot으로 해석
- 필요한 Clarification 질문과 다음 질문을 우선순위에 따라 표시
- 자동 구축, 부분 자동, 동의 필요, 수동 작업, 전문가 필요, 지원 범위 외를 구분
- Project Detail에서 Build Readiness, Capability, Build Receipt 확인
- Requirement에 맞는 Architecture Component, Connection, Dependency 요약 표시
- 외부 계정 동의와 사용자가 수행할 작업을 구분해 표시
- Architecture의 Component와 연결 구조를 기준으로 Build Score, 예상 시간, 운영비, 위험도, Confidence를 계산
- Build Receipt에 Architecture 기반 예상치를 표시
- Architecture를 Preparation, Accounts, Environment, Database, Authentication, Automation, Deployment, Verification 단계의 Build Plan으로 변환
- 각 Build Task를 자동 수행, 사용자 작업, 전문가 필요로 구분
- Build Plan 전체 진행률과 Phase별 Task 요약 표시
- Build Plan을 Installation Wizard의 현재 단계와 다음 단계 흐름으로 실행
- 자동 준비, 사용자 작업, 전문가 작업을 설치 단계에서 구분
- 설치 단계 완료 체크와 Installation Progress 표시

Release stage: Builder Foundation. RC is not started.

## v0.2.0 — Discovery and Guided Execution

- Tool Explorer와 Tool 상세 탐색
- Workflow Library와 Template 상세 탐색
- Project에서 추천 Workflow 확인
- Workflow Step-by-Step 실행 가이드
- 진행 상태 저장 및 재개
- Prompt Asset 복사와 공식 Tool 링크 제공

## v0.1.0 — Foundation MVP

- Email 및 Google OAuth 인증
- Project 생성·수정·보관
- Recommendation 결과 확인
- Dashboard와 Project 기반 작업 흐름
