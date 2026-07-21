# Runtime Step Contract Review

## 1. Status

```text
TASK: RUNTIME-STEP-CONTRACT-001
CONTRACT REVIEW: PENDING INDEPENDENT RE-REVIEW
LIMITED REOPENING: AUTHORIZED — ATTEMPT FIELD MATRIX ONLY
PREVIOUS CONTRACT CHECKPOINT: 730bde8
PM / CTO AMENDMENT DECISION: PENDING RE-REVIEW
CONTRACT DECISION: AMENDED / PENDING INDEPENDENT RE-REVIEW
CHECKPOINT STATUS: RECORDED BY THIS GIT AMENDMENT COMMIT
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

## 2. Review Scope

Review documents:

- `docs/sprints/RUNTIME-STEP-CONTRACT-001/TASK.md`
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/CONTRACT.md`
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/STATE_MACHINE.md`
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/VALIDATION.md`
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/QA_CHECKLIST.md`

Review must decide whether the Runtime Step contract is internally consistent
and still inside the frozen scope.

The limited reopening may change only Attempt status-conditioned semantics for
`startedAtReference`, `completedAtReference`, `failure`, `retryDecision`,
`cancellationReference`, and `integrityChecksum`. All other approved Runtime
Step behavior remains locked.

## 3. Required PM/CTO Review Questions

1. Does the contract remain documentation-only?
2. Are Step and Attempt identities clearly separated?
3. Are Step and Attempt statuses clearly separated?
4. Is `WAITING` limited to external condition or dependency waiting?
5. Is approval waiting represented as blocking reason plus approval reference?
6. Is Attempt `TIMEOUT` distinct from Step `TIMEOUT`?
7. Are Provider and MCP invocation boundaries mutually exclusive per Step?
8. Are terminal Evidence requirements clear?
9. Are existing Runtime Request, Preflight, and Execution Start contracts
   unchanged?
10. Does the contract avoid implementation authority?

## 4. Amendment Re-review Required

The prior Implementation Approval Review found P1: Attempt fields
`completedAtReference`, `failure`, and `retryDecision` were listed as required
for every Attempt despite undefined or incompatible non-terminal and successful
status semantics.

The amendment defines the authoritative matrix in `CONTRACT.md` section 9.1.
Independent re-review must verify the matrix, field shapes, retry identity,
timeout/cancellation reference rules, and checksum boundary before this
contract returns to an approved state.

## 5. Historical Draft Decision

```text
CONTRACT QA: PASS
RE-REVIEW: PASS
P0: 0
P1: 0
P2: 0
PREVIOUS P1 FINDINGS: RESOLVED
DECISION RECOMMENDATION: KEEP CURRENT
PM DECISION: APPROVE
CTO DECISION: APPROVE
CONTRACT DECISION: APPROVED
CHECKPOINT STATUS: READY
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

## 6. Historical Contract QA Findings

P1 findings from first Contract QA:

1. `CANCELLED` terminal reference rule was inconsistent between `CONTRACT.md`
   and derived documents.
2. `TIMEOUT` terminal reference rule was inconsistent between `CONTRACT.md` and
   derived documents.

Remediation standard:

| Terminal status | Required reference |
|---|---|
| `SUCCESS` | Evidence reference |
| `FAILED` | Evidence reference |
| `CANCELLED` | Evidence reference or cancellation reference |
| `TIMEOUT` | Evidence reference or timeout reference |
| `SKIPPED` | Reason reference allowed |

PM/CTO Decision was held until re-review passed. The approved decision is
recorded in section 9.

## 7. Historical Contract Re-review Result

Re-review result:

```text
CONTRACT QA: PASS
RE-REVIEW: PASS
P0: 0
P1: 0
P2: 0
PREVIOUS P1 FINDINGS: RESOLVED
DECISION RECOMMENDATION: KEEP CURRENT
PM DECISION: APPROVE
CTO DECISION: APPROVE
CONTRACT DECISION: APPROVED
CHECKPOINT STATUS: READY
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

`CONTRACT.md` is the authoritative Runtime Step contract for current terminal
reference rules. `STATE_MACHINE.md`, `VALIDATION.md`, and `QA_CHECKLIST.md`
are derived documents and must not conflict with `CONTRACT.md`.

`TASK.md` is the Scope Freeze and approval record. Its terminal Evidence wording
records the approved Scope Freeze proposal and does not override the current
authoritative terminal reference matrix in `CONTRACT.md`.

Resolved P1 findings:

1. `CANCELLED` now consistently requires Evidence reference or cancellation
   reference.
2. `TIMEOUT` now consistently requires Evidence reference or timeout reference.

Compatibility findings:

- Step and Attempt status enums remain separate.
- `WAITING` remains limited to dependency or external-condition waiting.
- Approval waiting remains a blocking reason plus approval reference.
- Provider and MCP invocation references remain mutually exclusive per Step.
- Cancellation execution semantics remain deferred.
- Retry denied/exhausted conditions remain separate from terminal reference
  requirements.
- Existing Runtime Request, Runtime Preflight, and Runtime Execution Start
  contracts are unchanged.
- Architecture Decision Lock remains compatible.
- Runtime implementation authority remains `NONE`.

## 8. Possible Amendment Decisions

```text
APPROVE CONTRACT
CHANGES REQUIRED
REJECT CONTRACT
```

Approval of this contract does not approve Runtime implementation. A separate
implementation authorization would be required later.

## 9. Historical Review Notes

The prior Contract QA remediation, re-review, and PM/CTO Contract Review passed
before this limited amendment. The current amendment remains pending independent
re-review. Implementation approval remains `NONE`.

## 10. Historical PM/CTO Contract Decision

### PM Review

`APPROVE`

- The Step and Attempt responsibilities are explicit and remain within the
  contract-only Sprint boundary.
- Approval First is preserved: approval waiting is a blocking reason with an
  approval reference, and no approval payload or execution authority is
  inferred.
- The contract is a suitable reference point for future Result, Evidence, and
  Invocation contracts without predefining their implementation semantics.
- Deferred execution, Provider, MCP, Queue, Scheduler, DB, API, UI, and
  Marketplace work remains outside this Sprint.

### CTO Review

`APPROVE`

- Execution, Step, and Attempt identities remain distinct and retry semantics
  preserve prior Attempt records.
- Separate Step and Attempt state models are explicit and have deterministic,
  verifiable transitions.
- `WAITING` is distinct from approval waiting; Provider and MCP references are
  mutually exclusive; and all external boundaries remain reference-only.
- The terminal reference matrix is complete and consistent across the
  authoritative contract and derived documents.
- The contract consumes Request, Preflight, and Execution Start references
  without changing their identity, readiness, or lifecycle semantics.

### Decision

```text
CONTRACT QA: PASS
RE-REVIEW: PASS
PM DECISION: APPROVE
CTO DECISION: APPROVE
CONTRACT DECISION: APPROVED
P0: 0
P1: 0
P2: 0
DECISION RECOMMENDATION: KEEP CURRENT
CHECKPOINT STATUS: READY
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

Approval locks the reviewed contract boundary only. It does not authorize
Runtime execution, Provider or MCP Invocation, persistence, API/UI work, or
any other implementation.
