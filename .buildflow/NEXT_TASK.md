# Next Task

## Status

PLACEHOLDER / NOT APPROVED

## Current Transition

`AGENT-GENERATOR-001` is CLOSED after PM/CTO Review. There is no active
implementation Sprint until the next candidate is explicitly approved.

## Next Candidate

AGENT-VALIDATION-001 — Agent Definition and Tool Resolution Validation Gate

## Candidate Status

NOT APPROVED / NOT SCOPE FROZEN

This document records only the next candidate. It does not authorize
implementation.

## Candidate Notes

`AGENT-VALIDATION-001` is the likely follow-up after AGENT-GENERATOR-001 because
Agent Definition contracts, MCP Tool contracts, and Tool Resolution Plans now
need a validation gate before runtime execution or READY decisions.

Candidate topics for later review:

- Agent Definition validation against Agent Blueprint
- Tool Resolution Plan validation
- Required capability coverage validation
- MCP Tool permission and risk validation by contract
- Approval requirement coverage validation
- Credential/user-action unresolved dependency validation
- Safe READY-blocking reasons
- Pure validation functions
- Unit tests

Excluded until separately approved:

- Actual MCP Tool Invocation
- Gateway Runtime execution
- Provider execution
- Marketplace implementation
- UI implementation
- DB migration
- Provisioning execution path integration
- Live Credential or Vault access
- Runtime Compiler integration

Implementation must not start until AGENT-VALIDATION-001 is explicitly approved
and marked APPROVED / SCOPE FROZEN.

Do not start the next Sprint from this placeholder alone.
