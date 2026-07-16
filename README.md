# BuildFlow

AI Result Design Platform

현재는 AI System Builder Platform 전환 단계입니다.

제품 도메인 언어는 `docs/project/PROJECT_BIBLE.md`를, 현재 구현 이력은 `MASTER_PLAN.md`를, 현재 작업 상태는 `.buildflow/STATUS.md`를 기준으로 확인합니다. PIVOT-001에서는 문서 도메인만 전환하며 코드·DB·Migration은 변경하지 않습니다.

## Supabase Setup

1. Supabase 프로젝트를 생성합니다.
2. `.env.example`을 `.env.local`로 복사합니다.
3. Supabase URL과 Publishable Key를 입력합니다.
4. `npm run dev`를 실행합니다.
5. `/api/health`에서 연결 상태를 확인합니다.

Database 작업:

```bash
npx supabase migration list
npx supabase db push
npm run db:types
```

Database 구조는 [`docs/07-database.md`](docs/07-database.md)를 참고합니다.

OpenAI API Key와 Model은 server-only 환경변수입니다. ChatGPT Plus 구독과 OpenAI API 과금은 별도일 수 있으므로 API Dashboard에서 결제수단과 사용 한도를 확인합니다. Key 원문은 로그나 채팅에 출력하지 않습니다.

Recommendation 오류 진단 시 개발 서버를 하나만 실행하고 `.next/dev/logs/next-development.log`에서 `recommendation_stage_started`, `recommendation_stage_completed`, `recommendation_stage_failed` 흐름을 확인합니다. 사용자 화면에는 안전한 오류 메시지만 표시됩니다.

Reference Seed 데이터는 [`docs/08-seed-data.md`](docs/08-seed-data.md)에서 확인할 수 있습니다.
Recommendation Engine 설계는 [`docs/09-recommendation-engine.md`](docs/09-recommendation-engine.md)에서 확인할 수 있습니다.

```bash
npm run db:seed
```

## Authentication Setup

Supabase Dashboard의 `Authentication → URL Configuration`에서 다음을 설정합니다.

```text
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/auth/callback
```

Email Provider와 Google Provider가 활성화되어 있어야 합니다. Google OAuth Client의 Callback URL은 Supabase Dashboard가 제공하는 Provider 설정값을 사용하고, Supabase `Authentication → URL Configuration`에는 위 Callback URL을 등록합니다. 로컬 실행 후 `/signup`, `/login`, `/app`에서 Email 및 Google 인증 흐름을 수동 확인합니다. 신규 Auth 사용자는 `handle_new_user()` Trigger를 통해 `profiles`가 자동 생성됩니다. 이 Trigger는 기존 사용자에게 소급 적용되지 않습니다. Service Role Key는 Auth UI에서 사용하지 않습니다.

## Project CRUD

로그인 후 `/app`에서 최근 프로젝트를 확인하고, `/app/projects/new`에서 목표와 조건을 입력해 새 프로젝트를 만들 수 있습니다. `/app/projects`는 보관되지 않은 자신의 프로젝트만 표시하며, 상세 화면에서 기본 수정과 Archive를 지원합니다. Recommendation 생성은 다음 단계에서 추가합니다.

수동 QA: 프로젝트 생성 validation → 상세 이동 → 수정 후 새로고침 → Archive 후 목록에서 숨김 → 추천 결과에서 Workflow 선택 → 실행 가이드 Step 체크를 확인합니다.

## Workflow Experience

추천 결과에서 Workflow를 선택하면 `/app/workflows/[workflowId]` 실행 가이드로 이동합니다. Template Step, 예상 시간, 난이도와 상태를 표시하며 Step 완료 체크는 초기 버전에서 브라우저 로컬 상태로만 유지됩니다.

Workflow Step 완료/취소는 Supabase에 저장되며 새로고침과 재로그인 후에도 유지됩니다. 전체 Step 집계로 진행률과 Workflow 상태를 계산하고, 선택됨·진행 중·완료·보관됨 상태를 표시합니다.

## Dashboard

`/app` Dashboard에서 보관되지 않은 프로젝트 수, Workflow 진행 현황, 평균 진행률, 계속 진행할 Workflow, 최근 프로젝트·추천·활동을 확인할 수 있습니다. 프로젝트가 없으면 목표 예시와 첫 프로젝트 CTA를 표시합니다.

Dashboard 자동 QA는 인증 없는 Route·Health·정적 검증을 우선 수행합니다. 실제 데이터 Summary, Continue Working, 반응형 브라우저 검증은 로그인 세션이 필요하며 수동 인증 QA 대상으로 관리합니다.

## Discovery

인증 사용자 전용 `/app/tools` Tool Explorer와 `/app/workflows/templates` Workflow Library에서 기준 Tool과 Template을 검색·필터링할 수 있습니다. 상세 화면에서 관련 단계와 주요 정보를 확인하고 프로젝트 시작 CTA로 이동할 수 있습니다.

실행 Workflow 상세에서는 Step별 목적, 준비물, 실행 방법, 완료 조건, 주의사항과 결정론적 Prompt Asset을 확인할 수 있습니다. Prompt는 브라우저에서 복사할 수 있으며, 복사 여부는 진행률에 영향을 주지 않습니다. 상세 정보는 프로젝트 Step Snapshot을 우선 사용하고 Template 정보를 fallback으로 사용합니다.

## Requirement Foundation

새 Project를 만들면 Goal Parser가 목표를 Goal Type, Category, Expected Output으로 구조화하고, 우선순위가 있는 Clarification 질문·Constraint 분류·Consent 요구사항을 Requirement Snapshot으로 저장합니다. Capability Calculator는 Automation, Consent, Manual, Expert, Unsupported 지표와 Build Readiness를 계산하며, 질문의 품질이 설계의 품질을 결정합니다. 기존 Recommendation Engine은 호환성을 유지합니다.

`Service Role Key`는 브라우저에 노출하지 않으며, 일반 사용자 요청 처리에 기본 사용하지 않습니다. Key 원문을 로그나 채팅에 출력하지 말고, `.env.local`은 Git에 포함하지 않습니다.
