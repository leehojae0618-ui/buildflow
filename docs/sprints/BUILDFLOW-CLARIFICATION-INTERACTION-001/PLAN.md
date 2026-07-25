# BuildFlow Clarification Interaction — Implementation Plan

## 1. Status

```text
TASK ID: BUILDFLOW-CLARIFICATION-INTERACTION-001
SCOPE STATUS: FROZEN
SPRINT STATUS: ACTIVE / IMPLEMENTATION IN PROGRESS
IMPLEMENTATION PLANNING: COMPLETE
IMPLEMENTATION READINESS REVIEW: APPROVED
READY APPROVAL: APPROVED
IMPLEMENTATION APPROVAL: APPROVED — FROZEN CLARIFICATION SCOPE
IMPLEMENTATION AUTHORITY: ACTIVE — STEPWISE IMPLEMENTATION ONLY
PRODUCTION CHANGES AUTHORIZED: YES — APPROVED CLARIFICATION FILE SCOPE ONLY
ACTIVE SPRINT: BUILDFLOW-CLARIFICATION-INTERACTION-001
VISUAL CLOSED BETA SLICE: USER QA / WAITING FOR USER FEEDBACK
```

This plan governs the active stepwise Clarification implementation sequence.
It does not alter the current Visual Closed Beta Slice User QA gate.

## 2. Implementation Objective

Implement the first browser-visible, bounded Clarification interaction on an
authenticated Project Detail page.

The user answers only high-impact questions, can inspect assumptions and
revision reasons, and sees whether the project is ready for Blueprint Review.
The implementation records a versioned, explainable Requirement Snapshot
revision and refreshes affected derived Blueprint/Build Plan data through the
existing canonical generation path.

The implementation must preserve the frozen product decision:

```text
Information Sufficient supports Decision Ready.
Decision Ready ends Clarification for Blueprint Review.
Decision Ready does not start a Build.
Build Authorization remains a separate later gate.
```

## 3. Frozen Baseline and Non-Negotiable Rules

- `clarification-confidence-v1` is deterministic and versioned; it is not an
  AI-model confidence value.
- Questions use `CRITICAL → IMPORTANT → OPTIONAL`, then existing priority,
  then stable question ID ordering.
- At most three questions appear in a batch and five questions in a resolution
  cycle. These are guardrails, not readiness proof.
- `CRITICAL` unknowns cannot be skipped or satisfied by an assumption.
- The v1 implementation emits only `REQUIREMENT_READINESS` Decision State.
  It may never emit Build Authorization or start execution.
- Clarification answer changes create append-only revisions and structured
  Before → Changed → After diffs. Undo is a compensating new revision.
- Derived artifacts are regenerated only on a committed answer batch and only
  through the existing Requirement Snapshot generation path.
- Blueprint selections are retained only when still valid. Invalid selections
  are explicitly marked invalid; they are never replaced silently.
- Provider, MCP, Runtime, Evidence, approval execution, credentials,
  provisioning, polling, Save, Replay, and deployment remain out of scope.

## 4. v1 Data and Persistence Boundary

### Chosen boundary

v1 extends the compatible object stored at:

```text
projects.goal_constraints.requirement_snapshot
```

No table, migration, API route, dependency, Provider call, or external event
store is part of this Sprint. Existing projects without a clarification object
receive a deterministic initial state when read or when their first answer is
committed.

### Required persisted conceptual fields

```text
clarification:
  revision
  policyVersion: clarification-confidence-v1
  status
  exitReason
  confidence
  answers
  knownFacts
  unknowns
  assumptions
  askedQuestionIds
  deferredQuestionIds
  batchCount
  decisionState:
    scope: REQUIREMENT_READINESS
    status: NOT_READY | READY_WITH_ASSUMPTIONS | READY_FOR_REVIEW |
            SUPERSEDED
    basis references and reason codes
  revisionDiffs: append-only structured explanation records
```

The persisted structure must contain only safe user-provided requirement
facts, safe system assumptions, policy references, and derived references. It
must reject credential-shaped input and must not store Provider/MCP payloads,
Runtime output, Evidence, or raw secrets.

## 5. Existing Assets and Required Reuse

| Existing asset | Planned use | Change type |
| --- | --- | --- |
| `goal-parser.ts` | Normalize the revised goal/constraint input into the existing `Requirement`. | Reuse unchanged. |
| `clarification.ts` | Produce questions, impact classes, score coverage, sufficient-information result, and exit reason. | Extend. |
| `conversation.ts` | Produce stable bounded batches and next-question state. | Extend. |
| `types.ts` | Add compatible clarification answer, decision state, diff, and policy types. | Extend. |
| `snapshot.ts` | Canonically regenerate derived Requirement, Blueprint candidates, Build Plan, and dependent summaries after a committed batch. | Extend without duplicating generators. |
| `projects/actions.ts` | Read the authenticated project snapshot, validate an answer batch, persist exactly one revision, and revalidate Project Detail. | Extend. |
| `requirement-summary.tsx` | Host the clarification interaction and current Decision State in Project Detail. | Extend. |
| Existing architecture/planner modules | Remain canonical derived-artifact generators. | Reuse unchanged. |

No new OSS is required. The implementation must not introduce a chat, state
machine, LLM, agent-framework, or persistence dependency.

## 6. Exact Proposed File Scope

This is the proposed production and test file list for later Implementation
Approval. This plan does not yet authorize any of these changes.

| Path | Action | Purpose |
| --- | --- | --- |
| `src/features/requirements/types.ts` | MODIFY | Compatible Clarification answer, confidence, Decision State, revision, and diff types. |
| `src/features/requirements/clarification.ts` | MODIFY | Deterministic impact ranking, confidence, exit reason, and sufficient-information policy. |
| `src/features/requirements/conversation.ts` | MODIFY | Bounded question-batch and Decision Readiness projection. |
| `src/features/requirements/snapshot.ts` | MODIFY | Canonical regeneration from committed clarified input and selection-validity handling. |
| `src/features/projects/actions.ts` | MODIFY | Authenticated, validated answer-batch persistence and Project Detail revalidation. |
| `src/features/requirements/components/requirement-summary.tsx` | MODIFY | Compose the new read/write clarification panel at the established Project Detail entry point. |
| `src/features/requirements/components/clarification-interaction.tsx` | CREATE | Bounded question controls, assumption review, Decision State, and structured revision explanation UI. |
| `src/features/requirements/clarification.test.ts` | CREATE | Pure policy tests for ranking, confidence, exit states, and safe answer handling. |
| `src/features/requirements/conversation.test.ts` | MODIFY | Batch-limit, ordering, and Decision Readiness projection tests. |
| `src/features/requirements/engine.test.ts` | MODIFY | Snapshot regeneration, selection invalidation, and backward-compatibility tests. |

No other path is in the proposed scope. If implementation needs a database
migration, a route, a new dependency, a page change, a Runtime/Provider/MCP
file, or another test location, work stops for a Scope Amendment and new
Implementation Approval.

## 7. Implementation Data Flow

```text
Persisted Project Goal + existing Requirement Snapshot
  → deterministic unknown analysis
  → ranked queue and a maximum-three Question Batch
  → authenticated user answer batch
  → validation and source classification
  → one append-only Clarification Revision / Snapshot Diff
  → DecisionStateEvaluation (REQUIREMENT_READINESS only)
  → canonical derived Snapshot regeneration when materially affected
  → Blueprint selection retained or explicitly superseded
  → Build Plan regenerated or marked unchanged
  → Project Detail revalidation and explainable UI
```

### 7.1 Answer-batch algorithm

1. Authenticate and load the Project with its current snapshot.
2. Validate stable question IDs against the current deterministic question
   queue; reject stale, duplicate, empty, malformed, or secret-shaped values.
3. Classify each submitted response as `USER`, `USER_UNKNOWN`, or an allowed
   reviewed assumption. Reject deferral for `CRITICAL` questions.
4. Build one new append-only clarification revision and calculate its
   `clarification-confidence-v1` coverage, exit reason, and
   `REQUIREMENT_READINESS` Decision State.
5. Compare committed clarified facts with the prior revision. If no material
   requirement or policy input changed, keep derived artifacts unchanged and
   record the reason in the diff.
6. If a material input changed, call the existing canonical snapshot generation
   path once for the committed batch. Do not patch Blueprint or Build Plan
   fields manually.
7. Check whether the stored selected Blueprint remains in the regenerated
   candidate set and complies with revised constraints. Preserve it only when
   valid; otherwise set the Decision State to `SUPERSEDED` with an explanation.
8. Persist the single compatible Project snapshot update and revalidate only
   the Project Detail path.

This action never starts a session, Build Execution, Provider call, MCP call,
polling loop, approval, provisioning, or Runtime operation.

## 8. UI Plan

The new panel is a bounded decision interaction, not a general chat surface.

1. **Decision summary** — current `REQUIREMENT_READINESS` state, what the
   user must decide next, and blockers or assumptions.
2. **Question batch** — one focused question at a time, visible `1 of N`
   progress, impact class, and “why this matters” text.
3. **Answer controls** — structured control when available; concise text only
   for non-enumerable facts; explicit `Not sure`/defer only when policy allows.
4. **Revision explanation** — after submit, show facts changed, confidence and
   Decision State change, Blueprint/Plan effects, and next review action.
5. **Assumption review** — a user-visible list whose acceptance is explicit;
   no hidden defaults and no Force Build action.

The panel must be visually distinct from existing execution, approval, and
autonomous-session summaries so a user cannot mistake Decision Readiness for
external execution progress.

## 9. Test and Validation Plan

### Pure policy tests

- Critical / Important / Optional mapping and stable deterministic ordering.
- Three-question batch cap and five-question cycle behavior.
- `clarification-confidence-v1`: direct answer, goal/form fact, reviewed
  assumption, unresolved/contradictory field, no-applicable-field behavior,
  and Critical-assumption rejection.
- Exit reasons and Decision State transitions: `NOT_READY`,
  `READY_WITH_ASSUMPTIONS`, `READY_FOR_REVIEW`, and `SUPERSEDED`.
- Append-only diff formation, no mutation of prior revision, compensating
  revision behavior, and secret-shaped input rejection.

### Snapshot and action tests

- Existing snapshots without clarification history read as a deterministic
  initial state.
- A material answer batch regenerates canonical Blueprint/Plan data once.
- A metadata-only revision leaves derived data unchanged with an explanation.
- A revised constraint retains a still-valid selected Blueprint or explicitly
  invalidates it; it never auto-selects another candidate.
- The action rejects stale question IDs, duplicate answer IDs, invalid deferral,
  unauthenticated access, and cross-project access.
- No action triggers Provider, MCP, Runtime, approval, polling, or execution
  behavior.

### Browser QA and repository validation

- Authenticated Project Detail shows questions, impact, assumptions, Decision
  State, and revision explanation in a comprehensible order.
- A user can see why Blueprint/Plan data changed and what to do next.
- Existing Visual Journey remains truthful and does not gain an execution side
  effect through Clarification.
- Run targeted tests, full test suite, lint, typecheck, build,
  `git diff --check`, and secret scan before Code Review.

## 10. Implementation Sequence and Checkpoints

1. **Policy/types first** — implement frozen types and pure Clarification /
   Decision State policy with tests.
2. **Canonical regeneration** — connect committed clarified input to the
   existing snapshot generator and selected-Blueprint validity check.
3. **Persistence boundary** — add the narrow authenticated answer-batch action
   and backward-compatible snapshot read path.
4. **Browser interaction** — add the bounded clarification panel to the
   existing Requirement Summary and revision explanation display.
5. **Validation** — run targeted, full repository, and browser QA gates.
6. **Code Review** — verify exact file scope, Decision/Runtime separation, and
   no external side effects before user-facing QA.

Each implementation checkpoint requires the same frozen file scope. Any new
path, migration, dependency, external I/O, or contract change is a stop
condition, not an implementation choice.

## 11. Stop Conditions

Stop and request a Scope Amendment before code changes continue if:

1. compatible Project snapshot persistence cannot safely retain the frozen
   clarification revision/diff contract;
2. a database migration, API route, dependency, or path outside section 6 is
   needed;
3. existing canonical Snapshot generation cannot accept clarified inputs
   without changing Blueprint/Planner semantics outside this scope;
4. selected Blueprint validity cannot be determined deterministically;
5. test coverage requires Provider, MCP, Runtime, approval, or external I/O;
6. an implementation would make `READY_FOR_BUILD` start external work; or
7. an unresolved policy decision would change the frozen Decision State,
   confidence, impact, diff, or exit contract.

## 12. Definition of Ready for Activation

This Sprint reached `READY` after the following review criteria were met:

- This plan's exact file scope is approved without expansion.
- The JSON-compatible snapshot persistence decision is accepted.
- The v1 Critical/Important/Optional mapping and stable reason-code list are
  recorded for implementation.
- The user-facing Korean copy and accessibility acceptance criteria are ready
  for implementation without changing policy.
- Implementation Approval and Authority remained separate from `READY`; code
  changes began only after the explicit `ACTIVE` transition and authority
  grant.

## 13. Development Charter Compliance

| Charter requirement | Compliance |
| --- | --- |
| Product Vision | Implements the “AI collects missing information before Agent design” step as an accountable decision experience. |
| Contract First | Implements the frozen Confidence, Clarification, Decision State, and Revision Explainability contracts without reinterpretation. |
| Scope Discipline | Limits v1 to Project-bound clarification, snapshot revision, Blueprint/Plan refresh, and visible explanation. |
| OSS First | No new infrastructure need is identified; existing modules are sufficient. |
| Reuse Before Rewrite | Extends the existing parser, queue, snapshot generator, planner, project action boundary, and Requirement Summary. |
| Browser-visible Milestone | Delivers bounded questions, explicit assumptions, Decision State, and revision explanations in Project Detail. |
| Closed Beta Alignment | Advances Goal → Clarification → Blueprint → Plan honestly while leaving real Provider/MCP/Runtime/Evidence work for later Sprints. |

## 14. Planning Exit Record

```text
IMPLEMENTATION PLAN: COMPLETE
IMPLEMENTATION READINESS REVIEW: APPROVED
READY APPROVAL: APPROVED
ACTIVE APPROVAL: APPROVED
ACTIVATION RECORD: docs/sprints/BUILDFLOW-CLARIFICATION-INTERACTION-001/ACTIVATION.md
NEXT GOVERNANCE GATE: STEP-1 PM/CTO REVIEW
IMPLEMENTATION APPROVAL: APPROVED — FROZEN CLARIFICATION SCOPE
IMPLEMENTATION AUTHORITY: ACTIVE — STEPWISE IMPLEMENTATION ONLY
PRODUCTION CHANGES AUTHORIZED: YES — APPROVED CLARIFICATION FILE SCOPE ONLY
```
