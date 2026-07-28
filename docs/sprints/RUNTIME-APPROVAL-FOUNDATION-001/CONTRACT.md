# Runtime Approval Foundation Contract

## Scope

This contract authorizes one persisted approval for one Core Runtime Provider
execution. It does not invoke a provider, expose UI, or modify Core Runtime.

## Canonical binding v1

`bindingChecksum` is SHA-256 over UTF-8 JSON with recursively lexicographically
sorted object keys. Arrays retain their declared order. The exact safe object is:

```text
projectId
userId
scope = CORE_RUNTIME_PROVIDER_EXECUTION
runtimeExecutionRequestId
runtimeExecutionRequestChecksum
runtimePlanId
runtimePlanChecksum
provider = openai
model
safeInputChecksum
```

No prompt text, raw output, credential, provider payload, SDK payload, stack
trace, or opaque metadata participates in this serialization.

## Expiry

Closed Beta uses a fixed server-generated 15-minute expiry. There is no caller,
administrator, or UI override in v1. Changing this policy requires a new scope
decision and migration review.

## Consumption

An approval is single-use. A service-role-only RPC atomically verifies ownership,
scope, status, expiry, and every binding field before changing `APPROVED` to
`CONSUMED`. Provider failure does not restore approval. A later attempt requires
a new Runtime request and a new approval.

## Core compatibility projection

The persisted scope remains `CORE_RUNTIME_PROVIDER_EXECUTION`. In the later
Product Runtime bridge only, a successfully consumed record projects to the
existing Core preflight scope `RUNTIME_EXECUTION`; it is never treated as MCP,
deployment, or general provider permission. This is an adapter mapping, not a
change to Core Runtime contracts.

## Audit

State transitions are append-only `runtime_approval_events`. Runtime Evidence
continues to use its existing `approval_request_id` reference; no raw evidence
or provider data is copied into approval records.
