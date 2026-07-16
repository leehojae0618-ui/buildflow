# PRODUCT-REVIEW-003.5 — Autonomous Build User Experience Review

## Scope and evidence

코드와 기존 자동화·Package·Verification 화면을 일반 사용자 관점에서 검토했다. 실제 Credential, 다른 계정, Provider Live QA는 사용하지 않았다. 따라서 외부 구축 성공과 Production Ready 실환경 증거는 RC Gate로 분리한다.

## 시나리오별 사용자 여정

### 1. 간단한 AI Agent

`/app/projects/new`에서 목표를 입력하고 Project를 만든다. Requirement Snapshot에서 필요한 확인 질문, 자동화 수준, 계정·Credential 상태를 확인한 뒤 Autonomous Build Session을 시작한다. Credential·Consent·Approval 상태에서는 사용자 작업 후 재개 버튼이 제공된다.

관찰: 흐름의 도메인 단계는 연결되어 있고 Secret 원문은 표시하지 않는다. 다만 기본 화면에 `Autonomous Build Session`, `Credential`, `Verification` 같은 기술 용어와 내부 상태가 남아 있어 최초 사용자에게는 설명이 필요하다.

### 2. 간단한 웹앱

Architecture 후보를 비용·자동화율·예상 시간으로 비교하고 선택한다. Build Plan과 Provider 준비 상태를 확인한 뒤 Delivery Summary에서 예상 시간·월 비용·자동화율·남은 사용자 작업을 확인하고 구축 세션을 시작한다. Package Export는 Project Detail에서 가능하다.

관찰: 시작 전 기대치를 제공하고 세션 저장을 안내한다. 그러나 Delivery Summary는 최신 Deployment Session을 서버에서 다시 읽어 화면에 복원하지 않으므로, 새로고침 이후 해당 요약 상태 표시가 완전하지 않다. 실제 GitHub·Supabase·Vercel 생성, 배포 URL, Health Check는 Live QA 전까지 확인되지 않는다.

### 3. 플랫폼

Architecture 후보와 Build Intelligence가 비용·시간·위험도·사용자 작업을 보여준다. 일부 자동화, 수동 작업, 전문가 필요, 지원 범위 외 capability를 구분한다.

관찰: 복잡도와 지원 한계를 모델링할 기반은 있다. 장시간 구축에서 진행률·대기 사유·복구를 한 화면에서 일관되게 보여주는 사용자 문구는 추가 검토가 필요하다.

## 사용자 개입 및 피로도

| 항목 | Agent | 웹앱 | 플랫폼 | 평가 |
|---|---:|---:|---:|---|
| 목표 입력 | 1 | 1 | 1 | 시작 경로는 단순함 |
| Architecture/Preference 선택 | 0~1 | 1 | 1+ | 선택 후보가 많아지면 설명 필요 |
| Credential 입력 | Provider 수 | Provider 수 | Provider 수 | 한 번에 묶는 UX 필요 |
| 승인 | 비용·권한 범위별 | 비용·권한 범위별 | 비용·권한 범위별 | Approval bundle 기반 |
| 반복 질문 | 측정 불가 | 측정 불가 | 측정 불가 | RC 전 telemetry/리뷰 필요 |
| 수동 설정 | Live QA 전 미확인 | Supabase 등 USER_ACTION 가능 | 증가 가능 | RC Gate |
| 재방문/재개 | 세션 저장 기반 | Deployment 저장 기반 | 세션 저장 기반 | UI 복원은 보완 필요 |

## 상태 표현 검토

내부 enum은 상세 상태로 존재하지만 일부 화면에 `WAITING_FOR_CREDENTIAL`, `WAITING_FOR_APPROVAL`, `PROVISIONING`, `VERIFYING`가 그대로 노출된다. 일반 사용자용 문구(“연결 정보가 필요합니다”, “승인을 기다리고 있습니다”, “서비스를 준비하고 있습니다”)로 매핑해야 한다.

## Production Ready 검토

Production Ready 계약은 URL, Health Check, 필수 Verification, 기능 테스트, Critical 오류 없음이 모두 충족되어야 true가 되도록 강화되었다. 다만 현재 완료 화면에는 서비스 URL, 관리자 URL, 백업, 모니터링, 실제 비용, 사용 시작 방법을 표현할 완성된 결과 카드가 없다. Live QA가 없는 항목은 완료로 표시하지 않아야 한다.

## 분류

### RC 전 필수 수정

- 저장된 Deployment Session을 새로고침·재로그인 후 Delivery UI에 실제 복원
- 내부 enum을 사용자 친화적 상태 문구로 변환
- Production Ready 결과 카드에 URL·관리자 접근·사용 시작 방법·백업·모니터링·경고 표시
- Live GitHub/Supabase/Vercel QA 및 Health Check 증거 확보 전까지 Production Ready를 확정하지 않기

### Beta Backlog

- 실제 사용자 입력·승인·중단·대기 시간 telemetry
- 반복 질문과 복사·붙여넣기 감소
- 장시간 작업의 재방문 안내와 단계별 진행 문구 개선
- 기술 로그 상세 보기의 정보 우선순위 정리

### Future Backlog

- 신규 Provider, 고급 자동 복구, 개인화, Marketplace 확장

## Live QA 의존 항목

TD-013과 TD-014를 유지한다. 테스트 Credential 없이 GitHub Repository 생성, Supabase Schema/RLS 적용, Vercel Deployment, URL Health Check, 운영비·백업·모니터링의 실환경 증거를 주장하지 않는다.

## 최종 판정

**CONDITIONALLY READY**

핵심 사용자 여정과 안전한 완료 판정의 구조는 준비되었다. 다만 RC 전 필수 UX 보완과 Live Provider QA가 남아 있어 UX READY 또는 Production Ready로 확정하지 않는다. 다음 권장 작업은 새 기능 Sprint가 아니라 RC 필수 Gate 정리 및 위 RC 전 필수 수정의 Stabilize 후보화다.
