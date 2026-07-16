# AGENT-PACKAGE-001 — Report

## Status

REVIEW

## Summary

AGENT-PACKAGE-001 defines the contract layer that lets BuildFlow represent a
validated Agent as a BPS-compatible AI Agent Package/Profile candidate.

The implementation is intentionally limited to pure TypeScript contracts and
readiness validation. It does not export files, write archives, publish to a
Marketplace, invoke MCP Tools, execute Providers, read Vault, or modify
Installer behavior.

## Completed Scope

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

## Implementation Files

- `src/features/agents/package-profile.ts`
- `src/features/agents/package-profile.test.ts`
- `src/features/agents/index.ts`

## Contract Behavior

The new package profile layer provides:

- `AgentPackageProfile`
- `AgentPackageProfileInput`
- `AgentPackageCredentialReference`
- `AgentPackageMcpDependency`
- `AgentPackagePermissionRequirement`
- `AgentPackageVerificationRule`
- `AgentPackageFallbackPolicy`
- `createAgentPackageProfile`
- `validateAgentPackageReadiness`

The profile captures only safe, portable declarations:

- Agent identity and Blueprint reference
- Delivery and interface modes
- Capability declarations
- Provider dependency references
- MCP Server and Tool dependency references
- Credential references without secret values
- Permission, risk, cost, and approval requirements
- Verification and fallback policy
- Export safety flags

## Readiness Gate

`validateAgentPackageReadiness` blocks export readiness when:

- package id, package version, or BuildFlow version is missing
- Agent Validation Gate is not ready
- required Tool dependencies remain unresolved
- selected MCP Tool contracts are missing
- selected MCP Tool safe result policy allows raw result storage
- credential references are not reference-only
- secret-like values are detected in the profile
- export safety policy indicates archive writing, Marketplace publishing, raw
  Provider responses, or live Credential values

## Explicitly Out of Scope

- Marketplace implementation: NOT INCLUDED
- Package publishing: NOT INCLUDED
- UI implementation: NOT INCLUDED
- DB migration: NOT INCLUDED
- Actual MCP Tool Invocation: NOT INCLUDED
- Gateway Runtime execution: NOT INCLUDED
- Provider execution: NOT INCLUDED
- Live Credential or Vault access: NOT INCLUDED
- Agent Runtime Compiler: NOT INCLUDED
- BPS archive writing or file export: NOT INCLUDED
- Installer implementation changes: NOT INCLUDED

## Security Review

- No Secret values are stored in package profile contracts.
- Credential requirements are represented as references only.
- MCP dependencies are declared, not invoked.
- Raw Tool results and Provider responses are explicitly excluded.
- Export safety defaults block claims that this Sprint wrote an archive or
  published a Marketplace listing.
- Secret-like value detection is included as a defensive validation check.

## Quality Gate

PASS.

Final checks:

- `npx vitest run src/features/agents/package-profile.test.ts`: PASS
  - 1 file passed
  - 7 tests passed
- `npm test`: PASS
  - 44 files passed
  - 210 tests passed
- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- Secret pattern scan: PASS

## MVP Impact

Qualitative impact: high for Agent Marketplace readiness.

AGENT-PACKAGE-001 does not make Agents publishable yet, but it creates the
missing contract boundary between validated Agent definitions and future
BPS-compatible export, install, and Marketplace workflows. This reduces the risk
of claiming that an Agent is distributable before dependencies, permissions,
verification rules, and secret-free export safety are explicit.

The impact is not quantified because BuildFlow does not yet have a measured
package conversion or Marketplace readiness metric.

## Remaining Work

Follow-up Sprints must still implement:

- BPS archive/file export for Agent Packages
- Installer support for the Agent Package/Profile extension if needed
- Marketplace listing and publish policy
- Package Evidence freshness and trust display
- Live Package Export Evidence

## PM/CTO Review Request

AGENT-PACKAGE-001 is ready for PM/CTO Review.
