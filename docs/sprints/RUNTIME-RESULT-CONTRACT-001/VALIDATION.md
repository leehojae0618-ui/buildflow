# Runtime Execution Result Validation

## 1. Status

```text
TASK: RUNTIME-RESULT-CONTRACT-001
CONTRACT DRAFT: COMPLETE
VALIDATION DRAFT: COMPLETE
CONTRACT QA: PASS WITH NOTE (P0/P1: 0/0)
PM REVIEW: APPROVE WITH P2 NOTE
CTO REVIEW: APPROVE WITH P2 NOTE
CONTRACT DECISION: APPROVED
PROJECT GATE REVIEW: PASS WITH NOTE
SPRINT CLOSEOUT CHECKPOINT: 21889b1
IMPLEMENTATION APPROVAL: NONE
RUNTIME IMPLEMENTATION AUTHORITY: NONE
```

Validation rules in this document reference fields defined in `CONTRACT.md`.
They do not authorize code implementation.

Any QA wording retained elsewhere in the Sprint records is historical only and
does not supersede this approved current-status block.

## 2. Validation Boundary

Future validation must be pure, deterministic, and input-bound.

Validation may inspect only the candidate Result payload and supplied reference
bindings. It must not perform Runtime execution, Provider Invocation, MCP
Invocation, persistence, network calls, DB reads, Vault reads, live Credential
validation, or approval revalidation.

## 3. Required Field Validation

Every `RuntimeExecutionResult` must require these deterministic-core fields:

- `formatVersion`
- `runtimeExecutionResultId`
- `runtimeExecutionId`
- `runtimeExecutionRequestReference`
- `runtimePreflightResultReference`
- `runtimeExecutionStartReference`
- `status`
- `completedAt`
- `integrityChecksum`

Validation must reject missing, empty, malformed, or non-canonical required
core fields. Status-conditional references are validated only by the matrix in
§6; they are not universal required fields.

## 4. Identity and Correlation Validation

Validation must reject:

- missing `runtimeExecutionResultId`;
- missing `runtimeExecutionId`;
- Result references that do not bind to the same execution chain when supplied;
- missing Request, Preflight, or Execution Start reference bindings;
- attempts to recreate or replace upstream identifiers;
- `completedAt` missing or not canonical ISO UTC;
- `completedAt` generated implicitly by the Result builder;
- `completedAt` earlier than the referenced execution start `startedAt`, when
  the start timestamp is supplied.

The exact hash algorithm and encoding are deferred, but future validation must
confirm checksum/reference shape and deterministic-core consistency.

## 5. Status Validation

Allowed `RuntimeExecutionResultStatus` values:

```text
SUCCEEDED
SUCCEEDED_WITH_LIMITATIONS
FAILED
CANCELLED
TIMED_OUT
BLOCKED
INVALID
```

Validation must reject:

- unknown Result status;
- multiple normalized Result statuses;
- Step status values used as Result status;
- Attempt status values used as Result status;
- Provider/MCP/deployment/Marketplace status values used as Result status.

`CANCELLED` and `TIMED_OUT` must be mutually exclusive.

## 6. Required Reference Matrix Validation

Validation must enforce this matrix exactly:

| Result status | Required references | Optional references | Forbidden claims |
|---|---|---|---|
| `SUCCEEDED` | `stepSummaryReference`, at least one `evidenceReference` | `outputReference`, `attemptSummaryReference` | error, blocking, cancellation, timeout, or validation failure |
| `SUCCEEDED_WITH_LIMITATIONS` | `stepSummaryReference`, at least one `evidenceReference`, limitation code or reference | `outputReference`, `attemptSummaryReference` | error, blocking, cancellation, timeout, or validation failure |
| `FAILED` | `stepSummaryReference`, `errorReference`, at least one `evidenceReference` | `attemptSummaryReference`, `outputReference` | cancellation, timeout, or blocking as the normalized terminal cause |
| `CANCELLED` | `cancellationReference` | `stepSummaryReference`, `attemptSummaryReference`, `evidenceReference`, `outputReference` | timeout as the normalized terminal cause |
| `TIMED_OUT` | `timeoutReference` | `stepSummaryReference`, `attemptSummaryReference`, `evidenceReference`, `outputReference` | cancellation as the normalized terminal cause |
| `BLOCKED` | `blockingReference` | `stepSummaryReference`, `attemptSummaryReference`, `validationReference` | execution success or externally verified failure |
| `INVALID` | `validationReference` | `stepSummaryReference`, `attemptSummaryReference`, safe `errorReference` | execution, Provider, MCP, deployment, or external-effect outcome |

`outputReference` remains optional for every status.
`attemptSummaryReference` remains optional because Attempt Result artifacts are
deferred.

`stepSummaryReference` and `evidenceReferences` are not required for
`CANCELLED`, `TIMED_OUT`, `BLOCKED`, or `INVALID` when their matrix-required
terminal reference is present. A limitation reference collection must contain
at least one member for `SUCCEEDED_WITH_LIMITATIONS`; a limitation code, when
used instead, must be an allowed uppercase-snake-case value. The code vocabulary
remains deferred.

## 7. Aggregation Validation

Validation must enforce:

- `RuntimeExecutionResult` uses `stepSummaryReference`, not embedded Step
  records.
- `attemptSummaryReference` is optional and reference-only.
- Step and Attempt status enums are not redefined.
- terminal Step/Attempt reference matrix is not changed.
- duplicate repeated references are rejected; they are not silently normalized.
- semantically ordered Step-derived collections are canonical by `sequence`,
  then `runtimeStepId`, then immutable reference/checksum.
- unordered repeated reference collections, including Evidence and limitation
  reference arrays, are canonical only when sorted by the
  locale-independent UTF-8 bytewise tuple: reference category, stable opaque
  reference identifier, then immutable reference/checksum.

Validation must not define detailed partial, dependency, skipped, parallel,
retry, or duplicate-normalization semantics beyond the locked boundary. Those
details remain deferred.

## 8. Deterministic Serialization Validation

Validation must enforce:

- required fields are present;
- optional fields are omitted rather than represented as `null`;
- timestamps are canonical ISO UTC instants;
- enums use uppercase snake case;
- top-level unknown fields are rejected;
- deterministic-core unknown fields are rejected;
- free-form metadata is rejected in v1;
- arrays reject duplicates and use canonical order.
- caller input order is rejected for unordered reference arrays when it differs
  from the canonical tuple order; only explicitly semantically ordered
  collections may preserve declared caller order.

Validation must not require a specific digest algorithm, hash encoding, or
serializer implementation in this draft.

## 9. Evidence Boundary Validation

Validation must enforce:

- Evidence is referenced, not embedded;
- Evidence Bundle and Evidence Report are not assembled by the Result;
- `SUCCEEDED`, `SUCCEEDED_WITH_LIMITATIONS`, and `FAILED` have at least one
  `evidenceReference`;
- `CANCELLED` has `cancellationReference`;
- `TIMED_OUT` has `timeoutReference`;
- `BLOCKED` has `blockingReference`;
- `INVALID` has `validationReference`;
- absence of Evidence for `CANCELLED`, `TIMED_OUT`, `BLOCKED`, or `INVALID`
  does not assert external success.

## 10. Provider and MCP Boundary Validation

Validation must reject:

- raw Provider response bodies;
- raw MCP response bodies;
- Provider/MCP headers;
- Provider/MCP Credential values;
- Provider/MCP detailed schema ownership in the Result contract;
- claims that Provider or MCP succeeded without delegated safe references.

Provider and MCP detailed outcomes remain future Invocation contracts.

## 11. Secret Safety Validation

Validation must reject or sanitize:

- raw API keys;
- access or refresh tokens;
- private keys;
- raw Authorization headers;
- raw Provider responses;
- raw MCP responses;
- raw logs;
- stack traces containing sensitive data;
- full private user input;
- Vault content;
- Credential values;
- signed URLs or tokenized private paths.

## 12. Validator Failure and `INVALID` Boundary

Malformed proposed Result input is rejected by validator failure. It must not
mint or persist an `INVALID` Result artifact.

An `INVALID` Result is allowed only when the candidate is structurally valid and
contains a safe `validationReference` describing an upstream validation or
aggregation outcome.

## 13. Cross-Contract Validation

Validation must confirm:

- Runtime Execution Request identity is referenced, not modified;
- Runtime Preflight result is referenced, not recalculated;
- Runtime Execution Start identity is referenced, not moved through lifecycle
  states;
- Runtime Step and Attempt statuses remain owned by the Step contract;
- Provider Invocation and MCP Invocation remain references only;
- Credential handling remains reference-only;
- Evidence references remain immutable.

## 14. QA Notes

Review must confirm:

- `CONTRACT.md`, `STATE_MACHINE.md`, and this document use the same Result
  status values;
- the status/reference matrix matches `DECISIONS.md`;
- no field names are introduced here without `CONTRACT.md`;
- no implementation, persistence, Provider, MCP, Runtime execution, DB, API,
  UI, Push, Merge, or Deploy behavior is implied.
