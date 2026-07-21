# Runtime Execution Result State Machine

## 1. Status

```text
TASK: RUNTIME-RESULT-CONTRACT-001
CONTRACT DRAFT: COMPLETE
ARTIFACT LIFECYCLE: DRAFT
CONTRACT QA: PASS WITH NOTE (P0/P1: 0/0)
PM REVIEW: APPROVE WITH P2 NOTE
CTO REVIEW: APPROVE WITH P2 NOTE
CONTRACT DECISION: APPROVED
PROJECT GATE REVIEW: PASS WITH NOTE
SPRINT CLOSEOUT CHECKPOINT: 21889b1
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

This document depends on `CONTRACT.md`. It describes the Result artifact
lifecycle only. It does not define Runtime execution states, Runtime Step
states, Runtime Step Attempt states, Provider states, or MCP states.

Any QA wording retained elsewhere in the Sprint records is historical only and
does not supersede this approved current-status block.

## 2. Result Status Values

`RuntimeExecutionResultStatus` values are owned by `CONTRACT.md`:

```text
SUCCEEDED
SUCCEEDED_WITH_LIMITATIONS
FAILED
CANCELLED
TIMED_OUT
BLOCKED
INVALID
```

These values are normalized Result outcomes. They are not artifact lifecycle
states.

## 3. Artifact Lifecycle

The Result artifact lifecycle is:

```text
DRAFT_INPUT
VALIDATED
REJECTED
FINALIZED
```

Meaning:

| Lifecycle state | Meaning |
|---|---|
| `DRAFT_INPUT` | A candidate Result payload has been supplied for validation. |
| `VALIDATED` | The candidate satisfies required shape, correlation, status/reference, deterministic serialization, and secret-safety rules. |
| `REJECTED` | The candidate violates contract validation and must not mint a Result artifact. |
| `FINALIZED` | The validated candidate is accepted as an immutable Result artifact with integrity binding. |

The lifecycle is a documentation model for future pure validation and builder
behavior. It does not authorize implementation.

## 4. Artifact Lifecycle Transitions

Allowed transitions:

| From | To | Condition |
|---|---|---|
| `DRAFT_INPUT` | `VALIDATED` | Candidate satisfies contract validation. |
| `DRAFT_INPUT` | `REJECTED` | Candidate violates required fields, status/reference matrix, deterministic serialization, correlation, or secret-safety rules. |
| `VALIDATED` | `FINALIZED` | Integrity binding is present and the Result can be treated as immutable. |

Forbidden transitions:

- `REJECTED` to `FINALIZED`.
- `FINALIZED` to `DRAFT_INPUT`.
- `FINALIZED` to `VALIDATED` with mutation.
- `FINALIZED` to another `RuntimeExecutionResultStatus`.

Corrections require a new Result artifact or a future correction reference; they
must not mutate a finalized Result.

## 5. Result Status Semantics

| Result status | Lifecycle requirement |
|---|---|
| `SUCCEEDED` | May be finalized only when success reference requirements are met. |
| `SUCCEEDED_WITH_LIMITATIONS` | May be finalized only when success-with-limitations reference requirements are met. |
| `FAILED` | May be finalized only when failure reference requirements are met. |
| `CANCELLED` | May be finalized only when cancellation reference requirements are met. |
| `TIMED_OUT` | May be finalized only when timeout reference requirements are met. |
| `BLOCKED` | May be finalized only when blocking reference requirements are met. |
| `INVALID` | May be finalized only when validation reference requirements are met. |

A malformed candidate does not become a finalized `INVALID` Result. It remains
`REJECTED`.

## 6. Mutual Exclusivity

A finalized Result has exactly one `RuntimeExecutionResultStatus`.

Validation must reject:

- both `CANCELLED` and `TIMED_OUT` claims;
- success status with error, blocking, cancellation, timeout, or validation
  failure claims;
- `FAILED` status with cancellation, timeout, or blocking as the normalized
  terminal cause;
- `BLOCKED` or `INVALID` status with execution success or externally verified
  failure claims.

## 7. Relationship to Runtime Step State

Runtime Step status values remain defined by
`docs/sprints/RUNTIME-STEP-CONTRACT-001/CONTRACT.md`.

The Result may summarize or reference terminal Step/Attempt outcomes, but it
must not:

- redefine Step or Attempt statuses;
- transition Step or Attempt records;
- change the Step terminal-reference matrix;
- infer Provider or MCP success from Step references.

## 8. Evidence and Reference Lifecycle

References bound to a finalized Result are immutable.

Rules:

- Evidence references attest to facts; the Result does not store Evidence.
- cancellation and timeout references can satisfy terminal Result requirements
  for `CANCELLED` and `TIMED_OUT`.
- blocking and validation references can satisfy `BLOCKED` and `INVALID`.
- Provider/MCP detailed outcome references are delegated to future Invocation
  contracts.

## 9. QA Notes

Contract QA must confirm:

- artifact lifecycle states are not confused with Result statuses;
- the seven Result statuses match `CONTRACT.md` and `DECISIONS.md`;
- malformed input is `REJECTED`, not finalized as `INVALID`;
- finalized artifacts are immutable;
- Runtime Step and Attempt state machines are unchanged;
- no Runtime execution, Provider Invocation, MCP Invocation, persistence, or
  code implementation is implied.
