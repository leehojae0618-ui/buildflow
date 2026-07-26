# CORE-RUNTIME-001 — Phase 2 File Change Plan

Status: READY FOR DOCUMENTATION — PROPOSED IMPLEMENTATION FILE PLAN
Date: 2026-07-26
Authority: Planning only; no files in this plan are created or modified by Phase 2.

## File naming note

The **NEW** paths below do not exist today. They are proposed names for a later, separately approved implementation Sprint—not pre-created directories or locked source files. Existing paths were verified in this repository.

## NEW — proposed implementation files

| Proposed file | Role | Why new | Dependencies | Risk | Test method |
| --- | --- | --- | --- | --- | --- |
| `src/features/agents/runtime-plan.ts` | Defines/validates immutable `RuntimePlan v1` and its single provider step. | No plan/compiler contract exists. | Existing agent types; existing request reference types; Zod only if consistent with current module style. | Medium: Blueprint/Agent binding and secret-safe input references. | Pure validation, checksum and one-step restriction tests. |
| `src/features/agents/runtime-provider.ts` | Defines provider port, command/result/error contracts and safe metadata rules. | Prevents Core from importing OpenAI SDK types. | Existing request/step reference types. | Medium: error taxonomy and raw-payload exclusion. | Fake adapter success/failure/timeout tests; no SDK call. |
| `src/features/agents/runtime-evidence.ts` | Defines safe Runtime Evidence Record and append-only in-memory sink interface/implementation. | Existing package evidence is not runtime invocation evidence. | Existing reference/checksum conventions. | Medium: evidence linkage and secret safety. | Record validation, immutability, linkage and no-secret tests. |
| `src/features/agents/runtime-orchestrator.ts` | Coordinates one plan, existing Request/Start/Step/Attempt/Result builders, adapter and evidence sink. | No Runtime executor exists. | New plan/provider/evidence modules; existing Runtime contracts. | High: status/reference correctness and fail-closed behavior. | Fake adapter matrix, transition/linkage/finalization tests. |
| `src/services/openai/runtime-provider-adapter.ts` | Implements the BuildFlow provider port with the existing server-only OpenAI client. | Keeps SDK-specific behavior outside Domain Core. | Existing `src/services/openai/client.ts`; new provider port. | High: SDK exception mapping, timeout and no secret leakage. | Unit tests with mocked client/response; no network. |

## MODIFY — existing implementation files

| File | Change reason | Dependencies | Risk | Test method |
| --- | --- | --- | --- | --- |
| `src/features/agents/index.ts` | Export approved new public Runtime modules only after their contracts are tested. | New `runtime-*` modules. | Low: accidental export/cycle. | Existing import/regression suite plus direct export test if project convention requires it. |

## TEST — proposed test files

| Proposed file | Covers | Why separate |
| --- | --- | --- |
| `src/features/agents/runtime-plan.test.ts` | Plan input, Blueprint/Agent binding, one-step/provider-only restrictions, model/prompt/input reference validation, no secret-shaped values. | Pure plan policy. |
| `src/features/agents/runtime-provider.test.ts` | Fake provider adapter contract, normalized success/auth/rate-limit/timeout/empty/malformed errors and safe metadata. | Keeps provider policy independent of OpenAI mocking. |
| `src/features/agents/runtime-evidence.test.ts` | Evidence record/linkage/checksums, append-only in-memory behavior and secret rejection. | Isolates evidence safety. |
| `src/features/agents/runtime-orchestrator.test.ts` | Golden path plus end-to-end fake-adapter failure matrix, status transitions, result/evidence linkage and no retry. | Validates the application layer without network. |
| `src/services/openai/runtime-provider-adapter.test.ts` | OpenAI SDK mapping, timeout/abort forwarding when supported, raw response/error exclusion. | Contains SDK client mocking at the adapter boundary. |

## Existing tests retained without modification

| Existing test | Regression responsibility |
| --- | --- |
| `src/features/agents/runtime-execution-request.test.ts` | Request authorization, checksum/reference, expiration and secret-safe contract behavior. |
| `src/features/agents/runtime-execution-start.test.ts` | Preflight/start readiness, cancellation, idempotency and binding behavior. |
| `src/features/agents/runtime-execution-step.test.ts` | Step/attempt status, transition, initial/retry and reference invariants. |
| `src/features/agents/runtime-execution-result.test.ts` | Final-result status/reference/checksum/secret-safety invariants. |

## NO CHANGE

| Area | Reason |
| --- | --- |
| `package.json` and lockfile | Existing OpenAI SDK and Zod are reused; no new dependency is authorized. |
| `src/services/openai/client.ts` | Existing server-only client owns a 12-second timeout and zero SDK retries; adapter consumes it. |
| `src/features/mcp/**` | MCP invocation is explicitly out of scope. |
| Supabase schema/migrations and database types | Persistence v1 is in-memory interface only; no durable storage is claimed. |
| Project actions, pages, UI components and Clarification modules | No browser/UI integration belongs to this Core Runtime scope. |
| Existing Request/Start/Step/Result module contracts | The new Runtime uses them; no broad contract rewrite is authorized. |
| Environment files | Provider configuration is read through existing server environment handling only. |

## File-scope safety rules

1. Do not modify the pre-existing Visual Slice, Clarification, operational-document or user QA changes currently present in the working tree.
2. New Runtime code must not import React, Supabase client APIs, MCP code or UI modules.
3. The OpenAI adapter is the only proposed module allowed to import the OpenAI SDK/client.
4. No generated database types, migration files, lockfiles or environment files are permitted.
5. A future implementation diff must be checked against this plan before commit approval.
