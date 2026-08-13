# PRODUCT-RUNTIME-REAL-AI-SLICE-001 Task

## Scope

1. Reconcile official state with the controlled runtime observed in main
   `609eb083`, without claiming historical authority or live verification.
2. Add an optional product-owned OpenAI output capture hook that does not alter
   `ProviderInvocationResult` or Core Evidence.
3. Add a disabled-by-default Real-AI product composition and BF0 trial panel.
4. Add mock-only regression coverage for input separation, approval invocation,
   kill switch, unsafe input, external-design ineligibility, and no stale output.

## Exclusions

Live Provider invocation, external services, DB, migration, new dependencies,
Commit, Push, Deploy, and production claims are excluded.
