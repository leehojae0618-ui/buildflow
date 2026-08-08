# LV5-NO-KEY-REMEDIATION-001 Task

## Status

```text
IMPLEMENTATION AUTHORIZED
REAL N8N/MAKE IMPORT OR EXECUTION: NOT AUTHORIZED
CREDENTIAL, API, DB, COMMIT, PUSH, DEPLOY: NOT AUTHORIZED
```

## Objective

Correct only the observed No-Key QA gaps: produce a credential-free n8n-shaped
minimum workflow, validate its static Import readiness, provide a Supabase-free
Guest Lab, and complete the local user-submission to Evidence and Verdict flow.

## Scope

- Deterministic n8n workflow export with inactive built-in nodes and main-array
  connections.
- Static Import Readiness validator. A passing result is never an actual n8n
  Import claim.
- `/app/no-key-builder-lab`, which uses only local fixtures and has no DB,
  Supabase user lookup, or external API dependency.
- Interactive local result form, safe `USER_SUBMITTED` Evidence/Verdict
  rendering, and secret-safe verification JSON download.
- Make manual-guide regression coverage only.

## Non-goals

- n8n Import, Make Scenario creation, Slack delivery, login, credential use,
  OAuth, Provider/MCP invocation, database work, deployment, commit, or push.
