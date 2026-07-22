# Runtime Step Runtime Implementation Authority

## 1. Status

```text
AUTHORITY ID: RUNTIME-STEP-RUNTIME-IMPLEMENTATION-AUTHORITY-001
PLANNING ID: RUNTIME-STEP-IMPLEMENTATION-PLANNING-001
IMPLEMENTATION APPROVAL: HISTORICAL APPROVED / OPERATIVE REVALIDATED
IMPLEMENTATION SCOPE: LOCKED
RUNTIME IMPLEMENTATION AUTHORITY: GRANTED
RUNTIME IMPLEMENTATION STATUS: COMPLETE / INDEPENDENTLY REVIEWED / PASS
IMPLEMENTATION COMPLETION: COMPLETE
INDEPENDENT IMPLEMENTATION REVIEW: PASS
PRODUCTION CHANGES AUTHORIZED: NO — IMPLEMENTATION COMPLETE; FURTHER CHANGES REQUIRE NEW AUTHORITY
CURRENT CONTRACT AMENDMENT CHECKPOINT: 59aa291
AUTHORITY CHECKPOINT: c67adbd
HISTORICAL RUNTIME STEP IMPLEMENTATION CHECKPOINT: 13a2c26
INITIAL/RETRY IMPLEMENTATION CHECKPOINT: 6764c03
TEST COVERAGE ISSUE-RESOLUTION CHECKPOINT: 6de9421
INDEPENDENT IMPLEMENTATION RE-REVIEW: RUNTIME-STEP-INDEPENDENT-IMPLEMENTATION-REREVIEW-001 / PASS
REMAINING FINDINGS: P0 0 / P1 0 / P2 0
NEXT REQUIRED STAGE: Runtime Step Implementation Sprint Closeout
```

The historical authority record remains preserved. The current operative
authority remains GRANTED, but the approved initial/retry validation correction
is complete and independently reviewed PASS. It does not authorize further
production changes, Runtime execution, external I/O, or scope expansion.

The previous `SUSPENDED PENDING EXPLICIT REGRANT` state is historical. The
current Authority Regrant was limited to the approved three-file correction
scope. Implementation Approval remains REVALIDATED; further changes require
new authority.

## 2. Authorized Paths

| Path | Action | Purpose |
|---|---|---|
| `src/features/agents/runtime-execution-step.ts` | CREATE | Pure Runtime Step and Attempt model, builders, validators, and approved deterministic-core boundary. |
| `src/features/agents/runtime-execution-step.test.ts` | CREATE | Isolated unit and contract tests. |
| `src/features/agents/index.ts` | MODIFY | Public export only. |

No other production or test path is authorized.

## 3. Required Constraints

Implementation must preserve the approved Runtime Step contract, Attempt
status-to-field matrix, Builder and Validator responsibilities, immutable
record boundaries, retry semantics, and reference integrity. It must keep all
records reference-first and secret-safe.

## 4. Deferred Policy Boundary

Serializer policy, canonicalization policy, checksum algorithm, and checksum
encoding remain deferred. Implementation must not invent any of them. It must
stop and request an Implementation Approval Amendment before writing code that
serializes a deterministic core or computes an integrity checksum.

## 5. Prohibited Scope

- Execution Target, Provider Layer, Hosted Runtime, Self-hosted Runtime, BYOK;
- Provider execution, MCP execution, Runtime orchestration, scheduling, retry
  execution, persistence, API, UI, Marketplace, Billing, Retention, or
  Deployment; and
- any path outside the three authorized paths.

## 6. Stop Conditions

Stop implementation and request an Implementation Approval Amendment if:

1. an additional file, dependency, or architectural change is required;
2. the approved contract cannot be implemented as written;
3. serializer, canonicalization, checksum algorithm, or encoding policy is
   required before an approved policy is recorded;
4. tests require external I/O or broader integration; or
5. the work would alter another Runtime contract or introduce an excluded
   feature.
