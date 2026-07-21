# RUNTIME-STEP-CONTRACT-001

## 1. Status

```text
SCOPE FREEZE APPROVED
APPROVED
NOT ACTIVE
SCOPE FROZEN
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

This document is a pre-activation scope review. It does not authorize Runtime
Step contract writing, code implementation, Provider Invocation, MCP Invocation,
Queue, Scheduler, Parallel Runtime, persistence, API, UI, deployment, or
Marketplace work.

This Scope Freeze record remains historical. The current contract has a limited
Attempt field-matrix amendment with independent re-review PASS in `CONTRACT.md`;
that amendment does not reopen or change this frozen Sprint scope.

Scope Freeze approval locks the boundary for a future contract-only sprint. A
separate activation approval is still required before this candidate may move to
`.buildflow/CURRENT_TASK.md`.

## 2. Objective

Define the proposed scope boundary for a future Runtime Step Contract sprint.
The goal is to decide what belongs in `RUNTIME-STEP-CONTRACT-001` before the
task is activated.

## 3. Decision Lock Baseline

The scope must comply with the approved long-term AI Runtime Decision Lock:

- Architecture Review Checkpoint: `b2802de`
- Decision Lock Checkpoint: `38c589b`
- Decision Recommendation: `KEEP CURRENT`
- Runtime control plane remains deterministic.
- LLMs do not directly control Runtime lifecycle or state transitions.
- Rule and Policy validation run before model or Tool execution.
- Runtime Step must be explicit and explainable.
- Provider Invocation Layer and Provider Adapter (Provisioning) remain separate.
- MCP Gateway remains an independent Runtime Tool execution boundary.
- Credentials remain reference-only.
- Plan, Request, Execution, Step, Attempt, and Invocation identities remain
  separate.

## 4. Existing Contract Context

Already implemented contract-only layers:

- Runtime Execution Request
- Runtime Preflight
- Runtime Execution Start

Existing design baselines:

- Runtime Step and Runtime Step Attempt are separate.
- Step retry keeps `RuntimeStepId` and creates a new `RuntimeStepAttemptId`.
- Full execution retry creates a new `RuntimeExecutionId`.
- Provider Invocation and MCP Invocation are separate contracts.
- Runtime Step Evidence is required for traceability.
- Cancellation appends Evidence and does not delete or rewrite prior Evidence.

## 5. Dependency Matrix

| Target | Relationship | Notes |
|---|---|---|
| Runtime Execution Request | Depends On | Step contracts must reference the request/execution identity without changing request semantics. |
| Runtime Preflight | Depends On | Step contracts assume preflight readiness was checked before execution start. |
| Runtime Execution Start | Depends On | Step contracts attach after start readiness; they must not move start records to running by themselves. |
| Runtime/MCP Boundary Decision Lock | Depends On | Step and Attempt identity, retry, cancellation, Provider, MCP, Approval, and Evidence boundaries must remain aligned. |
| Long-term AI Runtime Decision Lock | Depends On | Deterministic control, LLM-independent lifecycle, and Provider/MCP separation are binding constraints. |
| Provider Invocation | Future Dependency | Current scope may define references only; invocation contract and execution remain deferred. |
| MCP Invocation | Future Dependency | Current scope may define references only; MCP request/start/result implementation remains deferred. |
| Runtime Evidence Bundle / Report | Future Dependency | Step Evidence can expose references; bundle/report implementation remains deferred. |
| Approval Revalidation | Future Dependency | Step Action Approval references are allowed; full revalidation contract remains deferred. |

## 6. Proposed In Scope

- Runtime Step contract type.
- Runtime Step Attempt contract type.
- Step identity and Attempt identity references.
- Execution-to-Step relationship.
- Step input and output boundary.
- Step status model.
- Attempt status model.
- Deterministic state transition rules.
- Error and blocking reason representation.
- Evidence reference fields for Step and Attempt.
- Approval reference fields for Step Action Approval.
- Timeout policy reference.
- Cancellation reference.
- Retry policy reference and retry eligibility metadata.
- Provider Invocation reference field.
- MCP Invocation reference field.
- Dependency references for explicit ordering.
- Pure validator functions for Step and Attempt contracts.
- Unit tests for valid and invalid contract shapes.
- Documentation updates limited to the Runtime Step scope and report.

## 7. Proposed Out of Scope

- Runtime execution engine.
- Actual Step execution.
- Provider Invocation implementation.
- MCP Invocation implementation.
- Gateway Runtime execution.
- Queue, Scheduler, Worker, Lease, or Lock implementation.
- Parallel Runtime execution.
- Runtime Planner implementation.
- Runtime Compiler implementation.
- Budget Router implementation.
- Persistence, DB schema, migration, or API endpoint.
- UI.
- Deployment.
- Marketplace integration.
- Vault access or live Credential validation.
- Raw Provider or MCP response storage.
- Runtime Evidence Bundle or Runtime Evidence Report implementation.

## 8. Non-Goals

- This sprint does not optimize Runtime performance.
- This sprint does not improve Provider call success rate.
- This sprint does not support parallel execution.
- This sprint does not reduce execution cost.
- This sprint does not implement real-time execution monitoring.
- This sprint does not prove live Provider, MCP, or deployment behavior.
- This sprint does not make any Package or Agent `READY`.
- This sprint does not create a general Runtime engine.

## 9. Deferred

- Provider Invocation Contract implementation.
- MCP Invocation Contract implementation.
- Runtime Execution Result contract.
- Runtime Evidence Bundle and Report implementation.
- Runtime Approval Revalidation contract.
- Cancellation execution semantics.
- Parallel execution ordering and dependency scheduler.
- Retry backoff algorithm.
- Queue, worker, lease, and resume mechanics.
- Cost and usage aggregation.

## 10. Open Questions

- Should `RuntimeStepStatus` and `RuntimeStepAttemptStatus` share values or use
  separate enums?
- Should timeout and retry policy references be required for all steps or only
  for executable steps?
- Should a Step be allowed to reference both Provider and MCP Invocation
  candidates, or must each Step choose one invocation boundary?
- Which status should represent a Step waiting for Step Action Approval?
- Should cancellation be represented at Step level, Attempt level, or both?
- What minimum Evidence reference is required before a Step can be terminal?

## 11. Proposed PM/CTO Decisions

These decisions are approved for Scope Freeze. They do not activate the sprint
or authorize implementation.

| Question | Proposed Decision | Rationale |
|---|---|---|
| Step status and Attempt status | Use separate enums. | Step is the logical unit; Attempt is one execution try. Separate enums avoid conflating lifecycle with execution attempt detail. |
| Timeout and retry policy references | Optional references with explicit default policy when omitted. | Not every Step needs custom policy, but default behavior must be deterministic and visible. |
| Provider and MCP invocation candidates | Disallow both on the same Step. | One Step chooses one invocation boundary to keep Evidence, approval, retry, and failure semantics explainable. |
| Approval waiting representation | Use blocking reason, not Step status. | Approval is a reason a Step cannot proceed; it should not become a lifecycle state that hides the underlying Step status. |
| Cancellation representation | Allow `CANCELLED` as Step status; defer real cancellation execution semantics. | Step-level result should be visible, while actual external cancellation behavior needs a later contract. |
| Terminal Evidence minimum | Require Evidence reference for `SUCCESS`, `FAILED`, and `CANCELLED`; allow `SKIPPED` to use a reason reference. | Terminal outcomes need traceability, while skipped work may be justified by a deterministic reason without execution Evidence. |

## 12. Acceptance Criteria

Scope Freeze can be approved only if PM/CTO accepts that the future sprint:

- remains contract-only;
- preserves deterministic Runtime control;
- does not implement execution;
- keeps Step and Attempt identities separate;
- keeps Provider Invocation and MCP Invocation as references only;
- keeps Credential handling reference-only;
- defines explicit status and transition rules;
- includes pure validation and unit tests;
- records all execution, Provider, MCP, Queue, Scheduler, DB, API, UI, and
  Marketplace work as out of scope.
- accepts or explicitly revises the proposed Open Question decisions.

## 13. Exit Criteria

The future `RUNTIME-STEP-CONTRACT-001` sprint can be closed only when:

- Runtime Step Contract review passes.
- Runtime Step Attempt Contract review passes.
- PM Approval is recorded.
- CTO Approval is recorded.
- Scope Lock remains unchanged after implementation.
- Quality gate passes.
- Working tree is clean after checkpoint commit.
- Runtime Implementation Authority remains limited to contract-only output.
- Runtime execution, Provider Invocation, MCP Invocation, Queue, Scheduler, DB,
  API, UI, deployment, and Marketplace work remain unimplemented.

## 14. Activation Conditions

`RUNTIME-STEP-CONTRACT-001` may move to `.buildflow/CURRENT_TASK.md` only after:

1. PM/CTO approves this Scope Freeze.
2. Scope is marked `APPROVED / SCOPE FROZEN`.
3. Current project state remains `BETWEEN_SPRINTS`.
4. Runtime Implementation Authority remains limited to contract-only work.
5. A separate activation checkpoint is approved.

## 15. Impact on Existing Runtime Contracts

No changes are proposed to Runtime Execution Request, Runtime Preflight, or
Runtime Execution Start. The future Step contract should consume their
identities and readiness assumptions without changing them.

## 16. Architecture Decision Lock Alignment

No conflict was found with the approved Architecture Decision Lock. This scope
keeps Runtime lifecycle deterministic, separates identities, keeps Provider and
MCP invocation boundaries separate, and preserves Credential reference-only
rules.

## 17. PM/CTO Decision

```text
PM Decision: APPROVE
CTO Decision: APPROVE
Scope Freeze Decision: APPROVED
Scope Status: SCOPE FROZEN
RUNTIME-STEP-CONTRACT-001 Status: APPROVED / NOT ACTIVE / SCOPE FROZEN
RUNTIME IMPLEMENTATION: NOT APPROVED
Activation Requirement: Scope Freeze checkpoint commit and separate activation approval required
```
