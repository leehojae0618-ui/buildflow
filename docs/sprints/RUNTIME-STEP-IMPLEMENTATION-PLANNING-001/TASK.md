# RUNTIME-STEP-IMPLEMENTATION-PLANNING-001

## 1. Status

```text
PLANNING STATUS: ACTIVE / IMPLEMENTATION APPROVAL REVALIDATION REQUIRED / AUTHORITY SUSPENDED
CURRENT SPRINT WORK: CONTRACT REVALIDATION COMPLETE / IMPLEMENTATION APPROVAL REVALIDATION PENDING
PROJECT LIFECYCLE: ACTIVE
CONTRACT BASELINE: RUNTIME-STEP-CONTRACT-001
CONTRACT CHECKPOINT: 730bde8
CURRENT CONTRACT AMENDMENT: INITIAL-RETRY DISCRIMINATOR (`59aa291`)
PREVIOUS FIELD-MATRIX AMENDMENT: INDEPENDENT RE-REVIEW PASS (`ca54d12`)
PREVIOUS SPRINT CLOSEOUT: 3873534
IMPLEMENTATION APPROVAL: SUSPENDED PENDING REVALIDATION
IMPLEMENTATION SCOPE: LOCKED
IMPLEMENTATION APPROVAL CHECKPOINT: e743068
RUNTIME IMPLEMENTATION AUTHORITY: SUSPENDED PENDING REVALIDATION
RUNTIME IMPLEMENTATION STATUS: IMPLEMENTED / REVIEW FAILED / CHANGES PROHIBITED
RUNTIME STEP IMPLEMENTATION CHECKPOINT: 13a2c26
```

## 2. Objective

Define the exact, reviewable implementation plan for the already approved
Runtime Step contract. This task creates no production code or tests and does
not reopen `RUNTIME-STEP-CONTRACT-001`.

## 3. Approved Baseline

- Runtime Step Contract: `docs/sprints/RUNTIME-STEP-CONTRACT-001/CONTRACT.md`
- Runtime Step State Machine: `docs/sprints/RUNTIME-STEP-CONTRACT-001/STATE_MACHINE.md`
- Runtime Step Validation: `docs/sprints/RUNTIME-STEP-CONTRACT-001/VALIDATION.md`
- Runtime Step Contract checkpoint: `730bde8`
- RuntimeExecutionResult completion checkpoint: `871824e`
- Previous Sprint closeout checkpoint: `3873534`

The approved Step contract is immutable for this planning task. Existing
Request, Preflight, Execution Start, and Result contracts are consumed through
their current identities and references only.

Limited reopening resolved the Attempt field matrix with independent re-review
PASS. The planning Sprint remains active. Independent implementation review
found a blocking predecessor-validation P1. Contract revalidation is now
complete with Planning Compatibility PASS and no rewrite required. Implementation
Approval and Runtime Implementation Authority remain suspended pending
Implementation Approval Revalidation. The implemented three-file slice at
`13a2c26` must not change until authority is regranted.

## 4. Planning Scope

- Exact pure Runtime Step and Runtime Step Attempt module boundary.
- Exact code and test candidate paths.
- Identity, reference binding, status-transition, builder, validator,
  serialization, digest, immutability, and test planning.
- Explicit deferred work, prohibited work, and implementation-amendment stop
  conditions.

## 5. Out of Scope

- Production code and test changes.
- Provider execution, MCP invocation, Runtime orchestration, scheduling,
  actual retry execution, persistence, API, UI, network or filesystem I/O.
- Evidence Bundle/Report integration, aggregation/report generation, and
  deployment.
- Any change to the approved Runtime Step contract or another Runtime contract.

## 6. Deliverables

- `TASK.md` — planning status, baseline, and boundary.
- `PLAN.md` — exact candidate file table, implementation sequence, validation
  strategy, deferred decisions, and stop conditions.
- `APPROVAL.md` — Historical Approval Record for the exact file scope and its
  Authority handoff; its operative effect is suspended pending revalidation.
- `AUTHORITY.md` — Historical Authority Record for the locked scope with
  deferred-policy stop conditions; its operative effect is suspended pending
  revalidation.
- Operational and memory state updates activating this planning Sprint only.

## 7. Historical Planning Exit Criteria (Superseded)

The following records preserve the pre-amendment planning exit only. They are
not the current operative approval or authority state; the Status section
above remains authoritative.

- The plan retains a pure, deterministic, reference-first slice.
- Every candidate implementation path is exact; wildcard scope is absent.
- No new dependency is required.
- Contract-required decisions that remain unresolved are marked for separate
  Implementation Approval rather than invented.
- Historical Implementation Approval was APPROVED and the exact file scope was
  LOCKED.
- Historical Runtime Implementation Authority was GRANTED; implementation was
  complete and awaited independent implementation review.
