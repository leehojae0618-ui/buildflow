# CORE-RUNTIME-001 — Phase 1 Assessment

Status: DRAFT — AWAITING USER APPROVAL
Date: 2026-07-26
Mode: Repository assessment and static architecture analysis only

## Scope and decision boundary

This assessment records what is present in the repository and what is still required before BuildFlow can execute a minimal, evidence-backed runtime path. It does not activate a Sprint, change a contract, approve an implementation, or authorize code changes.

The target architecture is the repository's documented sequence:

```text
Goal → Requirements / Capability → Blueprint / Agent Definition
→ Runtime Plan → Preflight → Start → Steps / Attempts
→ Provider or MCP Adapter → Result / Evidence
```

The existing `src/features/execution` and `src/features/autonomous` flows are product-facing provisioning and autonomous-build flows. They are useful context, but are not the Core Runtime execution state machine and must not be silently repurposed as one.

## Classification

| Classification | Meaning |
| --- | --- |
| Implemented | Production code and focused tests provide the stated behavior. |
| Partial | A usable part exists, but the end-to-end responsibility is incomplete. |
| Stub | A type, placeholder, or narrow helper exists without the required behavior. |
| Document-only | A decision or contract exists only in documentation. |
| Missing | No repository implementation currently owns the responsibility. |
| Deprecated / separate | Existing code serves a different responsibility and is not a Core Runtime implementation. |

## Repository assessment

| Area | Current evidence | Status | Runtime relevance |
| --- | --- | --- | --- |
| Agent definition and blueprint | `src/features/agents` contains agent/blueprint types, generation, validation, export/verification/approval contracts, and public exports. | Implemented | Reusable input to a future runtime planner/compiler. |
| Runtime request, preflight, start, result and step contracts | `runtime-execution-request`, `runtime-execution-start`, `runtime-execution-result`, and `runtime-execution-step` model reference-first validation, readiness, steps/attempts, evidence references, and terminal results. | Implemented contract foundation | Must remain the contract boundary; no orchestrator currently drives these contracts. |
| Runtime execution orchestrator | No component loads a plan, starts steps, invokes adapters, transitions attempts, or produces a completed result. | Missing | Primary Core Runtime gap. |
| Runtime plan / compiler | Long-term architecture calls for a versioned execution plan, but no dedicated Runtime Planner or Compiler currently exists. | Missing | A Blueprint cannot be executed directly without an explicit plan/binding contract. |
| Provider invocation | `src/services/openai/client.ts` creates a server-only OpenAI client with a timeout and no retries. No provider adapter owns runtime invocation, normalized results, or runtime evidence. | Partial | The existing client can be the first adapter dependency, not the Runtime API. |
| Tool selection | Agent tool resolution and package validation are deterministic/pure. | Implemented selection | Selection is not tool invocation. |
| MCP contracts | `src/features/mcp` provides transport/trust/health/risk/permission/retry/idempotency/reference-only credential validation and tests. | Implemented contract foundation | No MCP connection, discovery execution, or invocation gateway exists. |
| MCP invocation | No dependency or implementation invokes an MCP server. | Missing | Must remain a later adapter slice after provider/runtime foundations are stable. |
| Evidence contracts | Package evidence bundles/reports are deterministic and secret-safe; runtime results accept evidence references. | Partial | A runtime evidence writer/record and collection path are still missing. |
| Verification persistence | `src/features/verification` supports verification-oriented repositories and records. | Partial / separate | It is not a runtime invocation evidence store. Reuse requires an explicit contract decision. |
| Project persistence | Supabase-backed project persistence exists. | Partial | It does not define append-only runtime execution/event/evidence persistence. |
| Build Planner | `src/features/planner` produces build-task plans. | Implemented but separate | It is not a runtime plan compiler and should not become one by implication. |
| Autonomous/provisioning flow | `src/features/autonomous` and `src/features/execution` manage existing user-facing build/provisioning concerns. | Deprecated / separate for Core Runtime | No direct dependency from a new runtime until compatibility is explicitly approved. |
| Tests and documentation | Contracts have focused tests; long-term runtime and MCP boundary documents exist. | Partial | There is no end-to-end Runtime invocation test because the execution path does not exist. |

## Existing technical baseline

- Application stack: Next.js 16, React 19, TypeScript, Supabase, Zod 4, and the official OpenAI SDK are already present.
- The OpenAI client is server-only and has a 12-second timeout with SDK retries disabled. Retry ownership is therefore still an explicit Runtime Adapter decision.
- No Vercel AI SDK, official MCP SDK, queue/retry package, OpenTelemetry package, or AI observability product package is currently installed.
- The Runtime/MCP boundary documentation already locks important safety rules: no raw credentials in Runtime contracts, reference-only credential handling, no raw provider/MCP payload storage, tool snapshot binding, and no automatic retry for non-idempotent MCP operations.

## Minimum Runtime execution path

The smallest credible execution path is not “pass a Blueprint to an LLM.” It needs the following explicit boundaries:

```text
1. Runtime Plan input
   - versioned, immutable execution intent derived from an approved Blueprint/Agent definition

2. Agent and tool binding load
   - validated Agent definition, tool snapshot, policy and credential references

3. Preflight
   - existing Runtime request/start readiness contracts validate policy, provider, approval and references

4. Runtime orchestrator
   - creates execution/step/attempt state; invokes exactly one selected adapter per step

5. Provider or MCP adapter
   - resolves credentials outside the Core; receives a normalized command; returns normalized output/failure

6. Result and evidence capture
   - records safe references, timestamps, status and hashes; never persists raw secrets or unrestricted payloads

7. Final status
   - emits the existing validated Runtime Result contract with evidence references
```

### Minimum first executable slice (recommendation, not approval)

Start with one provider-backed, single-step execution using the existing OpenAI SDK behind a BuildFlow `ProviderAdapter` interface. Keep MCP invocation, durable queueing, multi-step orchestration, streaming UI, automatic retries, and autonomous provisioning outside that first executable slice.

This is the smallest slice that validates the actual execution boundary while preserving the provider-independent interface required for later adapters.

## Key gaps and risks

| Priority | Gap / risk | Why it blocks or constrains Runtime |
| --- | --- | --- |
| P1 | No versioned Runtime Plan / compiler contract | Blueprint semantics cannot safely become executable instructions without an explicit immutable plan. |
| P1 | No Runtime orchestrator | Existing contracts cannot progress from preflight to a step attempt or final result. |
| P1 | No provider adapter boundary | Direct SDK calls would couple execution state, model/provider details, retries and errors. |
| P1 | No runtime evidence storage contract | Runtime Result expects evidence references, but no writer/record owns their creation. |
| P1 | Retry ownership unresolved | The provider client disables SDK retries; retry policy needs idempotency and evidence semantics before implementation. |
| P1 | MCP invocation intentionally absent | The MCP contract is mature but a client/gateway must be introduced separately to preserve trust and retry rules. |
| P2 | Existing execution/autonomous flows resemble Runtime concepts | Reusing them without a contract mapping risks parallel state machines and lifecycle drift. |
| P2 | Current deployment authentication is unresolved | Production deployment/smoke testing remains blocked by Vercel authentication/project mapping; it is not a Runtime design blocker. |

## Decisions required before implementation scope freeze

1. Define the `RuntimePlan` / compiler contract and the approval/version binding to a Blueprint.
2. Choose the first real provider and the allowed operation shape. Recommendation: OpenAI only, one non-streaming single-step adapter initially.
3. Define the runtime evidence record: minimum fields, retention boundary, and reference strategy.
4. Define whether first-slice persistence is required before invocation. Recommendation: yes for execution/step/evidence references; no raw payloads.
5. Define retry semantics per adapter and explicitly prohibit automatic retry for non-idempotent MCP operations.
6. Confirm whether MCP remains a follow-on Sprint. Recommendation: yes.

## Current operational note

This task is a draft assessment only. It does not supersede or normalize existing operational files, which may contain uncommitted records for other Sprint/QA work. The related `NEXT_TASK` entry added with this assessment is explicitly non-active.

## Development Charter compliance

| Charter criterion | Assessment |
| --- | --- |
| Product Vision | Supports BuildFlow as a decision-to-execution system, not a generic chat wrapper. |
| Scope Discipline | Research and interface boundaries only; no source, dependency, environment, or deployment changes. |
| OSS First | Evaluates only limited official candidates where a dependency is genuinely needed. |
| Reuse Before Rewrite | Reuses existing agent, request/start/result/step, Zod, OpenAI client, and evidence foundations where their responsibilities fit. |
| Browser-visible Milestone | Defers UI work until a safe core execution contract exists; no hidden execution behavior is introduced. |
| Closed Beta Alignment | Keeps credentials reference-only, evidence-first, provider-independent, and auditable. |
