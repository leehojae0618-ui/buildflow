# BuildFlow

## Minimum Viable Product Scope

- Version: 1.0
- Status: Draft
- Brand Name: BuildFlow
- Internal Codename: Project Flow
- Document Owner: Founder
- Last Updated: 2026-07-14
- Target: First Public MVP
- Development Model: Solo Founder + Codex
- Related Documents:
  - `docs/00-brand.md`
  - `docs/01-prd.md`
  - `docs/02-information-architecture.md`
  - `docs/03-user-flow.md`
  - `docs/05-development-rule.md`

## 1. Document Purpose

이 문서는 BuildFlow의 첫 출시에서 실제 구현할 범위를 확정하는 기준 문서다. PRD는 전체 제품 요구사항을 정의하지만, MVP 문서는 그중 첫 출시에서 반드시 구현할 항목만 좁혀서 다룬다. PRD에 있어도 MVP에서 제외될 수 있으며, 개발 중 새 기능이 제안되면 이 문서를 기준으로 포함 여부를 판단한다. 이 문서는 Codex가 이후 구현 작업을 작은 Task로 나누는 기준이기도 하다.

## 2. MVP Hypothesis

### Core Hypothesis

AI 및 자동화 경험이 부족한 사용자는 Tool 목록보다 자신의 목표에 맞는 실행 가능한 Workflow 설계에 더 높은 가치를 느낀다.

### Supporting Hypotheses

- 사용자는 목표를 자연어로 입력하는 방식을 선호한다.
  - 검증 행동: 목표 입력 시작률, 목표 제출률, 자연어 수정률을 확인한다.
- 사용자는 추천 이유와 함께 비용, 난이도, 구축 시간을 알고 싶어 한다.
  - 검증 행동: 결과 상세 조회율과 비용/난이도 확인 후 저장률을 확인한다.
- 10개의 검증된 Workflow Template만으로도 초기 가치를 검증할 수 있다.
  - 검증 행동: Template 재사용률과 반복 요청되는 Workflow 유형을 확인한다.
- 모든 실행을 직접 지원하지 않아도 상세 설계와 n8n 가이드가 충분한 가치를 만들 수 있다.
  - 검증 행동: n8n 가이드 열람률과 저장률을 확인한다.
- 사용자는 Tool 이름보다 결과 중심 예시를 더 쉽게 이해한다.
  - 검증 행동: Example 또는 Goal 예시를 클릭하는 비율을 확인한다.
- 저장과 재방문 기능이 단순 1회성 추천보다 재사용 가능성을 높인다.
  - 검증 행동: Save율과 7일 재방문율을 확인한다.
- n8n Template Handoff가 실행 가능성에 대한 신뢰를 높일 수 있다.
  - 검증 행동: Handoff 열람 후 Workflow 저장 또는 구현 시작 신호를 확인한다.

## 3. MVP Success Definition

MVP 성공은 기능 완성만으로 정의하지 않는다.

### 사용자 성공

사용자가 다음을 할 수 있어야 한다.

1. 만들고 싶은 결과를 입력한다.
2. 최소한의 조건을 추가한다.
3. 하나 이상의 Workflow 후보를 받는다.
4. 추천 이유를 이해한다.
5. 비용과 난이도를 비교한다.
6. Workflow의 단계와 준비사항을 확인한다.
7. 결과를 저장하고 다시 볼 수 있다.
8. 최소 하나의 제한된 테스트 또는 n8n 실행 준비를 경험한다.

### 사업 성공

다음 지표를 관찰할 수 있어야 한다.

- 목표 입력 완료율
- Recommendation 생성 성공률
- Workflow 상세 조회율
- Workflow 저장률
- 재방문율
- n8n 가이드 진입률
- 유료 기능 관심 신호
- 반복적으로 요청되는 Workflow 유형

정확한 목표 수치는 초기 Beta 이후 설정하므로 `TBD`로 둔다.

## 4. MVP Target User

### Primary

- AI 입문자
- 비개발자 1인 사업자
- 마케터
- 쇼핑몰 운영자
- 반복 업무가 많은 직장인
- 콘텐츠 제작자

### 초기 주요 문제

- 어떤 AI Tool을 써야 하는지 모름
- Tool 간 연결 방법을 모름
- 비용과 난이도를 판단하기 어려움
- n8n과 같은 도구를 열어도 시작하지 못함
- 검색 결과가 많지만 자신의 조건에 맞는 답을 얻기 어려움

### MVP Non-Target

- 전문 개발자
- 복잡한 Agent Framework 사용자
- Enterprise IT 팀
- 대규모 자동화 운영 조직
- 실시간 협업이 필요한 팀
- 자체 인프라와 보안 승인이 필요한 기업

## 5. MVP Core Journey

첫 출시 핵심 Flow를 다음으로 확정한다.

```text
Landing
→ 회원가입 또는 로그인
→ 새 프로젝트
→ 목표와 최소 조건 입력
→ Recommendation 생성
→ 최대 3개 Workflow 후보
→ Workflow 상세 확인
→ 후보 선택
→ Project 저장
→ 필요한 준비사항 확인
→ n8n Template Handoff 또는 Setup Guide
→ Dashboard 재방문
```

다음 항목은 핵심 Flow에서 제외하거나 약화한다.

- Visitor AI Preview는 제외
- 긴 Onboarding은 제외
- 직접 Test Run은 제외
- 복잡한 Workflow 수정 대화는 제외
- 여러 Workflow Version 비교는 제외
- 고급 Integration Dashboard는 제외
- Team 기능은 제외

## 6. P0 - Release Blocking Scope

P0는 없으면 출시할 수 없는 기능이다.

### P0-001 Landing

- 사용자 가치: 첫 방문 사용자가 제품 목적을 즉시 이해하고 목표 입력으로 이동할 수 있다.
- 포함 이유: 제품 설명과 진입점이 없으면 핵심 Flow가 시작되지 않는다.
- 구현 범위: BuildFlow 설명, “무엇을 만들고 싶나요?”, 대표 활용 사례, 회원가입 또는 시작 CTA, 모바일 대응.
- 제외 범위: 복잡한 마케팅 섹션, 애니메이션 중심 페이지, Tool Logo Wall, 블로그, 고객사 로고.
- 의존성: 기본 라우팅, 목표 입력 폼, 인증 진입점.
- 완료 조건: 방문자가 목표 입력 또는 Signup으로 자연스럽게 이동할 수 있다.
- 출시 차단 조건: 핵심 메시지가 보이지 않거나 Goal 입력이 시작되지 않으면 차단된다.

### P0-002 Authentication

- 사용자 가치: 사용자가 Project를 저장하고 다시 접근할 수 있다.
- 포함 이유: 저장, 재방문, 보호 Route, 개인화 흐름에 필수다.
- 구현 범위: Email 로그인, Email 회원가입, Google OAuth, 로그아웃, Session 유지, 보호 Route, 안전한 Redirect.
- 제외 범위: GitHub OAuth, Kakao OAuth, Apple 로그인, Magic Link, 전화번호 로그인, Enterprise SSO.
- 의존성: Auth Provider, Callback 처리, Session 관리.
- 완료 조건: 가입과 로그인 후 원래 작업으로 안전하게 복귀할 수 있다.
- 출시 차단 조건: Session 유지나 안전한 Redirect가 불안정하면 차단된다.

### P0-003 Minimal Profile

- 사용자 가치: Recommendation 기본값을 개인화할 수 있다.
- 포함 이유: 최소한의 조건 없이는 초기 추천 품질이 떨어진다.
- 구현 범위: 표시 이름 또는 기본 프로필, AI 숙련도, 개발 가능 여부, 주요 사용 목적.
- 제외 범위: 상세 프로필, 아바타 업로드, 팀 정보, 공개 프로필.
- 의존성: Signup, Project 생성 흐름.
- 완료 조건: 최소 프로필 값이 저장되고 추천에 반영된다.
- 출시 차단 조건: 핵심 추천 조건을 확보하지 못하면 차단된다.

### P0-004 Project CRUD

- 사용자 가치: 사용자가 목표 단위로 작업을 관리할 수 있다.
- 포함 이유: 저장과 재방문의 기준 단위가 필요하다.
- 구현 범위: Project 생성, 목록, 상세, 제목 수정, Archive 또는 최소 삭제, 사용자 소유권 보호.
- 제외 범위: 공유, 공동 편집, 폴더, 태그, 복잡한 상태 관리.
- 의존성: 인증, RLS, Dashboard.
- 완료 조건: 사용자가 자신의 Project를 생성하고 다시 열 수 있다.
- 출시 차단 조건: 소유권 보호나 목록/상세가 불안정하면 차단된다.

### P0-005 Goal Input

- 사용자 가치: 사용자가 원하는 결과를 자연스럽게 입력할 수 있다.
- 포함 이유: 모든 핵심 Flow의 시작점이다.
- 구현 범위: 사용자가 원하는 결과, 추가 설명, 최소 조건, 입력 검증, 입력 보존.
- 제외 범위: 10개 이상의 긴 설문, 복잡한 Wizard, 다단계 상담.
- 의존성: Landing, Project 생성, Recommendation Engine.
- 완료 조건: 목표와 최소 조건이 저장되고 다시 불러올 수 있다.
- 출시 차단 조건: 입력 보존이 안 되면 차단된다.

### P0-006 Workflow Template Database

- 사용자 가치: 검증된 설계 후보를 빠르게 보여줄 수 있다.
- 포함 이유: LLM만으로는 일관된 추천 품질을 확보하기 어렵다.
- 구현 범위: 10개 핵심 Template, Category, Goal, Steps, Required Tools, Alternatives, Cost Model, Difficulty, Estimated Setup Time, Execution Support Level.
- 제외 범위: 100~200개 Template, Marketplace, 사용자 Template 등록, Template 판매.
- 의존성: Seed 데이터, Recommendation Engine.
- 완료 조건: 최소 10개 이상 Template이 추천에 사용 가능하다.
- 출시 차단 조건: Template이 부족하거나 구조가 불완전하면 차단된다.

### P0-007 Tool Database

- 사용자 가치: Workflow에 필요한 도구를 이해할 수 있다.
- 포함 이유: 비용과 준비사항을 설명하려면 최소한의 Tool 메타데이터가 필요하다.
- 구현 범위: Workflow Template에 실제 필요한 Tool만 등록, 약 15~30개 범위의 초기 Tool, 이름, Category, 설명, Pricing Model, API 여부, OAuth 여부, Difficulty, Execution Support, Last Verified.
- 제외 범위: 100~200개 Tool, 인기순위, 리뷰, 별점, 모든 AI Tool 수집.
- 의존성: Template, Seed 데이터.
- 완료 조건: 선택된 Workflow에 필요한 Tool 설명이 표시된다.
- 출시 차단 조건: 가격이나 API 여부를 설명할 수 없으면 차단된다.

### P0-008 Recommendation Engine V1

- 사용자 가치: 목표에 맞는 후보를 빠르게 추천받을 수 있다.
- 포함 이유: BuildFlow의 핵심 가치이기 때문이다.
- 구현 범위:

```text
Goal Normalization
→ Category Classification
→ Rule Filter
→ Template Retrieval
→ Cost and Difficulty Calculation
→ LLM Explanation
→ Structured Result
```

- 제외 범위: Vector Database, Embedding 기반 복잡한 검색, 사용자 행동 기반 학습, 완전 자동 Agent, LLM이 가격과 실행 지원 여부를 임의 결정, 실시간 Tool 웹 조사.
- 의존성: Goal Input, Template DB, Tool DB, LLM Provider.
- 완료 조건: 최대 3개 후보를 구조화된 형태로 반환한다.
- 출시 차단 조건: 결과 Schema 검증 실패나 중복 요청 통제가 안 되면 차단된다.

### P0-009 Recommendation Results

- 사용자 가치: 후보를 비교하고 적합한 Workflow를 선택할 수 있다.
- 포함 이유: 추천을 행동으로 전환하는 핵심 화면이다.
- 구현 범위: 최대 3개 후보, Primary Recommendation, 대안, 추천 이유, 예상 비용, 난이도, 예상 구축 시간, Tool, 제한사항, Workflow 선택.
- 제외 범위: 복잡한 비교표, 무제한 후보, 커뮤니티 평가, 자동 A/B 테스트.
- 의존성: Recommendation Engine.
- 완료 조건: 사용자가 후보 차이를 이해하고 하나를 선택할 수 있다.
- 출시 차단 조건: 비용, 난이도, 제한이 빠져 있으면 차단된다.

### P0-010 Workflow Detail

- 사용자 가치: 선택된 설계의 실행 가능성을 확인할 수 있다.
- 포함 이유: 저장과 실행 준비를 연결하는 핵심 단계다.
- 구현 범위: 단계형 Workflow, 각 단계의 목적, 입력, 작업, 출력, Tool, 대체 Tool, 비용, 난이도, 준비사항, 실행 지원 수준, 저장.
- 제외 범위: Drag and Drop, Node Canvas, 자유 연결, 실시간 실행 로그 Builder, 멀티에이전트 편집.
- 의존성: Recommendation 선택, Workflow Template.
- 완료 조건: Workflow 전체 구조를 단계별로 읽을 수 있다.
- 출시 차단 조건: 단계와 준비사항이 없으면 차단된다.

### P0-011 Save and Resume

- 사용자 가치: 사용자가 나중에 다시 돌아와 작업을 이어갈 수 있다.
- 포함 이유: 1회성 추천이 아니라 반복 사용을 가능하게 한다.
- 구현 범위: Goal 저장, Recommendation 저장, 선택 Workflow 저장, Dashboard 재접근, 최근 Project, 현재 다음 행동 표시.
- 제외 범위: 고급 Version Diff, 자동 백업 UI, 공유 링크, 협업 History.
- 의존성: Project CRUD, Recommendation 저장.
- 완료 조건: 재방문 시 현재 상태와 다음 행동을 확인할 수 있다.
- 출시 차단 조건: 저장된 상태를 복원하지 못하면 차단된다.

### P0-012 Basic Usage Tracking

- 사용자 가치: 사용량을 이해하고 한도에 도달했는지 알 수 있다.
- 포함 이유: 제한과 재시도, 향후 과금 기준에 필요하다.
- 구현 범위: Recommendation 사용량, Test 사용량, 사용자별 Usage 저장, 중복 요청 방지, 최소 Rate Limit.
- 제외 범위: 복잡한 Billing Meter, 실시간 Usage Dashboard, Enterprise Quota, 세부 비용 청구.
- 의존성: Recommendation, Test Run, 인증.
- 완료 조건: 사용자별 사용량이 기록되고 제한을 걸 수 있다.
- 출시 차단 조건: 중복 요청 방지가 없으면 차단된다.

### P0-013 Security Foundation

- 사용자 가치: 안전하게 사용할 수 있다.
- 포함 이유: 사용자 데이터와 Secret을 다루기 때문이다.
- 구현 범위: Supabase RLS, 사용자 데이터 격리, Server-only Secret, 입력 검증, 안전한 Redirect, 환경변수 검증, 오류 정보 최소 노출.
- 제외 범위: Enterprise 보안 인증, SSO, 복잡한 Audit Dashboard, 사용자 API Key 장기 저장이 필요하지 않으면 구현하지 않음.
- 의존성: 인증, 데이터 계층, 배포 설정.
- 완료 조건: 기본 보안 원칙이 모든 핵심 Flow에 적용된다.
- 출시 차단 조건: RLS나 Secret 노출 위험이 있으면 차단된다.

### P0-014 Error and Loading States

- 사용자 가치: 실패해도 다음 행동을 알 수 있다.
- 포함 이유: Recommendation과 Integration, Test는 실패 가능성이 높다.
- 구현 범위: Recommendation 진행 상태, 실패, 재시도, 입력 보존, Not Found, 권한 오류, Network 오류, Rate Limit.
- 제외 범위: 복잡한 Notification Center, 고급 Incident UI.
- 의존성: 모든 핵심 Flow.
- 완료 조건: 핵심 화면에 Empty, Loading, Error 상태가 존재한다.
- 출시 차단 조건: 오류 복구 경로가 없으면 차단된다.

### P0-015 Responsive Web

- 사용자 가치: 데스크톱과 모바일 웹에서 핵심 Flow를 사용할 수 있다.
- 포함 이유: 초기 사용자는 다양한 환경에서 접근한다.
- 구현 범위: Desktop, Tablet 기본 대응, Mobile Web, 핵심 Flow 사용 가능.
- 제외 범위: Native App, PWA 고도화, Offline Mode.
- 의존성: 전 화면.
- 완료 조건: 모바일 웹에서 핵심 작업이 가능하다.
- 출시 차단 조건: 모바일에서 Goal 입력이나 Workflow 확인이 불가능하면 차단된다.

## 7. P1 - Validation Enhancing Scope

P1은 MVP 가치를 높이지만 출시 차단 기능은 아니다.

### P1-001 Visitor Goal Preview

- 사용자 가치: 가입 전에 BuildFlow의 가치를 확인할 수 있다.
- 포함 조건: 랜딩 방문자에게 제한된 Preview가 필요할 때.
- 최소 구현: 로그인 전에 Goal 입력, 정적 예시 Workflow 확인, 가입 후 입력 복원.
- 제외 범위: 전체 Workflow, 복잡한 개인화.
- P0로 승격되는 조건: 가입 전 전환률 개선에 핵심적으로 필요할 때.

### P1-002 Goal Clarification

- 사용자 가치: 모호한 Goal을 더 정확하게 다룰 수 있다.
- 포함 조건: 추천 품질이 Goal 모호성에 크게 좌우될 때.
- 최소 구현: 모호한 Goal에 질문 1회, 선택형 우선, 질문 반복 금지, 최대 횟수 `TBD`.
- 제외 범위: 긴 상담형 대화.
- P0로 승격되는 조건: 실제 추천 품질이 불안정하면 승격한다.

### P1-003 Recommendation Revision

- 사용자 가치: 결과를 조금 더 현실적으로 조정할 수 있다.
- 포함 조건: 비용, 난이도, Tool 선택의 조정 수요가 있을 때.
- 최소 구현: 비용 낮추기, 난이도 낮추기, 특정 Tool 제외, 개발 없는 방식, 기존 결과 기반 새 Version 생성.
- 제외 범위: 자유형 다단계 수정 대화.
- P0로 승격되는 조건: 고객이 반복적으로 수정 요청을 한다면 승격한다.

### P1-004 Limited Test Run

- 사용자 가치: 실행 가능성에 대한 최소한의 신뢰를 얻는다.
- 포함 조건: 하나의 대표 테스트만으로 검증 가치가 있을 때.
- 최소 구현: 텍스트 입력 → LLM 결과 생성, Gmail 내용 → 요약 결과 생성, Google Sheets Row → 요약 결과 생성, Webhook 입력 → n8n Test Trigger 중 하나 선택. 단, BuildFlow 서버 직접 실행은 초기 Beta에서 제외한다.
- 제외 범위: 다중 실행, 장시간 작업, 대량 데이터 처리.
- P0로 승격되는 조건: 제품 검증에 반드시 필요한 실행 신호가 확인될 때.

### P1-005 n8n Template Handoff

- 사용자 가치: 직접 실행하지 않더라도 구현 시작점을 제공받는다.
- 포함 조건: 일부 Workflow를 n8n 템플릿으로 전달할 수 있을 때.
- 최소 구현: JSON Template 제공, Credential 설정 안내, Import 가이드, Test Webhook 안내.
- 제외 범위: 사용자 n8n 인스턴스 전체 관리, 자동 Credential 입력, Self-hosted 환경 지원 보장, 모든 Template 자동 실행.
- P0로 승격되는 조건: 실행형 가치 검증에 핵심적이면 승격한다.

### P1-006 Basic Subscription Gate

- 사용자 가치: 유료 전환 가능성을 검증한다.
- 포함 조건: 실제 유료 검증이 필요한 경우.
- 최소 구현: Free와 Pro 상태, 단순 기능 제한, Upgrade CTA.
- 제외 범위: 복잡한 가격 정책, 고급 Billing 관리.
- P0로 승격되는 조건: 공개 유료 출시를 본격적으로 진행할 때.

### P1-007 Integration Status

- 사용자 가치: 연결이 필요한 기능을 안전하게 다룰 수 있다.
- 포함 조건: 실제 Test Run 또는 n8n Handoff에 연결 상태가 필요할 때.
- 최소 구현: OAuth 또는 API 연결이 정말 필요한 Test Run에 한해 구현, 범용 Integration Center는 만들지 않음, 하나의 Provider만 먼저 지원 가능.
- 제외 범위: 고급 연결 대시보드.
- P0로 승격되는 조건: 실행 가치가 Integration 없이는 성립하지 않을 때.

### P1-008 Minimal Analytics

- 사용자 가치: 핵심 흐름 성과를 측정할 수 있다.
- 포함 조건: 출시 후 행동 데이터가 필요할 때.
- 최소 구현: 핵심 Event 수집, 개인 Goal 원문 저장 금지, Analytics Provider는 `TBD`.
- 제외 범위: 고급 분석 대시보드.
- P0로 승격되는 조건: 출시 판단에 필요한 기본 데이터가 부족할 때.

## 8. P2 - Post-MVP Scope

다음 기능은 첫 출시 이후로 명확하게 제외한다.

- 시각적 노드 Builder: MVP의 단계형 UX와 충돌한다.
- Workflow Marketplace: 거래와 운영 복잡도를 높인다.
- Community: 초기에는 핵심 가치 검증에 불필요하다.
- Template 판매: 상업 구조가 과도하게 복잡해진다.
- Team Workspace: 1인 개발 MVP 범위를 벗어난다.
- 공동 편집: 실시간 협업 복잡도가 높다.
- 공유 권한: 사용자 흐름과 권한 설계가 커진다.
- Plugin Store: 조기 확장은 유지보수 부담을 키운다.
- Make 실행 연동: 초기 핵심 실행 기반이 아니다.
- Flowise 실행 연동: 초기 지원 대상이 아니다.
- CrewAI 실행 연동: 복잡한 Agent 영역으로 확장된다.
- LangGraph 실행 연동: 초기 범위를 넘는다.
- Mastra 실행 연동: 초기 범위를 넘는다.
- 멀티에이전트: MVP 목표와 무관하다.
- 자체 Agent Runtime: 구축 비용과 복잡도가 너무 크다.
- 모바일 앱: 모바일 웹으로 우선 검증한다.
- 다국어: 한국어 우선 전략과 충돌하지 않는다.
- 고급 Admin UI: 내부 도구로 대체 가능하다.
- 고급 Billing: 초기에는 과하다.
- Enterprise SSO: 타겟이 아니다.
- RBAC: 초기 사용자 규모에 비해 과도하다.
- Audit Dashboard: 운영 복잡도만 높인다.
- 실시간 협업: 현재 제품 목적과 다르다.
- Workflow 자동 최적화: 추천 품질 검증이 먼저다.
- 사용자별 Recommendation 학습: 초기 데이터가 부족하다.
- Vector Database: 현재 필요성이 낮다.
- Tool 자동 크롤링: 가격과 정확성 유지가 어렵다.
- Tool 가격 자동 수집: 검증 부담이 크다.
- 자체 LLM Hosting: 운영 비용과 복잡도가 크다.
- 모든 사용자 API Key 통합 관리: 보안 부담이 크다.
- Managed Service 자동화: 제품 검증 후 고려한다.

## 9. Initial Workflow Template Scope

초기 Template는 10개로 확정한다.

### 콘텐츠 제작

1. 블로그 초안 생성
2. 유튜브 쇼츠 대본 생성
3. SNS 게시물 생성

### 업무 생산성

4. 회의 메모 요약
5. PDF 요약 및 정리
6. 반복 보고서 초안 생성

### 이메일

7. Gmail 문의 요약
8. 이메일 답변 초안 생성
9. 중요 이메일 Slack 알림

### 쇼핑몰 및 마케팅

10. 고객 리뷰 분석

| Template | Category | Target User | Primary Result | Required Tools | Execution Level | MVP Priority |
| --- | --- | --- | --- | --- | --- | --- |
| 블로그 초안 생성 | 콘텐츠 제작 | 콘텐츠 제작자 | 글 초안 생성 | LLM, Drive | Guide Only | High |
| 유튜브 쇼츠 대본 생성 | 콘텐츠 제작 | 콘텐츠 제작자 | 대본 초안 생성 | LLM | Template Available | High |
| SNS 게시물 생성 | 콘텐츠 제작 | 마케터 | 게시물 초안 생성 | LLM | Template Available | High |
| 회의 메모 요약 | 업무 생산성 | 직장인 | 메모 요약 | LLM | Test Supported | High |
| PDF 요약 및 정리 | 업무 생산성 | 비개발자 | PDF 요약 | LLM, Drive | Template Available | High |
| 반복 보고서 초안 생성 | 업무 생산성 | 직장인 | 보고서 초안 | Sheets, LLM | Template Available | High |
| Gmail 문의 요약 | 이메일 | 사업자 | 문의 요약 | Gmail, LLM | Test Supported | High |
| 이메일 답변 초안 생성 | 이메일 | 사업자 | 답변 초안 | Gmail, LLM | Template Available | High |
| 중요 이메일 Slack 알림 | 이메일 | 팀 없는 사업자 | 알림 전송 | Gmail, Slack | Test Supported | Medium |
| 고객 리뷰 분석 | 쇼핑몰 및 마케팅 | 쇼핑몰 운영자 | 리뷰 요약 | LLM, Sheets | Template Available | Medium |

실행 수준:

```text
Guide Only
Template Available
Test Supported
```

모든 Template를 Test Supported로 지정하지 않는다.

## 10. Initial Tool Scope

Tool은 Template 지원에 필요한 범위로만 선정한다.

### 필수 후보

- OpenAI
- Anthropic Claude
- Google Gemini
- n8n
- Supabase
- Vercel
- Gmail
- Google Sheets
- Google Drive
- Slack

### 조건부 후보

- YouTube
- Google Forms
- Webhook
- Notion
- Airtable
- WordPress
- Shopify 또는 국내 쇼핑몰 연동 후보

조건부 Tool은 실제 Template와 테스트 범위가 확정된 경우에만 DB에 포함한다. Tool 수를 목표 KPI로 사용하지 않는다.

## 11. Recommendation Engine MVP Boundary

### Engine이 해야 하는 것

- Goal을 Category로 분류
- 사용자 조건을 정규화
- 부적합 Template 제외
- Template 후보 점수 계산
- 비용 범위 계산
- 난이도 계산
- 예상 구축 시간 제공
- 최대 3개 후보 반환
- 설명 생성
- 제한사항 표시

### Engine이 하지 않는 것

- 인터넷을 실시간 검색해 Tool을 찾는 것
- 모든 AI Tool을 비교하는 것
- 사용자를 대신해 결제하는 것
- 지원하지 않는 실행을 가능하다고 말하는 것
- 실제 가격을 LLM이 추정하는 것
- 사용자 대신 외부 계정을 생성하는 것
- 자동으로 복잡한 n8n Workflow를 무제한 생성하는 것
- 사용자 인프라를 운영하는 것

### Recommendation Boundary Diagram

```mermaid
flowchart LR
  A[Goal] --> B[Normalize]
  B --> C[Rule Filter]
  C --> D[Template Candidates]
  D --> E[Cost and Difficulty]
  E --> F[LLM Explanation]
  F --> G[Max 3 Results]
```

## 12. Limited Execution Definition

MVP의 “간단 실행”을 명확히 정의한다.

### 포함 가능한 실행

- BuildFlow 서버에서 제한된 LLM Test
- 사용자가 제공한 텍스트 입력 처리
- Sample Data 기반 실행
- n8n Webhook Test
- Template Import Guide
- Integration 연결 상태 검증

### 제외되는 실행

- 장시간 Background Job
- 대량 데이터 처리
- 영상 제작 전체 자동화
- 소셜 플랫폼 자동 게시
- 사용자 Gmail 전체 읽기
- 민감정보 처리
- 결제 또는 주문 실행
- 무제한 API Proxy
- 사용자 n8n 인스턴스 운영

### 실행 지원 표시

각 Workflow는 반드시 다음 중 하나를 표시한다.

```text
Guide Only
Template Available
Test Supported
Not Supported
```

## 13. Authentication MVP Decision

MVP Authentication 범위를 다음으로 제한한다.

### 포함

- Email + Password
- Google OAuth
- Session 유지
- Logout
- Password Reset
- Auth Callback
- Protected Route

### 제외

- GitHub
- Kakao
- Apple
- Phone
- Magic Link
- Anonymous Account
- SSO

Google OAuth 설정은 사용자가 Supabase Dashboard에서 직접 해야 할 작업으로 분류한다.

## 14. Billing MVP Decision

Billing은 다음 두 옵션으로 구분한다.

### Option A - Billing 포함

조건:

- 공개 유료 출시
- Free/Pro 제한 검증 필요
- 결제 Provider 확정
- 환불 및 약관 준비

### Option B - Billing 제외

대체:

- Free Beta
- 초대 코드
- 수동 Pro 부여
- Usage 제한
- 대기자 명단
- 결제 관심 CTA

1인 개발 현실성을 고려해 **기본 권고는 Option B로 작성한다.**

Billing 제외를 기본값으로 확정한다. Billing 제외 시에도 Subscription 데이터 구조는 향후 확장 가능하게 설계할 수 있다.

## 15. Onboarding MVP Decision

긴 Onboarding은 MVP에서 제외한다.

대신 다음 방식 중 하나를 사용한다.

### 권장 방식

Project 생성 중 필요한 최소 조건을 수집한다.

### 선택 방식

최초 로그인 후 3개 이하 질문을 제공한다.

수집 가능 항목:

- AI 숙련도
- 개발 가능 여부
- 주요 목적

Skip 허용 여부는 적용하지 않는다.

## 16. Admin MVP Decision

전용 Admin UI는 MVP에서 제외한다.

초기 운영 방식:

- Supabase Dashboard
- SQL Seed
- Migration
- JSON 또는 TypeScript Seed
- 내부 Script
- 필요 시 제한된 보호 Route

Admin UI는 다음 조건에서 도입한다.

- Template 수정 빈도 증가
- Tool 가격 관리 부담 증가
- 비개발 운영 인력 참여
- 실행 이력 대응 증가

## 17. Data Seeding Scope

초기 Seed 데이터에 포함할 항목을 작성한다.

- Tool
- Workflow Template
- Workflow Step
- Tool Compatibility
- Cost Rule
- Difficulty Rule
- Execution Support
- Example Goal
- Category

초기 Seed는 재현 가능해야 하며 수동 Dashboard 입력만으로 관리하지 않는다.

## 18. MVP Page Scope

### 반드시 구현

```text
/
/login
/signup
/auth/callback
/app
/app/projects
/app/projects/new
/app/projects/[projectId]
/app/projects/[projectId]/recommendations
/app/projects/[projectId]/workflow
/app/settings
/privacy
/terms
```

### 조건부 구현

```text
/pricing
/examples
/tools
/tools/[slug]
/app/integrations
/app/billing
/app/projects/[projectId]/workflow/test
```

### 제외

```text
/admin 전체 UI
/community
/marketplace
/team
/plugins
/mobile-app
```

Route 수를 불필요하게 늘리지 않는다. Recommendation 상세와 Workflow 상세는 구현 단계에서 Project 상세 내부 Section으로 통합할 수 있다.

## 19. MVP Database Object Scope

DB 상세 설계는 이후 문서에서 진행하지만 MVP 객체 범위를 정한다.

### 반드시 필요

- profiles
- projects
- goals 또는 project_goal 필드
- workflow_templates
- workflow_template_steps
- tools
- recommendations
- recommendation_candidates
- project_workflows
- project_workflow_steps
- usage_records

### 조건부

- integrations
- executions
- subscriptions
- cost_rules
- tool_compatibilities

### 제외

- teams
- organizations
- permissions
- marketplace_items
- reviews
- comments
- plugin_registry
- agent_memory
- vector_embeddings
- notifications table

테이블명은 이후 DB 설계에서 변경 가능하다.

## 20. MVP API Scope

API 상세 Endpoint는 이후 설계한다.

### 반드시 필요한 기능 단위

- 인증 사용자 확인
- Project 생성·조회·수정
- Recommendation 요청
- Recommendation 상태 조회
- Workflow 선택과 저장
- Usage 조회
- Seed 데이터 조회

### 조건부

- Test Run
- Integration 연결
- Billing Checkout
- Webhook Callback

### 제외

- Public Developer API
- Plugin API
- Marketplace API
- Team API
- Agent API
- 실시간 Collaboration API

## 21. Non-Functional MVP Requirements

### Performance

- 일반 화면은 사용자 체감상 빠르게 표시
- Recommendation은 진행 상태 제공
- 중복 Recommendation 방지
- 긴 요청 Timeout 처리

정확한 시간 목표는 구현 및 테스트 후 확정한다.

### Security

- Supabase RLS
- 사용자별 데이터 분리
- Server-only API Key
- 입력 Validation
- Rate Limit
- 안전한 Redirect
- Secret 로그 출력 금지

### Reliability

- 구조화된 LLM Schema 검증
- Recommendation 실패 상태 저장
- 재시도
- 입력 보존
- 오류 식별자
- Provider 오류와 내부 오류 구분

### Maintainability

- TypeScript strict
- Feature 중심 구조
- Migration 관리
- Seed 재현 가능
- 환경변수 검증
- Provider Adapter는 필요한 범위에서만 사용
- 조기 Microservice 금지

## 22. Definition of Done

각 기능은 다음을 충족해야 완료로 본다.

- 요구사항 충족
- 정상 Flow 작동
- Empty, Loading, Error 상태 존재
- Mobile Web 사용 가능
- 권한 검사
- 사용자 데이터 격리
- 입력 검증
- TypeScript 오류 없음
- Lint 통과
- Production Build 통과
- 수동 Acceptance Test 완료
- 주요 변경 문서화

테스트가 필요한 영역에는 최소한의 자동 테스트를 추가한다.

## 23. MVP Release Criteria

다음 조건을 모두 충족해야 공개 MVP 출시 가능으로 판단한다.

### Product

- 목표 입력 가능
- Project 저장 가능
- 최소 10개 Workflow Template
- Recommendation 생성 가능
- 최대 3개 후보 표시
- Workflow 상세 확인
- 비용, 난이도, 구축 시간 표시
- 저장 후 재방문 가능
- 최소 하나의 n8n 가이드 작동

### Authentication

- Email 회원가입과 로그인
- Google OAuth
- Session 유지
- Password Reset
- 보호 Route

### Security

- RLS
- 사용자 데이터 격리
- Secret 비노출
- 환경변수 검증
- Rate Limit

### Quality

- 주요 Flow Mobile 대응
- Loading과 Error 처리
- lint 통과
- typecheck 통과
- build 통과
- Production 배포 확인

### Legal

- 개인정보처리방침
- 이용약관
- 외부 API 비용 안내
- AI 결과 정확성 제한 안내
- 사용자 데이터 처리 안내

### Operations

- Seed 방법 존재
- 오류 로그 확인 가능
- Recommendation 실패 추적 가능
- Usage 확인 가능
- 최소한의 운영 문서 존재

## 24. MVP Validation Plan

출시 후 검증할 항목을 작성한다.

### 사용자 인터뷰

확인할 질문:

- 입력 방식이 쉬웠는가?
- 추천 결과를 신뢰했는가?
- 비용과 난이도가 유용했는가?
- Workflow 단계가 이해됐는가?
- 실제로 구현하고 싶다는 생각이 들었는가?
- 어느 단계에서 이탈했는가?
- 돈을 낼 가치가 있는 부분은 무엇인가?

### 행동 데이터

- Landing → Goal 시작
- Goal 시작 → 제출
- 제출 → Recommendation 성공
- 결과 → Workflow 상세
- 상세 → 저장
- 저장 → 재방문
- 상세 → Test 또는 n8n 가이드
- Paywall 관심

### 정성 데이터

- 자주 입력되는 Goal
- 이해되지 않는 용어
- 부족한 Template
- 과도하게 어려운 Setup
- 사용자 기대와 실행 지원 범위의 차이

## 25. Feature Inclusion Framework

새 기능을 MVP에 넣기 전에 다음 질문에 모두 답한다.

1. 핵심 사용자 문제 해결에 직접 필요한가?
2. 추천·설계·간단 실행 중 하나를 강화하는가?
3. 없으면 사용자 검증이 불가능한가?
4. 1인 개발자가 운영할 수 있는가?
5. 기존 단순 기능으로 대체할 수 없는가?
6. 보안과 외부 Provider 의존성을 감당할 수 있는가?
7. 출시를 지연시킬 만큼 가치가 큰가?

다음 중 하나라도 명확하지 않으면 P1 또는 P2로 이동한다.

## 26. Scope Change Policy

개발 중 범위 변경 원칙을 작성한다.

- P0 추가는 기존 P0 제거 또는 일정 재산정 없이 허용하지 않는다.
- UI 개선을 새로운 기능 추가로 확대하지 않는다.
- Provider 추가는 실제 Workflow 필요성이 있을 때만 한다.
- Tool 수를 늘리는 작업보다 Template 품질을 우선한다.
- 직접 Test Run은 P1 이후로 미룬다.
- 미래 확장성을 이유로 복잡한 추상화를 만들지 않는다.
- PRD와 IA에 있어도 MVP 문서에서 제외되면 구현하지 않는다.
- Scope 변경은 문서에 기록한다.

## 27. Recommended Build Sequence

실제 개발 순서를 다음으로 작성한다.

### Phase 1 - Foundation

- Next.js 생성
- Git 정리
- 환경변수
- Supabase 연결
- 기본 Layout
- Development Rule 적용

### Phase 2 - Authentication

- Email Auth
- Google OAuth
- Profile
- Protected Route

### Phase 3 - Core Data

- Project
- Tool Seed
- Workflow Template Seed
- RLS
- Type 생성

### Phase 4 - Recommendation

- Goal Form
- Rule Engine
- Candidate Retrieval
- Cost와 Difficulty
- LLM Explanation
- Result 저장

### Phase 5 - Workflow Experience

- Candidate Result
- Workflow Detail
- Save and Resume
- Dashboard

### Phase 6 - Limited Execution

- n8n Template Handoff
- Usage 기록

### Phase 7 - Release

- Error 상태
- Mobile 대응
- Analytics
- Legal
- Vercel 배포
- Acceptance Test

각 Phase는 Production Build 가능한 상태로 종료한다.

## 28. Development Task Size Rule

Codex 작업은 다음 크기로 나눈다.

### 좋은 Task

- 하나의 기능 목적
- 예상 수정 파일이 제한적
- 독립 검증 가능
- 빌드 가능
- 완료 기준 명확

### 나쁜 Task

- 인증, DB, UI, Recommendation을 한 번에 구현
- 전체 앱 완성
- 모든 Page 생성
- 모든 Supabase 테이블 생성
- 모든 Template 등록
- 모든 오류 수정

한 Task는 가능하면 다음 범위를 넘지 않도록 한다.

- 하나의 주요 기능
- 하나의 Migration 집합
- 하나의 사용자 Flow
- 하나의 검증 목표

정확한 파일 수나 시간 제한은 강제하지 않는다.

## 29. MVP Risks

최소 다음 위험과 대응을 작성한다.

- 위험: MVP가 여전히 너무 큰 문제
  - 발생 가능성: 높음
  - 영향: 출시 지연
  - 대응: P0만 우선하고 P1/P2를 엄격히 분리한다.

- 위험: Recommendation 품질이 낮은 문제
  - 발생 가능성: 중간
  - 영향: 신뢰 저하
  - 대응: Template 품질과 Rule Engine을 우선한다.

- 위험: Template 수에 집착하는 문제
  - 발생 가능성: 중간
  - 영향: 범위 확장
  - 대응: 10~15개 고품질 Template만 유지한다.

- 위험: LLM 비용 증가
  - 발생 가능성: 중간
  - 영향: 수익성 악화
  - 대응: 요청 제한, 캐시, 짧은 응답 구조를 적용한다.

- 위험: n8n 연동 난이도
  - 발생 가능성: 높음
  - 영향: 실행 단계 지연
  - 대응: Test Trigger와 Template Handoff만 먼저 지원한다.

- 위험: 외부 API 설정에서 이탈
  - 발생 가능성: 높음
  - 영향: 활성화 실패
  - 대응: Setup 안내를 단계별로 단순화한다.

- 위험: 실행 범위를 과대 기대하는 문제
  - 발생 가능성: 높음
  - 영향: 실망과 이탈
  - 대응: 지원 수준을 명확히 표기한다.

- 위험: Billing 개발로 출시 지연
  - 발생 가능성: 중간
  - 영향: 공개 지연
  - 대응: 기본 권고는 Billing 제외로 둔다.

- 위험: Google OAuth 설정 문제
  - 발생 가능성: 중간
  - 영향: 인증 장애
  - 대응: 설정 가이드를 문서화한다.

- 위험: Tool 가격 정보 노후화
  - 발생 가능성: 높음
  - 영향: 비용 신뢰도 하락
  - 대응: Last Verified를 표시하고 수동 갱신한다.

- 위험: 1인 운영 부담
  - 발생 가능성: 높음
  - 영향: 유지보수 실패
  - 대응: 운영 UI를 늦추고 Seed 기반 관리로 시작한다.

- 위험: 긴 문서와 실제 코드 불일치
  - 발생 가능성: 중간
  - 영향: 구현 혼선
  - 대응: 문서 우선순위를 유지하고 변경을 기록한다.

- 위험: P1 기능이 P0처럼 구현되는 문제
  - 발생 가능성: 높음
  - 영향: 범위 폭주
  - 대응: P0/P1/P2 기준을 엄격히 적용한다.

- 위험: UI 완성도에 시간을 과도하게 쓰는 문제
  - 발생 가능성: 높음
  - 영향: 출시 지연
  - 대응: 기능 완성과 검증을 우선한다.

## 30. Open Decisions

다음 항목은 확정되었다.

- MVP 공개 방식: 초대형 비공개 Beta
- Visitor Preview 포함 여부: 초기 Beta 제외
- Onboarding 방식: 새 프로젝트 입력에 통합
- 초기 Workflow Template 최종 목록: 10개 확정
- 초기 Tool 최종 목록: Template 지원 범위로 제한
- Recommendation 후보 기본 개수: 최대 3개
- Rule Engine 초기 점수 방식: 단순 명시적 규칙
- LLM Provider 우선순위: OpenAI 우선
- Recommendation 평균 응답 목표: 개발 Task에서 세부 확정
- 첫 Test Run 기능: n8n Template Handoff + Setup Guide
- n8n Cloud 지원 여부: P1 이후 검토
- n8n Self-hosted 지원 여부: P1 이후 검토
- Billing 포함 여부: 초기 Beta 제외
- 결제 Provider: 후속 Task에서 확정
- Free Usage 제한: 후속 Task에서 확정
- Pro Usage 제한: 후속 Task에서 확정
- Analytics Provider: 후속 Task에서 확정
- Error Monitoring 도구: 후속 Task에서 확정
- Feedback 수집 방식: 후속 Task에서 확정
- Beta 사용자 모집 방식: 관리자가 제한 초대
- MVP 출시 목표 날짜: 후속 Sprint에서 확정

확정된 항목은 이후 Task에서 다시 뒤집지 않는다.

## 문서 충돌 방지 원칙

- `docs/01-prd.md`의 전체 비전을 변경하지 않는다.
- `docs/02-information-architecture.md`의 전체 Route를 모두 MVP로 구현하지 않는다.
- `docs/03-user-flow.md`의 P1·P2 Flow를 출시 필수로 취급하지 않는다.
- 충돌이 발생하면 첫 출시 범위는 `docs/04-mvp.md`를 우선 기준으로 사용한다.
- 단, 제품 정의와 보안 원칙은 PRD를 따른다.
- 향후 DB 및 API 문서는 MVP 범위를 넘지 않도록 작성한다.

## 작성 원칙

- 한국어로 작성한다.
- 실제 출시 판단에 사용할 수 있도록 구체적으로 작성한다.
- 기존 문서 내용을 그대로 반복하지 않는다.
- 범위를 줄이는 결정을 명확하게 한다.
- 모든 기능을 중요하다고 표현하지 않는다.
- P0, P1, P2를 엄격하게 구분한다.
- 1인 개발과 운영 현실성을 최우선으로 한다.
- 미래 확장성을 이유로 현재 복잡도를 높이지 않는다.
- Tool 수보다 Workflow Template 품질을 우선한다.
- 결제보다 핵심 가치 검증을 우선한다.
- 확정되지 않은 항목은 `TBD`로 유지한다.
- 상세 DB Column과 API Endpoint는 정의하지 않는다.
- UI 색상과 상세 디자인은 정의하지 않는다.

## 제외 범위

이번 작업에서는 다음을 하지 않는다.

- Next.js 생성
- 코드 작성
- UI 구현
- Supabase 작업
- DB Schema 작성
- API Endpoint 설계
- 결제 구현
- Workflow Template 실제 데이터 작성
- n8n JSON 작성
- 외부 서비스 조사
- 기존 문서 수정
- Git commit
- Git push
