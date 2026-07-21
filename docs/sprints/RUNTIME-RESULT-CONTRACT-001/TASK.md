# RUNTIME-RESULT-CONTRACT-001

## 1. Purpose

Define a reviewable scope boundary for a future, contract-only Runtime Result
Sprint. The candidate contract must describe a deterministic, reference-first
representation of a Runtime outcome without implementing Runtime execution,
Provider Invocation, MCP Invocation, persistence, or Evidence storage.

This Scope Freeze locks the future contract boundary only. It does not activate
`RUNTIME-RESULT-CONTRACT-001`, define the contract body, or grant
implementation authority.

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

The existing `.buildflow/CURRENT_TASK.md` remains authoritative for the only
active Sprint: `RUNTIME-STEP-CONTRACT-001`. This document is a non-active
future-scope record and does not change that operational state.

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

No remaining Open Question changes the frozen scope. Contract-body questions are
intentionally deferred and must not expand the scope:

1. Must an Execution Result exist only after all reachable Steps are terminal,
   or may an explicit blocked/cancelled result be created earlier by a future
   execution contract?
2. Which terminal Step/Attempt references are required in a Result summary, and
   how are duplicate references canonicalized?
3. How should `SKIPPED` Step reason references contribute to an execution-wide
   outcome without redefining the Step terminal-reference matrix?
4. Does a future Execution Result need to distinguish a blocked result caused by
   approval, connection, Credential, policy, or dependency, or reference the
   upstream blocking reasons unchanged?
5. Which safe metadata fields, if any, remain outside the deterministic core?

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
- the Scope Freeze checkpoint is committed after separate commit approval.

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

## 14. Scope Decision Placeholder

```text
TASK: RUNTIME-RESULT-CONTRACT-001
SCOPE STATUS: FROZEN
PM SCOPE DECISION: APPROVE
CTO SCOPE DECISION: APPROVE
SCOPE DECISION: APPROVED
SCOPE FREEZE CHECKPOINT: PENDING COMMIT APPROVAL
CONTRACT STATUS: NOT STARTED
SPRINT STATUS: NOT ACTIVE
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

No Sprint activation, contract writing, test writing, Commit, Push, Merge, or
Deploy is authorized by this Scope Freeze document.

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
