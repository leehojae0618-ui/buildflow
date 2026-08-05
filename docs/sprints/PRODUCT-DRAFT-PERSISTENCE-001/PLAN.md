# PRODUCT-DRAFT-PERSISTENCE-001 Plan

## Frozen Flow

```text
BF0 completed design
→ explicit Save as Project click
→ server-side authentication
→ allowlisted and secret-safe draft validation
→ existing Requirement Snapshot derivation
→ existing projects table insert with user ownership
→ Project Detail redirect
```

## Boundaries

- `Bf0DesignDraft` is untrusted browser input. The server accepts only the
  minimal text choices needed for the Project record and derives all snapshot
  data itself.
- This is persistence of a design draft, not execution approval. It cannot
  create a Runtime request, consume an approval, invoke a Provider, or emit
  Runtime Evidence.
- Existing Project Detail changes are user-owned and excluded. Successful
  creation links to the established Project Detail route rather than modifying
  it.

## Validation

- Focused persistence tests.
- BF0 focused tests.
- Full test suite, typecheck, lint, production build, diff check, and a
  secret-shaped string scan of new persistence code.
