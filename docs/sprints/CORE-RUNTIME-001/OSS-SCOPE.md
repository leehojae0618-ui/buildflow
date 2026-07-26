# CORE-RUNTIME-001 — OSS Scope

Status: DRAFT — AWAITING USER APPROVAL
Date: 2026-07-26
Decision: No dependency installation is authorized by this document.

## Selection rules

An OSS candidate is in scope only when it preserves BuildFlow's contract-first, evidence-first, provider-independent boundaries. Phase 1 does not add an SDK merely because it is popular.

Evaluation criteria:

- official repository and documentation are available;
- license is compatible with the intended deployment and is verified at the version to be pinned;
- maintenance is active enough for the relevant SDK surface;
- the package fits an adapter boundary rather than becoming the Domain Core;
- it does not bypass BuildFlow's approval, credential-reference, evidence, or retry policies.

## Provider abstraction

| Candidate | Official source | License | Maintenance signal | BuildFlow compatibility | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Existing official OpenAI SDK | [OpenAI JavaScript SDK](https://github.com/openai/openai-node) | Verify at pinned version | Already installed and used by the server-only OpenAI client | High for an initial single-provider adapter; no new dependency | **Adopt as first adapter dependency.** Do not expose its types in Domain Core. |
| Vercel AI SDK | [Official repository](https://github.com/vercel/ai) and [documentation](https://ai-sdk.dev/docs/introduction) | Confirm at pin time | Active provider-agnostic TypeScript toolkit | Medium: useful if multiple model providers or streaming UX becomes a confirmed need; overlaps with a custom runtime layer | **Reference only.** Do not install in the first Core Runtime slice. |

Reasoning: BuildFlow already has an OpenAI SDK and needs to prove its own provider adapter/error/evidence boundary. Adding a second model abstraction before the first adapter exists would duplicate control flow and obscure ownership.

## MCP SDK

| Candidate | Official source | License | Maintenance signal | BuildFlow compatibility | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Model Context Protocol TypeScript SDK | [Official repository](https://github.com/modelcontextprotocol/typescript-sdk) and [MCP documentation](https://modelcontextprotocol.io/) | Licensing transition: new contributions/spec Apache-2.0; earlier contributions may remain MIT; documentation is CC-BY 4.0. Verify the pinned release notice. | Official SDK maintained with the protocol | High at the adapter layer; fits existing MCP transport/trust/permission contracts | **Reference / later adoption.** Evaluate only in a dedicated MCP Gateway Sprint after Provider Runtime is validated. |

Do not adopt a third-party MCP wrapper in Phase 1. The repository already has MCP policy contracts; a wrapper must not replace their authorization, trust, idempotency, or raw-payload restrictions.

## Retry and queueing

| Candidate | Official source | License | Maintenance signal | BuildFlow compatibility | Recommendation |
| --- | --- | --- | --- | --- | --- |
| BuildFlow adapter retry policy | Repository-owned contract | N/A | Governed with Runtime contracts | Highest: retries can depend on step idempotency, provider outcome and evidence policy | **Adopt as policy first.** Implement no automatic retry until contract tests specify it. |
| p-retry | [Official repository](https://github.com/sindresorhus/p-retry) | MIT | Mature focused promise retry utility | Medium: can implement backoff only after adapter-owned retry policy is fixed | **Reference only.** Consider for a narrow adapter implementation later; do not install in Phase 1. |
| Durable queue | No candidate selected | N/A | N/A | Low for first single-step, synchronous execution; adds persistence/operations complexity | **Defer.** A queue must follow an execution persistence and idempotency design, not precede it. |

Constraint: MCP operations marked non-idempotent must not be automatically retried, regardless of utility selection.

## Schema validation

| Candidate | Official source | License | Maintenance signal | BuildFlow compatibility | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Existing Zod 4 | [Official repository](https://github.com/colinhacks/zod) | MIT | Already installed and broadly used in repository contracts | High: matches the existing validation style | **Adopt / retain.** Use for runtime command/result/evidence adapter validation. |
| JSON Schema as transport artifact | [JSON Schema specification](https://json-schema.org/) | Specification, not a package decision | Stable interoperability format | Medium: useful later only where external adapters require portable wire schemas | **Reference only.** Do not introduce a generator package until an external wire contract needs it. |

No alternative validation library is justified while Zod is already the project standard.

## Evidence, tracing and observability

| Candidate | Official source | License | Maintenance signal | BuildFlow compatibility | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Existing BuildFlow evidence/report contracts | `src/features/agents` package evidence and Runtime Result evidence references | Repository-owned | Tested deterministic/secret-safe foundation | High for first Runtime evidence references and result assembly | **Adopt / extend by contract.** First define Runtime evidence records before adding observability tooling. |
| OpenTelemetry JavaScript | [Official JS documentation](https://opentelemetry.io/docs/languages/js/) and [instrumentation guide](https://opentelemetry.io/docs/languages/js/instrumentation/) | Apache-2.0; verify at pin time | Official docs describe JS traces and metrics as stable; logs are still development status | Medium: good vendor-neutral trace/metric future boundary, but not a substitute for product evidence | **Reference only.** Reserve interfaces/event names; do not install in Phase 1. |
| Langfuse | [Official repository](https://github.com/langfuse/langfuse) and [documentation](https://langfuse.com/docs) | Repository uses MIT for non-EE sections; EE paths have separate licensing. Legal/version review required. | Active AI engineering/observability project | Medium: useful later for model observability, but may introduce hosted/self-hosted and data governance decisions | **Evaluate later.** Not a Phase 1 dependency and not the source of truth for BuildFlow evidence. |

## Phase 1 adoption decision

```text
Install now:        none
Reuse now:          existing OpenAI SDK, Zod, BuildFlow contracts/evidence foundations
Official references: MCP TypeScript SDK, Vercel AI SDK, p-retry, OpenTelemetry, Langfuse
Explicitly deferred: MCP execution, durable queueing, third-party tracing/AI observability
```

## License and maintenance verification checklist

Before any later dependency approval:

1. pin a precise version;
2. re-check that release's license and notice files;
3. review transitive dependencies and server/runtime support;
4. confirm data handling against BuildFlow credential and evidence policies;
5. record why existing code cannot meet the need;
6. approve the dependency in a separate Sprint scope.

## Development Charter compliance

- **OSS First:** official sources are preferred, but reuse precedes installation.
- **Scope Discipline:** candidate count is intentionally limited; no framework replacement is proposed.
- **Contract First:** SDKs belong only behind Provider/MCP/observability adapters.
- **Closed Beta Alignment:** no package is allowed to persist raw credentials or override BuildFlow evidence/approval rules.
