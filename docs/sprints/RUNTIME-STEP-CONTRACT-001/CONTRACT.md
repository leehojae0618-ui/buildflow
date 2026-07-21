# Runtime Step Contract

## 1. Status

```text
TASK: RUNTIME-STEP-CONTRACT-001
STATUS: AMENDED / PENDING INDEPENDENT RE-REVIEW
SCOPE STATUS: SCOPE FROZEN
LIMITED REOPENING: AUTHORIZED — ATTEMPT FIELD MATRIX ONLY
PREVIOUS CONTRACT CHECKPOINT: 730bde8
CONTRACT REVIEW: PENDING INDEPENDENT RE-REVIEW
PM DECISION: HISTORICAL APPROVE; AMENDMENT PENDING RE-REVIEW
CTO DECISION: HISTORICAL APPROVE; AMENDMENT PENDING RE-REVIEW
CONTRACT DECISION: AMENDED / PENDING INDEPENDENT RE-REVIEW
CHECKPOINT STATUS: RECORDED BY THIS GIT AMENDMENT COMMIT
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

This document is the canonical Runtime Step contract draft. `STATE_MACHINE.md`
and `VALIDATION.md` must reuse the status, identity, and reference names defined
here. They must not define additional fields or statuses independently.

## 2. Objective

Define a deterministic, explicit, reference-first contract for Runtime Step and
Runtime Step Attempt records. The contract sits after Runtime Execution Start
and before future Provider Invocation, MCP Invocation, Runtime Result, and
Runtime Evidence contracts.

## 3. Responsibility

Runtime Step is responsible for describing one logical unit of Runtime work.
Runtime Step Attempt is responsible for describing one attempt to execute that
logical Step.

Runtime Step is not responsible for executing work, calling providers, invoking
MCP tools, persisting records, scheduling workers, or proving external side
effects.

## 4. Boundary

Depends on:

- Runtime Execution Request
- Runtime Preflight
- Runtime Execution Start
- Runtime/MCP Boundary Decision Lock
- Long-term AI Runtime Decision Lock

References only:

- Provider Invocation
- MCP Invocation
- Step Action Approval
- Runtime Step Evidence
- Timeout policy
- Retry policy
- Cancellation record

Out of scope:

- Runtime execution engine
- Provider Invocation implementation
- MCP Invocation implementation
- Queue, scheduler, worker, lease, or lock implementation
- DB, API, UI, deployment, or Marketplace work
- Vault access or live Credential validation

## 5. Identity Contract

Runtime identity names are fixed for this sprint:

| Identity | Meaning |
|---|---|
| `runtimeExecutionId` | One concrete execution instance. Full execution retry creates a new id. |
| `runtimeExecutionRequestId` | The request that authorized this execution path. |
| `runtimeExecutionStartId` | The start readiness record produced before Step work. |
| `runtimeStepId` | One logical Runtime Step. Step retry keeps this id. |
| `runtimeStepAttemptId` | One execution attempt for a Runtime Step. Retry creates a new id. |
| `parentRuntimeStepId` | Optional parent Step reference for hierarchy. |
| `dependencyRuntimeStepIds` | Explicit Step dependencies that must be satisfied first. |

Identity rules:

- `runtimeStepId` must be stable across attempts for the same logical Step.
- `runtimeStepAttemptId` must be unique per attempt.
- Attempt records must not overwrite prior attempts.
- A Step belongs to exactly one `runtimeExecutionId`.
- A Step must reference one `runtimeExecutionStartId`.
- Parent and dependency references must not create cycles.

## 6. Status Contract

Step and Attempt statuses are separate enums.

`RuntimeStepStatus`:

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

`RuntimeStepAttemptStatus`:

```text
READY
RUNNING
SUCCESS
FAILED
CANCELLED
TIMEOUT
```

Status rules:

- `WAITING` means the Step is waiting for an external condition or declared
  dependency.
- `WAITING` must not represent approval waiting by itself.
- Approval waiting is represented by a blocking reason and approval reference.
- Attempt `TIMEOUT` does not automatically force Step `TIMEOUT`.
- If retry policy permits retry after Attempt `TIMEOUT`, a new Attempt may be
  created under the same `runtimeStepId`.
- `CANCELLED` is allowed as a Step status, but real cancellation execution
  semantics are deferred.

## 7. Invocation Boundary

Each Runtime Step may reference one invocation boundary:

```text
NONE
PROVIDER
MCP
```

Rules:

- A Step must not reference both Provider and MCP invocation candidates.
- `PROVIDER` allows `providerInvocationReference` only.
- `MCP` allows `mcpInvocationReference` only.
- `NONE` allows neither Provider nor MCP invocation reference.
- Invocation references do not imply invocation success or external side
  effects.

## 8. Runtime Step Contract Fields

Always-required fields:

- `formatVersion`
- `runtimeExecutionId`
- `runtimeExecutionRequestId`
- `runtimeExecutionStartId`
- `runtimeStepId`
- `sequence`
- `nameReference`
- `purposeCode`
- `stepKind`
- `invocationBoundary`
- `status`
- `inputReferences`
- `outputReferences`
- `dependencyRuntimeStepIds`
- `blockingReasons`
- `evidenceReferences`
- `approvalReferences`
- `policyReferences`
- `limitationCodes`
- `integrityChecksum`

Optional fields:

- `parentRuntimeStepId`
- `providerInvocationReference`
- `mcpInvocationReference`
- `timeoutPolicyReference`
- `retryPolicyReference`
- `cancellationReference`
- `metadata`

## 9. Runtime Step Attempt Contract Fields

Required fields:

- `formatVersion`
- `runtimeExecutionId`
- `runtimeStepId`
- `runtimeStepAttemptId`
- `attemptNumber`
- `status`
- `inputReferences`
- `outputReferences`
- `blockingReasons`
- `evidenceReferences`
- `limitationCodes`
- `integrityChecksum`

Status-conditioned fields:

- `startedAtReference`
- `completedAtReference`
- `failure`
- `retryDecision`
- `previousRuntimeStepAttemptId`
- `providerInvocationAttemptReference`
- `mcpInvocationAttemptReference`
- `timeoutPolicyReference`
- `retryPolicyReference`
- `cancellationReference`
- `usageReference`
- `metadata`

### 9.1 Attempt Status-to-Field Matrix

The following matrix is normative for every approved Attempt status. It does
not add an Attempt status or authorize execution.

| Attempt status | `startedAtReference` | `completedAtReference` | `failure` | `retryDecision` | `cancellationReference` | `evidenceReferences` | `integrityChecksum` |
|---|---|---|---|---|---|---|---|
| `READY` | FORBIDDEN | FORBIDDEN | FORBIDDEN | FORBIDDEN | FORBIDDEN | OPTIONAL (may be empty) | REQUIRED |
| `RUNNING` | REQUIRED | FORBIDDEN | FORBIDDEN | FORBIDDEN | FORBIDDEN | OPTIONAL (may be empty) | REQUIRED |
| `SUCCESS` | REQUIRED | REQUIRED | FORBIDDEN | FORBIDDEN | FORBIDDEN | REQUIRED (non-empty) | REQUIRED |
| `FAILED` | REQUIRED | REQUIRED | REQUIRED | REQUIRED | FORBIDDEN | REQUIRED (non-empty) | REQUIRED |
| `CANCELLED` | CONDITIONALLY REQUIRED | REQUIRED | FORBIDDEN | FORBIDDEN | CONDITIONALLY REQUIRED | REQUIRED when `cancellationReference` is absent; otherwise OPTIONAL | REQUIRED |
| `TIMEOUT` | REQUIRED | REQUIRED | FORBIDDEN | REQUIRED | FORBIDDEN | OPTIONAL when `completedAtReference` is an `ATTEMPT_TIMEOUT` reference; otherwise REQUIRED (non-empty) | REQUIRED |

`CANCELLED` requires `startedAtReference` only when the Attempt previously
entered `RUNNING`; it is forbidden for the approved `READY → CANCELLED`
transition. `cancellationReference` is required for `CANCELLED` when the
Attempt has no Evidence reference.

`previousRuntimeStepAttemptId` is REQUIRED only for an Attempt created as a
Step retry and FORBIDDEN for an initial Attempt. A retry retains the same
`runtimeExecutionId` and `runtimeStepId` and creates a new
`runtimeStepAttemptId`.

### 9.2 `completedAtReference` Semantics

`completedAtReference` is a reference to the immutable completion record for
the Attempt, not a generated timestamp and not an embedded external payload.

- It is REQUIRED for all terminal Attempt statuses: `SUCCESS`, `FAILED`,
  `CANCELLED`, and `TIMEOUT`.
- It is FORBIDDEN for `READY` and `RUNNING`.
- It must include a non-empty `referenceId`, a non-empty `referenceType`, and
  a lowercase 64-character hexadecimal `integrityChecksum`.
- Its binding must identify the same `runtimeExecutionId`, `runtimeStepId`,
  and `runtimeStepAttemptId` as the Attempt; cross-execution, cross-Step, and
  cross-Attempt bindings are invalid.
- For `TIMEOUT`, `referenceType` must be `ATTEMPT_TIMEOUT`; this immutable
  completion reference is the timeout reference permitted by the terminal
  Evidence rule. No new top-level timeout-result field is introduced.

Its required reference-first shape is:

```text
referenceId
referenceType
integrityChecksum
runtimeExecutionId
runtimeStepId
runtimeStepAttemptId
```

### 9.3 `failure` Semantics

`failure` is REQUIRED only for `FAILED` and FORBIDDEN for `READY`, `RUNNING`,
`SUCCESS`, `CANCELLED`, and `TIMEOUT`.

Its required safe, reference-first shape is:

```text
code
target
safeReference
recoverable
userActionable
```

`safeReference` identifies a sanitized immutable reference and must not embed
raw Provider/MCP payloads, credentials, tokens, headers, stack traces, or
private input. Retryable and non-retryable failures use the same shape;
`retryDecision` records the policy result separately. Cancellation uses the
existing `cancellationReference` boundary and never a failure payload.

### 9.4 `retryDecision` Semantics

`retryDecision` records a policy decision only; it does not perform, schedule,
or create a retry.

- It is REQUIRED for `FAILED` and `TIMEOUT`.
- It is FORBIDDEN for `READY`, `RUNNING`, `SUCCESS`, and `CANCELLED`.
- Its allowed decision values are `RETRY_ALLOWED`, `RETRY_DENIED`, and
  `RETRY_EXHAUSTED`, reflecting the approved retry-policy language.
- It must reference the applicable explicit or default retry policy.
- `RETRY_ALLOWED` permits a later new Attempt only. The later Attempt must use
  the same `runtimeExecutionId` and `runtimeStepId`, a new
  `runtimeStepAttemptId`, and its `previousRuntimeStepAttemptId` binding.
- `RETRY_DENIED` and `RETRY_EXHAUSTED` do not authorize a new Attempt.

Its required shape is:

```text
decision
retryPolicyReference
```

### 9.5 `integrityChecksum` Boundary

`integrityChecksum` is REQUIRED for every Attempt status because every Attempt
record is immutable once emitted. It includes all always-required fields and
all present status-conditioned semantic fields, including reference bindings,
status, and retry decision where applicable. It excludes itself and volatile
`metadata`.

Secret-bearing values are forbidden before checksum generation. Algorithm,
canonicalization, byte encoding, and output encoding are not changed by this
amendment and remain explicit Implementation Approval decisions.

## 10. Input Contract

Inputs are references only. Runtime Step must not embed raw payloads, secrets,
provider responses, MCP responses, credentials, private user data, or logs.

Allowed input references:

- package artifact reference;
- execution request artifact reference;
- prior Step output reference;
- configuration reference;
- policy reference;
- approval reference;
- capability reference.

## 11. Output Contract

Outputs are references only.

Allowed output references:

- sanitized result reference;
- evidence reference;
- artifact reference;
- validation result reference;
- limitation reference;
- safe failure reference.

Step output does not imply Provider success, MCP success, deployment success,
or Package readiness.

## 12. Blocking Reason Contract

Blocking reasons explain why a Step cannot proceed.

Allowed blocking reason categories:

```text
DEPENDENCY_WAIT
APPROVAL_REQUIRED
CONNECTION_REQUIRED
CREDENTIAL_REQUIRED
POLICY_BLOCKED
TOOL_UNAVAILABLE
PROVIDER_UNAVAILABLE
MCP_UNAVAILABLE
TIMEOUT_POLICY_MISSING
RETRY_POLICY_BLOCKED
CANCELLATION_REQUESTED
VALIDATION_FAILED
```

Approval waiting must use `APPROVAL_REQUIRED` with an approval reference. It
must not be represented only by Step `WAITING`.

## 13. Error Contract

Errors must be safe, deterministic, and reference-first.

Required failure fields:

- `code`
- `target`
- `safeReference`
- `recoverable`
- `userActionable`

Forbidden in errors:

- raw API keys;
- access or refresh tokens;
- private keys;
- raw Provider or MCP responses;
- authorization headers;
- stack traces containing sensitive data;
- full user private input.

## 14. Evidence Reference Contract

Terminal Step Evidence requirements:

- `SUCCESS` requires at least one Evidence reference.
- `FAILED` requires at least one Evidence reference.
- `CANCELLED` requires at least one Evidence reference or cancellation
  reference.
- `TIMEOUT` requires at least one Evidence reference or timeout reference.
- `SKIPPED` may use a deterministic reason reference instead of execution
  Evidence.

Attempt terminal outcomes follow the same reference rule: `SUCCESS` and
`FAILED` require Evidence reference, `CANCELLED` requires Evidence or
cancellation reference, and `TIMEOUT` requires Evidence or timeout reference.
Evidence records are immutable; corrections append new Evidence.

## 15. Approval Reference Contract

Step Action Approval is referenced, not embedded.

Approval reference rules:

- Package Approval does not replace Step Action Approval.
- Runtime Execution Approval does not authorize future Tool definition changes.
- Approval waiting is represented as a blocking reason.
- Revoked or expired approval must block Step progression before execution.

## 16. Timeout, Retry, and Cancellation References

Timeout and retry policy references are optional. If omitted, the contract must
use explicit default policy references:

- `DEFAULT_TIMEOUT_POLICY_REFERENCE`
- `DEFAULT_RETRY_POLICY_REFERENCE`

Cancellation rules:

- `CANCELLED` may be a Step or Attempt terminal status.
- Actual external cancellation behavior is deferred.
- Cancellation must append Evidence or a cancellation reference.
- Cancellation must not delete or mutate prior Evidence.

## 17. Deterministic Core

The deterministic core includes:

- format version;
- identities;
- sequence;
- invocation boundary;
- status;
- parent and dependency references;
- input and output references;
- blocking reasons;
- evidence and approval references;
- policy references;
- limitation codes.

Metadata is outside the deterministic core unless a future contract explicitly
includes it.

## 18. Acceptance Criteria

The Runtime Step contract draft is acceptable when:

- all status names match `STATE_MACHINE.md`;
- all validation rules reference fields defined in this document;
- Step and Attempt statuses remain separate;
- Provider and MCP invocation references remain mutually exclusive;
- approval waiting remains a blocking reason;
- terminal Evidence requirements are explicit;
- existing Runtime Request, Preflight, and Execution Start contracts remain
  unchanged;
- no implementation authority is introduced.
