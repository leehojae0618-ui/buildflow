# BuildFlow Audit Guide

## 1. Audit Purpose

이 가이드는 구현자의 자기 검증과 독립 감사의 역할을 분리하고, Task·Contract·코드·
테스트·Evidence·문서 주장이 실제로 일치하는지 검토하는 최소 기준이다.

## 2. Audit Inputs

- 승인된 Task, Scope Freeze, Contract 및 Report
- 대상 Commit hash와 실제 Diff
- focused/full test, typecheck, lint, build 결과
- 해당 시 Runtime Evidence와 관련 Sprint 문서
- [`PROJECT_STATE.md`](PROJECT_STATE.md), 관련 Architecture 문서와 운영 상태

## 3. Audit Scope

- Scope 및 기능 정확성
- Architecture·Core/Product 경계
- Runtime 안전성, Human Approval, 오류 처리
- Secret 처리, 데이터 접근·RLS, concurrency·idempotency
- Evidence 품질, 문서 정합성, 테스트 충분성 및 회귀 위험

## 4. Audit Method

1. 승인된 요구사항과 제외 범위를 확인한다.
2. 대상 Commit과 Diff를 확인한다.
3. 실제 코드 호출 흐름과 실패 경계를 추적한다.
4. 테스트·빌드·필요한 Runtime Evidence를 대조한다.
5. Report와 문서의 주장을 실제 결과와 대조한다.
6. 확인된 위험을 심각도로 분류하고 판정을 기록한다.

## 5. Severity

| 등급 | 의미 |
|---|---|
| BLOCKER | 데이터 손실, 권한 우회, Secret 노출 또는 안전한 Release/Commit을 즉시 막는 문제 |
| HIGH | 승인된 핵심 계약, 실행 경로 또는 검증 결과를 신뢰할 수 없게 만드는 문제 |
| MEDIUM | Beta 품질·유지보수성에 큰 영향을 주지만 즉시 안전 경계를 깨지 않는 문제 |
| LOW | 제한된 개선 또는 문서 명확성 문제 |
| NOTE | 수정 요구가 아닌 관찰 또는 후속 검토 항목 |

## 6. Verdict

- `PASS`: Task·Contract·Evidence·검증 결과가 모두 충족되고 차단 Finding이 없다.
- `PASS WITH CONDITIONS`: 차단되지 않는 조건 또는 명시적 후속 검증이 남아 있다.
- `FAIL`: BLOCKER/HIGH Finding 또는 Scope/계약 위반이 있다.
- `NOT VERIFIABLE`: 필요한 환경, Evidence 또는 입력이 없어 판정할 수 없다.

테스트 명령의 성공만으로 `PASS`가 되지는 않는다.

## 7. Required Audit Output

- Verdict와 검토한 Scope
- Finding, 심각도, 파일/경로 또는 Evidence
- 확인한 위험과 필요한 수정
- 잔여 UNKNOWN 및 권장 다음 Gate

## 8. Independence Rules

- 구현 보고를 그대로 신뢰하지 않고 실제 Diff·코드·Evidence를 확인한다.
- 확인하지 못한 항목을 `PASS`로 처리하지 않는다.
- 외부 환경 부재로 확인하지 못한 사항은 `NOT VERIFIABLE` 또는 조건으로 남긴다.
- 감사 과정에서 새로운 기능을 요구하거나 Scope를 확장하지 않는다.
- 기존 감사 형식은 [`audits/`](audits/)의 실제 Report를 참고하되, 최신 Sprint
  Task와 Contract를 우선한다.
