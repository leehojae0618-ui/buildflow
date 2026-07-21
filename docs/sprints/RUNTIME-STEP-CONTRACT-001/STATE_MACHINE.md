# Runtime Step State Machine

## 1. Status

```text
TASK: RUNTIME-STEP-CONTRACT-001
STATUS: AMENDED / INITIAL-RETRY DISCRIMINATOR / REVALIDATION COMPLETE
LIMITED REOPENING: ATTEMPT NUMBER AND PREDECESSOR RULES ONLY
PREVIOUS CONTRACT CHECKPOINT: 730bde8
CURRENT AMENDMENT CHECKPOINT: 59aa291
PREVIOUS FIELD-MATRIX AMENDMENT CHECKPOINT: ca54d12
CONTRACT REVIEW: INDEPENDENT RE-REVIEW PASS
CONTRACT DECISION: AMENDED / REVALIDATION COMPLETE
IMPLEMENTATION APPROVAL: SUSPENDED PENDING REVALIDATION
```

This document depends on `CONTRACT.md`. It must not define status names or
fields that are absent from the canonical contract.

## 2. Runtime Step Status

`RuntimeStepStatus` values:

```text
READY
RUNNING
WAITING
SUCCESS
FAILED
CANCELLED
SKIPPED
TIMEOUT
```

Meaning:

| Status | Meaning |
|---|---|
| `READY` | Step is contract-valid and ready for an Attempt when dependencies and blocking reasons allow it. |
| `RUNNING` | At least one current Attempt is running. |
| `WAITING` | Step is waiting for an external condition or declared dependency. |
| `SUCCESS` | Step completed successfully and has required Evidence reference. |
| `FAILED` | Step reached terminal failure and has required Evidence reference. |
| `CANCELLED` | Step was cancelled and has cancellation Evidence/reference. |
| `SKIPPED` | Step was intentionally skipped with deterministic reason reference. |
| `TIMEOUT` | Step reached terminal timeout after retry policy no longer allows more attempts. |

`WAITING` must not mean approval waiting by itself. Approval waiting is a
blocking reason with approval reference.

## 3. Runtime Step Attempt Status

`RuntimeStepAttemptStatus` values:

```text
READY
RUNNING
SUCCESS
FAILED
CANCELLED
TIMEOUT
```

Meaning:

| Status | Meaning |
|---|---|
| `READY` | Attempt is prepared but has not started. |
| `RUNNING` | Attempt has started. |
| `SUCCESS` | Attempt completed successfully. |
| `FAILED` | Attempt failed. |
| `CANCELLED` | Attempt was cancelled. |
| `TIMEOUT` | Attempt timed out. |

Attempt `TIMEOUT` does not automatically force Step `TIMEOUT`. If retry policy
allows another attempt, the Step may remain `RUNNING` or return to `READY` for a
new Attempt under the same `runtimeStepId`.

## 4. Step Transition Rules

Allowed Step transitions:

| From | To | Condition |
|---|---|---|
| `READY` | `RUNNING` | First Attempt starts. |
| `READY` | `WAITING` | Declared dependency or external condition is not satisfied. |
| `READY` | `SKIPPED` | Deterministic skip reason is recorded. |
| `READY` | `CANCELLED` | Cancellation reference is recorded before Attempt starts. |
| `WAITING` | `READY` | Dependency or external condition is satisfied and blocking reasons are cleared. |
| `WAITING` | `CANCELLED` | Cancellation reference is recorded. |
| `RUNNING` | `SUCCESS` | Attempt succeeds and Step Evidence requirement is satisfied. |
| `RUNNING` | `FAILED` | Attempt fails and retry policy does not allow another Attempt. |
| `RUNNING` | `TIMEOUT` | Attempt times out and retry policy does not allow another Attempt. |
| `RUNNING` | `CANCELLED` | Cancellation reference is recorded. |
| `RUNNING` | `READY` | Attempt ends and retry policy permits another Attempt. |

Terminal statuses:

```text
SUCCESS
FAILED
CANCELLED
SKIPPED
TIMEOUT
```

Terminal statuses must not transition back to non-terminal statuses. Full
execution retry creates a new `runtimeExecutionId`; Step retry creates a new
`runtimeStepAttemptId` under the same `runtimeStepId`.

## 5. Attempt Transition Rules

Allowed Attempt transitions:

| From | To | Condition |
|---|---|---|
| `READY` | `RUNNING` | Attempt starts. |
| `READY` | `CANCELLED` | Attempt is cancelled before start. |
| `RUNNING` | `SUCCESS` | Attempt succeeds. |
| `RUNNING` | `FAILED` | Attempt fails. |
| `RUNNING` | `TIMEOUT` | Attempt exceeds timeout policy. |
| `RUNNING` | `CANCELLED` | Attempt is cancelled. |

Attempt terminal statuses:

```text
SUCCESS
FAILED
CANCELLED
TIMEOUT
```

Attempt terminal statuses must not be mutated. Retry creates a new Attempt.

## 5.1 Attempt Field Matrix

`CONTRACT.md` section 9.1 is the authoritative Attempt status-to-field matrix.
This state machine applies it as follows:

- `READY` forbids start/completion, failure, retry-decision, and cancellation
  fields.
- `RUNNING` requires `startedAtReference` and forbids terminal-only fields.
- `SUCCESS` requires immutable start/completion and non-empty Evidence
  references; failure, retry-decision, and cancellation fields are forbidden.
- `FAILED` requires immutable start/completion, safe failure, retry decision,
  and non-empty Evidence references.
- `CANCELLED` requires immutable completion and either Evidence or a
  cancellation reference. It requires a start reference only after
  `RUNNING`; `READY → CANCELLED` forbids one.
- `TIMEOUT` requires immutable start/completion and retry decision. Its
  completion reference is the timeout reference when typed `ATTEMPT_TIMEOUT`.

The field matrix records Attempt state only. It neither evaluates a retry
policy nor performs a retry or cancellation.

`attemptNumber` is 1-based: `1` is the initial Attempt and forbids a
predecessor; values greater than `1` are retry Attempts and require one. When
two records are supplied for relationship validation, the current Attempt must
name the supplied prior Attempt and increment `attemptNumber` by exactly one.
This validates an immediate predecessor relationship only.

## 6. Blocking Reasons

Blocking reasons do not replace status.

`APPROVAL_REQUIRED` is the required representation for approval waiting. A Step
with approval waiting may be `READY` or `WAITING` depending on dependency and
external-condition state, but approval waiting must be visible through
`blockingReasons` and `approvalReferences`.

## 7. Timeout Rule

Attempt timeout is local to one Attempt. Step timeout is terminal only when retry
policy no longer allows more attempts.

```text
Attempt TIMEOUT + retry allowed
→ new RuntimeStepAttemptId
→ attemptNumber increases by one with an immediate predecessor binding
→ Step may continue

Attempt TIMEOUT + retry denied or exhausted
→ Step TIMEOUT
```

## 8. Cancellation Rule

`CANCELLED` is allowed at Step and Attempt levels. Actual Provider/MCP
cancellation behavior is deferred. This contract records cancellation
references only.

Cancellation must append Evidence or cancellation reference. It must not delete
or rewrite prior Evidence.

## 9. Evidence Rule

Terminal Step outcomes require references:

- `SUCCESS`: Evidence reference required.
- `FAILED`: Evidence reference required.
- `CANCELLED`: Evidence or cancellation reference required.
- `TIMEOUT`: Evidence or timeout reference required.
- `SKIPPED`: deterministic reason reference allowed.

## 10. QA Notes

Review must confirm that:

- state names match `CONTRACT.md`;
- approval waiting is not modeled as a standalone status;
- Attempt timeout and Step timeout are distinct;
- terminal status mutation is forbidden;
- retry creates a new Attempt, not a new Step;
- full execution retry creates a new Execution.
