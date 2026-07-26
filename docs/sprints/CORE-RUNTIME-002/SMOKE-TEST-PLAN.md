# CORE-RUNTIME-002 Smoke-Test Plan

## Status

`DRAFT — NOT APPROVED FOR EXECUTION`

This plan describes a future single-request OpenAI smoke test. No smoke test is executed as part of `CORE-RUNTIME-002` assessment.

## Purpose

Prove that the already-tested Runtime Port → OpenAI Adapter → Runtime Result path can complete one bounded live request without changing the product path or weakening Runtime safety rules.

## Proposed execution topology

```text
Server-only smoke harness
  → static non-sensitive RuntimeExecutionRequest
  → existing Runtime Plan builder
  → existing executeMinimumRuntime
  → existing createOpenAIRuntimeProviderAdapter
  → one OpenAI Responses API request
  → existing append-only in-memory evidence sink
  → redacted smoke summary and process exit code
```

The smoke harness is a future implementation candidate, not an approved file or command in this assessment. It must be server-only and must not be reachable from browser, API, Server Action, project UI, background queue, or autonomous execution.

## Preconditions for a future authorized run

- A subsequent Scope Freeze explicitly approves implementation and one live request.
- The running environment already provides a valid `OPENAI_API_KEY` and `OPENAI_MODEL`; this task neither changes nor reveals them.
- The credential is designated for development/smoke use and has an agreed, minimal spend limit.
- The static smoke input is reviewed as non-sensitive and contains no customer, project, credential, or user-provided data.
- The network is available only at the moment of the separately approved live run.
- The deterministic Runtime suite, typecheck, lint, and production build pass first.

## Live smoke contract

| Item | Required behavior |
| --- | --- |
| Provider | Existing `createOpenAIRuntimeProviderAdapter()` only. |
| Invocation count | Exactly one call to the provider port and one SDK Responses API request. |
| Model | The existing validated plan model; no hard-coded replacement model. |
| Response mode | Non-streaming bounded response only. |
| Timeout | Existing client timeout: `12_000 ms`; no retry (`maxRetries: 0`). |
| Abort | The harness must be able to pass an `AbortSignal`; the actual timeout/cancel scenario remains deterministic/mock coverage. |
| Tools and MCP | Forbidden. |
| Persistence | Forbidden; use existing in-memory evidence only. |
| Logs/output | Redacted summary only. Never output raw prompts, raw model output, API keys, SDK payloads, headers, stack traces, or absolute local paths. |

## Test matrix

| Case | Execution mode | Expected result | Notes |
| --- | --- | --- | --- |
| S-01 Valid single request | One approved live request | Runtime `SUCCEEDED`; one completed step/attempt; append-only safe evidence; safe final result | The sole network case. |
| S-02 Configuration absent | Deterministic/mock | `PROVIDER_CONFIGURATION_MISSING`; zero SDK calls | Must not inspect a missing or real key. |
| S-03 Authentication | Adapter mock | `PROVIDER_AUTHENTICATION_FAILED` | Do not intentionally make a real rejected request. |
| S-04 Timeout | Adapter mock | `PROVIDER_TIMEOUT` | Do not force a live timeout. |
| S-05 Rate limit | Adapter mock | `PROVIDER_RATE_LIMITED` | Do not intentionally cause rate limiting. |
| S-06 Cancellation | Adapter mock/AbortSignal | `PROVIDER_CANCELLED` with safe failed Runtime close | Existing signal forwarding coverage is reused. |
| S-07 Empty/malformed response | Adapter mock | `PROVIDER_EMPTY_RESPONSE` or `PROVIDER_OUTPUT_INVALID` | Keep live behavior deterministic. |
| S-08 Malformed Provider envelope | Orchestrator fake | `PROVIDER_OUTPUT_INVALID`, failed Attempt/Step/Runtime, safe evidence/result | Existing P1-001 regression coverage. |

## Success criteria for S-01

1. The runtime accepts the valid one-step plan and starts exactly one initial attempt.
2. The OpenAI adapter receives the model and non-streaming request parameters.
3. Exactly one provider call occurs; no retry or second attempt occurs.
4. A safe `ProviderInvocationResult` is returned without an SDK response object.
5. One safe evidence record is appended and links to the Runtime/Step/Attempt.
6. The final Runtime result closes successfully only after result construction succeeds.
7. The smoke summary contains only status, normalized code if any, identifiers/references, event/evidence counts, bounded timing/usage facts, and pass/fail result.

## Failure criteria and stop rules

Stop immediately and return a failing, redacted result if any of the following occurs:

- missing configuration;
- a second provider call or retry;
- use of tools, MCP, streaming, persistence, or a UI path;
- an unsafe field appears in evidence, result, or smoke output;
- raw output, request text, SDK payload, credential, or stack trace would be emitted;
- a timeout, cancellation, normalized provider failure, or finalization failure is not safely represented.

No automatic retry, fallback model, alternate provider, or repair action is allowed.

## Validation sequence before a live request

```text
Focused Runtime and adapter tests
  → full deterministic suite
  → typecheck
  → lint
  → production build
  → git diff --check
  → secret-shaped value scan
  → one approved live smoke request
  → redacted result inspection
```

## Post-run evidence review

Verify only safe fields:

- Runtime/Step/Attempt linkage;
- event order: started → plan accepted → provider started → provider completed/failed → step completed/failed → evidence appended → runtime completed/failed;
- evidence append-only count and safe checksums/references;
- absence of retry;
- absence of raw/secret-shaped fields;
- final status and normalized code.

## Out of scope

- Real failure induction for authentication, timeout, rate limit, empty output, or malformed output;
- product UI/API integration;
- persistence, database writes, migrations, queues, retries, resume, streaming;
- tools, MCP, multi-step, multi-agent, branching, parallel work;
- dependency or environment changes;
- commit, push, merge, or deployment.
