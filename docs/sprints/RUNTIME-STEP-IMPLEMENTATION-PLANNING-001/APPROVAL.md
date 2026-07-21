# Runtime Step Implementation Approval

## 1. Status

```text
APPROVAL ID: RUNTIME-STEP-IMPLEMENTATION-APPROVAL-001
PLANNING ID: RUNTIME-STEP-IMPLEMENTATION-PLANNING-001
IMPLEMENTATION APPROVAL: APPROVED
IMPLEMENTATION SCOPE: LOCKED
RUNTIME IMPLEMENTATION AUTHORITY: HISTORICALLY GRANTED BY `AUTHORITY.md`
CURRENT OPERATIVE IMPLEMENTATION APPROVAL: SUSPENDED PENDING REVALIDATION
CURRENT CONTRACT AMENDMENT CHECKPOINT: 59aa291
APPROVAL CHECKPOINT: e743068
```

This approval locked scope before the separate `AUTHORITY.md` record granted
Runtime Implementation Authority. It does not authorize Runtime execution or
scope expansion.

The historical approval remains recorded. Its operative effect is suspended
until Implementation Approval Revalidation completes after the limited
initial/retry discriminator contract amendment.

## 2. Approved Implementation Scope

| Path | Action | Purpose |
|---|---|---|
| `src/features/agents/runtime-execution-step.ts` | CREATE | Pure Runtime Step and Attempt model, builders, validators, and approved deterministic-core boundary. |
| `src/features/agents/runtime-execution-step.test.ts` | CREATE | Isolated unit and contract tests for the approved Step and Attempt behavior. |
| `src/features/agents/index.ts` | MODIFY | Public export for the approved Runtime Step API only. |

No other path is approved. Any additional path, dependency, or contract change
requires an Implementation Approval Amendment before code changes begin.

## 3. Approved Behavior Boundary

The future implementation may only construct and validate pure,
reference-first Runtime Step and Runtime Step Attempt records. It must preserve
the approved identity bindings, state-transition rules, Attempt field matrix,
retry identity semantics, terminal reference rules, immutable record boundary,
and secret-safe validation boundary.

It must not execute a Step, call a Provider, invoke MCP, persist data, perform
or schedule retries, or prove external side effects.

## 4. Deferred Decisions

The following remain deferred and must not be selected or invented by an
implementation task without separate approval:

- canonical serializer policy;
- canonicalization policy;
- checksum algorithm; and
- checksum encoding.

The separate Authority record preserves these deferred decisions as stop
conditions before code serializes a deterministic core or computes an integrity
checksum.

## 5. Excluded Scope

- Execution Target, Provider Layer, Hosted Runtime, Self-hosted Runtime, and
  BYOK;
- Provider execution and MCP execution;
- persistence, API, UI, Marketplace, Billing, Retention, and Deployment; and
- Runtime orchestration, scheduling, retry execution, aggregation, or
  Evidence Bundle/Report integration.

## 6. Authority Boundary

Implementation Approval and Scope Lock did not themselves grant Runtime
Implementation Authority; the separate `AUTHORITY.md` record grants it for the
locked three paths. Serializer and checksum policies remain deferred stop
conditions.
