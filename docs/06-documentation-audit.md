# BuildFlow

## Documentation Consistency Audit

- Version: 1.0
- Status: Review
- Brand Name: BuildFlow
- Internal Codename: Project Flow
- Document Owner: Founder
- Last Updated: 2026-07-14
- Documents Reviewed:
  - `docs/00-brand.md`
  - `docs/01-prd.md`
  - `docs/02-information-architecture.md`
  - `docs/03-user-flow.md`
  - `docs/04-mvp.md`
  - `docs/05-development-rule.md`

## 1. Executive Summary

문서 간 제품 정의는 일관적이다. BuildFlow는 AI Tool Directory가 아니라 AI Workflow Design Platform이며, 목표 중심의 AI Result Platform이라는 정의가 모든 핵심 문서에서 반복된다. 개발 전 필수 결정 7개는 이번 Task에서 확정되었고, MVP 범위도 1인 개발 기준으로 유지 가능하다. 남은 이슈는 주로 Billing 세부, Analytics 세부, 그리고 Development Rule의 후속 다듬기다. 현재 상태는 `Ready`로 판단한다.

### 핵심 판단

- 제품 정의는 일관적이다.
- 첫 출시 범위는 대체로 1인 개발에 맞게 축소되어 있다.
- Billing과 Analytics는 후속 세부 결정이 남아 있지만, 출시 차단 결정은 해결됐다.
- 일부 문서는 Route와 Flow를 넓게 잡고 있으나 MVP 문서가 첫 출시 기준을 잘 통제하고 있다.
- 지금 코드 개발을 시작하기에는 결정이 조금 더 필요하다.

## 2. Reviewed Document Roles

| Document | Primary Role | Must Control | Must Not Control |
| --- | --- | --- | --- |
| `docs/00-brand.md` | 브랜드 정의 | 브랜드명, 메시지, 톤, 포지셔닝 | DB, Route, 코드 구조 |
| `docs/01-prd.md` | 제품 요구사항 | 문제 정의, 타겟, 기능 원칙, 장기 비전 | 첫 출시 범위 강제 |
| `docs/02-information-architecture.md` | 정보 구조 | Route, 화면 구조, 객체 관계 | 모든 Route 구현 강제 |
| `docs/03-user-flow.md` | 사용자 행동과 예외 | 정상/실패 흐름, 상태 분기 | 모든 Flow를 P0로 승격 |
| `docs/04-mvp.md` | 첫 출시 범위 | P0/P1/P2, 출시 기준, 최소 범위 | 장기 비전 확대 |
| `docs/05-development-rule.md` | 개발 수행 방식 | 개발 규칙, 검증, 협업 방식 | 제품 정의 자체 결정 |

## 3. Product Definition Consistency

전반적으로 다음 표현은 일관된다.

- Brand Name: BuildFlow
- Internal Codename: Project Flow
- Product Type: AI Workflow Design Platform
- Strategic Positioning: AI Result Platform
- Primary Message: 무엇을 만들고 싶나요?
- Primary Slogan: Build the result, not the tools.

| Issue ID | Document | 표현 또는 위치 | 문제 | 권고 |
| --- | --- | --- | --- | --- |
| PD-001 | `docs/01-prd.md:16`, `docs/00-brand.md:19`, `docs/00-brand.md:63` | `AI Result Design Platform` / `AI Workflow Design Platform` / `AI Result Platform` | 제품 유형 표현은 일관되지만 세 표현이 동시에 쓰여 초기에 혼동 가능성이 있다. | 외부용 기본 정의는 `AI Workflow Design Platform`, 전략 포지셔닝은 `AI Result Platform`으로 고정하고 `AI Result Design Platform`은 설명문에서만 사용한다. |
| PD-002 | `docs/01-prd.md:50`, `docs/01-prd.md:209`, `docs/01-prd.md:211` | `AI Tool Directory`, `n8n 대체 서비스` | 비정의 표현이 명시적 non-positioning으로만 관리되어 있으나, 문서 탐색 중 오해 가능성이 있다. | 브랜드/PRD 초반에 “아니다” 목록을 더 앞에 두어 오해를 줄인다. |
| PD-003 | `docs/02-information-architecture.md:241`, `docs/02-information-architecture.md:288` | `/pricing`, `/app/billing` | IA에서 요금/결제 Route가 보이므로 제품이 조기에 결제 중심으로 오해될 수 있다. | MVP 문서에서 Billing 제외 권고를 우선 노출하고, IA의 Billing은 조건부로만 유지한다. |

## 4. Target User Consistency

타겟은 일관적이다. AI 입문자, 비개발자, 1인 사업자, 마케터, 쇼핑몰 운영자, 콘텐츠 제작자, 직장인이 반복적으로 등장하고, 전문 개발자는 초기 Non-Target으로 유지된다.

충돌로 보이는 부분은 크지 않지만 다음은 주의가 필요하다.

- `docs/02-information-architecture.md:301`의 Admin 영역은 미래 구조로만 정의되어 있다.
- `docs/04-mvp.md:645-665`도 전용 Admin UI 제외를 명시한다.
- `docs/03-user-flow.md:67`, `docs/03-user-flow.md:709-848`은 API, OAuth, n8n을 설명하지만 비개발자가 이해할 수 있도록 가이드가 필요하다는 전제가 유지된다.

결론: 타겟 충돌은 없고, 비개발자 우선 원칙도 유지된다.

## 5. MVP Scope Consistency

| Feature | PRD | IA | User Flow | MVP Priority | Audit Result |
| --- | --- | --- | --- | --- | --- |
| Landing | 포함 | 포함 | 포함 | P0 | Consistent |
| Email Auth | 포함 | 포함 | 포함 | P0 | Consistent |
| Google OAuth | 포함 | 포함 | 포함 | P0 | Consistent |
| Onboarding | 제외/흡수 | 제외/흡수 | 제외/흡수 | P1 | Resolved |
| Project CRUD | 포함 | 포함 | 포함 | P0 | Consistent |
| Goal Input | 포함 | 포함 | 포함 | P0 | Consistent |
| Goal Clarification | 포함 | 포함 | 포함 | P1 | Scope Conflict |
| Recommendation | 포함 | 포함 | 포함 | P0 | Consistent |
| Recommendation Revision | 포함 | 포함 | 포함 | P1 | Scope Conflict |
| Workflow Comparison | 포함 | 포함 | 포함 | P0/P1 문맥 | Scope Conflict |
| Workflow Detail | 포함 | 포함 | 포함 | P0 | Consistent |
| Save and Resume | 포함 | 포함 | 포함 | P0 | Consistent |
| Tool Directory | 포함 | 포함 | 포함 | P1/조건부 | Priority Conflict |
| Integration Center | 포함 | 포함 | 포함 | P1/조건부 | Priority Conflict |
| Limited Test Run | 제외 | 제외 | 제외 | P1 | Resolved |
| n8n Template Handoff | 포함 | 포함 | 포함 | P1 | Resolved |
| Billing | 제외 | 조건부 | 제외/보조 | P1/조건부 | Resolved |
| Usage | 포함 | 포함 | 포함 | P0/P1 | Priority Conflict |
| Analytics | 포함 | 포함 | 포함 | P1 | Scope Conflict |
| Admin UI | 미래 | 미래 | 미래 | P2 | Consistent |
| Visual Builder | 제외 | 제외 | 제외 | P2 | Consistent |
| Marketplace | 제외 | 제외 | 제외 | P2 | Consistent |
| Team | 제외 | 제외 | 제외 | P2 | Consistent |
| Mobile App | 제외 | 제외 | 제외 | P2 | Consistent |

요약:

- 브랜드/PRD/IA/User Flow는 큰 방향에서 일치한다.
- MVP에서 P0와 P1의 경계가 가장 자주 흔들린다.
- Tool Directory, Integration Center, Billing, Analytics는 MVP에서 보조 범위로 축소해도 일관성이 유지된다.

## 6. P0 Scope Challenge

| P0 | 기능 | 출시 필수인가 | 더 줄일 수 있는가 | 의존성 | 권고 |
| --- | --- | ---: | ---: | --- | --- |
| P0-001 | Landing | 예 | 아니오 | 없음 | 유지 |
| P0-002 | Authentication | 예 | 예 | Auth Provider | Email + Google만 유지, 나머지 제외 유지 |
| P0-003 | Minimal Profile | 예 | 예 | Signup | Project 생성 중 수집 방식으로 단순화 |
| P0-004 | Project CRUD | 예 | 아니오 | Auth, RLS | 유지 |
| P0-005 | Goal Input | 예 | 아니오 | Project | 유지 |
| P0-006 | Workflow Template Database | 예 | 아니오 | Seed 데이터 | 유지 |
| P0-007 | Tool Database | 예 | 예 | Template DB | 최소 15개 수준으로 시작 가능 |
| P0-008 | Recommendation Engine V1 | 예 | 아니오 | Goal/Template/Tool/LLM | 유지 |
| P0-009 | Recommendation Results | 예 | 아니오 | Recommendation Engine | 유지 |
| P0-010 | Workflow Detail | 예 | 아니오 | Template/Tool | 유지 |
| P0-011 | Save and Resume | 예 | 아니오 | Project/Workflow 저장 | 유지 |
| P0-012 | Basic Usage Tracking | 예 | 예 | Recommendation/Test | 기록 중심으로 축소 가능 |
| P0-013 | Security Foundation | 예 | 아니오 | Auth/DB | 유지 |
| P0-014 | Error and Loading States | 예 | 아니오 | 전 기능 | 유지 |
| P0-015 | Responsive Web | 예 | 예 | 전 화면 | Tablet 별도 최적화는 후순위 가능 |

### P0 Scope Findings

- Google OAuth는 첫 내부 Beta부터 포함해도 무방하지만, 외부 공개 MVP에서 막히면 지연 요인이 될 수 있다.
- Password Reset은 출시 차단 요소라기보다 운영 편의 요소에 가깝다.
- Project Archive와 Delete를 둘 다 P0로 강하게 둘 필요는 없다.
- Usage UI는 기록만 있어도 되며, 상세 대시보드는 축소 가능하다.
- Tablet 별도 대응은 기본 반응형으로 흡수 가능하다.
- 10~15개 Template은 출시 시점에 최소 10개만 보장하고 15개는 목표치로 두는 편이 낫다.

## 7. Route Consistency

| Route | IA Status | MVP Status | 실제 초기 구현 권고 | 이유 |
| --- | --- | --- | --- | --- |
| `/` | Public | P0 | 유지 | 첫 진입점 |
| `/login` | Public | P0 | 유지 | 인증 진입 |
| `/signup` | Public | P0 | 유지 | 인증 진입 |
| `/pricing` | Public | 조건부 | 제외 또는 미니멀 | Billing 제외 권고와 맞추기 위해 |
| `/examples` | Public | 제외/조건부 | 제외 | 초기 핵심이 아님 |
| `/tools` | Public | 조건부 | 제외 또는 보조 페이지 | Tool Directory 오해 방지 |
| `/tools/[slug]` | Public | 조건부 | 제외 | 보조 진입점이면 충분 |
| `/auth/callback` | Public | P0 | 유지 | OAuth 필수 |
| `/app` | App | P0 | 유지 | Dashboard |
| `/app/onboarding` | App | 조건부 | Project 생성 내부로 통합 권고 | 별도 Route 축소 가능 |
| `/app/projects` | App | P0 | 유지 | 목록 |
| `/app/projects/new` | App | P0 | 유지 | 핵심 입력 |
| `/app/projects/[projectId]` | App | P0 | 유지 | 상태 허브 |
| `/app/projects/[projectId]/goal` | App | 조건부 | Project Detail 내부 섹션 통합 권고 | Route 과세분화 방지 |
| `/app/projects/[projectId]/recommendations` | App | P0/조건부 | Project Detail 내부 섹션 통합 가능 | 첫 출시 Route 절감 |
| `/app/projects/[projectId]/workflow` | App | P0 | 유지 | 핵심 상세 |
| `/app/projects/[projectId]/workflow/setup` | App | 조건부 | Workflow Detail 내부 단계 통합 권고 | 단계형 UI로 대체 가능 |
| `/app/projects/[projectId]/workflow/test` | App | 조건부 | Workflow Detail 내부 단계 통합 권고 | 첫 Test가 하나뿐이면 통합 가능 |
| `/app/integrations` | App | 조건부 | 제외 또는 최소화 | 범용 Integration Center는 과함 |
| `/app/usage` | App | P0/P1 | Settings 또는 Dashboard로 임시 통합 가능 | 초기에는 기록만 있으면 충분 |
| `/app/billing` | App | 조건부 | 제외 권고 | Billing 제외가 기본 권고 |
| `/app/settings` | App | P0 | 유지 | 최소 관리 필요 |
| `/privacy` | Public | P0 | 유지 | 출시 필수 |
| `/terms` | Public | P0 | 유지 | 출시 필수 |

요약:

- IA Route는 풍부하지만, MVP는 더 적게 시작하는 것이 일관적이다.
- `onboarding`, `recommendations`, `workflow/setup`, `workflow/test`, `usage`, `billing`은 통합 여지가 크다.

## 8. User Flow Consistency

| Flow | 분류 | Audit Result |
| --- | --- | --- |
| Visitor Preview | P1 Optional | Consistent |
| Onboarding | P1 Optional | Resolved |
| Goal Clarification | P1 Optional | Consistent |
| Recommendation Revision | P1 Optional | Consistent |
| OAuth | P0 Required | Consistent |
| API Key 연결 | P1 Optional | Consistent |
| Test Run | P1 Optional | Resolved |
| n8n Handoff | P1 Optional | Consistent |
| Subscription Upgrade | P1 Optional | Consistent |
| Usage Limit | P0 Required | Consistent |
| Archive | P1 Optional | Consistent |
| Delete | Operational Only | Consistent |
| Email Notification | P2 Deferred | Consistent |
| Long-running AI 작업 | P2 Deferred | Consistent |
| Managed Support | P2 Deferred | Consistent |

핵심 판정:

- User Flow는 P0/P1/P2 분리가 잘 되어 있다.
- Test Run은 n8n Template Handoff 중심으로 정리됐다.
- Onboarding은 프로젝트 입력에 흡수되는 방향으로 정리됐다.

## 9. Data Object Consistency

| Object | PRD | IA | User Flow | MVP DB | Audit Result |
| --- | --- | --- | --- | --- | --- |
| User | 포함 | 포함 | 포함 | 필요 | Consistent |
| Profile | 포함 | 포함 | 포함 | 필요 | Consistent |
| Project | 포함 | 포함 | 포함 | 필요 | Consistent |
| Goal | 포함 | 포함 | 포함 | 조건부/필요 | Consistent |
| Recommendation | 포함 | 포함 | 포함 | 필요 | Consistent |
| Recommendation Candidate | 포함 | 포함 | 포함 | 필요 | Consistent |
| Workflow Template | 포함 | 포함 | 포함 | 필요 | Consistent |
| Template Step | 포함 | 포함 | 포함 | 필요 | Consistent |
| Selected Workflow | 포함 | 포함 | 포함 | 필요 | Consistent |
| Project Workflow Step | 포함 | 포함 | 포함 | 필요 | Consistent |
| Tool | 포함 | 포함 | 포함 | 필요 | Consistent |
| Integration | 포함 | 포함 | 포함 | 조건부 | Scope Conflict |
| Execution | 포함 | 포함 | 포함 | 조건부 | Scope Conflict |
| Cost Estimate | 포함 | 포함 | 포함 | 조건부 | Scope Conflict |
| Usage Record | 포함 | 포함 | 포함 | 필요 | Consistent |
| Subscription | 포함 | 포함 | 포함 | 조건부 | Scope Conflict |

### 오브젝트 평가

- `Goal`을 별도 Table로 둘 필요는 MVP에서 아직 확정되지 않았다.
- `Recommendation`과 `Candidate` 분리는 유용하지만, 초기에는 JSON Snapshot으로도 시작 가능하다.
- `Selected Workflow` 복제는 필요하나 완전한 버전 시스템은 P1/P2로 미룰 수 있다.
- Workflow Versioning은 최소 버전 ID 정도만 있으면 되고, 고급 Diff는 불필요하다.
- `Cost Estimate`는 별도 객체보다 추천 결과 내부 필드로 시작할 수 있다.
- `Subscription` Table은 Billing 제외 Beta에서도 최소한의 제한 구조로 유지할 수 있다.
- `Integration`과 `Execution`은 n8n Handoff 및 후속 실행 확장에 맞춰 최소 구조로 두면 된다.

## 10. Recommendation Engine Consistency

기준 구조는 대체로 일관적이다.

```text
Goal Normalization
→ Rule Engine
→ Template Retrieval
→ Compatibility Check
→ Cost Calculation
→ Difficulty Calculation
→ LLM Explanation
→ Schema Validation
```

| Issue ID | Document | 표현 또는 위치 | 문제 | 권고 |
| --- | --- | --- | --- | --- |
| RE-001 | `docs/01-prd.md:544-589`, `docs/04-mvp.md:495-521` | Recommendation Strategy / Engine boundary | 구조는 일치하지만 MVP 문서에 더 구체적인 제한이 있어 PRD와 온도 차이가 있다. | MVP 문서를 최종 기준으로 두고 PRD는 장기 비전으로 유지한다. |
| RE-002 | `docs/03-user-flow.md:432-483`, `docs/04-mvp.md:328-341` | Limited Test Run / n8n Handoff | User Flow에는 여러 테스트 후보가 나열되지만 MVP에서는 첫 Test 기능이 n8n Template Handoff + Setup Guide로 고정되었다. | BuildFlow 직접 실행은 후속으로 미루고 Handoff만 초기 값으로 유지한다. |
| RE-003 | `docs/04-mvp.md:225`, `docs/01-prd.md:585` | LLM이 가격/실행 지원 여부를 결정하지 않음 | 일관적이다. | 유지 |

결론: Recommendation Engine 정의는 일관적이며, 큰 충돌은 없다.

## 11. Execution Scope Consistency

실행 지원 레벨은 다음 축으로 정리하는 것이 맞다.

```text
Guide Only
Template Available
Test Supported
Not Supported
```

| Execution Type | PRD | IA | User Flow | MVP | Audit Result |
| --- | --- | --- | --- | --- | --- |
| 직접 API 실행 | 제한 | 제한 | 제한 | 제외/조건부 | Consistent |
| 사용자 API Key | 포함 | 포함 | 포함 | 조건부 | Consistent |
| OAuth | 포함 | 포함 | 포함 | 조건부 | Consistent |
| Sample Data | 암시 | 암시 | 포함 | 포함 가능 | Consistent |
| n8n Webhook | 포함 | 포함 | 포함 | P1 | Consistent |
| n8n JSON Template | 포함 | 포함 | 포함 | P1 | Consistent |
| Gmail 읽기 | 예시 | 예시 | 예시 | 제외/조건부 | Consistent |
| Google Sheets 연결 | 예시 | 예시 | 예시 | 포함 가능 | Consistent |
| 장시간 Background Job | 제외 | 제외 | 제외 | 제외 | Consistent |
| 영상 자동화 | 제외 | 제외 | 제외 | 제외 | Consistent |
| 외부 플랫폼 게시 | 제외 | 제외 | 제외 | 제외 | Consistent |

결론: 실행 범위는 대체로 일치한다. 다만 첫 Test Run의 단일화가 필요하다.

## 12. Authentication Consistency

| Auth Item | Brand/PRD | IA | User Flow | MVP | Audit Result |
| --- | --- | --- | --- | --- | --- |
| Email + Password | 포함 | 포함 | 포함 | 포함 | Consistent |
| Google OAuth | 포함 | 포함 | 포함 | 포함 | Consistent |
| GitHub | 비권장 | 없음 | MVP 아님 | 제외 | Consistent |
| Kakao | 없음 | 없음 | 제외 | 제외 | Consistent |
| Apple | 없음 | 없음 | 제외 | 제외 | Consistent |
| Magic Link | 없음 | 없음 | 제외 | 제외 | Consistent |
| Password Reset | 없음/명시적 아님 | 없음 | 포함 | 포함 | Priority Conflict |
| Email Verification | 명시적 아님 | 명시적 아님 | 포함 가능성 | TBD | Unclear |
| Onboarding | 제외/흡수 | 제외/흡수 | 제외/흡수 | P1/축소 | Resolved |
| Protected Route | 포함 | 포함 | 포함 | 포함 | Consistent |
| Session Restore | 암시 | 포함 | 포함 | 포함 | Consistent |

핵심:

- Password Reset은 MVP에서 운영 편의로는 좋지만 출시 차단 요소는 아니다.
- Email Verification 정책은 아직 확정되지 않았다.
- Onboarding은 별도 화면으로 두지 않고 Project 생성에 흡수할 여지가 있다.

## 13. Billing and Subscription Consistency

Billing은 가장 큰 일관성 검수 대상이다.

| Area | 상태 | Audit Result |
| --- | --- | --- |
| `/pricing` | IA에 존재, MVP 조건부 | Priority Conflict |
| `/app/billing` | IA에 존재, MVP 조건부 | Priority Conflict |
| Subscription 상태 | 여러 문서에 존재 | Consistent but Premature |
| Free/Pro | 존재 | Consistent |
| Paywall | User Flow와 MVP에 존재 | Consistent |
| Checkout | User Flow와 PRD에 존재 | Consistent but Deferred |
| 결제 Provider | `TBD` | Unclear |
| Usage Limit | 존재 | Consistent |
| 수동 Pro 부여 | MVP 대체안에 존재 | Consistent |
| Beta Access | MVP 대체안에 존재 | Consistent |

권고:

- Billing 데이터 구조는 남겨 두되, 공개 결제 UI는 P1/P2로 늦추는 것이 가장 일관적이다.
- 첫 Beta에서는 `Free Beta + 수동 Pro 부여 + Usage 제한`으로 시작하는 편이 안전하다.

## 14. Admin and Operations Consistency

Admin UI는 MVP 제외로 일관된다.

수동 운영은 다음 방식으로 가능하다.

- Supabase Dashboard
- SQL Seed
- Migration
- TypeScript 또는 JSON Seed
- 내부 Script

운영 작업의 수동 가능성:

- Tool 등록: 가능
- Template 등록: 가능
- 가격 정보 수정: 가능
- 실행 지원 수준 수정: 가능
- 사용자 Pro 상태 부여: 가능
- 오류 확인: 가능
- Usage 확인: 가능

결론: Admin UI 없이도 시작 가능하며, 운영 작업은 현재 문서 기준으로 수동 처리 가능하다.

## 15. Analytics Consistency

문서에 정의된 이벤트 수는 꽤 많다. 가설 검증에 필요한 최소 이벤트와 최적화용 이벤트가 섞여 있다.

### 권고 분류

- P0 Event: `landing_viewed`, `goal_input_started`, `goal_input_submitted`, `signup_started`, `signup_completed`, `project_created`, `recommendation_started`, `recommendation_completed`, `workflow_selected`, `workflow_saved`
- P1 Event: `recommendation_failed`, `workflow_candidate_viewed`, `integration_connected`, `usage_limit_reached`, `checkout_started`, `subscription_activated`
- P2 Event: 나머지 세부 이벤트

### 판정

- Goal 원문과 개인정보를 저장하지 않는 원칙은 일관된다.
- Analytics Provider는 아직 `TBD`다.
- 현재 이벤트 수는 초기 P0 기준으로는 다소 많다.

## 16. Terminology Consistency

용어 표기는 전반적으로 일관적이다.

| Concept | Preferred User-Facing Term | Audit |
| --- | --- | --- |
| Recommendation | 추천 결과 | 일관 |
| Workflow | 워크플로 | 일관 |
| Build | 설계 생성 | 일관 |
| Goal | 목표 | 일관 |
| Tool | 도구 | 일관 |
| Integration | 연동 | 일관 |
| Execution | 실행 | 일관 |
| Test Run | 테스트 실행 | 일관 |
| Cost Estimate | 예상 비용 | 일관 |
| Difficulty | 난이도 | 일관 |

주의할 점:

- `Build`는 일부 문서에서 핵심 기능명으로 쓰이지만, 사용자 화면에서는 `설계 생성`이 더 안전하다.
- `Project`와 `Workflow`는 구분이 유지된다.
- `Tool`과 `Integration`도 구분이 유지된다.

## 17. TBD Inventory

중복을 통합한 주요 `TBD` 목록이다.

| Decision ID | 결정 항목 | 영향 문서 | 개발 전 필수 여부 | 권고 결정 시점 |
| --- | --- | --- | ---: | --- |
| TBD-007 | Analytics Provider | `docs/02-information-architecture.md`, `docs/03-user-flow.md`, `docs/04-mvp.md` | 예 | Before Public Beta |
| TBD-008 | Error Monitoring 도구 | `docs/04-mvp.md` | 아니오 | Before Public Beta |
| TBD-009 | Free / Pro Usage 제한 | `docs/04-mvp.md` | 아니오 | Before Public Beta |
| TBD-010 | 결제 Provider | `docs/03-user-flow.md`, `docs/04-mvp.md` | 예 | Before Public Beta |
| TBD-011 | Project Archive 정책 | `docs/03-user-flow.md`, `docs/04-mvp.md` | 아니오 | Before Public Beta |
| TBD-012 | Email Verification 정책 | `docs/03-user-flow.md`, `docs/04-mvp.md` | 예 | Before Project Setup |
| TBD-013 | Workflow Version 보존 정책 | `docs/03-user-flow.md`, `docs/04-mvp.md` | 아니오 | Before DB Design |

## 18. Required Decisions Before Development

코드 작성 전에 반드시 결정해야 할 항목은 이번 Task에서 모두 확정했다.

### Decision D-001

- 질문: Beta 방식
- 확정: Invite-only Private Beta
- 영향: 공개 모집 대신 관리자가 승인한 소수 사용자로 시작한다.

### Decision D-002

- 질문: Visitor Preview
- 확정: Initial Beta Excluded
- 영향: Landing은 정적 예시만 보여주고 로그인 후 Recommendation을 제공한다.

### Decision D-003

- 질문: Onboarding 방식
- 확정: Integrated into New Project
- 영향: 별도 `/app/onboarding` Route 없이 새 프로젝트 입력 과정에서 최소 정보를 수집한다.

### Decision D-004

- 질문: Recommendation 후보 수
- 확정: Maximum 3
- 영향: Primary 1개와 Alternative 최대 2개를 제공한다.

### Decision D-005

- 질문: 초기 Template 수
- 확정: 10
- 영향: Template 품질을 우선하고 실행 지원은 일부만 제공한다.

### Decision D-006

- 질문: LLM Provider
- 확정: OpenAI 우선
- 영향: 초기 Recommendation 설명은 OpenAI만 구현한다.

### Decision D-007

- 질문: Guided Execution
- 확정: n8n Template Handoff + Setup Guide
- 영향: BuildFlow 서버 직접 Test Run은 초기 Beta에서 제외한다.

## 19. Recommended MVP Reduction

### Option A - Documentation MVP

```text
Goal
→ Recommendation
→ Workflow Detail
→ Save
```

- 실행 없음
- 개발 난이도: 낮음
- 출시 속도: 빠름
- 데모 가치: 중간
- 보안 위험: 낮음
- 외부 의존성: 낮음
- 사용자 가치 검증: 중간
- 운영 부담: 낮음

### Option B - Guided Execution MVP

```text
Goal
→ Recommendation
→ Workflow Detail
→ Save
→ n8n Template 또는 Setup Guide
```

- 직접 API 실행 최소화
- 개발 난이도: 중간
- 출시 속도: 빠름
- 데모 가치: 높음
- 보안 위험: 중간
- 외부 의존성: 중간
- 사용자 가치 검증: 높음
- 운영 부담: 중간

### Option C - Limited Test MVP

```text
Goal
→ Recommendation
→ Workflow Detail
→ Save
→ 하나의 Test Run
```

- 실행 지원을 조금 더 직접 경험하게 함
- 개발 난이도: 높음
- 출시 속도: 느림
- 데모 가치: 매우 높음
- 보안 위험: 높음
- 외부 의존성: 높음
- 사용자 가치 검증: 높음
- 운영 부담: 높음

### 권고

1인 개발 현실성을 기준으로 `Option B - Guided Execution MVP`를 권고한다. 이 방식은 핵심 가설인 “목표 중심 Workflow 설계”를 검증하면서도 실행 부담과 보안 위험을 크게 늘리지 않는다. Option C는 데모 가치는 높지만 외부 Provider, 권한, 실패 복구 비용이 급격히 커진다. Option A는 너무 문서 중심으로 보일 위험이 있다.

## 20. Recommended Initial Route Set

권고하는 최소 Route는 다음과 같다.

```text
/
/login
/signup
/auth/callback
/app
/app/projects/new
/app/projects/[projectId]
/app/settings
/privacy
/terms
```

### 제외 또는 통합 권고

- `/pricing`: Billing 제외 권고와 함께 초기 제외
- `/examples`: 초기 제외
- `/tools`: 초기 제외 또는 보조 페이지로 후순위
- `/tools/[slug]`: 초기 제외
- `/app/onboarding`: Project 생성 내부로 통합
- `/app/projects`: `/app` 또는 `/app/projects/[projectId]`에서 대체 가능
- `/app/projects/[projectId]/recommendations`: Project Detail 내부 Section 통합 가능
- `/app/projects/[projectId]/workflow`: Project Detail 내부 Section 통합 가능
- `/app/projects/[projectId]/workflow/setup`: Workflow Detail 내부 단계 통합 가능
- `/app/projects/[projectId]/workflow/test`: P1 이후
- `/app/integrations`: P1 이후 또는 제외
- `/app/usage`: Settings 또는 Dashboard 내부 통합 가능
- `/app/billing`: 제외 권고

권고 Route 수는 10개다.

## 21. Recommended Initial Data Object Set

권고하는 최소 객체는 다음과 같다.

- profiles
- projects
- tools
- workflow_templates
- workflow_template_steps
- recommendations
- recommendation_candidates
- usage_records

### 조건부

- project_workflows
- project_workflow_steps
- integrations
- executions
- subscriptions

### 평가

- 추천 결과 Snapshot을 JSON으로 저장하는 방식은 빠르지만 추후 조회/비교가 어려워질 수 있다.
- 정규화된 하위 Table 방식은 확장에 유리하지만 초기에 복잡하다.
- 초기에는 Recommendation Snapshot + 최소 정규화 조합이 현실적이다.

권고 Data Object 수는 8개 핵심 + 5개 조건부다.

## 22. Recommended Build Readiness Checklist

Next.js 프로젝트 생성 전에 확인할 항목:

- 제품명
- 저장소명
- Working Directory
- Node 버전
- Package Manager
- Next.js 버전 정책
- Supabase 프로젝트 생성 시점
- Google OAuth 적용 시점
- 환경변수 정책
- GitHub 저장소 생성 시점
- Vercel 연결 시점
- 초기 Theme 방향
- 테스트 전략
- 첫 Seed 범위

현재는 제품명, Working Directory, 브랜드, MVP Option, 핵심 문서 구조는 확보되어 있다. Billing과 Analytics는 후속 세부 결정이 남아 있지만, 개발 시작을 막는 필수 결정은 해결됐다.

## 23. Audit Findings

| Finding ID | Severity | Category | Finding | Recommendation | Blocks Development |
| --- | --- | --- | --- | --- | ---: |
| AF-001 | Medium | Billing | Billing은 제외로 확정됐지만 IA와 User Flow에 보조 Route와 예외 안내가 남아 있다. | Billing 관련 Route는 조건부/보조로만 해석하고 실행 UI는 만들지 않는다. | 아니오 |
| AF-002 | Medium | Onboarding | 별도 Onboarding은 제외됐지만 IA와 User Flow의 흔적이 남아 있다. | Project 생성 흡수 방식으로만 해석한다. | 아니오 |
| AF-003 | Medium | Execution | BuildFlow 직접 Test Run은 제외됐고 n8n Handoff 중심으로 정리됐지만 문서 흔적이 남아 있다. | 직접 실행은 P1/P2로 미루고 Handoff만 초기 값으로 둔다. | 아니오 |
| AF-004 | Medium | Analytics | P0 이벤트 범위를 더 줄이면 초기 계측이 단순해진다. | P0 Event는 최소 집합만 남긴다. | 아니오 |
| AF-005 | Low | Development Rule | `docs/05-development-rule.md`는 작성됐지만 이후 Task에서 더 다듬을 수 있다. | 운영 규칙은 유지하고 새 Task마다 확인한다. | 아니오 |

## 24. Final Recommendation

1. 지금 Next.js 프로젝트를 생성해도 되는가?
   - 예. 개발 전 필수 결정은 이번 Task에서 확정됐다.

2. DB 설계 전에 무엇을 결정해야 하는가?
   - 초기 Seed 세부 데이터와 Analytics 최소 이벤트 범위는 정리하면 좋지만, 개발 시작을 막는 결정은 아니다.

3. 첫 Beta에는 어느 MVP Option이 적절한가?
   - `Option B - Guided Execution MVP`가 가장 적절하다.

4. P0에서 P1으로 내려야 하는 기능은 무엇인가?
   - Password Reset, Usage UI 상세 대시보드, Tablet 별도 최적화, Tool Public Page, Billing UI, `/app/onboarding` 별도 Route, `/app/usage` 전용 Route는 P1 또는 조건부로 유지한다.

5. 첫 개발 Task는 무엇이어야 하는가?
   - `Goal Input → Recommendation 결과 스냅샷 → Workflow Detail → Save`의 최소 경로를 만드는 Task가 첫 번째가 되어야 한다.
