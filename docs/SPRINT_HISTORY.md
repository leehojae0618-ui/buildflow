# BuildFlow Sprint History

## 1. Document Purpose

이 문서는 Sprint 목적·상태·Commit·Audit의 인덱스다. 상세 Scope와 검증은 각
`sprints/<sprint-id>/` 문서가 Source of Truth이며, 현재 상태는
[`PROJECT_STATE.md`](PROJECT_STATE.md)와 `.buildflow/` 운영 문서를 함께
확인한다.

## 2. Current Sprint

활성 Sprint는 없다. `PRODUCT-RUNTIME-VERTICAL-SLICE-001`은
`SCOPE FROZEN / IMPLEMENTATION NOT APPROVED` 후보이며, 구현에는 별도 사용자
승인이 필요하다.

`LIVE-DB-VALIDATION-001`은 `PAUSED / BLOCKED BY LOCAL ENVIRONMENT`다. 이는
종료나 저장소 구현 실패가 아니며, Local Supabase 환경의 반복 healthcheck
실패를 보존한 상태다. 원격 검증은 별도 승인 Gate다.

`LV5-NO-KEY-REMEDIATION-001`은 CLOSED / COMPLETE / USER SPRINT EXIT APPROVED
상태이며,
`BUILDFLOW-VISUAL-CLOSED-BETA-SLICE-001`은 IMPLEMENTED / USER QA / WAITING
FOR USER FEEDBACK 상태다. 두 상태 모두 활성 implementation Sprint를 만들지
않는다.

`BF0-UX-SIMPLIFICATION-001`은 CLOSED / COMPLETE / USER SPRINT EXIT APPROVED
상태다. 다음 Product Runtime 후보는 Scope Frozen 상태일 뿐 active
implementation이 아니다.

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
| LIVE-DB-VALIDATION-001 | Local Supabase validation planning and dry-harness preparation | PAUSED / BLOCKED BY LOCAL ENVIRONMENT | `7a9d63a`, `b4eb63f` | Local startup healthcheck failure; no further Local startup authorized | `sprints/LIVE-DB-VALIDATION-001/` |
| LV5-NO-KEY-REMEDIATION-001 | No-Key n8n readiness, Guest Lab, and local `USER_SUBMITTED` Evidence/Verdict flow | CLOSED / COMPLETE / USER SPRINT EXIT APPROVED | `54bbc895` | Independent audit PASS after F1/F2 correction; Browser QA, actual n8n Import, and real Make Configuration remain NOT VERIFIED | `sprints/LV5-NO-KEY-REMEDIATION-001/REPORT.md` |
| BF0-PRODUCT-EXPERIENCE-001 | UI-only Product Experience journey and homepage entry | CLOSED / COMPLETE | `15746f14`, `51011d66` | User Persona QA PASS; User Visual QA PASS; P0/P1/P2 0/0/0; User Sprint Exit approved | `sprints/BF0-PRODUCT-EXPERIENCE-001/EXIT.md` |
| BF0-UX-SIMPLIFICATION-001 | BF0 UX simplification and guided build experience | CLOSED / COMPLETE / USER SPRINT EXIT APPROVED | `84ac5e2` | Codex regression PASS; final browser gap check PASS; GPT final review PASS; Claude final audit SKIPPED BY PRODUCT OWNER | `sprints/BF0-UX-SIMPLIFICATION-001/REPORT.md`, `sprints/BF0-UX-SIMPLIFICATION-001/CLOSEOUT.md` |

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
