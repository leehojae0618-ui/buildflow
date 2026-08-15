# FIRST-LIVE-RECIPE-E2E-001 Contract

## Connection States

`DISABLED`, `NOT_CONNECTED`, `CONNECT_LINK_READY`, `AUTHORIZING`, `RETURNED_UNVERIFIED`, `CONNECTED_VERIFIED`, and `FAILED` are distinct. OAuth redirect return never implies `CONNECTED_VERIFIED`; account verification is a later live gate.

## Write Contract

`user click -> explicit confirmation -> server validation -> write kill switch -> verified Slack account -> idempotency -> one action`.

An OAuth return remains `RETURNED_UNVERIFIED`. `CONNECTED_VERIFIED` is derived
only after `listSlackAccounts()` reports at least one usable Slack account.

## Phase-A Remediation

Focused Audit finding: P1 — Slack account verification before external write.
Remediation is implemented locally; live external execution remains unauthorized.

Failed request IDs remain blocked. An explicit retry must use a new request ID
and therefore starts a new attempt; Recipe ID is not an idempotency key.

The Phase-A action candidate is `slack-send-message-to-channel` with no pinned version. Metadata resolution and execution are deferred to the separately approved live gate.

## Evidence Contract

Evidence carries only attempt, Recipe, engine, service, action type, safe user/external references, timestamps, status, and failure code. Credentials and raw tokens are prohibited.
