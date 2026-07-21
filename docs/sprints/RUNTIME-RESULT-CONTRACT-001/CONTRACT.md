# Runtime Execution Result Contract

## 1. Purpose

Define the authoritative draft contract for `RuntimeExecutionResult`. The
contract describes a deterministic, reference-first outcome artifact for one
Runtime Execution after Runtime Execution Start and Runtime Step processing.

This document does not implement Runtime execution, Provider Invocation, MCP
Invocation, persistence, Evidence storage, tests, or code.

## 2. Authority and Precedence

This document is the authoritative Runtime Result contract draft for
`RUNTIME-RESULT-CONTRACT-001`.

Derived documents must not introduce different status names, reference names,
or validation requirements:

- `STATE_MACHINE.md`
- `VALIDATION.md`
- `QA_CHECKLIST.md`
- `REVIEW.md`

Scope and decision sources:

- `TASK.md` defines the frozen Sprint boundary.
- `DECISIONS.md` locks the pre-draft Open Questions decisions.
- `docs/sprints/RUNTIME-STEP-CONTRACT-001/CONTRACT.md` remains authoritative for
  Runtime Step and Runtime Step Attempt identities, statuses, and terminal
  reference requirements.

If this document appears to conflict with `DECISIONS.md`, the draft must be
revised before PM/CTO review. If this document appears to conflict with Runtime
Step contract ownership, the Step contract remains authoritative for Step and
Attempt behavior.

## 3. Responsibilities

`RuntimeExecutionResult` is responsible for:

- recording one normalized execution-level outcome;
- binding that outcome to the immutable Runtime Execution chain;
- referencing Step and Attempt summaries without embedding full records;
- applying the approved Result status/reference matrix;
- binding safe Evidence references when required;
- recording limitations, failures, blocking, cancellation, timeout, and
  validation references as safe references;
- providing deterministic identity and integrity boundaries.

Safe warning field selection remains deferred with the v1 safe metadata schema.

`RuntimeExecutionResult` is not responsible for:

- executing Runtime Steps or Attempts;
- deriving live Provider, MCP, deployment, or Marketplace truth;
- storing Evidence payloads;
- assembling Evidence Bundles or Reports;
- redefining Runtime Step or Attempt statuses;
- querying DB, Provider, MCP, Vault, Credential, or network systems.

## 4. In Scope

- `RuntimeExecutionResult` contract shape.
- Result identity and immutable correlation references.
- Result status model and semantics.
- Required and optional status-specific reference matrix.
- Result aggregation boundary by reference or summary reference only.
- Evidence boundary and attestation references.
- Deterministic serialization boundary.
- Contract-level validation rules.
- Safe error, limitation, blocking, cancellation, timeout, and validation
  reference model. Warning-field selection remains deferred.

## 5. Out of Scope

- Runtime Step Result and Runtime Step Attempt Result artifacts.
- Runtime execution engine.
- Provider Invocation and MCP Invocation contracts or implementations.
- Runtime Evidence Bundle or Runtime Evidence Report generation.
- Evidence storage or persistence.
- Event Log, observability, tracing, cost, usage, billing, or policy engine.
- Queue, scheduler, worker, retry, resume, rollback, cancellation execution, or
  lease behavior.
- DB, API, UI, deployment, Marketplace, installer, or dashboard work.
- Vault access, live Credential validation, raw Provider/MCP response storage,
  or secret handling.

## 6. Terminology

| Term | Meaning |
|---|---|
| `RuntimeExecutionResult` | The execution-level normalized outcome artifact defined by this contract. |
| `RuntimeExecutionResultStatus` | The seven-value status enum owned by this contract. |
| `RuntimeExecutionId` | The execution instance identity produced before Step work. |
| `RuntimeExecutionRequestReference` | Reference to the immutable Runtime Execution Request artifact. |
| `RuntimePreflightResultReference` | Reference to the immutable Runtime Preflight Result artifact. |
| `RuntimeExecutionStartReference` | Reference to the immutable Runtime Execution Start artifact. |
| `StepSummaryReference` | Safe summary reference for terminal Runtime Step outcomes. |
| `AttemptSummaryReference` | Optional safe summary reference for Attempt outcomes; detailed Attempt Result artifacts remain deferred. |
| `EvidenceReference` | Immutable attestation reference. Evidence is not embedded in the Result. |
| `OutputReference` | Safe output artifact reference, never a raw output payload. |
| `ErrorReference` | Safe error or failure reference, never raw logs or stack traces. |
| `BlockingReference` | Immutable reference explaining why execution could not proceed or continue. |
| `CancellationReference` | Immutable reference for a normalized cancellation outcome. |
| `TimeoutReference` | Immutable reference for a normalized timeout outcome. |
| `ValidationReference` | Safe reference for validation or aggregation consistency outcome. |

## 7. Contract Shape

Required deterministic-core fields for every Result status:

- `formatVersion`
- `runtimeExecutionResultId`
- `runtimeExecutionId`
- `runtimeExecutionRequestReference`
- `runtimePreflightResultReference`
- `runtimeExecutionStartReference`
- `status`
- `completedAt`
- `integrityChecksum`

Status-conditional reference fields:

- `stepSummaryReference`
- `evidenceReferences`
- limitation reference or limitation code
- `outputReference`
- `attemptSummaryReference`
- `errorReference`
- `blockingReference`
- `cancellationReference`
- `timeoutReference`
- `validationReference`

The required/optional/forbidden presence of every status-conditional field is
governed exclusively by the status/reference matrix in §11. In particular,
`stepSummaryReference` and `evidenceReferences` are not universal fields:
`CANCELLED`, `TIMED_OUT`, `BLOCKED`, and `INVALID` may omit them when their
matrix-required terminal reference is present.

`warningReferences`, `statusReasonReference`, and any free-form metadata field
are not part of v1. Safe warning and metadata field selection remain deferred;
they must not be added as universal fields or used to bypass the matrix.

No free-form metadata object is part of v1. Safe metadata field selection is
deferred.

## 8. Identity and Correlation

`RuntimeExecutionResult` must correlate to exactly one immutable execution
chain:

- Runtime Execution Request;
- Runtime Preflight Result;
- Runtime Execution Start;
- Runtime Execution.

Identity rules:

- `runtimeExecutionResultId` is distinct from `runtimeExecutionId`.
- `runtimeExecutionResultId` must be derived from deterministic-core inputs.
- `completedAt` is a required caller-supplied canonical ISO UTC instant.
- `completedAt` is a Result artifact field and a deterministic-core input.
- `completedAt` must not be generated implicitly by a builder or validator.
- `completedAt` must not precede the referenced execution start `startedAt`.
- The exact digest algorithm, hash encoding, and final hash layout are
  deferred.
- The Result must not recreate, replace, mutate, or move upstream identities.

## 9. Status Model

`RuntimeExecutionResultStatus` values:

```text
SUCCEEDED
SUCCEEDED_WITH_LIMITATIONS
FAILED
CANCELLED
TIMED_OUT
BLOCKED
INVALID
```

The status values are mutually exclusive normalized Result outcomes. They are
not Runtime Step statuses, Runtime Step Attempt statuses, Provider statuses,
MCP statuses, deployment statuses, Evidence Report statuses, Package Readiness
statuses, or Marketplace statuses.

## 10. Status Semantics

| Status | Contract meaning |
|---|---|
| `SUCCEEDED` | The declared execution summary has no terminal failure, cancellation, timeout, block, invalidity, or limitation. It does not prove Provider, MCP, deployment, Marketplace, or external-effect truth. |
| `SUCCEEDED_WITH_LIMITATIONS` | The declared execution summary has no terminal failure, cancellation, timeout, block, or invalidity, but has one or more explicit limitation references or codes. |
| `FAILED` | The declared execution summary contains an unrecovered terminal failure and a safe failure or error reference. |
| `CANCELLED` | A cancellation reference records the normalized terminal outcome. It does not imply rollback or successful external cancellation. |
| `TIMED_OUT` | A timeout reference records the normalized terminal outcome. |
| `BLOCKED` | A blocking reference records that execution could not proceed or continue. It may be produced before every Step is terminal. Resume and continuation semantics are deferred. |
| `INVALID` | A validation or aggregation reference records an unrecoverable contract-consistency outcome. It is not a Provider/MCP execution or external-effect claim. |

Rules:

- `CANCELLED` and `TIMED_OUT` must not be declared together.
- v1 does not infer cancellation/timeout precedence from timestamps.
- malformed Result input is rejected by validation and does not mint an
  `INVALID` Result artifact.
- an `INVALID` Result artifact requires a valid, reference-only validation or
  aggregation outcome reference.

## 11. Required Reference Matrix

This matrix governs `RuntimeExecutionResult` only. It does not change the
approved Runtime Step or Attempt terminal-reference matrix.

| Result status | Required references | Optional references | Forbidden claims |
|---|---|---|---|
| `SUCCEEDED` | `stepSummaryReference`, at least one `evidenceReference` | `outputReference`, `attemptSummaryReference` | error, blocking, cancellation, timeout, or validation failure |
| `SUCCEEDED_WITH_LIMITATIONS` | `stepSummaryReference`, at least one `evidenceReference`, limitation code or reference | `outputReference`, `attemptSummaryReference` | error, blocking, cancellation, timeout, or validation failure |
| `FAILED` | `stepSummaryReference`, `errorReference`, at least one `evidenceReference` | `attemptSummaryReference`, `outputReference` | cancellation, timeout, or blocking as the normalized terminal cause |
| `CANCELLED` | `cancellationReference` | `stepSummaryReference`, `attemptSummaryReference`, `evidenceReference`, `outputReference` | timeout as the normalized terminal cause |
| `TIMED_OUT` | `timeoutReference` | `stepSummaryReference`, `attemptSummaryReference`, `evidenceReference`, `outputReference` | cancellation as the normalized terminal cause |
| `BLOCKED` | `blockingReference` | `stepSummaryReference`, `attemptSummaryReference`, `validationReference` | execution success or externally verified failure |
| `INVALID` | `validationReference` | `stepSummaryReference`, `attemptSummaryReference`, safe `errorReference` | execution, Provider, MCP, deployment, or external-effect outcome |

`outputReference` is optional for every status. A Result can be valid without
copying or owning output payloads. `attemptSummaryReference` is optional because
dedicated Attempt Result artifacts are deferred.

When a limitation is represented by a reference collection, it must contain at
least one member for `SUCCEEDED_WITH_LIMITATIONS`; when it is represented by a
limitation code, the code must be an allowed uppercase-snake-case value. The
exact limitation-code vocabulary remains deferred.

## 12. Aggregation Boundary

The first Result artifact is execution-level only.

Allowed:

- `stepSummaryReference`;
- optional `attemptSummaryReference`;
- references to immutable Step or Attempt summaries;
- status derived from locked summary inputs.

Forbidden:

- embedding full Step or Attempt records;
- redefining Step or Attempt statuses;
- changing Step or Attempt terminal-reference rules;
- inferring Provider or MCP success from invocation references;
- owning detailed partial, dependency, retry, or parallel aggregation rules.

Detailed aggregation, duplicate normalization, partial outcomes, dependency
failure rollup, `SKIPPED` aggregation, parallel ordering, and retry aggregation
remain deferred.

## 13. Evidence Boundary

Result records a normalized outcome. Evidence attests to Result-relevant facts
by immutable reference.

Rules:

- Result must not embed Evidence payloads.
- Result must not assemble Evidence Bundles or Evidence Reports.
- `SUCCEEDED`, `SUCCEEDED_WITH_LIMITATIONS`, and `FAILED` require Evidence
  reference as defined in the matrix.
- `CANCELLED` and `TIMED_OUT` may rely on dedicated terminal references;
  Evidence is optional at this Result layer.
- `BLOCKED` and `INVALID` may omit Evidence when their required blocking or
  validation reference is present.
- absence of Evidence never asserts Runtime, Provider, MCP, deployment, or
  external action success.

## 14. Serialization Rules

Deterministic-core rules:

- `formatVersion` is required.
- required fields are always present.
- optional fields are omitted rather than represented as `null`.
- timestamps use canonical ISO UTC instants.
- enum values use uppercase snake case.
- every repeated reference collection rejects duplicates; v1 does not silently
  normalize duplicates.
- semantically ordered collections preserve their declared caller order and
  must declare a deterministic `sequence` field. Step-derived collections sort
  by `sequence`, then `runtimeStepId`, then immutable reference/checksum as
  stable tie-breakers.
- unordered repeated reference collections, including Evidence and limitation
  reference arrays, sort ascending by the locale-independent UTF-8
  bytewise tuple: reference category, stable opaque reference identifier, then
  immutable reference/checksum. This is a comparison rule, not a concrete
  serializer or digest algorithm.
- a repeated reference collection may not rely on input order unless this
  contract explicitly classifies it as semantically ordered.
- top-level and deterministic-core unknown fields are rejected.
- raw Provider/MCP payloads and secret-bearing values are rejected.

Deferred:

- exact canonical serializer;
- digest algorithm;
- hash encoding;
- concrete safe metadata schema.

## 15. Validation Rules

Future validation is pure, deterministic, and input-bound. It may validate:

- required fields;
- allowed status enum values;
- canonical timestamp form;
- checksum/reference shape;
- correlation consistency among supplied Request, Preflight, Execution Start,
  Step summary, and Attempt summary references;
- `completedAt >= startedAt` when the referenced start timestamp is supplied;
- status/reference matrix requirements;
- mutual exclusivity of cancellation and timeout claims;
- duplicate or non-canonical ordered references;
- secret and raw payload exclusion.

Validation must not:

- query DB, storage, network, Provider, MCP, Vault, Credential, or approval
  systems;
- verify external referenced object existence;
- perform Runtime execution, retry, resume, cancellation, or approval
  revalidation;
- interpret Provider/MCP detailed result schemas;
- mint an `INVALID` artifact from malformed proposed input.

## 16. Error Model

Errors and failures are represented by safe references only.

Allowed:

- failure code references;
- safe error references;
- validation references;
- sanitized target names;
- user-actionable classifications.

Forbidden:

- raw API keys;
- access or refresh tokens;
- private keys;
- authorization headers;
- raw Provider responses;
- raw MCP responses;
- raw logs;
- stack traces containing sensitive data;
- full private user input.

## 17. Security and Redaction

The Result contract is secret-free and reference-first.

The contract rejects:

- raw secrets or Credential values;
- Vault content;
- signed private URLs;
- raw request/response bodies;
- raw prompts or private user payloads;
- raw Provider/MCP headers;
- full logs or stack traces.

Allowed values are stable identifiers, checksums, immutable references,
classifications, status codes, failure codes, warning references, limitation
references, and sanitized summaries.

## 18. Deferred

- Runtime Step Result and Runtime Step Attempt Result artifacts.
- exact hash implementation and serializer.
- detailed Step/Attempt aggregation, duplicate normalization, and cardinality.
- partial, dependency, skipped, parallel, and retry rollup semantics.
- Provider/MCP normalized outcome schemas.
- Evidence Bundle and Evidence Report assembly.
- safe metadata schema.
- runtime execution, persistence, API/UI, Event Log, cost, usage, and
  Marketplace behavior.

## 19. Acceptance Criteria

The contract draft is acceptable when:

- it defines `RuntimeExecutionResult` only;
- Result status values match `DECISIONS.md`;
- status semantics match `DECISIONS.md`;
- required reference matrix matches `DECISIONS.md`;
- `completedAt` is caller-supplied and part of deterministic identity input;
- exact hash implementation remains deferred;
- Runtime Step and Attempt status enums are not redefined;
- terminal Step/Attempt reference matrix remains unchanged;
- Provider/MCP detailed schemas remain delegated;
- Evidence remains a reference boundary;
- validation remains pure and input-bound;
- no code, tests, Runtime implementation, Provider/MCP Invocation, DB, API, UI,
  Push, Merge, or Deploy is authorized.
