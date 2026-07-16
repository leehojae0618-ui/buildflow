# STABILIZE-003 Checklist

- [x] Existing JSONB storage used; no Migration
- [x] No OAuth, API, Secret, or Executor behavior added
- [x] Selection action verifies authenticated project ownership
- [x] Candidate is regenerated and architecture snapshot is compared before save
- [x] Over-budget candidate requires explicit confirmation
- [x] Excluded Tool candidate is rejected
- [x] Connector, Credential, Build Plan, Installation, and Test are recalculated from selected architecture
- [x] Tests, lint, typecheck, build, and diff check pass
- [x] No commit or push
