# VISUAL-QA-HARNESS-001 Task

## Status

```text
FROZEN / NOT IMPLEMENTATION APPROVED
MODE: QA-ONLY HARNESS SCOPE FREEZE
```

## Objective

Create, in a future separately approved implementation task, a QA-only browser
harness that renders the Visual Closed Beta Slice from synthetic fixture state
without using Supabase, Auth, DB, external services, Runtime, Provider, MCP,
n8n, or Make.

This task only freezes the implementation scope. It does not authorize
implementation.

## Proposed Implementation Scope

Allowed future implementation file:

```text
src/app/visual-qa-harness/page.tsx
```

The file should:

- define local synthetic fixture state inline or in the same route file
- render existing `RequirementSummary`
- render existing `AgentBuildJourney` through the `RequirementSummary`
  integration path
- include enough fixture variants to inspect the required states
- label the surface as fixture-only QA
- avoid all Supabase/Auth/DB/external imports
- avoid all Runtime/Provider/MCP execution imports
- block production exposure with an explicit route guard

## Existing Group A Files

The following files are not included in the harness implementation scope by
default:

```text
src/app/app/projects/[projectId]/page.tsx
src/features/requirements/components/requirement-summary.tsx
src/features/autonomous/components/agent-build-journey.tsx
src/features/autonomous/agent-build-journey.test.ts
```

They may be modified only if a future implementation audit proves the harness
cannot reuse the existing component contract without a small compatibility
change. Such a change requires a separate scope amendment and must not be
bundled into this harness route by assumption.

## Required Harness Properties

```text
QA-only: YES
synthetic fixture only: YES
no Supabase: YES
no auth: YES
no DB: YES
no external fetch: YES
no Runtime: YES
no Provider: YES
no MCP: YES
no production data: YES
```

## Fixture Coverage

The harness must provide browser-visible examples for:

1. EMPTY
2. PLANNED / READY
3. IN_PROGRESS
4. COMPLETED
5. FAILED / UNKNOWN

The exact session labels must match the existing component model. Do not invent
runtime success states that the current component does not support.

## Browser QA Scope

Visual QA must inspect:

- horizontal overflow
- text clipping
- button or link overlap
- layout collapse
- state legibility
- journey hierarchy
- truth-boundary labeling

Required viewport widths:

```text
390
768
1440
```

## Out of Scope

- Source changes outside the approved future harness file
- Project Page SSR/Auth repair
- Auth bypass implementation
- Supabase, DB, migration, SQL, RPC, or seed work
- Runtime, Provider, MCP, n8n, Make, or external API execution
- Dependency installation
- Playwright, Storybook, Cypress, or React Testing Library setup
- Deployment
- Production feature exposure
- Visual Slice TASK reconciliation

## Commit and Push

```text
COMMIT AUTHORITY: NONE
PUSH AUTHORITY: NONE
```

Any implementation, commit, or push requires a separate explicit approval gate.
