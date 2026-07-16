# PIVOT-004 Report

## Technical Deliverable

- Clarification Queue에 priority를 추가하고 우선순위 순으로 정렬
- 이미 채워진 Requirement 값은 질문에서 제외하는 Skip Logic 유지
- Completeness와 Build Readiness Summary 계산
- Constraint를 AUTO, PARTIAL, CONSENT_REQUIRED, MANUAL, EXPERT, UNSUPPORTED로 정리
- Capability Summary를 Automation, Consent, Manual, Expert, Unsupported로 계산
- Requirement Summary UI에 질문 진행 상태와 5종 Capability 지표 표시
- Conversation State, Missing Requirement, Summary의 다음 질문을 Snapshot과 UI에 연결

## Product Deliverable

- BuildFlow가 바로 답하는 대신 가장 중요한 정보부터 질문함
- 사용자는 설계 준비도와 직접 동의·수행해야 할 일을 구분해서 확인함
- Consent와 Manual을 구분해 구축 가능성 설명의 정확도를 높임

## Verification

- Tests: 91 passing
- lint: passed
- typecheck: passed
- build: passed
- `git diff --check`: passed
- Migration: 없음
- Authenticated browser QA: 로그인 세션 부재로 보류

## Conversation Engine Extension

- State: `WAITING`, `ASKING`, `COMPLETE`, `READY_FOR_BUILD`
- Queue: priority 순서로 다음 질문을 선택
- Skip Logic: Requirement에 이미 반영된 값은 질문하지 않음
- Commit: 없음 (사용자 지시로 자동 Commit 금지)

## Next Sprint

PIVOT-005 — Build Score Foundation

## Git

- Commit: `9e43265` (`feat: add clarification experience foundation`)
- Push: not performed
