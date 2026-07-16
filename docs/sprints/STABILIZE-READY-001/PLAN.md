# STABILIZE-READY-001 Plan

## Objective

Remove every path that can report a completed service without durable server evidence, then restore database parity required by Autonomous Build and Deployment sessions.

## Sequence

1. Correct Verification final-state rules and persisted expiry restoration.
2. Separate Package restoration from Production READY.
3. Restrict public Autonomous actions to user decisions; Provider and Verification completion remain server-only.
4. Add missing execution-event ownership policy.
5. Apply pending migrations and regenerate linked database types.
6. Add encrypted Provider Credential References and server-only resolution.
7. Implement the representative GitHub → Supabase → Vercel build and verification path.
8. Protect all completion evidence from direct authenticated-client writes.
9. Run regression, RLS, Secret, and static validation.

## Change Control

Existing review documents and HARDEN-003 UI work remain preserved. No commit or push is authorized.
