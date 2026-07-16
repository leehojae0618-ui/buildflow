# PRODUCT-REVIEW-002

## Review Scope

- PIVOT-001 through PIVOT-009
- MVP completeness and Beta readiness
- No feature implementation performed
- Review status: CONDITIONAL — critical test-result semantics must be resolved before Beta approval

## End-to-End User Flow

```text
Goal input
→ Requirement Snapshot
→ Clarification / Conversation
→ Constraint / Consent
→ Architecture Snapshot
→ Build Intelligence / Build Receipt
→ Build Plan
→ Installation Wizard
→ Test Suite / Test Summary
```

The domain pipeline is connected in `createRequirementSnapshot()`. The current automated path is a deterministic structural flow; it does not perform authenticated browser interaction or external Provider execution.

## Engine Data Transfer

- Requirement feeds Clarification, Constraint, Consent, and Architecture.
- Architecture feeds Build Intelligence and Build Planner.
- Build Plan feeds Installation Session.
- Architecture, Build Plan, and Installation feed Test Suite.
- All current results are embedded under the existing `goal_constraints.requirement_snapshot` JSONB payload.

## Snapshot Structure

Current versioned areas:

- `requirement-v1`
- `architecture-v1`
- `build-plan-v1`
- `installation-v1`
- `test-suite-v1`

The structure is coherent for new projects. Older projects may omit newer fields; UI fallback currently handles missing Architecture, while complete fallback coverage for every new field remains a follow-up concern.

## UI Connectivity

Project Detail presents Requirement, Conversation, Capability, Build Receipt, Architecture, Build Plan, Installation Wizard, and Test Summary in sequence. The user-facing flow is understandable, but the Test Summary currently reports structural checks separately from external health-check warnings.

## Critical Issue

### CR-001 — Test Summary can show PASS while all external Health Checks are WARNING

`createTestSuite()` calculates the result from Architecture, Build Plan, and Installation test cases, while Health Checks are always represented as `WARNING` because no external connection is executed. Therefore a project can display `Test PASS` while Provider/Database/Authentication/Automation/Notification verification is still pending.

This is a release-blocking semantic issue. The product must distinguish structural PASS from operational readiness, for example by aggregating warnings into the overall result or exposing a separate `NOT_VERIFIED` state. This is the only critical issue registered by this review.

## Beta Include / Exclude

### Include for controlled Beta

- Goal and Requirement capture
- Clarification and Requirement Summary
- Architecture preview
- Build Receipt estimates
- Build Plan preview
- Installation Wizard guidance
- Structural Test Summary, clearly labeled as non-executing verification

### Exclude until later gate

- Automatic external Provider execution
- Credential/API key submission and storage
- Claiming that a system is operationally healthy from structural checks alone
- Marketplace sharing
- Autonomous AI Agent execution
- Production deployment guarantees

## MVP Launch Assessment

**MVP is feature-complete at the foundation level but not release-ready for an unrestricted Beta.** The intended planning-to-installation experience exists. A controlled preview or internal alpha is possible, but Beta approval requires CR-001 resolution, authenticated browser QA, and explicit external-execution boundaries.

## Non-Critical Follow-ups

- Add complete fallback normalization for Build Plan, Installation, and Test Suite fields in old project snapshots.
- Persist Installation Session progress if resume across devices is required.
- Replace static Provider pricing with a versioned pricing source.
- Add browser E2E coverage after an authenticated QA session is available.

## Decision

- New feature Sprint: not started
- Critical fix candidate: `STABILIZE-002` for CR-001
- Beta: conditional, not approved yet
- Roadmap: unchanged
- Commit: no new commit created by this review
- Push: not performed

## Validation

- `git diff --check`: passed
- Code changes: none
- Existing automated baseline before review: 103 tests, lint/typecheck/build passing
