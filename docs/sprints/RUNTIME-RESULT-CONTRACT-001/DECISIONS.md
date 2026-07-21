# RuntimeExecutionResult Open Questions Decisions

## 1. Status

```text
TASK: RUNTIME-RESULT-CONTRACT-001
OPEN QUESTIONS REVIEW: COMPLETE
SCOPE STATUS: FROZEN
CONTRACT STATUS: NOT STARTED
CONTRACT DECISION: PENDING
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

This document locks only the pre-draft decisions required by the approved Scope
Freeze. It is not the RuntimeExecutionResult contract, does not modify the
Runtime Step contract, and does not authorize code, tests, Runtime execution,
Provider/MCP Invocation, persistence, or external actions.

## 2. Decision Sources

- `docs/sprints/RUNTIME-RESULT-CONTRACT-001/TASK.md`
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/CONTRACT.md`
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/STATE_MACHINE.md`
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/VALIDATION.md`
- `docs/sprints/LIVE-EVIDENCE-AGENT-001/PACKAGE-RUNTIME-EVIDENCE.md`
- `docs/sprints/LIVE-EVIDENCE-AGENT-001/RUNTIME-MCP-BOUNDARY.md`
- `docs/architecture/LONGTERM_AI_RUNTIME.md`
- `src/features/agents/runtime-execution-request.ts`
- `src/features/agents/runtime-execution-start.ts`

## 3. Decision Summary

| ID | Topic | Decision | Result |
|---|---|---|---|
| OQ-001 | Result identity and correlation | LOCK | Direct immutable correlation to Request, Preflight, Execution Start, and Execution is required. |
| OQ-002 | `completedAt` and Result ID | LOCK / DEFER | `completedAt` is a caller-supplied artifact field and deterministic-core input; the exact hash algorithm remains deferred. |
| OQ-003 | Result status semantics | LOCK | The seven frozen Result statuses are mutually exclusive normalized outcomes. |
| OQ-004 | Required reference matrix | LOCK | Status-specific safe references are required without changing the Step terminal matrix. |
| OQ-005 | Step/Attempt aggregation | LOCK / DEFER | Result uses summaries and references only; detailed aggregation, retry, and parallel rules are deferred. |
| OQ-006 | Deterministic serialization | LOCK / DEFER | Canonical rules are locked; the concrete hash implementation and safe metadata schema are deferred. |
| OQ-007 | Evidence boundary | LOCK | Result expresses outcome; Evidence attests by immutable reference; Bundle and Report remain separate. |
| OQ-008 | Validation boundary | LOCK | Future validation is pure and input-bound; it performs no external lookup or live verification. |

## 4. Result Identity and Correlation

### OQ-001 — LOCK

The first `RuntimeExecutionResult` must directly correlate to one immutable
execution chain through these required identifiers or reference bindings:

- `formatVersion`
- `runtimeExecutionResultId`
- `runtimeExecutionId`
- `runtimeExecutionRequestReference`
- `runtimePreflightResultReference`
- `runtimeExecutionStartReference`
- `status`
- `completedAt`
- `integrityChecksum`

The Request, Preflight, and Execution Start references must carry the existing
identifier and integrity binding from their source contracts. The Result must
not recreate, replace, or change those upstream identities.

### OQ-002 — LOCK / DEFER

- `completedAt` is a required, caller-supplied canonical ISO instant on the
  Result artifact.
- `completedAt` is distinct from `runtimeExecutionResultId`, while also being
  a required deterministic-core input used to derive that identifier.
- `completedAt` must not precede the referenced execution start's `startedAt`.
- The Result builder must not generate `completedAt` implicitly or use a live
  clock in the deterministic core.
- The exact digest algorithm, hash encoding, and final field-by-field hash
  layout are **DEFERRED** to the Contract Draft, consistent with the frozen
  scope.

## 5. Result Status Semantics

### OQ-003 — LOCK

`RuntimeExecutionResult` has one mutually exclusive normalized status:

| Status | Locked meaning |
|---|---|
| `SUCCEEDED` | The declared execution summary has no terminal failure, cancellation, timeout, block, invalidity, or limitation; this does not prove Provider, MCP, deployment, or external-effect truth. |
| `SUCCEEDED_WITH_LIMITATIONS` | The declared execution summary has no terminal failure, cancellation, timeout, block, or invalidity, but has one or more explicit limitation codes or limitation references. |
| `FAILED` | The declared execution summary contains an unrecovered terminal failure and a safe failure reference. |
| `CANCELLED` | An explicit cancellation reference records the normalized terminal outcome. It does not imply rollback or successful external cancellation. |
| `TIMED_OUT` | An explicit timeout reference records the normalized terminal outcome. |
| `BLOCKED` | An immutable blocking reference records that the execution could not proceed or continue. It may be created before every Step is terminal; resume and continuation semantics remain deferred. |
| `INVALID` | A safe validation or aggregation reference records an unrecoverable contract-consistency outcome. It is not a claim about Provider/MCP execution or external effects. |

`CANCELLED` and `TIMED_OUT` may not be declared together. A proposal carrying
both terminal causes is rejected as an invalid Result input; v1 does not infer a
precedence rule from timestamps or external execution semantics.

`INVALID` has a separate boundary from a malformed proposed Result: a pure
validator rejects malformed input without minting or persisting an `INVALID`
artifact. An `INVALID` Result is allowed only when it carries a valid,
reference-only upstream validation or aggregation outcome.

## 6. Required Reference Matrix

### OQ-004 — LOCK

This matrix governs the Execution Result only. It neither changes nor
redefines the approved Runtime Step/Attempt terminal-reference matrix.

| Result status | Required references | Optional references | Forbidden status claims |
|---|---|---|---|
| `SUCCEEDED` | `stepSummaryReference`, at least one `evidenceReference` | `outputReference`, `attemptSummaryReference` | error, blocking, cancellation, timeout, or validation failure |
| `SUCCEEDED_WITH_LIMITATIONS` | `stepSummaryReference`, at least one `evidenceReference`, limitation code or reference | `outputReference`, `attemptSummaryReference` | error, blocking, cancellation, timeout, or validation failure |
| `FAILED` | `stepSummaryReference`, `errorReference`, at least one `evidenceReference` | `attemptSummaryReference`, `outputReference` | cancellation, timeout, or blocking as the normalized terminal cause |
| `CANCELLED` | `cancellationReference` | `stepSummaryReference`, `attemptSummaryReference`, `evidenceReference`, `outputReference` | timeout as the normalized terminal cause |
| `TIMED_OUT` | `timeoutReference` | `stepSummaryReference`, `attemptSummaryReference`, `evidenceReference`, `outputReference` | cancellation as the normalized terminal cause |
| `BLOCKED` | `blockingReference` | `stepSummaryReference`, `attemptSummaryReference`, `validationReference` | execution success or externally verified failure |
| `INVALID` | `validationReference` | `stepSummaryReference`, `attemptSummaryReference`, safe `errorReference` | execution, Provider, MCP, deployment, or external-effect outcome |

`outputReference` is intentionally optional for every status: a normalized
execution outcome can be validly represented by safe evidence or a terminal
reference without copying an output payload. `attemptSummaryReference` is
optional because dedicated Attempt Result artifacts remain deferred.

All references are opaque, secret-free, immutable bindings. Raw Provider/MCP
responses, credentials, headers, logs, stack traces, and private payloads are
rejected.

## 7. Result Aggregation Boundary

### OQ-005 — LOCK / DEFER

- The first Result is execution-level only and uses `stepSummaryReference` and
  optional `attemptSummaryReference`; it must not embed full Step or Attempt
  records.
- A summary may identify immutable Step/Attempt references, but their detailed
  schema, cardinality, and duplicate-normalization algorithm are **DEFERRED**
  to the Contract Draft.
- Partial outcome rules, dependency-failure rollup, `SKIPPED` aggregation,
  parallel ordering, and retry aggregation remain **DEFERRED**.
- The Result status must be supplied or derived only from the locked summary
  inputs. It must not infer Provider/MCP success from an invocation reference.

## 8. Deterministic Serialization Boundary

### OQ-006 — LOCK / DEFER

The Contract Draft must enforce these deterministic-core rules:

- `formatVersion` is required.
- Required fields are always present; optional fields are omitted rather than
  represented as `null` in the deterministic core.
- Timestamps use explicit canonical ISO UTC instants; no implicit current time
  or "latest" value is permitted.
- Status and code enums use uppercase snake case.
- Any ordered reference collection must reject duplicates and sort by declared
  semantic order. Step-derived collections use `sequence`, then
  `runtimeStepId`, then immutable reference/checksum as stable tie-breakers.
- Top-level and deterministic-core unknown fields are rejected. A free-form
  metadata object is not part of v1; safe metadata field selection is
  **DEFERRED**.
- Raw Provider/MCP payloads and all secret-bearing values are rejected.

The exact canonical serializer, digest algorithm, hash encoding, and safe
metadata schema are **DEFERRED**. They must not change the locked correlation,
status, or reference requirements.

## 9. Evidence Boundary

### OQ-007 — LOCK

Result and Evidence have separate responsibilities:

- Result records a normalized execution outcome and references attestation.
- Evidence is immutable and attests to Result-relevant facts by reference.
- Result must not store Evidence payloads or own Evidence Bundle/Report
  assembly.
- `SUCCEEDED`, `SUCCEEDED_WITH_LIMITATIONS`, and `FAILED` require Evidence
  reference as defined in the matrix.
- `CANCELLED` and `TIMED_OUT` may rely on their dedicated terminal references;
  Evidence remains optional at this Result layer.
- `BLOCKED` and `INVALID` may omit Evidence when their required blocking or
  validation reference is present.

Absence of Result Evidence never asserts that Runtime, Provider, MCP,
deployment, or an external action succeeded.

## 10. Validation Boundary

### OQ-008 — LOCK

Future `RuntimeExecutionResult` validation is pure and input-bound. It may:

- validate required fields, enum values, canonical timestamp form, and checksum
  shape;
- enforce this status/reference matrix;
- enforce immutable correlation consistency among supplied Request, Preflight,
  Execution Start, Step-summary, and Attempt-summary bindings;
- reject duplicate or non-canonical ordered references;
- reject raw secrets and disallowed raw payloads.

It must not:

- query DB, storage, network, Provider, MCP, Vault, or Credential systems;
- verify that an external reference exists outside supplied input;
- perform Runtime execution, retry, resume, cancellation, or approval
  revalidation;
- interpret Provider/MCP detailed result schemas.

## 11. Rejected Inputs and Boundaries

The following are **REJECTED** for the first contract:

- redefinition of Runtime Step or Attempt identities, status enums, or terminal
  reference requirements;
- embedding full Step/Attempt, Evidence, Provider, MCP, Credential, or Approval
  payloads;
- free-form unknown fields or caller-generated hidden metadata in the
  deterministic core;
- `Date.now`, random values, or implicit ordering in deterministic identity;
- Provider/MCP invocation schema ownership or live verification;
- persistence, Event Log, Evidence Bundle, Evidence Report, Cost, Usage, UI,
  API, DB, Queue, Scheduler, Worker, deployment, or Marketplace work.

## 12. Review Outcome

```text
OPEN QUESTIONS REVIEW: COMPLETE
LOCK: 8
DEFER: exact hash algorithm, detailed aggregation, parallel/retry aggregation,
       Provider/MCP normalized schemas, Bundle/Report assembly, safe metadata
       schema
REJECT: scope expansion, raw payloads/secrets, generated clocks, unknown fields,
        Step/Attempt contract redefinition
P0: 0
P1: 0
P2: 0
SCOPE CHANGE: NONE
CONTRACT STATUS: NOT STARTED
CONTRACT DECISION: PENDING
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

## 13. Recommended Next Task

Create the documentation-only RuntimeExecutionResult Contract Draft using these
locked decisions. The draft may introduce `CONTRACT.md`, `STATE_MACHINE.md`,
`VALIDATION.md`, `QA_CHECKLIST.md`, and `REVIEW.md`, but must not start code or
tests without a separate approval.
