# FIRST-LIVE-RECIPE-E2E-001 Task

## Authority

LOCAL IMPLEMENTATION: APPROVED

COMMIT, PUSH, DEPLOY, PIPEDREAM API, SLACK OAUTH, SLACK WRITE, PROVIDER, DB/MIGRATION, and MCP: NOT APPROVED.

## Requirements

Use `@pipedream/sdk` in a server-only real adapter. Pipedream project environment must be `development`; production must be rejected. Browser input must never provide `externalUserId`. Both Live switches default to false and block before an adapter invocation.

## Boundaries

Connect Link preparation may return only a link URL, expiration, and safe reference. Raw Connect tokens, OAuth credentials, authorization headers, and client secrets must never be returned, stored, or logged.
