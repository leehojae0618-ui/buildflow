# BuildFlow

## Database Architecture

- Version: 1.0
- Status: Active
- Brand Name: BuildFlow
- Internal Codename: Project Flow
- Last Updated: 2026-07-14
- Source Migration: `supabase/migrations/20260714000100_initial_schema.sql`
- Auth Profile Migration: `supabase/migrations/20260714095556_add_profile_creation_trigger.sql`

## 1. Purpose

이 문서는 BuildFlow MVP의 데이터 구조와 접근 원칙을 설명한다. Migration과 RLS의 기준 문서이며, 코드 구현자가 Table 관계와 소유권 모델을 이해하기 위한 안내서다. 실제 Schema의 Source of Truth는 문서가 아니라 `supabase/migrations/`의 SQL Migration이다.

## 2. Design Decisions

- PostgreSQL과 Supabase를 사용한다.
- 모든 주요 식별자는 UUID Primary Key를 사용한다.
- 시간 값은 UTC `timestamptz`로 저장한다.
- Public Schema의 모든 Table은 RLS를 기본 적용한다.
- 사용자 소유 데이터와 공개 가능한 기준 데이터를 분리한다.
- 추천 후보와 선택 Workflow는 당시 결과를 보존하기 위해 JSONB Snapshot을 저장한다.
- MVP에서는 Integration, Execution, Subscription을 생성하지 않는다.
- JSONB는 Snapshot과 유연한 메타데이터에만 사용하며, 관계가 필요한 값은 정규화 Table로 관리한다.

## 3. Table Overview

| Table | Purpose | Ownership | RLS |
| --- | --- | --- | --- |
| `profiles` | 사용자 최소 프로필 | `auth.users.id` | 자기 Profile |
| `projects` | 목표 단위 작업 | 사용자 | 자기 Project |
| `tools` | Tool 기준 데이터 | 관리 기준 | 활성 행 read-only |
| `workflow_templates` | 검증된 Workflow 기준 데이터 | 관리 기준 | 활성 행 read-only |
| `workflow_template_steps` | Template 단계 | Template 기준 데이터 | 활성 Template read-only |
| `recommendations` | Project별 추천 실행 | 사용자 | 자기 Recommendation |
| `recommendation_candidates` | 추천 후보 최대 3개 | Recommendation 소유자 | 자기 Recommendation |
| `project_workflows` | 선택 Workflow와 상태 | Project 소유자 | 자기 Project |
| `project_workflow_steps` | 선택 Workflow의 단계 | Project Workflow 소유자 | 자기 Workflow |
| `usage_records` | 사용량 이벤트 기록 | 사용자 | 자기 기록 조회·등록 |

## 4. Core Relationships

```text
auth.users
├── profiles
├── projects
│   ├── recommendations
│   │   └── recommendation_candidates
│   └── project_workflows
│       └── project_workflow_steps
└── usage_records

workflow_templates
├── workflow_template_steps
└── recommendation_candidates

tools
└── workflow_template_steps
```

`profiles`, `projects`, `recommendations`, `usage_records`는 `auth.users`를 직접 참조한다. Recommendation 후보는 Recommendation과 Template을 참조하고, Project Workflow는 Project·Template·Recommendation을 참조한다. 각 단계 Table은 부모 삭제 시 함께 삭제된다.

## 5. User-Owned Tables

사용자 소유 Table은 `auth.uid()`를 기준으로 접근을 제한한다. `profiles`는 행의 `id`, `projects`는 `user_id`, `recommendations`는 `user_id`와 Project 소유권을 함께 확인한다. 후보, Workflow, Workflow Step은 부모 관계를 따라 소유권을 검증한다. 사용자가 다른 사용자의 `project_id`를 입력해도 Policy의 `exists` 검사에서 차단된다.

`usage_records`는 사용자가 자기 이벤트를 조회하고 등록할 수 있지만, 서버 측 사용량 기록 정책을 도입할 때 조작 가능 범위를 별도 Migration에서 더 줄일 수 있다. 현재 일반 사용자 Flow는 Service Role에 의존하지 않는다.

## 6. Reference Data Tables

`tools`, `workflow_templates`, `workflow_template_steps`는 관리 기준 데이터다. `anon`과 `authenticated`는 활성 Tool과 Template을 읽을 수 있지만, 일반 사용자에게 Insert, Update, Delete Policy를 제공하지 않는다. Seed 또는 명시적인 관리자 작업에서만 변경한다.

## 7. Snapshot Strategy

`recommendation_candidates.snapshot`은 추천 시점의 후보 설명·조건을 보존한다. `project_workflows.snapshot`은 사용자가 선택한 Workflow의 당시 정의를 보존하고, `project_workflow_steps.snapshot`은 단계별 당시 정보를 보존한다.

이 방식은 Template이 나중에 변경되어도 기존 사용자 결과, 추천 당시 비용과 설명, 선택 Workflow의 Version 안정성을 유지한다. 단점은 중복 데이터와 정합성 관리 비용이다. MVP에서는 최신 Template의 복잡한 동기화보다 안정적인 조회를 우선한다.

## 8. RLS Summary

- 10개 Table 전체에 RLS를 활성화한다.
- 사용자 자원은 자기 소유 데이터만 조회·수정한다.
- 기준 데이터는 활성 행에 대한 읽기만 허용한다.
- 일반 사용자의 기준 데이터 수정은 허용하지 않는다.
- Recommendation 후보는 부모 Recommendation 소유권을 확인한다.
- Usage 기록은 자기 사용자 ID로만 조회·등록한다.
- Service Role은 일반 앱 요청 처리에 사용하지 않는다.

현재 Migration에는 16개의 Policy가 있다. RLS 우회가 필요한 관리 작업은 명시적인 서버 내부 Admin Client에서만 수행한다.

## 9. Trigger and Index

`public.handle_new_user()`는 `auth.users` Insert 후 `public.profiles`에 최소 Profile을 생성하고, `on conflict (id) do nothing`으로 중복을 방지한다. `on_auth_user_created` Trigger는 `security definer`와 명시적인 빈 `search_path`를 사용하는 새 Migration에서 정의된다. 이 자동 생성은 신규 Auth 사용자에게만 적용되며 기존 사용자에게 소급되지 않는다.

`public.set_updated_at()` Trigger Function은 `profiles`, `projects`, `tools`, `workflow_templates`, `recommendations`, `project_workflows`의 변경 시 `updated_at`을 UTC 현재 시각으로 갱신한다. 단계와 Usage 기록처럼 변경 시각이 필요하지 않은 Table에는 `updated_at`을 두지 않는다.

주요 Index는 사용자별 Project 정렬, Project별 Recommendation, Recommendation별 후보, Project별 Workflow, Workflow별 단계, 사용자별 Usage 정렬, Template별 단계 조회에 사용한다. 후보 Rank는 Recommendation별 1~3 범위 Check와 Unique Constraint로 보장한다.

## 10. Migration Workflow

```bash
npx supabase migration new <name>
npx supabase db push
npm run db:types
```

원격에 적용된 Migration은 직접 수정하지 않는다. Schema 변경은 새 Migration으로 만들고, Dashboard에서 Production Schema를 수동 변경하지 않는다. 삭제나 데이터 손실을 일으킬 수 있는 변경은 별도 승인을 받는다.

## 11. Type Generation

생성 파일은 `src/types/database.ts`다. 다음 명령으로 연결된 Public Schema에서 타입을 재생성한다.

```bash
npm run db:types
```

자동 생성 파일은 수동 편집하지 않는다. Browser, Server, Admin Supabase Client는 모두 `Database` Generic을 사용하며, Schema 변경 후 타입을 다시 생성한다.

## 12. Deferred Tables

초기에는 다음 Table을 만들지 않는다.

- `integrations`: 외부 연결 UX가 확정된 후 추가
- `executions`: 실제 실행 기능은 MVP 후순위
- `subscriptions`: 초기 Beta Billing 제외
- `teams`, `organizations`: 협업 기능 제외
- `notifications`: 알림 요구가 확정된 후 추가

## 13. Security Notes

- Service Role Key는 server-only이며 브라우저에 노출하지 않는다.
- 사용자 데이터 Table에 RLS 없이 출시하지 않는다.
- Client 입력만으로 사용자 소유권을 신뢰하지 않는다.
- Secret과 사용자 입력을 무조건 로그에 저장하지 않는다.
- Production Schema는 Migration으로만 변경한다.
