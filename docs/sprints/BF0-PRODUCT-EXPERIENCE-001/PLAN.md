# BF0 Product Experience Plan

## 1. Status and Objective

```text
SPRINT ID: BF0-PRODUCT-EXPERIENCE-001
SCOPE FREEZE PHASE: COMPLETE / HISTORICAL
CURRENT OPERATIVE PHASE: IMPLEMENTED / USER PERSONA AND VISUAL QA PASS
IMPLEMENTATION AUTHORITY: APPROVED — FROZEN UI-ONLY SCOPE
COMMIT AUTHORITY: NONE
PUSH AUTHORITY: NONE
DEPLOY AUTHORITY: NONE
ACTIVATION RECORD: ACTIVATION.md
NEXT GATE: SELECTIVE COMMIT REVIEW
```

This Sprint freezes the first UI-only scope for translating the attached
`BF_1.html` reference (whose internal title and flow identify it as BF_0) into
the existing Next.js and TypeScript application. The HTML is the visual and
interaction reference; the repository's contracts and supported capabilities
remain the technical source of truth.

The user value is a clear, non-developer design journey:

```text
Onboarding
→ Idea input
→ Goal
→ Input location
→ Approval method
→ Result location
→ Workflow draft
→ Cost and access
→ Build plan
→ Completion
```

## 2. Historical Implementation Scope

- BF_0 design-token mapping into the existing styling approach.
- One-decision-per-screen navigation for the frozen user journey.
- Onboarding, idea examples, a lightweight motion background, responsive
  layout, keyboard support, and reduced-motion support.
- UI-only choice state, workflow-draft ViewModel, dynamic build-plan ViewModel,
  and loading, error, empty, and unsupported-state presentation.
- Truthful labels derived from existing supported capabilities or explicit
  fallback states: `설계 초안`, `연결 필요`, `구축 가이드 제공`, `현재 미지원`,
  `백엔드 연결 대기`, and `실행 준비 전`.
- Adapter boundaries that can later consume existing project, requirement,
  approval, Runtime Plan, and capability data without changing their contracts.
- Focused test and browser-verification planning.

## 3. Out of Scope

- Supabase migration, new tables, RLS, server Draft persistence, or server
  refresh recovery.
- Runtime execution, Provider invocation, model calls, MCP invocation, queue,
  retry, streaming, OAuth, Gmail, Slack, Drive, or other external connections.
- Cost calculation, fixed zero-cost claims, fake connection state, fake
  execution success, or a claim that an Agent is built or executable.
- Runtime, Provider, Evidence, Approval, Package Evidence, or existing DB
  contract redesign.
- Commit, Push, Deploy, or live external action.

## 4. Source and Boundary Rules

1. BF_0 is recreated as meaningful Next.js/TypeScript components; it is never
   embedded as an iframe or served as a static HTML page.
2. Existing Product, Runtime, Provider, Evidence, and Approval contracts are
   read-only inputs to future UI adapters.
3. UI must not represent unsupported functionality as connected, free, ready,
   built, or successfully executed.
4. A future UI implementation must preserve all pre-existing working-tree
   changes and must not automatically absorb the existing Visual Slice files.

## 5. Implemented Component Boundaries

The future implementation should investigate, rather than pre-approve, the
following boundaries:

```text
ProductExperienceFlow
ProgressHeader
Onboarding
IdeaInput and MotionBackground
ChoiceStep
WorkflowDraftView
CostAndAccessView
BuildPlanAccordion
CompletionView
product-experience ViewModels and pure tests
```

The UI implementation is intentionally isolated from authenticated project
routes, project actions, Runtime Plan construction, and approval consumption.
Those product boundaries remain reuse sources for a later, separately frozen
Product Runtime Vertical Slice; they are not implied by this UI-only Sprint.

## 6. Accessibility and Responsive Requirements

- Keyboard-accessible progress, choices, actions, and accordion controls.
- Visible focus states, semantic labels, and `aria-expanded` state.
- Minimum 44×44px touch targets.
- No horizontal scroll at 375px, 390px, 768px, 1440px, and 1920px widths.
- `prefers-reduced-motion` disables or minimizes decorative particle and
  transition motion.

## 7. Completed Validation Baseline

- Pure ViewModel tests cover step order, selections, truthful state labels,
  workflow projection, Build Plan variation, and error-state mapping.
- Local validation passed: lint, typecheck, 37 focused ViewModel tests, the
  800-test full suite with one gated skip, production build, and diff check.
- Independent browser Persona and Visual QA passed for Persona A and Persona B,
  requirement add/edit/delete, keyboard interaction, 390/768/1440 viewports,
  console safety, and truthful UI claims.
- Screen-reader software and physical Mobile Safari remain outside this QA
  evidence; DOM-level ARIA behavior and Chromium viewport emulation passed.

## 8. Risks and Stop Conditions

- Existing Visual Slice files overlap a proposed future route or component.
- A proposed UI needs persistence, DB migration, Runtime execution, external
  integration, or a new capability contract.
- BF_0 visual requirements conflict with accessibility or truthful supported
  state requirements.
- Any such condition stops implementation for a Scope amendment.

## 9. Completion Checkpoint and Next Gate

The user-approved `ACTIVATION.md` authorized the frozen UI-only scope. The
implementation and final P2 corrections are complete; any Product Runtime,
database, Provider, or external-execution connection remains a separate Sprint.

The next gate is Selective Commit Review. Commit, Push, Deploy, DB, Runtime,
Provider, and external-action authority remain separate and ungranted.
