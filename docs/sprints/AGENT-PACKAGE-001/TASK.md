# AGENT-PACKAGE-001 — Task

## Status

APPROVED / SCOPE FROZEN

## Title

Agent Package Profile and Export Contract

## Goal

Define the BPS-compatible AI Agent Package/Profile contract and secret-free
export readiness validation layer.

This Sprint turns a validated Agent Definition, Tool Resolution Plan, and
Validation Gate result into a portable Package/Profile description. It does not
write package archives, publish to Marketplace, invoke MCP Tools, execute
Providers, or modify Installer behavior.

## Product Context

BuildFlow is an AI Agent Builder / AI Agent Factory. The completed Agent
foundation sequence now provides:

- Agent Definition contracts
- MCP Registry and Tool contracts
- Agent Tool Resolution Planner
- Agent Validation Gate

The next product boundary is Package readiness: BuildFlow must know whether an
Agent can be represented as a secret-free, reviewable BPS-compatible profile
before any Marketplace or export workflow claims that it is distributable.

## Implementation Scope

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

## First Safe Implementation Unit

Target files:

- `src/features/agents/package-profile.ts`
- `src/features/agents/package-profile.test.ts`
- `src/features/agents/index.ts`

Allowed work:

- TypeScript types
- Pure profile/readiness validation functions
- Deterministic test fixtures
- Unit tests

## Explicitly Out of Scope

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
- Automatic Commit
- Push

## Security Rules

- Secret values must never be represented in package profiles, tests, logs,
  snapshots, errors, or evidence.
- Package readiness checks must not read Vault or Provider Credential state.
- Package readiness checks must not execute Tools, Providers, Runtime, or
  external services.
- MCP dependencies must be declared as references and requirements, not as live
  connections.
- Marketplace-ready, published, or installable status must not be claimed by
  this Sprint.

## Definition of Done

- Agent Package/Profile types implemented
- Secret-free readiness validator implemented
- Unit tests PASS
- `npm test` PASS
- `npm run lint` PASS
- `npm run typecheck` PASS
- `npm run build` PASS
- `git diff --check` PASS
- Secret pattern scan PASS
- Sprint Report written
- PM/CTO Review requested
- Commit not created until explicit Commit Approval
- Push not performed until explicit Push Approval
