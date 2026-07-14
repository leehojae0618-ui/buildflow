# BuildFlow

## Information Architecture

- Version: 1.0
- Status: Draft
- Brand Name: BuildFlow
- Internal Codename: Project Flow
- Document Owner: Founder
- Last Updated: 2026-07-14
- Related Documents:
  - `docs/00-brand.md`
  - `docs/01-prd.md`
  - `docs/03-user-flow.md`
  - `docs/04-mvp.md`

## 1. Document Purpose

이 문서는 BuildFlow의 사용자 경험 구조, Next.js Route 설계, 화면별 데이터 요구사항, 향후 DB 및 API 설계의 선행 기준을 정의한다. 사용자가 어떤 구조를 보게 되는지, 어떤 페이지가 필요한지, 각 페이지가 어떤 정보를 담아야 하는지를 명확히 한다. 또한 MVP와 미래 구조의 경계를 정의해 과도한 확장을 방지한다. 이 문서는 구현 문서가 아니라 정보 구조 기준 문서다.

## 2. Architecture Principles

### 1. Result First

사용자는 도구를 먼저 보지 않고 원하는 결과를 먼저 본다. 화면은 항상 목표와 결과 중심으로 시작한다.

### 2. Goal Before Tool

도구 탐색보다 목표 입력이 먼저다. Tool은 목표를 이루기 위한 수단으로만 보여준다.

### 3. Progressive Disclosure

처음부터 모든 정보를 보여주지 않는다. 먼저 핵심 결과를 보여주고, 필요할 때 상세 정보와 실행 준비를 펼쳐 보여준다.

### 4. One Primary Action per Screen

각 화면은 하나의 주요 행동을 가진다. 사용자가 다음에 무엇을 해야 하는지 즉시 이해할 수 있어야 한다.

### 5. Project-Centered Structure

모든 핵심 흐름은 Project를 중심으로 묶인다. 사용자의 목표, 추천, 선택된 Workflow, 실행 이력은 Project 하위에서 관리된다.

### 6. Workflow as the Core Asset

BuildFlow의 핵심 자산은 Tool 목록이 아니라 Workflow다. 정보 구조는 Workflow를 저장, 비교, 수정, 실행할 수 있게 설계한다.

### 7. Beginner-Friendly Language

용어는 가능한 한 쉬운 표현을 사용한다. 기술 용어는 설명과 함께 노출한다.

### 8. Transparent Cost and Difficulty

비용, 난이도, 준비사항, 제한을 숨기지 않는다. 사용자가 실행 가능성을 판단할 수 있게 해야 한다.

### 9. Save Before Execute

실행보다 저장이 먼저다. 사용자가 선택한 Workflow를 먼저 Project에 저장하고 그 다음 실행 단계로 넘어간다.

### 10. MVP Simplicity

초기 구조는 단순해야 한다. 시각적 노드 Builder를 사용하지 않고, 단계형 목록 구조로 시작한다.

다음 결정도 적용한다.

- 초기에는 시각적 노드 Builder를 사용하지 않는다.
- Workflow는 단계형 목록으로 표시한다.
- Tool 탐색보다 목표 입력을 우선한다.
- 사용자의 작업은 Project 단위로 저장한다.
- Recommendation은 결과물이 아니라 Workflow 선택을 돕는 중간 단계다.
- 사용자가 선택한 Workflow가 Project의 핵심 설계 결과가 된다.

## 3. Core Domain Objects

| Object | 한국어 UI | 정의 | 사용자 생성 여부 | MVP |
| --- | --- | --- | --- | --- |
| User | 사용자 | BuildFlow 계정 소유자 | 아니오 | 포함 |
| Profile | 프로필 | 사용자 기본 설정과 숙련도 | 사용자 입력 | 포함 |
| Project | 프로젝트 | 하나의 목표와 관련 결과를 묶는 최상위 단위 | 예 | 포함 |
| Goal | 목표 | 사용자가 만들고 싶은 결과 | 예 | 포함 |
| Recommendation | 추천 결과 | 조건에 맞는 Workflow 후보 집합 | 시스템 생성 | 포함 |
| Workflow | 워크플로 | 결과를 만들기 위한 단계 구조 | 시스템 생성 후 사용자 선택 | 포함 |
| Workflow Template | 워크플로 템플릿 | 재사용 가능한 기본 설계 | 관리자 생성 | 포함 |
| Workflow Step | 워크플로 단계 | 개별 작업과 Tool 연결 | 시스템 생성 | 포함 |
| Tool | 도구 | AI 및 외부 서비스 정보 | 관리자 생성 | 포함 |
| Integration | 연동 | 사용자 계정 또는 API 연결 | 사용자 연결 | 제한 포함 |
| Execution | 실행 | 일부 Workflow의 테스트 또는 실제 작업 | 사용자 요청 | 제한 포함 |
| Cost Estimate | 예상 비용 | Workflow 전체 예상 비용 | 시스템 계산 | 포함 |
| Usage Record | 사용량 기록 | 추천·생성·실행 소비 기록 | 시스템 기록 | 포함 |
| Subscription | 구독 | 사용자의 플랜과 제한 | 시스템 관리 | 포함 |

관계 설명:

- User는 여러 Project를 가진다.
- Profile은 User에 종속된다.
- Project는 하나의 현재 Goal을 가진다.
- Recommendation은 Goal과 조건에 대한 시스템 응답이다.
- Workflow는 Recommendation에서 선택되거나 Template에서 파생된다.
- Workflow Step은 Workflow의 구성 단위다.
- Tool은 Step이 사용할 수 있는 외부 서비스다.
- Integration은 사용자의 외부 계정 연결 상태를 나타낸다.
- Execution은 Workflow와 연결된 테스트 또는 실제 작업 기록이다.
- Cost Estimate는 Workflow와 Step, Tool 조합의 계산 결과다.
- Usage Record는 사용 행위를 집계한다.
- Subscription은 사용 가능 범위와 제한을 결정한다.

## 4. Domain Relationship Model

```text
User
└── Profile
└── Subscription
└── Projects
    └── Goal
    └── Recommendations
        └── Workflow Candidates
    └── Selected Workflow
        └── Workflow Steps
            └── Tool
        └── Cost Estimate
        └── Required Integrations
        └── Executions
    └── Usage Records
```

관계 원칙:

- 한 User는 여러 Project를 가질 수 있다.
- 한 Project는 하나의 현재 Goal을 가진다.
- Goal 수정 시 새로운 Recommendation Version을 생성할 수 있다.
- 한 Recommendation은 여러 Workflow 후보를 포함할 수 있다.
- 사용자는 하나의 후보를 선택해 Project의 Selected Workflow로 저장한다.
- Workflow는 여러 Step을 가진다.
- 각 Step은 하나 이상의 Tool을 참조할 수 있다.
- Template과 사용자 Project Workflow는 분리한다.
- 실행 이력은 Workflow Version에 연결한다.
- 삭제 정책은 이후 DB 문서에서 구체화한다.

## 5. User States

### Visitor

- 로그인하지 않은 사용자
- Landing 접근
- 목표 입력 가능
- 제한된 Preview 확인
- 저장, 전체 설계, 실행은 불가

### Registered User

- 로그인 완료
- Onboarding 미완료 가능
- 제한된 무료 Recommendation 사용 가능
- Project 저장 가능

### Onboarded User

- 숙련도, 예산, 사용 도구 등 기본 설정 완료
- 개인화 Recommendation 제공

### Pro User

- 유료 기능 접근
- 상세 설계, 수정, 연동, 높은 Usage 제공

### Admin

- Tool DB 관리
- Workflow Template 관리
- 가격 정보 관리
- 실행 지원 상태 관리
- 일반 사용자 UI와 분리

MVP에서는 Admin UI를 완전하게 구현하지 않을 수 있다.

## 6. Global Navigation

### 비로그인 상태

```text
Logo
제품 소개
활용 사례
도구 탐색
요금제
로그인
무료로 시작
```

초기 MVP Landing에서는 Navigation 항목을 최소화할 수 있다.

### 로그인 상태

```text
Dashboard
새 프로젝트
내 프로젝트
워크플로 탐색
도구
사용량
설정
```

### 모바일 상태

- Bottom Navigation을 무조건 사용하지 않는다.
- 초기에는 간단한 Header Menu 또는 Drawer를 사용한다.
- 핵심 행동인 `새 프로젝트`를 명확히 노출한다.

### Navigation 우선순위

1. 새 프로젝트
2. 내 프로젝트
3. 현재 Project
4. 사용량
5. 설정
6. Tool 탐색

Tool 탐색이 핵심 진입점이 아님을 명시한다.

## 7. Sitemap - Public

```text
/
├── /login
├── /signup
├── /pricing
├── /examples
├── /examples/[slug]
├── /tools
├── /tools/[slug]
├── /privacy
├── /terms
└── /auth/callback
```

| Route | Page | Purpose | Main Content | Primary CTA | Auth |
| --- | --- | --- | --- | --- | --- |
| / | Landing | 제품 소개와 목표 입력 유도 | Hero, 목표 입력, 예시, 비용/난이도 preview | 무료로 시작 | 불필요 |
| /login | Login | 로그인 | 로그인 폼, 안내 | 로그인 | 불필요 |
| /signup | Signup | 회원가입 | 가입 폼, 약관 동의 | 가입하기 | 불필요 |
| /pricing | Pricing | 요금제 확인 | 플랜 비교, 제한 안내 | 시작하기 | 불필요 |
| /examples | Examples | 활용 사례 탐색 | 사례 목록, 카테고리 | 사례 보기 | 불필요 |
| /examples/[slug] | Example Detail | 사례 상세 보기 | 결과, Workflow 요약, 비용 힌트 | 이 사례로 시작 | 불필요 |
| /tools | Tools | 보조 도구 탐색 | Tool 목록, 필터 | 도구 보기 | 불필요 |
| /tools/[slug] | Tool Detail | Tool 정보 확인 | 설명, 가격, 적합 결과, 대체 Tool | 관련 Workflow 보기 | 불필요 |
| /privacy | Privacy | 개인정보 처리방침 | 정책 문서 | 없음 | 불필요 |
| /terms | Terms | 이용약관 | 약관 문서 | 없음 | 불필요 |
| /auth/callback | Auth Callback | 인증 완료 처리 | 상태 처리, 리디렉션 | 없음 | 필요 |

`/tools`는 Tool Directory가 제품의 핵심처럼 보이지 않도록 보조 진입점으로 정의한다.

## 8. Sitemap - Authenticated App

```text
/app
├── /app
├── /app/onboarding
├── /app/projects
├── /app/projects/new
├── /app/projects/[projectId]
├── /app/projects/[projectId]/goal
├── /app/projects/[projectId]/recommendations
├── /app/projects/[projectId]/recommendations/[recommendationId]
├── /app/projects/[projectId]/workflow
├── /app/projects/[projectId]/workflow/setup
├── /app/projects/[projectId]/workflow/test
├── /app/integrations
├── /app/usage
├── /app/billing
└── /app/settings
```

| Route | 화면명 | 목적 | 핵심 데이터 | 주요 행동 | 접근 조건 |
| --- | --- | --- | --- | --- | --- |
| /app | Dashboard | 전체 상태 요약 | Project 목록, 최근 Workflow, Usage | 새 프로젝트 생성 | 로그인 |
| /app/onboarding | Onboarding | Post-Beta | 기본 설정 수집 | 숙련도, 예산, 사용 도구 | 완료 | 로그인 |
| /app/projects | Project List | Project 관리 | Project 상태, 최근 변경 | 열기, 생성 | 로그인 |
| /app/projects/new | New Project | 새 Project 생성 | Goal, 조건 | 생성, 다음 단계로 이동 | 로그인 |
| /app/projects/[projectId] | Project Detail | 현재 상태와 다음 행동 확인 | Goal, Recommendation 상태, Workflow 상태 | 추천 보기, Workflow 보기 | 로그인 |
| /app/projects/[projectId]/goal | Goal Input | 목표 수정 | 목표 문장, 설명, 조건 요약 | 저장, 재추천 | 로그인 |
| /app/projects/[projectId]/recommendations | Recommendation Results | 후보 비교 | 후보 목록, 비용, 난이도, 시간 | 후보 선택, 수정 요청 | 로그인 |
| /app/projects/[projectId]/recommendations/[recommendationId] | Recommendation Detail | 특정 추천 상세 | 선택 이유, 후보 비교, 제한사항 | Workflow 선택 | 로그인 |
| /app/projects/[projectId]/workflow | Workflow Overview | 선택된 Workflow 확인 | 단계, 도구, 비용, 상태 | Setup 보기 | 로그인 |
| /app/projects/[projectId]/workflow/setup | Required Setup | 실행 준비 확인 | 계정, API, 보안 안내 | Integration 연결 | 로그인 |
| /app/projects/[projectId]/workflow/test | Test Run | 제한된 실행 수행 | 입력값, 실행 상태, 결과 | 실행, 재시도 | 로그인 |
| /app/integrations | Integrations | 연동 관리 | 연결 상태, 권한, 오류 | 연결, 재연결 | 로그인 |
| /app/usage | Usage | 사용량 확인 | 추천, 실행, 제한 | 플랜 확인 | 로그인 |
| /app/billing | Billing | 구독 관리 | 플랜, 결제 상태 | 업그레이드 | 로그인 |
| /app/settings | Settings | 계정 설정 | 프로필, 보안, 알림 | 저장 | 로그인 |

다음 원칙을 반영한다.

- `/app`은 Dashboard다.
- `/app/projects/new`에서 Goal과 조건을 입력한다.
- Recommendation과 선택된 Workflow는 분리된 개념이다.
- Workflow 설정과 테스트 실행 화면을 분리한다.
- Project 상세 화면에서 현재 상태와 다음 행동을 확인할 수 있어야 한다.
- 지나치게 많은 Tab을 사용하지 않는다.
- Route 구조는 구현 과정에서 단순화될 수 있으나 정보 구조는 유지한다.

## 9. Admin Information Architecture

```text
/admin
├── /admin/tools
├── /admin/tools/[toolId]
├── /admin/workflow-templates
├── /admin/workflow-templates/[templateId]
├── /admin/pricing-data
├── /admin/executions
└── /admin/users
```

MVP 결정:

- 전용 Admin UI는 필수 출시 범위가 아니다.
- 초기 데이터 관리는 Supabase Dashboard, SQL Seed, 내부 Script로 가능하다.
- 관리 UI를 먼저 만드는 것은 금지한다.
- 운영 부담이 커질 때 필요한 화면부터 추가한다.

## 10. Page Hierarchy

### Level 1 - Entry

- Landing
- Login
- Signup
- Dashboard

### Level 2 - Core Task

- New Project
- Goal Input
- Condition Input
- Recommendation Results
- Workflow Detail

### Level 3 - Setup and Action

- Required Setup
- Integration Connection
- Test Run
- Save and Manage

### Level 4 - Supporting

- Tool Detail
- Usage
- Billing
- Settings
- Help and Error States

사용자가 Level 2까지 최소 단계로 도달하도록 설계한다.

## 11. Landing Page Information Structure

Landing Page는 다음 순서로 구성한다.

1. Header
2. Hero
3. Primary Goal Input
4. Example Goals
5. How It Works
6. Example Workflow Result
7. Cost and Difficulty Preview
8. Target Use Cases
9. Trust and Limitation Notice
10. Pricing Preview
11. Final CTA
12. Footer

Hero의 핵심 문구:

```text
무엇을 만들고 싶나요?
```

보조 문구:

```text
원하는 결과를 입력하면 필요한 AI 도구, 워크플로, 비용, 난이도와 실행 방법을 설계합니다.
```

Landing에서 Tool Logo를 과도하게 전면 노출하지 않는다.

## 12. Dashboard Information Structure

Dashboard는 다음 정보를 우선순위로 표시한다.

1. 새 프로젝트 생성 CTA
2. 진행 중인 프로젝트
3. 최근 생성한 Workflow
4. 연결이 필요한 Integration
5. 최근 실행 상태
6. 현재 사용량
7. 추천 활용 사례

### Empty Dashboard

- “무엇을 만들고 싶나요?” 입력
- 대표 목표 예시
- 짧은 사용 방법
- Tool 목록보다 Project 생성을 유도

## 13. New Project Information Structure

새 Project 생성은 한 화면의 과도한 Form이 아니라 단계형 입력으로 설계한다.

### Step 1 - Goal

필수:

- 만들고 싶은 결과
- 간단한 설명

### Step 2 - Context

선택 또는 필수 여부를 표시한다.

- 사용 목적
- 현재 사용하는 Tool
- AI 숙련도
- 개발 가능 여부
- 예산
- 월간 예상 실행량
- 원하는 자동화 수준
- 결과물 형태
- 개인정보 포함 여부

### Step 3 - Review

- 입력 요약
- Recommendation 생성 전 확인
- 예상 처리 안내
- 입력 수정

초기 MVP에서는 Step 수를 2단계로 합칠 수 있다.

## 14. Recommendation Results Structure

추천 결과 화면은 다음 순서로 표시한다.

1. 사용자 목표 요약
2. 적용한 조건
3. 추천 Workflow 후보
4. Primary Recommendation
5. Alternative Recommendations
6. 후보별 예상 비용
7. 후보별 난이도
8. 예상 구축 시간
9. 필요한 Tool
10. 추천 이유
11. 주요 제한사항
12. 후보 선택
13. 목표 또는 조건 수정

추천 후보는 최대 3개로 확정한다. Primary 1개와 Alternative 최대 2개를 표시한다.

## 15. Workflow Detail Structure

Workflow 상세 화면은 다음 순서로 구성한다.

1. Workflow 제목
2. 달성 가능한 결과
3. 전체 개요
4. 단계형 Workflow
5. 각 단계의 입력과 출력
6. 사용 Tool
7. 대체 Tool
8. 예상 비용
9. 난이도
10. 예상 구축 시간
11. 필요한 계정과 API
12. 개인정보 및 보안 주의사항
13. 지원되는 실행 수준
14. 준비 시작
15. Workflow 저장
16. Recommendation 수정 요청

노드 기반 편집 UI는 사용하지 않는다.

## 16. Workflow Step Information Model

| Field | 필수 여부 | 설명 |
| --- | --- | --- |
| Step Number | 필수 | 실행 순서 |
| Step Title | 필수 | 사용자 친화적 단계명 |
| Purpose | 필수 | 단계가 필요한 이유 |
| Input | 필수 | 필요한 입력 |
| Action | 필수 | 수행할 작업 |
| Output | 필수 | 생성되는 결과 |
| Primary Tool | 필수 | 기본 Tool |
| Alternative Tools | 선택 | 대체 가능한 Tool |
| Setup Required | 필수 | 계정, API, OAuth 등 |
| Estimated Cost | 필수 | 해당 단계 예상 비용 |
| Difficulty | 필수 | 해당 단계 난이도 |
| Execution Support | 필수 | Guide, Template, Test, Managed |
| Warning | 선택 | 제한 또는 보안 주의 |

## 17. Tool Information Structure

Tool 상세 화면에 다음 정보를 표시한다.

- 이름
- Provider
- Category
- 한 줄 설명
- 어떤 결과에 적합한지
- 주요 기능
- 가격 모델
- 무료 플랜 여부
- API 제공 여부
- OAuth 여부
- 난이도
- 개인정보 처리 주의
- BuildFlow 실행 지원 수준
- 포함된 Workflow Template
- 대체 Tool
- 마지막 정보 확인일

Tool의 인기순위나 과장된 점수를 핵심으로 사용하지 않는다. 가격 데이터가 오래됐을 수 있음을 표시할 수 있어야 한다.

## 18. Integration Information Structure

Integration 화면에서 다음 상태를 구분한다.

```text
Not Connected
Connection Required
Connected
Connection Error
Expired
Action Required
```

각 Integration에 표시할 정보:

- Provider
- 연결 방식
- 연결 상태
- 권한 범위
- 마지막 확인 시각
- 사용하는 Project
- 연결 해제
- 재연결
- 보안 안내

API Key 값을 연결 후 다시 노출하지 않는다는 원칙을 기록한다.

## 19. Execution Information Structure

테스트 실행 화면에 다음을 포함한다.

- 실행 대상 Workflow
- 실행 가능한 Step
- 필요한 Integration 상태
- 예상 API 비용
- 테스트 입력
- 실행 버튼
- 진행 상태
- 실행 결과
- 오류 정보
- 재시도
- 실행 이력

실행 상태:

```text
Pending
Validating
Running
Succeeded
Failed
Cancelled
```

모든 Workflow가 실행 가능한 것처럼 표현하지 않는다.

## 20. Project Status Model

Project 상태를 다음으로 정의한다.

```text
Draft
Goal Completed
Recommendation Ready
Workflow Selected
Setup Required
Ready to Test
Active
Paused
Archived
```

각 상태의 의미와 다음 가능한 행동을 표로 작성한다. 삭제와 Archive를 구분한다. MVP에서는 복잡한 자동 상태 전환을 피하고 최소한으로 구현할 수 있다.

## 21. Access Control Matrix

| Resource / Action | Visitor | Free User | Pro User | Admin |
| --- | ---: | ---: | ---: | ---: |
| Landing 접근 | 가능 | 가능 | 가능 | 가능 |
| 제한 Preview | 가능 | 가능 | 가능 | 가능 |
| 전체 Recommendation | 불가 | 제한 | 가능 | 가능 |
| Project 저장 | 불가 | 가능 | 가능 | 가능 |
| Workflow 수정 요청 | 불가 | 제한 | 가능 | 가능 |
| Integration 연결 | 불가 | 제한 또는 불가 | 가능 | 가능 |
| 테스트 실행 | 불가 | 제한 | 가능 | 가능 |
| Tool 관리 | 불가 | 불가 | 불가 | 가능 |
| Template 관리 | 불가 | 불가 | 불가 | 가능 |

정확한 Free/Pro 제한 수치는 `TBD`로 둔다.

## 22. Search and Discovery

검색 대상:

- Project
- Workflow Template
- Tool

초기 검색 우선순위:

1. 목표 또는 활용 사례 검색
2. Workflow 검색
3. Tool 검색

검색 결과도 Tool보다 Workflow와 활용 사례를 먼저 보여준다. 초기 MVP에서는 고급 검색 엔진을 사용하지 않고 PostgreSQL 기반 검색 또는 단순 필터로 시작할 수 있다.

## 23. Empty, Loading, Error States

각 핵심 화면에 다음 상태가 필요하다.

- Empty
- Initial Loading
- AI Generation In Progress
- Partial Result
- Validation Error
- Permission Error
- Integration Error
- Execution Error
- Rate Limit
- Subscription Limit
- Not Found
- Deleted Resource
- Network Error

각 상태는 다음 행동을 제공해야 한다.

- 문제 원인
- 사용자가 할 수 있는 행동
- 다시 시도
- 이전 단계로 이동
- 입력 보존 여부

“알 수 없는 오류”만 표시하는 것을 금지한다.

## 24. Notification Structure

MVP 알림 유형:

- Recommendation 완료
- Integration 연결 필요
- Integration 오류
- 테스트 실행 완료
- 테스트 실행 실패
- Usage 제한 임박
- Subscription 상태 변경

초기에는 앱 내부 Toast와 상태 표시를 우선한다. 이메일, Slack, Push 알림은 필요한 것만 이후 도입한다.

## 25. Responsive Information Priority

### Desktop

- Project 정보와 Workflow 상세를 넓은 화면에 구조화
- 보조 정보는 Side Panel 사용 가능

### Tablet

- 주요 정보 우선
- Side Panel은 접기 가능

### Mobile

- 한 열 구조
- 핵심 CTA 고정 가능
- 복잡한 표는 카드로 전환
- Workflow Step은 Accordion 사용 가능
- 비용, 난이도, 상태를 상단에서 확인 가능

모바일 앱은 MVP 제외지만 모바일 웹은 지원한다.

## 26. MVP IA Scope

### 반드시 구현

- Landing
- Login
- Signup
- Auth Callback
- Dashboard
- Project List
- New Project
- Project Detail
- Recommendation Results
- Workflow Detail
- Required Setup
- 제한된 Test Run
- Usage
- Settings
- Privacy
- Terms

### 조건부 구현

- Pricing
- Tool List
- Tool Detail
- Billing
- Integration Management
- Onboarding

### MVP 이후

- Workflow Marketplace
- Community
- Team Workspace
- Shared Project
- Visual Builder
- Plugin Store
- Advanced Admin
- Mobile App
- Multilingual IA

## 27. Routing Decisions

다음 결정을 명시한다.

- Next.js App Router를 전제로 한다.
- Public Route와 Authenticated Route를 분리한다.
- 구현 시 Route Group을 사용할 수 있다.
- 실제 URL에 내부 Route Group 이름을 노출하지 않는다.
- Project 자원은 `projectId`를 중심으로 접근한다.
- Recommendation과 Workflow는 Project 하위 문맥을 유지한다.
- Tool Detail은 Public 접근 가능성을 고려한다.
- UUID를 사용하더라도 사용자에게 ID를 강조하지 않는다.
- SEO가 필요한 Public Page는 slug를 사용할 수 있다.
- MVP에서는 복잡한 Nested Layout을 최소화한다.

## 28. Analytics Events by Page

최소 다음 Event를 정의한다.

```text
landing_viewed
goal_input_started
goal_input_submitted
signup_started
signup_completed
onboarding_completed
project_created
recommendation_started
recommendation_completed
recommendation_failed
workflow_candidate_viewed
workflow_selected
workflow_saved
setup_viewed
integration_started
integration_connected
test_run_started
test_run_succeeded
test_run_failed
subscription_limit_reached
```

각 Event를 어느 화면에서 발생시키는지 표로 정리한다. Analytics Provider는 `TBD`로 둔다.

## 29. IA Risks

- 위험: Tool 탐색이 핵심 기능처럼 보이는 문제
  - 영향: 제품 정체성이 흐려진다.
  - 대응: Tool보다 Goal과 Workflow를 앞에 배치한다.

- 위험: 입력 단계가 길어 이탈하는 문제
  - 영향: Recommendation 생성 전에 사용자가 이탈할 수 있다.
  - 대응: 단계 수를 최소화하고 기본값과 예시를 제공한다.

- 위험: Recommendation과 Workflow의 차이가 불명확한 문제
  - 영향: 사용자가 결과 구조를 이해하지 못한다.
  - 대응: 추천은 후보, Workflow는 선택 결과라는 구분을 반복 노출한다.

- 위험: 하나의 Project에 너무 많은 상태가 생기는 문제
  - 영향: 상태 추적이 어려워진다.
  - 대응: 상태 수를 제한하고 화면에서 현재 상태와 다음 행동만 보여준다.

- 위험: 비개발자에게 API 연결이 어려운 문제
  - 영향: 실행 단계에서 이탈한다.
  - 대응: 보안 안내, 준비사항, 단계별 연결 안내를 제공한다.

- 위험: 실행 가능 범위를 오해하는 문제
  - 영향: 신뢰 저하와 불만이 생긴다.
  - 대응: 제한사항과 지원 수준을 명확히 표시한다.

- 위험: Dashboard가 정보 과다해지는 문제
  - 영향: 첫 화면의 이해도가 떨어진다.
  - 대응: 새 프로젝트, 진행 중 작업, 최근 상태만 우선 노출한다.

- 위험: Mobile에서 Workflow가 지나치게 길어지는 문제
  - 영향: 사용성이 나빠진다.
  - 대응: 카드, Accordion, 접이식 섹션을 사용한다.

- 위험: Free와 Pro 경계가 사용자 흐름을 방해하는 문제
  - 영향: 사용자가 기능 제한에 좌절한다.
  - 대응: 미리 제한을 설명하고 업그레이드 지점을 자연스럽게 배치한다.

- 위험: Admin 기능을 너무 일찍 구현하는 문제
  - 영향: MVP가 불필요하게 복잡해진다.
  - 대응: 초기에는 내부 도구와 데이터 시드로 관리한다.

## 30. Open Questions

다음 항목을 `TBD`로 유지한다.

- 비로그인 Preview 범위
- Project당 Workflow Version 정책
- Free Project 저장 개수
- Tool 페이지의 Public 공개 범위
- Integration 연결의 무료 제공 범위
- 테스트 실행 무료 횟수
- Project Archive 정책
- 검색 기능 출시 시점
- Admin UI 도입 시점
- Analytics Provider
- Help Center 구조

임의로 결정하지 않는다.

## 용어 및 표기 원칙

- 브랜드명은 `BuildFlow`로 표기한다.
- 내부 코드명은 필요한 문서 정보에서만 `Project Flow`로 표기한다.
- 사용자 UI에서는 `워크플로`를 기본 한글 표기로 사용한다.
- 기술 문맥에서는 `Workflow` 사용이 가능하다.
- `Recommendation`은 사용자 UI에서 `추천 결과`로 표기한다.
- `Build`는 의미가 불분명한 화면에서 `설계 생성`으로 표기한다.
- Tool보다 목표와 Workflow를 먼저 배치한다.
- 사용자에게 내부 DB 용어나 구현 용어를 노출하지 않는다.

## 작성 원칙

- 한국어로 작성한다.
- 실제 UX Designer, PM, 개발자가 사용할 수 있는 수준으로 작성한다.
- Route와 화면의 목적을 구체적으로 작성한다.
- PRD와 브랜드 문서의 정의를 변경하지 않는다.
- 기능을 임의로 MVP에 추가하지 않는다.
- UI 색상이나 상세 디자인을 결정하지 않는다.
- DB Column이나 API Endpoint를 설계하지 않는다.
- 동일한 내용을 여러 목차에서 반복하지 않는다.
- 1인 개발 현실성을 우선한다.
- 복잡한 구조보다 구현 가능한 구조를 선택한다.
- 확정되지 않은 항목은 `TBD`로 남긴다.

## 제외 범위

이번 작업에서는 다음을 하지 않는다.

- Next.js 프로젝트 생성
- UI 구현
- DB Schema 작성
- Supabase 작업
- API Endpoint 설계
- 로고 또는 이미지 생성
- 외부 서비스 조사
- 도메인 조사
- 상표 조사
- Git commit
- Git push
- 기존 문서 수정
