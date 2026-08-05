# BF0 Product Experience Task

## Status

```text
TASK ID: BF0-PRODUCT-EXPERIENCE-001
TASK STATUS: IMPLEMENTED / USER PERSONA AND VISUAL QA PASS
SPRINT PHASE: CODE REVIEW READY
AUTHORITY: CONSUMED — FROZEN UI-ONLY SCOPE
IMPLEMENTATION AUTHORITY: APPROVED — FROZEN UI-ONLY SCOPE
COMMIT AUTHORITY: NONE
PUSH AUTHORITY: NONE
DEPLOY AUTHORITY: NONE
NEXT GATE: SELECTIVE COMMIT REVIEW
```

## Objective

Define the bounded Product Experience scope that recreates the BF_0 journey in
the existing application without changing existing Runtime, DB, Provider,
Evidence, Approval, or external-integration behavior.

## Frozen Journey

```text
Onboarding
→ Idea input
→ Goal
→ Input location
→ Approval method
→ Result location
→ Workflow draft
→ Cost and access
→ Build plan
→ Completion
```

## Candidate Implementation Areas

The following are candidates for later investigation only. They are not an
approved file list:

- the public or authenticated product entry route appropriate to the existing
  application information architecture;
- new product-experience presentation components and pure ViewModel modules;
- existing project, requirement, connector, approval, planner, and capability
  read-model adapters;
- focused UI and ViewModel tests.

Any overlap with existing Visual Slice dirty files, existing project routes, or
server persistence must be separately reviewed before implementation.

## Explicit Exclusions

- Server Draft creation, update, persistence, or refresh recovery.
- DB schema, migration, RLS, and authentication changes.
- Runtime execution, Provider/model calls, approval consumption, Evidence
  writes, MCP, external connection, OAuth, Queue, Retry, and Streaming.
- Fake cost, connection, readiness, completion, or execution claims.
- Commit, Push, Deploy, and live external actions.

## Documentation Deliverables

- `PLAN.md`: scope, boundary, validation, risk, and next gate.
- `CONTRACT.md`: immutable safety and truthfulness constraints.

## Current Requirement

The frozen UI scope is implemented. The final browser QA confirmed Persona A
and Persona B requirement preservation, add/edit/delete synchronization,
responsive layout, keyboard interaction, ARIA behavior, console safety, and
truthful UI claims. The next action is a selective Commit Review; this Sprint
does not authorize Product Runtime, DB, Provider, or external-action work.
