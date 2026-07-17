# Runtime / MCP Boundary

## 1. Purpose

`RUNTIME-MCP-BOUNDARY-001` locks the design boundary for actual Agent execution
after Runtime Execution Request.

This is a design and documentation-only decision lock. It does not implement
Runtime Start, Runtime Step, Provider Invocation, MCP Invocation, Connection,
Credential Storage, OAuth, Cost Simulation, persistence, UI, or Marketplace.

## 2. Current Boundary

Completed evidence path:

```text
Package
→ Evidence Report
→ Approval Gate
→ Runtime Execution Request
```

Not implemented:

- Runtime Execution Start
- Runtime Preflight
- Runtime Step
- Runtime Step Attempt
- Provider Invocation
- MCP Invocation
- Runtime Execution Result
- Runtime Evidence Bundle
- Runtime Evidence Report
- Connection persistence
- Credential storage
- OAuth / API Key guide UI
- Cost Simulation Engine
- Deployment
- Marketplace

Package Readiness remains:

```text
CONDITIONALLY_READY
```

`Runtime Execution Request: VALID` means the request contract is valid. It does
not mean execution can start, Credentials are ready, Provider is available, MCP
is connected, deployment is possible, or Marketplace publication is allowed.

## 3. Locked Decisions

The following decisions are locked for subsequent Runtime/MCP implementation:

1. RuntimeExecutionRequest and RuntimeExecution use separate identities.
2. A full execution retry creates a new RuntimeExecutionId.
3. Resume keeps the same RuntimeExecutionId unless the prior execution is
   terminal.
4. Manual rerun creates a new RuntimeExecutionId and links the previous
   execution by reference.
5. RuntimeStep and RuntimeStepAttempt are separate.
6. Step retry keeps RuntimeStepId and creates a new RuntimeStepAttemptId.
7. Provider Invocation and MCP Invocation are separate contracts.
8. Connection and Credential are separate states.
9. Runtime never sees raw Credential material.
10. OAuth/API Key differences are handled by the secure connection layer.
11. Provider/MCP raw payloads are not stored in Evidence.
12. MCP execution is bound to Tool Definition Snapshot checksum.
13. Tool Definition changes require a new snapshot and reapproval.
14. Non-idempotent Tools are not automatically retried.
15. Cancellation never deletes or rewrites existing Evidence.
16. Approval is separated into Package, Runtime Execution, and Step Action
    Approval.
17. Approval is revalidated at preflight, start, resume, retry, and snapshot or
    cost boundary changes.
18. Capability reference alone never grants execution authority.
19. Runtime Step Evidence is required.
20. Provider success and Step success are separate.
21. MCP protocol success and external effect success are separate.
22. Estimated cost, actual usage, provider-reported cost, and actual billed cost
    are separate.
23. Every estimated cost must include simulation language and usage frequency.

## 4. Runtime Lifecycle

Target lifecycle:

```text
Runtime Execution Request
→ Runtime Preflight
→ Runtime Execution Start
→ Runtime Step Plan
→ Runtime Step Attempt
→ Provider Invocation or MCP Invocation
→ Runtime Step Result
→ next Step or approval wait
→ Runtime Execution Result
→ Runtime Evidence Bundle
→ Runtime Evidence Report
```

Runtime Preflight performs non-mutating checks only. It can block execution but
must not invoke Provider/MCP actions or mutate external systems.

## 5. Runtime State Machine

RuntimeExecutionStatus candidates:

```text
CREATED
PREFLIGHT_CHECKING
WAITING_FOR_CONNECTION
WAITING_FOR_CREDENTIAL
WAITING_FOR_APPROVAL
READY
RUNNING
PAUSED
CANCELLATION_REQUESTED
CANCELLED
PARTIAL_SUCCESS
SUCCEEDED
FAILED
EXPIRED
```

Terminal states:

```text
CANCELLED
PARTIAL_SUCCESS
SUCCEEDED
FAILED
EXPIRED
```

Allowed transition examples:

```text
CREATED → PREFLIGHT_CHECKING
PREFLIGHT_CHECKING → READY
PREFLIGHT_CHECKING → WAITING_FOR_CONNECTION
PREFLIGHT_CHECKING → WAITING_FOR_CREDENTIAL
PREFLIGHT_CHECKING → WAITING_FOR_APPROVAL
PREFLIGHT_CHECKING → FAILED
PREFLIGHT_CHECKING → EXPIRED
READY → RUNNING
RUNNING → PAUSED
RUNNING → WAITING_FOR_APPROVAL
RUNNING → CANCELLATION_REQUESTED
RUNNING → PARTIAL_SUCCESS
RUNNING → SUCCEEDED
RUNNING → FAILED
CANCELLATION_REQUESTED → CANCELLED
CANCELLATION_REQUESTED → PARTIAL_SUCCESS
CANCELLATION_REQUESTED → FAILED
```

Forbidden transitions:

- `SUCCEEDED → RUNNING`
- `FAILED → RUNNING`
- `CANCELLED → RUNNING`
- `EXPIRED → READY`
- `RuntimeExecutionRequest VALID → Runtime SUCCEEDED`
- `Approval APPROVED → Credential CONNECTED`

Terminal state re-execution requires a new RuntimeExecutionId.

## 6. Step Contract

RuntimeStep represents a user-understandable unit of work, not a Provider or MCP
object.

Step types:

```text
INTERNAL
TRANSFORMATION
VALIDATION
PROVIDER
MCP
APPROVAL
```

Candidate fields:

- `formatVersion`
- `runtimeStepId`
- `runtimeExecutionId`
- `sequence`
- `blockReference`
- `blueprintNodeReference`
- `stepType`
- `purposeCode`
- `inputReferences`
- `requiredConnectionReferences`
- `requiredCredentialReferences`
- `requiredCapabilityReferences`
- `approvalRequirementReference`
- `providerInvocationReference`
- `mcpInvocationReference`
- `retryPolicyReference`
- `timeoutPolicyReference`
- `idempotencyPolicyReference`
- `status`
- `limitationCodes`
- `integrityChecksum`

Step type and invocation binding must match:

- `PROVIDER` requires ProviderInvocation binding.
- `MCP` requires MCPInvocation binding.
- `APPROVAL` requires ApprovalRequest binding.
- `INTERNAL` must not contain raw Provider/MCP payload.

## 7. Step Attempt Contract

RuntimeStep is the logical task. RuntimeStepAttempt is one execution attempt.

Candidate fields:

- `runtimeStepAttemptId`
- `runtimeStepId`
- `attemptNumber`
- `previousAttemptReference`
- `startRequestedAt`
- `startedAt`
- `completedAt`
- `status`
- `providerInvocationAttemptReference`
- `mcpInvocationAttemptReference`
- `safeFailureCode`
- `retryDecision`
- `cancellationReference`
- `usageReference`
- `integrityChecksum`

Timestamps are factual evidence inputs. Exact identity rules for timestamp
inclusion remain an implementation-level decision, but attempts must never
overwrite prior attempts.

## 8. Provider Boundary

Provider Invocation is model inference/generation only.

Candidate fields:

- `providerInvocationId`
- `providerInvocationAttemptId`
- `runtimeExecutionId`
- `runtimeStepId`
- `providerReference`
- `modelReference`
- `modelVersionReference`
- `inputReference`
- `promptTemplateReference`
- `outputSchemaReference`
- `runtimePolicyReference`
- `credentialReference`
- `executionParametersReference`
- `status`
- `tokenUsageReference`
- `costUsageReference`
- `safeResultReference`
- `limitationCodes`
- `integrityChecksum`

Forbidden:

- raw API Key
- access token
- raw Authorization header
- full prompt text
- private input
- raw provider response
- provider stack trace

Provider success does not imply Runtime Step success. Provider result may still
fail schema validation, safety checks, hallucination checks, or downstream
validation.

## 9. MCP Boundary

MCP is the external action and tool access layer.

MCP structure:

```text
MCP Server Registration
→ MCP Tool Discovery
→ MCP Tool Definition Snapshot
→ MCP Tool Validation
→ MCP Invocation Request
→ MCP Invocation Start
→ MCP Invocation Result
→ MCP Invocation Evidence
→ MCP Evidence Report
```

MCP Tool Discovery grants no execution permission by itself.

Tool Snapshot candidate fields:

- `mcpToolSnapshotId`
- `mcpServerReference`
- `toolId`
- `toolName`
- `purposeCode`
- `safeDescription`
- `inputSchemaReference`
- `inputSchemaChecksum`
- `outputSchemaReference`
- `outputSchemaChecksum`
- `toolDefinitionChecksum`
- `effectClassification`
- `dataAccessClassification`
- `idempotencyClassification`
- `requiredCapabilityReferences`
- `requiredApprovalScopes`
- `discoveredAt`
- `snapshotVersion`
- `limitationCodes`

Effect classification:

```text
READ_ONLY
CREATE
UPDATE
DELETE
PUBLISH
FINANCIAL
ADMIN
UNKNOWN
```

`UNKNOWN` is treated as unsafe for automatic execution.

## 10. Connection Boundary

Connection is a safe account/service relationship. It is not the Credential
secret.

ConnectionStatus candidates:

```text
NOT_CONFIGURED
CONFIGURING
AUTHORIZATION_REQUIRED
TESTING
CONNECTED
DEGRADED
DISCONNECTED
REVOKED
ERROR
```

Connection candidate fields:

- `connectionId`
- `serviceReference`
- `accountReference`
- `organizationReference`
- `connectionType`
- `authenticationMethod`
- `credentialReference`
- `grantedScopeSummary`
- `requestedCapabilityReferences`
- `status`
- `lastValidatedAt`
- `expiresAt`
- `safeDisplayHint`
- `ownerReference`
- `limitationCodes`

Connection cannot be treated as connected until a safe connection test succeeds.

## 11. Credential Boundary

CredentialStatus candidates:

```text
NOT_PRESENT
PENDING
ACTIVE
EXPIRING_SOON
EXPIRED
REVOKED
ROTATION_REQUIRED
INVALID
ERROR
```

Runtime contracts may include:

- `credentialReferenceId`
- `credentialType`
- `providerOrServiceReference`
- `ownerReference`
- `statusReference`
- `versionReference`
- `expiresAt`
- `safeDisplayHint`

Runtime contracts must not include:

- credential value
- API Key
- access token
- refresh token
- password
- private key
- client secret
- authorization header
- connection string
- cookie
- signed credential URL

Secure resolution flow:

```text
Runtime Step
→ Credential Reference
→ Secure Credential Resolver
→ Vault/Secret Store
→ short-lived in-memory credential
→ Provider or MCP adapter
→ immediate discard
```

## 12. Approval Boundary

Approval layers:

1. Package Approval
2. Runtime Execution Approval
3. Step Action Approval

Package Approval does not automatically replace Step Action Approval. Runtime
Execution Approval does not authorize future Tool definition changes.

Potential future scopes:

```text
RUNTIME_EXECUTION
PROVIDER_INVOCATION
MCP_READ
MCP_WRITE
MCP_DELETE
EXTERNAL_PUBLISH
HIGH_COST_EXECUTION
CREDENTIAL_USE
ADMIN_ACTION
```

Scope expansion requires a separate Decision Lock before code changes.

## 13. Retry

Retry categories:

- Provider Invocation Retry
- MCP Invocation Retry
- Runtime Step Retry

Locked rules:

- retry creates a new AttemptId;
- prior Attempt Evidence remains immutable;
- approval validity is rechecked before retry;
- credential validity is rechecked before retry;
- MCP Tool Definition checksum is rechecked before retry;
- external state-changing Tools are not automatically retried without
  idempotency support;
- non-idempotent Tool retry may require user reapproval;
- retry exhaustion makes the Step `FAILED`;
- full execution retry creates a new RuntimeExecutionId.

## 14. Cancellation

Cancellation states:

```text
REQUESTED
ACCEPTED
IN_PROGRESS
COMPLETED
TOO_LATE
REJECTED
FAILED
```

Rules:

- cancellation preserves existing Evidence;
- completed external actions are not assumed rolled back;
- Provider cancellation and MCP external action cancellation are separate;
- cancellation appends new Evidence;
- terminal Step evidence is not rewritten;
- cancellation may lead to `CANCELLED`, `PARTIAL_SUCCESS`, or `FAILED`.

## 15. Idempotency

Idempotency classifications:

```text
IDEMPOTENT
IDEMPOTENT_WITH_KEY
NON_IDEMPOTENT
UNKNOWN
```

Rules:

- `IDEMPOTENT`: automatic retry may be allowed.
- `IDEMPOTENT_WITH_KEY`: retry must reuse the same safe idempotency key.
- `NON_IDEMPOTENT`: automatic retry is forbidden.
- `UNKNOWN`: default to no automatic retry.

Recommended idempotency key binding:

```text
runtimeExecutionId
+ runtimeStepId
+ logical action reference
```

Idempotency keys must not contain secrets.

## 16. Evidence

Runtime Evidence layers:

- Runtime Start Evidence
- Runtime Preflight Evidence
- Runtime Step Evidence
- Provider Invocation Evidence
- MCP Invocation Evidence
- Approval Evidence
- Cancellation Evidence
- Runtime Execution Result
- Runtime Evidence Bundle
- Runtime Evidence Report

Evidence is immutable. Corrections append new Evidence; they do not mutate prior
Evidence.

Runtime Report v1 keeps the conservative success state:

```text
VALID_WITH_LIMITATIONS
```

`VALID` remains reserved until Provider/MCP/persistence/external-effect
attestation policies are satisfied.

## 17. Cost Simulation Binding

Cost Simulation is separate from Runtime Evidence but connects at key moments:

- design-time estimate from Agent/Blueprint/Block analysis;
- pre-execution estimate from Runtime Request and Step Plan;
- runtime actual usage facts from Provider/MCP/storage/scheduler;
- post-execution comparison of estimate and usage.

Cost concepts remain separate:

- Estimated Cost
- Actual Usage
- Estimated Actual Cost
- Provider Reported Cost
- Actual Billed Cost
- Estimate Variance

Required cost wording:

```text
※ 시뮬레이션상의 계산 금액입니다.
(시뮬레이션상 사용 빈도: 하루 {dailyRuns}회 / 월 {monthlyRuns}회)
```

For one execution:

```text
※ 시뮬레이션상의 계산 금액입니다.
(시뮬레이션상 실행 빈도: 이번 실행 1회,
Provider 호출 {providerCalls}회,
MCP 호출 {mcpCalls}회)
```

Cost calculation failure does not automatically make Runtime Request invalid.
If cost approval is required, Runtime may wait for approval or be blocked by
policy.

## 18. Error Model

Use normalized safe failure codes, grouped by namespace:

- `RUNTIME_*`
- `STEP_*`
- `PROVIDER_*`
- `MCP_*`
- `CONNECTION_*`
- `CREDENTIAL_*`
- `APPROVAL_*`
- `POLICY_*`
- `COST_*`

Errors must not include tokens, secrets, full endpoints, raw payloads, stack
traces, private data, prompts, or external response bodies.

## 19. Persistence Boundaries

Do not implement persistence in this task. Future persistence should separate:

Public / general store:

- runtime references
- status
- safe summaries
- checksums
- evidence references
- cost estimates
- actual usage summaries

Private / secure data store:

- private inputs
- provider prompt contents
- private provider outputs
- MCP private inputs/results
- user files
- sensitive business data

Secret store:

- API Keys
- OAuth tokens
- refresh tokens
- private keys
- client secrets

## 20. Deferred Decisions

Deferred items requiring future Decision Lock:

- exact RuntimeExecutionId algorithm;
- parallel Step v1 scope;
- exact approval scope enum expansion;
- Credential vault vendor;
- OAuth provider implementations;
- MCP transport support list;
- actual billing provider integration;
- encrypted private payload store;
- legal retention periods;
- organization-wide reusable approval;
- Marketplace runtime policy;
- compensation automation.

## 21. Implementation Order

Recommended implementation sequence:

1. `RUNTIME-EXECUTION-START-001` — Runtime Preflight / Start Contract
2. `RUNTIME-STEP-CONTRACT-001` — Runtime Step / Attempt Contract
3. `RUNTIME-APPROVAL-REVALIDATION-001` — Approval Revalidation Contract
4. `CONNECTION-CREDENTIAL-CONTRACT-001` — Connection / Credential Reference
   Contracts
5. `PROVIDER-INVOCATION-CONTRACT-001` — Provider Invocation Contract
6. `MCP-SERVER-TOOL-SNAPSHOT-001` — MCP Registration / Discovery / Snapshot
   Contracts
7. `MCP-INVOCATION-CONTRACT-001` — MCP Invocation Contract
8. `RUNTIME-RESULT-001` — Runtime Execution Result
9. `RUNTIME-EVIDENCE-BUNDLE-001`
10. `RUNTIME-EVIDENCE-REPORT-001`
11. `MOCK-RUNTIME-EXECUTION-001`
12. `READ-ONLY-MCP-PILOT-001`

The next single recommended task is:

```text
RUNTIME-EXECUTION-START-001
Runtime Preflight / Start Contract
```

## 22. QA Implications

QA status updates:

- Runtime/MCP Boundary Design: `COMPLETE`
- Runtime Execution Start: `NOT_STARTED`
- Runtime Preflight: `NOT_STARTED`
- Runtime Step Contract: `DESIGN_DEFINED`
- Runtime Step Attempt: `DESIGN_DEFINED`
- Provider Invocation Contract: `DESIGN_DEFINED`
- Provider Invocation Implementation: `NOT_STARTED`
- MCP Server Registration Contract: `DESIGN_DEFINED`
- MCP Tool Snapshot Contract: `DESIGN_DEFINED`
- MCP Invocation Contract: `DESIGN_DEFINED`
- MCP Implementation: `NOT_STARTED`
- Connection Contract: `DESIGN_DEFINED`
- Credential Reference Contract: `DESIGN_DEFINED`
- Credential Storage: `NOT_STARTED`
- OAuth: `NOT_STARTED`
- Approval Revalidation: `DESIGN_DEFINED`
- Retry Policy: `DESIGN_DEFINED`
- Cancellation Policy: `DESIGN_DEFINED`
- Idempotency Policy: `DESIGN_DEFINED`
- Cost Simulation Binding: `DESIGN_DEFINED`
- Cost Simulation Engine: `NOT_STARTED`
- Package Readiness: `CONDITIONALLY_READY`

Design Lock verdict:

```text
DESIGN_LOCK_APPROVED_WITH_OPEN_DECISIONS
```

