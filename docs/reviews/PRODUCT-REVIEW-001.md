# PRODUCT-REVIEW-001

## Review Scope

- Sprint range: PIVOT-001 through PIVOT-005
- Working directory: `/Users/hojelee/Documents/Codex/buildflow`
- Review type: Product and Architecture Review
- Current state: PIVOT-005 Code Complete / Commit Pending
- Review decision: CONDITIONAL APPROVAL; stabilization required before Commit Approval

## Actual Domain Pipeline

```text
Project goal
  → createRequirementSnapshot()
  → Goal Parser / Requirement
  → Clarification Queue / Conversation
  → Constraint Assessment / Capability
  → Consent Requirements
  → Component Selection / Architecture Snapshot
  → Build Intelligence
```

The pipeline is connected through `createRequirementSnapshot()` and is persisted as `requirement_snapshot` inside the existing `projects.goal_constraints` JSONB value during project create/update.

## Input, Output, and Snapshot Responsibilities

| Stage | Input | Output | Responsibility |
|---|---|---|---|
| Requirement | Goal and project constraints | `requirement-v1` | Interpret the goal and normalize fields |
| Clarification | Requirement | questions, conversation state | Find missing information and next question |
| Constraint | Requirement | assessments, capabilities | Classify buildability and user responsibility |
| Consent | Requirement | consent requirements | Represent external permission needs |
| Architecture | Requirement | `architecture-v1` | Select components, connections, dependencies |
| Build Intelligence | Requirement, capability summary, consent, readiness | Build score and estimates | Estimate current buildability |

The responsibility boundaries are understandable, but Build Intelligence currently receives Requirement and Capability inputs directly rather than Architecture Snapshot. This is an architectural mismatch with the approved pipeline and must be addressed before treating its estimates as architecture-based.

## Well-Connected Areas

- Goal parsing, clarification, constraint, consent, and architecture are composed in one Requirement Snapshot factory.
- Conversation state and next-question data are available to the UI.
- Architecture has explicit components, connections, dependencies, and a version.
- Existing Recommendation code and database schema remain compatible.
- The JSONB envelope allows older projects to remain readable while the new snapshot is optional.

## Duplication and Conflict Findings

1. `clarificationSummary.buildReadiness` is a Requirement readiness measure, while `buildIntelligence.confidence` is a calculation confidence measure. The distinction is present in code but not strongly named in the UI/documentation; this can confuse users.
2. Capability percentages and Build Intelligence `automation` reuse the same capability summary, which is correct, but the UI presents them in separate sections without a single source-of-truth label.
3. Build Intelligence has a separate account-cost vocabulary from the Architecture Registry. This will produce drift when providers or components change.
4. Project Detail has Requirement Summary, Build Receipt, Architecture Summary, project metadata, and Recommendation sections. The order is broadly logical, but the user-facing system result and technical component list are not yet presented as one cohesive receipt.

## Provider Bias Result

**FAIL — n8n is currently unconditional.** `selectArchitecture()` starts with `frontend`, `openai`, `supabase`, and `n8n` for every Requirement. The registry also marks n8n as required. Slack and Google OAuth are conditional, but OpenAI, Supabase, and n8n are not.

This creates provider coupling and contradicts the intended Component Registry abstraction. OpenAI and Supabase may be MVP defaults, but n8n must be a candidate selected only when the Requirement needs external workflow automation or a compatible automation level.

## Snapshot Evaluation

**PASS with a compatibility concern.** `requirement_snapshot` contains Requirement, Clarification/Conversation, Constraint/Capability, Consent, Architecture, and Build Intelligence. The existing `goal_constraints` JSONB storage avoids a migration and preserves old project rows.

The concern is that the JSONB payload has no explicit top-level snapshot envelope/version beyond the nested `requirement-v1` and `architecture-v1`. A future compatibility helper should safely detect missing `architecture`, `conversation`, or `buildIntelligence` for older projects instead of assuming the newest shape.

## UI Evaluation

**CONDITIONAL PASS.** The UI exposes understandable metrics and an Architecture Snapshot, but it currently mixes user-facing Build Receipt content with technical component names. The next refinement should explain components by role (AI, data, automation, notification) and keep provider names secondary. No UI rewrite is required in this review.

## Build Intelligence / Architecture Connection

**FAIL for architectural input reuse.** `calculateBuildIntelligence()` consumes `Requirement`, `CapabilitySummary`, `ConsentRequirement[]`, and readiness. It does not receive or inspect `ArchitectureSnapshot`. Its cost table and account labels are independent from the Component Registry.

This is a known gap, not a reason to reimplement during this review. It should become the primary acceptance criterion for the next stabilization task.

## Test Gaps

No tests were added per review instruction. Existing tests do not yet cover:

- Architecture selection with and without automation requirements
- Explicit assertion that n8n is not selected for a non-automation goal
- Provider-neutral alternatives in the registry
- Snapshot fallback for legacy projects missing newer fields
- Build Intelligence consuming Architecture Snapshot
- UI rendering with an old or incomplete Snapshot
- `EXPERT` and `UNSUPPORTED` propagation through the full Snapshot

## Required Fixes

1. Create `STABILIZE-001` to make n8n conditional and define provider-neutral selection rules.
2. Make Build Intelligence accept Architecture Snapshot input and use the selected components as its source for cost, time, and account estimates.
3. Add a compatibility parser/defaults layer for old JSONB snapshots.
4. Add focused tests for the provider selection and Architecture→Build Intelligence contract.

## Nice-to-Have Fixes

- Add component roles to the Architecture UI and reduce provider-first language.
- Clarify the difference between Build Readiness and Build Confidence in the UI.
- Consolidate capability and Build Receipt presentation behind one typed view model.

## MVP/Post-MVP Items

- Provider pricing catalog with freshness policy: post-MVP or a separately approved data task.
- Multi-provider substitution and user-selected architecture variants: post-MVP.
- Architecture graph visualization: post-MVP; current connection summary is sufficient for foundation review.
- Marketplace component packages: post-MVP.

## Next Five Sprint Proposal

1. `STABILIZE-001` — Architecture/Build Intelligence contract and provider neutrality
2. `PIVOT-006` — Build Intelligence Engine Foundation, architecture-input based
3. `PIVOT-007` — Build Planner Foundation
4. `PIVOT-008` — Installation Wizard Foundation
5. `PIVOT-009` — Test Engine Foundation

These targets are frozen after PM approval. Further ideas go to backlog or the next Product Review.

## PIVOT-005 Commit Decision

**Not approved yet.** Choose option B: a short stabilization Sprint is required because the unconditional n8n selection and Architecture-independent Build Intelligence are structural issues, not cosmetic issues. No PIVOT-005 Commit should be created until STABILIZE-001 passes review.

## Validation

- `git diff --check`: passed
- No code, test, migration, or database changes made by this review
- Commit: none
- Push: none
