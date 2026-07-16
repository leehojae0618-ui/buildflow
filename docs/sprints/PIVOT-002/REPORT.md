# PIVOT-002 Report

## Technical Deliverable

- Added `src/features/requirements/` domain modules for Goal, Requirement, Clarification, Constraint, Consent, and Snapshot.
- Project create/update now stores `requirement_snapshot` inside existing `projects.goal_constraints` JSONB.
- Project Detail displays the interpreted expected output, category, pending required questions, and constraint direction.
- Existing Recommendation modules remain intact and compatible.
- Added Requirement domain tests.

## Product Deliverable

- BuildFlow now begins to understand a Goal before Recommendation.
- Missing information is represented as questions rather than silently guessed.
- Constraints are classified as automatic, partial automatic, user required, expert required, or not supported; no absolute rejection is introduced.
- External integration consent needs are represented before future connection/build work.
- This aligns with the principle: “질문의 품질이 설계의 품질을 결정한다.”

## Data and Compatibility

- No Migration.
- No new table.
- Existing `projects.goal_constraints` JSONB is used for the versioned Snapshot.
- Recommendation structure was not deleted or renamed.

## Verification

- Tests: 86 passing.
- lint: passed.
- typecheck: passed.
- build: passed (`npm run build`).
- `git diff --check`: passed.
- Authenticated browser QA: pending because no authenticated session was available.

## Source of Truth

- `MASTER_PLAN.md` remains the legacy implementation history and continuity record.
- `.buildflow/STATUS.md`, `.buildflow/CURRENT_TASK.md`, and `.buildflow/NEXT_TASK.md` remain the operational task state.
- This report records the PIVOT-002 implementation evidence and does not replace the historical plan.

## Git

- Commit: `893214d` (`feat: add requirement analysis foundation`).
- Push: not performed.

## Next Sprint Impact

PIVOT-003 should build on `RequirementSnapshot.constraints` and refine Constraint Classification without duplicating Goal parsing or Consent modeling.
