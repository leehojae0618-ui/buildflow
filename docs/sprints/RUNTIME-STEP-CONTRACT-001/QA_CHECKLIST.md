# Runtime Step Contract QA Checklist

## 1. Status

```text
TASK: RUNTIME-STEP-CONTRACT-001
STATUS: AMENDED / INITIAL-RETRY DISCRIMINATOR / REVALIDATION COMPLETE
QA STATUS: AMENDMENT QA PASS / REVALIDATION COMPLETE
PREVIOUS CONTRACT CHECKPOINT: 730bde8
CURRENT AMENDMENT CHECKPOINT: 59aa291
PREVIOUS FIELD-MATRIX AMENDMENT CHECKPOINT: ca54d12
CONTRACT REVIEW: INDEPENDENT RE-REVIEW PASS
CONTRACT DECISION: AMENDED / REVALIDATION COMPLETE
IMPLEMENTATION APPROVAL: REVALIDATED
RUNTIME IMPLEMENTATION AUTHORITY: SUSPENDED PENDING EXPLICIT REGRANT
PRODUCTION CHANGES AUTHORIZED: NO
```

## 2. Scope QA

The checked items in sections 2 through 6 are historical QA results from before
the limited Attempt field-matrix amendment. Section 6.1 is the current
amendment-specific QA gate and must pass before independent re-review.

- [x] Contract remains documentation-only.
- [x] No code files changed.
- [x] No test files changed.
- [x] Historical Contract QA recorded Runtime Implementation Authority as
  `NONE`; the current operative Authority remains suspended pending explicit
  regrant.
- [x] Runtime execution is not implemented.
- [x] Provider Invocation is not implemented.
- [x] MCP Invocation is not implemented.
- [x] Queue, Scheduler, Worker, Lease, and Lock are not implemented.
- [x] DB, API, UI, deployment, and Marketplace are not modified.

## 3. Contract Consistency QA

- [x] `CONTRACT.md` is the canonical source for field names.
- [x] `STATE_MACHINE.md` uses only statuses defined in `CONTRACT.md`.
- [x] `VALIDATION.md` references only fields defined in `CONTRACT.md`.
- [x] Step and Attempt statuses are separate enums.
- [x] `WAITING` is limited to external condition or dependency waiting.
- [x] Approval waiting uses blocking reason and approval reference.
- [x] Attempt `TIMEOUT` and Step `TIMEOUT` are distinct.
- [x] `CANCELLED` is allowed as Step status.
- [x] External cancellation execution semantics remain deferred.

## 4. Identity QA

- [x] `runtimeExecutionId` is distinct from `runtimeExecutionRequestId`.
- [x] `runtimeExecutionStartId` is referenced.
- [x] `runtimeStepId` represents the logical Step.
- [x] `runtimeStepAttemptId` represents one Attempt.
- [x] Step retry keeps `runtimeStepId`.
- [x] Step retry creates a new `runtimeStepAttemptId`.
- [x] Full execution retry creates a new `runtimeExecutionId`.
- [x] Dependency and parent references cannot create cycles.

## 5. Invocation Boundary QA

- [x] Step allows one invocation boundary only.
- [x] `PROVIDER` requires Provider reference and forbids MCP reference.
- [x] `MCP` requires MCP reference and forbids Provider reference.
- [x] `NONE` forbids Provider and MCP references.
- [x] Provider and MCP Invocation implementations remain deferred.

## 6. Evidence QA

- [x] `SUCCESS` requires Evidence reference.
- [x] `FAILED` requires Evidence reference.
- [x] `CANCELLED` requires Evidence or cancellation reference.
- [x] `TIMEOUT` requires Evidence or timeout reference.
- [x] `SKIPPED` may use deterministic reason reference.
- [x] Evidence remains immutable and reference-first.

## 6.1 Attempt Field Matrix QA

- [x] Every approved Attempt status has one explicit field-matrix row.
- [x] `READY` and `RUNNING` forbid completion, failure, and retry-decision
  fields.
- [x] Terminal Attempts require `completedAtReference` with same-attempt
  identity bindings.
- [x] `FAILED` requires a safe failure and a retry decision.
- [x] `CANCELLED` uses Evidence or `cancellationReference`, never failure.
- [x] `TIMEOUT` uses an `ATTEMPT_TIMEOUT` completion reference when Evidence is
  absent and requires a retry decision.
- [x] `attemptNumber` is a positive, 1-based initial/retry discriminator.
- [x] Initial Attempts forbid a predecessor; retry Attempts require a distinct
  predecessor and an immediate ordinal increment when both records are
  supplied.
- [x] `integrityChecksum` is required for all Attempt records, excludes itself
  and volatile metadata, and includes present semantic fields.
- [x] Serializer/digest algorithm, byte encoding, and validation-return policy
  remain deferred to Implementation Approval.

## 7. Approval QA

- [x] Approval waiting is represented by `APPROVAL_REQUIRED`.
- [x] Approval waiting is not represented only by Step `WAITING`.
- [x] Approval reference is reference-only.
- [x] Raw approval payload is not embedded.
- [x] Package Approval and Runtime Execution Approval are not treated as Step
  Action Approval.

## 8. Secret Safety QA

- [x] No raw API keys.
- [x] No access or refresh tokens.
- [x] No private keys.
- [x] No raw Authorization headers.
- [x] No raw Provider responses.
- [x] No raw MCP responses.
- [x] No sensitive stack traces.
- [x] No full private user input.

## 9. Existing Contract Impact QA

- [x] Runtime Execution Request remains unchanged.
- [x] Runtime Preflight remains unchanged.
- [x] Runtime Execution Start remains unchanged.
- [x] Architecture Decision Lock remains respected.
- [x] Runtime/MCP Boundary remains respected.

## 10. Validation Commands

Minimum documentation validation:

```bash
git diff --check
git status --short --branch
```

Secret pattern scan must be run against changed documents.

Application test, lint, typecheck, and build are not required for documentation
only changes unless code or test files change.
