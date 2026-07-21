# Runtime Step Implementation Plan

## 1. Status

```text
PLANNING ID: RUNTIME-STEP-IMPLEMENTATION-PLANNING-001
PLANNING STATUS: ACTIVE / IMPLEMENTATION APPROVAL REVALIDATION REQUIRED / AUTHORITY SUSPENDED
CURRENT SPRINT WORK: CONTRACT REVALIDATION COMPLETE / IMPLEMENTATION APPROVAL REVALIDATION PENDING
CONTRACT CHECKPOINT: 730bde8
CURRENT CONTRACT AMENDMENT: INITIAL-RETRY DISCRIMINATOR (`59aa291`)
PREVIOUS FIELD-MATRIX AMENDMENT: INDEPENDENT RE-REVIEW PASS (`ca54d12`)
PREVIOUS SPRINT CLOSEOUT: 3873534
IMPLEMENTATION APPROVAL: SUSPENDED PENDING REVALIDATION
IMPLEMENTATION SCOPE: LOCKED
IMPLEMENTATION APPROVAL CHECKPOINT: e743068
RUNTIME IMPLEMENTATION AUTHORITY: SUSPENDED PENDING REVALIDATION
RUNTIME IMPLEMENTATION STATUS: IMPLEMENTED / REVIEW FAILED / CHANGES PROHIBITED
RUNTIME STEP IMPLEMENTATION CHECKPOINT: 13a2c26
```

## 2. Implementation Objective

Plan the minimum pure implementation of the approved Runtime Step and Runtime
Step Attempt records. The slice must construct and validate deterministic,
reference-only records; it must not execute a Step or interact with a Provider,
MCP server, database, filesystem, or network.

The prior approved contract has a limited Attempt field-matrix amendment with
independent re-review PASS. Planning Consistency Review is PASS with P0/P1/P2
`0/0/0` and requires no rewrite. Independent implementation review found a
blocking predecessor-validation P1. Contract revalidation is now complete with
Planning Compatibility PASS and no rewrite required. Implementation Approval
and Runtime Implementation Authority remain suspended pending Implementation
Approval Revalidation. The implemented three-file slice at `13a2c26` must not
change until authority is regranted.

## 3. Exact Proposed File Scope

| Path | Proposed Action | Purpose |
|---|---|---|
| `src/features/agents/runtime-execution-step.ts` | CREATE | Runtime Step and Attempt types, status constants, pure builders, validators, canonical deterministic-core serialization, integrity digest, and safe failure unions. |
| `src/features/agents/runtime-execution-step.test.ts` | CREATE | Unit and contract tests for identity, references, transition rules, terminal-reference matrix, determinism, safety, and non-mutation. |
| `src/features/agents/index.ts` | MODIFY | Public exports for the approved Runtime Step API only. |

No other file is proposed. If implementation requires another file, it must
stop for an Implementation Approval Amendment.

## 4. Existing Assets to Reuse

- `ReferenceIdentifier` from `runtime-execution-request.ts` for safe
  reference-first fields.
- Runtime Request identity and integrity bindings from
  `runtime-execution-request.ts`.
- Runtime Preflight and immutable Runtime Execution Start bindings from
  `runtime-execution-start.ts`.
- Existing `RuntimeExecutionResult` as the downstream execution-level consumer
  of Step/Attempt summary references; it is not modified by this slice.
- `stableSerializeAgentPackage` and Node `createHash` only as evaluated
  precedents. Reuse requires an approval-time policy comparison; no implicit
  serializer or digest choice is authorized by this plan.
- Vitest conventions used by `runtime-execution-request.test.ts`,
  `runtime-execution-start.test.ts`, and `runtime-execution-result.test.ts`.

No new dependency is required for the proposed pure slice.

## 5. Model, Identity, and Reference Bindings

- A Step binds one `runtimeExecutionId`, one
  `runtimeExecutionRequestId`, and one `runtimeExecutionStartId`.
- A Step owns stable `runtimeStepId`; a retry retains that Step id and mints a
  new `runtimeStepAttemptId` for a new immutable Attempt record.
- Full execution retry remains owned by the Execution Start contract and mints
  a new `runtimeExecutionId`; this module must not mint or reinterpret it.
- Parent and dependency Step references are explicit and must reject self
  references, duplicates, and supplied dependency cycles.
- Provider/MCP references remain mutually exclusive, reference-only optional
  bindings selected by `invocationBoundary`.
- Step/Attempt records provide safe summary references for future Result work;
  they do not build or modify `RuntimeExecutionResult`.

## 6. Status and State-Transition Enforcement

- Implement the approved, separate Step and Attempt enums without adding
  statuses.
- Validate only the documented transitions through a pure helper supplied with
  prior and next statuses; it does not persist or execute a lifecycle
  transition. Terminal records never transition back to non-terminal states.
- Model approval waiting solely through `APPROVAL_REQUIRED` blocking reason and
  an approval reference, never as a standalone status.
- Preserve the distinction between Attempt `TIMEOUT` and terminal Step
  `TIMEOUT`; actual retry execution and policy evaluation remain outside this
  slice.
- Enforce the approved terminal-reference matrix, including evidence,
  cancellation, timeout, and deterministic skip-reason alternatives.

## 7. Builder and Validator Responsibilities

- Builders accept complete caller-supplied values, normalize safe references,
  construct deterministic cores, compute identities/checksums only after the
  policy is approved, and return discriminated valid/invalid results.
- Validators are pure: required fields, id bindings, enum membership,
  invocation-boundary exclusivity, reference collection integrity, status
  conditions, dependency/parent restrictions, terminal references, and secret
  safety.
- Validators never execute retries, dereference a Provider/MCP reference, query
  persistence, resolve credentials, or prove external side effects.

## 8. Serializer, Digest, and Immutability Boundary

- The contract requires `integrityChecksum`; its exact canonical serializer and
  digest policy must be explicitly locked by Implementation Approval before
  code is written.
- Candidate policy comparison must cover key ordering, array-order semantics,
  finite JSON values, unsupported/cyclic value rejection, UTF-8 output, digest
  algorithm/encoding, and no clock/random/environment/locale input.
- Deterministic core includes only the contract-defined identities, sequence,
  boundary, status, references, blocking reasons, policy references, and
  limitation codes. Metadata remains outside unless separately approved.
- Builders and validators must not mutate caller input; returned references and
  collections must be isolated from later caller mutation.

## 9. Test Matrix

- Valid Step construction for each Step status and valid Attempt construction
  for each Attempt status.
- Reject unknown statuses, illegal transitions, terminal rewrites, missing or
  malformed identities, invalid Request/Start bindings, duplicate/self/cyclic
  dependency references, and invalid parent references.
- Enforce Provider/MCP/NONE exclusivity and approval-blocking representation.
- Enforce Step and Attempt terminal-reference rules and timeout/retry identity
  boundaries without executing a retry.
- Verify deterministic core/identity/checksum behavior after the policy is
  approved, dense collection handling, canonical ordering, input non-mutation,
  and returned-value isolation.
- Reject secret-like values, raw credential fields, raw Provider/MCP payloads,
  unsupported values, and cyclic values.
- Confirm no persistence, network, Provider/MCP, filesystem, or Runtime
  orchestration side effect occurs.

## 10. Deferred and Prohibited Scope

- Actual Step execution, Provider/MCP invocation, scheduling, worker/queue,
  retry execution, resume, cancellation execution, orchestration, and
  aggregation are deferred.
- RuntimeExecutionResult aggregation/report generation and Evidence
  Bundle/Report integration are deferred.
- Persistence, API/UI, deployment, database, external I/O, and unrelated
  contract changes are prohibited.

## 11. Stop Conditions and Approval Requirements

Request an Implementation Approval Amendment and stop before code changes if:

1. another path or dependency is required;
2. the approved contract cannot be represented without adding semantics;
3. the serializer/digest policy cannot be locked consistently with approved
   contracts;
4. an upstream/downstream Runtime contract requires modification;
5. tests require integration or external I/O; or
6. a Provider/MCP, persistence, orchestration, or retry-execution concern is
   needed to make the slice pass.

The granted Authority preserves the locked three paths and test authority. It
requires an Implementation Approval Amendment before code may resolve the
deferred serializer or digest policy, or any remaining reference-schema detail.
