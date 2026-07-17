# Package Approval Gate

## 1. Status

```text
IMPLEMENTED
PM REVIEW REQUIRED
PURE APPROVAL GATE ONLY
```

This document defines the Package Approval Gate contract for BuildFlow Agent
Packages and records the first pure implementation.

Implemented files:

```text
src/features/agents/package-approval-gate.ts
src/features/agents/package-approval-gate.test.ts
src/features/agents/index.ts
```

Target test result:

```text
npx vitest run src/features/agents/package-approval-gate.test.ts
PASS — 86 tests
```

No Runtime, MCP Invocation, Provider execution, DB, API, UI, Marketplace,
deployment, persistence, or actual approval execution is implemented by this
task.

## 2. Objective

Package Approval Gate should answer:

1. what is being approved
2. which Evidence Report the approval is bound to
3. who must approve it
4. current approval state
5. approval or rejection reason
6. decision integrity
7. which follow-up actions are allowed or blocked
8. expiration or invalidation policy
9. whether previous approvals survive a new Evidence Report
10. whether approval means execution success

Core answer:

```text
Approval authorizes a scoped next action. It does not prove Runtime execution,
MCP Invocation, Provider execution, deployment, Marketplace publication, or
installation success.
```

## 3. Current Context

Existing related contracts and implementations:

| Area | Status | Path |
|---|---|---|
| Package Evidence Report | `IMPLEMENTED` | `src/features/agents/package-evidence-report.ts` |
| Package Verification Pipeline | `IMPLEMENTED` | `src/features/agents/package-verification-pipeline.ts` |
| Package Evidence Bundle | `IMPLEMENTED` | `src/features/agents/package-evidence-bundle.ts` |
| Agent approval requirement declarations | `IMPLEMENTED` | `src/features/agents/package-profile.ts`, `src/features/agents/validation-gate.ts` |
| Execution approval model | `IMPLEMENTED / DIFFERENT DOMAIN` | `src/features/execution/types.ts`, `src/features/execution/policy.test.ts` |
| Provisioning approval scope checks | `IMPLEMENTED / DIFFERENT DOMAIN` | `src/features/provisioning/executor.ts`, `src/features/provisioning/commands.ts` |

Existing Execution/Provisioning approval logic is operational-domain approval.
This document defines a package evidence approval contract and must not change
or silently replace those existing domains.

Current package readiness remains:

```text
CONDITIONALLY_READY
```

## 4. Approval Gate Boundary

Package Approval Gate may define:

- approval request contract
- approval decision contract
- scope model
- actor and approver references
- source references bound to an Evidence Report
- gate evaluation result
- stale/supersede/revoke rules
- deterministic id and checksum rules
- authorization summary
- secret-safe reason and comment boundaries

It must not implement:

- persistence
- authentication
- authorization enforcement
- Runtime execution
- MCP Tool Invocation
- Provider execution
- deployment
- Marketplace publish
- UI
- API
- DB migration
- real approval decision capture

## 5. Core Principles

### Approval First

Cost, external writes, Provider execution, Runtime execution, deployment,
installation, public changes, and Marketplace publish must require explicit
approval before execution.

### Evidence Bound

Approval must bind to a specific Evidence Report and source checksum set.

Minimum source values:

```text
packageId
packageVersion
evidenceReportId
evidenceReportIntegrityChecksum
packageArtifactChecksum
verificationReportChecksum
evidenceBundleChecksum
pipelineSummaryChecksum
```

If any source checksum changes, previous approval must become `STALE` or
`INVALIDATED` and must not be reused silently.

### No Implied Approval

Approval must not be inferred from:

- Report `VALID_WITH_LIMITATIONS`
- Package `CONDITIONALLY_READY`
- approval reference existence
- approval status snapshot
- previous approval
- deployment button click
- Runtime success
- tests passing

### Separation of Concerns

Keep separate:

- approval request
- approval decision
- approval evidence/reference
- gate evaluation
- runtime authorization
- deployment authorization
- marketplace authorization
- execution result

## 6. Format Version

Implemented format versions:

```text
buildflow.package-approval-request.v1
buildflow.package-approval-decision.v1
buildflow.package-approval-gate.v1
```

## 7. Approval Request Contract

Implemented type:

```text
PackageApprovalRequest
```

Status candidates:

```text
DRAFT
PENDING
CANCELLED
EXPIRED
SUPERSEDED
```

Minimum fields:

```text
formatVersion
approvalRequestId
packageId
packageVersion
evidenceReportId
evidenceReportIntegrityChecksum
sourceReferences
requestedScopes
requestedBy
requiredApprover
requestStatus
reasonCode
limitations
createdReference
expirationPolicy
deterministicCore
integrityChecksum
metadata
```

Rules:

- creating a request is not approval
- request is reference-only
- request does not contain raw actor identity documents, secrets, tokens, or
  credentials
- request may contain multiple scopes
- request must not grant scope inheritance

## 8. Approval Decision Contract

Implemented type:

```text
PackageApprovalRecord
```

Decision values:

```text
APPROVE
REJECT
REQUEST_CHANGES
ABSTAIN
```

Decision status values:

```text
RECORDED
INVALID
STALE
REVOKED
SUPERSEDED
```

Minimum fields:

```text
approvalDecisionId
approvalRequestId
actorReference
decision
decisionStatus
approvedScopes
rejectedScopes
reasonCode
comment
decidedAtReference
sourceChecksums
deterministicCore
integrityChecksum
metadata
```

Rules:

- actor is reference-only
- decision is immutable
- revocation or supersede creates a new record/status, not destructive overwrite
- reason code belongs in deterministic core
- comment stays outside deterministic core
- comment must be secret-safe

## 9. Approval Scope Model

Scope candidates:

```text
PACKAGE_ACCEPTANCE
RUNTIME_EXECUTION
MCP_INVOCATION
PROVIDER_EXECUTION
INSTALLATION
DEPLOYMENT
MARKETPLACE_PUBLISH
```

Implemented v1 request scopes:

```text
PACKAGE_ACCEPTANCE
RUNTIME_EXECUTION
DEPLOYMENT
```

Runtime and Deployment execution are not implemented here. The scope contract
only expresses whether future work may proceed after a separate approved
implementation.

Scope rules:

- scopes are independent
- scope inheritance is forbidden
- `PACKAGE_ACCEPTANCE` approval does not approve `DEPLOYMENT`
- `RUNTIME_EXECUTION` approval does not approve `MARKETPLACE_PUBLISH`
- partial approval is allowed by scope
- unsupported scopes produce `UNSUPPORTED_SCOPE`

## 10. Actor and Approver Model

Actor reference candidate:

```text
actorId
actorType
role
organizationReference
```

Actor type candidates:

```text
USER
SERVICE
SYSTEM
```

Implemented v1:

- only `USER` can provide final approval
- `SERVICE` and `SYSTEM` may create requests or run evaluations, but cannot
  replace explicit human approval
- actual authentication and authorization are out of scope

## 11. Evidence Report Relationship

Approval Gate references Evidence Report by deterministic identifiers.

Reference fields:

```text
reportId
reportIntegrityChecksum
reportStatus
packageReadiness
approvalRequired
packageArtifactChecksum
verificationReportChecksum
evidenceBundleChecksum
pipelineSummaryChecksum
```

Do not use human-readable summary as source of truth.

Changes that should not invalidate approval:

- title
- executiveSummary
- decisionSummary
- nextRequiredActions
- metadata
- generatedAt

Changes that should invalidate or stale approval:

- Evidence Report deterministic core
- Evidence Report integrity checksum
- package id/version
- package artifact checksum
- verification report checksum
- evidence bundle checksum
- pipeline summary checksum
- requested scope
- required approver

## 12. Gate Status Model

Gate status candidates:

```text
BLOCKED
PENDING_APPROVAL
APPROVED_WITH_LIMITATIONS
APPROVED
REJECTED
STALE
INVALID
```

Implemented v1 default success:

```text
APPROVED_WITH_LIMITATIONS
```

Reason: approval can authorize a scoped next action, but current evidence still
has Runtime/Provider/Deployment/Marketplace limitations.

`APPROVED` remains in the type vocabulary for future policy discussion, but
the v1 builder/evaluator does not return it.

## 13. Gate Result Contract

Candidate type:

```text
PackageApprovalGateResult
```

Minimum fields:

```text
formatVersion
packageId
packageVersion
evidenceReportReference
requestReference
decisionReferences
requestedScopes
grantedScopes
deniedScopes
gateStatus
authorization
failures
warnings
limitations
deterministicCore
integrityChecksum
metadata
```

## 14. Gate Decision Rules

### INVALID

- request contract error
- decision contract error
- checksum/reference conflict
- actor/reference error
- secret safety error
- unsupported scope
- internal gate error

### PENDING_APPROVAL

- valid request exists
- explicit decision missing
- request is not expired or superseded

### REJECTED

- valid reject decision exists for requested scope

### STALE

- Evidence Report id/checksum changed
- package id/version changed
- package artifact checksum changed
- verification/bundle/pipeline checksum changed
- request superseded by a newer report or request

### BLOCKED

- Evidence Report is `INVALID` or `INCOMPLETE`
- required request missing
- requested scope mismatches execution scope
- package readiness below minimum requirement

### APPROVED_WITH_LIMITATIONS

- Evidence Report is valid enough for structural scope
- source checksums match
- requested scope matches
- required approver matches
- explicit `APPROVE` decision exists
- remaining Runtime/Provider/Deployment/Marketplace limitations exist

### APPROVED

Open PM decision. Recommended v1 does not use it for full success claims.

## 15. Authorization Expression

Do not use a single boolean.

Candidate fields:

```text
authorizationStatus
requestedScope
grantedScopes
deniedScopes
reasonCodes
limitations
sourceApprovalReference
```

Authorization status candidates:

```text
NOT_AUTHORIZED
PENDING
AUTHORIZED_WITH_LIMITATIONS
AUTHORIZED
REVOKED
STALE
```

Approval Gate never calls the authorized action.

## 16. Deterministic IDs and Integrity

### approvalRequestId

Candidate input:

```text
packageId
packageVersion
evidenceReportId
evidenceReportIntegrityChecksum
normalized requestedScopes
requestedBy reference
requiredApprover reference
```

### approvalDecisionId

Candidate input:

```text
approvalRequestId
actorReference
decision
normalized scope
evidenceReportIntegrityChecksum
reasonCode
```

Recommended exclusions:

```text
comment
metadata
timestamp
raw actor details
```

### Gate deterministic core

Candidate fields:

```text
formatVersion
packageId
packageVersion
reportId
reportIntegrityChecksum
requestId
requestIntegrityChecksum
decisionIds
decisionIntegrityChecksums
normalized requestedScopes
normalized grantedScopes
gateStatus
normalized failures
normalized limitations
sourceConsistencySummary
```

Integrity checksum:

```text
sha256(stableSerialize(deterministicCore))
```

## 17. Timestamp and Expiration Policy

Do not call `Date.now()` inside the pure builder.

Options:

| Option | Description | Recommendation |
|---|---|---|
| A | builder reads current time | Reject |
| B | explicit `evaluationTime` input | Accept when expiration is required |
| C | expiration reference-only in v1 | Recommended first step |
| D | separate temporal evaluator | Good future split |

Recommended v1:

```text
expirationPolicy: reference-only
evaluationTime: optional explicit input if needed later
```

## 18. Supersede, Stale, and Revoke Policy

Events:

- Evidence Report checksum changes
- package version changes
- requested scope changes
- required approver changes
- new request is created
- rejection followed by re-request
- approval followed by source change
- explicit revocation

Recommended policy:

- previous request → `SUPERSEDED`
- existing decision → `STALE`
- gate → `PENDING_APPROVAL` or `STALE`
- approval history remains immutable
- never delete or overwrite approval records

## 19. Secret Safety

Forbidden:

- access token
- session token
- password
- API key
- private key
- OAuth token
- Provider credential
- Vault content
- raw authentication claims
- raw request headers
- raw logs
- unnecessary personal information payload

Allowed:

- actor reference
- role reference
- organization reference
- credential reference identifier
- checksum
- sanitized reason code

Apply secret-safety validation to:

- reason code
- comment
- actor reference
- organization reference
- source references
- metadata

## 20. Reason and Comment Boundary

Reason code candidates:

```text
ACCEPTED_RISK
VERIFIED_SCOPE
BUSINESS_APPROVAL
SECURITY_REVIEW_COMPLETE
CHANGES_REQUIRED
INSUFFICIENT_EVIDENCE
POLICY_VIOLATION
USER_REJECTED
OTHER
```

Recommended:

- `reasonCode` required
- `reasonCode` included in deterministic core
- `comment` optional
- `comment` outside deterministic core
- changing comment does not change decision identity
- comment must pass secret-safety checks

## 21. Package Readiness Relationship

Approval Gate must not upgrade Package Readiness.

Current readiness remains:

```text
CONDITIONALLY_READY
```

Approval can authorize a scoped next action, but does not mean:

- package is runtime-ready
- deployment succeeded
- Marketplace publish is allowed
- Provider execution succeeded
- MCP Invocation succeeded

## 22. PM Decisions Applied in v1

The first implementation applies these PM decisions:

- v1 normal success is `APPROVED_WITH_LIMITATIONS`.
- `APPROVED` exists in the type vocabulary but is not returned by v1.
- multi-scope approval requests are allowed.
- decisions are resolved per scope.
- partial approval is supported.
- scope inheritance is forbidden.
- source checksum changes produce `STALE`.
- request and decision history is immutable.
- final approval requires a `USER` actor.
- `SERVICE` and `SYSTEM` may request or evaluate, but cannot approve.
- `reasonCode` is deterministic.
- `comment` is human-readable and excluded from deterministic core.
- builder/evaluator do not call `Date.now()`.
- expiration is evaluated only with explicit `evaluationTime`.
- approval does not change Package Readiness.

## 23. Open PM Decisions

1. Should future versions support returning `APPROVED`, or keep
   `APPROVED_WITH_LIMITATIONS` as the maximum status?
2. Should approval and execution authorization share one result or remain
   separate?
3. What is the full required approver reference structure for persisted
   approvals?
4. Is quorum/multi-approver support needed?
5. Which layer owns Approval Record persistence?
6. Can request creation occur for `INVALID` or `INCOMPLETE` reports?
7. Can approval reference alone authorize follow-up execution, or must a
   runtime authorization layer re-evaluate every request?
8. Should revoke records become first-class immutable records instead of
   reference input?

## 24. Implemented v1 Policy

- reference-only approval contracts
- explicit human approval
- one request may contain multiple scopes
- decision recorded per scope
- partial approval allowed
- source checksum change produces `STALE`
- request and decision records are immutable
- new request supersedes previous request for same report/scope set
- approval execution not implemented
- persistence not implemented
- explicit `evaluationTime` only when expiration evaluator is added
- comment outside deterministic core
- reasonCode inside deterministic core
- Package Readiness and Approval status remain separate
- approval authorization and execution result remain separate
- default gate success is `APPROVED_WITH_LIMITATIONS`
- `APPROVED` is reserved for future policy and is not returned by v1

## 25. Implementation Notes

Implemented functions:

```text
buildPackageApprovalRequest
buildPackageApprovalDecision
evaluatePackageApprovalGate
```

Implemented behavior:

- deterministic approval request id and checksum
- deterministic approval decision id and checksum
- deterministic gate core and integrity checksum
- multi-scope request support
- per-scope decision resolution
- partial approval
- fixed scope ordering
- unsupported v1 scope rejection
- scope inheritance prevention
- `USER`-only approval
- source checksum stale detection
- superseded request stale handling
- revoked decision exclusion
- `APPROVED_WITH_LIMITATIONS` maximum v1 success state
- `AUTHORIZED_WITH_LIMITATIONS` maximum v1 authorization state
- Package Readiness remains `CONDITIONALLY_READY`
- secret-like value rejection with sanitized failures
- full Evidence Report payload exclusion
- input non-mutation
- internal error sanitization
- discriminated union BuildResult for request and decision builders
- report id, report checksum, package id, package version, artifact checksum,
  verification checksum, bundle checksum, and pipeline checksum stale tests
- revoked decision references must match active decision IDs
- unknown or secret-like revoke references are invalid
- duplicate revoked decision references are normalized
- duplicate active decisions with the same integrity checksum are logical
  duplicates
- active decisions with different integrity checksums for the same scope are
  conflicts
- `REFERENCE_ONLY` expiration is never inferred from `evaluationTime`
- `EXPLICIT_TIME` requires explicit evaluation time
- expiration equality is expired
- timezone offsets are normalized through canonical instants
- `VALID` Evidence Report status is rejected as unsupported future status in v1

Gate priority:

```text
INVALID
STALE
BLOCKED
REJECTED
PENDING_APPROVAL
APPROVED_WITH_LIMITATIONS
```

## 26. Engineering Gaps

- Approval persistence is not implemented.
- Approval API/UI is not implemented.
- Authentication and authorization enforcement are not implemented.
- Runtime authorization integration is not implemented.
- Deployment authorization integration is not implemented.
- Marketplace publish authorization integration is not implemented.
- Approval records are not stored in DB.

## 27. Recommended Next Task

Recommended next single task:

```text
PACKAGE-APPROVAL-GATE-001 Final QA + Checkpoint Commit
Review the Approval Gate implementation diff, run the full quality gate, and
create a checkpoint commit only if all gates pass.
```
