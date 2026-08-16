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
