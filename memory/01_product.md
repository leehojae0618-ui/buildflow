# Product Memory

## Product Definition

BuildFlow is an **AI Agent Factory**.

BuildFlow is not returning to the older WebApp Builder or generic Platform
Builder direction. Generic Web App and CRUD work remains preserved as technical
Evidence and regression material, but the active product promise is AI Agent
automatic build, deployment, verification, and BPS Package sharing.

## Problem

Non-developer users want to describe a business outcome and receive a working,
verified AI Agent without designing workflows, choosing low-level Providers, or
manually wiring execution tools.

BuildFlow should let users delegate the work to an AI development system:

```text
Goal
→ Requirement
→ Agent Blueprint
→ Tool Resolution
→ Validation
→ Package / Evidence
→ Marketplace-ready path later
```

## Core User Outcomes

- Describe an Agent goal in plain language.
- Let BuildFlow ask only necessary clarification questions.
- Review capability, credential, cost, permission, and approval requirements.
- Receive evidence-backed readiness decisions.
- Export or share AI Agent Packages only after safe validation and evidence.

## Product Principles

- **Outcome First**: show the user what they will get before showing technical
  details.
- **Capability First**: define what the Agent must do before choosing a Tool or
  Provider.
- **Blueprint First**: bounded, reviewed Agent Blueprints are preferred over
  unrestricted natural-language generation.
- **Evidence First**: READY and package readiness require safe, inspectable
  evidence.
- **Approval First**: cost, external writes, public changes, permissions, and
  destructive actions require human approval.
- **MCP First**: external runtime actions should use validated MCP capability
  contracts when appropriate.
- **Human Approval Required**: the LLM must not directly execute arbitrary
  commands or tools.

## Current Approved Product Scope

Confirmed from `.buildflow`, `docs/project/ROADMAP.md`,
`docs/project/ARCHITECTURE.md`, and recent sprint reports:

- Agent Capability Contract: `IMPLEMENTED`
- Block Contract: `IMPLEMENTED`
- Blueprint Contract: `IMPLEMENTED`
- Agent Definition Contract: `IMPLEMENTED`
- MCP Registry Contract: `IMPLEMENTED`
- MCP Tool Contract: `IMPLEMENTED`
- Tool Resolution Planner: `IMPLEMENTED`
- Validation Gate: `IMPLEMENTED`
- Agent Package Contract: `IMPLEMENTED`
- Agent Profile Contract: `IMPLEMENTED`
- Representative `ai-inquiry-v1` live provider evidence: `IMPLEMENTED`
- `general-crud-v1` evidence: retained as regression evidence, not active
  product direction

## On Hold / Not Active Scope

- Generic WebApp Builder: on hold
- Generic Platform Builder: on hold
- Block Generator: on hold
- Blueprint Generator: on hold
- Learning Engine: `FUTURE`
- Marketplace: `FUTURE`
- Actual MCP Invocation: not implemented
- Runtime Compiler: not implemented
- Live Agent Evidence Sprint: draft only, not approved

## Product Direction Conflicts / Notes

- `README.md` still says “AI Result Design Platform” and “AI System Builder
  Platform 전환 단계”. Current project docs narrow the active product promise to
  AI Agent automatic build and Marketplace sharing.
- `.buildflow/STATUS.md` currently records `Latest Known Commit: be12055`, while
  actual Git HEAD after the draft live evidence scope push is `de62266`.
