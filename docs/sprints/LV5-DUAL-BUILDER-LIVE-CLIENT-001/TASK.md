# LV5-DUAL-BUILDER-LIVE-CLIENT-001 Task

## Status

```text
IMPLEMENTATION AUTHORIZED
REAL MAKE / N8N API: NOT APPROVED
CREDENTIAL USE: NOT APPROVED
DB / MIGRATION: NOT APPROVED
COMMIT / PUSH / DEPLOY: NOT APPROVED
```

## Objective

Add isolated Make and n8n Live Client Foundation contracts that support only
deterministic Dry-run previews and Mock Transport tests. Reuse the committed
external-builder Preview and Verification Loop contracts without changing them.

## Scope

- New shared client contracts, Mock Transport, input/response validation,
  retry/polling policy, error normalization, and dry-run projection.
- New Make/n8n request preparation and mock-only response handling.
- New independent `/app/builder-client-lab` route, tests, and Report.

## Explicit limits

No production transport, `fetch`, credential resolution, Make/n8n request,
Scenario/Workflow creation, activation, execution, database work, or external
Evidence source is implemented or claimed.
