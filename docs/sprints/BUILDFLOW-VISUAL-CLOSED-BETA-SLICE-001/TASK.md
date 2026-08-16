# BuildFlow Visual Closed Beta Slice — Scope Draft

## Status

```text
TASK ID: BUILDFLOW-VISUAL-CLOSED-BETA-SLICE-001
TASK STATUS: USER QA
SPRINT STATUS: USER QA / IMPLEMENTED / WAITING FOR USER FEEDBACK
SCOPE STATUS: FROZEN
PM DECISION: APPROVE
CTO DECISION: APPROVE
SCOPE DECISION: APPROVED
IMPLEMENTATION APPROVAL: APPROVED — READ-ONLY VISUAL JOURNEY SCOPE
IMPLEMENTATION AUTHORITY: PAUSED — USER QA
IMPLEMENTATION STATUS: IMPLEMENTED
CODE REVIEW: APPROVED WITH QA GATE
ACTIVE IMPLEMENTATION SPRINT: NO — USER QA REMAINS PENDING
CURRENT ACTIVE IMPLEMENTATION SPRINT: BUILDFLOW-CLARIFICATION-INTERACTION-001
```

This document is a frozen Scope baseline. The implementation is complete and
awaiting User QA. Provider, MCP, deployment, production-data changes, and
additional code changes remain prohibited unless User QA identifies an approved
correction.

## 1. Purpose

Define the first browser-visible vertical slice of BuildFlow's Closed Beta
experience. The slice must let an authenticated user understand and verify a
single coherent journey from a goal to an execution-ready or truthfully blocked
result.

It is not the complete Closed Beta and must not claim to execute Providers,
MCP Tools, or Runtime Steps when no such invocation occurred.

## 2. Product Outcome Visible in the Browser

For a project with a persisted Requirement Snapshot, a user can see one
connected journey:

```text
Goal
→ Requirement and Clarification state
→ Blueprint options and selected Blueprint
→ Build Plan
→ Approval / credential boundary
→ Persisted build-session progress
→ Truthful current result and next action
```

The new visible milestone is a unified **Agent Build Journey** view. It must
show the current stage, completed stages, blocking reason when applicable, and
the next user action without implying external execution that has not happened.

## 3. Scope Source

- `docs/project/DEVELOPMENT_CHARTER.md`
- `docs/project/MASTER_PRD.md`
- `docs/project/PROJECT_BIBLE.md`
- `.buildflow/CURRENT_TASK.md`
- `src/app/app/projects/[projectId]/page.tsx`
- `src/features/requirements/components/requirement-summary.tsx`
- `src/features/architecture/components/candidate-comparison.tsx`
- `src/features/execution/components/execution-summary.tsx`
- `src/features/autonomous/components/session-summary.tsx`
- `src/features/autonomous/components/approval-summary.tsx`
- `src/features/autonomous/actions.ts`
- `src/features/execution/actions.ts`

## 4. Proposed In Scope

### 4.1 Browser-visible journey composition

- Add one explicit Agent Build Journey section to the authenticated Project
  Detail flow.
- Compose existing persisted Requirement, Blueprint, Build Plan, Execution, and
  Autonomous Session information into one ordered journey.
- Display only source-backed states: not started, blocked, awaiting credential,
  awaiting consent, awaiting approval, progressing, ready, ready with warnings,
  failed, or cancelled.
- Show a concise next action and an explanation of why the user cannot proceed
  when the state is blocked.

### 4.2 Goal, clarification, and Blueprint

- Reuse the existing Project goal and Requirement Snapshot.
- Reuse existing clarification state and required-question display.
- Reuse Architecture candidate comparison and persisted Blueprint selection.
- Reuse the existing Build Plan snapshot; do not introduce a second planner.

### 4.3 Approval and execution-ready state

- Reuse the existing Approval Summary and Autonomous Session state.
- Make the approval boundary prominent in the unified journey.
- Reuse Build Execution preparation only where its persisted state is truthful.
- Show an execution-ready result only when existing persisted data supports it.

### 4.4 Result presentation

- Present a truthful terminal or currently-known result card.
- For `READY` or `READY_WITH_WARNINGS`, reuse the persisted service URL,
  outcomes, and warnings when they exist.
- For non-terminal states, show the exact next action rather than a fabricated
  success result.

### 4.5 Validation and user verification

- Add focused unit tests for any new pure Journey-state mapping helper.
- Preserve existing tests for Requirement, Architecture, Execution, and
  Autonomous Session behavior.
- Add an authenticated browser QA checklist covering the complete visible path.
- Verify that blocked, credential-required, approval-required, and terminal
  states are visually distinguishable.

## 5. Proposed Out of Scope

- New Runtime Planner or Runtime Compiler.
- Queue, worker, scheduler, lease, lock, retry execution, resume, rollback, or
  cancellation execution behavior.
- Runtime Step or Attempt execution UI beyond displaying truthful existing
  session/build state.
- New Provider Invocation implementation.
- New MCP Gateway, MCP discovery, or MCP Tool Invocation implementation.
- Provider credential storage changes, OAuth lifecycle changes, or secret
  handling changes.
- Evidence Bundle / Report implementation or persistence changes.
- Agent Save or Agent Replay implementation.
- Marketplace, Package listing, billing, public APIs, scaling, and deployment.
- Vercel project creation, environment changes, or production deployment.

## 6. Actual Provider, MCP, and Mock Boundary

| Concern | This Sprint's proposed rule |
| --- | --- |
| Provider invocation | No new invocation implementation. Existing persisted Provider-backed session outcomes may be displayed truthfully. |
| Provider live action | No live action is initiated by this Sprint's UI work without separate user approval and an approved external-action scope. |
| MCP invocation | Not included. Existing MCP definitions remain reference/validation-only. |
| Mock success | Forbidden. No UI may label a Provider, MCP Tool, Evidence, or Agent result as successful without persisted evidence. |
| Fixtures | Allowed only in automated tests, clearly isolated from browser production behavior. |
| Blocked/pending display | Allowed when derived from actual persisted state or the existing deterministic state model. |

This keeps the visual slice honest while reserving actual Provider/MCP execution
for a later approved Sprint.

## 7. Reuse Before Rewrite

| Existing module | Reuse in proposed slice |
| --- | --- |
| `RequirementSummary` | Requirement, clarification, architecture, plan, and supporting summaries |
| `CandidateComparison` | Blueprint comparison and selection |
| `ExecutionSummary` | Existing execution-readiness action and status boundary |
| `AutonomousSessionSummary` | Persisted session progress, credential/consent/approval states, and terminal result data |
| `ApprovalSummary` | User approval boundary |
| `startBuildExecution` | Existing idempotent execution-preparation path |
| `startOrResumeAutonomousSession` | Existing persisted session start/resume path, subject to existing external-action gates |
| Supabase project/session queries | Existing source of truth for browser-visible state |

No new planner, runtime engine, Provider adapter, or MCP implementation should
be created for this slice.

## 8. OSS Evaluation

No OSS adoption is proposed in this Sprint.

The repository already uses Next.js, React, Tailwind styling, Supabase, and
existing BuildFlow domain components sufficient for the proposed composed UI.
A new state-machine, timeline, diagram, queue, or Agent framework dependency
would expand the slice and requires a separate OSS proposal with repository,
license, maintenance, integration, security, and recommendation details.

## 9. Candidate File Scope

The exact file list is not approved yet. Expected candidates are limited to
presentation and pure state-mapping code:

```text
src/app/app/projects/[projectId]/page.tsx                 MODIFY (only if composition needs page-level data)
src/features/requirements/components/requirement-summary.tsx MODIFY
src/features/autonomous/components/session-summary.tsx    MODIFY
src/features/autonomous/components/agent-build-journey.tsx CREATE
src/features/autonomous/agent-build-journey.test.ts       CREATE
```

The implementation proposal must justify every file. If a backend, database,
Provider, MCP, Runtime, or unrelated UI file becomes necessary, work stops for
a scope amendment.

## 10. Acceptance Criteria

1. An authenticated user can see the Goal → Requirement → Blueprint → Plan →
   Approval → Progress → Result sequence in the Project Detail browser flow.
2. The selected Blueprint and Build Plan are read from existing persisted
   snapshot data rather than duplicated or recalculated by a new engine.
3. The view clearly identifies the next required user action for blocked,
   credential, consent, and approval states.
4. The view never reports Provider, MCP, Evidence, or Agent success without
   source-backed persisted evidence.
5. Existing `READY` and `READY_WITH_WARNINGS` session results present their
   existing URL/outcomes/warnings without inventing new result semantics.
6. New pure Journey-state mapping logic has unit tests.
7. Existing lint, typecheck, and test suite pass.
8. The project owner can verify the new Journey UI in a browser using an
   authenticated Project.

## 11. Risks and Open Questions

| Risk or question | Proposed handling |
| --- | --- |
| Existing summaries are dense and duplicated | Define one ownership/order model before UI changes; do not render a second competing workflow. |
| Starting an autonomous session may trigger external work when credentials exist | Keep any live external action behind the existing explicit approval boundary; do not expand it in this Sprint. |
| No canonical production deployment exists | Browser verification is local or an approved non-production environment only. Deployment remains a later phase. |
| Result semantics vary between Build Execution and Autonomous Session | Scope must select an explicit display precedence: persisted Autonomous Session terminal data first; execution-preparation data second; no inferred Provider result. |
| Required clarification interaction may not be editable from Project Detail | This scope may display the requirement state only; editing/answering flows require a separate scope if not already available. |
| Charter requires a visible milestone | The Agent Build Journey is the mandatory visible milestone. |

## 12. Test and Verification Plan

- Unit test the new pure state-to-journey mapping for no-session, blocked,
  credential, consent, approval, active, `READY`, `READY_WITH_WARNINGS`,
  failed, and cancelled states.
- Run existing unit tests for requirements, architecture, execution, and
  autonomous session state machines.
- Run lint, typecheck, full test suite, build, `git diff --check`, and secret
  scan.
- Browser QA with an authenticated Project verifies the ordered journey,
  Blueprint selection, approval boundary, and truthful result/next-action
  display.
- No Provider or MCP live action is part of QA unless separately approved.

## 13. Development Charter Compliance

| Charter requirement | Compliance |
| --- | --- |
| Product Vision | Advances the visible Goal-to-Agent-build journey without changing the AI Agent Factory direction. |
| Scope Discipline | Limits work to one Project Detail vertical slice; defers Marketplace, advanced Runtime, Provider/MCP invocation, and deployment. |
| OSS First | Evaluated; no new OSS is needed for a composed UI. Any future dependency requires an explicit proposal. |
| Reuse Before Rewrite | Reuses existing Requirement, Blueprint, Execution, Approval, Session, and Supabase modules. |
| Browser-visible Milestone | Delivers an Agent Build Journey users can inspect in the authenticated Project Detail page. |
| Closed Beta Alignment | Covers the first visible sequence through approval/progress/result while explicitly not misrepresenting missing Provider/MCP execution. |

## 14. Scope Decision

The approved policy clarification in `ADDENDUM-A.md` is part of this Scope
Draft. It resolves the read-only Journey and evidence-source boundaries without
expanding the proposed Sprint scope.

```text
PM DECISION: APPROVE
CTO DECISION: APPROVE
SCOPE DECISION: APPROVED
SCOPE FREEZE: FROZEN
SPRINT STATUS: USER QA / IMPLEMENTED / WAITING FOR USER FEEDBACK
ACTIVE IMPLEMENTATION SPRINT: NO — USER QA REMAINS PENDING
CURRENT ACTIVE IMPLEMENTATION SPRINT: BUILDFLOW-CLARIFICATION-INTERACTION-001
IMPLEMENTATION APPROVAL: APPROVED — READ-ONLY VISUAL JOURNEY SCOPE
IMPLEMENTATION AUTHORITY: PAUSED — USER QA
IMPLEMENTATION STATUS: IMPLEMENTED
CODE REVIEW: APPROVED WITH QA GATE
ACTIVATION RECORD: ACTIVATION.md
NEXT REQUIRED TRANSITION: DONE — AFTER USER QA PASS
```
