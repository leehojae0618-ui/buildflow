# RUNTIME-RESULT-CONTRACT-001

## 1. Purpose

Define a reviewable scope boundary for a future, contract-only Runtime Result
Sprint. The candidate contract must describe a deterministic, reference-first
representation of a Runtime outcome without implementing Runtime execution,
Provider Invocation, MCP Invocation, persistence, or Evidence storage.

This Scope Freeze locks the contract boundary. Sprint activation authorizes
contract-document preparation only; it does not define the contract body or
grant implementation authority.

## 2. Background

The Runtime Step Contract checkpoint is recorded by Git commit:

```text
730bde8 docs: define runtime step contract
```

The approved Step contract defines logical Step and Attempt identities, status
boundaries, terminal-reference requirements, and reference-only Provider/MCP
boundaries. It deliberately delegates final Runtime outcome aggregation to a
future Result contract.

Existing Runtime Evidence design identifies `Runtime Execution Result` as a
separate layer between Runtime Step Evidence and Runtime Evidence Bundle. No
Runtime Result type, interface, validator, test, or implementation was found in
`src/features/agents/`.

The prior Runtime Evidence design treats `completedAt` as an explicit,
canonical input that participates in immutable Runtime Execution Result
identity. This aligns with the implemented Runtime Execution Start contract,
whose canonical caller-provided `startedAt` participates in execution identity.
The freeze retains that boundary; the exact serialization algorithm remains a
future contract-body decision.

## 3. Scope Source

This draft is constrained by:

- Runtime Step Contract checkpoint: `730bde8`.
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/TASK.md` for approved Step scope
  history.
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/CONTRACT.md` as the authoritative
  current Step and Attempt contract.
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/STATE_MACHINE.md` and
  `VALIDATION.md` for derived Step semantics.
- `docs/sprints/LIVE-EVIDENCE-AGENT-001/PACKAGE-RUNTIME-EVIDENCE.md` for the
  six-layer Runtime Evidence boundary.
- `docs/sprints/LIVE-EVIDENCE-AGENT-001/RUNTIME-MCP-BOUNDARY.md` for locked
  Runtime, Provider, MCP, Approval, retry, and Evidence boundaries.
- `docs/architecture/LONGTERM_AI_RUNTIME.md` for deterministic Runtime control
  and reference-only Credential principles.

`.buildflow/CURRENT_TASK.md` is authoritative for the only active Sprint:
`RUNTIME-RESULT-CONTRACT-001`. `RUNTIME-STEP-CONTRACT-001` is retained as
`NOT ACTIVE / CONTRACT CHECKPOINT COMPLETE`; it is not closed and has no
implementation approval.

## 4. Dependency Contracts

| Contract or design | Relationship | Scope-draft implication |
|---|---|---|
| Runtime Execution Request | Upstream identity and authorization reference | Result must reference, not modify, request identity or approval binding. |
| Runtime Preflight | Upstream readiness snapshot | Result must not recalculate or replace preflight readiness. |
| Runtime Execution Start | Upstream execution identity and `READY` start record | Result must correlate to one execution start without moving it through lifecycle states. |
| Runtime Step Contract | Primary upstream contract | Result consumes Step/Attempt references and must not redefine their identities, enums, or terminal-reference matrix. |
| Runtime/MCP Boundary | Decision-lock baseline | Provider and MCP remain separate Invocation contracts; Result may reference their safe outcomes only. |
| Package Runtime Evidence | Future-layer boundary | Result expresses an outcome; Evidence attests to it. Bundle and Report remain separate future layers. |
| Long-term AI Runtime | Architecture Decision Lock | Result must be deterministic, explainable, policy-bound, and LLM-independent at the control-plane boundary. |

## 5. Proposed In Scope

The future contract Sprint may define:

- Runtime Result purpose and responsibility boundary.
- One `RuntimeExecutionResult` contract as the initial Result artifact.
- Relationship among Runtime Execution, Runtime Step, and Runtime Step Attempt
  references used by `RuntimeExecutionResult`.
- Result identity and correlation references, including the relationship to
  `runtimeExecutionId`, request, and execution-start references.
- A `RuntimeExecutionResult` status model that is distinct from Runtime Step
  and Attempt status enums:

  ```text
  SUCCEEDED
  SUCCEEDED_WITH_LIMITATIONS
  FAILED
  CANCELLED
  TIMED_OUT
  BLOCKED
  INVALID
  ```

- Rules that relate terminal Step/Attempt outcomes to candidate Result creation
  without changing the approved terminal-reference matrix.
- Reference-only output, safe error, blocking, cancellation, timeout,
  limitation, and warning summaries.
- Reference-only Provider or MCP Invocation result bindings, delegated to their
  future Invocation contracts.
- Result-to-Evidence reference boundary and immutable result integrity binding.
- Deterministic serialization boundary, including canonical ordering,
  checksum inputs, and metadata exclusion candidates. `completedAt` is an
  explicit canonical input to Result identity; it must not be generated by the
  Result builder, and `completedAt < startedAt` is invalid.
- Pure validator and unit-test scope candidates only; no code implementation.

## 6. Proposed Out of Scope

- Runtime execution, Step execution, or Attempt execution.
- Provider Invocation or MCP Invocation contract bodies or implementations.
- Runtime Step, Attempt, Request, Preflight, or Execution Start contract
  changes.
- Evidence storage, Runtime Step Evidence implementation, Evidence Bundle, or
  Evidence Report implementation.
- Event Log, tracing, Observability, monitoring, or real-time status streams.
- Cost or usage aggregation, billing, Budget Router, or Policy Engine work.
- Queue, Scheduler, Worker, lease, lock, retry, resume, rollback, or
  cancellation execution semantics.
- DB, API, UI, Dashboard, deployment, Marketplace, ZIP/Installer, or
  persistence work.
- Vault access, live Credential validation, raw secret handling, or Provider/MCP
  response-body storage.

## 7. Deferred

- Separate Runtime Step Result and Runtime Step Attempt Result artifact
  contracts.
- Execution-wide aggregation semantics for partial outcomes, dependency graphs,
  and parallel execution.
- Exact result identifier algorithm, field names, and canonical serialization
  implementation. The frozen identity inputs include `completedAt`; their hash
  layout remains a contract-body decision.
- Detailed Provider/MCP normalized outcome schemas.
- Evidence attestation requirements, Bundle assembly, and Report presentation.
- Cost, usage, compensation, and actual-billing reconciliation.
- Result persistence, event streaming, querying, retention, and UI display.

## 8. Non-Goals

- This draft does not prove that a Runtime, Provider, or MCP Tool ran.
- This draft does not claim external effects, deployment success, or Marketplace
  readiness.
- This draft does not upgrade Package Readiness from `CONDITIONALLY_READY`.
- This draft does not merge Result with Evidence or treat Evidence as an
  executable payload.
- This draft does not choose an implementation language, storage model, or
  runtime engine.

## 9. Open Questions

The Open Questions Review is complete. Its decisions are recorded in
`DECISIONS.md` and do not change this frozen scope.

- `LOCK`: Result correlation and identity inputs, status meanings, reference
  matrix, deterministic serialization boundary, Evidence boundary, and pure
  validation boundary.
- `DEFER`: exact hash algorithm, detailed Step/Attempt aggregation, parallel
  and retry aggregation, Provider/MCP normalized schemas, Evidence Bundle and
  Report assembly, and safe metadata field selection.
- `REJECT`: raw Provider/MCP payloads, secret-bearing values, generated clocks,
  free-form unknown fields, and Result redefinition of Step/Attempt contracts.

Remaining contract-body detail must stay within the locked decisions and must
not expand the Scope Freeze.

## 10. Dependency Matrix

| Target | Relationship | Candidate Result responsibility | Explicitly not responsible for |
|---|---|---|---|
| Runtime Execution Request | Depends on | Correlate request identity and authorization references. | Revalidating approval or modifying request state. |
| Runtime Preflight | Depends on | Reference the final applicable readiness/blocking context when supplied. | Re-running readiness checks. |
| Runtime Execution Start | Depends on | Bind one result to one execution identity and start reference. | Starting execution or changing initial `READY` state. |
| Runtime Step | Depends on | Summarize terminal Step references and safe outputs. | Redefining Step status or terminal-reference rules. |
| Runtime Step Attempt | Depends on | Correlate immutable Attempt references where selected. | Mutating attempts or executing retry. |
| Provider Invocation | Future dependency | Reference normalized provider outcome only. | Defining provider output schema or invoking models. |
| MCP Invocation | Future dependency | Reference normalized MCP outcome only. | Defining tool effect schema or invoking tools. |
| Runtime Evidence | Future dependency | Bind evidence references that attest to the Result. | Storing, bundling, or reporting Evidence. |
| Approval Revalidation | Future dependency | Reference safe authorization/blocking outcome when available. | Evaluating approval state. |
| Cost and Usage | Deferred dependency | Optionally reserve safe references. | Aggregating usage or calculating charges. |

## 11. Exit Criteria

The frozen scope can leave its future contract Sprint only when:

- the Result/Evidence responsibility boundary is explicit;
- Step and Attempt status enums and terminal-reference matrix remain unchanged;
- Provider and MCP details remain delegated to separate Invocation contracts;
- all proposed inclusions are contract-only;
- all execution, persistence, secret, and user-interface work is excluded;
- the reference-only Result contract does not reorder Provider/MCP Invocation
  implementation or define their detailed outcome schemas;
- `RuntimeExecutionResult` remains the only initial Result artifact;
- `completedAt` remains an explicit canonical Result identity input;
- a future contract Review and PM/CTO decision pass;
- the Scope Freeze checkpoint `4f418d8` remains the frozen-scope baseline.

## 12. PM Review Placeholder

```text
PM SCOPE DECISION: APPROVE
```

The scope provides a bounded Execution outcome contract without representing
live success, external effects, deployment, or Package readiness. It preserves
Approval First and keeps Result, Evidence, and Invocation responsibilities
separate.

## 13. CTO Review Placeholder

```text
CTO SCOPE DECISION: APPROVE
```

The scope preserves identity correlation, status ownership, Result/Evidence
separation, reference-only safety, and compatibility with existing Request,
Preflight, Execution Start, and Step contracts. `completedAt` is retained as a
canonical identity input because it is caller-provided factual completion data,
not generated clock state; its exact serialization remains deferred.

## 14. Sprint Activation Status

```text
TASK: RUNTIME-RESULT-CONTRACT-001
SCOPE STATUS: FROZEN
PM SCOPE DECISION: APPROVE
CTO SCOPE DECISION: APPROVE
SCOPE DECISION: APPROVED
SCOPE FREEZE CHECKPOINT: 4f418d8
CONTRACT STATUS: NOT STARTED
CONTRACT DECISION: PENDING
PROJECT STATE: ACTIVE_SPRINT
SPRINT STATUS: ACTIVE
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

This activation records a documentation-only Sprint. It does not create a
`CONTRACT.md`, begin test or code writing, grant implementation authority, or
authorize Commit, Push, Merge, or Deploy.

## 15. Scope Freeze Decisions

1. The initial Result contract defines `RuntimeExecutionResult` only.
2. Separate Runtime Step Result and Runtime Step Attempt Result artifacts are
   deferred.
3. Result aggregates and references terminal Step/Attempt outcomes only. It
   must not redefine Step/Attempt statuses or their terminal-reference matrix.
4. The Result status model is limited to `SUCCEEDED`,
   `SUCCEEDED_WITH_LIMITATIONS`, `FAILED`, `CANCELLED`, `TIMED_OUT`, `BLOCKED`,
   and `INVALID`.
5. `completedAt` is an explicit canonical input to immutable Result identity.
   It is supplied by a future caller, never generated implicitly, and must not
   precede the referenced execution start. Exact hashing is deferred.
6. Provider and MCP detailed result formats remain owned by separate Invocation
   contracts. Result holds safe references only.
7. Result and Evidence are distinct: Result expresses a normalized outcome;
   Evidence attests to that outcome by immutable references. Bundle and Report
   remain separate future layers.
8. Event Log, Cost, Usage, persistence, API/UI, Runtime execution, and all
   external actions remain out of scope.
9. This design-only contract scope does not change the earlier Runtime/MCP
   implementation order. Invocation implementation remains a future
   dependency.

## 16. Open Questions Review Outcome

```text
OPEN QUESTIONS REVIEW: COMPLETE
SCOPE CHANGE: NONE
P0: 0
P1: 0
P2: 0
CONTRACT STATUS: NOT STARTED
CONTRACT DECISION: PENDING
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

The review locks only decisions required before the `RuntimeExecutionResult`
Contract Draft. It does not create `CONTRACT.md`, start implementation, or
change the approved Step terminal-reference matrix.

## 17. Contract Draft Status

```text
CONTRACT DRAFT: COMPLETE
CONTRACT STATUS: APPROVED
CONTRACT QA: CORRECTION COMPLETE / RE-REVIEW REQUIRED
PRIOR QA P0/P1/P2: 0/2/1
PM REVIEW: APPROVE WITH P2 NOTE
CTO REVIEW: APPROVE WITH P2 NOTE
CONTRACT DECISION: APPROVED
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

Contract draft documents:

- `CONTRACT.md`
- `STATE_MACHINE.md`
- `VALIDATION.md`
- `QA_CHECKLIST.md`
- `REVIEW.md`

The draft remains documentation-only. It does not change the frozen scope, does
not modify `DECISIONS.md`, does not change the Runtime Step contract, and does
not authorize Runtime implementation, Provider/MCP Invocation, code, tests,
Commit, Push, Merge, or Deploy.

Contract QA correction and independent re-review are complete. PM/CTO approved
the contract with the non-blocking RR-001 P2 note. This contract approval does
not authorize implementation.

## 18. Sprint Closeout Documentation

```text
PROJECT GATE REVIEW: PASS WITH NOTE
P0/P1: 0/0
SPRINT CLOSEOUT DOCUMENTATION: COMPLETE
FORMAL CLOSEOUT CHECKPOINT: PENDING COMMIT APPROVAL
IMPLEMENTATION PLANNING: READY TO REVIEW
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

The Project Gate Review recorded two non-blocking P2 notes: historical QA
snapshots in derived Result documents and a previously stale operational commit
record. The authoritative current contract remains this Sprint's approved
contract checkpoint `00eb274`; no P2 note changes contract semantics, grants
implementation authority, or blocks implementation planning review.
