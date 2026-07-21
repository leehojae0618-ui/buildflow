# Runtime Result Implementation Authority

## 1. Status

```text
IMPLEMENTATION APPROVAL: APPROVED
IMPLEMENTATION SCOPE: LOCKED
RUNTIME IMPLEMENTATION AUTHORITY: GRANTED
RUNTIME IMPLEMENTATION STATUS: AUTHORIZED / NOT STARTED
AUTHORITY CHECKPOINT: PENDING COMMIT
```

This authority is documentation-only. It records permission for the next task;
it does not itself create code or tests.

## 2. Authorized Paths

| Path | Action | Purpose |
|---|---|---|
| `src/features/agents/runtime-execution-result.ts` | CREATE | Pure Result model, canonical serializer, SHA-256 digest, builder, and validator. |
| `src/features/agents/runtime-execution-result.test.ts` | CREATE | Isolated unit and contract tests. |
| `src/features/agents/index.ts` | MODIFY | Public export only. |

No other path is authorized.

## 3. Authorized Behavior

- Pure deterministic `RuntimeExecutionResult` construction.
- Approved reference validation and pure validation helpers.
- Canonical serialization and SHA-256 integrity digest generation.
- Isolated unit and contract tests.
- Public export through the approved index file.

## 4. Locked Policies

- Serializer: lexicographic object-key ordering, exact array-order preservation,
  UTF-8 JSON strings, finite JSON numbers only, and rejection of unsupported or
  cyclic values.
- Inputs: no injected clock, random, environment, locale, process, or external
  data; equivalent approved input yields identical canonical bytes.
- Digest: SHA-256 of UTF-8 canonical output as lowercase hexadecimal; no salt,
  secret, or environment-dependent input; integrity evidence only.

## 5. Prohibited Scope

- Persistence, database access, API routes, UI, deployment, or Marketplace.
- Provider execution, MCP Invocation, Runtime orchestration, Step execution,
  retry execution, or aggregation beyond approved references.
- Provider/MCP normalized schemas and Runtime Evidence Bundle/Report integration.
- Any change outside the three authorized paths.

## 6. Stop Conditions

Stop implementation and request an Implementation Approval Amendment if:

1. An additional file must change.
2. The approved contract cannot be implemented as written.
3. Existing utilities conflict with the locked serializer policy.
4. A dependency or architectural change is required.
5. Tests require external I/O or broader integration.
6. The implementation would alter another Runtime contract.
