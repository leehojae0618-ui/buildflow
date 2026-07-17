# Package Verification

## 1. Status

```text
DRAFT
NOT APPROVED
DESIGN ONLY
```

This document designs how BuildFlow should verify an exported Agent Package
artifact independently from the creator that produced it.

It does not approve implementation and does not authorize runtime execution,
MCP Tool Invocation, Provider execution, deployment, Marketplace publishing,
Vault access, Credential access, database changes, API changes, UI changes, or
ZIP installer creation.

## 2. Objective

Define a Package Verification structure that can evaluate an exported Agent
Package artifact using deterministic, secret-safe, evidence-backed checks.

The verifier must not trust creator-provided readiness by itself. It must
recompute artifact integrity, parse and validate the package/profile contract,
evaluate available Evidence, classify failures, and produce a safe Verification
Report that can later feed Approval Gates and Quality Score inputs.

## 3. Current Context

The following implementation evidence was checked in the current repository:

| Area | Existing path | Current state |
|---|---|---|
| Agent Package export artifact | `src/features/agents/package-export.ts` | `IMPLEMENTED` |
| Agent Package export tests | `src/features/agents/package-export.test.ts` | `IMPLEMENTED` |
| Agent Package/Profile contract | `src/features/agents/package-profile.ts` | `IMPLEMENTED` |
| Agent Definition validator | `src/features/agents/validator.ts` | `IMPLEMENTED` |
| Agent Validation Gate | `src/features/agents/validation-gate.ts` | `IMPLEMENTED` |
| Agent capability and blueprint types | `src/features/agents/types.ts` | `IMPLEMENTED` |
| QA scope and readiness criteria | `docs/sprints/LIVE-EVIDENCE-AGENT-001/QA-SCOPE.md` | `DRAFT / QA SCOPE UNDER REVIEW` |

Observed export artifact facts:

- Artifact format version is `bps-agent-profile-artifact-1.0`.
- Payload is deterministic JSON.
- Metadata includes content type, package id, package version, checksum, byte
  length, and deterministic flag.
- Export requires `AgentPackageReadinessResult.status === "READY"` and
  `exportReady === true`.
- Export blocks secret-like values and raw credential value fields.
- Export does not write ZIP files, upload artifacts, publish packages, invoke
  Providers, read Vault, or call MCP Tools.

Current package readiness remains:

```text
CONDITIONALLY_READY
```

Reason: package/profile export evidence exists, but runtime execution, MCP Tool
Invocation, ZIP installer export, installability, and Marketplace publishing
evidence are not implemented or approved.

## 4. Verification Boundary

Package Verification verifies the artifact and its declared contract evidence.

It may verify:

- artifact format
- checksum and byte length
- deterministic payload core
- JSON parseability
- package/profile contract shape
- package readiness safety fields
- secret and credential safety
- Agent/Profile cross-contract consistency
- evidence reference presence and limitations
- approval requirement declarations
- reportable verification status

It must not verify or perform:

- actual Agent Runtime execution
- actual MCP Tool Invocation
- Provider connection
- Credential validity
- Vault content
- deployment
- Marketplace publishing
- installation
- ZIP archive transport
- cost-incurring action
- external resource mutation

Verification is not a substitute for live functional evidence. If live evidence
is missing, the verifier must report limitations instead of claiming full
runtime readiness.

## 5. Verification Pipeline

```text
Artifact Input
→ Format Version Check
→ Integrity Check
→ Parse
→ Package/Profile Contract Validation
→ Secret/Credential Safety Check
→ Cross-contract Consistency Check
→ Evidence Evaluation
→ Verification Report
→ Approval Gate
```

| Step | Input | Output | Failure conditions | Failure code | Required evidence | Next step condition |
|---|---|---|---|---|---|---|
| Artifact Input | `AgentPackageExportArtifact`-like object with metadata and payload | Candidate artifact envelope | Missing metadata, missing payload, payload not string | `FORMAT_ERROR` | Artifact envelope exists | Metadata and payload are present |
| Format Version Check | Artifact metadata and parsed or unparsed format version | Accepted format version | Unsupported or missing format version | `VERSION_UNSUPPORTED` | Known version list including `bps-agent-profile-artifact-1.0` | Format version is supported |
| Integrity Check | Metadata checksum, byte length, payload | Integrity result | SHA-256 mismatch, byte length mismatch, deterministic flag missing/false | `INTEGRITY_ERROR` | Metadata checksum and byte length | Payload integrity matches metadata |
| Parse | Payload string | Parsed verification core | Invalid JSON, root not object, missing `profile` or `readiness` | `FORMAT_ERROR` | JSON payload | Parsed object contains expected verification core |
| Package/Profile Contract Validation | Parsed profile and readiness | Contract validation result | Missing package id/version, invalid format, missing agent metadata, invalid dependency structure | `CONTRACT_ERROR` | Existing `AgentPackageProfile` and readiness contracts | Required profile fields are valid |
| Secret/Credential Safety Check | Parsed profile and readiness | Secret safety result | Secret-like value, raw credential value field, non-reference credential | `SECRET_SAFETY_ERROR` | Secret patterns, credential reference-only contract | No unsafe secret or credential value is found |
| Cross-contract Consistency Check | Profile, readiness, agent metadata, dependencies, verification rules | Consistency result | Readiness says READY while export safety is unsafe, dependency lacks rule/reference, required MCP dependency has no declaration | `READINESS_ERROR` or `CONTRACT_ERROR` | Package/Profile contract, validation rules, dependencies | Declared readiness and package contract agree |
| Evidence Evaluation | Evidence references and limitations | Evidence result | Required evidence reference absent, unapproved live claim, missing quality gate reference | `EVIDENCE_MISSING` | Evidence references, QA scope, limitation declarations | Required non-live evidence exists or limitation is explicit |
| Verification Report | All check results | Report object | Internal verifier exception, report core not deterministic | `INTERNAL_VERIFIER_ERROR` | Executed check list and deterministic core | Report can be produced safely |
| Approval Gate | Verification Report | Approval decision input | Cost/write/public/destructive/high-risk requirements lack approval reference | `READINESS_ERROR` | Approval requirement declarations and references | Gate can decide whether user approval is required |

## 6. Verification Report Contract

The report should separate a deterministic verification core from non-
deterministic metadata.

### Deterministic Core

The deterministic core should be stable for the same artifact and same verifier
rules.

Required fields:

```text
reportFormatVersion
verifierVersion
packageId
packageVersion
artifactFormatVersion
artifactChecksumSha256
artifactByteLength
overallStatus
executedChecks
passedChecks
failedChecks
warnings
limitations
evidenceReferences
secretSafety
approvalRequirement
failureClassifications
qualityScoreInputs
```

### Non-deterministic Metadata

These fields should not be part of the deterministic core checksum:

```text
generatedAt
verifierInstanceId
operatorId
environmentId
requestId
```

### Check Result Shape

Each executed check should include:

```text
id
name
status
failureCode
severity
safeMessage
evidenceRefs
limitations
userActionable
```

`safeMessage` must never contain raw Provider responses, secrets, tokens,
passwords, private keys, Vault content, or unnecessary personal information.

### Report Integrity

Recommended report integrity fields:

```text
deterministicCoreChecksumSha256
artifactChecksumSha256
verifierVersion
```

The report checksum should be calculated from the deterministic core only.

## 7. Verification Status Model

| Status | Entry condition | Meaning | Forbidden product expression |
|---|---|---|---|
| `UNVERIFIED` | No verification report exists, or verification has not run | Artifact has not been independently checked | Do not say package is safe, ready, installable, or verified |
| `INVALID` | Format, integrity, contract, secret safety, or required evidence check fails | Artifact should not be trusted for package workflows | Do not offer install, publish, READY, or verified labels |
| `VERIFIED_WITH_LIMITATIONS` | Deterministic artifact, contract, integrity, and secret safety checks pass, but live/runtime/Marketplace/installability evidence is missing or explicitly limited | Artifact is structurally and safely verifiable for planning/QA, with limitations | Do not imply runtime execution, MCP Tool availability, deployment, installation, or Marketplace readiness |
| `VERIFIED` | All required checks for the claimed scope pass, and required evidence exists for every claim made | Artifact is verified for the explicitly declared scope only | Do not imply capabilities outside the report scope |

`VERIFIED` does not mean:

- Runtime execution is possible
- MCP Tool calls are possible
- Provider connections are complete
- The package is installable
- The package is deployable
- The package is Marketplace-publishable

Those claims require separate evidence and separate approval gates.

## 8. Failure Classification

| Classification | Typical cause | User actionable? | System actionable? | Recommended safe message |
|---|---|---:|---:|---|
| `FORMAT_ERROR` | Missing payload, invalid JSON, wrong artifact shape | Yes | No | The package file could not be read as a BuildFlow Agent Package artifact. |
| `INTEGRITY_ERROR` | Checksum or byte length mismatch | Yes | No | The package artifact does not match its recorded integrity metadata. |
| `CONTRACT_ERROR` | Missing required package/profile fields or invalid dependency structure | Yes | Sometimes | The package contract is incomplete or inconsistent. |
| `READINESS_ERROR` | Declared readiness conflicts with validation, export safety, dependencies, or approval requirements | Yes | Sometimes | The package is not ready for this verification scope. |
| `SECRET_SAFETY_ERROR` | Raw secret, token, password, private key, credential value, or unsafe field is present | Yes | No | The package includes information that must not be stored or shared. |
| `EVIDENCE_MISSING` | Required evidence reference is absent or live claim lacks evidence | Yes | No | Additional evidence is required before this package can be marked verified. |
| `VERSION_UNSUPPORTED` | Unknown artifact/report/package format version | Yes | Yes | This package format is not supported by the current verifier. |
| `INTERNAL_VERIFIER_ERROR` | Verifier implementation exception or impossible state | No | Yes | The verifier could not complete the check. No package readiness was granted. |

## 9. Evidence Bundle

The Evidence Bundle is a safe collection of references and derived check
results used by the Verification Report.

It may include:

- contract validation results
- executed check ids and outcomes
- test or quality gate references
- artifact checksum and byte length
- export format evidence
- deterministic core checksum
- limitation declarations
- approval record references
- secret safety check result
- missing evidence counts

It must not include:

- raw secret
- access token
- refresh token
- password
- private key
- private credential value
- Vault content
- raw Provider response body
- raw MCP Tool response body
- unnecessary personal information

Evidence references should point to safe records, reports, or checks. They
should not duplicate sensitive source material.

## 10. Approval Gate

Package Verification feeds the Approval Gate but does not replace it.

Approval Gate responsibilities:

- decide whether user approval is required before install, publish, deploy,
  external write, public change, or cost-incurring action
- block actions outside the verified scope
- require additional approval if package limitations change
- prevent Marketplace publishing without Marketplace-specific evidence
- prevent MCP Tool Invocation without live MCP execution approval and evidence

Verification Report should provide:

- `approvalRequirement`
- required approval categories
- missing approval references
- risk and permission summary
- limitations that affect approval

The verifier must not auto-approve actions.

## 11. Quality Score Inputs

This design does not implement Quality Score and does not define a scoring
formula.

The Verification Report can provide objective inputs:

- required check pass count
- required check fail count
- optional warning count
- limitation count
- missing evidence count
- contract consistency result
- secret safety result
- integrity check result
- unsupported version result
- approval requirement coverage
- deterministic artifact result
- verification scope coverage

Quality Score must not convert missing live evidence into a passing runtime
claim.

## 12. Security Requirements

- Never trust self-declared readiness alone.
- Recompute checksum and byte length from the payload.
- Parse and validate the package/profile contract independently.
- Keep deterministic verification core separate from timestamps and request
  metadata.
- Reject raw secret-like values and raw credential value fields.
- Preserve credential references only.
- Do not read Vault or Credential values.
- Do not store raw Provider or MCP Tool response bodies.
- Do not run MCP Tools or Providers during package verification.
- Do not mark unsupported or missing evidence as verified.
- Do not produce READY or VERIFIED claims beyond the explicit report scope.

## 13. Out of Scope

- Package Verification code implementation
- Runtime Compiler
- Agent Runtime
- MCP Invocation
- Provider execution
- Credential provisioning
- Vault access
- UI
- Download feature
- ZIP Installer
- Marketplace publish
- Deployment
- Database changes
- API changes
- Quality Score formula

## 14. Open Decisions

1. Should the first implementation expose a pure verifier function only, or also
   define TypeScript report types in the same Sprint?
2. Should report format version start at `bps-agent-verification-report-1.0`?
3. Should `VERIFIED_WITH_LIMITATIONS` be the expected status for the current
   deterministic JSON artifact until live MCP/runtime evidence exists?
4. Which evidence references are mandatory for the first verifier:
   package export tests, package readiness result, or both?
5. Should Approval Gate integration remain document-only for the first
   implementation, or should the report include typed approval input fields?
6. Should unsupported artifact versions be user-actionable, system-actionable,
   or both?

## 15. Recommended Implementation Task

Recommended next single implementation task after PM approval:

```text
PACKAGE-VERIFICATION-001
Implement pure Package Verification contracts and verifier function.
```

Suggested minimal file scope:

```text
src/features/agents/package-verification.ts
src/features/agents/package-verification.test.ts
src/features/agents/index.ts
```

Suggested first implementation boundaries:

- parse `AgentPackageExportArtifact`
- verify supported artifact format
- recompute checksum and byte length
- parse deterministic JSON payload
- validate package/profile safety using existing contracts where possible
- classify failures using the failure model in this document
- produce a secret-safe Verification Report
- do not call Runtime, MCP, Providers, Vault, Marketplace, DB, API, or UI

Do not start implementation until PM approves the scope.
