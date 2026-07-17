# Architecture Memory

## Current Stack

Confirmed from `docs/project/ARCHITECTURE.md` and `package.json`:

- Next.js
- React
- TypeScript
- Supabase PostgreSQL
- Supabase Authentication
- Supabase RLS
- OpenAI Responses API
- Vitest

## Confirmed System Pipeline

Target pipeline from architecture docs:

```text
User Goal
→ Requirement Engine
→ Capability Engine
→ Blueprint Engine
→ Agent Generator
→ MCP Registry
→ Tool Resolver
→ Agent Validator
→ Runtime Compiler
→ Provider Provisioning
→ Agent Runtime
→ MCP Gateway
→ Functional Verification
→ Package
→ Marketplace
```

## Implemented / Partial / Planned / Future

Based on project docs and observed source files:

| Layer | Status | Evidence |
|---|---|---|
| Requirement Engine | `IMPLEMENTED` | `src/features/requirements/` |
| Architecture Engine | `IMPLEMENTED` | `src/features/architecture/` |
| Planner | `IMPLEMENTED` | `src/features/planner/` |
| Provider Provisioning | `IMPLEMENTED` | `src/features/provisioning/` and live evidence docs |
| Verification Persistence | `IMPLEMENTED` | `src/features/verification/` |
| Package Builder | `IMPLEMENTED` | `src/features/package-builder/` |
| Package Installer | `IMPLEMENTED` | `src/features/package-installer/` |
| Agent Contracts | `IMPLEMENTED` | `src/features/agents/types.ts`, validator/generator |
| MCP Contracts | `IMPLEMENTED` | `src/features/mcp/` |
| Tool Resolution Planner | `IMPLEMENTED` | `src/features/agents/tool-resolution.ts` |
| Agent Validation Gate | `IMPLEMENTED` | `src/features/agents/validation-gate.ts` |
| Agent Package/Profile Contract | `IMPLEMENTED` | `src/features/agents/package-profile.ts` |
| Agent Runtime | `PARTIAL` | representative `ai-inquiry-v1` runtime evidence only |
| MCP Gateway Runtime | `PLANNED` | contract exists; invocation not implemented |
| Runtime Compiler | `PLANNED` | not implemented |
| Marketplace | `FUTURE` | docs only |

## Core Relationships

```text
Capability
→ Blueprint
→ Blocks
→ Tool Resolution
→ Validation Gate
→ Agent Package/Profile
```

- Capability describes what the Agent must do.
- Blueprint constrains the Agent shape.
- Blocks describe Agent components such as model, prompt, trigger, tool, memory,
  guardrail, output, and delivery surface.
- Tool Resolution maps capability needs to MCP Tool candidates.
- Validation Gate blocks unsafe or incomplete combinations before runtime.
- Package/Profile describes a secret-free BPS-compatible portable Agent
  candidate.

## Alignment — Runtime, MCP, Connection, Cost

Safe execution architecture is a product requirement, not an optional add-on.
BuildFlow should preserve this evidence chain:

```text
Package
→ Evidence Report
→ Approval Gate
→ Runtime Execution Request
→ Runtime Execution Start Evidence
→ Runtime Step Evidence
→ Runtime Execution Result
→ Runtime Evidence Bundle
→ Runtime Evidence Report
```

The following statuses must remain separate and must not automatically upgrade
one another:

- Package Readiness
- Approval Status
- Runtime Execution Status
- Runtime Evidence Report Status
- Connection Status
- Credential Status
- Provider Invocation Status
- MCP Invocation Status
- Deployment Status
- Marketplace Status

Provider and MCP are separate architecture layers:

- **Provider** performs model inference or generation such as text generation,
  classification, summarization, structured output, image, or audio work.
- **MCP** is the official external action and tool access axis for Agents, such
  as Gmail, Slack, Drive, GitHub, databases, internal tools, and external SaaS.

MCP long-term architecture:

```text
MCP Server Registration
→ MCP Tool Discovery
→ MCP Tool Definition Snapshot
→ MCP Tool Validation
→ MCP Invocation Request
→ MCP Invocation Start
→ MCP Invocation Result
→ MCP Invocation Evidence
→ MCP Evidence Report
```

Runtime Step Evidence is required for real execution traceability. It records
user-understandable work steps, not private chain-of-thought. Step types may
include `INTERNAL`, `PROVIDER`, `MCP`, `APPROVAL`, `TRANSFORMATION`, and
`VALIDATION`.

Connection & Credential Layer is now a formal architecture layer:

```text
Connection method decision
→ OAuth or permission approval
→ API Key guide when needed
→ secure Credential storage
→ safe connection test
→ Capability availability
→ Credential Reference to Runtime
→ rotation / expiration / disconnect management
```

Credential values must not appear in Package, Evidence, Runtime requests,
Runtime steps, Provider evidence, MCP evidence, logs, or UI display data.
Runtime layers use references such as `credentialReferenceId`, `connectionId`,
`providerId`, `accountReference`, `grantedScopeSummary`, and `connectionStatus`.

Cost Simulation Engine is a long-term architecture component:

```text
Agent structure analysis
→ Block usage
→ Provider call estimate
→ MCP call estimate
→ external API/storage/infrastructure usage
→ frequency simulation
→ price table reference
→ estimated range and confidence
→ user-facing calculation basis
```

Cost Simulation is separate from Runtime Evidence. Estimated cost is not
execution evidence and must not change Runtime status by itself.

## Runtime / Step / Invocation Boundary

Decision lock source:

- `docs/sprints/LIVE-EVIDENCE-AGENT-001/RUNTIME-MCP-BOUNDARY.md`

Identity hierarchy:

```text
RuntimeExecutionRequestId
→ RuntimeExecutionId
→ RuntimeStepId
→ RuntimeStepAttemptId
→ ProviderInvocationId / McpInvocationId
→ ProviderInvocationAttemptId / McpInvocationAttemptId
```

RuntimeExecutionId is not the same as RuntimeExecutionRequestId. A request may
produce multiple executions through retry or manual rerun. Resume keeps the
same RuntimeExecutionId unless the execution is terminal.

Runtime and Step states are separate. Runtime terminal states include
`CANCELLED`, `PARTIAL_SUCCESS`, `SUCCEEDED`, `FAILED`, and `EXPIRED`. Step
terminal states include `SUCCEEDED`, `FAILED`, `SKIPPED`, `CANCELLED`, and
`TIMED_OUT`.

Runtime Preflight is a non-mutating boundary before Runtime Start. It checks
request integrity, approval validity, package/evidence binding, connection and
credential references, capability availability, Provider/MCP readiness,
snapshot consistency, cancellation state, and idempotency conflicts.

Provider Invocation and MCP Invocation are separate:

- Provider Invocation handles model calls, usage facts, latency, normalized
  provider status, and safe result references.
- MCP Invocation handles external tool calls, tool snapshot binding, external
  effect status, idempotency, and safe result references.

Connection, Credential, and Approval are separate. Connection status does not
imply Credential status. Approval does not imply Connection or Credential
readiness.

## Provider Adapter vs MCP Boundary

Provider Adapters provision infrastructure:

- GitHub repository
- Supabase DB/Auth/RLS
- Vercel hosting

MCP is the Agent runtime tool plane:

- Gmail, Slack, Notion, Drive, Calendar, CRM, etc.
- Tool discovery, permission, approval, safe result, and evidence contracts.

MCP does not replace Provider Adapters.

## Runtime and MCP Execution Status

- Actual MCP Tool Invocation: not implemented.
- Gateway Runtime execution: not implemented.
- Runtime Compiler: not implemented.
- Generated Agent MCP Server publication: future design.

## Data / DB Notes

- Supabase is used for projects, auth, verification, credentials, and related
  persisted state.
- This memory migration does not change DB schema or migrations.

## Architecture Conflicts / Notes

- `docs/project/ARCHITECTURE.md` marks some layers as `PLANNED` in older table
  wording, but source files now show Agent Generator, MCP contracts, Tool
  Resolver, Agent Validation, and Package/Profile contracts have been
  implemented through recent Sprints.
- No runtime execution should be inferred from contract implementation.
