# BuildFlow Sprint History

## 1. Document Purpose

이 문서는 Sprint 목적·상태·Commit·Audit의 인덱스다. 상세 Scope와 검증은 각
`sprints/<sprint-id>/` 문서가 Source of Truth이며, 현재 상태는
[`PROJECT_STATE.md`](PROJECT_STATE.md)와 `.buildflow/` 운영 문서를 함께
확인한다.

## 2. Current Sprint

`LIVE-RECIPE-AI-NEWS-001`은 CLOSED / COMPLETE다. C1(News RSS), C2(Groq
요약), C3 guarded path(Slack write) 각각의 독립 검증에 이어, News → Groq →
Guarded Slack을 하나의 코드 경로로 연결한 **Composite Recipe E2E가
2026-08-16 라이브로 VERIFIED**됐다 (`runNewsToGroqToSlackGate`, 1회 승인
실행, 결과 `slackWriteStatus: SUCCEEDED`, `safeSlackReference:
pd_8c2fc1fe3318`; 상세는 `sprints/LIVE-RECIPE-AI-NEWS-001/REPORT.md`
"Update — 2026-08-16: Composite Manual Recipe E2E Live Verification" 참고).
write kill switch는 해당 단일 명령에만 인라인으로 켰고 `.env.local`은
변경하지 않아 평시 `false`를 유지한다. 이어서 같은 날 `RECIPE-EXECUTION-
CONTRACT-001`이 진행되어 AI-news 전용 코드였던 Input/Processor/Destination
조각을 제네릭 Recipe Execution Contract(Trigger/Input/Processor/
Destination/Approval/Evidence)에 맞춘 얇은 adapter로 감쌌다 (기존 guarded
경로는 무수정, 회귀 테스트 4건 추가, 953개 테스트 전체 PASS). 두 Sprint
모두 종료되어 현재 활성 Sprint는 없다; 다음은 로드맵 Step 3(자연어 →
Recipe 변환)이다. 관련 커밋은 로컬 `57eb5d6`까지 GitHub `main`에 Push
완료됐다 (2026-08-16); `RECIPE-EXECUTION-CONTRACT-001`의 커밋은 별도
승인 대기 중이다.

이 Sprint의 `c7674f0` 커밋은 live-execution 승인 범위를 넘어 별도 Commit
승인 없이 생성된 절차 위반(P1)이었다. 소급 승인으로 위장하지 않고, 커밋
유지 자체를 사후에 별도 승인받은 사실로 기록한다.
`PRODUCT-RUNTIME-VERTICAL-SLICE-001`의 controlled runtime 구현은 main
`609eb083`에서 관찰됐으며, 과거 implementation authority provenance는 소급
주장하지 않는다.

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
| PRODUCT-RUNTIME-REAL-AI-SLICE-001 | Direct-input customer-reply Real-AI product path with a disabled-by-default live Provider gate | COMMITTED / pushed | `e3d0f1f` (pushed) | Browser QA NOT VERIFIED; actual Provider, DB, and external calls NONE | `sprints/PRODUCT-RUNTIME-REAL-AI-SLICE-001/` |
| RECIPE-FIRST-PRODUCT-RESET-001 | Recipe-first product direction reset | COMMITTED / pushed | `ebd0290` (pushed) | — | `sprints/RECIPE-FIRST-PRODUCT-RESET-001/` |
| RECIPE-FIRST-BUILD-PACKAGE-001 | Recipe-first build flow / package assembly | COMMITTED / pushed | `ebd0290` (pushed) | — | `sprints/RECIPE-FIRST-BUILD-PACKAGE-001/` |
| FIRST-LIVE-RECIPE-E2E-001 | Guarded Pipedream development Slack OAuth/account verification and one approved Slack test write | CLOSED / COMPLETE / LIVE VERIFIED | `a568a15` (pushed) | GPT PM/CTO PASS; Slack API `ok: true`, ts `1786778717.560079`; Deploy NOT PERFORMED | `sprints/FIRST-LIVE-RECIPE-E2E-001/REPORT.md`, `sprints/FIRST-LIVE-RECIPE-E2E-001/CLOSEOUT.md` |
| LIVE-RECIPE-AI-NEWS-001 | Manual AI news to summary to guarded Slack Recipe | CLOSED / COMPLETE — C1, C2, C3 guarded path, and Composite C1->C2->C3 E2E all VERIFIED (Composite live 2026-08-16) | `57eb5d6` (pushed) | C1 RSS PASS; C2 Groq PASS; C3 guarded path VERIFIED; Composite News->Groq->Guarded Slack E2E VERIFIED LIVE (`safeSlackReference: pd_8c2fc1fe3318`); Scheduler/Deploy NOT PERFORMED | `sprints/LIVE-RECIPE-AI-NEWS-001/PLAN.md`, `sprints/LIVE-RECIPE-AI-NEWS-001/TASK.md`, `sprints/LIVE-RECIPE-AI-NEWS-001/REPORT.md` |
| AGENT-BUILD-JOURNEY-UI-001 | Autonomous/Runtime-first (Legacy) path UI — `AgentBuildJourney` wired into `requirement-summary.tsx` | COMMITTED / pushed, out of LIVE-RECIPE-AI-NEWS-001 authority | `07f71ce` (pushed) | Committed as a separate, independently reviewable commit on explicit user direction; no implementation authority beyond that commit asserted | `src/features/autonomous/components/agent-build-journey.tsx` |
| RECIPE-EXECUTION-CONTRACT-001 | Generic Trigger/Input/Processor/Destination/Approval/Evidence Recipe Execution Contract, adapted from the AI-news Recipe without changing its guarded behavior | CLOSED / COMPLETE | `234b07a` (pushed) | typecheck/lint PASS; 953 tests PASS (+4 equivalence tests, 0 regressions); no live execution | `sprints/RECIPE-EXECUTION-CONTRACT-001/TASK.md`, `sprints/RECIPE-EXECUTION-CONTRACT-001/CONTRACT.md`, `sprints/RECIPE-EXECUTION-CONTRACT-001/REPORT.md` |
| RECIPE-CLARIFICATION-COMPLETION-001 | Let a user answer a Build Package's missing-information questions and complete it client-side (roadmap Step 4) | CLOSED / COMPLETE, browser interaction NOT VERIFIED (no headless-browser tool available) | `5d3ffbb` (pushed) | typecheck/lint PASS; 956 tests PASS (+3 tests, 0 regressions); no live execution | `sprints/RECIPE-CLARIFICATION-COMPLETION-001/TASK.md`, `sprints/RECIPE-CLARIFICATION-COMPLETION-001/REPORT.md` |
| BUILD-PLAN-APPROVAL-DISPLAY-001 | Show a Build Package's cost and required-approvals fields, already computed but never rendered (roadmap Step 5) | CLOSED / COMPLETE, browser interaction NOT VERIFIED | `f7152eb` (pushed) | typecheck/lint PASS; 956 tests PASS, 0 regressions; no live execution | `sprints/BUILD-PLAN-APPROVAL-DISPLAY-001/TASK.md`, `sprints/BUILD-PLAN-APPROVAL-DISPLAY-001/REPORT.md` |
| RECIPE-MANUAL-RUN-001 | First UI-reachable "Recipe 실행" button for the composite AI-news Recipe, gated by a new Server Action boundary that closes a found safety gap (C1/C2 previously had no runtime-level kill switch) (roadmap Steps 7+8) | IMPLEMENTED / VALIDATED, browser interaction NOT VERIFIED, LIVE EXECUTION NONE | pending | typecheck/lint PASS; 961 tests PASS (+5 tests incl. 2 fetch-spy safety tests), 0 regressions | `sprints/RECIPE-MANUAL-RUN-001/TASK.md`, `sprints/RECIPE-MANUAL-RUN-001/CONTRACT.md`, `sprints/RECIPE-MANUAL-RUN-001/REPORT.md` |

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

## 6. Completed Lifecycle Closed

Moved from `.buildflow/STATUS.md` (Governance v2 STATUS trim, 2026-08-16) so
STATUS.md can stay current-state-only.

- `LV5-NO-KEY-REMEDIATION-001`: CLOSED / COMPLETE / USER SPRINT EXIT APPROVED.
- Technical lifecycle: IMPLEMENTED / VALIDATED / INDEPENDENT AUDIT PASS /
  COMMITTED / PUSHED.
- Checkpoint: `54bbc89529c735445b1ef68ea68195c317ea3877`.
- User Sprint Exit: APPROVED — 2026-08-10.
- Browser QA: NOT VERIFIED / separate gate.
- Actual n8n Import: NOT VERIFIED / separate gate.
- Real Make Configuration: NOT VERIFIED / separate gate.
- External execution: NOT VERIFIED.
- Deploy: NOT PERFORMED.

## 7. Historical Runtime and Foundation State

Moved from `.buildflow/STATUS.md` (Governance v2 STATUS trim, 2026-08-16).

- Claude Plan Re-Audit: COMPLETE / CONDITIONAL APPROVAL
- P1 Document Corrections: COMPLETE
- Dry Harness Implementation: COMPLETE / PUSHED — `b4eb63f`
- Claude Implementation Audit: PASS
- GPT GitHub Review: PASS
- Runtime Safety Correction: CLOSED / COMPLETE / User Sprint Exit approved
- Runtime Safety Checkpoints: `a101b9f` / `06fa299`
- Product Runtime Integration: COMMITTED / included in `a101b9f` / Live DB validation not verified
- Runtime Approval Foundation: COMMITTED / included in `a101b9f` / Live DB validation not verified
- MCP Foundation: CLOSED / COMPLETE / INDEPENDENT RE-REVIEW PASS
- MCP Foundation Checkpoints: `e3344f2` / `4c4b3b6` / `619b480`
- MCP Foundation Implementation Authority: NONE
- Production Changes Authorized: NO — LIVE DB VALIDATION REQUIRED
- Clarification Sprint: CLOSED / COMPLETE / FINAL USER QA PASS — `f84e1ad`
- Clarification Implementation Authority: NONE
- CORE-RUNTIME-002: CLOSED / COMPLETE / INDEPENDENT SMOKE REVIEW PASS — `30bd0c6`
- Visual Closed Beta Slice: USER QA / WAITING FOR USER FEEDBACK
- Visual Slice Implementation Authority: PAUSED — USER QA
- Visual Slice Production Changes: NO — QA FINDING REQUIRED
- Runtime Step Contract: AMENDED / INITIAL-RETRY DISCRIMINATOR / REVALIDATION COMPLETE
- Previous Runtime Step Contract Checkpoint: `730bde8`
- Latest Contract Amendment Checkpoint: `59aa291`
- Previous Field-Matrix Amendment Checkpoint: `ca54d12`
- Contract Amendment Scope: attemptNumber and predecessor validation only
- Runtime Step Contract Reopened: YES — limited initial/retry discriminator
- Previous Result Implementation Sprint Closeout: `3873534`
- RuntimeExecutionResult: COMPLETE / VALIDATED (`871824e`)
- Runtime Step Implementation Approval: HISTORICAL / REVALIDATED
- Runtime Step Implementation Scope: HISTORICAL / LOCKED
- Runtime Step Implementation Approval Checkpoint: `e743068`
- Runtime Step Implementation Authority: HISTORICAL / EXPIRED
- Runtime Step Status: IMPLEMENTATION COMPLETE
- Runtime Implementation Status: COMPLETE / INDEPENDENTLY REVIEWED / PASS
- Implementation Completion: COMPLETE
- Independent Implementation Review: PASS
- Historical Runtime Step Implementation Checkpoint: `13a2c26`
- Initial/Retry Implementation Checkpoint: `6764c03`
- Test Coverage Issue-Resolution Checkpoint: `6de9421`
- Runtime Step Independent Implementation Re-review:
  `RUNTIME-STEP-INDEPENDENT-IMPLEMENTATION-REREVIEW-001` — PASS
- Remaining Findings: P0 0 / P1 0 / P2 0
- Merge Execution: COMPLETE — ALREADY INTEGRATED INTO LOCAL MAIN
- Merge Command: NOT REQUIRED
- Remote Update: COMPLETE — `origin/main` synchronized at `b4eb63f`
- Push Execution: COMPLETE — normal push; no force push used
- Future Push Authorization: NOT GRANTED (historical; superseded by later Push approvals recorded per-Sprint)
- Deploy Authorization: NOT GRANTED
- Open Gates (historical): Visual Slice User QA; separately approved remote or
  alternative LIVE-DB validation.
- Historical Runtime Step Push / Merge: COMPLETE at `883666f`; CORE-RUNTIME-002
  direct push: COMPLETE at `30bd0c6`; Deploy: NOT PERFORMED
- Product Focus: AI Agent automatic build, deployment, verification, and BPS
  Package sharing. General Web App and Platform expansion is on hold.
