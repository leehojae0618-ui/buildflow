# Package Runtime Evidence

## 1. Status

```text
Task ID: PACKAGE-RUNTIME-EVIDENCE-001
Status: DRAFT
Stage: DESIGN COMPLETE
Implementation: NOT STARTED
Commit: NOT PERFORMED
Package Readiness: CONDITIONALLY_READY
```

This document is a design-only contract proposal. It does not implement Runtime
execution, MCP Invocation, Provider execution, deployment, persistence,
Marketplace behavior, or UI.

## 2. Objective

Define a deterministic, reference-first, secret-safe Runtime Evidence contract
that can later connect Package Export, Package Verification, Evidence Report,
and Package Approval Gate results to an actual execution attempt.

Runtime Evidence must answer:

- which package and version was requested for execution;
- which Package Evidence Report and Approval Gate result authorized the
  request;
- which scopes were granted;
- who requested, authorized, executed, cancelled, or observed the run;
- when execution explicitly started and completed;
- which steps were attempted;
- which input and output artifacts were referenced;
- which checksums bind the request, start evidence, step evidence, result,
  bundle, and report;
- which failures, warnings, and limitations remain.

Runtime Evidence must not imply deployment success, MCP success, Provider
success, installation readiness, Marketplace readiness, or user approval beyond
the explicit approval reference it binds to.

## 3. Current Context

Current upstream package evidence layers:

- Package Export exists as deterministic JSON artifact evidence.
- Package Verification exists as a pure structural verifier and returns
  `VERIFIED_WITH_LIMITATIONS` for the current valid path.
- Package Evidence Bundle exists as a reference-only deterministic bundle and
  returns `VALID_WITH_LIMITATIONS` for the current valid path.
- Package Verification Pipeline exists as a pure composition layer and returns
  `COMPLETED_WITH_LIMITATIONS` for the current valid path.
- Package Evidence Report exists as a reference-first report layer.
- Package Approval Gate exists as a pure approval request, decision, and gate
  evaluator contract.

Current missing execution evidence:

- no Runtime execution;
- no MCP Tool Invocation;
- no Provider execution;
- no deployment;
- no persisted approval record;
- no Marketplace publication.

Therefore Runtime Evidence v1 is designed as the next evidence boundary, not as
proof that execution already occurred.

## 4. Runtime Evidence Boundary

Runtime Evidence is responsible for:

- binding a Runtime Execution Request to a Package artifact, Evidence Report,
  Approval Gate result, and granted execution scope;
- recording immutable execution start evidence;
- recording immutable completed step evidence;
- recording an execution result;
- bundling Runtime evidence references without duplicating payloads;
- producing a Runtime Evidence Report for QA and later product presentation.

Runtime Evidence is not responsible for:

- running MCP Tools;
- running Provider Adapters;
- reading Vault or Credential values;
- deploying services;
- generating Marketplace listings;
- proving external Provider truth without Provider-specific attestations;
- upgrading Package Readiness to `READY`.

## 5. Selected v1 Contract Layers

Runtime Evidence v1 uses six explicit layers:

1. Runtime Execution Request
2. Runtime Execution Start Evidence
3. Runtime Step Evidence
4. Runtime Execution Result
5. Runtime Evidence Bundle
6. Runtime Evidence Report

This split keeps authorization, execution start, step outcomes, final result,
bundle integrity, and human-readable reporting separate. It also avoids mutable
overwrites and makes retries or multiple attempts explicit.

## 6. Format Versions

The proposed v1 format versions are:

```text
buildflow.runtime-execution-request.v1
buildflow.runtime-execution-start.v1
buildflow.runtime-step-evidence.v1
buildflow.runtime-execution-result.v1
buildflow.runtime-evidence-bundle.v1
buildflow.runtime-evidence-report.v1
```

## 7. Runtime Execution Request

Required deterministic fields:

- `formatVersion`
- `runtimeExecutionRequestId`
- `packageId`
- `packageVersion`
- `packageArtifactChecksum`
- `evidenceReportId`
- `evidenceReportIntegrityChecksum`
- `approvalRequestId`
- `approvalGateIntegrityChecksum`
- `approvedScopes`
- `requestedExecutionMode`
- `executionProfileReference`
- `requestedBy`
- `authorizationReference`
- `inputArtifactReferences`
- `requestedCapabilities`
- `runtimePolicyReference`
- `expirationPolicy`
- `integrityChecksum`

Rules:

- `approvedScopes` must include `RUNTIME_EXECUTION`.
- `PACKAGE_ACCEPTANCE` alone is insufficient for Runtime execution.
- Approval data is referenced by id/checksum; the full Approval Gate payload is
  not copied into the request.
- The request may include capability references, but must not include raw
  Provider inputs, raw prompts, raw logs, headers, tokens, or Credential values.

## 8. Runtime Execution Start Evidence

Required deterministic fields:

- `formatVersion`
- `runtimeExecutionId`
- `runtimeExecutionRequestId`
- `executionAttempt`
- `executorReference`
- `runtimeEngineReference`
- `runtimeVersionReference`
- `environmentProfileReference`
- `startedAt`
- `authorizationBinding`
- `packageBinding`
- `inputBindings`
- `capabilityBindings`
- `integrityChecksum`

Rules:

- `startedAt` is explicit and canonical.
- `runtimeExecutionId` includes the request id, attempt reference,
  executor/runtime references, and canonical `startedAt`.
- Environment information is by reference only.
- Environment variables, command arguments, process dumps, and raw runtime logs
  are forbidden.

## 9. Runtime Step Evidence

Required deterministic fields:

- `formatVersion`
- `runtimeExecutionId`
- `stepId`
- `stepSequence`
- `stepType`
- `stepNameReference`
- `inputReferences`
- `outputReferences`
- `capabilityReferences`
- `providerExecutionReferences`
- `startedAt`
- `completedAt`
- `durationReference`
- `stepStatus`
- `failureCodes`
- `warningCodes`
- `limitationCodes`
- `integrityChecksum`

Step status values:

```text
PENDING
STARTED
SUCCEEDED
FAILED
SKIPPED
CANCELLED
TIMED_OUT
BLOCKED
INVALID
```

v1 records immutable completed step evidence. A real-time event stream is a
future extension. Parallel steps may use `parentStepReference` and
`dependencyReferences`, but deterministic ordering still uses canonical
`stepSequence`, `stepId`, and checksum sorting.

## 10. Runtime Execution Result

Execution result status values:

```text
SUCCEEDED
SUCCEEDED_WITH_LIMITATIONS
FAILED
CANCELLED
TIMED_OUT
BLOCKED
INVALID
```

Rules:

- Do not add `PARTIAL_SUCCESS`; use `SUCCEEDED_WITH_LIMITATIONS`.
- `completedAt` is explicit and participates in the result identity.
- `completedAt` earlier than `startedAt` is invalid.
- A successful result still does not prove deployment, Marketplace publish,
  Provider truth, or MCP truth unless those are represented by separate
  evidence references.

## 11. Runtime Evidence Bundle

The Runtime Evidence Bundle connects:

- Runtime Execution Request checksum/reference;
- Runtime Execution Start checksum/reference;
- Runtime Step Evidence checksums/references;
- Runtime Execution Result checksum/reference;
- package and approval binding checksums;
- limitation, warning, and failure summaries.

The bundle is reference-first. It must not embed full Package artifacts,
Verification Reports, Approval Gate payloads, Runtime logs, Provider responses,
MCP responses, or output files.

## 12. Runtime Evidence Report

Runtime Evidence Report status values:

```text
INVALID
INCOMPLETE
VALID_WITH_LIMITATIONS
VALID
```

v1 success should be `VALID_WITH_LIMITATIONS`. `VALID` is reserved for a future
policy where runtime, Provider, MCP, deployment, persistence, and external
attestation expectations are explicitly satisfied.

The report may include human-readable summaries outside the deterministic core,
but those summaries must be generated from references and sanitized fields only.

## 13. Approval Gate Binding

Minimum required binding for Runtime Execution:

- Approval Gate status is `APPROVED_WITH_LIMITATIONS`;
- authorization status is `AUTHORIZED_WITH_LIMITATIONS`;
- granted scopes include `RUNTIME_EXECUTION`;
- Package Readiness remains `CONDITIONALLY_READY`;
- package artifact checksum matches the approved source;
- evidence report checksum matches the approved source;
- approval gate checksum matches the request binding;
- gate is not stale at execution start;
- request is not expired;
- runtime execution request integrity is valid.

Runtime Evidence references Approval Gate data by id/checksum only. It does not
copy full approval payloads.

## 14. Stale and Revoke Policy

- If the Approval Gate is stale before execution start, the Runtime Execution
  Request is `BLOCKED`.
- If the Approval Gate becomes stale after execution starts, the start
  authorization snapshot remains immutable. Current authorization evaluation may
  report the stale state separately.
- Revocation during execution does not automatically imply success, failure, or
  cancellation. It requires explicit cancellation or continuation evidence.
- Completed evidence remains immutable.

## 15. Retry and Attempt Policy

- Each attempt receives its own `runtimeExecutionId`.
- Attempts may share the same `runtimeExecutionRequestId`.
- Each attempt revalidates Approval Gate binding before start.
- Retry policy is recorded by reference and does not execute automatically in
  this design.

## 16. Idempotency Policy

- Runtime Execution Request identity is deterministic from canonical request
  fields.
- Runtime execution attempt identity includes the attempt reference and
  `startedAt`.
- Runtime result identity includes `completedAt`.
- The same logical request with the same checksum is a duplicate.
- The same execution or step id with a different checksum is a conflict.

## 17. Time Policy

- All times are explicit canonical ISO instants.
- No `Date.now` or implicit "latest" timestamp inference is allowed in the
  deterministic core.
- `startedAt` and `completedAt` are input values, not generated values.
- `completedAt < startedAt` is invalid.
- Duration is derived or referenced, not treated as independent truth.

## 18. Actor Model

Actor roles:

- `requestedBy`
- `authorizedBy`
- `executedBy`
- `runtimeEngine`
- `cancelledBy`
- `observedBy`

Actor types:

```text
USER
SERVICE
SYSTEM
```

Approval remains USER-only. Execution requester may be USER, SERVICE, or SYSTEM.
Executor should be SERVICE or SYSTEM.

## 19. Capability Binding

Approval scopes and runtime capabilities are separate:

- Approval scope answers "what the user authorized".
- Runtime capability answers "what the agent attempts to do".

v1 uses capability references only. Capability enforcement is a later runtime
implementation concern.

## 20. Artifact Reference Model

Allowed artifact reference fields:

- `artifactId`
- `artifactType`
- `mediaType`
- `integrityChecksum`
- `sizeReference`
- `storageReference`
- `schemaReference`
- `encryptionReference`
- `retentionReference`

Forbidden artifact data:

- full file contents;
- raw bytes;
- signed URLs;
- tokenized private paths;
- secret query parameters;
- raw Provider or MCP response bodies.

## 21. Status Model Separation

These states must remain separate:

- Package Readiness;
- Approval Gate status;
- Runtime Execution status;
- Runtime Evidence Report status;
- Deployment status;
- Marketplace status.

Runtime Evidence must not infer one state from another. A `VALID_WITH_LIMITATIONS`
Runtime Evidence Report does not make the package deployable, installable,
Marketplace-ready, or production-ready.

## 22. Failure, Warning, and Limitation Codes

Failure code candidates:

```text
CONTRACT_ERROR
SECRET_SAFETY_ERROR
AUTHORIZATION_REQUIRED
AUTHORIZATION_STALE
AUTHORIZATION_SCOPE_MISSING
PACKAGE_BINDING_MISMATCH
EVIDENCE_BINDING_MISMATCH
RUNTIME_REQUEST_INVALID
RUNTIME_START_INVALID
RUNTIME_STEP_FAILED
RUNTIME_TIMEOUT
RUNTIME_CANCELLED
RUNTIME_BLOCKED
DUPLICATE_EXECUTION_CONFLICT
DUPLICATE_STEP_CONFLICT
ARTIFACT_INTEGRITY_ERROR
INTERNAL_RUNTIME_EVIDENCE_ERROR
```

Warning code candidates:

```text
RUNTIME_LIMITATION_PRESENT
PARTIAL_OUTPUT_AVAILABLE
NON_REPRODUCIBLE_ENVIRONMENT_REFERENCE
PROVIDER_EVIDENCE_PENDING
ARTIFACT_RETENTION_LIMITED
```

Limitation code candidates:

```text
NO_PROVIDER_ATTESTATION
NO_MCP_ATTESTATION
NO_EXTERNAL_LOG_ATTESTATION
NO_DEPLOYMENT_ATTESTATION
NO_PERSISTENCE_ATTESTATION
NO_RUNTIME_POLICY_ENFORCEMENT
```

## 23. Secret Safety Requirements

Runtime Evidence must reject or sanitize:

- environment variables;
- shell commands and command arguments;
- Provider or MCP request/response bodies;
- headers, cookies, bearer tokens, authorization fields;
- raw logs;
- stack traces;
- signed URLs;
- private keys;
- API keys;
- passwords;
- refresh tokens;
- access tokens;
- Vault content;
- Credential values;
- raw prompt content;
- private user input.

Allowed values are stable references, checksums, classifications, status codes,
failure codes, warning codes, limitation codes, and sanitized summaries.

## 24. Deterministic ID Model

Recommended canonical inputs:

- `runtimeExecutionRequestId`: format version, package id/version, package
  checksum, evidence report checksum, approval request id, approval gate
  checksum, granted scopes, requested execution mode, input artifact references,
  runtime policy reference, expiration policy.
- `runtimeExecutionId`: request id, execution attempt, executor reference,
  runtime engine reference, runtime version reference, environment profile
  reference, startedAt.
- `stepId`: runtime execution id, step sequence, step type, step name reference,
  input/output reference checksums, capability references.
- `runtimeExecutionResultId`: runtime execution id, result status, completedAt,
  step evidence checksums, failure/warning/limitation summaries.
- `runtimeEvidenceBundleId`: request/start/step/result checksums plus package
  and approval binding checksums.
- `runtimeEvidenceReportId`: bundle checksum, report format version, status,
  limitation summary, warning summary.

## 25. Integrity Checksum Model

Each layer owns an integrity checksum:

- request integrity checksum;
- start evidence integrity checksum;
- step evidence integrity checksum;
- result integrity checksum;
- bundle integrity checksum;
- report integrity checksum.

Ordering rules:

- arrays are canonicalized before checksum;
- evidence references are deduplicated and sorted;
- duplicate ids with equal checksum are duplicates;
- duplicate ids with different checksum are conflicts;
- display metadata is outside deterministic core unless explicitly included.

The implementation should consider reusing the existing stable serialization
approach used by Agent Package export.

## 26. Provider and Deployment Boundary

Runtime Evidence may reference Provider or deployment evidence, but it must not
embed raw Provider responses, raw MCP responses, deployment logs, raw headers,
or credentials.

Provider success, MCP success, and deployment success require separate evidence
references. They are not inferred from Runtime Evidence status alone.

## 27. Human-Readable Boundary

Human-readable summaries are allowed only outside the deterministic core.

They must:

- be derived from sanitized status, code, and reference fields;
- avoid raw payloads;
- avoid secret-bearing strings;
- avoid claims that execution, deployment, or Provider actions succeeded unless
  linked evidence exists.

## 28. BuildResult Policy

Future builders should follow the discriminated-union pattern used by recent
package evidence contracts:

- no nullable success payloads;
- sanitized internal error messages;
- explicit failure codes;
- no raw thrown error exposure;
- no secret-bearing payload echo.

## 29. Future Pure Function Candidates

Potential implementation tasks after PM approval:

- `buildRuntimeExecutionRequest`
- `buildRuntimeExecutionStartEvidence`
- `buildRuntimeStepEvidence`
- `buildRuntimeExecutionResult`
- `buildRuntimeEvidenceBundle`
- `buildRuntimeEvidenceReport`
- `validateRuntimeEvidenceBinding`
- `evaluateRuntimeEvidenceStatus`

These must remain pure in their first implementation. No Runtime execution,
Provider execution, MCP Invocation, Vault access, DB persistence, API, UI, or
deployment should be included.

## 30. Test Design

Future tests should cover:

- valid request with `RUNTIME_EXECUTION` scope;
- missing `RUNTIME_EXECUTION` scope;
- stale Approval Gate before start;
- stale Approval Gate after start;
- revoke without cancellation evidence;
- retry attempt with revalidated approval;
- duplicate execution conflict;
- duplicate step conflict;
- deterministic id and checksum stability;
- timestamp ordering failure;
- secret-bearing field rejection;
- raw Provider/MCP response rejection;
- artifact checksum mismatch;
- non-mutation of input objects;
- report returns `VALID_WITH_LIMITATIONS`, not `VALID`;
- no Package Readiness upgrade.

## 31. PM Default Recommendation

Recommended defaults:

1. Use the six-layer Runtime Evidence contract.
2. Keep Bundle and Report separate.
3. Include `startedAt` in execution identity.
4. Revalidate Approval Gate for every attempt.
5. Require explicit cancellation evidence for revoke-during-execution; do not
   infer automatic result.
6. Avoid `PARTIAL_SUCCESS`; use `SUCCEEDED_WITH_LIMITATIONS`.
7. Support parallel steps minimally with `parentStepReference` and
   `dependencyReferences`.
8. Use capability references only in v1.
9. Use artifact id/type/mediaType/checksum/storageReference only.
10. Runtime Evidence Report should return `VALID_WITH_LIMITATIONS`, not `VALID`,
    for v1 success.
11. Separate historical authorization snapshot from current authorization
    evaluation.
12. Include `completedAt` in Runtime Execution Result identity.

## 32. Open Questions

| Question | Option A | Option B | Recommendation | Rationale | Risk |
|---|---|---|---|---|---|
| Contract layers | Use six layers | Collapse Bundle/Report or Start/Result | Six layers | Clear immutable boundaries and retry support | More files/types later |
| Bundle and Report split | Split | Single report object | Split | Keeps deterministic evidence separate from presentation | Slight contract overhead |
| Execution id time input | Include `startedAt` | Exclude `startedAt` | Include `startedAt` | Distinguishes attempts clearly | Requires explicit time input |
| Retry approval check | Revalidate each attempt | Reuse original validation | Revalidate | Prevents stale authorization reuse | More blocking cases |
| Revoke during execution | Require cancellation evidence | Auto-fail/cancel | Require evidence | Avoids hidden runtime behavior | Needs later cancellation contract |
| Partial success enum | Add `PARTIAL_SUCCESS` | Use limitations | Use limitations | Keeps status model smaller | Requires good limitation codes |
| Parallel ordering | Parent/dependency refs | Event stream v1 | Parent/dependency refs | Minimal deterministic v1 | Less real-time detail |
| Capability representation | References only | Enforced enum now | References only | Avoids premature runtime enforcement | Less strict v1 runtime semantics |
| Artifact storage ref | Minimal reference | Full storage descriptor | Minimal reference | Lower secret leakage risk | Needs future storage contract |
| Runtime Report `VALID` | Allow in v1 | Reserve for future | Reserve | Prevents overclaiming | More conservative status |
| Historical/current auth | Separate | Single status | Separate | Accurate after revoke/stale changes | More concepts |
| Result id time input | Include `completedAt` | Exclude `completedAt` | Include `completedAt` | Makes result identity explicit | Requires explicit completion time |

## 33. Runtime Execution Request Implementation

Implementation status:

```text
IMPLEMENTED
FINAL QA APPROVED
```

Implemented files:

- `src/features/agents/runtime-execution-request.ts`
- `src/features/agents/runtime-execution-request.test.ts`
- `src/features/agents/index.ts`

Implemented scope:

- Runtime Execution Request type
- Runtime Execution Request builder
- Approval Gate binding validation
- Package binding validation
- Evidence binding validation
- `RUNTIME_EXECUTION` scope requirement
- `STANDARD` and `DRY_RUN` execution modes
- execution profile reference validation
- optional runtime policy reference validation
- requested actor reference validation
- input artifact reference validation and duplicate normalization
- requested capability reference validation and duplicate normalization
- expiration policy validation
- deterministic request id
- integrity checksum
- secret-safety rejection
- payload exclusion
- input non-mutation tests
- sanitized internal error failure

Final execution modes:

```text
STANDARD
DRY_RUN
```

`VALIDATION_ONLY` is intentionally deferred because the current Runtime
Execution Request layer only needs a normal request mode and a non-mutating
dry-run request mode.

Request status:

- Runtime Execution Request has no mutable runtime status.
- Builder result is either `VALID` or `INVALID`.
- `PENDING`, `STARTED`, `RUNNING`, `COMPLETED`, and `EXECUTED` remain out of
  this layer.

Limitations included in valid v1 requests:

- `NO_MCP_ATTESTATION`
- `NO_PERSISTENCE_ATTESTATION`
- `NO_PROVIDER_ATTESTATION`
- `NO_RUNTIME_POLICY_ENFORCEMENT`

Still not implemented:

- Runtime Execution Start Evidence
- Runtime Step Evidence
- Runtime Execution Result
- Runtime Evidence Bundle
- Runtime Evidence Report
- Runtime execution
- Provider execution
- MCP Invocation
- deployment
- persistence
- Marketplace

Final QA result:

- QA verdict: `APPROVED`
- Target tests: 27 passed
- Package Readiness remains `CONDITIONALLY_READY`
- Runtime execution is still not implemented

## 34. Out of Scope

- Runtime Evidence code implementation beyond Runtime Execution Request
- Runtime execution
- MCP Tool Invocation
- Provider execution
- Vault access
- Credential access
- DB persistence
- API endpoint
- UI
- deployment
- Marketplace
- ZIP/Installer changes
- Package Readiness upgrade to `READY`
- Quality Score calculation
- next Sprint implementation

Runtime Execution Request is now the only implemented Runtime Evidence code
layer. The remaining Runtime Evidence layers above are still out of scope.

## 35. Recommended Next Task

Recommended next task:

```text
RUNTIME-MCP-BOUNDARY-001
Runtime Step / Provider / MCP / Credential Boundary Design
```

The next task should be a design boundary decision task. It should not start
Runtime Start, Step, Result, Bundle, Report, Provider Invocation, MCP
Invocation, Credential Storage, OAuth, or Cost Simulation implementation.
