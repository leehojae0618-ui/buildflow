# FIRST-LIVE-RECIPE-E2E-001 Environment Contract

## Server-only Pipedream Configuration

```text
PIPEDREAM_CLIENT_ID=<server-only>
PIPEDREAM_CLIENT_SECRET=<server-only secret>
PIPEDREAM_PROJECT_ID=<server-only>
PIPEDREAM_ENVIRONMENT=development
```

## Live Kill Switches

```text
BUILDFLOW_LIVE_CONNECT_ENABLED=false
BUILDFLOW_LIVE_SLACK_WRITE_ENABLED=false
```

Both switches default to `false`. `BUILDFLOW_LIVE_TEST_USER_ID` is an optional
server-only development fallback; it is rejected in production.

Secrets must not be committed. Do not use `NEXT_PUBLIC_*` for Pipedream values.
Only the Pipedream `development` environment is permitted in Phase A.
Production activation requires a separate approval.
