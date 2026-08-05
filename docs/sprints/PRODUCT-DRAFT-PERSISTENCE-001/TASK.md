# PRODUCT-DRAFT-PERSISTENCE-001

## Status

ACTIVE / IMPLEMENTATION AUTHORIZED

## Objective

Persist a completed BF0 design draft as an authenticated user's existing
BuildFlow Project, including a server-derived Requirement Snapshot, then take
the user to that Project.

## In Scope

- A server-only action that authenticates the user, validates safe BF0 draft
  fields, and creates one owned `projects` row using the existing schema.
- A deterministic mapping from the safe BF0 choices to the existing
  `createRequirementSnapshot()` input and stored `goal_constraints` boundary.
- A final BF0 completion action that calls the server action and redirects only
  after an actual successful Project creation.
- Focused regression tests for validation, safe persistence payload projection,
  authentication failure, and persistence failure.

## Out of Scope

- Runtime request or plan generation, Package Approval Gate construction,
  Runtime Approval consumption, Provider invocation, MCP, Evidence write,
  queue, retry, streaming, DB schema or migration changes, and external API
  calls.
- Changes to existing Project Detail, Visual Slice, Autonomous, Charter, MCP,
  or user-owned dirty files.

## Acceptance Criteria

- An authenticated BF0 user can explicitly save a completed design as one
  Project and is taken to its Project Detail only after the insert succeeds.
- An unauthenticated or invalid request returns a safe state without creating
  a Project.
- The server recomputes the Requirement Snapshot; the browser does not submit
  a trusted snapshot or raw Provider input.
- No secrets, raw external payloads, or unsupported completion claims are
  stored or displayed.
