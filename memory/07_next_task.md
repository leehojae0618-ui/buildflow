# Next Task

## Status

CURRENT TASK COMPLETED

Completed output:

```text
docs/sprints/LIVE-EVIDENCE-AGENT-001/PACKAGE-VERIFICATION.md
```

Current Package Readiness judgement:

```text
CONDITIONALLY_READY
```

Identified P1 gaps:

- GAP-001: MCP Tool Invocation Evidence is not found.
- GAP-003: Marketplace publish readiness Evidence is not found.

Resolved / reduced gap:

- GAP-002: Deterministic JSON Agent Package artifact export Evidence is now
  implemented. ZIP/Installer export remains out of scope and should be treated
  as a separate future transport/package task if PM prioritizes it.

## Completed Design Task

```text
PACKAGE-VERIFICATION-001
```

Status:

```text
DRAFT
NOT APPROVED
DESIGN ONLY
```

Completed:

- Verification Pipeline design
- Verification Report Contract design
- Artifact Integrity Check design
- Package/Profile Contract Validation boundary
- Evidence Bundle boundary
- Verification Status model
- Failure Classification
- Approval Gate relationship
- Quality Score input candidates

Code implementation:

```text
NOT STARTED
```

## Next Single Task Candidate

Do not start another follow-up without PM confirmation.

Recommended:

```text
PACKAGE-VERIFICATION-001
Implement pure Package Verification contracts and verifier function.
```

Suggested minimal file scope:

```text
src/features/agents/package-verification.ts
src/features/agents/package-verification.test.ts
src/features/agents/index.ts
```

This must remain a pure verification implementation. It must not invoke an MCP
Tool, read Vault, use live Credentials, perform Provider execution, write DB
records, publish Marketplace listings, or deploy.

---

## 1. Task Summary

Completed: finalized the QA-only scope for `LIVE-EVIDENCE-AGENT-001` and documented the
Evidence Checklist and Package Readiness judgement criteria.

This task is documentation and QA planning only. It must not perform live
Provider execution, deployment, MCP Tool Invocation, Runtime implementation, or
Marketplace implementation.

## 2. User Intent

The user wants BuildFlow to proceed safely toward real Agent Evidence without
accidentally crossing Credential, cost, deployment, or external-resource
boundaries.

The preferred direction is:

```text
QA-only first
→ identify missing live evidence
→ request separate approval for only the necessary live actions
```

## 3. Current Context

Completed foundation:

- Agent Capability / Block / Blueprint / Definition contracts
- MCP Registry and Tool contracts
- Agent Tool Resolution Planner
- Agent Validation Gate
- Agent Package/Profile contract

Current candidate:

```text
LIVE-EVIDENCE-AGENT-001
Status: DRAFT / NOT APPROVED / NOT SCOPE FROZEN
Roadmap alignment: AGENT-EVIDENCE-001
```

Current repository state at memory creation:

```text
main clean, synced with origin/main
HEAD: de62266 docs: draft live evidence agent scope
```

## 4. Scope

- Review `docs/sprints/LIVE-EVIDENCE-AGENT-001/TASK.md`.
- Convert the draft into a QA-only Sprint scope proposal.
- Define Evidence Checklist.
- Define Package/Profile readiness judgement criteria.
- Define PASS / BLOCKED / NOT SUPPORTED criteria.
- Separate existing-evidence checks from live-action-needed checks.
- Identify user approvals required for any later live action.
- Keep actual live action deferred.

## 5. Out of Scope

- Provider execution
- Deployment
- MCP Tool Invocation
- Gateway Runtime implementation
- Runtime implementation
- Marketplace implementation
- Package publishing
- DB migration
- UI implementation
- Credential or Vault value access
- Secret output
- Mock success
- Placeholder READY

## 6. Files to Inspect

Primary:

- `.buildflow/NEXT_TASK.md`
- `.buildflow/STATUS.md`
- `.buildflow/CURRENT_TASK.md`
- `docs/sprints/LIVE-EVIDENCE-AGENT-001/TASK.md`
- `docs/sprints/LIVE-EVIDENCE-001/REPORT.md`
- `docs/sprints/LIVE-EVIDENCE-002/REPORT.md`
- `docs/sprints/AGENT-PACKAGE-001/REPORT.md`
- `docs/project/ROADMAP.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/TECH_DEBT.md`

Supporting:

- `src/features/agents/package-profile.ts`
- `src/features/agents/validation-gate.ts`
- `src/features/agents/tool-resolution.ts`
- `src/features/mcp/types.ts`

## 7. Implementation Requirements

Documentation-only requirements:

- Do not start implementation.
- Do not move the Sprint to `APPROVED / SCOPE FROZEN` unless explicitly told.
- Do not modify application code.
- Do not read Vault or Credential values.
- Do not run live Provider checks.
- Do not deploy.
- Do not invoke MCP Tools.

Expected document output:

- QA-only scope proposal
- Evidence Checklist
- Package/Profile readiness judgement table
- Existing Evidence coverage table
- Live-action-needed list
- Required PM approval questions

## 8. Acceptance Criteria

- `LIVE-EVIDENCE-AGENT-001` remains clearly QA-only unless separately approved.
- Existing Evidence and missing Evidence are separated.
- Any future live action is explicitly marked as requiring approval.
- Package readiness is not confused with Marketplace publish readiness.
- No Credential, Vault, Provider raw response, or secret value is recorded.
- No code, DB, UI, runtime, deployment, or Provider behavior changes occur.

## 9. Validation

Run:

```bash
git diff --check
```

If documents are edited, also run a targeted secret pattern scan over the edited
documents.

## 10. Memory Updates

After completing the QA-only scope document work:

- Update `memory/05_current_sprint.md` with the actual Sprint status.
- Update `memory/06_change_log.md` with the document change.
- Update this file with the next single task or mark the current task complete.

Do not rewrite unrelated memory sections.

## 11. Restrictions

- No automatic commit.
- No push.
- No deploy.
- No Provider execution.
- No live Credential or Vault access.
- No MCP Tool Invocation.
- No Runtime implementation.
- No Marketplace implementation.
- No Package publishing.
- No assumptions that QA-only evidence equals live production readiness.
