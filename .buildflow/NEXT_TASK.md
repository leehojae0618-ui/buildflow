# Next Task

## Status

NEXT CANDIDATE / NOT APPROVED / NOT SCOPE FROZEN

## Candidate

AGENT-PACKAGE-001

## Title

Agent Package Profile and Export Contract

## Candidate Status

NOT APPROVED / NOT SCOPE FROZEN

This document is a candidate placeholder only. It does not authorize
implementation. AGENT-PACKAGE-001 must receive explicit PM/CTO approval and
Scope Frozen status before it can move to `.buildflow/CURRENT_TASK.md`.

## Context

The completed Agent sequence now includes:

- Agent Definition contracts
- MCP Registry and Tool contracts
- Agent Tool Resolution Planner
- Agent Validation Gate

The natural next step is to define how a validated Agent becomes a
BPS-compatible, secret-free, exportable Agent Package/Profile for later
Marketplace sharing.

## Candidate Scope Draft

- BPS AI Agent Profile contract
- Agent Definition package metadata
- MCP Server and Tool dependency declarations
- Capability and Interface declarations
- Credential Definition references
- Permission, Risk, and Approval Requirement declarations
- Verification Rule and Fallback Policy declarations
- Secret-free package validation contract
- Package export readiness checks as pure functions
- Unit tests

## Candidate Exclusions

- Marketplace implementation
- Package publishing
- UI implementation
- DB migration
- Actual MCP Tool Invocation
- Gateway Runtime execution
- Provider execution
- Live Credential or Vault access
- Agent Runtime Compiler
- BPS archive writing or file export
- Installer implementation changes

## Candidate Notes

AGENT-PACKAGE-001 should remain contract and validation focused unless PM/CTO
approval explicitly expands the scope. It should not claim that an Agent is
published or Marketplace-ready without separate Evidence and Marketplace
Sprints.
