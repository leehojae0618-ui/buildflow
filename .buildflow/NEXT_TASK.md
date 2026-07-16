# Next Task

## Status

PLACEHOLDER / NOT APPROVED

## Current Transition

`AGENT-FOUNDATION-001` is CLOSED after PM/CTO Review. There is no active
implementation Sprint until the next candidate is explicitly approved.

## Next Candidate

MCP-FOUNDATION-001 — MCP Server Registry and Secure Gateway Contract

## Candidate Status

NOT APPROVED / NOT SCOPE FROZEN

This document records only the next candidate. It does not authorize
implementation.

## Candidate Notes

`MCP-FOUNDATION-001` is the likely follow-up after AGENT-FOUNDATION-001 because
Agent contracts now need a secure external Tool registry and gateway contract.
The candidate scope must remain Registry / Gateway Contract only until PM/CTO
approval.

Candidate scope:

- MCP Server Registry
- MCP Tool Definition
- Tool discovery Snapshot contract
- Compatibility, version, trust, and health contract
- Credential Reference isolation
- Permission, Risk, Approval policy
- Tool allowlist and server-side input validation contract
- Timeout, retry, idempotency
- Safe result sanitization and Verification Evidence
- BPS MCP dependency mapping

Excluded until separately approved:

- Actual MCP Server connection
- Actual Tool Invocation
- Gateway Runtime execution
- Provider execution
- Marketplace implementation
- UI implementation
- DB migration
- Generated Agent MCP Server publication

Implementation must not start until MCP-FOUNDATION-001 is explicitly approved
and marked APPROVED / SCOPE FROZEN.

Do not start the next Sprint from this placeholder alone.
