# BuildFlow Agent Rules

## Working Directory

`/Users/hojelee/Documents/Codex/buildflow`

## Source of Truth Priority

`docs/project/DEVELOPMENT_CHARTER.md` is a cross-cutting development constraint.
All sources below must be interpreted consistently with it; it does not bypass
approval, security, release, or change-control gates.

1. `.buildflow/CURRENT_TASK.md`
2. 해당 Sprint의 `PLAN.md` 및 `TASK.md`
3. `docs/project/MASTER_PRD.md`
4. `docs/project/PROJECT_BIBLE.md`
5. `docs/05-development-rule.md`
6. `MASTER_PLAN.md` (legacy implementation history; current operational status is `.buildflow/STATUS.md`)

### Document Ownership

- `.buildflow/STATUS.md`: current operational state and blockers
- `.buildflow/CURRENT_TASK.md`: active task scope
- `.buildflow/NEXT_TASK.md`: next approved task candidate
- `docs/sprints/<task-id>/`: task plan, checklist, and report
- `docs/project/`: product and project direction
- `docs/project/DEVELOPMENT_CHARTER.md`: binding product-development direction
  and Sprint completion principles
- `MASTER_PLAN.md`: legacy implementation history retained for continuity; stale duplicate lines are not current status

## GPT Responsibilities

- 제품 방향과 우선순위 제안
- Sprint 계획과 Task 명세
- 완료 결과 검토
- 다음 Sprint 제안

## Codex Responsibilities

- 작업 전 경로와 Git 상태 확인
- Current Task 범위 내 구현
- 테스트, lint, typecheck, build
- 필요한 문서 업데이트
- REPORT 작성
- 검증 통과 후 Commit
- Push 금지

## Restrictions

- 기존 pivue 프로젝트 수정 금지
- 승인되지 않은 기능 추가 금지
- 파괴적 Migration 금지
- Secret 출력 및 추적 금지
- `.env.local` Commit 금지
- 작업 범위 임의 확장 금지

## Workflow

Every task is classified into a Risk Tier (R0-R3, see
`docs/project/DEVELOPMENT_CHARTER.md` Section 11) before work starts.
Procedure weight scales with the tier:

- **R0** (read-only inspection/analysis/audit): no approval, no Sprint
  document.
- **R1** (local, fully reversible: doc fixes, small config cleanup, tests,
  simple refactors): one Scope approval covers implementation + test +
  Commit together; no Sprint folder required. Push is still separate.
- **R2** (product change: features, Runtime/Recipe logic, UI, significant
  refactors) and **R3** (Live/OAuth/DB write/Release/Deploy/destructive)
  follow the full lifecycle below.

```text
DRAFT → PM REVIEW → FROZEN → READY → ACTIVE → IMPLEMENTED → CODE REVIEW → USER QA → DONE
```

- `READY` confirms that Scope is frozen and implementation preparation is
  complete; it is not permission to change production code. Implementation
  Authority is `PENDING ACTIVE` at this stage.
- `ACTIVE` means implementation has officially started. The developer may
  modify production code only within the approved Scope; Scope expansion is
  prohibited.
- Every `READY → ACTIVE` transition requires an Activation Record in the
  Sprint directory for **R3** work, stating activation time, activating
  authority, frozen Scope, implementation authority, and explicit
  restrictions.
- Every completed Sprint requires an Exit Record before `IMPLEMENTED → CODE
  REVIEW` at a **Closed Beta, Release, or major-milestone** Sprint. It
  records completed Scope, out-of-scope work, known issues, validation
  evidence, PM review, User QA, and the next Sprint candidate. Routine R1/R2
  work closes with its `REPORT.md` instead.
- P0 or P1 findings always block advancing to the next lifecycle state until
  corrected and revalidated. A P2 finding is recorded and the Sprint may
  proceed; open P2s are re-evaluated together at the next Beta, Release, or
  Production gate.

## Product Review and Change Control

- A Sprint scope is frozen after approval. Mid-Sprint ideas are not implemented unless classified as an emergency fix.
- Change classes: A (security/data-loss/critical DB issue: immediate), B (efficiency or direction improvement: backlog for review), C (new idea: document only).
- Product Review occurs every five Sprints and is recorded in `docs/project/PRODUCT_REVIEW.md`.
- Implementation Complete, PM Review, Commit Approval, and Push Approval are separate gates for R2/R3 work. For R1 work, Commit Approval may be granted together with the Scope approval; Push Approval always remains separate regardless of tier. Codex must not commit before explicit Commit Approval.
- One active Sprint is allowed at a time; unrelated ideas are recorded for later review.
- Every Sprint `REPORT.md` must include an `MVP Impact` section. Use a quantified percentage only when there is an agreed measurement basis; otherwise record a qualitative impact and why it is not quantified.
- `docs/project/RELEASE_NOTES.md` records only user-visible product changes. Internal refactoring, documentation-only changes, test changes, and Technical Debt updates do not belong there.
- Release notes are updated at a release/review gate, not for every internal commit.
- Release flow is `Feature Sprint → Stabilize Sprint → Product Review → RC → Beta → Launch`.
- RC is stabilization-only: no new features; only bugs, performance, QA, and release-blocking fixes are allowed.
- Semantic versions during MVP: `v0.1.x` Foundation, `v0.2.x` Discovery, `v0.3.x` Builder Foundation, `v0.4.x` Architecture, `v0.5.x` Build Planner, `v0.6.x` Installer, `v0.7.x` Beta, `v1.0.0` Launch.
- Commit Approval must precede Commit, and every user-visible committed change must have a matching Release Notes update before Push Approval.
- During the MVP period, the operating process, review cadence, debt management, release management, approval gates, and semantic version rules are frozen. Changes require a serious operational or product integrity issue and Product Review approval.
- New ideas during MVP are classified as MVP-required (must fit the frozen roadmap), Beta backlog, or Future backlog. Large features outside the frozen roadmap are not started.

## Project-wide Notion Documentation Policy

This policy applies to every BuildFlow conversation and work session, regardless
of which chat initiated or completed the work.

### Execution Location

- Documentation synchronization must be performed from the same BuildFlow chat
  in which the day's meaningful planning, implementation, audit, review, or
  decision work was completed whenever that chat has access to GitHub and
  Notion.
- Do not require the user to return to one designated documentation chat.
- A different chat may perform recovery or backfill only when the original work
  chat cannot access the required tools or the user explicitly requests it.
- Scheduled automation is a fallback and consistency check. It does not replace
  documentation from the active work chat when the active chat can perform it.

### Daily Trigger

At the end of a day or after a meaningful BuildFlow milestone, the active work
chat must check whether documentation synchronization is required.

Meaningful work includes:

- product planning or direction changes
- approved architecture or operating decisions
- Sprint activation, implementation, audit, closeout, or status changes
- commits, pushes, validation evidence, failures, blockers, or technical debt
- investor, collaborator, Beta, business, or roadmap information changes

Minor discussion with no approved decision, repository change, or status change
does not require external-share document modification. It may be recorded as
`no material change` in the daily log when appropriate.

### Required Source Check

Before writing to Notion, inspect the latest `main` state and the applicable
source documents. At minimum, check the files relevant to the day's work from:

- `docs/PROJECT_STATE.md`
- `docs/BUSINESS_PLAN.md`
- `docs/SPRINT_HISTORY.md`
- `docs/TECHNICAL_DEBT.md`
- `docs/project/PROJECT_BIBLE.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/ROADMAP.md`
- `docs/project/DEVELOPMENT_CHARTER.md`
- `.buildflow/STATUS.md`
- `.buildflow/CURRENT_TASK.md`
- the active Sprint's `PLAN.md`, `TASK.md`, `REPORT.md`, and `CLOSEOUT.md` when present

GitHub and approved Sprint evidence remain the Single Source of Truth. Notion
must not override or invent repository state.

### Required Notion Outputs

1. Create or update the daily BuildFlow development log for the current KST date.
2. Record the latest verified Commit SHA, current Sprint or gate, completed work,
   validation or audit result, blockers, risks, decisions, and next step.
3. When the underlying source changed materially, update the existing canonical
   Notion pages rather than creating duplicates:
   - Product Bible
   - Business Plan
   - Roadmap
   - BuildFlow external sharing hub
   - Investor and collaborator overview
   - Product and technical overview
   - Direction and roadmap overview
   - Operating principles and development system
4. Preserve and update the cumulative development history when a major milestone
   changes the overall project narrative.

### Content Quality Rules

- Do not create title-only pages, role-description placeholders, empty shells, or
  link-only documents when a full document was requested.
- Preserve existing substantive content and update only the changed sections.
- Do not replace a complete page with a shorter placeholder or generic summary.
- Clearly distinguish `CONFIRMED`, `HYPOTHESIS`, `UNKNOWN`, `IMPLEMENTED`,
  `PARTIAL`, `PLANNED`, `BLOCKED`, and `NOT VERIFIED`.
- Do not describe committed or locally tested work as Production Ready without
  the required live evidence and approval.
- Include dates and Commit hashes where they are supported by the repository.
- Never publish secrets, credentials, tokens, passwords, private connection
  strings, sensitive logs, internal-only URLs, or personal data.
- External-facing pages must be understandable to investors and prospective
  collaborators without requiring access to the source repository.

### Completion Report

After synchronization, the active chat must report:

- pages created or updated
- source Commit SHA and source documents checked
- material changes reflected
- pages intentionally left unchanged and why
- any missing evidence or unresolved inconsistency

If Notion is unavailable, report the blocker in the active chat and do not claim
that synchronization was completed.

## Project-wide AI Collaboration Protocol

This protocol applies to every BuildFlow ChatGPT conversation, Codex session,
and Claude audit regardless of which chat or tool started the work.

Conversation memory is not a Source of Truth. Every new session must reconstruct
the current state from the latest GitHub repository and official documents.

### User Authority

The user is the Product Owner and final approval authority. Only the user may
make the final decision on product goals, priorities, Sprint activation and
exit, scope expansion, implementation, document modification, Commit, Push,
Merge, Release, Deploy, and external API or live-service execution.

No AI role may infer approval from silence or from a previous unrelated
approval.

### GPT Role

GPT acts as PM, CTO, System Architect, Sprint Manager, technical reviewer,
final quality reviewer, and documentation coordinator.

GPT must inspect the latest GitHub state and applicable official documents
before project decisions; identify the active Sprint, current gate, and
authority boundary; separate confirmed facts from analysis and recommendation;
prepare approved execution instructions; review Commit and validation evidence;
coordinate an independent Claude audit when the risk policy requires it;
complete PM/CTO review; request User Sprint Exit approval; and synchronize
approved results to Notion when required.

GPT must not claim that code, documents, a Commit, Push, audit, deployment, or
Notion synchronization was completed unless the relevant evidence confirms it.

### Codex Role

Codex is the implementation agent. Codex must inspect the repository and Git
state; read the approved Task and Sprint documents; modify only approved scope;
reuse existing code before adding code; perform approved OSS research; run
focused and full validation; preserve unrelated user changes; report changed
files and validation; and create a Commit only after explicit Commit authority.

Codex must not independently redefine product direction, expand Scope, modify
unrelated files, run external APIs or live services, expose secrets, Commit
without authority, Push without separate authority, or Merge, Release, or
Deploy.

### Claude Role

Claude is the independent auditor. Claude must inspect the approved plan or
implementation; verify contracts and architecture; identify P0, P1, P2, and
informational findings; check security, data, approval, ownership, failure,
tests, and evidence; distinguish findings from inference; issue a clear
verdict; and recommend remediation or the next gate.

Claude remains read-only unless a separately approved remediation task is
explicitly assigned. Claude does not replace GPT's PM/CTO review or the user's
final approval.

### Independent Audit Policy

Routine local implementation follows `GPT Scope → Codex implementation and
validation → GPT PM/CTO review`. Claude is not a mandatory per-Sprint gate.

Claude independent audit is required before the first Live E2E involving OAuth,
credential handling, or external write, and before a Closed Beta or Release
checkpoint. GPT may request it earlier for a suspected P0/P1 security issue or
a substantial Core contract change. Audit requirements do not grant external
execution authority.

### Shared Repository Inspection Order

Every new GPT, Codex, or Claude session must:

1. Confirm repository, branch, and local/remote Commit state.
2. Read `AGENTS.md` and `.buildflow/CHAT_BOOTSTRAP.md`.
3. Read `docs/PROJECT_STATE.md`, `.buildflow/STATUS.md`,
   `.buildflow/CURRENT_TASK.md`, `.buildflow/NEXT_TASK.md`, and
   `docs/SPRINT_HISTORY.md`.
4. Read the active Sprint's applicable `PLAN.md`, `TASK.md`, `REPORT.md`,
   `CONTRACT.md`, `CLOSEOUT.md`, and supporting evidence.
5. Read product, business, architecture, roadmap, audit, and technical-debt
   documents when relevant to the task.
6. Inspect Git status and preserve unrelated user changes.

When applicable, also read `docs/BUSINESS_PLAN.md`, `docs/TECHNICAL_DEBT.md`,
`docs/AUDIT_GUIDE.md`, `docs/project/PROJECT_BIBLE.md`,
`docs/project/ARCHITECTURE.md`, `docs/project/ROADMAP.md`, and
`docs/project/DEVELOPMENT_CHARTER.md`.

If documents disagree with observable repository state, inspect the relevant
Commit and Sprint evidence. Do not guess.

### Official Workflow

All BuildFlow work follows this sequence:

1. GitHub latest-state inspection
2. Official-document inspection
3. Current Sprint and gate identification
4. GPT plan and impact analysis
5. User approval
6. Codex implementation
7. Validation result and Commit-hash confirmation
8. Risk-triggered Claude independent audit when required
9. GPT final PM/CTO review
10. User Sprint Exit approval
11. Approved Notion documentation synchronization

A later step is not complete merely because an earlier step passed.
Implementation, Commit, Push, Merge, Release, Deploy, and external-action
authorities are separate for R2/R3 work. For R1 work (see `DEVELOPMENT_CHARTER.md`
Section 11), Implementation and Commit may share one Scope approval; Push,
Merge, Release, Deploy, and external-action authorities remain separate at
every tier.

### Fixed GPT Response Format

For BuildFlow development responses, GPT uses the following sections when they
apply:

~~~text
# 🚀 개발 트랙

## 현재 상태
## 분석
## 권장안
## 영향 범위
## 다음 단계
## 필요 승인 여부

# ▼ Codex 전달문
# ▼ Claude 전달문
# ▼ 🧠 PM/CTO 검토 포인트
# ▼ 📄 5줄 요약
~~~

Include only the Codex or Claude section needed for the current gate. Do not
repeat the same status across sections. Clearly distinguish repository facts,
analysis, and recommendations; state whether user approval is required; do not
use UI metadata attributes in fenced blocks; and do not claim completion without
evidence.

### Codex and Claude Transfer Format

Every Codex or Claude instruction must be one complete, copyable fenced
Markdown block. Its outer form is:

~~~text
```markdown
complete instruction
```
~~~

Within that instruction, use `~~~bash` for shell commands and `~~~text` for
expected values and states. Do not split one instruction across multiple
blocks or place required execution details outside it. Include the objective,
repository baseline, allowed scope, forbidden scope, validation, stop
conditions, output format, and authority boundary.

### New Chat Bootstrap Protocol

A new BuildFlow chat must not ask the user to restate the project history when
the repository can provide it. It must read `.buildflow/CHAT_BOOTSTRAP.md`,
inspect the latest GitHub state, read current operational and Sprint documents,
identify the last completed Commit, audit, approval, blocker, and uncommitted
user changes, then report reconstructed state before recommending work.

The report must include repository and branch, latest verified Commit, active
Sprint or none, current and completed gates, pending approval, blockers and
technical risks, and allowed and prohibited next actions. Ask only for facts
that cannot be resolved from repository evidence.

### Session Handoff Protocol

At the end of meaningful work, ensure the official operational documents are
sufficient for a new chat to continue. Within approved scope, update only the
applicable ownership documents: `.buildflow/STATUS.md`,
`.buildflow/CURRENT_TASK.md`, `.buildflow/NEXT_TASK.md`, the active Sprint
`REPORT.md` or `CLOSEOUT.md`, `docs/PROJECT_STATE.md`, `docs/SPRINT_HISTORY.md`,
and `docs/TECHNICAL_DEBT.md`.

The handoff records completed work, exact Commit hash, validation and audit
results, current gate, blockers, consumed authority, required authority, next
eligible action, and prohibited actions. If no repository update was approved,
state that the handoff exists only in the conversation and needs an approved
documentation task before future sessions can rely on it.

### Notion Synchronization

The existing detailed Notion policy above is part of this protocol. The active
work chat synchronizes meaningful approved changes when GitHub and Notion access
are available; GitHub remains the Single Source of Truth; canonical pages are
updated rather than duplicated; and unavailable Notion access is reported as a
blocker rather than claimed as completed.

### Trust and Safety Rules

Never expose or publish secrets, API keys, tokens, passwords, private
connection strings, session data, sensitive logs, personal data, or
internal-only service URLs. Do not describe locally tested, committed, or
partially verified work as Production Ready without the required live evidence
and approval.
