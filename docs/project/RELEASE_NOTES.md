# BuildFlow Release Notes

This file records user-visible product changes. Internal refactoring, documentation updates, tests, operational process changes, and Technical Debt entries are intentionally excluded.

## Unreleased

- Connector Summary: Project Detail now shows required external providers and their connection status without executing OAuth or API calls.
- Account Wizard Foundation: 필요한 계정별 동의 단계와 연결 상태를 Installation 흐름에서 확인할 수 있습니다. 실제 OAuth 인증은 실행하지 않습니다.
- Architecture Options: 사용자가 무료 중심, 균형형, 성능 중심 후보를 비용·자동화율·작업량·시간 기준으로 비교할 수 있습니다.
- Architecture Selection: 선택한 후보를 프로젝트에 저장하고, 이후 구축 계획과 연결 정보가 같은 Architecture를 기준으로 유지됩니다.
- Build Execution Foundation: 확정된 Architecture와 Build Plan으로 실행 준비 상태와 안전한 Artifact 생성을 시작할 수 있습니다. 인증·비용 발생 작업은 사용자 승인 대기 상태로 유지됩니다.
- Verification Foundation: 구조 검증과 Provider 연결 검증을 분리하고, Credential이 없으면 검증 대기 상태로 명확히 표시합니다.
- Persistent Verification: Provider 검증 상태와 마지막 결과를 저장해 Project 재진입 후에도 동일한 상태를 복원합니다.
- Package Builder: Project의 Requirement·Architecture·Connector·Build Plan·Verification Snapshot을 BPS v1.0 `.bfpkg`로 미리 보고 Export할 수 있습니다.
- Package Installer: BPS `.bfpkg`를 검증하고 Credential 값 없이 새 Project로 복원하여 READY 상태까지 준비할 수 있습니다. Execution은 시작하지 않습니다.
- Autonomous Build Session Foundation: 기존 Preference·Execution·Approval·Verification을 하나의 서버 기준 Session 상태로 연결하고, Credential·Consent·Approval 단계에서 자동 재개할 수 있는 진행 상태를 제공합니다.
- Secure Provider Provisioning Foundation: GitHub·Supabase·Vercel 작업을 승인 가능한 Provider Command와 Credential-missing USER_ACTION 경계로 준비합니다. 실제 외부 리소스 생성 QA는 별도 Credential 환경이 필요합니다.

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
- Architecture, Build Plan, Installation 구조를 자동 검증하고 PASS/WARNING/FAILED Test Summary 표시
- Provider, Database, Authentication, Automation, Notification Health Check 상태 요약

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
