# PRODUCT-RUNTIME-REAL-AI-SLICE-001 Contract

## Product Contract

```text
Design input: describes the Agent and never becomes Provider user input.
Runtime input: actual customer inquiry; the only Provider user input.
Eligible: direct input + one AI_RESPONSE + browser result + no external side effect.
Approval: explicit user action starts one invocation-local approval flow.
Output: raw text is product-owned invocation-local state only.
Core Runtime / Evidence / Provider result: reference-only; no raw output.
```

## Kill Switch

`BUILDFLOW_REAL_AI_ENABLED=false` is the default. Provider execution requires
that flag and OpenAI configuration. The disabled path must stop before a
Provider adapter is constructed or invoked.

## Truth Boundary

Actual OpenAI calls, external actions, DB persistence, and Production Ready are
NOT VERIFIED. A future Live Provider Validation Gate requires separate Product
Owner approval.
