# Next Task

## Current Active Task

```text
ARCHITECTURE-AI-RUNTIME-REVIEW-001
Long-term AI Runtime Architecture Review
```

Status:

```text
ACTIVE
RESEARCH / DRAFT
ARCHITECTURE REVIEW ONLY
NOT AN IMPLEMENTATION SPECIFICATION
```

Output:

```text
docs/architecture/LONGTERM_AI_RUNTIME.md
```

## Review Result

```text
Decision Recommendation: KEEP CURRENT
Decision Lock: APPROVED
Architecture Gate Closeout: PENDING
```

Evidence-based findings:

- current Runtime Execution Request, Preflight, and Execution Start contracts
  are compatible with Runtime First, Rule Before LLM, Provider Independence,
  and Compile Once Execute Many;
- current `src/features/planner/` implements build planning only;
- Runtime Planner and Runtime Compiler are not implemented;
- LLM Optional means the Runtime core does not depend on an LLM for lifecycle,
  policy, approval, routing safety, or Evidence;
- no blocking contract revision is required before Runtime Step contract
  design.

## Required Next Gate

Architecture Gate closeout must record the approved Decision Lock and return the
project to `BETWEEN_SPRINTS`.

No implementation task may start until PM/CTO explicitly:

1. closes `ARCHITECTURE-AI-RUNTIME-REVIEW-001`; and
2. approves and scope-freezes a next task.

## Candidate After Decision Lock

```text
RUNTIME-STEP-CONTRACT-001
```

Candidate status:

```text
NOT APPROVED
NOT ACTIVE
NOT SCOPE FROZEN
```

Potential scope remains contract-only. It must not be inferred as approval for
Runtime execution, Runtime Planner, Runtime Compiler, LLM Budget Router,
Provider execution, MCP Invocation, persistence, API/UI, deployment, or
Marketplace work.

## Preserved Baseline

- Last completed task: `RUNTIME-EXECUTION-START-001`
- Implementation checkpoint: `6f3ed7d`
- Operational closeout checkpoint: `7ab214c`
- Package Readiness: `CONDITIONALLY_READY`
- Push / Merge / Deploy after closeout: NOT PERFORMED

---

## Previous Completed Scope

Completed output:

```text
docs/sprints/LIVE-EVIDENCE-AGENT-001/PACKAGE-APPROVAL-GATE.md
```

Current Package Readiness judgement:

```text
CONDITIONALLY_READY
```

Identified P1 gaps:

- GAP-001: MCP Tool Invocation Evidence is not found.
- GAP-003: Marketplace publish readiness Evidence is not found.

Resolved / reduced gap:

- GAP-002: Deterministic JSON Agent Package artifact export Evidence is now
  implemented. ZIP/Installer export remains out of scope and should be treated
  as a separate future transport/package task if PM prioritizes it.
- GAP-002B: Package Verification pure verifier is implemented.
- GAP-002C: Package Evidence Bundle reference-only pure builder is
  implemented.
- GAP-002D: Package Verification Pipeline pure composition is implemented.
- GAP-002E: Package Evidence Report pure builder is implemented. Persistence,
  API/UI/PDF presentation, Approval Gate integration, and Quality Score
  calculation remain out of scope.
- GAP-002F: Package Approval Gate pure evaluator is implemented. Persistence,
  API/UI, authorization enforcement, real approval capture, and approval record
  integration remain out of scope.

## Completed Task

```text
PACKAGE-VERIFICATION-001
```

Status:

```text
IMPLEMENTED
PM REVIEW REQUIRED
PURE VERIFIER ONLY
```

Completed:

- Verification Pipeline design
- Verification Report Contract design
- Artifact Integrity Check design
- Package/Profile Contract Validation boundary
- Evidence Bundle boundary
- Verification Status model
- Failure Classification
- Approval Gate relationship
- Quality Score input candidates

Code implementation:

```text
IMPLEMENTED
```

Implemented output:

```text
src/features/agents/package-verification.ts
src/features/agents/package-verification.test.ts
```

Current valid artifact verification status:

```text
VERIFIED_WITH_LIMITATIONS
```

`VERIFIED` is intentionally not returned by the first implementation.

## Completed Task

```text
PACKAGE-EVIDENCE-BUNDLE-001
```

Status:

```text
IMPLEMENTED
PM REVIEW REQUIRED
REFERENCE-ONLY PURE BUILDER
```

Completed:

- reference-only Evidence Bundle contract
- deterministic bundle id
- deterministic core
- bundle integrity checksum
- evidence reference normalization, deduplication, and sorting
- status model: `INCOMPLETE`, `VALID`, `VALID_WITH_LIMITATIONS`, `INVALID`
- approval reference separation
- secret-safe failure reporting

Code implementation:

```text
IMPLEMENTED
```

Implemented output:

```text
src/features/agents/package-evidence-bundle.ts
src/features/agents/package-evidence-bundle.test.ts
```

Current valid bundle status:

```text
VALID_WITH_LIMITATIONS
```

`VALID` is intentionally not returned by the first implementation.

## Completed Task

```text
PACKAGE-VERIFICATION-PIPELINE-001
```

Status:

```text
IMPLEMENTED
PM REVIEW REQUIRED
PURE PIPELINE ONLY
```

Completed:

- Package Export → Package Verification → Package Evidence Bundle composition
- `EXPORT`, `VERIFICATION`, `EVIDENCE_BUNDLE` stage summaries
- pipeline status model: `FAILED`, `INCOMPLETE`,
  `COMPLETED_WITH_LIMITATIONS`, `COMPLETED`
- deterministic pipeline summary
- stage consistency checks for package id, package version, artifact checksum,
  verification report checksum, and bundle checksum
- safe structured failures
- upstream failure short-circuiting
- evidence reference normalization policy documentation
- secret-safe failure reporting

Code implementation:

```text
IMPLEMENTED
```

Implemented output:

```text
src/features/agents/package-verification-pipeline.ts
src/features/agents/package-verification-pipeline.test.ts
```

Current valid pipeline status:

```text
COMPLETED_WITH_LIMITATIONS
```

`COMPLETED` is intentionally not returned by the first implementation.

## Completed Task

```text
PACKAGE-EVIDENCE-REPORT-001
```

Status:

```text
IMPLEMENTED
PM REVIEW REQUIRED
PURE REPORT BUILDER ONLY
```

Completed:

- Evidence Report summary-first boundary
- reference-based source model
- report status model
- status separation from pipeline status, package readiness, approval,
  deployability, and Marketplace readiness
- Package Readiness relationship
- evidence summary categories
- approval relationship without executing approval
- deterministic report id and report integrity checksum
- secret safety requirements
- human-readable summary boundary
- status non-upgrade checks
- deployability and Marketplace non-inference

Implemented output:

```text
src/features/agents/package-evidence-report.ts
src/features/agents/package-evidence-report.test.ts
docs/sprints/LIVE-EVIDENCE-AGENT-001/PACKAGE-EVIDENCE-REPORT.md
```

Code implementation:

```text
IMPLEMENTED
```

Current valid report status:

```text
VALID_WITH_LIMITATIONS
```

## Completed Task

```text
PACKAGE-APPROVAL-GATE-001
```

Status:

```text
IMPLEMENTED
PM REVIEW REQUIRED
PURE APPROVAL GATE ONLY
```

Completed:

- Package Approval Gate boundary
- reference-only Approval Request contract
- reference-only Approval Decision contract
- Approval Scope model
- Actor / Approver reference model
- Gate Status model
- Gate Result contract
- Evidence Report checksum binding
- authorization expression
- stale, supersede, and revoke policy
- deterministic request/decision/gate id and checksum rules
- timestamp and expiration boundary
- secret-safe reason and comment boundary
- open PM decisions
- recommended v1 policy
- pure Approval Request builder
- pure Approval Decision builder
- pure Gate evaluator
- 86 unit tests
- Final QA remediation coverage for BuildResult union, source stale, revoke,
  supersede, expiration, gate priority, duplicate decision policy, full payload
  exclusion, and non-mutation edge cases

Design output:

```text
docs/sprints/LIVE-EVIDENCE-AGENT-001/PACKAGE-APPROVAL-GATE.md
```

Code implementation:

```text
IMPLEMENTED
```

Implemented output:

```text
src/features/agents/package-approval-gate.ts
src/features/agents/package-approval-gate.test.ts
```

Current approval gate implementation status:

```text
APPROVED_WITH_LIMITATIONS capable
```

The implementation does not implement persistence, API/UI, authorization
enforcement, real approval capture, Runtime execution, MCP Invocation, Provider
execution, deployment, Marketplace behavior, Vault access, or Credential access.

Current target test:

```text
npx vitest run src/features/agents/package-approval-gate.test.ts
PASS — 86 tests
```

## Next Single Task Candidate

Do not start another follow-up without PM confirmation.

Recommended:

```text
PACKAGE-APPROVAL-GATE-001 Final QA + Checkpoint Commit
Review the Approval Gate implementation diff, run the full quality gate, and
create a checkpoint commit only if all gates pass.
```

Suggested minimal file scope:

```text
src/features/agents/package-approval-gate.ts
src/features/agents/package-approval-gate.test.ts
src/features/agents/index.ts
docs/sprints/LIVE-EVIDENCE-AGENT-001/PACKAGE-APPROVAL-GATE.md
docs/sprints/LIVE-EVIDENCE-AGENT-001/QA-SCOPE.md
memory/05_current_sprint.md
memory/06_change_log.md
memory/07_next_task.md
```

This must remain pure evidence/approval-contract work unless PM explicitly
approves implementation. It must not invoke an MCP Tool, read Vault, use live
Credentials, perform Provider execution, write DB records, capture real
approval decisions, publish Marketplace listings, or deploy.

Alternative PM direction:

```text
GAP-001 MCP Tool Invocation Evidence boundary
```

This alternative requires explicit approval because it may touch live
Credentials, external systems, cost, and provider permissions.

---

## 1. Task Summary

Completed: finalized the QA-only scope for `LIVE-EVIDENCE-AGENT-001` and documented the
Evidence Checklist and Package Readiness judgement criteria.

This task is documentation and QA planning only. It must not perform live
Provider execution, deployment, MCP Tool Invocation, Runtime implementation, or
Marketplace implementation.

## 2. User Intent

The user wants BuildFlow to proceed safely toward real Agent Evidence without
accidentally crossing Credential, cost, deployment, or external-resource
boundaries.

The preferred direction is:

```text
QA-only first
→ identify missing live evidence
→ request separate approval for only the necessary live actions
```

## 3. Current Context

Completed foundation:

- Agent Capability / Block / Blueprint / Definition contracts
- MCP Registry and Tool contracts
- Agent Tool Resolution Planner
- Agent Validation Gate
- Agent Package/Profile contract

Current candidate:

```text
LIVE-EVIDENCE-AGENT-001
Status: DRAFT / NOT APPROVED / NOT SCOPE FROZEN
Roadmap alignment: AGENT-EVIDENCE-001
```

Current repository state at memory creation:

```text
main clean, synced with origin/main
HEAD: de62266 docs: draft live evidence agent scope
```

## 4. Scope

- Review `docs/sprints/LIVE-EVIDENCE-AGENT-001/TASK.md`.
- Convert the draft into a QA-only Sprint scope proposal.
- Define Evidence Checklist.
- Define Package/Profile readiness judgement criteria.
- Define PASS / BLOCKED / NOT SUPPORTED criteria.
- Separate existing-evidence checks from live-action-needed checks.
- Identify user approvals required for any later live action.
- Keep actual live action deferred.

## 5. Out of Scope

- Provider execution
- Deployment
- MCP Tool Invocation
- Gateway Runtime implementation
- Runtime implementation
- Marketplace implementation
- Package publishing
- DB migration
- UI implementation
- Credential or Vault value access
- Secret output
- Mock success
- Placeholder READY

## 6. Files to Inspect

Primary:

- `.buildflow/NEXT_TASK.md`
- `.buildflow/STATUS.md`
- `.buildflow/CURRENT_TASK.md`
- `docs/sprints/LIVE-EVIDENCE-AGENT-001/TASK.md`
- `docs/sprints/LIVE-EVIDENCE-001/REPORT.md`
- `docs/sprints/LIVE-EVIDENCE-002/REPORT.md`
- `docs/sprints/AGENT-PACKAGE-001/REPORT.md`
- `docs/project/ROADMAP.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/TECH_DEBT.md`

Supporting:

- `src/features/agents/package-profile.ts`
- `src/features/agents/validation-gate.ts`
- `src/features/agents/tool-resolution.ts`
- `src/features/mcp/types.ts`

## 7. Implementation Requirements

Documentation-only requirements:

- Do not start implementation.
- Do not move the Sprint to `APPROVED / SCOPE FROZEN` unless explicitly told.
- Do not modify application code.
- Do not read Vault or Credential values.
- Do not run live Provider checks.
- Do not deploy.
- Do not invoke MCP Tools.

Expected document output:

- QA-only scope proposal
- Evidence Checklist
- Package/Profile readiness judgement table
- Existing Evidence coverage table
- Live-action-needed list
- Required PM approval questions

## 8. Acceptance Criteria

- `LIVE-EVIDENCE-AGENT-001` remains clearly QA-only unless separately approved.
- Existing Evidence and missing Evidence are separated.
- Any future live action is explicitly marked as requiring approval.
- Package readiness is not confused with Marketplace publish readiness.
- No Credential, Vault, Provider raw response, or secret value is recorded.
- No code, DB, UI, runtime, deployment, or Provider behavior changes occur.

## 9. Validation

Run:

```bash
git diff --check
```

If documents are edited, also run a targeted secret pattern scan over the edited
documents.

## 10. Memory Updates

After completing the QA-only scope document work:

- Update `memory/05_current_sprint.md` with the actual Sprint status.
- Update `memory/06_change_log.md` with the document change.
- Update this file with the next single task or mark the current task complete.

Do not rewrite unrelated memory sections.

## 11. Restrictions

- No automatic commit.
- No push.
- No deploy.
- No Provider execution.
- No live Credential or Vault access.
- No MCP Tool Invocation.
- No Runtime implementation.
- No Marketplace implementation.
- No Package publishing.
- No assumptions that QA-only evidence equals live production readiness.

## 12. Current Task Completion

Completed task:

```text
PACKAGE-RUNTIME-EVIDENCE-001
```

Completion state:

```text
DESIGN COMPLETE
IMPLEMENTATION NOT STARTED
NO COMMIT
```

Created document:

- `docs/sprints/LIVE-EVIDENCE-AGENT-001/PACKAGE-RUNTIME-EVIDENCE.md`

Updated supporting documents:

- `docs/sprints/LIVE-EVIDENCE-AGENT-001/QA-SCOPE.md`
- `memory/05_current_sprint.md`
- `memory/06_change_log.md`
- `memory/07_next_task.md`

Confirmed boundaries:

- Package Readiness remains `CONDITIONALLY_READY`.
- Runtime implementation did not start.
- MCP Tool Invocation did not start.
- Provider execution did not start.
- Deployment did not start.
- Marketplace work did not start.
- Vault or Credential values were not accessed.

## 13. Next Single Task Candidate

Recommended next task:

```text
PACKAGE-RUNTIME-EVIDENCE-001 PM Review and Decision Lock
```

Purpose:

- Review and lock the design-only Runtime Evidence contract before any
  implementation begins.

PM decisions to lock:

- six-layer Runtime Evidence contract
- Bundle and Report split
- Runtime Execution Request identity rules
- `startedAt` and `completedAt` identity rules
- retry approval revalidation
- stale/revoke during execution policy
- Runtime Evidence Report `VALID_WITH_LIMITATIONS` v1 default
- provider/deployment/MCP evidence reference boundary

Do not start implementation until PM explicitly approves the next implementation
task.

## 14. Current Implementation Completion

Completed implementation task:

```text
PACKAGE-RUNTIME-EVIDENCE-002
```

Completion state:

```text
IMPLEMENTATION COMPLETE
FINAL QA APPROVED
NO COMMIT
```

Implemented files:

- `src/features/agents/runtime-execution-request.ts`
- `src/features/agents/runtime-execution-request.test.ts`
- `src/features/agents/index.ts`

Updated documentation and memory:

- `docs/sprints/LIVE-EVIDENCE-AGENT-001/PACKAGE-RUNTIME-EVIDENCE.md`
- `docs/sprints/LIVE-EVIDENCE-AGENT-001/QA-SCOPE.md`
- `memory/05_current_sprint.md`
- `memory/06_change_log.md`
- `memory/07_next_task.md`

Confirmed boundaries:

- Runtime Execution Request is implemented.
- Runtime Execution Start Evidence is not implemented.
- Runtime Step Evidence is not implemented.
- Runtime Execution Result is not implemented.
- Runtime Evidence Bundle is not implemented.
- Runtime Evidence Report is not implemented.
- Runtime execution did not start.
- MCP Tool Invocation did not start.
- Provider execution did not start.
- Deployment did not start.
- Marketplace work did not start.
- Vault or Credential values were not accessed.

## 15. Next Single Task Candidate

Recommended next task:

```text
RUNTIME-MCP-BOUNDARY-001
Runtime Step / Provider / MCP / Credential Boundary Design
```

Purpose:

- Decide the next execution boundary before implementing Runtime Start, Runtime
  Step, Provider Invocation, MCP Invocation, Credential Reference, approval
  revalidation, retry, cancellation, idempotency, Connection status, and
  expected-cost display timing.

Checkpoint note:

- Runtime Execution Request is ready for checkpoint commit after explicit user
  approval.
- Do not commit automatically.
- Do not start `RUNTIME-MCP-BOUNDARY-001` until the current checkpoint is
  reviewed.

Do not start Runtime Start, Runtime Step, Runtime Result, Runtime Bundle,
Runtime Report, Provider, MCP, Connection, Credential, Cost Simulation, DB, API,
UI, Deployment, or Marketplace implementation in the next task.

## 16. Product Alignment Completion

Completed alignment task:

```text
BUILDFLOW-PRODUCT-ALIGNMENT-001
```

Completion state:

```text
DESIGN ALIGNMENT COMPLETE
IMPLEMENTATION NOT STARTED
NO COMMIT
```

Updated files:

- `memory/01_product.md`
- `memory/02_architecture.md`
- `memory/03_uiux.md`
- `memory/04_engineering.md`
- `memory/05_current_sprint.md`
- `memory/06_change_log.md`
- `memory/07_next_task.md`
- `docs/sprints/LIVE-EVIDENCE-AGENT-001/QA-SCOPE.md`

Confirmed alignment:

- BuildFlow is AI Agent Builder / AI Agent Factory.
- MCP and Provider are separate.
- Connection & Credential Layer is required.
- OAuth is preferred when available.
- API Key flows require guided connection support.
- Cost Simulation requires usage frequency and simulation language.
- Package Readiness remains `CONDITIONALLY_READY`.
- Runtime, Provider, MCP, Credential, Deployment, and Marketplace
  implementations are not started by this task.

Next single task remains:

```text
PACKAGE-RUNTIME-EVIDENCE-002 Final QA
```

Post-Final-QA decision candidate:

```text
RUNTIME-MCP-BOUNDARY-001
Runtime Step / Provider / MCP / Credential Boundary Design
```

This candidate should decide Runtime Start, Runtime Step, Provider Invocation,
MCP Invocation, Credential Reference, Approval Revalidation, retry,
cancellation, idempotency, Connection status, and expected-cost display timing.

## 17. Runtime / MCP Boundary Decision Lock Completion

Completed design task:

```text
RUNTIME-MCP-BOUNDARY-001
```

Completion state:

```text
DESIGN_LOCK_APPROVED_WITH_OPEN_DECISIONS
IMPLEMENTATION NOT STARTED
NO COMMIT
```

Created document:

- `docs/sprints/LIVE-EVIDENCE-AGENT-001/RUNTIME-MCP-BOUNDARY.md`

Confirmed boundaries:

- Runtime Execution Request and Runtime Execution are separate.
- Runtime Step and Step Attempt are separate.
- Provider and MCP Invocation are separate.
- Connection and Credential are separate.
- Runtime uses Credential References only.
- Approval revalidation is required before start/retry/resume where relevant.
- Cancellation and retry append evidence, not mutate prior evidence.
- Cost Simulation binding is designed, but engine implementation is not started.

Next single task recommendation:

```text
RUNTIME-EXECUTION-START-001
Runtime Preflight / Start Contract
```

Do not start implementation until this design lock and the current checkpoint
sequence receive explicit approval.
