# CORE-RUNTIME-001 — Phase 2 Test Plan

Status: READY FOR DOCUMENTATION — PROPOSED TEST FREEZE
Date: 2026-07-26
Execution rule: All automated tests run without a real OpenAI request, real credentials, a database write, or external network access.

## Test strategy

The Runtime Core is verified with injected fakes:

- fake Provider Adapter;
- deterministic identity factory and clock;
- in-memory append-only Evidence sink;
- mocked OpenAI client only inside the OpenAI adapter test;
- existing Request/Preflight/Start/Step/Result builders as contract fixtures.

No test may use `.env.local`, a real OpenAI API key, a live model, a live MCP server or a live database.

## Test matrix

| ID | Case | Fixture / trigger | Expected assertions |
| --- | --- | --- | --- |
| P-01 | Fake Provider success | Valid request/plan/start; fake normalized non-empty output | One `PROVIDER` step and initial attempt succeed; final result is `SUCCEEDED`; output/evidence refs link correctly. |
| P-02 | Single-step restriction | Plan with two steps | Plan invalid; adapter not called. |
| P-03 | Provider-only restriction | MCP/tool/approval/branch/retry fields supplied | Plan invalid; adapter not called. |
| P-04 | Blueprint/Agent mismatch | Blueprint/definition IDs, versions or checksums conflict | Plan invalid with safe code; no Step/Attempt. |
| P-05 | Invalid Runtime request | Existing request builder returns invalid or request binding is invalid | Final invalid projection where constructible; no provider call. |
| P-06 | Invalid Runtime plan | Missing model/prompt/input reference, invalid model block or invalid input checksum | Safe plan error; no provider call. |
| P-07 | Missing provider configuration | Adapter reports configuration missing before call | Runtime `BLOCKED`; no successful output; blocking evidence/reference. |
| P-08 | Authentication failure | Fake adapter returns normalized auth failure | Step/attempt `FAILED`; Runtime `FAILED`; safe error evidence; no retry. |
| P-09 | Provider timeout | Fake adapter returns timeout | Step/attempt `TIMEOUT`; Runtime `TIMED_OUT`; timeout evidence; no retry. |
| P-10 | Provider rate limit | Fake adapter returns rate-limit failure | Step/attempt and Runtime `FAILED`; retry eligibility false. |
| P-11 | Empty provider response | Fake adapter returns `SUCCEEDED` without usable output | Normalize to `PROVIDER_EMPTY_RESPONSE`; no Runtime success. |
| P-12 | Malformed output | Fake adapter output fails planned output validation | Normalize to `PROVIDER_OUTPUT_INVALID`; no Runtime success. |
| P-13 | Cancellation before invocation | Existing preflight/start cancellation indicates cancellation | No adapter call; Runtime/Step/Attempt cancellation behavior follows the scope table. |
| P-14 | Step result construction failure | Inject malformed mandatory reference/transition fixture | Fail closed; no fabricated valid terminal Step; safe construction error. |
| P-15 | Evidence construction failure | Evidence factory rejects a safe linkage/checksum | Provider success cannot yield Runtime success; terminal failure references are safe. |
| P-16 | Evidence write failure | In-memory sink throws a classified failure | Runtime fails closed; no raw provider data in returned error. |
| P-17 | Final result construction failure | Force an invalid final-result reference combination | No fabricated `RuntimeExecutionResult`; safe finalization envelope; prior valid evidence retained. |
| P-18 | Result linkage | Successful execution | Request → preflight → start → step → attempt → evidence → result IDs/checksums bind consistently. |
| P-19 | Usage/latency facts | Fake provider success with token and timing values | Values appear only in safe provider/evidence metadata; do not establish success independently. |
| P-20 | No secret leakage | Prompt/input/output/error fixtures contain secret-shaped values and forbidden keys | Plan/evidence/result reject or redact; no raw field is returned. |
| P-21 | No retry/resume | Transient provider failure and a second-attempt request | Adapter is called once; initial attempt is number 1; no retry attempt/resume path is created. |
| P-22 | Determinism | Same valid inputs/fakes/IDs/clock twice | Matching plan, reference/linkage and normalized result structure. |
| P-23 | OpenAI adapter mapping | Mock existing OpenAI client response and known error forms | SDK objects do not escape; safe normalized result/error/latency only. |
| P-24 | OpenAI timeout/abort boundary | Mock timeout and, where supported, abort signal forwarding | Timeout maps to provider timeout; no SDK exception leaks. |
| R-01 | Request regression | Existing `runtime-execution-request.test.ts` | Existing contract tests remain green unchanged. |
| R-02 | Start regression | Existing `runtime-execution-start.test.ts` | Existing preflight/start contract tests remain green unchanged. |
| R-03 | Step regression | Existing `runtime-execution-step.test.ts` | Existing state/attempt transition tests remain green unchanged. |
| R-04 | Result regression | Existing `runtime-execution-result.test.ts` | Existing final Result validation tests remain green unchanged. |

## Planned minimum coverage

- 24 focused test cases in the matrix above.
- At least 20 new focused assertions/tests across the proposed five test files; the exact count may exceed this as parameterized failure combinations are added.
- All existing Runtime contract tests must remain unchanged and passing.
- Full repository suite, typecheck, lint, production build, `git diff --check`, and secret-shaped-value scan are required before any review/commit gate.

## Status-transition assertions

```text
Golden path
Step:    READY → RUNNING → SUCCESS
Attempt: READY → RUNNING → SUCCESS
Result:  SUCCEEDED

Provider failure
Step:    READY → RUNNING → FAILED
Attempt: READY → RUNNING → FAILED
Result:  FAILED

Provider timeout
Step:    READY → RUNNING → TIMEOUT
Attempt: READY → RUNNING → TIMEOUT
Result:  TIMED_OUT

Pre-invocation block/cancel
Adapter call: never made
Result: BLOCKED or CANCELLED according to validated preflight/start state
```

## External API smoke test (separate approval required)

An external OpenAI smoke test is **not** part of this scope. If separately approved after automated tests, it must use a controlled non-production project/credential boundary and verify only:

1. server-side provider configuration is present;
2. one safe, non-sensitive bounded input invokes the selected model;
3. a safe output checksum/usage/latency/evidence reference is produced;
4. raw prompt, raw output, authorization data and SDK stack do not appear in application logs or returned records.

It requires a separate explicit authority because it can incur cost and reaches an external provider.

## Rollback and failure-test rule

Every failure test must prove fail-closed behavior: no provider invocation after validation/preflight rejection, no valid Runtime success without evidence, no retry, and no raw secret/payload leakage. Because persistence v1 is in-memory only, rollback means discarding the in-memory execution fixture; no database rollback or migration is involved.
