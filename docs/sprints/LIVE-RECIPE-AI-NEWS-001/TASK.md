# LIVE-RECIPE-AI-NEWS-001 Task

## Authority

```text
GUARDED C3 SAFETY REMEDIATION: APPROVED
COMMIT: NOT APPROVED
PUSH: NOT APPROVED
DEPLOY: NOT APPROVED
REAL NEWS/RSS FETCH: NOT APPROVED IN THIS REMEDIATION GATE
AI PROVIDER CALL: NOT APPROVED IN THIS REMEDIATION GATE
SLACK WRITE: NOT APPROVED IN THIS REMEDIATION GATE
SCHEDULER ACTIVATION: NOT APPROVED
```

## Requirements

- Add a local, port-based manual Recipe runner.
- Keep all external boundaries injectable.
- Default local implementation must use fake inputs/outputs only.
- Evidence must label local-only execution as `SIMULATED`, never live.
- The representative message destination remains the verified Slack path, but
  actual Slack output is prohibited until separately approved.
- Add real adapters without turning them into default background execution.
- Keep C1/C2 opt-in live tests separate from the non-live guarded C3 tests.
- Route C3 only through the explicit-approval, idempotent Live Recipe service.
- Require the configured approved Slack account and channel to match before any
  digest write adapter call.

## First Manual E2E Candidate

```text
Goal: 매일 AI 뉴스를 찾아서 중요한 것만 요약해서 Slack으로 보내줘
First source: one approved RSS/news source, selected later
AI provider: selected later
Output: Pipedream-connected aiwork #새-채널, selected later
Mode: manual one-shot first; Scheduler later
```

## Approved C1/C2 Implementation Details

```text
News source: OpenAI official News RSS
AI provider: Groq
Model: openai/gpt-oss-20b
Slack write: NOT PERFORMED
Scheduler: NOT PERFORMED
Commit / Push / Deploy: NOT AUTHORIZED
```

## Composite Manual Recipe E2E — Scope (2026-08-16)

```text
RISK TIER: R2 -> R3 (implementation R2; live external write remains its own R3 gate)
SCOPE + IMPLEMENTATION AUTHORITY: APPROVED 2026-08-16
LIVE COMPOSITE EXECUTION AUTHORITY: NOT APPROVED — separate gate
COMMIT: NOT APPROVED (this Scope covers implementation + test only)
PUSH: NOT APPROVED
```

Goal: connect C1 (News fetch) -> C2 (Groq summary) -> C3 (guarded Slack write)
as one continuous execution path, reusing `runApprovedSlackDigestWrite` so the
composite path carries the exact same destination-lock, idempotency, kill
switch, and non-production guards already verified for C3 in isolation.

Scope:

- `runNewsToGroqToSlackGate` (`src/features/live-ai-news/real-adapters.ts`) is
  the single-path function; it already existed with mocked-adapter test
  coverage (`real-adapters.test.ts`) and is the composite implementation.
- Add one new opt-in live test in `real-adapters.live.test.ts`, gated by its
  own distinct flag `BUILDFLOW_LIVE_COMPOSITE_RECIPE_E2E=1` (separate from the
  individual C1/C2/C3 gate flags), that calls `runNewsToGroqToSlackGate` with
  real `OpenAiNewsRssSource`, real `GroqSummaryAdapter`, and the real
  `runApprovedSlackDigestWrite` path (no adapter/environment fakes injected).
- The test remains skipped by default; it also still requires the existing
  service-level guards (`BUILDFLOW_LIVE_CONNECT_ENABLED`,
  `BUILDFLOW_LIVE_SLACK_WRITE_ENABLED`, approved account/channel match,
  non-production environment) to actually perform a write.
- No change to `runApprovedSlackDigestWrite` or any existing guard logic.

Not in scope: actually running the composite live test with the opt-in flags
set to true (that live execution is its own separate approval), Scheduler,
Commit, Push, Deploy, additional Slack writes, DB persistence.
