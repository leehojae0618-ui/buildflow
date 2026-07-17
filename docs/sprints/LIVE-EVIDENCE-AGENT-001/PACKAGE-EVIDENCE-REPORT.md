# Package Evidence Report

## 1. Status

```text
IMPLEMENTED
PM REVIEW REQUIRED
PURE REPORT BUILDER ONLY
```

This document defines the human-reviewable Evidence Report contract for
BuildFlow Agent Packages.

Implementation:

```text
src/features/agents/package-evidence-report.ts
src/features/agents/package-evidence-report.test.ts
```

No Runtime, MCP Invocation, Provider execution, DB, API, UI, Marketplace,
ZIP/Installer, Approval handling, or deployment behavior is implemented by this
task.

## 2. Objective

Package Evidence Report should explain, in a compact and reviewable form:

1. which package was reviewed
2. which Package Export artifact was used
3. which Package Verification Report was used
4. which Evidence Bundle was used
5. what the Package Verification Pipeline status is
6. which checks passed or failed
7. which evidence exists or is missing
8. which limitations remain
9. whether human approval is required
10. whether the current state implies deployability

The answer to deployability is currently:

```text
No. Evidence Report validity must not imply runtime, deployment, installation,
Marketplace, Provider, MCP Invocation, or user approval success.
```

## 3. Current Context

Existing implemented evidence contracts:

| Layer | Status | Path |
|---|---|---|
| Package Export | `IMPLEMENTED` | `src/features/agents/package-export.ts` |
| Package Verification | `IMPLEMENTED` | `src/features/agents/package-verification.ts` |
| Package Evidence Bundle | `IMPLEMENTED` | `src/features/agents/package-evidence-bundle.ts` |
| Package Verification Pipeline | `IMPLEMENTED` | `src/features/agents/package-verification-pipeline.ts` |
| Package Evidence Report | `IMPLEMENTED` | `src/features/agents/package-evidence-report.ts` |
| QA Scope | `DRAFT / QA SCOPE UNDER REVIEW` | `docs/sprints/LIVE-EVIDENCE-AGENT-001/QA-SCOPE.md` |

Current package readiness remains:

```text
CONDITIONALLY_READY
```

Reason: BuildFlow can structurally export, verify, bundle, and compose Agent
Package evidence. It still lacks actual Runtime, MCP Invocation, Provider
execution, installation, deployment, Marketplace, and approval-completion
evidence.

## 4. Report Boundary

Evidence Report is a summary-first, reference-based contract.

It may include:

- package id and version
- source checksums and references
- pipeline status
- report structural status
- package readiness summary
- check/failure/evidence summaries
- warnings and limitations
- approval requirement summary
- deployability and marketplace readiness declarations
- deterministic core and integrity checksum
- optional human-readable summary

It must not include:

- full Package artifact payload
- full Verification Report payload
- full Evidence Bundle payload
- full Pipeline Result payload
- raw Provider response
- raw MCP response
- raw logs
- raw secrets
- credential values
- Vault content
- unnecessary personal information

## 5. Proposed Report Contract

Format version:

```text
buildflow.package-evidence-report.v1
```

Candidate types:

```text
PackageEvidenceReportStatus
PackageEvidenceReportSectionStatus
PackageEvidenceReportReference
PackageEvidenceReportCheckSummary
PackageEvidenceReportFailureSummary
PackageEvidenceReportEvidenceSummary
PackageEvidenceReportApproval
PackageEvidenceReportReadiness
PackageEvidenceReportHumanSummary
PackageEvidenceReportDeterministicCore
PackageEvidenceReport
```

Top-level fields:

```text
formatVersion
reportId
packageId
packageVersion
sourceReferences
pipelineStatus
reportStatus
packageReadiness
checksSummary
failuresSummary
warnings
limitations
evidenceSummary
approval
deployability
marketplaceReadiness
humanSummary
deterministicCore
reportIntegrityChecksum
metadata
```

## 6. Source Reference Model

Evidence Report links upstream outputs by checksum/reference.

```text
sourceReferences:
  packageArtifact:
    checksum
    reference
    formatVersion
  verificationReport:
    checksum
    reference
    formatVersion
  evidenceBundle:
    checksum
    reference
    formatVersion
  verificationPipeline:
    checksum
    reference
    formatVersion
```

Rules:

- missing references must not be invented
- missing checksums must produce `INCOMPLETE` or `INVALID`, depending on source
  severity
- references are identifiers, not embedded payloads
- checksum mismatch is a structural failure

## 7. Status Model

Report status candidates:

```text
INVALID
INCOMPLETE
VALID_WITH_LIMITATIONS
VALID
```

Recommended v1 default success:

```text
VALID_WITH_LIMITATIONS
```

`VALID` should not be returned in v1 unless PM explicitly approves a narrower
definition that means “valid for structural evidence scope only.” Even then,
`VALID` must not imply:

- Runtime success
- MCP Invocation success
- Provider execution success
- installability
- deployability
- Marketplace publishability
- user approval completion

## 8. Status Separation

Evidence Report must keep these concepts separate:

| Concept | Example values | Meaning |
|---|---|---|
| Report structural status | `INVALID`, `INCOMPLETE`, `VALID_WITH_LIMITATIONS`, `VALID` | Whether the report contract itself is structurally valid |
| Pipeline status | `FAILED`, `INCOMPLETE`, `COMPLETED_WITH_LIMITATIONS`, `COMPLETED` | Upstream package evidence pipeline result |
| Package Readiness | `NOT_READY`, `CONDITIONALLY_READY`, `READY` or existing equivalent | Package-level readiness judgement |
| Approval requirement | required/not required | Whether approval is needed |
| Approval completion | pending/approved/rejected/unknown | Whether approval has happened |
| Deployability | not deployable/unknown/deployable | Whether deployment evidence exists |
| Marketplace readiness | not ready/unknown/ready | Whether marketplace evidence exists |

The report must not collapse these into one “ready” claim.

## 9. Package Readiness Relationship

Evidence Report should not redefine the existing Agent Package/Profile
readiness contract.

Recommended v1:

- include a summary snapshot
- include upstream reference/checksum when available
- preserve current package readiness as `CONDITIONALLY_READY`
- never upgrade readiness based only on report validity

Suggested fields:

```text
packageReadiness:
  structuralReadiness
  runtimeReadiness
  deploymentReadiness
  marketplaceReadiness
  approvalReadiness
  source
  limitations
```

Current expected values:

```text
structuralReadiness: CONDITIONALLY_READY
runtimeReadiness: NOT_VERIFIED
deploymentReadiness: NOT_VERIFIED
marketplaceReadiness: NOT_VERIFIED
approvalReadiness: PENDING_OR_UNKNOWN
```

## 10. Evidence Summary Model

Evidence Report summarizes upstream evidence; it does not duplicate the Bundle
or Pipeline validation rules.

Evidence categories:

```text
STRUCTURAL
EXPORT
VERIFICATION
BUNDLE
PIPELINE
RUNTIME
MCP_INVOCATION
PROVIDER_EXECUTION
INSTALLATION
DEPLOYMENT
MARKETPLACE
APPROVAL
```

Candidate item fields:

```text
category
required
present
verified
reference
checksum
limitation
reasonCode
```

Summary buckets:

```text
present
missingRequired
missingOptional
unsupported
```

Rules:

- structural/package evidence can be present
- Runtime/MCP/Provider/install/deploy/Marketplace evidence is currently
  missing or unsupported
- missing required evidence should prevent `VALID`
- missing optional evidence can be represented as warning or limitation, pending
  PM decision

## 11. Approval Relationship

Evidence Report does not perform approval.

Recommended v1:

```text
approval:
  required
  reference
  completionStatus
  informationalOnly
  limitations
```

Rules:

- approval reference is allowed
- missing approval reference must not be inferred as approved
- status snapshot, if included, is informational only
- report status and approval status remain separate
- approval completion evidence requires its own reference

## 12. Deployability and Marketplace Readiness

Evidence Report should make non-deployability explicit.

Suggested fields:

```text
deployability:
  status: NOT_VERIFIED
  reason: Deployment evidence is not present.

marketplaceReadiness:
  status: NOT_VERIFIED
  reason: Marketplace publish evidence is not present.
```

Current report validity must not be marketed as deployable, installable, or
publishable.

## 13. Deterministic ID and Integrity

Report id candidate:

```text
sha256(stableSerialize({
  packageId,
  packageVersion,
  packageArtifactChecksum,
  verificationReportChecksum,
  evidenceBundleChecksum,
  pipelineSummaryChecksum
}))
```

Report integrity checksum:

```text
sha256(stableSerialize(report.deterministicCore))
```

Deterministic core should include:

```text
formatVersion
reportId
packageId
packageVersion
source checksums
pipelineStatus
reportStatus
packageReadiness
normalized checksSummary
normalized failuresSummary
normalized warnings
normalized limitations
normalized evidenceSummary
approvalRequired
approvalReference
deployability
marketplaceReadiness
```

Deterministic core must exclude:

```text
generatedAt
current timestamp
random ID
absolute path
hostname
process ID
environment-specific value
insertion-order-dependent data
metadata object as a whole
```

## 14. Human-readable Summary Boundary

Evidence Report may include human-readable fields for future UI, API, PDF, or
review workflows:

```text
title
executiveSummary
decisionSummary
nextRequiredActions
```

Recommended v1:

- machine-readable status fields are authoritative
- human-readable summary must be derived from safe fields
- human-readable summary must not include secrets, raw responses, logs, or
  payloads
- whether human-readable summary belongs inside deterministic core remains a PM
  decision

Default recommendation:

```text
Keep human-readable summary outside deterministic core in v1.
```

Reason: summary wording may evolve without changing the underlying evidence
decision.

## 15. Secret Safety

Forbidden:

- API key
- access token
- refresh token
- password
- private key
- client secret
- Provider credential value
- Vault content
- raw Provider/MCP response
- raw stack trace containing sensitive values
- unnecessary personal information

Allowed:

- credential reference
- secret reference identifier
- Vault reference identifier
- checksum
- sanitized failure code

The report must never place actual secret values in:

- failure
- warning
- limitation
- evidence summary
- human-readable summary
- deterministic core
- metadata

## 16. Open PM Decisions

1. Should Evidence Report remain strictly reference-only?
2. Are summary snapshots from source results allowed?
3. Is the proposed `reportId` generation rule accepted?
4. Should v1 default success be `VALID_WITH_LIMITATIONS`?
5. Should v1 ever return `VALID`?
6. Should approval completion status snapshot be included?
7. Should Package Readiness be snapshot, reference, or both?
8. How should deployability be represented in product copy?
9. Should missing optional evidence be a warning, limitation, or both?
10. Should `nextRequiredActions` be part of deterministic core?
11. Should human-readable summary be included in report integrity checksum?
12. Which upstream contract owns evidence category required/optional status?
13. Does report generation require the full Pipeline Result, or only checksum
    and reference?

## 17. Implementation Evidence

Implemented main function:

```text
buildPackageEvidenceReport(input)
```

Current normal successful report status:

```text
VALID_WITH_LIMITATIONS
```

`VALID` is intentionally not returned by the first implementation.

Target test:

```text
npx vitest run src/features/agents/package-evidence-report.test.ts
PASS — 40 tests
```

Implemented files:

```text
src/features/agents/package-evidence-report.ts
src/features/agents/package-evidence-report.test.ts
src/features/agents/index.ts
```

## 18. Recommended Next Task

Recommended next single task:

```text
PACKAGE-EVIDENCE-REPORT-001 Final QA + Checkpoint Commit
Review the Evidence Report implementation diff, run full regression checks, and
create a checkpoint commit only if all gates pass.
```
