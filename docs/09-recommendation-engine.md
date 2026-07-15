# BuildFlow

## Recommendation Engine V1

- Version: 1.0
- Status: Active
- Engine Version: `recommendation-v1-rule`
- Last Updated: 2026-07-15

## 1. Purpose

Recommendation Engine V1은 Project의 목표와 조건을 기준으로 Seed된 Workflow Template을 결정론적으로 비교한다. 같은 입력과 같은 기준 데이터는 항상 같은 결과를 만든다. 이번 버전은 OpenAI, Embedding, Web Search를 호출하지 않는다.

## 2. Input

입력은 Project의 `title`, `goal`, `goal_description`, `goal_constraints`에서 읽는다. `goal_constraints`에는 AI 숙련도, 개발 가능 여부, 예산, 자동화 수준, 현재 도구가 들어간다. 입력 원문은 DB에 덮어쓰지 않으며 Engine 내부에서만 정규화한다.

## 3. Normalization

- 앞뒤 공백과 연속 공백을 정리한다.
- 비교용 영문과 도구 이름은 소문자로 변환한다.
- 한국어 목표 원문은 Snapshot의 요약에만 제한적으로 보존한다.
- 현재 도구는 trim, 중복 제거, 빈 값 제거를 적용한다.
- 누락된 조건은 beginner, unknown 등 안전한 기본값을 사용한다.
- 원문 Project 값은 수정하지 않는다.

## 4. Category Classification

초기 Category는 `content`, `productivity`, `email`, `marketing`, `ecommerce`, `data`, `communication`이다. 한국어 Keyword와 phrase의 포함 여부를 세어 여러 Category를 만들 수 있다. 동점은 Template Keyword와 안정적인 이름 정렬로 처리한다. 어떤 단어도 맞지 않으면 `unknown`으로 간주하고 활성 Template을 비교한다.

## 5. Rule Filtering and Fit

현재 Engine은 hard exclusion을 최소화한다. 개발할 수 없는 사용자는 advanced Template에 감점을 받고, beginner 사용자는 advanced 난이도에 낮은 적합도 점수를 받는다. 예산과 자동화 수준은 현재 Seed의 정성적 비용 모델과 실행 지원 수준을 사용해 감점·가점을 계산한다. 이미 사용하는 Tool이 Template Step에 있으면 재사용 점수를 추가한다.

## 6. Score Model

| Component | Maximum |
| --- | ---: |
| Category Match | 30 |
| Goal Keyword Match | 25 |
| Constraints Compatibility | 20 |
| Current Tool Reuse | 10 |
| Difficulty Fit | 10 |
| Execution Support Fit | 5 |

합계는 0~100으로 Clamp하고 정수로 저장한다. Candidate Snapshot에는 모든 breakdown을 저장해 나중에 계산을 검토할 수 있다. LLM은 점수를 수정하지 않는다.

## 7. Candidate Ranking

활성 Template만 조회하고 점수 내림차순으로 최대 3개를 선택한다. 동점이면 Category 점수, Keyword 점수, 난이도, Template 이름 순으로 안정 정렬한다. 첫 후보는 Primary, 나머지는 Alternative로 표시한다. 후보가 1개뿐이면 1개만 반환한다.

## 8. Low Confidence

최고 점수가 `40` 미만이면 `low_confidence`를 true로 저장한다. 결과는 숨기지 않지만 사용자에게 정확히 일치하는 Workflow가 부족해 가장 가까운 결과를 보여준다는 안내를 표시한다. Threshold는 `LOW_CONFIDENCE_THRESHOLD` 상수로 분리되어 있다.

## 9. Cost, Difficulty, Setup Time

V1은 Template Seed의 `cost_model`, `difficulty`, `estimated_setup_minutes`, `execution_support_level`을 그대로 사용한다. 구체적인 월 비용은 계산하지 않는다. 비용 정보가 확정되지 않은 경우 Snapshot에 정성적 주의사항을 보존하고, UI는 확인 필요로 처리할 수 있다. LLM 추정은 하지 않는다.

## 10. Persistence

정상 흐름은 로그인 확인, Project 소유권 확인, Recommendation `pending` 생성, Engine 실행, Candidate 최대 3개 저장, Recommendation `completed` 갱신 순서다. `input_snapshot`에는 Engine Version, 목표 요약, 분류 Category, low confidence를 저장한다. Candidate에는 제목, 요약, 점수, reason, 난이도, 준비 시간, 지원 수준, 비용 모델, breakdown을 Snapshot으로 저장한다.

실패 시 Recommendation을 `failed`로 갱신하고 사용자에게 일반 오류를 표시한다. Candidate 일부 저장 가능성은 남아 있으므로 이후 Transaction 또는 RPC로 원자성을 강화할 수 있다. 일반 사용자 Flow는 Service Role을 사용하지 않는다.

## 11. Duplicate Requests

동일 Project에 `pending` Recommendation이 있으면 새 요청을 만들지 않고 현재 상태 안내로 보낸다. 버튼은 Server Action form으로 연결되며, 다음 UI Task에서 명시적 pending 상태를 더 강화할 수 있다. Recommendation Revision은 V1 범위가 아니다.

## 12. Result UI

Project Detail의 추천 Section에서 추천이 없으면 `추천 설계 만들기` CTA를 표시한다. 결과가 있으면 최대 3개 후보를 Primary/Alternative로 구분하고 점수, 이유, 난이도, 준비 시간, 실행 지원을 표시한다. Workflow 선택과 Project Workflow 생성은 다음 Task로 분리한다.

## 13. Test Strategy

Vitest로 UI와 독립된 순수 함수를 검증한다. 정규화, Category 분류, 점수 Clamp, Tool 재사용, 난이도 적합도, 후보 정렬, low confidence, 기본값, 원문 불변성을 테스트한다. Network와 Supabase 통합은 별도 QA에서 검증한다.

## 14. Future OpenAI Enrichment

S4-002에서 OpenAI는 이미 확정된 후보의 한국어 설명만 생성한다. Responses API와 Zod Structured Output을 사용하며, 한 Recommendation당 요청은 최대 1회다. 가격, 권한, 실행 지원 수준, 최종 점수는 계속 Database 기준 데이터와 Rule Engine이 결정한다. API Key가 없거나 Provider 오류·Timeout·잘못된 출력이 발생하면 Rule 기반 설명으로 Fallback한다. 실제 API 비용과 사용 한도는 OpenAI API Dashboard에서 별도로 관리한다.

## 15. Debugging and Recovery

Recommendation 생성은 `auth`, `project`, `processing-check`, `recommendation-create`, `normalize`, `template-query`, `rule-engine`, `openai`, `candidate-save`, `recommendation-finalize`, `redirect` 단계로 로그를 남긴다. 각 단계는 시작·완료·실패 시각을 기록하고 전체 Goal, 이메일, Cookie, API Key, 전체 UUID, Provider 응답을 로그에 남기지 않는다.

실패 시 안전한 code와 stage만 Query에 전달하고, Recommendation Row가 이미 생성된 경우 `input_snapshot.failure`에 실패 단계와 code를 기록하며 `failed`로 전환한다. OpenAI 실패는 Rule 후보가 정상인 경우 `completed`와 `enrichment.fallback`으로 처리한다. 따라서 Provider 장애가 전체 추천 결과를 가리지 않는다.

개발 환경에서는 Project 상세에 `stage / code`를 작게 표시할 수 있지만 Production에는 표시하지 않는다. 로그는 외부 Logging Service 없이 Next.js 개발 서버 로그를 사용한다. 단일 dev server만 실행하고 `.next/dev/logs/next-development.log`에서 단계 흐름을 확인한다.

주요 사용자 오류 code는 `auth_required`, `project_not_found`, `recommendation_in_progress`, `template_query_failed`, `no_templates`, `candidate_save_failed`, `recommendation_finalize_failed`, `recommendation_failed`다. 사용자에게 Provider 원문이나 Stack Trace를 노출하지 않는다.
