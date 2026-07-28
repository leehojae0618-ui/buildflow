# Next Task

## Status

INDEPENDENT IMPLEMENTATION REVIEW REQUIRED

## Reason

`PRODUCT-RUNTIME-INTEGRATION-001` is the one active Sprint. Its server-only
bridge is implemented in the local working tree and requires independent
implementation review before any commit, push, deployment, or product use.
The bridge Report records validation limitations: no local/staging Supabase
RPC, RLS, or concurrent-consume verification has run.

`RUNTIME-APPROVAL-FOUNDATION-001` is the prerequisite foundation. It is also
implemented in the local working tree and requires independent review of its
database/RPC validation limitations. It is not a second active Sprint.

Completed foundation checkpoints remain: `MCP-FOUNDATION-001` (`619b480`),
`AGENT-FOUNDATION-001` (`fd3aff1`), and
`EVIDENCE-RUNTIME-INTEGRATION-001` (`e8b8d60`).

`BUILDFLOW-CLARIFICATION-INTERACTION-001` is CLOSED. Its final browser User
QA passed after P1-001 and P1-002 were resolved; its implementation checkpoint
`f84e1ad` is included in `origin/main`.

The Visual Closed Beta Slice remains pending User QA:

```text
BUILDFLOW-VISUAL-CLOSED-BETA-SLICE-001
FROZEN / USER QA / IMPLEMENTED / WAITING FOR USER FEEDBACK
```

Its implementation passed PM/CTO Code Review with a QA gate. Its code remains
locked unless User QA identifies an approved correction.

The current required gate is:

```text
Independent implementation review
PRODUCT-RUNTIME-INTEGRATION-001 + RUNTIME-APPROVAL-FOUNDATION-001
READ ONLY / NO COMMIT OR PUSH AUTHORITY
```

`BUSINESS-PLAN-001` is a planning proposal requested after this sync task. It
is not active and requires separate user approval before any document changes.

Actual MCP connection, tool invocation, live Provider/Runtime execution,
remote migration, persistence changes, UI work, commit, push, and deployment
remain prohibited until separately approved.

All remaining contents in this file are historical planning records.
# Draft Candidate — CORE-RUNTIME-001 / Phase 1 (Not Active)

Status: `DRAFT — AWAITING USER APPROVAL`
Type: Static repository/OSS/architecture assessment only

Objective: assess the current Core, Agent, Provider, MCP and Evidence foundations; define the minimum Runtime execution path; limit official OSS research; and produce a dependency-boundary architecture draft.

Allowed: repository reading, official online research, Markdown draft creation and static architecture analysis.
Not allowed: source implementation, dependency or environment changes, `package.json` edits, commits, push or deployment.

Deliverables:

- `docs/sprints/CORE-RUNTIME-001/ASSESSMENT.md`
- `docs/sprints/CORE-RUNTIME-001/OSS-SCOPE.md`
- `docs/sprints/CORE-RUNTIME-001/ARCHITECTURE-DRAFT.md`

The assessment identifies `CORE-RUNTIME-002 — Plan and execution contracts` as a possible later implementation-planning candidate. That candidate is not approved, active, or authorized.

This draft is appended for review only. It does not replace current Sprint/QA records elsewhere in this file or activate a Core Runtime Sprint.

## Draft Candidate — CORE-RUNTIME-001 / Phase 2 (Not Active)

Status: `READY FOR DOCUMENTATION — SCOPE-FREEZE CANDIDATE`
Type: documentation-only implementation scope freeze

Purpose: define the single OpenAI Provider / single Runtime Step execution path, interfaces, failures, test matrix, persistence decision and file-change plan before any application-code authority is considered.

Phase 2 deliverables:

- `docs/sprints/CORE-RUNTIME-001/IMPLEMENTATION-SCOPE.md`
- `docs/sprints/CORE-RUNTIME-001/FILE-CHANGE-PLAN.md`
- `docs/sprints/CORE-RUNTIME-001/TEST-PLAN.md`
- revised `docs/sprints/CORE-RUNTIME-001/ARCHITECTURE-DRAFT.md`

The proposed persistence decision is in-memory evidence only behind a new interface; no database migration, dependency installation, environment change, actual OpenAI call, code change, commit, push or deploy is authorized. A later implementation Sprint remains inactive until the user explicitly approves this scope freeze and implementation authority.
