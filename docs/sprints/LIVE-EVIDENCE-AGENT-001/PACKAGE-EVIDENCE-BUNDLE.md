# Package Evidence Bundle

## 1. Status

```text
IMPLEMENTED
PM REVIEW REQUIRED
REFERENCE-ONLY PURE BUILDER
```

This document defines the minimal deterministic Evidence Bundle contract for
BuildFlow Agent Packages.

The first reference-only pure builder implementation exists at:

```text
src/features/agents/package-evidence-bundle.ts
src/features/agents/package-evidence-bundle.test.ts
```

It does not authorize database storage, API endpoints, UI, Runtime, MCP
Invocation, Provider execution, Vault access, Approval handling, ZIP/Installer
packaging, Marketplace publishing, deployment, or Quality Score calculation.

## 2. Objective

Define a deterministic bundle that can connect:

- a Package Export artifact
- a Package Verification Report
- safe evidence references
- limitations
- approval references
- future Quality Score inputs

The bundle should make the relationship between the exported package and its
verification report inspectable without duplicating payloads or storing
sensitive values.

## 3. Current Context

The current repository already contains:

| Area | Existing path | Current state |
|---|---|---|
| Package Export artifact | `src/features/agents/package-export.ts` | `IMPLEMENTED` |
| Package Export tests | `src/features/agents/package-export.test.ts` | `IMPLEMENTED` |
| Package Verification pure verifier | `src/features/agents/package-verification.ts` | `IMPLEMENTED` |
| Package Verification tests | `src/features/agents/package-verification.test.ts` | `IMPLEMENTED` |
| Package Evidence Bundle builder | `src/features/agents/package-evidence-bundle.ts` | `IMPLEMENTED` |
| Package Evidence Bundle tests | `src/features/agents/package-evidence-bundle.test.ts` | `IMPLEMENTED` |
| Agent Package/Profile contract | `src/features/agents/package-profile.ts` | `IMPLEMENTED` |
| Agent Validation Gate | `src/features/agents/validation-gate.ts` | `IMPLEMENTED` |
| Agent contract validator | `src/features/agents/validator.ts` | `IMPLEMENTED` |

Current package readiness remains:

```text
CONDITIONALLY_READY
```

Reason: deterministic package export and pure package verification exist, but
runtime execution, actual MCP Invocation, Provider execution, installation,
deployment, Marketplace publishing, and persisted Evidence Bundle storage are
not implemented or approved.

Current successful bundle status for the reference-only v1 scope is:

```text
VALID_WITH_LIMITATIONS
```

`VALID` is intentionally not returned by the first implementation.

## 4. Bundle Boundary

The first Evidence Bundle should be reference-first.

It should include:

- package artifact checksum and reference
- verification report checksum and reference
- package identifier and version
- evidence references
- checks summary
- failures summary
- warnings and limitations
- approval reference, if one exists
- deterministic core and bundle integrity checksum
- metadata outside the deterministic core

It should not include:

- full Package artifact payload
- full Verification Report payload
- raw Provider responses
- raw MCP Tool responses
- raw secrets
- credential values
- Vault content
- unnecessary personal information

The bundle is a relationship and evidence index, not a replacement for the
artifact or verification report.

## 5. Bundle Contract

Recommended first contract fields:

```text
formatVersion
bundleId
packageId
packageVersion
packageArtifact
verificationReport
evidenceReferences
checksSummary
failuresSummary
warnings
limitations
approval
status
deterministicCore
bundleIntegrityChecksum
metadata
```

Suggested nested shapes:

```text
packageArtifact:
  reference
  checksumSha256
  formatVersion
  contentType
  byteLength

verificationReport:
  reference
  checksumSha256
  reportFormatVersion
  verifierId
  verifierVersion
  overallStatus

evidenceReferences:
  id
  kind
  required
  reference
  checksumSha256?
  status
  limitations

approval:
  required
  statusSnapshot
  reference?
  limitations
```

The bundle should preserve references and checksums. It should not embed
payloads in the first version.

## 6. Deterministic Core

The deterministic core should be stable for the same package artifact,
verification report, and evidence references.

Recommended deterministic core fields:

```text
formatVersion
bundleId
packageId
packageVersion
packageArtifactChecksum
verificationReportChecksum
evidenceReferences
checksSummary
failuresSummary
warnings
limitations
approvalRequired
approvalReference
status
```

The deterministic core must not include:

- current timestamp
- random id
- absolute file path
- hostname
- process id
- environment-specific values
- insertion-order-dependent object keys
- unsorted evidence references

Metadata such as `generatedAt`, `operatorId`, or `requestId` belongs outside
the deterministic core.

## 7. Integrity Model

Integrity should be layered:

1. Package artifact integrity
   - uses Package Export artifact checksum.
   - confirms the bundle points to the expected exported package artifact.
2. Verification report integrity
   - uses Package Verification report integrity checksum.
   - confirms the bundle points to the expected verification report.
3. Bundle integrity
   - computed from the deterministic core only.
   - excludes timestamps and environment metadata.

Recommended checksum algorithm:

```text
sha256(stableSerialize(bundle.deterministicCore))
```

The first implementation should reuse existing stable serialization rules where
possible rather than introducing a separate canonicalization scheme.

## 8. Evidence Reference Model

Evidence references should be normalized and sorted deterministically.

Recommended reference fields:

```text
id
kind
required
reference
checksumSha256?
status
limitations
```

Suggested `kind` values:

```text
PACKAGE_EXPORT
PACKAGE_VERIFICATION
VALIDATION_GATE
SECRET_FREE_EXPORT
PACKAGE_PROFILE_CONTRACT
MCP_DEPENDENCY_CONTRACT
APPROVAL_RECORD
RUNTIME_EVIDENCE
PROVIDER_EVIDENCE
MARKETPLACE_EVIDENCE
```

Duplicate references should be normalized by stable `id` or by
`kind + reference + checksumSha256`.

Ordering rule:

```text
sort by kind, then id, then reference
```

Missing required evidence should not be silently omitted. It should produce
`INCOMPLETE` or `INVALID`, depending on whether the missing evidence is required
for the bundle scope or structurally invalid.

## 9. Status Model

| Status | Entry condition | Meaning | Must not imply |
|---|---|---|---|
| `INCOMPLETE` | Required references are missing, or bundle has not collected all required evidence for the claimed scope | Bundle cannot yet support a complete package evidence decision | Runtime success, installation, deployment, Marketplace readiness |
| `VALID` | All required references and integrity checks for the declared bundle scope pass, and there are no limitations for that scope | Bundle is valid for its explicit evidence scope only | Runtime success, MCP Invocation success, Provider execution success, installability, deployment, Marketplace readiness, user approval |
| `VALID_WITH_LIMITATIONS` | Required structural references pass, but runtime/MCP/provider/install/deploy/Marketplace evidence is missing or explicitly limited | Bundle can support planning/QA and limited package evidence claims | Full production readiness or Marketplace readiness |
| `INVALID` | Bundle integrity fails, required checks contradict each other, unsafe evidence is present, or required evidence is structurally invalid | Bundle should not be trusted | Any READY, verified, installable, publishable, or executable claim |

`VALID` does not mean:

- Runtime execution succeeded
- actual MCP Invocation succeeded
- Provider execution succeeded
- package is installable
- package is deployable
- package is Marketplace-publishable
- user approval is complete

Those claims require separate evidence references and approval records.

## 10. Approval Relationship

The Evidence Bundle should reference approval; it should not perform approval.

Recommended approval fields:

```text
required
statusSnapshot
reference
limitations
```

Rules:

- approval status is separate from bundle status.
- `VALID` or `VALID_WITH_LIMITATIONS` must not be treated as approval.
- missing approval reference should be represented as a limitation or
  `INCOMPLETE`, depending on whether approval is required for the current
  action.
- approval records should be referenced, not embedded with sensitive details.

## 11. Security Requirements

- Do not include raw secrets.
- Do not include access tokens.
- Do not include refresh tokens.
- Do not include passwords.
- Do not include private keys.
- Do not include client secrets.
- Do not include Vault content.
- Do not include Provider credential values.
- Do not include raw Provider response bodies.
- Do not include raw MCP response bodies.
- Do not include unnecessary personal information.
- Do not convert missing evidence into a passing status.
- Do not treat self-declared readiness as sufficient.
- Keep payload references separate from payload contents.

## 12. Quality Score Inputs

This design does not implement Quality Score and does not define a scoring
formula.

The bundle can provide objective inputs:

- package artifact integrity result
- verification report integrity result
- required evidence count
- missing required evidence count
- warning count
- limitation count
- failure count
- approval requirement status
- runtime evidence present or absent
- MCP evidence present or absent
- provider evidence present or absent
- Marketplace evidence present or absent

Quality Score must not transform missing runtime, MCP, Provider, installation,
deployment, or Marketplace evidence into a positive readiness claim.

## 13. Out of Scope

- Evidence Bundle code implementation
- DB storage
- API endpoint
- UI
- Runtime
- MCP Invocation
- Provider execution
- Vault access
- actual Approval processing
- ZIP/Installer
- Marketplace
- deployment
- Quality Score calculation
- embedding full package artifact payload
- embedding full verification report payload

## 14. Open Decisions

1. Should the first implementation include only references, or allow optional
   embedded summaries for offline review?
2. Should `bundleId` be derived from package id, package version, artifact
   checksum, and verification report checksum?
3. Should `VALID_WITH_LIMITATIONS` be the default successful status until
   runtime/MCP/provider evidence exists?
4. Should approval be represented as only a reference, or as a reference plus
   status snapshot?
5. Should missing optional evidence be a warning or limitation?
6. Should required evidence be defined by package profile verification rules or
   by bundle policy?
7. Should duplicate evidence references be rejected or normalized?
8. Should bundle integrity include evidence reference checksums when available?

## 15. Recommended Implementation Task

Implemented first task:

```text
PACKAGE-EVIDENCE-BUNDLE-001
Implement pure Evidence Bundle contract and deterministic bundle builder.
```

Implemented file scope:

```text
src/features/agents/package-evidence-bundle.ts
src/features/agents/package-evidence-bundle.test.ts
src/features/agents/index.ts
```

Implemented boundaries:

- consume package artifact metadata/reference, not full payload
- consume package verification report metadata/reference, not full report
- normalize evidence references
- calculate deterministic bundle core
- calculate bundle integrity checksum
- produce `VALID_WITH_LIMITATIONS` for current package evidence scope
- reject unsafe or incomplete required evidence
- do not call Runtime, MCP, Providers, Vault, Marketplace, DB, API, or UI

Still not implemented:

- persisted Evidence Bundle storage
- API endpoint
- UI download or display
- Approval Gate integration
- Runtime evidence generation
- MCP Invocation evidence generation
- Provider execution evidence generation
- Marketplace evidence generation
- Quality Score formula

Recommended next single task:

```text
PACKAGE-VERIFICATION-PIPELINE-001
Compose export → verification → evidence bundle as one pure pipeline.
```
