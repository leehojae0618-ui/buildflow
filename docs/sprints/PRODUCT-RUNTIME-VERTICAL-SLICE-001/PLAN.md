# PRODUCT-RUNTIME-VERTICAL-SLICE-001 Plan

## Status

```text
SPRINT ID: PRODUCT-RUNTIME-VERTICAL-SLICE-001
STATUS: SCOPE FROZEN / IMPLEMENTATION NOT APPROVED
IMPLEMENTATION AUTHORITY: NONE
COMMIT AUTHORITY: NONE
PUSH AUTHORITY: NONE
DEPLOY AUTHORITY: NONE
DB / RUNTIME / PROVIDER / MCP / EXTERNAL AUTHORITY: NONE
```

## Objective

Project an eligible BF0 user design into the existing Runtime contracts and,
only after a separate explicit user action, run a controlled no-network Runtime
path that produces safe Result and Evidence references in the BF0 UI.

This is not an external automation Sprint. It must not make a live OpenAI,
Supabase, DB, MCP, n8n, Make, OAuth, or external-service call.

## Architecture Boundary

```text
Bf0BuildPlanItem = human-readable build/setup guidance
RuntimePlan = validated execution contract

Bf0BuildPlanItem -> executeMinimumRuntime() is prohibited.
```

A deterministic, validated Runtime Artifact Projection is the required middle
layer. It must construct and validate the actual Runtime inputs before the
existing Product Runtime Bridge is called.

## Target Flow

```text
BF0 Draft
→ Runtime Eligibility Check
→ Deterministic Runtime Artifact Projection
→ Controlled Execution Summary
→ Explicit User Approval
→ Server-only Controlled Runtime Action
→ executeApprovedProductRuntime()
→ Controlled ProviderAdapter
→ executeMinimumRuntime()
→ InMemoryRuntimeEvidenceRepository
→ Safe Product Runtime Result
→ BF0 Result UI
```

## First-Slice Eligibility

Only this deterministic subset can be eligible:

```text
Source: direct input
Execution: one internal AI_RESPONSE-compatible provider step
External source read: NONE
External destination write: NONE
External side effect: NONE
```

Gmail, Slack, GitHub, Google Forms, Webhook/API, Database, external file
persistence, n8n, Make, MCP, and OAuth are excluded. These retain their BF0
guide-only / connection-required / actual execution NOT AVAILABLE status.

## Existing Contract Reuse

The implementation must reuse existing builders and validators, rather than
building unvalidated Runtime object literals:

- `validateAgentBlueprint()` and `generateAgentDefinition()` for the
  AI_RESPONSE-compatible Agent projection.
- `buildPackageEvidenceReport()`, `buildPackageApprovalRequest()`,
  `buildPackageApprovalDecision()`, and `evaluatePackageApprovalGate()` for
  the package approval prerequisite.
- `buildRuntimeExecutionRequest()` for the validated execution request.
- `buildRuntimePlan()` and `validateRuntimePlan()` for the one-step plan.
- `buildRuntimeApprovalBinding()` for the approval-to-runtime binding.
- `executeApprovedProductRuntime()` for ownership, validation, binding
  comparison, atomic approval consume, Core Runtime call, and safe-result
  projection.
- `InMemoryRuntimeEvidenceRepository` for ephemeral Evidence only.

The Core Runtime schema currently names its structural provider `openai`. The
controlled adapter may satisfy that existing `ProviderAdapter` shape, but must
not invoke OpenAI or any SDK/network client.

## Controlled Composition

The future product-owned controlled composition must inject all non-live
dependencies into `executeApprovedProductRuntime()`:

- deterministic `resolveOwnedProject` for the ephemeral controlled execution;
- an in-memory implementation of the existing `RuntimeApprovalRepository`;
- `InMemoryRuntimeEvidenceRepository`;
- a deterministic `ProviderAdapter` that returns only safe reference/checksum
  output;
- `isProviderConfigured: () => true` for the controlled adapter, never an env
  credential check.

The existing test-only `tests/live-db-validation/fake-provider.ts` must not be
imported by product code.

## Explicit Approval and Truth

BF0 choices such as `실행 전 확인`, `중요 작업만 승인`, `조건부 승인`, and
`자동 진행` are design preferences only. A separate Runtime CTA, such as
`통제된 실행 검증 시작`, is required. There is no auto-run, default approval,
or approval carry-over.

Result UI may say controlled internal execution validation completed or failed,
and may show runtime/evidence references. It must say external Provider call:
NONE and external service action: NONE. It must never claim that AI work,
Agent construction, Slack delivery, external connection, Production execution,
or persisted DB Evidence completed.

## Persistence and Core Boundaries

`draft-persistence.ts` and `draft-persistence.test.ts` remain read-only. No
Supabase schema, migration, RPC, RLS, RuntimeExecutionRequest, RuntimePlan,
Runtime Orchestrator, ProviderAdapter, Runtime Evidence, or Runtime Approval
core contract may change. The product adapter/composition layer must conform to
the Core contracts.

## Future Exact Source Scope

The following is the smallest confirmed future implementation scope:

```text
src/features/product-experience/bf0-runtime-projection.ts
src/features/product-experience/bf0-runtime-projection.test.ts
src/features/product-experience/actions.ts
src/features/product-experience/components/bf0-product-experience.tsx
src/features/product-runtime/controlled-product-runtime.ts
src/features/product-runtime/controlled-product-runtime.test.ts
```

No other source, test, configuration, package, lockfile, environment, DB,
Runtime-core, Provider-core, approval-core, or persistence file is approved by
this Scope Freeze. Any required addition or change is a stop condition and
requires a Scope Amendment.

## Future Validation Plan

Future implementation must run focused artifact-projection, controlled Product
Runtime, approval-boundary, and truth-boundary tests; product-experience and
full-repository tests; typecheck; lint; build; browser QA at 390, 768, and 1440;
and `git diff --check`.

No validation item authorizes a live Provider, external service, DB, MCP,
deployment, Commit, or Push.
