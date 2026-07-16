# PIVOT-008 Report

## Technical Deliverable

- `src/features/installation/`에 InstallationSession, InstallationStep, Progress 모델 추가
- BuildPlan Task를 Installation Step으로 변환
- 이전/다음 Step Navigator와 완료 체크 구현
- AUTO, USER_ACTION, EXPERT_REQUIRED action 표시
- Project Detail에 Installation Wizard와 Summary UI 연결
- DB/Migration 및 실제 외부 실행은 추가하지 않음

## Product Deliverable

- 사용자는 Build Plan을 현재 단계 중심의 설치 흐름으로 따라갈 수 있음
- 자동 준비와 사용자·전문가 작업을 명확히 구분함
- 설치 진행률과 완료 상태를 확인할 수 있음

## MVP Impact

- 정량 퍼센트는 산정하지 않음. Build Plan을 실제 수행 가능한 Installation 경험으로 연결해 MVP의 “설계→설치” 단계를 구현함.

## Verification

- Tests: 101 passing
- lint: passed
- typecheck: passed
- build: passed
- `git diff --check`: passed
- Migration/DB: 없음
- Commit: `6d68a8e` (`feat: add installation wizard foundation`)
- Push: 없음
