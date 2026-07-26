# CORE-RUNTIME-002 Assessment

## Status

`DRAFT — ASSESSMENT ONLY`

This document defines the minimum safe scope for a future OpenAI smoke test of the runtime frozen in `CORE-RUNTIME-001`. It does not authorize implementation, a network request, environment changes, a commit, a push, or a deployment.

## Assessment baseline

- Runtime baseline commit: `6060a679d635a8048626d120b23bc347606ca9e8`
- Runtime shape: one provider, one step, one initial attempt, no retry
- Provider: OpenAI Responses API through a server-only adapter
- Evidence: append-only, in-memory only
- Product integration: intentionally not connected to a UI, API route, persistence layer, or autonomous flow

## 1. Actual OpenAI adapter connection point

The production-facing adapter factory is:

`src/services/openai/runtime-provider-adapter.ts`

`createOpenAIRuntimeProviderAdapter()` returns the `ProviderAdapter` port consumed by the runtime. It is intentionally not composed into an application route or existing autonomous flow. This preserves the `CORE-RUNTIME-001` boundary: the runtime core depends only on the provider port, while the OpenAI SDK remains isolated in the service adapter.

The current call chain, once a future smoke harness explicitly composes it, is:

```text
RuntimeExecutionRequest
  → createRuntimePlan
  → executeMinimumRuntime
  → ProviderAdapter.execute
  → OpenAI Runtime Provider Adapter
  → OpenAI Responses API
  → safe ProviderInvocationResult
  → append-only in-memory Evidence
  → RuntimeExecutionResult
```

There is no existing product endpoint that invokes this chain. A smoke test can prove the adapter path; it must not be described as product-path integration until a separately approved composition surface exists.

## 2. Environment contract

Environment parsing is centralized in `src/lib/env/server.ts` and client construction is in `src/services/openai/client.ts`.

| Variable | Current role | Smoke-test handling |
| --- | --- | --- |
| `OPENAI_API_KEY` | Required by `requireOpenAIEnv()` to construct the OpenAI client | Presence may be checked; its value must never be read into a report, test fixture, Runtime record, evidence, or terminal output. |
| `OPENAI_MODEL` | Model selection, defaulted by the server environment schema | The smoke run must record only the already validated model identifier from the Runtime Plan. |

The OpenAI JavaScript SDK can use `OPENAI_API_KEY` from the environment; BuildFlow nevertheless keeps validation in its server-only environment boundary. The current task does not inspect, create, alter, or print either variable. See the [OpenAI API quickstart](https://developers.openai.com/api/docs/quickstart).

## 3. Current provider invocation path

The adapter calls `client.responses.create()` once with:

- the plan-selected model;
- a system and user input derived from transient, validated runtime input;
- no `stream: true` flag, so the request is non-streaming;
- a received `AbortSignal`, when one is supplied by the caller.

`src/services/openai/client.ts` currently constructs the SDK client with a `12_000 ms` timeout and `maxRetries: 0`. The orchestrator also passes the bounded `12_000 ms` command timeout through the provider port. The adapter does not currently set a separate per-request timeout value; the SDK client boundary is the effective live timeout boundary.

## 4. Existing failure handling

| Failure class | Adapter/runtime normalized outcome | Live smoke-test policy |
| --- | --- | --- |
| Missing configuration | `PROVIDER_CONFIGURATION_MISSING`, no provider call | Deterministic local test only; no live request. |
| Authentication failure | `PROVIDER_AUTHENTICATION_FAILED` | Mock only; never intentionally use an invalid credential. |
| Timeout / cancellation | `PROVIDER_TIMEOUT` or `PROVIDER_CANCELLED` | Mock/AbortSignal test only; do not deliberately consume a slow endpoint. |
| Rate limit | `PROVIDER_RATE_LIMITED` | Mock only; do not deliberately trigger rate limiting. |
| Empty or malformed provider response | `PROVIDER_EMPTY_RESPONSE` or `PROVIDER_OUTPUT_INVALID` | Mock only; a live response cannot be forced deterministically. |
| Other provider exception | `PROVIDER_REQUEST_FAILED` | Mock only. |

The existing orchestrator closes the Attempt, Step, and Runtime as failed when appropriate, appends safe evidence, emits the corresponding event, and returns a safe final result. It does not retry.

## 5. Evidence and final result

`src/features/agents/runtime-evidence.ts` supplies an append-only in-memory evidence sink. Evidence records and Runtime results retain safe references, checksums, statuses, timing, token facts, and normalized error codes. They must not retain raw prompt text, raw model output, credential values, SDK response objects, stack traces, or secret-shaped values.

A future live smoke run may inspect only:

- final Runtime status and normalized error code;
- event types and ordering;
- evidence count, linkage, and safe record fields;
- result/step/attempt identifiers and safe checksums;
- model identifier, latency, and usage facts when supplied by the adapter.

It must not print the model response, request inputs, SDK object, or environment-derived credentials.

## 6. Existing tests that can be reused

| Area | Existing reusable coverage | Live smoke gap |
| --- | --- | --- |
| Orchestrator | Valid execution, invalid request/plan, failure finalization, state transitions, linkage, no retry | One real adapter invocation composed through the orchestrator. |
| Provider validation | Unknown/malformed envelopes, safe normalization, no uncaught exception | None; malformed live output is not a deterministic live test. |
| OpenAI adapter | Injected SDK success, empty response, AbortSignal forwarding, configuration block, auth/timeout/rate/unknown error normalization, SDK payload isolation | A real SDK client invocation with a real non-streaming response. |
| Evidence | Append-only behavior and secret/raw-value rejection | Verify the live adapter result is stored only through the same safe path. |

The existing deterministic suite is the regression gate for any future smoke implementation. It must remain network-free.

## 7. Assessment conclusion

The codebase has a bounded, testable technical seam for one real OpenAI smoke invocation. It does **not** yet have a product-facing composition root for the runtime. The smallest safe next scope is therefore an isolated, server-only smoke harness that calls the existing adapter through `executeMinimumRuntime` and produces a redacted terminal/report summary.

Connecting that runtime to a project page, server action, database, autonomous flow, or provider selection UX is a different scope and requires a separate Sprint decision.

## Scope-freeze decisions required before implementation

1. Approve an isolated smoke harness as the only executable surface; do not combine it with product integration.
2. Authorize a single real non-streaming request using a designated non-production credential and model, with a defined cost ceiling.
3. Define the allowed input as static, non-sensitive, and non-user-derived.
4. Confirm that live auth, timeout, rate-limit, empty-output, and malformed-output cases remain mock-only.
5. Approve the exact safe terminal/report fields and failure exit behavior.
6. Keep `MCP`, tools, retry, persistence, UI, queueing, and dependency changes out of scope.

## Development Charter Compliance

| Criterion | Assessment |
| --- | --- |
| Product Vision | Verifies the minimum execution foundation without presenting a fake end-user build experience. |
| Scope Discipline | Separates a single live smoke invocation from product integration and excludes all adjacent runtime features. |
| OSS First | Reuses the already-installed official OpenAI SDK; no new package is proposed. |
| Reuse Before Rewrite | Uses the existing Provider Port, orchestrator, evidence sink, environment boundary, and deterministic test fixtures. |
| Browser-visible Milestone | Not applicable to this assessment-only infrastructure task; no UI is proposed. |
| Closed Beta Alignment | Reduces runtime integration risk before any user-facing execution capability is approved. |
