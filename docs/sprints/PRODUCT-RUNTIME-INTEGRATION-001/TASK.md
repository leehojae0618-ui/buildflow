# PRODUCT-RUNTIME-INTEGRATION-001

## Status

IMPLEMENTED — INDEPENDENT IMPLEMENTATION REVIEW REQUIRED

## Objective

Compose one authenticated, server-only Product Runtime bridge without changing
Core Runtime, Provider, Evidence, or Approval contracts.

## Scope

- Verify authenticated project ownership.
- Validate the supplied Core request, plan, and safe transient input.
- Atomically consume an approved Runtime Approval.
- Project consumed approval authority into the existing Core preflight shape.
- Invoke `executeMinimumRuntime` once, with the Supabase Evidence repository.
- Return only Runtime result identifiers/checksums and reference-only Package
  Evidence.

## Exclusions

No UI, public API route, request/plan generation, MCP, tools, retries,
streaming, queues, provider contract change, schema/migration change, remote
migration, or deployment.
