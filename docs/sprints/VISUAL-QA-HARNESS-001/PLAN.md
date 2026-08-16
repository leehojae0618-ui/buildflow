# VISUAL-QA-HARNESS-001 Plan

## Status

```text
FROZEN / DOCUMENTATION-ONLY SCOPE FREEZE
IMPLEMENTATION AUTHORITY: NONE
```

## Problem

`VISUAL-CLOSED-BETA-USER-QA-001` is blocked before Visual Slice browser
inspection because the current authenticated Project Detail route requires:

- Auth
- Supabase server client creation
- Project persistence
- Recommendation persistence
- Verification persistence
- Autonomous session and deployment completion-report persistence

The Visual component itself does not directly require Supabase. The blocked
path is the Project Page SSR/Auth dependency chain, not an observed
`AgentBuildJourney` rendering defect.

## Objective

Define the smallest QA-only browser surface that can render the Visual Closed
Beta Slice with synthetic fixture state, without Supabase, Auth, DB, Runtime,
Provider, MCP, n8n, Make, or external execution.

The harness exists only to unblock browser QA for:

- `RequirementSummary` integration
- `AgentBuildJourney` rendering
- state differentiation
- truth-boundary representation
- empty or missing state
- responsive layout
- BF0 visual compatibility

## Non-Goals

- Real Project Page replacement
- Production feature
- Auth bypass
- Database abstraction rewrite
- Runtime integration
- Provider integration
- MCP integration
- n8n or Make validation
- Deployment
- New dependency installation
- Playwright, Storybook, Cypress, or React Testing Library introduction

## Existing Route and Proxy Findings

`src/proxy.ts` uses the matcher:

```text
["/app/:path*", "/login", "/signup"]
```

Routes under `/app` enter the Supabase/Auth proxy path. Existing internal lab
routes such as `/app/no-key-builder-lab` and `/app/verification-lab` are
therefore not suitable as the model for this harness, because they repeat the
same protected-route dependency that blocked User QA.

## Recommended Route

```text
/visual-qa-harness
```

Proposed file:

```text
src/app/visual-qa-harness/page.tsx
```

Reason:

- It is outside `/app/:path*`.
- It is not `/login` or `/signup`.
- It can render through the existing root layout without entering the current
  Supabase/Auth proxy matcher.
- It can use existing React, Next.js routing, Tailwind/global styles, and
  existing Visual components.

Proxy/Auth involved:

```text
NO
```

## Production Exposure Policy

The route must not be treated as a product feature. A Next route file is still
part of the application source and may be included in a production build, so
the implementation must include an explicit production exposure control.

Preferred option:

```text
development-only route guard
```

The route should return `notFound()` or an equivalent non-rendering response
when `process.env.NODE_ENV === "production"`.

This guard is required because path naming alone is not a production exposure
control. The implementation audit must verify that a production build does not
serve the fixture UI as a public product page.

## Dependency Rule

The harness must use only:

- existing React stack
- existing Next.js App Router
- existing styles
- existing components
- synthetic local fixture objects

No new dependency is in scope.

## Validation Plan

Future implementation must validate:

- `npm test -- src/features/autonomous/agent-build-journey.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- browser QA for `/visual-qa-harness`
- responsive inspection at 390, 768, and 1440 px
- console error check
- truth-boundary copy check

The validation must not perform Supabase, Auth, DB, Runtime, Provider, MCP,
n8n, Make, deploy, or external API execution.

## Stop Conditions

Stop before implementation if the harness requires:

- an Auth bypass
- Supabase or DB access
- external network execution
- a new dependency
- modifications to existing Group A production files
- a production-accessible fixture route without a reliable guard
- duplicated production component logic instead of reusing existing components
