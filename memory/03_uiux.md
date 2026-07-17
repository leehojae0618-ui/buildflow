# UI/UX Memory

## Design Language

Source of truth:

- `docs/design/DESIGN_LANGUAGE.md`
- `docs/brand/AI_COMMUNICATION_LANGUAGE.md`

Design Language v1 status: `APPROVED`.

## Core Identity

BuildFlow UI should feel like an **AI Agent Command Center**.

The user is not designing workflows. The user is assigning work to an AI
development team and receiving verified outcomes.

## Visual Theme

Decision / planned direction from design docs:

- Dark Luxury
- JARVIS-inspired professional workspace
- Living Neural Network
- AI Agent Command Center
- Glass panels
- Electric Blue `#53D8FF`
- Neon Violet `#7B61FF`
- Orange for approval, warning, and cost
- Green for verified success

## Experience Hierarchy

Default screens should prioritize:

1. Outcome the user will receive
2. Current AI work
3. Progress and estimated remaining time
4. Cost
5. User actions and approvals
6. Verification and Evidence
7. Technical details

## First Screen Principle

Planned / design decision:

```text
무엇을 대신할 AI Agent를 구축할까요?
```

The first screen should be an Agent Command Input, not a project dashboard.

Expected first-screen elements:

- Large natural-language input
- Recommended prompts
- Mode selection: quick input / conversational input

## Navigation Direction

Planned design direction includes a fixed left navigation such as:

- Command Center
- My Agents
- Build
- Approval
- Credential
- Blueprint
- MCP Registry
- Marketplace
- Analytics
- Settings

Implementation compliance is not fully audited in this memory migration.

## Approval UX

Approval must be visible and outcome-focused.

Approval surfaces should explain:

- What the AI will do
- Why permission is needed
- Impact
- Cost
- Whether the action can be retried or recovered

Users should not be forced to read raw logs.

## Completion UX

Completion should emphasize:

- Agent ready state
- URL or usage surface
- Admin / management surface when applicable
- Verification
- Evidence
- Package Export readiness

Avoid user-facing titles such as `Done`, `Success`, or `Deployment Complete`
when stronger Production/Agent readiness language is needed.

## Hidden by Default

The default UI should not expose these terms to non-technical users:

- Workflow internals
- Task IDs
- JSON
- Provider commands
- MCP internals
- Adapter logs
- Raw execution logs

These belong in detail views.

## Communication Tone

BuildFlow speaks as an **AI Chief Engineer**:

- calm
- precise
- professional
- not exaggerated
- clear about uncertainty
- clear about next action

## Implementation Status Notes

- The design language is approved.
- Some UI refactor work has been completed in prior HARDEN/DESIGN/BRAND
  Sprints.
- This memory migration does not audit every component for design compliance.
- Living Neural Network and full Agent Command Center visuals should be treated
  as `DECISION` / `PLANNED` unless a specific screen implementation is verified.
