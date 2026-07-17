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
