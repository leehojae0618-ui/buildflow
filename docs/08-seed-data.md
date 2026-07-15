# BuildFlow

## Reference Seed Data

- Version: 1.0
- Status: Active
- Last Updated: 2026-07-15
- Source of Truth: `supabase/seed.sql`

## 1. Purpose

이 Seed는 Recommendation Engine V1이 사용할 기준 Tool, Workflow Template, Template Step을 제공한다. 사용자 Project와 Recommendation 결과는 Seed 대상이 아니다. Schema의 Source of Truth는 Migration이며, Seed는 현재 실제 컬럼에 맞는 참조 데이터를 재현한다.

## 2. Seed Inventory

현재 원격 기준 데이터는 다음과 같다.

- Tools: 13개
- Workflow Templates: 10개
- Workflow Template Steps: 44개
- Guided Execution 후보: 2개

### Tools

| Slug | Name | Category |
| --- | --- | --- |
| `openai` | OpenAI | ai |
| `anthropic-claude` | Anthropic Claude | ai |
| `google-gemini` | Google Gemini | ai |
| `n8n` | n8n | automation |
| `supabase` | Supabase | data |
| `gmail` | Gmail | communication |
| `google-sheets` | Google Sheets | data |
| `google-drive` | Google Drive | productivity |
| `slack` | Slack | communication |
| `youtube` | YouTube | content |
| `generic-webhook` | Generic Webhook | automation |
| `pdf-input` | PDF Input | productivity |
| `manual-review` | Manual Review | productivity |

가격은 확정 수치가 아니라 `pricing_model`의 정성적 설명으로만 기록한다. `last_verified`는 Seed를 검토한 날짜이며 Provider 가격의 실시간 보장을 의미하지 않는다.

### Workflow Templates

| Slug | Category | Execution Support |
| --- | --- | --- |
| `blog-draft-generation` | content | guide_only |
| `youtube-shorts-script` | content | guide_only |
| `social-post-generation` | marketing | guide_only |
| `meeting-notes-summary` | productivity | guide_only |
| `pdf-summary-organization` | productivity | guide_only |
| `recurring-report-draft` | data | template_available |
| `email-reply-draft` | email | guide_only |
| `important-email-slack-alert` | communication | template_available |
| `product-description-generation` | ecommerce | guide_only |
| `customer-review-analysis` | data | guide_only |

각 Template은 목표 요약, 필요한 Tool slug, 대체 Tool, 비용 주의사항, 난이도, 예상 설정 시간, 실행 지원 수준을 가진다. 비용 필드는 실제 계산기가 아니며 이후 Cost Rule Engine에서 확장한다.

## 3. Guided Execution Candidates

초기 Guided Execution 후보는 다음 두 개다.

1. `important-email-slack-alert`: Gmail, n8n, Slack 연결과 조건 설정이 필요한 알림 Workflow
2. `recurring-report-draft`: Google Sheets 데이터를 기반으로 반복 보고서를 준비하는 Workflow

이번 Task에서는 n8n JSON이나 실행 API를 만들지 않는다. `template_available`은 향후 Template Handoff 후보라는 의미다.

## 4. Step Rules

각 Step은 실제 Schema의 `workflow_template_id`, `step_order`, `title`, `description`, `tool_id`, `is_required`만 사용한다. 단계 목적과 사용자 행동을 먼저 설명하며 자동 발송이나 자동 게시를 과장하지 않는다. Gmail 발송, SNS 게시, 민감한 PDF 처리는 항상 사용자 검토를 거친다.

현재 Seed는 10개 Template에 총 44개 Step을 연결한다. Tool 연결은 slug를 기준으로 조회하므로 UUID를 Seed 파일에 하드코딩하지 않는다.

## 5. Re-run Safety

```bash
npm run db:seed
```

`tools`와 `workflow_templates`는 slug 기준으로 Insert-if-absent 처리한다. `workflow_template_steps`는 `(workflow_template_id, step_order)` Unique Constraint를 기준으로 Upsert한다. 따라서 Seed를 여러 번 실행해도 UUID가 새로 생기거나 중복 Step이 생성되지 않는다. 기존 기준 Row의 내용 갱신은 별도 승인된 Seed 변경 작업으로 수행하며, 기존 사용자 Project, Recommendation, Project Workflow, Usage 기록은 변경하지 않는다.

Template 삭제는 수행하지 않으며, 기존 기준 데이터는 현재 Seed 정의로 업데이트할 수 있다. 운영 중 변경은 먼저 영향 범위를 검토한다.

## 6. Apply and Verify

```bash
npx supabase migration list
npm run db:seed
npx supabase db query --linked "select count(*) from public.tools;"
npx supabase db query --linked "select count(*) from public.workflow_templates;"
npx supabase db query --linked "select count(*) from public.workflow_template_steps;"
```

검증 기준은 Tool 13개, Template 10개, Step 44개, slug 중복 없음, Template별 Step이 1부터 시작하는 것이다. Dashboard의 Table Editor에서도 `tools`, `workflow_templates`, `workflow_template_steps`를 확인할 수 있다.

## 7. Adding a Template

새 Template을 추가할 때는 다음 순서를 따른다.

1. 기존 Tool로 표현 가능한지 확인한다.
2. 필요한 Tool이 없으면 Tool Seed를 먼저 추가한다.
3. slug, Category, 목표 요약, 실행 지원 수준을 확정한다.
4. 사용자 검토와 제한사항을 Step에 명시한다.
5. `supabase/seed.sql`을 수정하고 재실행한다.
6. 중복, Step 순서, RLS 읽기 정책을 검증한다.

가격과 Provider 기능은 변경될 수 있으므로 검토 날짜와 정성적 설명을 유지한다. 자동 수집이나 가격 자동 갱신은 현재 범위가 아니다.

## 8. Deferred Scope

이번 Seed에서 Tool Public Page, Admin UI, Recommendation Engine, Cost Rule Engine, n8n JSON, 자동 수집은 구현하지 않는다. 기준 데이터가 생겼다는 이유로 해당 기능을 자동으로 활성화하지 않는다.
