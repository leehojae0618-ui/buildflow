# RECIPE-FIRST-PRODUCT-RESET-001 Plan

## Status

```text
STATUS: ACTIVE / LOCAL IMPLEMENTATION ONLY
COMMIT / PUSH / DEPLOY: NOT AUTHORIZED
LIVE PROVIDER / API / OAUTH / EXTERNAL ENGINE / DB: NOT AUTHORIZED
```

## Objective

Make Recipe-First the primary BuildFlow entry: deterministic natural-language
intent is matched to a provenance-bearing canonical Recipe catalog, ranked with
visible policy, and shown with a no-network connection/build preview.

## In Scope

- Canonical Recipe and Service Capability schemas.
- At least 20 curated, generalized Recipe seeds with source/license metadata.
- Deterministic intent analysis, retrieval, explainable ranking, and Top 3 UI.
- Preview-only adapters for Pipedream, Make, Activepieces, and n8n.
- Recipe-first root entry while preserving BF0 as Legacy.

## Exclusions

No Provider/API/OAuth request, credential storage, workflow creation/execution,
DB migration, MCP invocation, Commit, Push, Deploy, Marketplace, Billing,
Multi-Agent, or fine-tuning.
