# Current Sprint Memory

## Current Repository State

Checked state during memory creation:

```text
branch: main
working tree: clean
local/remote: in sync
```

Actual Git HEAD observed:

```text
de62266 docs: draft live evidence agent scope
```

## Current Sprint

No active implementation Sprint.

Current workflow state from `.buildflow`:

```text
BETWEEN_SPRINTS
```

## Last Completed Sprint

```text
AGENT-PACKAGE-001
```

Status:

- CLOSED
- pushed through `be12055`
- implemented Agent Package/Profile contract

## Next Candidate

```text
LIVE-EVIDENCE-AGENT-001
```

Status:

```text
DRAFT
NOT APPROVED
NOT SCOPE FROZEN
QA Scope 미확정
```

Roadmap alignment:

```text
AGENT-EVIDENCE-001
```

## Current Goal

QA-only scope has been documented for the next Sprint candidate.

Current recommendation:

```text
QA-only first
```

The QA Scope document confirms Evidence checklist, Package/Profile readiness
criteria, existing Evidence coverage, and live-action-needed gaps without
executing Providers, deployment, MCP Invocation, or Credential/Vault reads.

QA document:

```text
docs/sprints/LIVE-EVIDENCE-AGENT-001/QA-SCOPE.md
```

## Approved Scope

None yet for LIVE-EVIDENCE-AGENT-001.

## Draft Candidate Scope

- Confirm representative Agent target and Evidence checklist.
- Reuse existing Agent Definition and Package/Profile contracts.
- Separate document/fixture checks from live action checks.
- Record PASS / BLOCKED / NOT SUPPORTED criteria.
- Preserve secret-safe reporting.

## Unresolved / Needs PM Decision

1. Should LIVE-EVIDENCE-AGENT-001 be QA-only?
2. Should Sprint ID remain `LIVE-EVIDENCE-AGENT-001` or align to
   `AGENT-EVIDENCE-001`?
3. Is the current Package Readiness judgement `CONDITIONALLY_READY` accepted?
4. Should the next work address GAP-001 MCP Tool Invocation Evidence or a
   separate ZIP/Installer export scope?
5. Which live actions, if any, should be deferred into a later approved Sprint?
6. Should `.buildflow/STATUS.md` Latest Known Commit be updated from `be12055`
   to `de62266` in the next status transition?

## Current QA Finding

Package Readiness:

```text
CONDITIONALLY_READY
```

Reason:

- Agent Package/Profile contract exists.
- Readiness validator exists.
- Unit tests and AGENT-PACKAGE-001 quality gate passed.
- Deterministic JSON Agent Package artifact export now exists for ready
  profiles.
- Export validation, secret-free enforcement, deterministic serialization,
  invalid input rejection, and non-mutation tests exist.
- Representative `ai-inquiry-v1` provider path has prior live Evidence.
- Actual MCP Invocation Evidence is not found.
- Marketplace publish Evidence is not found.

## Package Verification Design

Design status:

```text
IMPLEMENTED
PM REVIEW REQUIRED
PURE VERIFIER ONLY
```

Design document:

```text
docs/sprints/LIVE-EVIDENCE-AGENT-001/PACKAGE-VERIFICATION.md
```

The design defines an independent verification boundary for exported Agent
Package artifacts:

- Verification Pipeline
- Verification Report Contract
- Artifact Integrity Check
- Package/Profile Contract Validation
- Secret/Credential Safety Check
- Evidence Bundle boundary
- Verification Status model
- Failure Classification
- Quality Score input candidates
- Approval Gate relationship

Package Verification code is now implemented as a pure verifier:

```text
src/features/agents/package-verification.ts
src/features/agents/package-verification.test.ts
```

Implemented behavior:

- consumes existing `AgentPackageExportArtifact`
- validates artifact format version, content type, checksum, and byte length
- parses deterministic JSON payload
- validates package/profile and readiness contract shape
- rejects not-ready readiness metadata
- rejects raw secret-like values and credential value fields
- evaluates required evidence references
- produces a structured Verification Report
- returns `VERIFIED_WITH_LIMITATIONS` for the current valid artifact
- keeps `approvalStatus` as `PENDING`
- does not return `VERIFIED` in the first implementation

Target verifier test:

```text
npx vitest run src/features/agents/package-verification.test.ts
PASS — 18 tests
```

Current Package Readiness remains:

```text
CONDITIONALLY_READY
```

Further implementation still requires PM approval before starting.

## Major Gaps

- `GAP-001` / P1: Actual MCP Tool Invocation Evidence is not found.
- `GAP-002` / P2: Deterministic Agent Package JSON artifact export is
  implemented; ZIP/Installer export remains out of scope.
- `GAP-002B` / P2: Package Verification pure verifier is implemented;
  standalone Evidence Bundle artifact, persisted verification report, and
  Approval Gate integration remain out of scope.
- `GAP-003` / P1: Marketplace publish readiness Evidence is not found.
- `GAP-004` / P2: Runtime Compiler is planned but not implemented.
- `GAP-005` / P2: `.buildflow/STATUS.md` Latest Known Commit mismatch.
- `GAP-006` / P3: Architecture status table drift.

## Blockers

No technical blocker for document-only QA scope.

Live action blockers until explicitly approved:

- Provider Credential usage
- Vault access
- external resource mutation
- deployment
- OpenAI quota/cost usage
- MCP Tool Invocation

## Conflict Notes

- `.buildflow/STATUS.md` says `Latest Known Commit: be12055`.
- Actual Git HEAD is `de62266`.
- This is a status bookkeeping mismatch, not a code conflict.
