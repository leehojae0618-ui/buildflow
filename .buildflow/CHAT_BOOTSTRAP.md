# BuildFlow New Chat Bootstrap

## Purpose

This file allows any new BuildFlow GPT, Codex, or Claude session to reconstruct
the project state from GitHub without depending on prior conversation memory.

This file is an index, not a replacement Source of Truth.

## Step 1 — Confirm Repository State

Check:

~~~bash
git branch --show-current
git rev-parse HEAD
git log -1 --oneline
git rev-list --left-right --count origin/main...HEAD
git status --short
~~~

Do not reset, clean, stash, rebase, amend, or overwrite existing work.

## Step 2 — Read Global Rules

Read:

1. `AGENTS.md`
2. `docs/project/DEVELOPMENT_CHARTER.md`
3. `docs/05-development-rule.md`

## Step 3 — Reconstruct Current State

Read:

1. `docs/PROJECT_STATE.md`
2. `.buildflow/STATUS.md`
3. `.buildflow/CURRENT_TASK.md`
4. `.buildflow/NEXT_TASK.md`
5. `docs/SPRINT_HISTORY.md`

## Step 4 — Read Active Sprint Evidence

Locate the active Sprint or current gate and read applicable files under:

~~~text
docs/sprints/<sprint-id>/
~~~

Read files such as:

- `PLAN.md`
- `TASK.md`
- `CONTRACT.md`
- `REPORT.md`
- `REVIEW.md`
- `VALIDATION.md`
- `CLOSEOUT.md`

Do not assume a Sprint is active, complete, committed, pushed, audited, or
closed unless repository evidence supports that state.

## Step 5 — Read Domain Documents When Relevant

- Product: `docs/project/PROJECT_BIBLE.md`
- Business: `docs/BUSINESS_PLAN.md`
- Architecture: `docs/project/ARCHITECTURE.md`
- Roadmap: `docs/project/ROADMAP.md`
- Audit: `docs/AUDIT_GUIDE.md`
- Technical debt: `docs/TECHNICAL_DEBT.md`

## Step 6 — Produce Bootstrap Report

Before planning new work, report:

~~~text
Repository:
Branch:
Latest local HEAD:
Latest origin/main:
Ahead / behind:
Working tree:
Active Sprint:
Current gate:
Last completed implementation:
Last confirmed Commit:
Audit status:
Pending user approval:
Current blockers:
Next eligible action:
Prohibited actions:
~~~

Use `UNKNOWN` when evidence is unavailable. Do not guess.

## Step 7 — Continue Official Workflow

Continue from the first incomplete gate:

~~~text
GitHub inspection
→ document inspection
→ plan
→ user approval
→ Codex implementation
→ Commit verification
→ Claude audit
→ GPT final review
→ user Sprint Exit
→ Notion synchronization
~~~

Every approval authority remains separate.

## Session Handoff

Before ending meaningful work, check whether the applicable official state,
Sprint report, history, debt, and Notion documents require an approved update.

A new session must be able to identify:

- completed work
- Commit hash
- validation and audit result
- current gate
- blockers
- consumed authority
- required next approval
- exact next eligible action
