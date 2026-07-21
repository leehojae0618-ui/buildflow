# Runtime Result Implementation Plan

## 1. Status and Objective

```text
PLANNING STATUS: ACTIVE / IMPLEMENTATION AUTHORIZED / SCOPE LOCKED
PLANNING BASELINE: 00eb274 / 21889b1 / 2dab5be
IMPLEMENTATION PLANNING CHECKPOINT: 00bfe7a
IMPLEMENTATION APPROVAL: APPROVED
IMPLEMENTATION SCOPE: LOCKED
IMPLEMENTATION APPROVAL CHECKPOINT: 55a5168
RUNTIME IMPLEMENTATION AUTHORITY: GRANTED
RUNTIME IMPLEMENTATION STATUS: AUTHORIZED / NOT STARTED
```

Plan a small, pure `RuntimeExecutionResult` implementation that creates and
validates a deterministic, reference-first execution outcome. This is a plan,
not an implementation specification or an authorization to write code.

## 2. Contract Baseline and Data Flow

```text
RuntimeExecutionRequest
  -> RuntimePreflightResult
  -> RuntimeExecutionStart
  -> Step/Attempt summary references
  -> RuntimeExecutionResult
  -> future Evidence Bundle / Evidence Report references
```

The Result consumes immutable upstream bindings and supplied safe summary or
reference inputs. It does not execute a Step, dereference external resources,
or claim Provider/MCP success.

## 3. Proposed Module Impact Map

| Module | Planned role | Planning-task change |
|---|---|---|
| `src/features/agents/runtime-execution-result.ts` | New pure Result model, builder, validator, and deterministic-core boundary. | None; future candidate. |
| `src/features/agents/runtime-execution-result.test.ts` | Unit and contract tests for the approved matrix and determinism. | None; future candidate. |
| `src/features/agents/index.ts` | Export only the approved Result API after implementation review. | None. |
| `runtime-execution-request.ts` | Upstream Request reference source. | No change planned. |
| `runtime-execution-start.ts` | Upstream Preflight/Start identity and checksum source. | No change planned. |
| `package-export.ts` | Existing stable serialization and SHA-256 precedent to evaluate, not automatically reuse. | No change planned. |
| Package Evidence Bundle/Report modules | Existing package-only precedent; Runtime integration remains future/reference-only. | No change planned. |

No migration is planned for the first pure implementation. Persistence and
retrieval require a separately approved data-boundary task.

## 4. Serializer and Digest Strategy

The approved contract fixes deterministic constraints. This approval locks the
canonical serializer and digest policy in `APPROVAL.md` without changing the
contract's Result fields, reference matrix, or status semantics.

Proposed decision inputs:

- canonical JSON deterministic core with recursively sorted object keys;
- required fields always present, optional fields omitted rather than `null`;
- uppercase-snake-case enums and canonical ISO UTC timestamps;
- semantically ordered Step collections by `sequence`, `runtimeStepId`, then
  immutable reference/checksum;
- unordered Evidence and limitation references by the approved bytewise tuple;
- duplicate references rejected before serialization;
- a named digest algorithm and encoding selected explicitly, with compatibility
  tests and no generated clocks or random values.

`stableSerializeAgentPackage` and its SHA-256 usage are implementation
precedents only. The approved Result implementation may reuse it only after an
independent comparison verifies every locked policy rule; otherwise it must use
a minimal local pure utility within the approved file scope.

## 5. Result Construction, Aggregation, and Error Handling

- Builder input must supply one Request, Preflight, Start, and Execution binding
  plus a caller-supplied `completedAt`.
- The builder may assemble only the approved execution-level Result. It must not
  create Step Result or Attempt Result artifacts.
- Step summaries and optional Attempt summaries remain references; detailed
  partial, dependency, skipped, parallel, and retry rollups are deferred.
- `BLOCKED` and `INVALID` use their required safe references. Malformed input is
  a validator failure, not an `INVALID` artifact.
- `CANCELLED` and `TIMED_OUT` retain separate required references and do not
  imply rollback, external cancellation, or a retry policy.
- Idempotency is limited to deterministic duplicate/conflict detection for an
  equivalent Result input. Execution and Step retry behavior remains owned by
  existing Request/Start/Step contracts and future Runtime behavior.

## 6. Provider, MCP, Evidence, and Persistence Boundaries

- Provider/MCP inputs map only to safe invocation-result references; normalized
  outcome schemas and actual invocation remain deferred.
- Result references Evidence; it neither stores Evidence payloads nor assembles
  a Runtime Evidence Bundle or Report.
- Package Evidence Bundle/Report implementations are not Runtime dependencies
  to call in v1. Any Runtime integration requires a separate approved adapter
  or contract task.
- The first candidate implementation is in-memory and pure. Persistence,
  retrieval, DB schema, migrations, APIs, and UI are excluded.

## 7. Validation and Test Strategy

### Planned unit and contract tests

- valid construction for each of the seven Result statuses;
- exact required/optional/forbidden reference matrix enforcement;
- Request/Preflight/Start/Execution correlation mismatch rejection;
- canonical timestamp, enum, unknown-field, duplicate, and ordering rejection;
- deterministic Result ID and integrity checksum for equivalent input;
- input non-mutation and no implicit clock/random value generation;
- secret-like value and raw Provider/MCP payload rejection;
- malformed input versus valid `INVALID` Result distinction;
- retry/attempt ownership remains reference-only and does not mint new upstream
  identities.

### Planned integration and compatibility tests

- supplied Request and Start artifacts from existing pure builders bind without
  recalculation;
- Step-summary fixtures preserve Step contract status/reference ownership;
- package Evidence artifacts remain uninvoked and reference-only;
- no DB/network/Provider/MCP/Vault access occurs.

Live integration, persistence, and external invocation tests are deferred.

## 8. Implementation Sequence and Checkpoints

1. Begin only the three locked paths after this Authority checkpoint is
   committed.
2. Add the Result type and pure input boundary.
3. Add canonicalization/digest helpers with focused deterministic tests.
4. Add matrix and correlation validation.
5. Add the Result builder and invalid-result union.
6. Add contract and compatibility tests against existing Request/Start fixtures.
7. Run targeted tests, full quality gates, independent QA, approval, and a
   checkpoint commit.

Rollback boundary: each implementation slice must remain a pure module with no
persistence or Runtime invocation side effects. If the serializer/digest or
aggregation decision changes, stop before integration and reopen only the
affected approved decision through change control.

## 9. Risks, Deferred Items, and Approval Criteria

### Risks and unresolved decisions

- Concrete serializer implementation choice is deferred; its behavior and
  SHA-256/lowercase-hex digest policy are locked in `APPROVAL.md`.
- Detailed Step/Attempt aggregation and retry/parallel rollups are deferred.
- Provider/MCP normalized schemas and Runtime Evidence Bundle/Report adapters
  are deferred.
- Result identity compatibility with future persistence needs review before any
  storage task, but no migration is currently required.

### Approval criteria for a later implementation task

- Runtime Implementation Authority is granted only for the three locked paths.
- The locked serializer/digest policy is implemented without altering approved
  Result semantics.
- File list remains restricted to the Result module, tests, and export surface.
- No persistence, Runtime execution, Provider/MCP Invocation, or secret access
  is introduced.
- Definition of Done includes targeted tests, full quality gates, secret scan,
  and independent contract-compatibility review.
