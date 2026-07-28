# BuildFlow Sprint History

## 1. Document Purpose

이 문서는 Sprint 목적·상태·Commit·Audit의 인덱스다. 상세 Scope와 검증은 각
`sprints/<sprint-id>/` 문서가 Source of Truth이며, 현재 상태는
[`PROJECT_STATE.md`](PROJECT_STATE.md)와 `.buildflow/` 운영 문서를 함께
확인한다.

## 2. Current Sprint

활성 Sprint는 없다. 새 구현은 별도 Scope Freeze와 사용자 승인이 필요하다.

Visual Closed Beta Slice의 User QA와 실제 Supabase DB validation은 병렬 운영
또는 별도 Gate이며, 활성 구현 Sprint를 자동으로 만들지 않는다.

## 3. Sprint History

| Sprint | Purpose | Final Status | Key Commit | Audit Status | Evidence / Documents |
|---|---|---|---|---|---|
| BUILDFLOW-CLARIFICATION-INTERACTION-001 | Requirement Clarification interaction | CLOSED / COMPLETE / FINAL USER QA PASS | `f84e1ad` | Final User QA PASS | `sprints/BUILDFLOW-CLARIFICATION-INTERACTION-001/CLOSEOUT.md` |
| CORE-RUNTIME-002 | Isolated OpenAI Runtime smoke validation | CLOSED / COMPLETE | `30bd0c6` | Independent smoke review PASS | `sprints/CORE-RUNTIME-002/CLOSEOUT.md` |
| MCP-FOUNDATION-001 | MCP registry/readiness/safety contracts | CLOSED / COMPLETE | `619b480` | Independent re-review PASS | `sprints/MCP-FOUNDATION-001/CLOSEOUT.md` |
| AGENT-FOUNDATION-001 | Pure Agent capability, definition and validation foundation | CLOSED / COMPLETE | `fd3aff1` | Independent documentation review PASS | `sprints/AGENT-FOUNDATION-001/CLOSEOUT.md` |
| EVIDENCE-RUNTIME-INTEGRATION-001 | Runtime Evidence persistence and Package references | COMMITTED; closeout status UNKNOWN | `e8b8d60` | REPORT records READY FOR INDEPENDENT RE-REVIEW; later closeout document not found | `sprints/EVIDENCE-RUNTIME-INTEGRATION-001/REPORT.md` |
| RUNTIME-APPROVAL-FOUNDATION-001 | Persisted Runtime approval and atomic consume foundation | COMMITTED / integrated under Runtime Safety closure | `a101b9f` | Independent audit PASS; Live DB validation pending | `sprints/RUNTIME-APPROVAL-FOUNDATION-001/REPORT.md` |
| PRODUCT-RUNTIME-INTEGRATION-001 | Authenticated Product Runtime Bridge | COMMITTED / integrated under Runtime Safety closure | `a101b9f` | Independent audit PASS; Live DB validation pending | `sprints/PRODUCT-RUNTIME-INTEGRATION-001/REPORT.md` |
| RUNTIME-SAFETY-CORRECTION-001 | Runtime/Approval exception safety correction | CLOSED / COMPLETE | `a101b9f`, `06fa299` | Claude independent audit PASS; GPT GitHub review PASS; User Sprint Exit approved | `sprints/RUNTIME-SAFETY-CORRECTION-001/REPORT.md` |

## 4. Gate History

- Closed means implementation and documented exit evidence are complete; it is
  distinct from `IMPLEMENTED`.
- Runtime Approval and Product Runtime changes are committed but are not
  Production Ready. Live DB validation remains separate.
- Visual Closed Beta Slice remains `USER QA / WAITING FOR USER FEEDBACK` in the
  current operating status.

## 5. Update Rules

- Sprint 종료 시 상태, Commit hash와 Audit 결과를 갱신한다.
- Active Sprint는 하나만 기록한다.
- Commit hash 또는 Audit 근거를 확인할 수 없으면 `UNKNOWN`으로 기록한다.
- 상세 구현 내용은 Sprint 문서에 유지하고 이 문서는 이를 복사하지 않는다.
