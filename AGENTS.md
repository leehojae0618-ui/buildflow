# BuildFlow Agent Rules

## Working Directory

`/Users/hojelee/Documents/Codex/buildflow`

## Source of Truth Priority

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

PLANNING → READY → IN_PROGRESS → REVIEW → QA → DONE

## Product Review and Change Control

- A Sprint scope is frozen after approval. Mid-Sprint ideas are not implemented unless classified as an emergency fix.
- Change classes: A (security/data-loss/critical DB issue: immediate), B (efficiency or direction improvement: backlog for review), C (new idea: document only).
- Product Review occurs every five Sprints and is recorded in `docs/project/PRODUCT_REVIEW.md`.
- Implementation Complete, PM Review, Commit Approval, and Push Approval are separate gates. Codex must not commit before explicit Commit Approval.
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
