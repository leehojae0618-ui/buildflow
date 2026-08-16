# Addendum A — Visual Journey Read-only and Evidence Rules

## Status

```text
ADDENDUM: A
TASK: BUILDFLOW-VISUAL-CLOSED-BETA-SLICE-001
POLICY DECISION: APPROVED BY PM/CTO
SCOPE BASELINE: FROZEN
SPRINT STATUS: USER QA / IMPLEMENTED
IMPLEMENTATION APPROVAL: APPROVED — READ-ONLY VISUAL JOURNEY SCOPE
IMPLEMENTATION AUTHORITY: PAUSED — USER QA
CODE REVIEW: APPROVED WITH QA GATE
```

This addendum clarifies the frozen policy baseline for the first Visual Closed
Beta Slice. It does not expand scope or change any Runtime, Provider, MCP, or
deployment behavior.

## 1. Journey Read-only Rule

`AgentBuildJourney` is a state-display UI only.

It MUST NOT import, call, render, initiate, or resume any of the following:

- `startAutonomousBuildSession`
- `continueAutonomousBuildSession`
- `resumeAutonomousBuildSession`
- `ApprovalSummary`
- `ProviderCredentialPanel`
- polling that can advance a session or Provisioning state
- Provisioning
- Provider invocation
- MCP invocation

The Journey may read existing persisted Project, Requirement Snapshot,
Execution-preparation, Autonomous Session, and completion-report state. It may
explain the next required action, but it MUST NOT perform that action.

## 2. Evidence Rule

Journey Result data MUST come only from a persisted Autonomous Session or a
persisted `completionReport` associated with that session.

The Journey MUST NOT interpret any of the following as Provider, MCP, Evidence,
or Agent execution success:

- a verification fallback created with `createVerificationRun`
- Build Plan existence
- Build Execution `READY`
- a Runtime Result contract or object
- a Blueprint selection
- an estimated delivery or verification value

When no persisted terminal result exists, the Journey must present the current
known state and next action rather than a fabricated success result.

## 3. Policy Resolution

The PM classifies the preceding boundaries as a policy clarification, not a
Scope redesign or implementation defect. The Scope Draft remains valid with
this addendum attached.

Scope Freeze and Sprint Activation are recorded. The Journey implementation is
limited to the Activation Record's exact file boundary.
