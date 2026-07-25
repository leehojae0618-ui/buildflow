# BuildFlow Clarification Interaction — Frozen Scope

## Status

```text
TASK ID: BUILDFLOW-CLARIFICATION-INTERACTION-001
TASK STATUS: ACTIVE
SPRINT STATUS: ACTIVE / IMPLEMENTATION IN PROGRESS
SCOPE STATUS: FROZEN
PM REVIEW: PASS
PM DECISION: APPROVE
CTO DECISION: APPROVE
SCOPE DECISION: APPROVED
IMPLEMENTATION PLANNING: COMPLETE
IMPLEMENTATION READINESS REVIEW: APPROVED
READY APPROVAL: APPROVED
SPRINT READINESS: ACTIVE
IMPLEMENTATION APPROVAL: APPROVED — FROZEN CLARIFICATION SCOPE
IMPLEMENTATION AUTHORITY: ACTIVE — STEPWISE IMPLEMENTATION ONLY
PRODUCTION CHANGES AUTHORIZED: YES — APPROVED CLARIFICATION FILE SCOPE ONLY
```

This is a frozen, active Sprint scope. It permits only approved stepwise
Clarification implementation and does not change the current
`BUILDFLOW-VISUAL-CLOSED-BETA-SLICE-001` User QA state.

## 1. Purpose

Define the product, policy, data-flow, UX, and implementation boundaries for
the first interactive Clarification experience.

BuildFlow must not behave as a generic builder that immediately produces a
plan from an underspecified goal. Its differentiator is identifying the small
set of missing facts that materially affect an AI Agent Blueprint or Build
Plan, then helping the user resolve them without an unbounded chat exchange.
The user is an outcome owner, not a workflow technician: they answer relevant
questions and approve consequential decisions while BuildFlow explains the
effect on the proposed Blueprint and Build Plan.

The intended visible outcome for the later implementation Sprint is:

```text
Goal input
→ missing-information analysis
→ bounded clarification questions
→ user answers or explicit assumptions
→ Requirement Snapshot revision
→ Decision State evaluation
→ Blueprint refresh
→ Build Plan refresh
```

This draft specifies that experience only. It does not authorize code, tests,
database changes, Providers, MCP, Runtime execution, or deployment.

## 2. Background and Existing Reuse Baseline

The repository already provides a useful foundation:

| Existing asset | Current responsibility | Reuse direction |
| --- | --- | --- |
| `src/features/requirements/goal-parser.ts` | Converts a goal and form constraints into a `Requirement`. | Remain the canonical goal-to-requirement parser. |
| `src/features/requirements/clarification.ts` | Generates prioritized missing-field questions and a basic summary. | Extend policy and answer-aware summary; do not create a competing question engine. |
| `src/features/requirements/conversation.ts` | Builds the sorted clarification queue and current next question. | Extend to represent a bounded interaction cycle. |
| `src/features/requirements/types.ts` | Defines `Requirement`, questions, conversation, and `RequirementSnapshot`. | Evolve compatibly after an approved implementation scope. |
| `src/features/requirements/snapshot.ts` | Creates the derived Requirement, Blueprint candidates, intelligence, Build Plan, and supporting snapshots. | Recompute derived artifacts from a revisioned clarified input set. |
| `src/features/projects/actions.ts` | Persists project goal constraints and architecture selection. | Add a narrowly scoped answer-save action only after approval; preserve existing project and selection behavior. |
| `src/features/requirements/components/requirement-summary.tsx` | Displays clarification state within Project Detail. | Reuse as the entry location or compose a dedicated bounded clarification panel. |
| `src/features/architecture/candidates.ts` and planner modules | Generate Blueprint candidates and Build Plan from the requirement. | Continue as the only Blueprint/Plan generation path. |

Today the snapshot exposes prioritized questions but has no persisted answer
model or answer-driven recomputation path. This Sprint should fill that
interaction gap rather than replace the Requirement, Blueprint, or Planner
engines.

## 3. Dependency and Lifecycle Boundary

- The current Visual Closed Beta Slice remains in **USER QA**. Its code,
  frozen scope, status, and User QA gate are unaffected by this draft.
- One active implementation Sprint remains the operating rule. The Visual
  Closed Beta Slice stays in USER QA / waiting-for-user-feedback state while
  this Sprint is the sole active implementation Sprint.
- Runtime, Provider, MCP, Evidence, Approval execution, Save, Replay, and
  deployment are dependencies or future product stages, not work in this
  Clarification scope.
- Clarification changes user-owned requirement facts and derived planning
  artifacts only. It must not start, continue, resume, approve, provision, or
  invoke an external system.

## 4. Proposed User Flow

```text
1. User enters or opens a Project goal
   ↓
2. Requirement Engine normalizes known goal facts and constraints
   ↓
3. Clarification Engine identifies unknowns that can materially affect
   validation, Blueprint choice, Build Plan, safety, cost, or approval
   ↓
4. BuildFlow presents a bounded first batch of the highest-impact questions
   ↓
5. User answers, explicitly marks an answer as unknown, or defers an allowed
   non-blocking question
   ↓
6. BuildFlow records the answer source and updates the Requirement Snapshot
   revision
   ↓
7. Derived Blueprint candidates and Build Plan are refreshed from the revised
   requirement facts
   ↓
8. BuildFlow shows what changed, remaining assumptions, and either the next
   bounded question batch or the next product action
```

### 4.1 Required UX state transitions

| State | Meaning | User-visible next action |
| --- | --- | --- |
| `ANALYZING` | Existing goal facts are being evaluated locally by the requirement rules. | Show a brief deterministic analysis state; no external action. |
| `ASKING` | At least one high-impact unanswered question remains in the current batch. | Answer one question, choose an explicit unknown, or defer only if allowed. |
| `REFRESHING` | A submitted answer changes the clarified input set. | Show that Blueprint and Plan are being refreshed from the new facts. |
| `READY_FOR_REVIEW` | No blocking unknown remains; assumptions and derived artifacts are visible. | Review Blueprint and Build Plan. |
| `BLOCKED` | A required blocking answer is unavailable and cannot safely be assumed. | Answer the named question or revise the goal. |
| `DEFERRED_WITH_ASSUMPTIONS` | Only non-blocking unknowns remain and each has an explicit user-visible assumption. | Review assumptions and continue to Blueprint review. |

These are proposed Clarification interaction states. They must not redefine
the existing Runtime, Step, Attempt, autonomous session, or approval enums.

## 5. Clarification Policy

### 5.1 When BuildFlow asks a question

BuildFlow asks only when an answer can materially affect one or more of:

- Requirement validity or safety boundary.
- Blueprint category, component selection, or selected Blueprint validity.
- Build Plan tasks, order, cost, required accounts, or explicit user work.
- Required consent, approval, or constraint classification.

BuildFlow must not ask for a fact already present in the Project goal,
project form, saved clarification answer, explicit assumption, or selected
preference. It must not ask curiosity questions that do not change a visible
decision.

### 5.2 Question ranking and impact classes

Every unknown receives exactly one deterministic impact class before it enters
the question queue. Importance is not inferred from the wording alone.

| Class | Definition | Examples | Deferral / exit rule |
| --- | --- | --- | --- |
| `CRITICAL` | Missing fact can make the requirement unsafe, invalid, non-consensual, or impossible to classify into a feasible Blueprint. | Required consent, data/security restriction, essential output, required integration or platform when the goal type depends on it. | Cannot be skipped, assumed silently, or force-continued. It blocks `READY_FOR_REVIEW`. |
| `IMPORTANT` | Missing fact can materially change Blueprint feasibility, Build Plan, account/user work, automation level, or budget envelope. | Primary user, automation level, material budget, current tool constraints. | Must be answered or converted into an explicit reviewed assumption before exit. |
| `OPTIONAL` | Missing fact refines optimization, presentation, or a secondary non-blocking choice without changing feasibility. | User-volume estimate, visual preference, non-material tool preference. | May be deferred with an explicit visible assumption. |

The deterministic ranking key is:

```text
impact class (CRITICAL → IMPORTANT → OPTIONAL)
→ existing policy priority (ascending)
→ stable question ID (lexicographic)
```

This keeps the current rule-based `priority` field reusable while making the
reason for ordering inspectable. A future LLM ranking policy requires a
separate Provider, evaluation, safety, cost, and Scope approval.

### 5.3 Question limits

- Present **at most three questions per batch**.
- Ask **at most five questions in one clarification resolution cycle**.
- These are UX and cost guardrails, not sufficiency criteria. Reaching either
  limit never by itself makes a requirement ready.
- If the cap is reached with a `CRITICAL` unknown, transition to `BLOCKED` and
  show the exact unresolved requirement. Do not silently create another batch.
- If the cap is reached with only `IMPORTANT` or `OPTIONAL` unknowns, show the
  unresolved impact and require an explicit answer, assumption, or allowed
  deferral decision.

### 5.4 Clarification exit criteria and sufficient-information rule

Clarification can exit `ASKING` only through a named reason. The persisted
result must record one of these exit reasons:

| Exit reason | Required condition | Resulting state |
| --- | --- | --- |
| `SUFFICIENT_INFORMATION` | `CRITICAL` unknowns = 0; all `IMPORTANT` unknowns are answered or have an explicit reviewed assumption; deterministic clarification confidence is at least `0.80`; remaining unknowns are optional and visible. | `READY_FOR_REVIEW` |
| `NO_MATERIAL_QUESTION` | No unanswered question can change requirement validity, Blueprint, Build Plan, constraint, approval, or user action. | `READY_FOR_REVIEW` |
| `USER_PROCEED_WITH_ASSUMPTIONS` | User explicitly accepts the displayed assumptions; `CRITICAL` unknowns = 0; every unresolved `IMPORTANT` or `OPTIONAL` item has an impact and assumption. | `DEFERRED_WITH_ASSUMPTIONS` or `READY_FOR_REVIEW` |
| `BLOCKED_CRITICAL_UNKNOWN` | One or more `CRITICAL` unknowns remain unresolved, are unavailable, or cannot safely be assumed. | `BLOCKED` |
| `QUESTION_CYCLE_LIMIT` | Five-question cycle cap reached without another valid exit. | `BLOCKED` when Critical remains; otherwise assumptions review is required. |

`User Force Build` is intentionally not an exit action in this Sprint. The
Clarification UI may only allow **proceed to Blueprint review with explicit
assumptions**. Starting a Build, Runtime, Provider, MCP, or provisioning flow
remains a later approval boundary.

Clarification confidence is a deterministic coverage measure, not an LLM
claim. The proposed v1 formula weights resolved or explicitly reviewed fields:

```text
CRITICAL: 0.50
IMPORTANT: 0.35
OPTIONAL: 0.15
confidence = resolved/reviewed weight ÷ applicable total weight
```

When no clarification field is applicable, confidence is `1.00` and the exit
reason is `NO_MATERIAL_QUESTION`; the system must not divide by zero or invent
a question to satisfy a metric.

An explicit assumption can satisfy confidence only for `IMPORTANT` or
`OPTIONAL` facts; it can never resolve a `CRITICAL` unknown. The exact
goal-type-to-impact mapping and the `0.80` threshold must be approved before
Scope Freeze.

Information is sufficient for Blueprint and Build Plan review only when the
system has a goal, intended primary user or an explicit non-critical
assumption, enough context to classify the goal and output, and resolved or
explicitly bounded automation, budget, and existing-tool constraints where
they are material. “Unknown” is valid input only when its impact, assumption,
and exit consequence are visible to the user.

### 5.4.1 Confidence determination contract

Clarification confidence measures **requirement coverage**, not whether an AI
model "feels confident." It is computed only from applicable clarification
fields using a versioned deterministic policy:

```text
clarification-confidence-v1

field coverage:
  validated USER answer                         = 1.00
  structurally valid goal/form fact             = 1.00
  USER-reviewed IMPORTANT assumption            = 0.75
  USER-reviewed OPTIONAL assumption             = 1.00
  unresolved, contradictory, invalid, or stale  = 0.00
  CRITICAL assumption                            = invalid; cannot contribute

confidence:
  Σ(impact weight × field coverage) ÷ Σ(applicable impact weight)
```

Confidence rises when a relevant fact is direct, structurally valid,
non-contradictory, source-tagged, and still applicable after the latest
revision. It falls when a fact is unresolved, invalid, contradicted by a newer
answer, invalidated by a changed goal/constraint, or represented only by a
reviewed Important assumption. Optional assumptions are fully sufficient only
because the impact taxonomy has already established that they do not affect
feasibility.

The policy must reject a confidence result as invalid when an applicable
`CRITICAL` field lacks a validated user or structurally valid goal/form fact,
even if the numerical ratio would otherwise reach `0.80`.

#### Deterministic rule and AI boundary

- The v1 score, impact class, field applicability, exit reason, and
  explanation are calculated by deterministic repository rules.
- An AI model may not contribute a hidden confidence value, convert an
  assumption into a known fact, or override a `CRITICAL` block.
- A future model may propose candidate questions only after a separate
  Provider and evaluation scope. Its proposals must be normalized into the
  same versioned deterministic policy before entering the queue.
- The active policy version is stored with the clarification revision and its
  snapshot diff. A model upgrade therefore cannot silently alter the meaning
  of a historical confidence score.
- Changing weights, coverage values, or applicability rules is a clarification
  contract amendment, not a model-tuning detail. Historical revisions retain
  their recorded policy version.

### 5.5 Answer handling

- Answers have an explicit source: `USER`, `USER_UNKNOWN`, or
  `SYSTEM_ASSUMPTION`.
- A user may revise a prior answer. The revision must trigger the same
  validation and derived-artifact refresh path as a new answer.
- A user may defer only a non-blocking question. Deferral records its impact
  and the assumption used; it is never silently converted into a known fact.
- Inputs that resemble credentials, access tokens, private keys, or secrets
  are rejected from this interaction and routed to the existing separate
  credential/approval boundary. Clarification must remain reference- and
  intent-first.

## 6. Proposed Snapshot Model

`RequirementSnapshot` remains the canonical project requirement snapshot.
The later implementation should evolve it compatibly rather than create a
parallel clarification store or a second planner input.

### 6.1 Conceptual ownership

| Snapshot area | Owner | Notes |
| --- | --- | --- |
| Goal | User | Preserve original goal and normalized requirement interpretation. |
| Requirements | Requirement Engine from user facts | Structured facts used by current parser and validation. |
| Constraints | User plus constraint rules | Includes explicit budget, automation, tools, restrictions, and consent implications. |
| Preferences | User | Preserve explicit choices such as cost and tool preferences. |
| Known facts | User, then deterministic extraction | Each fact needs source and current revision context. |
| Unknowns | Clarification Engine | Each unknown needs impact and resolution state. |
| Clarification confidence | Deterministic policy | A weighted coverage measure with no LLM-asserted certainty. |
| Assumptions | System, visible to user | Must be explicit, reviewable, and replaceable by an answer. |
| Snapshot diff | Clarification revision record | Explains the Before → Changed → After facts and derived effects for one committed answer batch. |
| Decision state | Decision Policy | States the next accountable user decision, its immutable basis, and why it is or is not ready. |
| Blueprint / Build Plan | Derived only | Recomputed from the clarified facts; never manually patched as a second source of truth. |

### 6.2 Conceptual compatible additions

The exact TypeScript names, persistence representation, and migration strategy
are deferred until Scope Freeze. The implementation proposal should support a
conceptual structure equivalent to:

```text
clarification:
  revision: positive integer
  policyVersion: clarification-confidence-v1
  status: ANALYZING | ASKING | REFRESHING | READY_FOR_REVIEW | BLOCKED |
          DEFERRED_WITH_ASSUMPTIONS
  exitReason: SUFFICIENT_INFORMATION | NO_MATERIAL_QUESTION |
              USER_PROCEED_WITH_ASSUMPTIONS | BLOCKED_CRITICAL_UNKNOWN |
              QUESTION_CYCLE_LIMIT | null
  confidence: number from 0 to 1
  askedQuestionIds: stable question IDs
  answers:
    - questionId
      field
      value
      source: USER | USER_UNKNOWN | SYSTEM_ASSUMPTION
      impact: BLOCKING | MATERIAL | NON_BLOCKING
  deferredQuestionIds: stable question IDs
  knownFacts: source-tagged fact references
  unknowns: field, question ID, impact, reason
  assumptions: field, value or rule, reason, visibility
  batchCount: non-negative integer
  decisionState:
    scope: REQUIREMENT_READINESS
    status: NOT_READY | READY_WITH_ASSUMPTIONS | READY_FOR_REVIEW |
            SUPERSEDED
    basis: clarification revision, confidence policy/version, unknown and
           assumption references, revision diff reference
    nextDecision: named user decision
    reasonCodes: stable deterministic policy reasons
  revisionDiffs:
    - revision: positive integer
      priorRevision: positive integer | null
      policyVersion: clarification-confidence-v1
      reason: user answer batch | answer revision | assumption accepted
      before: field-level values or absence markers
      changed: field-level answer / unknown / assumption changes
      after: field-level values or absence markers
      derivedEffects:
        blueprintCandidates: unchanged | regenerated | selected candidate invalidated
        buildPlan: unchanged | regenerated
      source: user-visible answer source references
```

`revisionDiffs` are append-only explanation records for committed clarification
revisions. They are not full duplicate snapshots, raw provider payloads, or an
event store for Runtime execution. Undo is implemented as a new answer revision
that produces a compensating diff; it never mutates historical diffs.

No secret values, raw Provider responses, MCP payloads, credentials, or
runtime evidence belong in the Clarification snapshot or a snapshot diff.

### 6.3 Clarification Engine Contract

The later implementation must expose one versioned, deterministic conceptual
contract rather than pass ad hoc UI fields between the Requirement, Blueprint,
and Planner layers.

```text
ClarificationAnalysisInput
  → UnknownAnalysis
  → RankedQuestionQueue
  → ClarificationQuestionBatch
  → ClarificationAnswerBatch
  → ClarificationRevision
  → DecisionStateEvaluation
  → RequirementSnapshotRevision
  → BlueprintRevision
  → BuildPlanRevision
```

| Contract stage | Required input | Required output | Invariants |
| --- | --- | --- | --- |
| `ClarificationAnalysisInput` | Project-scoped Goal, current compatible Requirement Snapshot, explicit preferences, latest answer/diff revision. | A normalized analysis input. | No credential, Provider/MCP payload, Runtime output, or hidden external data. |
| `UnknownAnalysis` | Normalized input plus `clarification-confidence-v1`. | Unknown field, stable question ID, impact class, reason, applicability, and source state. | Every unknown has exactly one impact class and a user-visible rationale. |
| `RankedQuestionQueue` | Unknown analysis and current resolution-cycle count. | Stable deterministic queue. | Ranking follows impact → existing priority → question ID; no model-only ordering. |
| `ClarificationQuestionBatch` | Ranked queue and policy limits. | At most three questions, their impact, why-asked text, and allowed answer/defer controls. | A Critical question cannot expose a skip/defer control. |
| `ClarificationAnswerBatch` | User answer/unknown/defer decisions tied to stable question IDs. | Validated source-tagged answers or field errors. | No secrets; no answer is silently defaulted; non-blocking deferral requires a visible assumption. |
| `ClarificationRevision` | Validated committed answer batch and prior revision. | Immutable revision ID, exit reason, confidence before/after, and `revisionDiff`. | Append-only; a correction creates a new revision, never edits history. |
| `DecisionStateEvaluation` | Clarification revision, applicable unknowns, assumptions, confidence policy, and current decision scope. | Decision state, named readiness/block reason, next human decision, and immutable basis references. | Confidence supports but never replaces a decision; no Decision State starts execution. |
| `RequirementSnapshotRevision` | Clarification revision and user-owned facts. | Canonical refreshed Requirement Snapshot or a blocked result. | Derived fields are generated through one canonical path. |
| `BlueprintRevision` | Refreshed Requirement Snapshot and prior selection. | Candidate set effect and selection retained/invalidated state. | Never silently replaces a user-selected Blueprint. |
| `BuildPlanRevision` | Valid Blueprint state and refreshed requirement. | Regenerated or unchanged Build Plan plus explanation reference. | No execution, approval, Provider, MCP, Runtime, or provisioning side effect. |

#### Contract boundary with later Runtime

The Clarification Engine produces a revisioned requirement-and-planning input;
it does not invoke Runtime. A later approved Runtime or execution contract may
reference a final immutable clarification revision, Blueprint revision, and
Build Plan revision after the appropriate approval boundary. It must not treat
an in-progress clarification state, confidence score, or user assumption as
evidence of execution success.

### 6.4 Decision Policy: information complete versus decision ready

BuildFlow does not wait for information to become exhaustive. Exhaustive
information is often impossible, expensive, or irrelevant. Instead, it asks
whether the accountable user can make the **next scoped decision** with the
known facts, visible assumptions, alternatives, consequences, and blocker
state.

| Concept | Meaning | Product use |
| --- | --- | --- |
| `INFORMATION_COMPLETE` | All potentially useful information is known. This is not a realistic or required product condition. | Never required to end Clarification. |
| `INFORMATION_SUFFICIENT` | The deterministic coverage and critical-unknown policy permit an informed next decision. | Supporting signal for a Decision State; confidence is one input. |
| `DECISION_READY` | The user can understand what is being decided, why it matters, the material alternatives and assumptions, and the consequences of proceeding. | The governing criterion for ending Clarification and entering Blueprint Review. |
| `BUILD_AUTHORIZED` | A separate later approval and all external/runtime prerequisites have been satisfied. | Required before any build/execution starts; not produced by this Sprint. |

**Decision Ready** is therefore the governing product criterion. Confidence
`≥ 0.80` and `CRITICAL` unknowns `= 0` are necessary evidence for readiness,
but they are not independently sufficient. BuildFlow must also have a named
next decision, a reviewable basis appropriate to that decision scope, visible
assumptions, and an explanation of what changes if the user accepts or revises
it. A Blueprint candidate set is required for `BLUEPRINT_SELECTION`, but not
for the earlier `REQUIREMENT_READINESS` decision to enter Blueprint Review.

#### Decision State model

`DecisionState` is a conceptual product object above the Blueprint and below
the clarified Requirement. It tracks whether the next human decision can be
made; it is not a Runtime, Step, Attempt, autonomous-session, Provider, or
approval-execution status.

```text
DecisionState:
  scope: REQUIREMENT_READINESS | BLUEPRINT_SELECTION | BUILD_AUTHORIZATION
  status: NOT_READY | READY_WITH_ASSUMPTIONS | READY_FOR_REVIEW |
          READY_FOR_BUILD | SUPERSEDED
  basis:
    clarificationRevisionId
    snapshotRevisionId
    confidencePolicyVersion
    confidence
    unresolvedUnknownReferences
    assumptionReferences
    revisionDiffReference
  nextDecision: named human decision
  reasonCodes: stable policy reasons
  requiredApproval: yes | no
```

| Status | Meaning | Allowed transition / required user action |
| --- | --- | --- |
| `NOT_READY` | A Critical unknown, invalid fact, contradiction, or missing decision basis prevents a responsible decision. | Ask or correct the named item; no Blueprint Review or Build start. |
| `READY_WITH_ASSUMPTIONS` | Critical requirements are resolved, but Important/Optional assumptions materially shape the recommendation. | User reviews and accepts/revises assumptions; it cannot silently become a build start. |
| `READY_FOR_REVIEW` | The decision package is sufficient: basis, assumptions, trade-offs, and revision explanation are visible. | Begin the corresponding human review, initially Blueprint Review. |
| `READY_FOR_BUILD` | Blueprint and Build Plan decision are approved, remain unsuperseded, and the decision package names the required external approvals. | May request later Build Authorization; it does not execute work itself. |
| `SUPERSEDED` | A new goal, answer, constraint, or preference revision invalidated a prior decision basis. | Return to the affected readiness/review state; no stale approval carries forward. |

#### State policy by decision scope

- `REQUIREMENT_READINESS` is the only scope emitted by the future
  Clarification implementation. It may reach `READY_WITH_ASSUMPTIONS` or
  `READY_FOR_REVIEW`, enabling Blueprint Review.
- `BLUEPRINT_SELECTION` is a dependent future decision scope. It can use the
  same envelope to record candidate selection or invalidation, but it is not
  implemented by this Clarification Sprint.
- `BUILD_AUTHORIZATION` is a later governance and external-prerequisite scope.
  Only it may transition to `READY_FOR_BUILD`, and only after explicit user
  approval plus separate Runtime/Provider/credential/consent policy checks.

This separation prevents a high confidence score, a generated Blueprint, or a
user's wish to "force build" from being misinterpreted as permission to start
external work.

## 7. Snapshot Refresh, Diff, and Cost Policy

### 7.1 Options considered

| Option | Benefits | Cost / correctness risk |
| --- | --- | --- |
| Full regeneration after every answer | One canonical code path; lowest stale-derived-state risk. | Repeats parsing, candidate generation, planning, and any future AI-assisted analysis for each keystroke or answer; can hide the exact cause of a change. |
| Incremental patching of Blueprint / Plan | Potentially lower work for small changes. | Requires a complete dependency/invalidation graph; easy to retain stale connectors, costs, consent, selected candidates, or plan tasks. |
| Batch-aware hybrid regeneration | Captures one explainable diff per committed batch; avoids work while the user is typing; retains canonical derivation for affected artifacts. | Needs a deterministic impact classifier and selected-Blueprint validity check. |

### 7.2 Cost boundary

The current Requirement, Blueprint candidate, and Build Plan generators are
local deterministic repository code. They do not make an AI/Provider call.
Therefore v1 must not describe local recomputation as an AI-call cost.

However, the design must stay safe if future question analysis becomes
AI-assisted:

- No calculation runs for each keystroke.
- Answers are validated and committed as a deliberate answer or batch submit.
- At most one analysis and derived-artifact refresh is allowed per committed
  batch.
- Question generation/ranking, Blueprint refresh, and Plan refresh must share
  one revision input and one visible `revisionDiff`.
- Live LLM generation, caching, model choice, token budgets, and Provider cost
  controls remain out of scope until separately approved.

### 7.3 Proposed policy: batch-aware revision regeneration

Use the hybrid option:

1. Preserve user-owned goal, explicit preferences, answer history, visible
   assumptions, and the current snapshot revision as the clarified input
   record.
2. On a committed answer batch, classify the changed fields and create one
   `revisionDiff` containing Before → Changed → After and the intended derived
   effects.
3. If a change affects a derived artifact, rebuild the affected **derived
   snapshot set** through the existing canonical `createRequirementSnapshot`
   path. Do not manually patch a Blueprint, connectors, or Build Plan.
4. If a change affects only clarification display metadata and cannot affect
   the Requirement, constraints, Blueprint candidates, Build Plan, approval,
   or user action, preserve the derived set and record `unchanged` in the
   diff.
5. Preserve an existing selected Blueprint only when it remains a valid member
   of the regenerated candidate set and still satisfies revised constraints.
6. If the selection no longer remains valid, invalidate it explicitly in the
   diff, explain why, and require Blueprint review rather than silently
   selecting a different architecture.
7. Do not mutate an Autonomous Session, Runtime state, approval record,
   Provider result, MCP result, Evidence, or completed execution as a side
   effect of clarification.

This chooses deterministic correctness and explainability over speculative
partial artifact mutation, while avoiding unnecessary recomputation during
draft input and after display-only changes.

### 7.4 Revision explainability contract

Every committed revision that changes the Requirement Snapshot, Blueprint
candidate set, selected Blueprint validity, or Build Plan must produce a
user-readable explanation. “Regenerated” alone is not an explanation.

| Explainability record | Required content | User-visible purpose |
| --- | --- | --- |
| Revision identity | Revision ID, prior revision ID, policy version, and committed reason. | Establishes which decision changed the design. |
| Trigger | Answered/revised/deferred question IDs, answer source, and safe summary of the user decision. | Explains what initiated the change without exposing sensitive values. |
| Requirement impact | Before / Changed / After at the affected Requirement, constraint, or preference fields. | Shows the factual basis for the revision. |
| Confidence impact | Confidence before/after, impact-class coverage changes, exit reason before/after. | Explains whether the information became more or less sufficient. |
| Decision impact | Decision State before/after, named next decision, blocker or readiness reason, and whether a prior decision was superseded. | Explains whether the user may now review a Blueprint, must resolve an assumption, or must answer a blocker. |
| Blueprint impact | Candidate set regenerated/unchanged, components or constraints affected, selected Blueprint retained/invalidated, and why. | Makes architecture changes reviewable before approval. |
| Build Plan impact | Regenerated/unchanged state and added, removed, reordered, or materially changed task references. | Shows how the execution plan changed without claiming execution occurred. |
| Scope of non-change | Runtime, Provider, MCP, Evidence, approval, session, and completed execution effects. | Explicitly proves that clarification did not alter external or completed work. |

The visible explanation must answer these three questions in order:

```text
1. What user fact or assumption changed?
2. Which Requirement / Blueprint / Build Plan areas changed because of it?
3. What must the user review or decide next?
```

Revision explanations are generated from structured diff fields and stable
reason codes, not free-form model narration. A future AI-written explanation
may be supplementary but cannot be the authoritative audit record. Reverting
an answer creates a new compensating revision with the same explanation
requirements; historical revisions remain immutable.

## 8. Conversation UX Principles

The interaction is a bounded decision aid, not an endless chatbot.

- Show one focused question at a time within a visible batch counter such as
  `1 of 3`.
- Explain **why this is being asked** and what it can affect: Blueprint,
  Build Plan, cost, approval, or required user work.
- Prefer structured controls (choice chips, select, concise text) for known
  fields; permit free text only where the fact cannot be safely enumerated.
- Provide `Not sure` when it can create a visible assumption, and `Answer
  later` only for non-blocking questions.
- After each batch, present a short “What BuildFlow now knows” summary, an
  assumptions list, and a concrete next state.
- Never hide remaining blockers behind a generic percentage or imply that a
  Blueprint is final while required facts are unresolved.
- Avoid a 10- or 20-question transcript. When the cap is reached, summarize
  the unknowns and request an explicit next decision instead of creating a new
  unbounded queue.
- The UI may not initiate external actions. Approval, credentials, Provider,
  MCP, provisioning, Runtime, and polling boundaries remain separate.

## 9. Proposed In Scope for a Later Implementation Sprint

- Persist user clarification answers, explicit unknowns, and assumptions as
  part of the existing Project Requirement Snapshot boundary.
- Provide a bounded browser interaction for the existing priority question
  queue.
- Make clarification summary, conversation state, and missing facts
  answer-aware.
- Regenerate derived Blueprint candidates and Build Plan according to the
  revision-based policy.
- Show a clear change summary, remaining blockers, and assumption state.
- Add focused pure-unit, server-action, and browser interaction test coverage.
- Preserve backward compatibility for existing projects that have a snapshot
  without clarification answer history.

## 10. Explicitly Out of Scope

- Any work in the current Visual Slice while its User QA gate is pending.
- Live LLM question generation, Provider invocation, MCP invocation, model
  selection, or third-party AI framework adoption.
- Runtime execution, autonomous session start/resume/continue, provisioning,
  polling, retry, cancellation, or result generation.
- Credential capture, OAuth, account connection, approval execution, billing,
  or cost charging.
- Evidence Bundle/Report generation, Agent Save, Replay, Marketplace,
  persistence redesign outside the existing Project snapshot boundary, public
  API, deployment, and database schema migration without a later approval.
- Broad chat UI, cross-project memory, personalization, or automated question
  learning.

## 11. Candidate Future File and Module Impact Map

This is an impact analysis, not authorization to change these files.

| Candidate path | Expected role | Reuse / change expectation | Risk |
| --- | --- | --- | --- |
| `src/features/requirements/types.ts` | Answer and clarification-state types. | Compatible extension required. | Medium |
| `src/features/requirements/clarification.ts` | Question policy, impact, sufficient-information calculation. | Extend existing engine. | Medium |
| `src/features/requirements/conversation.ts` | Bounded batch and next-question state. | Extend existing deterministic queue. | Medium |
| `src/features/requirements/snapshot.ts` | Revision-based derived regeneration. | Reuse canonical generator; do not duplicate it. | High |
| `src/features/projects/actions.ts` | Authenticated Project snapshot save action. | Add a narrow validated answer-save path only if necessary. | High |
| `src/features/requirements/components/requirement-summary.tsx` | Existing Project Detail entry point. | Extend or compose a dedicated interaction panel. | Medium |
| `src/features/requirements/components/*` | New bounded clarification panel, if existing summary should remain presentation-only. | Create only after exact UI scope approval. | Medium |
| requirement/project/component test files | Regression and interaction proof. | Add only to the approved exact file list. | Medium |

No Provider, MCP, Runtime, database migration, or dependency file is a
candidate for this Sprint without a Scope Amendment.

## 12. Validation and Acceptance Criteria for the Future Sprint

1. A user can see at most three current questions in a batch and can understand
   each question's `CRITICAL`, `IMPORTANT`, or `OPTIONAL` impact.
2. Clarification exits only through a persisted named exit reason; question
   count alone never marks a requirement sufficient.
3. A `CRITICAL` unknown blocks progress; `IMPORTANT` and `OPTIONAL` unknowns
   require an answer or a user-visible reviewed assumption according to policy.
4. The `REQUIREMENT_READINESS` Decision State is visible and distinguishes
   `NOT_READY`, `READY_WITH_ASSUMPTIONS`, `READY_FOR_REVIEW`, and
   `SUPERSEDED`; it never indicates that execution has started.
5. A user can inspect one committed Before → Changed → After snapshot diff and
   its derived Blueprint/Plan effect after each answer batch.
6. User answers update the persisted Requirement Snapshot without starting any
   execution or external operation.
7. Recomputed Blueprint candidates and Build Plan derive only from the revised
   clarified input set through the canonical snapshot path.
8. An invalid Blueprint selection is surfaced clearly rather than retained as
   stale or replaced silently.
9. Existing projects without answer history remain readable and receive a
   deterministic initial clarification state.
10. Inputs resembling secrets are not persisted as clarification answers.
11. Unit tests cover impact ranking, batch limits, exit criteria, confidence
    calculation, answer source, assumptions, revision diffs,
    Decision State transitions, selected-Blueprint validity, and
    stale-derived-state prevention.
12. Integration tests cover authorized answer submission and Project snapshot
   persistence without Provider, MCP, Runtime, or approval actions.
13. Authenticated browser QA verifies the bounded interaction, visible change
    summary, explicit assumptions, and absence of external side effects.
14. Lint, typecheck, full tests, build, `git diff --check`, and secret scan
    pass before Code Review.

## 13. Open Questions and Decision Timing

### 13.1 Must resolve before Scope Freeze

| Question | Why it blocks Freeze | Proposed direction |
| --- | --- | --- |
| Clarification persistence boundary | Determines implementation scope, data compatibility, and whether any database work is needed. | Prefer compatible JSON within the existing Project snapshot for v1 unless an audit/history requirement proves it insufficient. |
| Snapshot diff minimum record | Explainability and Undo cannot be claimed without a stable diff contract. | Freeze field-level Before / Changed / After, reason, derived effects, and source references; no full duplicate snapshot. |
| Critical/Important/Optional taxonomy | Determines which answers block user progress. | Freeze goal-type mapping and the rule for an explicitly unknown budget/tool value. |
| Sufficiency threshold and confidence weights | Determines when questioning may stop. | Freeze the `0.80` deterministic threshold or approve a different measurable threshold. |
| Decision State v1 boundary | Determines whether "ready" means enough information, ready for Blueprint review, or authority to execute. | Freeze `REQUIREMENT_READINESS` as this Sprint's only emitted scope; Build authorization remains later and separate. |
| Decision State transition reasons | Determines how a user understands a blocker, assumption, or invalidated decision. | Freeze the stable reason-code set and `SUPERSEDED` invalidation semantics. |
| Selected Blueprint invalidation | Determines whether a user decision is retained, invalidated, or silently changed. | Explicitly invalidate only; never auto-select a new Blueprint. |
| Derived refresh trigger | Determines correctness and cost behavior. | Commit-level batch-aware regeneration through the existing canonical snapshot path. |

### 13.2 May be decided in implementation planning or implementation

| Question | Safe later decision boundary |
| --- | --- |
| Exact TypeScript field names and component layout | Must preserve the frozen conceptual contract and exact approved file scope. |
| Korean wording, visual treatment, and accessible control details | Browser QA and accessibility acceptance; does not alter policy. |
| Whether v1 retains a compact historical answer list or only the latest answer plus revision diffs | Allowed only if the frozen persistence boundary and explanation guarantees remain intact. |
| Question-control presentation (chips, select, concise text) | Must preserve impact, deferral, and validation behavior. |
| Local performance thresholds and cache implementation | No cache may change revision semantics or return stale derived artifacts. |

### 13.3 Deferred beyond this Sprint

| Topic | Reason |
| --- | --- |
| Rule-based versus live LLM question selection | v1 remains deterministic; live AI needs Provider, evaluation, safety, and cost scope. |
| Cross-project memory and personalization | New data and privacy boundary. |
| Broad conversational chat, locale expansion, and automated question learning | Product expansion beyond bounded clarification. |
| Database migration or normalized answer-event table | Not needed unless the Scope Freeze rejects compatible snapshot persistence. |

## 14. Development Charter Compliance

| Charter requirement | Compliance |
| --- | --- |
| Product Vision | Makes the “AI understands the goal and collects missing information” stage a first-class browser experience. |
| Contract First | Defines a versioned Clarification Engine input/output contract, deterministic confidence policy, and immutable revision explanation boundary before implementation. |
| Scope Discipline | Limits the candidate Sprint to clarification interaction and derived Snapshot/Blueprint/Plan refresh; defers execution and external systems. |
| OSS First | No infrastructure gap is identified for v1. Existing TypeScript, Next.js, Supabase, and Requirement modules are sufficient. Any LLM/chat dependency needs a separate OSS and Provider evaluation. |
| Reuse Before Rewrite | Reuses the goal parser, clarification queue, Requirement Snapshot creator, architecture candidates, planner, project action boundary, and Requirement Summary. |
| Browser-visible Milestone | Later implementation produces a bounded, explainable clarification flow visible in authenticated Project Detail. |
| Closed Beta Alignment | Advances the Goal → Clarification → Blueprint → Plan sequence without pretending that Provider, MCP, Runtime, Evidence, Save, or Replay are complete. |

## 15. Scope Freeze Exit Criteria

This draft is ready for PM/CTO Scope Review when reviewers confirm:

- The problem is bounded to interactive clarification, not an unscoped chat or
  AI-provider initiative.
- The three-question batch and five-question resolution-cycle policies are UX
  guardrails only, and the named exit-reason policy is accepted.
- The Critical / Important / Optional taxonomy, goal-type mapping, confidence
  weights, threshold, and no-critical-unknown rule are accepted.
- Information Sufficiency versus Decision Readiness is accepted: Decision
  Readiness governs Clarification exit, while Build Authorization remains a
  separate later approval boundary.
- The Decision State model, its v1 `REQUIREMENT_READINESS` scope, stable
  readiness/block reason codes, and `SUPERSEDED` invalidation rule are
  accepted.
- The distinction between `USER_PROCEED_WITH_ASSUMPTIONS` and an actual Build
  start is accepted; this Sprint may not force or start execution.
- Snapshot Diff has an approved minimum record, append-only revision semantics,
  and an answer-revision/Undo interpretation.
- The batch-aware regeneration cost policy, canonical derived refresh path,
  and explicit Blueprint invalidation behavior are accepted.
- The answer persistence, backward compatibility, history, and exact data
  mutation boundary decisions are resolved enough to Freeze implementation.
- The exact implementation file list, database boundary, and test plan are
  approved before activation.

## 16. PM / CTO Review Placeholders

```text
PM REVIEW: PASS
CTO REVIEW: PASS
SCOPE DECISION: APPROVED
SCOPE FREEZE: APPROVED
IMPLEMENTATION PLANNING: COMPLETE
IMPLEMENTATION READINESS REVIEW: APPROVED
READY APPROVAL: APPROVED
SPRINT READINESS: READY
SPRINT ACTIVATION: NOT STARTED
IMPLEMENTATION: NOT AUTHORIZED
```
