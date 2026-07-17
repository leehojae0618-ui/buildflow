# Package Verification Pipeline

## 1. Status

```text
IMPLEMENTED
PM REVIEW REQUIRED
PURE PIPELINE ONLY
```

This document records the first deterministic pure pipeline that composes:

```text
Package Export
→ Package Verification
→ Package Evidence Bundle
→ Structured Pipeline Result
```

Implementation:

```text
src/features/agents/package-verification-pipeline.ts
src/features/agents/package-verification-pipeline.test.ts
```

The pipeline does not authorize Runtime execution, MCP Tool Invocation,
Provider execution, Vault access, Credential validation, DB persistence, UI,
ZIP/Installer export, Marketplace publishing, deployment, or Approval handling.

## 2. Objective

Provide one deterministic, secret-safe, structural QA path that connects the
existing package evidence contracts without duplicating their internal logic.

The pipeline exists to answer:

```text
Can BuildFlow produce a package artifact, verify it, and bind it to an
Evidence Bundle with stable checksums and clear limitations?
```

It does not answer whether the Agent ran successfully in production.

## 3. Reused Contracts

The implementation reuses the existing functions:

| Step | Existing function | Path |
|---|---|---|
| Export | `exportAgentPackageArtifact` | `src/features/agents/package-export.ts` |
| Verification | `verifyAgentPackageArtifact` | `src/features/agents/package-verification.ts` |
| Evidence Bundle | `buildPackageEvidenceBundle` | `src/features/agents/package-evidence-bundle.ts` |

The pipeline does not reimplement checksum, stable serialization, verifier, or
bundle logic.

## 4. Pipeline Contract

Format version:

```text
buildflow.package-verification-pipeline.v1
```

Main function:

```text
runPackageVerificationPipeline(input)
```

Input is based on the existing Package Export input and adds explicit
references:

```text
packageArtifactReference
verificationReportReference
approvalReference?
metadata?
```

The pipeline does not invent missing references. Missing package artifact or
verification report references produce an `INCOMPLETE` pipeline result.

## 5. Pipeline Status Model

```text
FAILED
INCOMPLETE
COMPLETED_WITH_LIMITATIONS
COMPLETED
```

Current normal success:

```text
COMPLETED_WITH_LIMITATIONS
```

`COMPLETED` is intentionally not returned by the first implementation because
Runtime, MCP Invocation, Provider execution, installation, deployment, and
Marketplace evidence are not present.

## 6. Stage Model

Stages:

```text
EXPORT
VERIFICATION
EVIDENCE_BUNDLE
```

Each stage reports:

```text
stage
status
executed
success
failures
warnings
limitations
checksum
resultReference
```

The stage summary does not copy full package payloads, full verification
reports, raw provider responses, raw MCP responses, secrets, or credential
values.

## 7. Status Rules

### FAILED

Returned when:

- Package Export fails
- Verification is `INVALID`
- Evidence Bundle is `INVALID`
- package id, package version, or checksum consistency fails
- secret safety fails
- an internal pipeline step cannot complete

### INCOMPLETE

Returned when:

- Verification is `UNVERIFIED`
- Evidence Bundle is `INCOMPLETE`
- required package/report references are missing
- required evidence is missing

### COMPLETED_WITH_LIMITATIONS

Returned when:

- Package Export succeeds
- Verification is `VERIFIED_WITH_LIMITATIONS`
- Evidence Bundle is `VALID_WITH_LIMITATIONS`
- stage consistency checks pass
- Runtime/MCP/Provider/Install/Marketplace limitations remain explicit

### COMPLETED

Reserved for a future scope. It must not be used for structural-only evidence.

## 8. Consistency Checks

The pipeline checks:

- export package id equals verification package id
- export package version equals verification package version
- export artifact checksum equals verification artifact checksum
- verification report checksum equals bundle verification checksum
- export artifact checksum equals bundle package checksum
- verification status is not upgraded
- bundle status is not upgraded

## 9. Deterministic Summary

The deterministic summary includes only:

```text
pipeline format version
package id
package version
export checksum
verification report checksum
bundle checksum
normalized stage status
normalized failures
normalized limitations
overall status
```

It excludes:

```text
timestamp
random id
absolute path
hostname
process id
environment value
metadata.generatedAt
```

Changing metadata timestamps does not change export checksum, verification
report checksum, bundle checksum, or the pipeline deterministic summary.

## 10. Evidence Reference Policy

The current Evidence Bundle contract receives verification evidence references
as strings.

Policy:

- evidence references are case-sensitive
- leading and trailing whitespace is trimmed
- trim-empty references are malformed
- duplicate references are deduplicated
- references are sorted before deterministic bundle hashing
- duplicate ID with conflicting metadata cannot occur in the current string-only
  model
- if evidence references gain metadata later, duplicate ID with conflicting
  metadata must become `STATUS_CONFLICT` or `CONTRACT_ERROR`

## 11. Secret Safety

The pipeline preserves the existing export, verification, and bundle secret
safety behavior:

- raw secret-like values cause safe failure
- credential references remain allowed
- raw secret values are not included in failure messages
- Vault content and Provider credential values are not read

## 12. Current Test Evidence

Target test:

```text
npx vitest run src/features/agents/package-verification-pipeline.test.ts
PASS — 24 tests
```

Covered behavior:

- normal input returns `COMPLETED_WITH_LIMITATIONS`
- deterministic export checksum
- deterministic verification report checksum
- deterministic bundle checksum
- deterministic pipeline summary
- metadata timestamp does not affect deterministic results
- export failure returns `FAILED`
- verification `INVALID` returns `FAILED`
- verification `UNVERIFIED` returns `INCOMPLETE`
- bundle `INVALID` returns `FAILED`
- bundle `INCOMPLETE` returns `INCOMPLETE`
- checksum, package id, and package version conflicts return `FAILED`
- `COMPLETED` is not returned
- Runtime/MCP/Provider limitations remain visible
- missing approval does not imply approval
- raw secret input fails safely without exposing the value
- credential references are allowed
- input is not mutated
- downstream stages do not execute after export failure
- evidence references are normalized according to policy

## 13. Current Package Readiness

```text
CONDITIONALLY_READY
```

Reason:

- deterministic export exists
- pure verification exists
- reference-only Evidence Bundle exists
- pure verification pipeline exists
- Runtime, MCP Invocation, Provider execution, install/deploy, and Marketplace
  evidence are still absent

## 14. Out of Scope

- Runtime execution
- actual MCP Tool Invocation
- Provider execution
- live Credential or Vault access
- Credential validation
- DB persistence
- API endpoint
- UI
- ZIP/Installer
- Marketplace
- deployment
- Approval processing
- Quality Score calculation

## 15. Engineering Gap

Clean `npm run typecheck` may depend on generated Next type files under
`.next/types`. If those files are missing, the first typecheck can fail before
`npm run build` regenerates them.

This task must record the observed verification order and should not modify
`package.json` typecheck behavior without a separate approved engineering task.

## 16. Recommended Next Task

Recommended next single task:

```text
PACKAGE-EVIDENCE-REPORT-001
Define how pipeline results are stored or presented as an evidence report
without adding Runtime, MCP Invocation, Provider execution, Marketplace, or UI
behavior.
```

Alternative PM direction:

```text
GAP-001 MCP Tool Invocation Evidence boundary
```

This alternative requires explicit approval because it may touch live
credentials, external systems, cost, and provider permissions.
