# LIVE-EVIDENCE-AGENT-001 — Task Draft

## Status

DRAFT / NOT APPROVED / NOT SCOPE FROZEN

## Roadmap Alignment

AGENT-EVIDENCE-001

## Title

AI Agent Live Evidence and Package Readiness QA

## Goal

Run an evidence-first review of the representative AI Agent path and confirm
whether BuildFlow can produce safe, verifiable live Evidence for an Agent build,
deployment, verification, and package-readiness flow.

This draft does not authorize live execution, deployment, MCP Tool Invocation,
Provider actions, Credential access, Vault access, or implementation.

## Product Context

BuildFlow has completed the Agent foundation sequence:

- Agent Definition contracts
- MCP Registry and Tool contracts
- Agent Tool Resolution Planner
- Agent Validation Gate
- BPS-compatible Agent Package/Profile contract

The next question is not whether the contracts exist. The next question is
whether a representative AI Agent path can produce trustworthy Evidence without
mock success, placeholder READY, or unsafe secret exposure.

## Candidate Scope

### Requires Live Action

The following items require explicit PM/CTO approval before they can run:

- Provider Credential status confirmation
- GitHub, Supabase, Vercel, and OpenAI live readiness checks
- Any repository creation, update, or file upload
- Any Supabase schema, RLS, Auth, or data operation
- Any Vercel project creation, environment update, deployment, or domain action
- Any OpenAI request that consumes quota
- Any deployed URL health check
- Any functional Agent response test against a live deployment
- Any persisted Verification Evidence update
- Any Package/Profile readiness check that depends on live Evidence

### Can Be Done With Documents or Fixtures

The following items can be prepared without live action:

- Evidence checklist
- PASS / BLOCKED / NOT SUPPORTED criteria
- Secret-safe reporting template
- Approval boundary checklist
- Credential readiness checklist without reading secret values
- Cost and quota risk checklist
- Existing LIVE-EVIDENCE-001/002 Evidence comparison
- Package readiness vs Marketplace publish readiness distinction
- User-action checklist for blocked live steps

## Live Action Boundary

No live action is allowed until this Sprint is explicitly approved and scope
frozen.

Live action includes, but is not limited to:

- External Provider API calls
- Provider resource creation, update, delete, or deployment
- OpenAI calls that consume quota
- MCP Tool Invocation
- Vault reads
- Credential validation against a Provider
- Database writes outside normal local test execution
- Verification result persistence against a live Project

## Credential / Vault / Secret Boundary

- Provider Credential values must never be read, printed, logged, copied into
  documents, or included in prompts, snapshots, errors, events, reports, or test
  fixtures.
- Vault reads are prohibited before explicit approval.
- Credential readiness may only be described as a checklist item before approval.
- If live Credential checks are approved later, reports must use only safe
  status values such as `VALID`, `MISSING`, `EXPIRED`, `INSUFFICIENT_SCOPE`, or
  `BLOCKED`.

## Cost Boundary

Cost-incurring actions require separate explicit approval.

Examples:

- OpenAI request quota usage
- Vercel paid feature usage
- Provider operations that can trigger usage-based billing
- External service calls with per-call pricing

If cost approval is missing, the Sprint result must be `BLOCKED`, not
placeholder success.

## MCP Tool Boundary

MCP Tool Invocation is excluded by default.

MCP Tool Invocation may only be included if PM/CTO explicitly approves:

- target MCP Server
- target Tool
- Capability
- Credential boundary
- Permission and risk class
- Approval requirement
- Safe result and Evidence fields

Without that approval, MCP-related checks remain contract and package-readiness
checks only.

## Draft Evidence Checklist

### Agent Build Evidence

- Representative Agent target identified
- Requirement / Blueprint / Agent Definition reference captured
- Validation Gate result captured
- Tool Resolution / Package Profile readiness result captured

### Provider Evidence

- GitHub state: PASS / BLOCKED / NOT SUPPORTED
- Supabase state: PASS / BLOCKED / NOT SUPPORTED
- Vercel state: PASS / BLOCKED / NOT SUPPORTED
- OpenAI state: PASS / BLOCKED / NOT SUPPORTED

### Runtime Evidence

- Deployment URL reachable: PASS / BLOCKED / NOT SUPPORTED
- Health check: PASS / BLOCKED / NOT SUPPORTED
- Functional Agent response: PASS / BLOCKED / NOT SUPPORTED
- Verification persistence: PASS / BLOCKED / NOT SUPPORTED

### Package Evidence

- Agent Package/Profile readiness: PASS / BLOCKED / NOT SUPPORTED
- Secret-free package profile: PASS / BLOCKED / NOT SUPPORTED
- Marketplace publish readiness: NOT SUPPORTED unless separately approved

## Draft Final Judgement Criteria

### PASS

- All approved live actions complete successfully.
- Required Evidence is captured safely.
- No secret or raw Provider response is stored.
- Verification and health checks pass.
- Package/Profile readiness passes where supported.

### BLOCKED

- Required Credential is missing, expired, or has insufficient scope.
- Required user approval is missing.
- Cost approval is missing.
- Provider account policy requires user action.
- Live environment is unavailable.
- Verification cannot be completed safely.

### NOT SUPPORTED

- Requested action is outside the current BuildFlow capability.
- MCP Tool Invocation is requested without approved MCP execution scope.
- Marketplace publish readiness is requested before Marketplace implementation.
- Package archive export is requested before approved export implementation.

## Secret-Safe Reporting Template

Reports must use the following style:

```text
Provider: GitHub
Status: PASS / BLOCKED / NOT SUPPORTED
Evidence: safe repository identifier or URL only if approved for reporting
Secret Exposure: none
User Action Required: none / describe safe action
Next Step: continue / retry / request approval / stop
```

Never include:

- API keys
- OAuth tokens
- Refresh tokens
- Provider raw responses
- Private keys
- Full environment dumps
- Database connection strings
- User personal data

## Approval Questions Before Activation

1. Should this Sprint allow actual live execution and deployment, or only
   checklist-based QA against existing Evidence?
2. Which BuildFlow Project or representative Agent is in scope?
3. Which test-only Provider Credentials may be used?
4. Which external actions are approved?
5. Are any cost-incurring actions approved?
6. Is MCP Tool Invocation included or deferred?
7. Should Package/Profile readiness be evaluated only from existing contracts or
   connected to live Evidence?

## Explicitly Out of Scope Until Approved

- Implementation
- Commit
- Push
- Deployment
- Provider execution
- MCP Tool Invocation
- Gateway Runtime implementation
- Runtime implementation
- Marketplace implementation
- Package publishing
- DB migration
- UI implementation
- Credential or Vault value exposure
- Mock success
- Placeholder READY
