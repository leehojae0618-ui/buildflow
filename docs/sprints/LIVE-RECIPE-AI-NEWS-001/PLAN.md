# LIVE-RECIPE-AI-NEWS-001 Plan

## Status

```text
STATUS: ACTIVE / GUARDED C3 SAFETY REMEDIATION
COMMIT / PUSH / DEPLOY: NOT AUTHORIZED
RSS / NEWS API EXECUTION: APPROVED FOR CONTROLLED GATE C1 ONLY
AI PROVIDER CALL: APPROVED FOR CONTROLLED GATE C2 ONLY WHEN GROQ_API_KEY IS PRESENT
SLACK WRITE: NO NEW EXECUTION AUTHORIZED
SCHEDULER: NOT AUTHORIZED
```

## Objective

Prepare the representative Recipe path for a manual one-shot E2E:

```text
news source
→ normalization
→ importance selection
→ AI summary
→ verified Slack output
```

This Sprint starts with local contracts and fake adapters only. It must not
perform real RSS/news fetches, Provider calls, Slack writes, workflow creation,
or scheduling without a later explicit live execution approval.

Update — 2026-08-15: Product Owner approved the next local implementation and
controlled external verification scope for Gate C1/C2. This approval does not
include a new Slack write, Scheduler, Commit, Push, Deploy, DB, Production, or
any external API outside OpenAI News RSS and Groq summary verification.

## In Scope

- Manual-run Recipe contract for AI news to Slack.
- Port boundaries for news source, summarizer, and Slack output.
- Deterministic normalization and item selection.
- Fake-adapter validation proving execution order and approval boundaries.
- Evidence shape that distinguishes local simulation from live execution.
- Real OpenAI News RSS source adapter for controlled Gate C1.
- Groq summary adapter using OpenAI-compatible API configuration for controlled
  Gate C2.
- Live smoke tests that are opt-in by environment flag and keep Slack write as
  `NOT_PERFORMED`.
- Guarded C3 remediation: fixed approved destination, explicit approval, and
  idempotent service routing for any later retry.

## Out of Scope

- Scheduler or recurring run.
- Production Pipedream.
- Real RSS/news HTTP request beyond controlled OpenAI News RSS Gate C1.
- Real AI Provider request beyond controlled Groq Gate C2.
- New Slack write in this remediation gate.
- DB migration or persistent Evidence storage.
- Commit, Push, Vercel Deploy, or Production changes.

## Exit Criteria For Local Start

- Focused local tests pass with fake adapters.
- The local result reports `SIMULATED` or `NOT_PERFORMED` for external actions.
- No live Provider, external API, Slack write, Scheduler, DB, Push, or Deploy is
  performed.

## Controlled Gate Plan

```text
Gate C1
OpenAI News RSS fetch
→ select recent/high-signal items
→ evidence: Slack write NOT_PERFORMED

Gate C2
OpenAI News RSS fetch
→ Groq openai/gpt-oss-20b summary
→ evidence: Slack write NOT_PERFORMED

Gate C3
News → Groq → Slack
→ external side effect OBSERVED / SUCCEEDED in an earlier approved retry
→ guarded BuildFlow execution NOT VERIFIED
→ no retry authorized in this remediation gate
```

## Source Decisions

- News Source: OpenAI official News RSS (`https://openai.com/news/rss.xml`).
- AI Provider: Groq OpenAI-compatible API.
- Model: `openai/gpt-oss-20b`.
