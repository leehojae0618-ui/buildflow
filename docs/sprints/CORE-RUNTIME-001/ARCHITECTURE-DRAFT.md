# CORE-RUNTIME-001 — Architecture Draft

Status: PHASE 2 — READY FOR DOCUMENTATION
Date: 2026-07-26
Purpose: Define the minimum Core Runtime architecture and the Phase 2 scope-freeze candidate. This document creates no code, dependency, deployment, or activation authority.

## Phase 2 scope-freeze candidate

The candidate implementation is a synchronous, single-provider, single-step Runtime path. It reuses the current OpenAI SDK and Zod installation, existing Runtime Request/Start/Step/Result contracts, and the existing server-only OpenAI client. It does not change any existing contract until an implementation Sprint is separately approved.

### Locked decisions

- Exactly one `PROVIDER` Runtime Step is permitted in `RuntimePlan v1`; its sequence is `1`.
- The only provider is `openai`; the model is copied from one validated required `MODEL` block in the supplied Agent Definition.
- The provider operation is a bounded, non-streaming text response. Tool calls, JSON/schema mode, prompt rewriting, multi-model fallback and streaming are excluded.
- Plan input uses Blueprint/Agent identifiers, versions and checksums plus prompt/input references. The prompt/input body is transient adapter input, is rejected when secret-shaped, and is never persisted in a Runtime plan/result/evidence record.
- The Runtime Core depends only on a BuildFlow provider port. The OpenAI SDK remains inside an OpenAI adapter.
- Execution has one initial attempt only. No retry, resume, queue, scheduling, dynamic branch, parallel step, multi-agent, MCP, or approval step is implemented.
- Evidence is created as a safe, append-only in-memory record through a new interface. No database table, schema migration, Supabase write or production durability claim is included.
- A provider response is not a Runtime success until Step, Evidence and final Result construction all validate.
- Real OpenAI requests are excluded from automated tests and require a separately approved smoke-test task.

### Persistence decision

`Persistence v1 = new persistence interface only, backed by an in-memory implementation for the minimum Runtime slice.`

The in-memory sink exists to prove evidence/result linkage and failure handling in deterministic tests. It is not durable persistence and must be represented by the existing `NO_PERSISTENCE_ATTESTATION` limitation where relevant. A database schema is not designed or migrated in this Phase.

### Open decisions retained for a later approval

1. Durable execution/evidence repository location and retention policy.
2. The approved source and authorization process for resolving prompt/input references in a production invocation.
3. Structured-output schema support and user-visible output delivery.
4. Retry/cancellation after invocation, idempotency lease ownership, and queue selection.
5. MCP runtime gateway, transport connection lifecycle and tool invocation.

## Phase 3 contract hardening record

### Reused state machine

No parallel Runtime status model was introduced. The skeleton reuses the existing contracts:

```text
Runtime Start: READY
Step:          READY → RUNNING → SUCCESS | FAILED | TIMEOUT | CANCELLED
Attempt:       READY → RUNNING → SUCCESS | FAILED | TIMEOUT | CANCELLED
Result:        SUCCEEDED | FAILED | TIMED_OUT | CANCELLED | BLOCKED | INVALID
```

`WAITING` is used only for a pre-execution Provider configuration block. A failed final Result construction is represented by the orchestrator's safe `FINALIZATION_FAILED` envelope; it does not fabricate a valid `RuntimeExecutionResult`.

### Stable error namespaces

| Namespace | Implemented codes / responsibility |
| --- | --- |
| Request | `RUNTIME_REQUEST_INVALID` |
| Plan | `RUNTIME_PLAN_*` validation codes and `RUNTIME_PLAN_INVALID` orchestration outcome |
| Provider | `PROVIDER_CONFIGURATION_MISSING`, `PROVIDER_AUTHENTICATION_FAILED`, `PROVIDER_TIMEOUT`, `PROVIDER_RATE_LIMITED`, `PROVIDER_EMPTY_RESPONSE`, `PROVIDER_OUTPUT_INVALID`, `PROVIDER_CANCELLED`, `PROVIDER_REQUEST_FAILED` |
| Step | `RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED` |
| Evidence | `RUNTIME_EVIDENCE_*` record failures and `RUNTIME_EVIDENCE_CONSTRUCTION_FAILED` orchestration outcome |
| Result | `RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED` |

These codes are safe identifiers only. Raw SDK error messages, stack traces, prompt/input bodies, raw output and credentials are excluded.

### Runtime events

The orchestrator returns immutable, in-process event facts; it does not add an Event Bus or dependency.

```text
PLAN_ACCEPTED
RUNTIME_STARTED
PROVIDER_INVOCATION_STARTED
PROVIDER_INVOCATION_COMPLETED | PROVIDER_INVOCATION_FAILED
STEP_COMPLETED | STEP_FAILED
EVIDENCE_APPENDED
RUNTIME_COMPLETED | RUNTIME_FAILED
```

Events contain plan/execution/step/attempt IDs, timestamp and safe code only. They are not persistence, telemetry export, or a user-facing event stream.

### Version fields

- Existing `formatVersion` remains the schema-version boundary for Request, Start, Step, Result, Provider and Evidence records.
- New `RuntimePlan` adds `runtimeVersion = "1.0.0"` because no equivalent executable-plan runtime version existed.
- No duplicate `schemaVersion` field was added.

## Design goals

1. Execute an approved, versioned plan—not an unbounded Blueprint prompt.
2. Preserve existing Runtime Request, Start, Step and Result contracts.
3. Keep domain policy independent of OpenAI, MCP transports, databases and React.
4. Keep credentials reference-only outside the Domain Core.
5. Create evidence references for every terminal step/attempt without retaining raw secret-bearing payloads.
6. Make idempotency, retries and cancellation explicit adapter/runtime policies.

## Proposed layers

```text
┌────────────────────────────────────────────────────────────┐
│ Product / application layer                                 │
│ Project actions, UI, approval and authorization boundaries  │
└──────────────────────────────┬─────────────────────────────┘
                               │ validated commands / views
┌──────────────────────────────▼─────────────────────────────┐
│ Runtime application layer                                   │
│ RuntimeOrchestrator · Plan loader · Preflight coordinator   │
│ Step/attempt lifecycle · Result assembler                   │
└───────────────┬───────────────────────────┬────────────────┘
                │                           │
┌───────────────▼──────────────┐ ┌──────────▼────────────────┐
│ Domain Core (pure)            │ │ Ports (interfaces)        │
│ RuntimePlan                   │ │ ProviderAdapter           │
│ Step/attempt transitions      │ │ McpAdapter                │
│ Retry/idempotency policy      │ │ CredentialReferenceResolver│
│ Evidence intent               │ │ ExecutionRepository       │
│ Result/evidence validation    │ │ EvidenceWriter            │
└──────────────────────────────┘ └──────────┬────────────────┘
                                             │
┌────────────────────────────────────────────▼───────────────┐
│ Adapters / infrastructure                                   │
│ OpenAI SDK · Official MCP SDK (later) · Supabase · tracing  │
└────────────────────────────────────────────────────────────┘
```

## Domain Core

The Core must contain deterministic state and policy only. It must not import React, Supabase, the OpenAI SDK, MCP SDK, environment variables, or provider credentials.

### Proposed core objects

| Object | Responsibility | Notes |
| --- | --- | --- |
| `RuntimePlan` | Immutable, versioned executable projection of an approved Blueprint/Agent definition. | Missing today; required before actual invocation. |
| `RuntimePlanStep` | Immutable action intent, adapter target, input references, tool snapshot binding, policy and retry class. | Must not contain raw secret values. |
| `ExecutionCommand` | Validated request to execute a plan/step/attempt. | Binds plan, actor, execution identity and idempotency key. |
| `ExecutionState` | Lifecycle projection for execution, step and attempt. | Reuse existing Step/Result contracts rather than create parallel statuses. |
| `AdapterOutcome` | Normalized success/failure/cancellation output from Provider or MCP adapters. | Provider/MCP payloads remain adapter-local; Core receives safe structured fields. |
| `EvidenceIntent` | What must be recorded for a terminal outcome. | Evidence references, checksums, policy/plan/step identifiers; no raw credentials. |

### Plan invariants

- A Runtime Plan is derived from a specific approved Blueprint/Agent definition version.
- It is immutable after execution begins; a changed Blueprint requires a new plan version.
- Every plan step carries an adapter kind (`provider` or `mcp`), policy version and tool/configuration snapshot reference.
- A step attempt is linked to one predecessor/attempt lifecycle through the existing Runtime Step rules.
- `READY_FOR_BUILD` or plan existence never independently starts a provider/MCP call; preflight and approval boundaries still decide whether invocation is allowed.

## Runtime interfaces (ports)

The following are interface shapes, not approved production APIs.

```ts
interface ProviderAdapter {
  readonly kind: 'provider'
  execute(command: ProviderExecutionCommand): Promise<AdapterOutcome>
}

interface McpAdapter {
  readonly kind: 'mcp'
  invoke(command: McpInvocationCommand): Promise<AdapterOutcome>
}

interface CredentialReferenceResolver {
  resolve(reference: CredentialReference, context: AdapterContext): Promise<ResolvedCredential>
}

interface ExecutionRepository {
  createExecution(input: ExecutionRecordInput): Promise<ExecutionRecord>
  appendStepAttempt(input: StepAttemptRecordInput): Promise<StepAttemptRecord>
  readCurrentExecution(input: ExecutionIdentity): Promise<ExecutionRecord | null>
}

interface EvidenceWriter {
  append(input: EvidenceIntent): Promise<EvidenceReference>
}
```

`ResolvedCredential` is adapter-local and must never flow into Runtime Result, evidence records, logs, UI payloads, or persisted plan data.

## Execution sequence

```text
Approved Blueprint + Agent Definition
        ↓ compile (deterministic, versioned)
RuntimePlan
        ↓ validate/load references
RuntimeExecutionRequest
        ↓ existing preflight/start readiness checks
RuntimeExecutionStart
        ↓ append execution + initial step/attempt record
RuntimeOrchestrator
        ↓ adapter command (provider or MCP only)
AdapterOutcome
        ↓ append terminal evidence reference + step attempt result
RuntimeExecutionResult
```

### Required execution behavior

1. Validate a plan, agent definition, tool snapshot and policy version before any adapter call.
2. Resolve credential references only at the adapter boundary.
3. Create an execution/attempt record before the external operation if idempotency or cancellation is supported.
4. Normalize provider/MCP outputs to `AdapterOutcome`; do not leak raw SDK objects.
5. Write an evidence reference for every terminal outcome, including safe failure/cancellation evidence.
6. Assemble the existing `RuntimeExecutionResult` only after terminal state and evidence validation.
7. Apply retry only when the step and adapter operation are explicitly retryable; prohibit automatic retry for non-idempotent MCP calls.

## Provider and MCP boundary

| Boundary | Provider adapter | MCP adapter |
| --- | --- | --- |
| First implementation timing | First executable slice candidate | Follow-on, after provider runtime is proven |
| Input | Normalized model request + reference-only context | Tool invocation bound to MCP tool snapshot and permissions |
| Credential access | Adapter-local resolved reference | Adapter-local resolved reference |
| Retry | Explicit policy, provider outcome/idempotency dependent | Never automatic for non-idempotent tools |
| Output | Normalized safe outcome/evidence metadata | Normalized safe outcome/evidence metadata |
| Raw payload storage | Prohibited by default | Prohibited by default |

The documented `src/features/mcp` policy contracts remain authoritative for trust, permissions, health, idempotency, retry and raw-payload restrictions. A future MCP SDK is an infrastructure implementation detail, not the policy owner.

## Phase 3 skeleton integration status

`createOpenAIRuntimeProviderAdapter()` is an intentionally unintegrated skeleton export.
It remains unused by a product execution path until a separately approved API or external
smoke-test integration scope connects the Runtime composition root. This preserves the
Phase 3 prohibition on real OpenAI calls while keeping the SDK isolated behind the
Provider port.

## Evidence boundary

Runtime evidence is product evidence, not merely observability telemetry.

Minimum evidence record fields to decide in a later contract Sprint:

- execution, plan, step and attempt identifiers;
- timestamp and terminal status;
- adapter kind and safe provider/MCP reference;
- policy, tool snapshot and plan checksums/versions;
- normalized outcome class and safe error code;
- evidence checksum and retention classification.

Explicit exclusions:

- raw credentials, access tokens and secrets;
- unrestricted provider prompts/responses when they may contain sensitive project data;
- raw MCP payloads;
- stack traces in user-facing or general evidence records.

OpenTelemetry or an AI observability product may later supplement operational traces; neither replaces the authoritative Runtime evidence record.

## Persistence boundary

The Core Runtime needs append-only execution, step/attempt and evidence-reference persistence before claiming reliable execution. Existing project persistence and Clarification revision persistence demonstrate useful patterns, but they do not automatically define this data model.

Recommended first persistence semantics:

- create execution with immutable plan/version binding;
- append state transitions and attempts rather than update history destructively;
- use a conditional current-state/version check to reject stale transitions;
- retain historical evidence references even when a later attempt supersedes an earlier one;
- make retention and raw-payload decisions explicit rather than inheriting provider defaults.

## Retry and queue boundary

The first Runtime slice should be synchronous and single-step. Do not introduce a durable queue before persistence, idempotency and cancellation contracts have been accepted.

Future retry tiers:

1. no retry: invalid input, policy rejection, non-idempotent MCP tool;
2. explicitly retryable inline: transient provider failure with stable idempotency semantics;
3. durable retry: only after an append-only execution repository and cancellation/ownership model exist.

## Recommended implementation sequence

| Candidate follow-on | Scope | Why it precedes the next item |
| --- | --- | --- |
| CORE-RUNTIME-002 — Plan and execution contracts | `RuntimePlan`, compiler input, adapter ports, evidence record contract, deterministic tests. No external call. | Establishes immutable executable intent and prevents SDK-led architecture. |
| CORE-RUNTIME-003 — Single-provider runtime slice | One OpenAI-backed provider adapter, one step/attempt, safe outcome normalization, append-only persistence/evidence references, integration tests. | Proves the real execution path with the fewest external variables. |
| CORE-RUNTIME-004 — Runtime recovery | Explicit retry/cancellation/idempotency policies and selected queue decision, if justified. | Requires proven state/evidence boundaries. |
| MCP-RUNTIME-001 — MCP gateway/invocation | Official MCP SDK evaluation/adoption, trusted tool snapshot invocation, permissions, non-idempotent retry constraints, evidence. | Must not overtake provider/runtime lifecycle validation. |

## Explicitly out of scope for the first Core Runtime slice

- autonomous provisioning or deployment;
- visual Runtime progress redesign;
- multi-provider routing or a general agent framework;
- MCP execution before a dedicated gateway scope;
- streaming and conversational agent UX;
- background queues, scheduler and durable retry workers;
- changing Clarification, Approval, Blueprint selection or Build Planner semantics;
- raw-payload retention, external analytics, billing, marketplace, API expansion or UI redesign.

## Open decisions for a later scope freeze

1. Does a Runtime Plan compile from `AgentBlueprint`, `AgentDefinition`, or an explicitly approved combination of both?
2. What is the first provider operation: structured output, a bounded text/model completion, or a tool-capable request?
3. Where do append-only execution/evidence records live, and what retention classifications apply?
4. What first-slice failure classes map to retryable, terminal, cancelled and policy-blocked states?
5. What approval state is required immediately before an actual external call?

## Development Charter compliance

| Criterion | Draft response |
| --- | --- |
| Product Vision | Makes BuildFlow's decision/approval artifacts the source of executable intent. |
| Scope Discipline | Separates Core Runtime from legacy provisioning, MCP invocation, queues and UI expansion. |
| OSS First | Places official SDKs behind explicit ports; avoids premature framework adoption. |
| Reuse Before Rewrite | Preserves existing Runtime contracts, agent validators, MCP policies, evidence references, Zod and OpenAI client. |
| Browser-visible Milestone | Defers product-visible execution UX until execution behavior is safe and auditable. |
| Closed Beta Alignment | Requires reference-only credentials, append-only histories, evidence references and explicit retry policy. |
