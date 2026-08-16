# VISUAL-QA-HARNESS-001 Contract

## Status

```text
FROZEN / CONTRACT ONLY
IMPLEMENTATION AUTHORITY: NONE
```

## Harness Contract

The QA Harness is a browser inspection surface only.

```text
Purpose:
Render Visual Closed Beta Slice with synthetic fixture state.

Forbidden:
Supabase, Auth, DB, external execution, Runtime, Provider, MCP, n8n, Make,
production data, deployment, and success claims from fixture data.
```

## Fixture Contract

The fixture set must cover these semantic states:

| State | Required meaning | Allowed source |
|---|---|---|
| EMPTY | No persisted terminal result and little or no requirement progress | Synthetic local object |
| PLANNED / READY | Requirement and plan are present, but no execution result exists | Synthetic local object |
| IN_PROGRESS | Existing session-like state is non-terminal | Synthetic local object |
| COMPLETED | Existing terminal state is represented from fixture data only | Synthetic local object |
| FAILED / UNKNOWN | Failure, cancellation, or insufficient information is visible | Synthetic local object |

The implementation may map these semantic states to the existing
`AgentBuildJourney` session statuses such as:

```text
WAITING_FOR_CREDENTIAL
WAITING_FOR_CONSENT
WAITING_FOR_APPROVAL
PLANNING
PROVISIONING
VERIFYING
RECOVERING
BLOCKED
READY
READY_WITH_WARNINGS
FAILED
CANCELLED
```

It must not invent unsupported Runtime, Provider, MCP, or external-builder
states.

## Truth Boundary

All harness data is:

```text
FIXTURE / QA ONLY
NOT ACTUAL EXECUTION
NOT PERSISTED SESSION EVIDENCE
NOT EXTERNAL EVIDENCE
NOT PRODUCTION RESULT
```

The UI must visibly distinguish fixture output from real user/project data.
Fixture `READY` or `COMPLETED` examples must not be described as a real
Product, Provider, Runtime, MCP, n8n, Make, deployment, or production result.

## Route Contract

Recommended route:

```text
/visual-qa-harness
```

Recommended file:

```text
src/app/visual-qa-harness/page.tsx
```

Proxy/Auth dependency:

```text
NO
```

Rationale:

`src/proxy.ts` currently protects `/app/:path*`, `/login`, and `/signup`.
Placing the harness outside those paths avoids the blocked Project Page
SSR/Auth/Supabase dependency chain.

## Production Exposure Contract

The harness route must include a production exposure guard.

Required behavior:

```text
development/test inspection: render fixture QA surface
production: do not render fixture QA surface
```

The implementation must verify this during build or audit. A route existing in
source is not by itself safe; public production access must be blocked by code,
not only by convention.

## Dependency Contract

Allowed:

- React
- Next.js App Router
- existing BuildFlow components
- existing styles
- local synthetic fixture objects

Forbidden:

- new npm dependency
- Playwright setup
- Storybook setup
- Cypress setup
- React Testing Library setup
- network mocks that require external execution

## Component Reuse Contract

The harness should reuse:

```text
RequirementSummary
AgentBuildJourney
deriveAgentBuildJourney
```

The implementation must not fork or copy production component logic for QA.
If reuse is impossible without modifying the production components, stop and
request a scope amendment.

## Validation Contract

Future implementation must provide evidence for:

```text
focused tests: npm test -- src/features/autonomous/agent-build-journey.test.ts
typecheck: npm run typecheck
lint: npm run lint
build: npm run build
browser: /visual-qa-harness
responsive: 390 / 768 / 1440
console: no relevant runtime errors
truth boundary: fixture-only labels visible
```

No validation step may connect to Supabase, DB, Runtime, Provider, MCP, n8n,
Make, deployment, or another external API.
