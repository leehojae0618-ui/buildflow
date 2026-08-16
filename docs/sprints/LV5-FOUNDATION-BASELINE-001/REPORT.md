# LV5-FOUNDATION-BASELINE-001 Reality Audit Report

## Status

```text
DRAFT / NOT IMPLEMENTATION APPROVED
AUDIT BASELINE: fe32384c9ed7134b7079879fb235280e41bc2c71
```

## Method

This report is a repository reality audit. `REAL` means an observed current
repository implementation exists; it does not mean deployed, production-ready,
or live-environment verified. LV estimates use the planning model in `PLAN.md`.
No DB, Provider, MCP, external automation platform, Runtime, or test command
was executed for this audit.

## Eleven Capability Baseline

| # | Capability | Current LV estimate | State | Evidence | LV.5 gap |
|---|---|---:|---|---|---|
| 1 | Natural-language idea input | LV.2 | `PARTIAL` | `/bf0` at `src/app/bf0/page.tsx`; `Bf0ProductExperience`; server-safe draft projection in `draft-persistence.ts` | Authenticated browser persistence E2E and a direct handoff to the canonical Requirement/Blueprint lifecycle need proof. |
| 2 | Requirement organization | LV.3 | `PARTIAL` | `createRequirementSnapshot()` in `src/features/requirements/snapshot.ts`; persisted BF0 Project payload | Durable schema exists through `projects.goal_constraints`, but multi-user/RLS browser evidence and canonical versioned projection are not verified. |
| 3 | Clarification | LV.3 | `PARTIAL` | `ClarificationInteraction` and `projectClarificationDerivedRevision()`; Sprint closeout `BUILDFLOW-CLARIFICATION-INTERACTION-001` | Product-flow E2E from newly saved BF0 Project through answered revision and downstream execution eligibility is not evidenced here. |
| 4 | Design | LV.2 | `PARTIAL` | Architecture candidates in `src/features/architecture/candidates.ts`; `AgentBlueprint` / `AgentDefinition` contracts | Architecture selection, Agent design, and external Blueprint are not yet one canonical persisted contract. |
| 5 | Approval condition finalization | LV.2 | `NOT CONNECTED` | Runtime Approval binding/types/actions and `20260728000100_add_runtime_approval_foundation.sql` | No product approval UI/flow supplies approved Runtime input; DB RPC/RLS/atomic concurrency remains `NOT VERIFIED`. |
| 6 | External-platform Blueprint creation | LV.1 | `CONTRACT-ONLY` | Connector registry contains Make/n8n references; Package builder creates a safe handoff archive | No Make/n8n/Zapier adapter, webhook, platform execution, or selected external-builder contract exists. |
| 7 | Execution result collection | LV.1 | `NOT CONNECTED` | Product Runtime safe result projection and `RuntimeEvidenceRecord` types | No user-reachable external execution path or normalized platform-result collector is observed. |
| 8 | Evidence standardization | LV.2 | `PARTIAL` | `runtime-evidence.ts`, repository/Supabase adapter, package evidence references, migration `20260727000100_add_runtime_evidence_persistence.sql` | Runtime evidence persistence and package projections have no completed real DB/product execution proof; external evidence envelope is absent. |
| 9 | Verification | LV.2 | `PARTIAL` | `src/features/verification/*`; Requirement Snapshot `testSuite`; package verification modules | Existing verification is not yet bound to an actual external execution and one canonical user-visible verdict. |
| 10 | Remediation instruction | LV.0 | `STUB` | Safe error codes and blocked-state UI text exist in several modules | No canonical remediation object, human instruction workflow, or safe link to a failed verdict exists. |
| 11 | Reverification | LV.0 | `STUB` | Runtime execution attempt/evidence identifiers provide possible primitives | No remediation-to-new-attempt lineage, replay policy, or product reverification flow exists. |

## Reusable Assets

| Asset | Decision | Reason |
|---|---|---|
| `src/features/product-experience` | `REUSE WITH HARDENING` | BF0 is a real browser entry point and persists a compact safe draft, but live authenticated E2E is unverified. |
| `src/features/requirements` | `REUSE AS-IS` | Snapshot, clarification revision, constraints, consent, connectors, Build Plan, installation, and test-suite projections are established deterministic assets. |
| `src/features/architecture` | `REUSE WITH HARDENING` | Candidate generation and selection are reusable; canonical alignment with Agent Blueprint is missing. |
| `src/features/runtime-approval` | `REUSE WITH HARDENING` | Checksum binding, expiry, decision, and consume boundaries exist; product UI and live DB/RLS/concurrency evidence do not. |
| `src/features/product-runtime` | `REUSE WITH HARDENING` | Server-only ownership, approval consume, Provider adapter, safe result, and Evidence composition exist; the product has no approved plan/request composer or UI entry point. |
| `src/features/agents` | `REUSE WITH HARDENING` | Agent, Runtime, validation, evidence, and package contracts are substantial but spread across distinct contracts needing reference alignment. |
| `src/features/verification` | `REUSE WITH HARDENING` | Verification models and persistence exist, but not a canonical evidence-backed verdict loop. |
| `src/features/autonomous` | `DEFER` | Current Agent Build Journey work is user-owned/uncommitted and must not become a dependency without its own QA and selective Commit. |
| `src/features/mcp` | `DEFER` | Registry/readiness/validator contracts are closed foundation work; no live transport or Tool invocation belongs in the first adapter scope by default. |
| `src/features/package-builder` / `package-installer` | `REUSE WITH HARDENING` | Safe archive export/import is useful for manual handoff, but it is not external execution evidence. |
| `src/services/openai` | `REUSE WITH HARDENING` | Server-only adapter, safe errors, usage references, and smoke evidence exist; it must not become an unapproved fallback for external-builder validation. |
| `supabase/migrations` | `DEFER` | Runtime evidence and approval schema are present locally; remote application and RLS/RPC validation remain unverified. |

## Current Product Flow Reality

```text
Implemented and pushed:
BF0 idea/design UI → explicit Project save → authenticated server action →
existing Project record with server-derived Requirement Snapshot

Not product-connected:
Project → canonical external Blueprint → visible Approval → approved external
execution → result collector → normalized evidence → verdict → remediation →
reverification
```

`executeApprovedProductRuntime()` is a server-only composition root, not a
user-facing execution entry point. It expects an already valid Runtime Request,
Runtime Plan, transient safe input, and approval ID. It consumes approval before
calling `executeMinimumRuntime()` and returns only safe references, but this
audit found no product path that constructs those inputs from a Project.

## Validation Reality

- Repository history records focused/full tests, typecheck, lint, and build
  success for the relevant completed Sprints. This audit did not rerun them.
- `CORE-RUNTIME-002` records a historical OpenAI smoke validation. No current
  Provider action was made by this Sprint.
- `LIVE-DB-VALIDATION-001` documents the absence of completed real DB
  validation. Its Local environment work is blocked; no remote substitute is
  implied.
- Existing connector catalog entries for OpenAI, Make, n8n, and others are
  capability metadata, not live connection evidence.

## Documentation and Code Reconciliation Notes

- `docs/project/ARCHITECTURE.md` describes the target Agent Generator and MCP
  Registry layers as planned. The repository does contain pure Agent generator,
  validator, MCP registry/readiness, and safety-contract modules. This is not
  evidence of a live Agent or MCP execution path; the document should be read
  as product-pipeline status rather than an assertion that the contracts do not
  exist.
- The operational documents in `.buildflow/` and `docs/PROJECT_STATE.md` are
  user-owned dirty changes and predate the pushed `fe32384` persistence Sprint
  state. They were read as context but were not modified by this audit. Git
  baseline and the relevant committed Sprint documents are the source for this
  report's current-state conclusions.

## Critical Gaps

1. No canonical contract currently binds Requirement, selected design,
   acceptance tests, approval, execution, evidence, verdict, remediation, and
   reverification without crossing Core boundaries.
2. Product Runtime is not reachable from the Project UI, and it cannot safely
   be wired by fabricating a Runtime Request, Plan, or approval.
3. Approval/RLS/concurrent consume and Runtime Evidence persistence have not
   been proven in an approved real DB environment.
4. No external-builder adapter, result collector, or platform log projection
   exists for Make, n8n, or Zapier.
5. Failed verification does not produce a canonical remediation instruction or
   linked reverification attempt.

## Risks

### P0

- Treating a connector registry entry, Build Plan, or UI state as a real
  external execution would create a false-success product claim.
- Exposing Product Runtime before real ownership/RLS/atomic consume validation
  could violate the Approval boundary.

### P1

- Multiple overlapping contracts (`ArchitectureSnapshot`, `AgentBlueprint`,
  legacy build execution, Runtime Plan) can drift without a reference bridge.
- Dirty Visual Slice and operational-document changes must remain outside any
  LV5 Commit until their owners complete QA and selective review.

### Unknowns

- Which external builder platform should be selected first.
- Whether a non-production Supabase environment is available for real DB/E2E
  validation.
- The exact existing data model that should own a future Acceptance Contract
  and Verdict projection.
- Current deployment topology and production observability readiness.

## Recommended Next Gate

Review these DRAFT documents as a Scope Freeze. The next requested authority
should be only for `LV5-CANONICAL-CONTRACT-001` planning/implementation after
the owner accepts the reference graph and decides whether the Visual Slice is
closed or remains independent. No external platform selection or execution
authority should be bundled into that decision.

## MVP Impact

Qualitative: this audit prevents false progress by separating the existing
design/persistence and Runtime foundations from the missing user-visible,
evidence-backed external execution loop required for Closed Beta.

## Sources Inspected

- `README.md`, `docs/PROJECT_STATE.md`, `.buildflow/STATUS.md`,
  `.buildflow/CURRENT_TASK.md`, `.buildflow/NEXT_TASK.md`, and
  `docs/SPRINT_HISTORY.md`
- `docs/project/DEVELOPMENT_CHARTER.md`, `PROJECT_BIBLE.md`, `MASTER_PRD.md`,
  and `ARCHITECTURE.md`
- BF0, Product Draft Persistence, Clarification, Core Runtime, Runtime
  Approval, Product Runtime, Runtime Evidence, MCP, Agent Foundation, and
  Live DB Validation Sprint documents
- The feature modules and migrations named in the capability and reusable-asset
  tables above
