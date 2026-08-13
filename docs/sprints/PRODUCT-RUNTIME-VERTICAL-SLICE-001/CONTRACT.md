# PRODUCT-RUNTIME-VERTICAL-SLICE-001 Contract

## Status

```text
SPRINT ID: PRODUCT-RUNTIME-VERTICAL-SLICE-001
CONTRACT STATUS: SCOPE FROZEN
IMPLEMENTATION AUTHORITY: NONE
COMMIT AUTHORITY: NONE
PUSH AUTHORITY: NONE
DEPLOY AUTHORITY: NONE
```

## Architecture Contract

1. `Bf0BuildPlanItem` is guidance and is never a `RuntimePlan`.
2. A BF0 Draft reaches Runtime only through a deterministic validated Runtime
   Artifact Projection.
3. Projection uses existing Agent, package, request, plan, and approval
   builders/validators; it cannot bypass them with ad hoc Runtime literals.
4. `executeApprovedProductRuntime()` and `executeMinimumRuntime()` are reused;
   no Runtime Engine is introduced.
5. Product composition conforms to Core contracts. It does not alter them.

## Eligibility Contract

Only direct-input, single internal AI_RESPONSE-compatible, no-external-side-
effect designs may be eligible. Gmail, Slack, GitHub, Google Forms, Webhook/API,
Database, external file persistence, n8n, Make, MCP, OAuth, and all other
external paths must be ineligible and remain guide-only / connection-required /
actual execution NOT AVAILABLE.

## Approval Contract

1. BF0 approval preference is not Runtime authorization.
2. Controlled execution requires a separate explicit user action.
3. There is no auto-run, default approval, or approval carry-over.
4. The approved runtime binding is built with `buildRuntimeApprovalBinding()`
   and is consumed by the existing Product Runtime Bridge.

## Controlled Provider and Evidence Contract

The product-owned controlled adapter is deterministic and performs zero network
or external calls. It uses no SDK, API key, credential, secret, OpenAI call, or
test-only fake Provider import. Its output is reference/checksum-only.
`InMemoryRuntimeEvidenceRepository` is the only Evidence adapter considered for
this Slice. It is ephemeral internal evidence, not persisted DB Evidence.

## Result Truth Contract

Permitted result meaning:

```text
Controlled Runtime status: completed / failed
Runtime Execution Reference
Runtime Evidence Reference
External Provider Call: NONE
External Service Action: NONE
Actual connection and production operation: NOT PERFORMED
```

Forbidden result meaning:

```text
AI completed the work
Agent build complete
Slack or external service delivered
OpenAI executed
external service connected
Production execution succeeded
DB Evidence persisted
```

## Acceptance Criteria

### AC1

Unsupported or external BF0 flows never become runtime-eligible.

### AC2

BF0 Build Plan is never treated directly as RuntimePlan.

### AC3

Runtime artifacts use existing builders and validators.

### AC4

BF0 approval preference does not equal Runtime authorization.

### AC5

No execution occurs before explicit user approval.

### AC6

The Controlled Provider performs zero network or external calls.

### AC7

No OpenAI API or SDK invocation occurs.

### AC8

No DB, RPC, or Migration is required.

### AC9

Existing Product Runtime Bridge and Core Runtime are reused.

### AC10

Runtime, Provider, Evidence, and Approval Core contracts remain unchanged.

### AC11

Evidence UI is safe and reference-only.

### AC12

Result UI makes no actual AI or external-task-completion claim.

### AC13

External BF0 flows remain guide-only / connection-required only.

### AC14

390, 768, and 1440 browser UX remains responsive and non-console-like.

### AC15

Failures and rejections expose no internal or sensitive error detail.

### AC16

No new dependency is added.

### AC17

Unrelated dirty work remains untouched.

## Immutable Scope

Only the six source/test paths named in `TASK.md` may be changed after a
separate implementation approval. Any Core, persistence, configuration,
dependency, DB, provider, external-service, or scope expansion requires a
written Scope Amendment and separate user approval.
