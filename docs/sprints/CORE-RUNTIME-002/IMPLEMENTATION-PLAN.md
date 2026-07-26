# CORE-RUNTIME-002 Implementation Plan

## Status

`PROPOSED — REQUIRES SCOPE FREEZE AND ACTIVE AUTHORITY`

This is a planning artifact only. It must not be treated as approval to implement or execute a live request.

## Recommended scope decision

Approve **Option A only** for CORE-RUNTIME-002.

### Option A — isolated runtime smoke harness (recommended)

Create one server-only, manually invoked smoke surface that composes the existing Runtime Plan, Orchestrator, OpenAI adapter, and in-memory evidence sink. It makes at most one approved OpenAI request and prints a redacted result.

This proves the provider adapter path without changing a user-facing workflow.

### Option B — product-path integration (defer)

Connect the runtime to an API route, Server Action, autonomous flow, project UI, or persistence-backed session.

This is **not** a safe extension of a smoke-test scope. It changes product behavior, authorization, observability, failure UX, and persistence expectations. It must be proposed as a separate Sprint after CORE-RUNTIME-002.

## Proposed implementation breakdown for Option A

| Step | Proposed work | Boundary | Verification | Rollback |
| --- | --- | --- | --- | --- |
| 1 | Define a static, non-sensitive smoke fixture using existing Runtime request/plan contracts. | No user/project data; no raw output logging. | Unit test fixture validity. | Remove isolated fixture only. |
| 2 | Add an explicitly server-only smoke harness that composes the existing adapter through `executeMinimumRuntime`. | No UI, API route, Server Action, DB, queue, or background job. | Fake-adapter harness tests prove one invocation and safe summary. | Remove harness; core runtime remains unchanged. |
| 3 | Add a redaction guard for smoke reporting, reusing runtime safe-field policy rather than duplicating raw-value handling. | Terminal/report only; no records persisted. | Tests reject prompt/output/credential/SDK-object fields. | Remove reporter; core safety remains unchanged. |
| 4 | Add an opt-in manual execution command or documented invocation only after exact command approval. | No automatic CI, startup, test-suite, or deploy execution. | Command validates configuration before any call. | Do not run command; remove command/harness if rejected. |
| 5 | Execute exactly one separately approved live request and inspect its redacted summary. | Network is allowed once only after approval. | Smoke checklist in `SMOKE-TEST-PLAN.md`. | No retry; preserve only safe local output if any. |

## File impact: planning estimate

The existing implementation already supplies the core files below. They should be reused rather than rewritten:

- `src/features/agents/runtime-plan.ts`
- `src/features/agents/runtime-orchestrator.ts`
- `src/features/agents/runtime-provider.ts`
- `src/features/agents/runtime-evidence.ts`
- `src/services/openai/runtime-provider-adapter.ts`
- `src/services/openai/client.ts`
- `src/lib/env/server.ts`

The exact location of a future harness must be selected at Scope Freeze after checking existing server-only command conventions. A new executable surface is likely required, but its filename, package script, and test files are deliberately **not** authorized by this assessment. No existing product component should be modified merely to make a smoke request convenient.

## Interface constraints

The future harness must use existing public contracts:

```text
RuntimeExecutionRequest
RuntimePlan
ProviderAdapter
ProviderInvocationResult
RuntimeEvidenceSink
RuntimeExecutionResult
```

It must not introduce an alternate runtime state machine, error namespace, evidence schema, model selector, secret store, retry policy, or SDK-facing type into the Runtime core.

## Error and observability strategy

- Preserve existing normalized Runtime error codes.
- Return a nonzero process result for a non-successful smoke execution.
- Report a stable, redacted error code and safe status rather than an exception message or stack trace.
- Treat evidence/result construction errors as fail-closed, as the current orchestrator does.
- Do not introduce telemetry infrastructure, event buses, or logging dependencies. Existing Runtime events are the only event facts to inspect.

## Test additions proposed for a future implementation

1. Harness builds a valid static request/plan and calls the injected ProviderAdapter once.
2. Harness reports a safe success summary without exposing transient input or output.
3. Harness reports normalized failure with no raw exception/SDK object.
4. Harness rejects unsafe summary fields.
5. Harness does not auto-run in the normal test suite, application startup, CI, or build.
6. Existing adapter actual-path mock tests remain the contract tests for signal forwarding, request shape, output normalization, and SDK isolation.

The live request itself should not be represented as a required automated test: it is credential-dependent, billable, and non-deterministic.

## Scope exclusions to freeze explicitly

- no product route, Server Action, browser UI, or project page wiring;
- no database/Supabase writes, migrations, durable evidence, or session persistence;
- no tool/MCP invocation, retry, resume, queue, streaming, parallel step, or multi-agent behavior;
- no model fallback, provider selection, or environment mutation;
- no new dependency;
- no automatic live call during tests, build, CI, deploy, or application startup.

## Approval gates

```text
Assessment accepted
  → Scope Freeze for Option A
  → Implementation Authority ACTIVE
  → deterministic implementation + review
  → explicit Live Smoke Approval
  → one live request + redacted smoke review
  → separate decision for product integration or MCP foundation
```

## Recommended next action

Review these three assessment documents and decide whether to freeze **Option A: isolated runtime smoke harness**. Do not begin real OpenAI calling or product-path integration until that decision and a separate execution approval are recorded.

## Development Charter Compliance

| Criterion | Plan alignment |
| --- | --- |
| Product Vision | Establishes a trustworthy execution primitive before exposing execution to users. |
| Scope Discipline | Limits work to one harness and one live request; product wiring is explicitly deferred. |
| OSS First | Uses the installed official OpenAI SDK behind the existing adapter. |
| Reuse Before Rewrite | Reuses all CORE-RUNTIME-001 contracts and its deterministic coverage. |
| Browser-visible Milestone | Deferred intentionally; infrastructure verification is not represented as a UI feature. |
| Closed Beta Alignment | Avoids exposing an unproven live provider path to beta users. |
