# LV5-FOUNDATION-BASELINE-001 Contract Baseline

## Status

```text
DRAFT / NOT IMPLEMENTATION APPROVED
```

## Contract Reuse Decision

| LV.5 concern | Existing source | Audit decision | Gap before use as a canonical LV.5 contract |
|---|---|---|---|
| Requirement Contract | `src/features/requirements/types.ts` `RequirementSnapshot`; `snapshot.ts` | `REUSE WITH HARDENING` | Persisted version/ownership validation and a narrow public projection must be explicit. |
| Acceptance Contract | `RequirementSnapshot.testSuite`; `src/features/testing/*` | `REUSE WITH HARDENING` | Acceptance criteria lack one canonical verdict linkage to a specific execution/evidence set. |
| Canonical Blueprint | `ArchitectureSnapshot`, `ArchitectureCandidates`, `AgentBlueprint`, `AgentDefinition` | `REFACTOR REQUIRED` | Architecture and Agent contracts coexist; a reference bridge is needed, not a duplicate Blueprint engine. |
| Approval Policy | `src/features/runtime-approval/types.ts`; Requirement consent contracts | `REUSE WITH HARDENING` | Runtime binding is strong, but product-visible approval policy and acceptance scope are not yet composed. |
| Test Case | `src/features/testing/*`, `src/features/verification/types.ts` | `REUSE WITH HARDENING` | No single versioned test-case-to-verdict reference is observed. |
| Execution Reference | `RuntimeExecutionRequest`, `RuntimePlan`, legacy `build_executions` | `REFACTOR REQUIRED` | Runtime and legacy build execution identifiers are not yet a shared external-builder reference. |
| Evidence Record | `RuntimeEvidenceRecord`, Package Runtime Evidence reference | `REUSE WITH HARDENING` | External platform result references need a safe normalized envelope; raw logs remain prohibited. |
| Verdict | Runtime result, verification models, package verification | `REFACTOR REQUIRED` | There is no observed canonical cross-domain verdict that binds acceptance cases to normalized evidence. |
| Remediation | No canonical remediation contract observed | `NEW CONTRACT REQUIRED` | Must be reference-only, safe, human-actionable, and never execute automatically. |
| Reverification Link | No canonical remediation-to-new-attempt link observed | `NEW CONTRACT REQUIRED` | Must preserve prior verdict, replacement execution reference, and terminal state. |

## Canonical LV.5 Reference Graph

The following is a proposed relationship model only. It creates no types or
database schema in this Sprint.

```text
RequirementSnapshot
  → CanonicalBlueprintReference
  → AcceptanceContractReference
  → ApprovalPolicyReference
  → ExecutionReference
  → EvidenceRecordReference[*]
  → VerdictReference
  → RemediationReference?
  → ReverificationReference?
```

## Required Invariants for a Future Contract Sprint

1. Every durable object has an immutable identifier, version, owner/project
   reference, creation time, and integrity checksum where its contents are
   security- or execution-relevant.
2. Approval binds project, user, plan/request, provider/model, and safe input
   checksums. A consumed approval cannot be used as a retry token.
3. Execution references identify an attempt, but never embed raw provider,
   tool, secret, prompt, output, or platform credential payloads.
4. Evidence records are append-only, bounded, checksum-validated, and sorted
   deterministically. A reference-only Package projection must remain so.
5. A verdict may be `PASSED`, `FAILED`, `BLOCKED`, or `INSUFFICIENT_EVIDENCE`;
   it must not imply success from a plan, a mock, or an absent result.
6. Remediation is a proposed human instruction. It cannot initiate a provider,
   connector, workflow, retry, or external write.
7. Reverification creates a new execution/evidence lineage and does not mutate
   a prior failed verdict into success.

## LV.5 Capability Conditions

| Capability family | Required evidence before LV.5 claim |
|---|---|
| User input, Requirement, Clarification, Blueprint | accessible browser interaction, authenticated persistence, revision/invalid-input behavior, and browser E2E |
| Approval and execution | project ownership, expiry/reject/revoke/single-use behavior, atomic consume proof, and a user-visible safe result |
| External adapter and result collector | explicit adapter identity, approved action boundary, idempotency/execution reference, safe failure mapping, and no hidden fallback |
| Evidence and verdict | checksum/redaction policy, evidence-to-acceptance linkage, insufficient-evidence state, independent review, and browser presentation |
| Remediation and reverification | human approval before a new action, immutable lineage, repeat-run semantics, and observable terminal outcome |

## Security Boundary

- Existing Provider and Core Runtime contracts remain unchanged unless a later
  approved compatibility review says otherwise.
- `RuntimeEvidenceRecord` and Package Evidence projections remain secret-free.
- Make, n8n, Zapier, or a manual handoff package must be represented as an
  adapter capability, not as an implicit direct execution path.
- A connector catalog entry or a UI label is not authorization, execution, or
  verification evidence.

