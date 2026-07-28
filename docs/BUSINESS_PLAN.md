# BuildFlow Business Plan

## 1. Document Purpose

이 문서는 BuildFlow가 해결하려는 고객 문제, 제품 가치, Beta 검증 순서와
상업화 상태를 기록한다. 제품 기능과 도메인 정의는
[`project/PROJECT_BIBLE.md`](project/PROJECT_BIBLE.md), 현재 구현 상태는
[`PROJECT_STATE.md`](PROJECT_STATE.md), 기술 경계는
[`project/ARCHITECTURE.md`](project/ARCHITECTURE.md)를 기준으로 한다.

이 문서는 확인된 사실(Confirmed), 기존 문서의 검증 가설(Hypothesis), 저장소에서
확인되지 않은 항목(UNKNOWN)을 구분한다.

## 2. Business Overview

BuildFlow의 공식 방향은 사용자의 목표를 실행 가능한 AI Agent로 전환하고,
검증된 Agent Package의 공유를 지향하는 **AI Agent Factory**다. 핵심 흐름은
목표 이해, Clarification, Agent/Blueprint 설계, Approval, Runtime, Evidence,
결과 확인이다.

범용 Web App·SaaS·Platform 생성은 현재 핵심 제품 약속이 아니다. 웹 UI, API,
데이터베이스, 인증과 호스팅은 Agent를 사용·관리·운영하기 위한 지원 표면으로만
포함될 수 있다.

## 3. Customer Problem

Confirmed:

- 기존 제품 문서는 AI·자동화 도구의 비교, 연결, 비용·난이도 판단이 사용자에게
  복잡하다는 문제를 다룬다.
- BuildFlow는 도구 목록보다 사용자가 원하는 결과와 실행 경로를 우선한다.
- 외부 실행, 비용, 권한, 민감 정보는 명시적 동의와 안전한 승인 경계가 필요하다.
- 실행 결과가 신뢰 가능하려면 Evidence와 검증 결과가 필요하다.

Hypothesis:

- AI·자동화 경험이 적은 사용자는 도구 선택보다 목표 중심 설계에 더 높은 가치를
  느낀다.

## 4. Target Customer

Confirmed:

- 기존 MVP/PRD 문서는 AI 입문자, 비개발자 1인 사업자, 쇼핑몰 운영자, 마케터,
  콘텐츠 제작자와 반복 업무가 많은 직장인을 초기 대상 사용자로 기록한다.
- 전문 개발자, 복잡한 Agent Framework 사용자, 대규모 Enterprise IT 조직은 초기
  비대상으로 기록되어 있다.

Hypothesis:

- 위 초기 세그먼트 중 어떤 하나가 우선 ICP인지, 어떤 문제에서 반복 사용·지불
  의사가 생기는지는 아직 검증 대상이다.

## 5. Value Proposition

BuildFlow가 제공하려는 사업적 가치는 다음과 같다.

- 사용자의 목표를 질문·제약·계획을 갖춘 실행 가능한 Agent 형태로 전환한다.
- 도구 탐색과 연결의 복잡성을 시스템이 구조화하고, 사용자는 필요한 답변과 중요한
  승인을 제공한다.
- 승인 경계와 안전한 Runtime 결과로 외부 실행의 책임 범위를 명확히 한다.
- Evidence로 실행·검증 사실을 추적하고, 장기적으로 재사용 가능한 AI Agent
  Package 공유를 지원한다.

## 6. Product Offering

현재 제공 기반은 Requirement/Clarification, Agent·Blueprint 계약, Core Runtime,
Runtime Evidence, Approval Foundation 및 기존 Project·Workflow 경험이다.

Runtime Approval과 Product Runtime Bridge는 로컬 구현·독립 검토 대기 상태이며,
실제 DB RPC/RLS/concurrent consume 검증 전에는 Production Ready가 아니다.
향후 Marketplace 방향은 BPS 호환 AI Agent Package의 공유·복제·설치다.

## 7. Beta Strategy

Confirmed:

- MVP 문서는 Billing 제외를 기본으로 하는 Free Beta를 기록한다.
- Closed Beta는 Goal부터 Approval, 실제 Provider/Tool Invocation, Evidence,
  Result, Agent 재사용까지의 End-to-End 경험을 목표로 한다.
- 현재 Beta 진입 전 기술 Gate에는 Runtime Approval 및 Product Runtime의 독립
  검토와 실제 Supabase RPC/RLS/concurrent consume 검증이 포함된다.

UNKNOWN:

- Beta 모집 규모, 일정, 실제 참여자, 인터뷰 방식과 통과 수치.

## 8. Business Model Status

Confirmed:

- 가격은 확정되지 않았으며 기존 PRD는 `TBD`로 기록한다.
- MVP Billing의 기본 결정은 Free Beta이며, Marketplace의 유료 Listing은 장기
  Roadmap 방향이다.

Hypothesis:

- 사용량 확대, 고급 기능, 반복 업무 절감, 전문가 지원 또는 Marketplace가 향후
  상업화 신호가 될 수 있다.

UNKNOWN:

- 가격, 무료 한도, 결제 Provider, Marketplace 수수료, 환불 정책, CAC/LTV,
  매출 목표 및 단위 경제성.

## 9. Go-to-Market Status

Confirmed:

- 기존 MVP 문서는 제한 초대형 비공개 Beta를 기록한다.

UNKNOWN:

- 고객 모집 채널, 마케팅 예산, 영업 전략, 파트너십, 실제 대기자 또는 전환 데이터.

## 10. Success Metrics

기존 문서에는 목표 입력 완료, Recommendation 생성·상세 조회·저장, 재방문,
Integration 연결, 테스트 실행, 실행 성공 및 유료 기능 관심 신호가 지표 후보로
기록되어 있다. 현재 제품 흐름에는 Clarification 완료, Approval 완료, Runtime
완료, Evidence 가용성, Agent 생성·재사용도 추적 후보가 될 수 있다.

수치 목표, North Star Metric의 최종 선택, 측정 구현 상태는 UNKNOWN이다.

## 11. Risks and Dependencies

- Runtime Approval Foundation 및 Product Runtime Integration의 독립 구현
  검토가 남아 있다.
- 실제 Supabase RPC/RLS/concurrent consume 검증이 실행되지 않았다.
- Provider 비용 정책은 billing-grade pricing catalog가 아니며 운영 비용 구조가
  확정되지 않았다.
- 인증 브라우저·다중 사용자·실제 RLS E2E Evidence와 장기 운영 Evidence가
  불완전하다.
- Beta 사용자 검증, 시장 반응, 가격 반응은 아직 확인되지 않았다.

## 12. Confirmed / Hypothesis / UNKNOWN Summary

| 구분 | 핵심 내용 |
|---|---|
| Confirmed | AI Agent Factory 방향, 결과 중심 사용자 흐름, Approval/Evidence 경계, Free Beta 기본 결정, Marketplace 장기 방향 |
| Hypothesis | 초기 사용자 세그먼트의 우선순위, 목표 중심 설계의 시장 가치, 향후 유료 전환 신호 |
| UNKNOWN | ICP, 가격·결제·수수료, 시장 규모, 매출·비용·CAC/LTV, Beta 수치와 일정 |
