# BF0 UX Simplification Task

## Status

```text
TASK ID: BF0-UX-SIMPLIFICATION-001
STATUS: SCOPE FROZEN / IMPLEMENTATION NOT APPROVED
IMPLEMENTATION AUTHORITY: NONE
COMMIT AUTHORITY: NONE
PUSH AUTHORITY: NONE
DEPLOY AUTHORITY: NONE
DB / RUNTIME / PROVIDER / MCP / EXTERNAL AUTHORITY: NONE
```

This task defines a follow-up UX simplification Sprint. It does not authorize
source-code changes.

## Historical Boundary

`BF0-PRODUCT-EXPERIENCE-001` remains historical and closed:

```text
BF0-PRODUCT-EXPERIENCE-001:
HISTORICAL / CLOSED
CLOSED / COMPLETE
USER SPRINT EXIT APPROVED

BF0-UX-SIMPLIFICATION-001:
NEW FOLLOW-UP / SCOPE FREEZE
IMPLEMENTATION NOT APPROVED
```

Do not edit historical BF0 Sprint documents as part of this follow-up scope.

## Objective

Reduce the complexity of the `/bf0` non-developer journey by making natural
language input the main action, projecting safe defaults first, asking only
necessary clarification questions, and moving technical details behind
progressive disclosure.

The implementation target is UX simplification only. It must not introduce a
new Provider, LLM call, AI inference, Runtime path, Evidence path, DB change,
external integration, or deployment behavior.

## Repository Files Observed

The actual BF0 route and product-experience files currently present are:

```text
src/app/bf0/page.tsx

src/features/product-experience/actions.ts
src/features/product-experience/bf0-view-model.ts
src/features/product-experience/bf0-view-model.test.ts
src/features/product-experience/draft-persistence.ts
src/features/product-experience/draft-persistence.test.ts

src/features/product-experience/components/bf0-product-experience.tsx
src/features/product-experience/components/bf0-navigator-preview.tsx
src/features/product-experience/components/bf0-build-plan-screen.tsx
src/features/product-experience/components/bf0-step-mode.tsx
src/features/product-experience/components/bf0-requirement-editor.tsx
src/features/product-experience/components/bf0-shared.tsx
```

These files are implementation candidates for a later approved Sprint only.
They are not modified by this documentation task.

## Investigation Candidates

Future implementation should investigate these files and responsibilities:

- `src/features/product-experience/components/bf0-product-experience.tsx`
  - Current route state, mandatory screen order, CTA structure, and navigation
    gating.
- `src/features/product-experience/components/bf0-navigator-preview.tsx`
  - Current request preview, requirement visibility, and optional edit model.
- `src/features/product-experience/components/bf0-requirement-editor.tsx`
  - Requirement detail editing that should become optional, not a default
    forced gate.
- `src/features/product-experience/components/bf0-build-plan-screen.tsx`
  - Build Plan first-view summary, progressive disclosure, and optional Step
    Mode entry.
- `src/features/product-experience/components/bf0-step-mode.tsx`
  - Step Mode as opt-in follow-through rather than a forced journey.
- `src/features/product-experience/components/bf0-shared.tsx`
  - Shared header, brand, footer, CTA, and progress affordances.
- `src/features/product-experience/bf0-view-model.ts`
  - Deterministic request organization, safe recommendation/default logic,
    clarification trigger rules, Build Summary, Build Plan, Completion copy,
    unknown/unsupported state preservation.
- `src/features/product-experience/bf0-view-model.test.ts`
  - Existing pure coverage for ViewModel behavior; expected to expand for
    decision-count reduction and truthful simplification.
- `src/features/product-experience/draft-persistence.ts`
  - Must remain within existing persistence boundary; no new DB or schema work.
- `src/features/product-experience/draft-persistence.test.ts`
  - Existing persistence tests should not be weakened.
- `src/app/bf0/page.tsx`
  - Route entry should remain `/bf0`; route metadata can be reviewed only if
    needed and approved in implementation scope.

## Proposed Minimal Implementation Units

These units are candidates for a later approved implementation Sprint:

### Unit 1: Journey / Routing Simplification

- Reduce the default mandatory route sequence.
- Make `Idea Input` the primary start.
- Move requirement review and detailed edit behind optional controls.
- Preserve Back/Edit recovery.

### Unit 2: Clarification-Only Decision Model

- Replace always-required Goal / Input / Approval / Output screens with
  recommended defaults when deterministic projection is safe.
- Ask one clarification question at a time only when required.
- Preserve unsupported and unknown states.

### Unit 3: Summary + Progressive Disclosure

- Create a short Build Summary surface for non-developers.
- Hide Provider / Runtime / Evidence and other technical details from the
  default screen.
- Keep details available through `자세히 보기`.

### Unit 4: Build Plan / Step Mode Simplification

- Keep Build Plan as a core final-user surface.
- Show step count, purpose, and next user action first.
- Collapse detailed URLs, explanations, permission notes, and technical content
  by default.
- Make Step Mode opt-in via `단계별로 따라하기`.

### Unit 5: Completion Simplification

- Separate prepared design, not-yet-executed work, and next user action.
- Avoid Agent execution, Provider execution, deployment, persisted Evidence, or
  Production completion claims.

### Unit 6: Tests + Responsive / Persona QA

- Update focused ViewModel tests for decision-count reduction, clarification
  triggers, default recommendations, hidden details, unsupported states, and
  truthful completion.
- Verify `/bf0` with Product Owner-oriented Persona QA.
- Verify 375 / 390 / 768 / 1440 viewports for no horizontal overflow.
- Verify keyboard interaction and reduced-motion behavior.

## Required Future Validation

Future implementation must at minimum run:

```text
focused product-experience tests
typecheck
lint
build
browser QA for /bf0
375 / 390 / 768 / 1440 responsive QA
keyboard interaction check
reduced-motion check
truthfulness copy scan
```

No validation in this list authorizes DB, Runtime, Provider, MCP, external API,
Notion, deploy, commit, or push.

## Explicit Exclusions

- Source implementation in this gate
- BF0 historical document modification
- Visual Slice modification
- Project Detail redesign
- New LLM Provider
- LLM API call
- New AI inference
- DB schema, migration, RLS
- Runtime / Provider / Evidence / Approval contract redesign
- OAuth, MCP, n8n, Make, external service invocation
- Dependency addition
- Commit, Push, Deploy

## Stop Conditions

Stop for scope amendment if future implementation requires:

- Runtime, Provider, DB, Evidence, or Approval contract changes
- New AI inference or LLM/API calls
- Visual Slice changes
- Project Detail redesign
- New dependency
- External service execution
- Hiding unsupported, unknown, unverified, or not-executed states
- Increasing required user decision count

## Current Gate Output

This documentation gate creates only:

```text
docs/sprints/BF0-UX-SIMPLIFICATION-001/PLAN.md
docs/sprints/BF0-UX-SIMPLIFICATION-001/TASK.md
docs/sprints/BF0-UX-SIMPLIFICATION-001/CONTRACT.md
```

Implementation is not performed.
