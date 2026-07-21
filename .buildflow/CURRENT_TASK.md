# Current Task

## Task ID

ARCHITECTURE-AI-RUNTIME-REVIEW-001

## Title

Long-term AI Runtime Architecture Review

## Status

ACTIVE / RESEARCH / DRAFT / ARCHITECTURE REVIEW ONLY

## Goal

Review BuildFlow's long-term AI Runtime principles against the current
architecture and Runtime contracts, assess impact and conflicts, and record the
approved PM/CTO Decision Lock without authorizing implementation.

## Scope

- Document LLM Optional, Runtime First, Rule Before LLM, Provider Independence,
  Compile Once Execute Many, LLM Budget Router, Planner/Compiler separation,
  Execution Plan-centered Runtime, local-model/provider-blackout readiness, and
  AI/Budget Policy principles.
- Compare those principles with the existing Runtime Execution Request,
  Preflight, Execution Start, Runtime/MCP boundary, Package, Evidence, Approval,
  MCP, and Provider contracts.
- Assess architecture impact by component.
- Distinguish current implementation from long-term candidates.
- Recommend `KEEP CURRENT` or `REVISE BEFORE IMPLEMENTATION`.

## Excluded

- Code or test changes
- Runtime Step implementation
- Runtime Compiler or Runtime Planner implementation
- LLM Budget Router implementation
- Existing Runtime Contract changes
- Provider execution
- MCP Tool Invocation or Gateway Runtime execution
- DB, API, UI, deployment, or Marketplace changes
- Automatic Commit, Push, Merge, or Deploy
- Activation of another Sprint

## Current Stage

- Architecture Gate: ACTIVE
- Review document: DRAFT COMPLETE
- Review gate: PM/CTO DECISION LOCK COMPLETE
- Implementation authorization: NONE
- Decision Lock: APPROVED
- Gate closeout: PENDING
- Current Package Readiness: CONDITIONALLY_READY

## Required Output

`docs/architecture/LONGTERM_AI_RUNTIME.md`

## Preserved Baseline

- Last completed task: `RUNTIME-EXECUTION-START-001`
- Implementation checkpoint: `6f3ed7d`
- Operational closeout checkpoint: `7ab214c`
- Runtime Request, Preflight, and Execution Start contracts remain unchanged.
