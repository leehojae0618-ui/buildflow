# Visual Closed Beta Slice Activation Record

## Activation

```text
TASK: BUILDFLOW-VISUAL-CLOSED-BETA-SLICE-001
ACTIVATION TIME: 2026-07-24 15:50:56 KST
ACTIVATED BY: PM/CTO
SPRINT STATUS: ACTIVE
SCOPE STATUS: FROZEN
IMPLEMENTATION AUTHORITY: GRANTED
```

This is the historical Activation Record. The current operative Sprint status
is `USER QA / IMPLEMENTED`; Implementation Authority is paused pending User QA.

## Authorized Implementation Boundary

Only these paths are authorized for this Sprint:

```text
src/app/app/projects/[projectId]/page.tsx
src/features/requirements/components/requirement-summary.tsx
src/features/autonomous/components/agent-build-journey.tsx
src/features/autonomous/agent-build-journey.test.ts
```

## Authorized Work

- Read persisted Project, Requirement Snapshot, Autonomous Session, and
  completion-report state.
- Derive and render one read-only Agent Build Journey.
- Add focused unit coverage for pure Journey-state mapping.
- Compose the Journey into the authenticated Project Detail flow.

## Restrictions

- No `startAutonomousBuildSession`, `continueAutonomousBuildSession`, or
  `resumeAutonomousBuildSession` call.
- No `ApprovalSummary`, `ProviderCredentialPanel`, or polling that advances
  session state.
- No Provisioning, Provider/MCP Invocation, Runtime execution, persistence,
  DB/API, deployment, dependency, or Scope expansion.
- Result claims require persisted Session or completion-report evidence.

## Exit Requirement

Before `IMPLEMENTED → CODE REVIEW`, create an Exit Record with completed Scope,
out-of-scope work, known issues, validation evidence, PM review, User QA, and
the next Sprint candidate.
