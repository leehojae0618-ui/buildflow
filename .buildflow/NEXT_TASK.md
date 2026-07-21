# Next Task

## Status

NEXT CANDIDATE / DRAFT / NOT ACTIVE

## Candidate

ARCHITECTURE-AI-RUNTIME-REVIEW-001

## Title

Long-Term AI Runtime Architecture Review

## Candidate Status

DRAFT / NOT APPROVED / NOT SCOPE FROZEN / NOT ACTIVE

This document is a candidate placeholder only. It does not authorize
implementation, Runtime Step work, Architecture Review execution, Provider
actions, MCP Invocation, deployment, Marketplace work, commit, or push.

`RUNTIME-EXECUTION-START-001` is closed by checkpoint commit `6f3ed7d`. The
repository is currently between Sprints.

## Context

The Runtime Preflight / Start contract is complete as a pure deterministic
contract layer. Before moving into Runtime Step / Attempt contracts, PM/CTO may
review the long-term AI Runtime architecture principles discussed outside the
repository:

- LLM Optional
- Runtime First
- Rule Before LLM
- Provider Independence
- Compile Once Execute Many
- LLM Budget Router
- Planner / Compiler separation
- Execution Plan-centered Runtime
- Local model and provider blackout readiness
- AI Policy and Budget Policy

## Candidate Scope Draft

- Create an architecture review draft only after explicit approval.
- Compare long-term AI Runtime principles against current BuildFlow contracts.
- Assess impact on Requirement Engine, Capability Engine, Blueprint Engine,
  Planner, Runtime Compiler, Runtime, Validator, Evidence, Package, MCP, and
  Provider boundaries.
- Identify conflicts or risks without changing implementation.
- Produce a decision recommendation: `KEEP CURRENT` or
  `REVISE BEFORE IMPLEMENTATION`.

## Candidate Exclusions

- Runtime Step implementation
- Runtime Compiler implementation
- Planner implementation
- LLM Budget Router implementation
- AI Policy / Budget Policy implementation
- Provider execution
- MCP Tool Invocation
- Gateway Runtime execution
- DB/API/UI changes
- Deployment
- Marketplace
- Code changes
- Automatic Commit / Push

## Candidate Notes

Do not activate this candidate until PM/CTO approval is explicit. The current
expected recommendation is `KEEP CURRENT`: keep the existing Runtime contracts
and use the long-term AI Runtime principles as future design guidance, not as a
reason to stop or rewrite the current contract path.

## Approval Questions Before Activation

1. Should the Architecture Review be opened before `RUNTIME-STEP-CONTRACT-001`?
2. Should the review remain documentation-only and non-binding until Decision
   Lock?
3. Should the final recommendation be limited to `KEEP CURRENT` or
   `REVISE BEFORE IMPLEMENTATION`?
