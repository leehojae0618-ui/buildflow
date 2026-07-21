# Runtime Step Validation

## 1. Status

```text
TASK: RUNTIME-STEP-CONTRACT-001
STATUS: APPROVED CONTRACT
CONTRACT REVIEW: APPROVED
PM DECISION: APPROVE
CTO DECISION: APPROVE
CONTRACT DECISION: APPROVED
CHECKPOINT STATUS: READY
IMPLEMENTATION APPROVAL: NONE
```

Validation rules in this document reference fields defined in `CONTRACT.md`.
They do not authorize code implementation.

## 2. Validation Boundary

Validation is contract-only and pure in the future implementation scope. It must
not perform Runtime execution, Provider Invocation, MCP Invocation, persistence,
network calls, Vault reads, or live Credential validation.

## 3. Required Field Validation

Runtime Step must require:

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

Runtime Step Attempt must require:

- `formatVersion`
- `runtimeExecutionId`
- `runtimeStepId`
- `runtimeStepAttemptId`
- `attemptNumber`
- `status`
- `startedAtReference`
- `completedAtReference`
- `inputReferences`
- `outputReferences`
- `blockingReasons`
- `evidenceReferences`
- `failure`
- `retryDecision`
- `limitationCodes`
- `integrityChecksum`

## 4. Identity Validation

Validation must reject:

- missing ids;
- empty ids;
- Attempt without matching `runtimeStepId`;
- Step without `runtimeExecutionId`;
- Step without `runtimeExecutionStartId`;
- duplicate dependency references;
- parent reference equal to `runtimeStepId`;
- dependency reference equal to `runtimeStepId`;
- dependency cycles when dependency graph is supplied.

## 5. Status Validation

Validation must reject:

- unknown Step status;
- unknown Attempt status;
- using Attempt-only status as Step status;
- using Step-only status as Attempt status;
- terminal Step status without required terminal reference;
- terminal Attempt status without required terminal reference.

`WAITING` is valid only for Step status. Approval waiting must be represented by
`APPROVAL_REQUIRED` blocking reason and approval reference.

## 6. Invocation Boundary Validation

Allowed invocation boundary values:

```text
NONE
PROVIDER
MCP
```

Validation must enforce:

- `PROVIDER` requires `providerInvocationReference`.
- `PROVIDER` forbids `mcpInvocationReference`.
- `MCP` requires `mcpInvocationReference`.
- `MCP` forbids `providerInvocationReference`.
- `NONE` forbids both invocation references.
- A Step must not reference both Provider and MCP invocation candidates.

## 7. Approval Validation

Validation must enforce:

- `APPROVAL_REQUIRED` requires at least one approval reference.
- Approval waiting must not be inferred from `WAITING` alone.
- Approval reference must be reference-only.
- Raw approval payload must not be embedded.

## 8. Timeout and Retry Validation

Validation must enforce:

- missing `timeoutPolicyReference` resolves to
  `DEFAULT_TIMEOUT_POLICY_REFERENCE`;
- missing `retryPolicyReference` resolves to `DEFAULT_RETRY_POLICY_REFERENCE`;
- Attempt `TIMEOUT` requires Evidence reference or timeout reference.
- Attempt `TIMEOUT` with retry allowed may create a new Attempt in later
  execution contracts.
- Step `TIMEOUT` is valid only when retry is denied or exhausted by policy
  reference.
- Step `TIMEOUT` requires Evidence reference or timeout reference.
- retry must create a new `runtimeStepAttemptId`, not mutate a prior Attempt.

## 9. Cancellation Validation

Validation must enforce:

- Step `CANCELLED` requires Evidence or cancellation reference.
- Attempt `CANCELLED` requires Evidence or cancellation reference.
- cancellation references are reference-only.
- cancellation must not imply external Provider/MCP cancellation success.

## 10. Secret Safety Validation

Validation must reject or sanitize:

- raw API keys;
- access or refresh tokens;
- private keys;
- raw Authorization headers;
- raw Provider responses;
- raw MCP responses;
- stack traces containing sensitive data;
- full private user input.

## 11. Cross-Contract Validation

Validation must confirm:

- Runtime Execution Request identity is referenced, not modified;
- Runtime Preflight assumptions are consumed, not recalculated;
- Runtime Execution Start identity is referenced, not moved to `RUNNING`;
- Provider Invocation and MCP Invocation remain references only;
- Credential handling remains reference-only;
- Evidence references remain immutable.

## 12. QA Notes

Review must confirm that:

- `CONTRACT.md`, `STATE_MACHINE.md`, and this document use the same status
  values;
- no additional field names are introduced here without `CONTRACT.md`;
- no implementation, persistence, Provider, MCP, or Runtime execution behavior
  is implied.
