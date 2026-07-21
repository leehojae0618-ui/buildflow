# Long-term AI Runtime Architecture

> This document is a long-term architectural discussion draft.
> It does not override existing BuildFlow architecture.
> No implementation should be started based solely on this document.
> Changes require PM/CTO review and Decision Lock.

## 1. Status

```text
Task: ARCHITECTURE-AI-RUNTIME-REVIEW-001
Status: ACTIVE / RESEARCH / DRAFT
Mode: ARCHITECTURE REVIEW ONLY
Decision Lock: APPROVED
Implementation Authority: NONE
```

This review evaluates direction. It does not revise the current Runtime
contracts and is not a Runtime Step, Planner, Compiler, Provider, MCP, Budget,
or deployment implementation specification.

Decision Lock approval applies only to the long-term principles listed in this
document. It does not close the Architecture Gate, activate Runtime Step work,
or authorize implementation.

## 2. Objective

Define a durable long-term direction in which BuildFlow can plan an Agent once,
compile an explicit execution plan, and execute that plan safely across model
and tool providers without making the core Runtime dependent on a particular
LLM.

The review answers five questions:

1. Do the long-term principles materially conflict with existing Runtime
   contracts?
2. Is Planner already implemented in the required Runtime sense?
3. Does LLM Optional mean Runtime independence rather than removal of LLMs?
4. Must anything be revised before Runtime Step contract work begins?
5. Which principles apply immediately as design constraints and which remain
   future components?

## 3. Why This Matters

BuildFlow is an AI Agent Factory, not an LLM wrapper. Agents must remain
predictable when model availability, price, latency, policy, or vendor changes.
An LLM may help interpret goals, generate bounded plans, transform data, or
produce content, but it must not become an implicit authority that selects
arbitrary tools, bypasses approval, or controls mutable external actions.

Separating planning from execution also supports replay, verification,
idempotency, cost governance, provider fallback, and Evidence that explains
what the system actually did.

## 4. Core Principles

### Runtime First

Runtime consumes explicit, validated contracts. It does not infer missing
permissions, tools, credentials, steps, or policy at execution time.

### LLM Optional

The core Runtime must start, validate, route, pause, retry, cancel, and record
Evidence without requiring an LLM call. This does **not** remove LLMs from
BuildFlow. Provider-backed model steps remain first-class execution steps when
the Agent definition requires them.

### Rule Before LLM

Deterministic rules decide contract validity, capability coverage, permission,
approval, idempotency, timeout, budget eligibility, and secret safety before an
LLM is considered. LLM output cannot override these rules.

### Provider Independence

Capabilities, plans, policies, and Evidence use provider-neutral references.
Provider-specific behavior remains behind versioned adapters and normalized
result contracts.

### Compile Once Execute Many

A validated Agent definition may compile to a versioned execution-plan artifact
that can be executed repeatedly. Each execution still receives its own Runtime
identity, fresh Preflight, approval revalidation, readiness snapshots, and
immutable Evidence.

### Evidence and Approval First

Compilation does not grant execution authority. Every execution remains bound
to current approval, connection, credential, policy, tool snapshot, and budget
conditions.

## 5. Runtime First Architecture

Recommended long-term flow:

```text
User Goal
→ Requirement and Capability Contracts
→ Blueprint and Agent Definition
→ Runtime Planner
→ Runtime Compiler
→ Versioned Execution Plan
→ Runtime Execution Request
→ Non-mutating Preflight
→ Runtime Execution Start
→ Step / Attempt execution
→ Provider or MCP Invocation
→ Result and immutable Evidence
```

Runtime owns lifecycle, state transitions, attempt identity, policy enforcement,
and Evidence coordination. Provider Invocation adapters and the MCP Gateway
perform bounded runtime actions; they do not own the overall Runtime state
machine. Existing provisioning Provider Adapters remain a separate build and
deployment layer.

## 6. LLM Optional Strategy

LLM Optional means:

- an execution plan can contain zero or more model-backed steps;
- deterministic transformations, validations, approvals, and tool routing do
  not require an LLM;
- Runtime control flow is not generated dynamically by an LLM during execution;
- a model outage blocks only steps that require that model capability, unless a
  policy-approved fallback exists;
- the same core Runtime can support hosted models, local models, and no-model
  Agents.

LLM Optional does not mean that BuildFlow abandons AI planning, generation, or
model-backed Agent behavior. It limits where probabilistic output may exercise
authority.

## 7. Rule Before LLM

The following checks remain deterministic and server-controlled:

- schema and checksum validation;
- capability and Blueprint constraints;
- tool allowlists and version binding;
- connection and Credential Reference readiness;
- permission, risk, and approval scope;
- idempotency, retry, timeout, cancellation, and concurrency policy;
- budget eligibility and cost-approval thresholds;
- secret and payload safety;
- Evidence completeness and status transitions.

An LLM may propose a candidate plan or mapping. A validator must accept or reject
that proposal against explicit contracts before compilation or execution.

## 8. Planner / Compiler / Runtime Separation

### Current implementation fact

`src/features/planner/` contains an implemented **Build Planner** that produces
build phases and tasks from Requirement, Architecture, and Build Intelligence.
It is not the long-term Runtime Planner described here.

No dedicated Runtime Planner or Runtime Compiler implementation was found.
`docs/project/ARCHITECTURE.md` also identifies Runtime Compiler as planned.

### Long-term responsibilities

| Component | Responsibility | Must not do |
|---|---|---|
| Runtime Planner | Convert a validated Agent definition and policies into a candidate execution graph | Execute tools, read secrets, or grant approval |
| Runtime Compiler | Validate and freeze the graph into a versioned, checksummed execution-plan artifact | Call Providers/MCP or mutate external state |
| Runtime | Execute the compiled plan under current Preflight, approval, readiness, and policy constraints | Invent missing steps or silently change the compiled plan |

Planner output is a proposal. Compiler output is an immutable executable
contract. Runtime execution creates new Evidence and identities without
rewriting the compiled artifact.

## 9. Provider Independence

Execution-plan steps should declare required capabilities, schemas, policy
references, and optional provider-selection constraints rather than embedding a
single vendor as business logic.

Provider selection must respect:

- required capability and schema compatibility;
- model/version availability;
- region and data policy;
- latency and reliability policy;
- estimated budget and user cost approval;
- fallback allowlist;
- current connection and Credential Reference readiness.

Provider fallback is a new execution decision and must be represented in
Evidence. It cannot weaken approval scope, data policy, or output validation.

## 10. LLM Budget Router

The LLM Budget Router is a long-term policy component, not current
implementation. It selects among eligible model candidates after deterministic
capability, policy, security, and approval checks.

Candidate inputs:

- model capability and output-schema support;
- context and output size estimates;
- latency class and availability;
- price-table version and simulated usage frequency;
- per-step, per-execution, and account budget limits;
- data residency and privacy policy;
- fallback policy and quality floor.

Candidate output is a provider/model selection decision with reason codes,
policy references, estimate references, and limitations. It does not expose
Credential values and does not claim actual billed cost.

## 11. Execution Plan Model

A future versioned execution-plan artifact should be deterministic and
reference-first. Candidate fields include:

- format version, plan id, and integrity checksum;
- Agent definition and Blueprint references;
- ordered or dependency-based Step definitions;
- capability, block, input/output schema, and artifact references;
- Provider or MCP candidate bindings;
- approval, connection, Credential, runtime-policy, and budget-policy
  references;
- retry, timeout, idempotency, cancellation, and fallback policies;
- expected Evidence requirements and limitation codes.

The plan must exclude raw secrets, private payloads, raw prompts, Provider/MCP
responses, and mutable live status. Runtime Request and Execution identities
remain separate from the reusable plan identity.

## 12. Local Model and Provider Blackout Strategy

Local models may be registered as Provider candidates under the same capability,
schema, policy, health, and Evidence rules as hosted models. Local execution is
not inherently trusted and must not bypass approval or data policy.

For provider blackout:

1. mark the affected Provider readiness snapshot unavailable or degraded;
2. identify only policy-approved compatible alternatives;
3. recalculate estimate and approval impact when needed;
4. re-run Preflight or pause before changing a binding;
5. record the selected fallback and limitations in Evidence;
6. return a clear blocked state when no safe alternative exists.

No fallback is preferable to an unapproved or schema-incompatible fallback.

## 13. AI Policy and Budget Policy

AI Policy and Budget Policy are separate from Agent content and Runtime state.

AI Policy should govern:

- eligible model/provider classes;
- data handling and region restrictions;
- output validation and safety requirements;
- fallback and local-model eligibility;
- model version pinning and revalidation triggers.

Budget Policy should govern:

- estimate source/version and usage assumptions;
- per-step, per-execution, daily, and monthly thresholds;
- warning, approval, pause, and deny thresholds;
- variance handling between estimate, usage, provider-reported cost, and actual
  billed cost.

Missing budget data must be visible. It must not silently authorize execution or
be represented as actual billing evidence.

## 14. Compatibility With Current BuildFlow

The current architecture is compatible with the proposed direction:

- Capability and Blueprint contracts are provider-neutral.
- Tool Resolution is contract-based and does not let an LLM invoke arbitrary
  tools.
- Package, Evidence, and Approval are reference-first and checksummed.
- Runtime Execution Request is separate from Runtime Execution identity.
- Preflight is non-mutating and evaluates approval, connection, Credential,
  capability, Provider, MCP, policy, cancellation, and idempotency snapshots.
- Execution Start records `READY` and does not pretend that execution has begun.
- Provider and MCP Invocation boundaries are separate.
- Runtime receives Credential References, not raw secrets.

`Compile Once Execute Many` is compatible with current identity rules because
the reusable plan and each Runtime execution have different identities. The
current contracts do not require an LLM at Runtime control boundaries.

## 15. Architecture Impact Assessment

| Component | Impact | Assessment |
|---|---|---|
| Requirement Engine | No Impact | Continues to capture user goals and constraints. |
| Capability Engine | Minor | Future capabilities may declare deterministic, model, or tool execution needs. |
| Blueprint Engine | Minor | Blueprints may add execution-plan and policy references without changing their role. |
| Planner | Moderate | Existing Build Planner remains; a separate Runtime Planner is a future component. |
| Runtime Compiler | Major | New future component required to freeze validated plans into versioned artifacts. |
| Runtime | Major | Future execution engine must consume plans without inventing control flow. Current contracts remain valid. |
| Validator | Minor | Future cross-plan, policy, and provider-candidate validation is required. |
| Evidence | Minor | Add plan/compiler/router decision references while preserving immutable, secret-safe evidence. |
| Package | Minor | Package may reference a compiled plan and policies; Package Readiness remains separate. |
| MCP | Moderate | Invocation must consume compiled Tool bindings and enforce snapshot/version policy. |
| Provider Adapter (Provisioning) | No Impact | Existing GitHub, Supabase, and Vercel provisioning/deployment responsibility remains separate from Runtime model invocation. |
| Provider Invocation Layer | Moderate | Future model execution needs normalized capability, usage, failure, and fallback contracts. |
| Approval | Minor | Revalidation may be triggered by provider, plan, cost, or snapshot changes. |
| Cost / Budget | Major | Budget Policy and a router are new components; estimated and billed cost remain separate. |
| Marketplace | Minor | Future listings may disclose plan/policy compatibility but gain no execution authority. |

Impact summary:

```text
No Impact: 2
Minor: 7
Moderate: 3
Major: 3
```

Major impact identifies future implementation effort, not a conflict requiring
the current Runtime contracts to be rewritten.

## 16. Conflicts or Risks

### Material conflicts

No material conflict was found between the long-term principles and the current
Runtime Execution Request, Preflight, Execution Start, Runtime/MCP boundary,
Approval, Package, or Evidence contracts.

### Risks requiring later Decision Lock

- confusing the implemented Build Planner with a future Runtime Planner;
- allowing compilation to imply approval or execution readiness;
- introducing dynamic LLM-generated control flow after compilation;
- changing Provider/model bindings without Preflight and Evidence;
- treating local models as automatically safe;
- optimizing cost below capability, policy, or quality constraints;
- mixing reusable plan identity with Runtime execution identity;
- adding parallel execution before lock/lease and deterministic ordering rules;
- claiming provider blackout resilience before compatible fallback Evidence
  exists.

### Runtime Step gate

No existing contract must be revised before a Runtime Step contract can be
designed. The next contract should, however, preserve optional references to a
future execution plan, Runtime Policy, Budget Policy, and Provider/MCP binding
without implementing those components or weakening the locked boundaries.

## 17. Recommended Follow-up

### Apply immediately as design constraints

- Keep Runtime lifecycle deterministic and LLM-independent.
- Keep Rule/Policy checks before model or tool execution.
- Keep Runtime Step definitions explicit and user-understandable.
- Preserve Provider/MCP separation and reference-only Credential handling.
- Reserve clear references for execution plan, runtime policy, and budget
  policy where the next contract requires them.
- Preserve separate plan, request, execution, step, attempt, and invocation
  identities.

These are constraints for future review. They do not authorize code changes in
this task.

### Defer to future scoped work

- Runtime Planner implementation;
- Runtime Compiler and compiled plan artifact;
- LLM Budget Router;
- local-model adapter and registry behavior;
- provider-blackout routing;
- AI Policy and Budget Policy engines;
- runtime execution engine, concurrency, queue, and lease behavior;
- Provider and MCP Invocation implementations.

Recommended next action after Decision Lock:

1. Close the Architecture Gate.
2. Scope `RUNTIME-STEP-CONTRACT-001` as a contract-only task.
3. Do not begin Runtime Planner, Compiler, Budget Router, Provider, or MCP
   runtime implementation under that task.

## 18. Decision Recommendation

```text
KEEP CURRENT
```

Rationale:

- existing Runtime contracts already separate request, execution, approval,
  readiness, Provider, MCP, Credential, and Evidence concerns;
- no current Runtime control contract requires an LLM;
- the implemented Build Planner is not falsely treated as a Runtime Planner;
- long-term Planner, Compiler, Budget Router, local-model, and blackout behavior
  can be added behind the current boundaries;
- no blocking revision is required before Runtime Step contract design.

This recommendation was approved by PM/CTO Decision Lock. It now acts as binding
architecture guidance, but it still does not authorize implementation or close
this Architecture Gate by itself.

## 19. Decision Lock Result

```text
PM Decision: APPROVE
CTO Decision: APPROVE
Decision Lock: APPROVED
Existing Runtime Contracts: KEEP
Runtime Step Contract: MAY PROCEED ONLY AFTER ARCHITECTURE GATE CLOSEOUT
Runtime Implementation Authority: NONE
```

Approved locked principles:

1. Runtime control plane remains deterministic.
2. LLMs do not directly control Runtime lifecycle or state transitions.
3. Rule and Policy validation runs before model or Tool execution.
4. Runtime Step must be explicit and explainable.
5. Provider Invocation Layer and Provider Adapter (Provisioning) remain
   separate boundaries.
6. MCP Gateway remains an independent Runtime Tool execution boundary.
7. Credential handling remains reference-only in Runtime contracts.
8. Plan, Request, Execution, Step, Attempt, and Invocation identities remain
   separate.
9. Current Runtime Request, Preflight, and Execution Start contracts remain
   valid.
10. LLM Optional means Runtime control-plane independence, not removal of
    model-backed Agent capabilities.

Deferred detailed design:

- Runtime Planner internal algorithm;
- Runtime Compiler schema and artifact format;
- LLM Budget Router algorithm;
- AI Policy and Budget Policy Engine implementation;
- local model selection rules;
- provider fallback and blackout order;
- parallel execution strategy;
- retry policy details;
- actual Provider or MCP Invocation implementation;
- Marketplace integration.

Decision Lock does not approve implementation. The next allowed action is
Architecture Gate closeout, followed by a separate approval and scope freeze for
any `RUNTIME-STEP-CONTRACT-001` work.
