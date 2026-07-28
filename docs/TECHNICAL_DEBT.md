# BuildFlow Technical Debt

## 1. Document Purpose

이 문서는 현재 Release/Beta 판단에 영향을 주는 기술 부채·검증 부채·운영 위험의
간결한 인덱스다. 상세한 과거 레지스터는
[`project/TECH_DEBT.md`](project/TECH_DEBT.md)에 보존하며 삭제하거나 대체하지
않는다.

## 2. Status Definitions

- `OPEN`: 확인됐지만 아직 작업이 시작되지 않았다.
- `IN PROGRESS`: 승인된 작업에서 해결 중이다.
- `BLOCKED`: 환경 또는 결정 부재로 진행할 수 없다.
- `VALIDATION REQUIRED`: 구현 또는 정책은 있으나 필요한 검증이 남아 있다.
- `CLOSED`: Commit, Sprint Report 또는 독립 Audit 근거가 있다.

## 3. Priority Definitions

- `P0`: 안전성·데이터·출시 Gate를 막는 문제
- `P1`: Beta 품질 또는 유지보수성에 큰 영향을 주는 문제
- `P2`: 현재 Gate를 막지 않는 개선·장기 운영 항목

## 4. Active Debt Register

| ID | Priority | Area | Issue | Evidence | Impact | Required Action | Status | Related Sprint |
|---|---|---|---|---|---|---|---|---|
| TD-ACT-001 | P0 | Runtime Approval | 독립 구현 검토와 실제 DB RPC atomic consume 검증이 남아 있음 | `sprints/RUNTIME-APPROVAL-FOUNDATION-001/REPORT.md` | 승인 1회 소비 경계를 Production Ready로 확정할 수 없음 | 독립 검토 및 승인된 DB 검증 | VALIDATION REQUIRED | RUNTIME-APPROVAL-FOUNDATION-001 |
| TD-ACT-002 | P0 | Product Runtime | 독립 구현 검토와 실제 DB RPC/RLS/concurrent consume 검증이 남아 있음 | `sprints/PRODUCT-RUNTIME-INTEGRATION-001/REPORT.md` | 인증된 제품 실행·Evidence 영속 경로를 출시할 수 없음 | 독립 검토 및 승인된 DB 검증 | VALIDATION REQUIRED | PRODUCT-RUNTIME-INTEGRATION-001 |
| TD-ACT-003 | P1 | Beta E2E / RLS | 인증 브라우저·다중 사용자·실제 RLS 흐름 Evidence가 불완전함 | `project/TECH_DEBT.md` TD-010, TD-011 | Beta Ready 근거가 불완전함 | 인증된 다중 세션 E2E QA | OPEN | BETA-QA follow-up |
| TD-ACT-004 | P1 | Visual Closed Beta | Visual Slice User QA가 대기 상태임 | `.buildflow/STATUS.md` | 해당 사용자 경험의 Exit Gate가 완료되지 않음 | User QA 결과 및 승인된 결함 처리 | VALIDATION REQUIRED | BUILDFLOW-VISUAL-CLOSED-BETA-SLICE-001 |
| TD-ACT-005 | P2 | Operations | backup·장기 monitoring Evidence가 RC 운영 Gate로 남아 있음 | `project/TECH_DEBT.md` TD-014 | 장기 운영 신뢰 근거가 제한됨 | RC operations gate에서 검증 | OPEN | RC operations gate |
| TD-ACT-006 | P2 | Provider Pricing | 비용 추정이 versioned pricing catalog가 아닌 정적 heuristic임 | `project/TECH_DEBT.md` TD-004 | Billing-grade 비용 안내가 아님 | 가격 정책·근거 수립 전 별도 검토 | OPEN | post-MVP pricing policy |

## 5. Closed Debt

| Area | Closed Evidence |
|---|---|
| Clarification Interaction P1-001/P1-002 | `sprints/BUILDFLOW-CLARIFICATION-INTERACTION-001/CLOSEOUT.md`의 Final User QA PASS 및 `f84e1ad` |
| MCP Foundation P1/P2 contract findings | `sprints/MCP-FOUNDATION-001/CLOSEOUT.md`의 independent re-review PASS 및 `619b480` |
| Runtime Evidence P1-001/P1-002 remediation | `sprints/EVIDENCE-RUNTIME-INTEGRATION-001/REPORT.md`의 remediation 기록 및 `e8b8d60` |

## 6. Update Rules

- 새 항목은 근거 경로와 관련 Sprint를 함께 기록한다.
- `CLOSED`에는 Commit, Sprint Report 또는 독립 Audit 근거가 필요하다.
- [`PROJECT_STATE.md`](PROJECT_STATE.md)와 충돌하면 실제 코드·Git 상태·현재
  Sprint 문서를 다시 확인한다.
- 기능 아이디어와 시장 가설은 기술 부채로 등록하지 않는다.
