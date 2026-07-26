# CORE-RUNTIME-001 — Phase 2 Implementation Scope

Status: READY FOR DOCUMENTATION — SCOPE-FREEZE CANDIDATE
Code authority: Not granted
Date: 2026-07-26

## Purpose

This document freezes the proposed minimum Runtime implementation boundary derived from Phase 1. It defines one synchronous OpenAI-backed provider step behind a BuildFlow provider interface. It is not an implementation approval and must not be used to modify source code, dependencies, database schema, environment configuration, or deployment state.

## Golden path

```text
RuntimeExecutionRequest
  → RuntimePlan v1
  → RuntimePreflightResult / RuntimeExecutionStart
  → RuntimeExecutionStep
  → RuntimeExecutionStepAttempt
  → ProviderAdapter (OpenAI implementation)
  → Runtime Step Result projection
  → Runtime Evidence Record
  → RuntimeExecutionResult
```

| Stage | Input | Output | Owner module | Validation | Normal state transition | Failure transition | Evidence | Persistence v1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Request | Existing approval gate, actor, artifact/capability references | Existing `RuntimeExecutionRequest` | Existing `runtime-execution-request.ts` | Existing checksum, approval, secret-safety and reference validation | Valid request is eligible for plan binding | Invalid request → no plan or provider call | Safe validation reference only | None |
| Plan | Valid request; validated Blueprint/Agent references; transient provider input | New `RuntimePlan` with exactly one Provider step | Proposed `runtime-plan.ts` | One required OpenAI model block; checksums; one step; no MCP/tool/retry/branching; secret-safe transient input | Valid plan → preflight/start | Invalid plan → `INVALID`, no provider call | Plan-validation reference | None |
| Start | Existing request, existing preflight result, execution intent/sequence | Existing `RuntimeExecutionStart` | Existing `runtime-execution-start.ts` | Existing ready preflight, approval and binding validation | `READY` execution start → `READY` step/attempt | Cancelled or non-ready preflight → no provider call | Blocking/cancellation/validation reference | None |
| Step | Valid plan + execution start + generated IDs | Existing `RuntimeExecutionStep`, status `READY` then `RUNNING` | New `runtime-orchestrator.ts`, existing `runtime-execution-step.ts` | Existing step transition/identifier/reference validation | `READY → RUNNING → SUCCESS` | `READY → WAITING` for pre-invocation block; `RUNNING → FAILED` or `TIMEOUT` after adapter outcome | Step/attempt evidence reference | None |
| Attempt | Step + generated attempt ID + initial attempt number `1` | Existing `RuntimeExecutionStepAttempt` | New `runtime-orchestrator.ts`, existing Step contract | Positive safe integer, initial attempt has no predecessor, transition validation | `READY → RUNNING → SUCCESS` | `RUNNING → FAILED`, `TIMEOUT`, or `CANCELLED` | Attempt evidence, usage reference where safe | None |
| Provider adapter | Normalized command with model, transient content, timeout/abort signal | `ProviderInvocationResult` | Proposed `runtime-provider.ts`; OpenAI adapter in `src/services/openai/` | Model present; no secret-shaped values in returned safe fields; timeout bounds | Adapter success is eligible for Step projection | Normalized provider error; no retry in v1 | Provider invocation metadata only | None |
| Step result projection | Adapter outcome + valid Step/Attempt | Terminal Step/Attempt with safe references | New `runtime-orchestrator.ts` | Existing Step/Attempt construction checks | Both terminal `SUCCESS` | Failed/timeout/cancelled terminal attempt/step | Evidence write requested | In-memory evidence record |
| Evidence | Plan/start/step/attempt IDs; safe checksums/status/usage/latency | `RuntimeEvidenceRecord` and reference | Proposed `runtime-evidence.ts` | Required linkage, checksum format, no secrets/raw body/stack | Evidence reference linked to terminal outcome | Evidence build/write failure fails Runtime even after provider success | The record itself | In-memory append-only only |
| Result | Existing request/preflight/start plus terminal references | Existing `RuntimeExecutionResult` | New `runtime-orchestrator.ts`, existing `runtime-execution-result.ts` | Existing result status/reference/checksum validation | `SUCCEEDED` only when all prior stages validate | `FAILED`, `TIMED_OUT`, `CANCELLED`, `BLOCKED`, `INVALID`, or safe finalization envelope if result cannot be built | Result references evidence | None |

## Runtime Plan v1

### Required inputs

| Input | Source | v1 treatment |
| --- | --- | --- |
| Blueprint reference | `AgentBlueprint.id`, `version`, integrity checksum supplied by the caller | Identifies the approved design; no full mutable Blueprint is persisted in the plan. |
| Agent Definition reference | `AgentDefinition.id`, `blueprintId`, `blueprintVersion`, integrity checksum | Must be independently validated and match the Blueprint reference. |
| Provider/model | One required `MODEL` block from the validated Agent Definition | Must be `openai`; model string must be present and selected deterministically. |
| Prompt reference | Required `PROMPT` block `promptRef` | Core stores the reference/checksum only. Resolution to text occurs outside Core and is not automatic rewriting. |
| Input artifact reference | Existing `RuntimeExecutionRequest.inputArtifactReferences` plus one selected reference | The provider receives a transient, prevalidated body; Runtime stores only its checksum/reference. |
| Execution bindings | Existing request, preflight and start contracts | Existing approval, policy, actor and evidence bindings remain authoritative. |

`AgentBlueprint.requiredProviders` remains package-level capability context in v1. It does not expand this plan into Supabase, GitHub, Vercel, MCP, or other provider invocations. The one executable Provider step is selected only from the validated `MODEL` block.

### Plan shape and restrictions

```text
RuntimePlan v1
- immutable plan ID, version and checksum
- one RuntimePlanStep
- sequence = 1
- invocation boundary = PROVIDER
- provider = openai
- model = validated MODEL block value
- prompt/input = reference + safe checksum, never persisted raw body
- retry policy = RETRY_DENIED
- tool/MCP configuration = absent
```

Step and Attempt IDs are generated by an injected Runtime identity factory immediately after a valid Runtime Start exists and before an adapter call. The factory is an application dependency, not `Date.now()`/randomness inside pure validation functions. The initial attempt has `attemptNumber = 1` and no predecessor.

### Plan validation failure

An invalid Plan produces a safe `RUNTIME_PLAN_INVALID` error envelope, creates no provider command, and results in no Step/Attempt. Its final Runtime projection is `INVALID` when the existing Result contract can be constructed; otherwise the orchestrator returns a safe finalization envelope without fabricating a `RuntimeExecutionResult`.

## Orchestrator scope

### In scope

- validate Request, Plan and preflight/start bindings;
- create IDs through injected collaborators;
- construct and transition one Step and one Attempt;
- call one `ProviderAdapter`;
- normalize adapter outcomes into safe Runtime failure/status projections;
- request evidence creation and assemble the existing Runtime Result;
- fail closed if Step, Evidence or Result construction fails.

### Out of scope

- OpenAI SDK calls or SDK response types;
- raw credential or prompt storage;
- React/UI state;
- prompt generation, automatic rewriting or content enrichment;
- tool execution, MCP, approval state changes, queues/workers, billing, provider fallback, retry execution, resume, scheduling or multi-agent routing.

## Provider adapter contract

```ts
// Proposed interface names; no source API is created in Phase 2.
type ProviderExecutionCommand = {
  provider: 'openai'
  model: string
  promptReference: { referenceId: string; integrityChecksum: string }
  inputReference: { referenceId: string; integrityChecksum: string }
  transientInput: { systemInstruction: string; userInput: string }
  timeoutMs: number
  signal?: AbortSignal
  executionIds: { runtimeExecutionId: string; runtimeStepId: string; runtimeStepAttemptId: string }
}

type ProviderInvocationResult =
  | { status: 'SUCCEEDED'; outputChecksum: string; outputReference: string; usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number }; latencyMs: number; providerRequestReference: string }
  | { status: 'FAILED'; errorCode: ProviderErrorCode; retryEligible: false; latencyMs: number; providerRequestReference?: string }
  | { status: 'TIMED_OUT'; errorCode: 'PROVIDER_TIMEOUT'; retryEligible: false; latencyMs: number; providerRequestReference?: string }
  | { status: 'CANCELLED'; errorCode: 'PROVIDER_CANCELLED'; retryEligible: false; latencyMs: number; providerRequestReference?: string }

interface ProviderAdapter {
  execute(command: ProviderExecutionCommand): Promise<ProviderInvocationResult>
}
```

The OpenAI adapter imports the existing server-only `createOpenAIClient()` and owns conversion from SDK-specific exceptions/responses to this contract. It must use the existing 12-second SDK timeout unless a later scope explicitly changes the boundary. It accepts an `AbortSignal` in the BuildFlow interface; whether the installed SDK operation supports signal forwarding must be verified in implementation without broadening the public Runtime contract.

Safe metadata is limited to provider name, model, safe request reference, timing, token usage facts and checksums. It excludes API keys, authorization headers, raw prompt/input/output, raw SDK payloads, stack traces and unredacted provider error messages.

## Result and evidence distinction

| Record | Success means | Failure means | Required references | Persisted in v1 |
| --- | --- | --- | --- | --- |
| Provider Invocation Result | Provider returned a non-empty, normalized safe output | Auth/rate-limit/timeout/empty/malformed or unknown provider outcome | Provider request reference when available; safe output checksum | No raw result; safe data flows in memory |
| Runtime Step/Attempt Result | Existing Step and Attempt contracts validate with terminal status and required references | Transition/construction failure or normalized provider outcome failure | Execution/step/attempt IDs and evidence/output/error refs | No |
| Runtime Evidence Record | Required safe linkage/checksums/status are constructed | Missing link, invalid checksum, secret detection or sink failure | Plan/start/step/attempt/result linkage; safe usage/latency/error facts | Yes, in-memory append-only only |
| Runtime Execution Result | Existing final Result contract validates after evidence is linked | A provider success without valid Step/Evidence/Result is a Runtime failure | Existing request/preflight/start refs plus terminal refs | No |

`safeInputChecksum` is calculated from the transient input before invocation and `safeOutputChecksum` from the normalized output before evidence creation. The unhashed values are not included in evidence or Runtime Result. Provider usage and latency are facts only; neither establishes Runtime success.

## State and failure transitions

| Case | Runtime result status | Step status | Attempt status | Error namespace | Evidence | Retry v1 | User-safe message |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Invalid Runtime request | `INVALID` if constructible | None | None | `RUNTIME_REQUEST_INVALID` | Validation reference | No | “The runtime request could not be validated.” |
| Invalid Runtime plan | `INVALID` if constructible | None | None | `RUNTIME_PLAN_INVALID` | Plan validation reference | No | “The runtime plan is invalid.” |
| Missing provider configuration | `BLOCKED` | `WAITING` if Step exists | `READY` if Attempt exists | `PROVIDER_CONFIGURATION_MISSING` | Blocking reference | No | “Provider configuration is required before execution.” |
| Cancellation before invocation | `CANCELLED` | `CANCELLED` if created | `CANCELLED` if created | `RUNTIME_CANCELLED_BEFORE_INVOCATION` | Cancellation reference | No | “Execution was cancelled before the provider was called.” |
| Provider authentication failure | `FAILED` | `FAILED` | `FAILED` | `PROVIDER_AUTHENTICATION_FAILED` | Safe provider failure evidence | No | “The provider could not authenticate this execution.” |
| Provider timeout | `TIMED_OUT` | `TIMEOUT` | `TIMEOUT` | `PROVIDER_TIMEOUT` | Safe timeout evidence | No | “The provider did not respond before the timeout.” |
| Provider rate limit | `FAILED` | `FAILED` | `FAILED` | `PROVIDER_RATE_LIMITED` | Safe provider failure evidence | No | “The provider is temporarily rate limited.” |
| Empty provider response | `FAILED` | `FAILED` | `FAILED` | `PROVIDER_EMPTY_RESPONSE` | Safe provider failure evidence | No | “The provider returned no usable response.” |
| Malformed structured output | `FAILED` | `FAILED` | `FAILED` | `PROVIDER_OUTPUT_INVALID` | Safe validation/failure evidence | No | “The provider response could not be validated.” |
| Step result construction failure | `INVALID` if constructible | No fabricated terminal Step | No fabricated terminal Attempt | `RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED` | Best-effort safe construction reference | No | “The runtime could not finalize the step.” |
| Evidence construction/write failure | `FAILED` | `FAILED` | `FAILED` | `RUNTIME_EVIDENCE_CONSTRUCTION_FAILED` | Best-effort safe failure reference only | No | “Execution evidence could not be recorded.” |
| Final result construction failure | No fabricated result object | Terminal Step/Attempt retained only if valid | Terminal Attempt retained only if valid | `RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED` | Existing evidence preserved | No | “The runtime could not finalize the execution result.” |

No v1 case is retry-eligible. This is intentional: retry needs explicit idempotency, evidence and cancellation semantics beyond the frozen single-attempt scope.

## Scope in

- New pure Runtime Plan, Provider port, Evidence record, in-memory Evidence sink and Runtime Orchestrator contracts.
- One OpenAI adapter that normalizes a bounded, non-streaming provider request/response using the existing SDK/client.
- Existing Runtime Request/Preflight/Start/Step/Attempt/Result builders and validators used as authoritative contracts.
- Injected fake provider, identity factory, clock and evidence sink for deterministic tests.
- Focused tests and regressions defined in `TEST-PLAN.md`.

## Scope out

- Dynamic branching, parallel/multiple steps, multi-agent execution, MCP, tool calls, approval steps, retry/resume, queueing/scheduling, provider fallback and streaming.
- Database migration, Supabase runtime writes, production durability, API/UI changes, environment changes and package changes.
- Prompt generation/rewrite, build planning, Clarification changes, autonomous provisioning, billing, analytics/tracing product integration and real OpenAI requests.

## Rollback plan

The proposed implementation must be additive. It adds new modules and exports without changing current Request/Start/Step/Result behavior. Rollback is removal/revert of the new Runtime modules and exports; no migration, stored data, package or environment rollback is required. No existing product flow must call the new orchestrator until a separate integration approval exists.

## Development Charter compliance

- **Product Vision:** converts approved agent artifacts into bounded executable intent.
- **Scope Discipline:** one provider, one step, one attempt; no UI/MCP/queue scope.
- **OSS First / Reuse Before Rewrite:** reuses installed OpenAI SDK, Zod and existing Runtime contracts.
- **Browser-visible Milestone:** intentionally absent; this is a safe Core boundary before user-facing execution.
- **Closed Beta Alignment:** secret-safe, evidence-first, provider-isolated, no silent retries.
