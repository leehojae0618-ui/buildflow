# BuildFlow Technical Debt Register

This register records known limitations that are acceptable for the current implementation but require explicit follow-up. New debt must include an owner Sprint or a reason for deferral.

| ID | Area | Debt | Impact | Priority | Planned handling |
|---|---|---|---|---|---|
| TD-001 | Architecture Selection | `n8n` is currently selected unconditionally for the base architecture | Provider coupling and inaccurate architecture choices | Resolved | STABILIZE-001 |
| TD-002 | Build Intelligence | Build Intelligence does not yet consume `ArchitectureSnapshot` | Cost, time, and confidence estimates can diverge from selected components | Resolved | STABILIZE-001 |
| TD-003 | Snapshot Compatibility | Older `goal_constraints` rows may not contain newer Conversation, Architecture, or Intelligence fields | Legacy project rendering requires defensive fallback | Resolved for Architecture field | STABILIZE-001; broader fields remain follow-up |
| TD-004 | Provider Pricing | Cost estimates use a small static heuristic rather than a versioned pricing catalog | Estimates are directional, not billing-grade | Medium | PIVOT-006 follow-up / post-MVP pricing policy |
| TD-005 | Architecture UX | Architecture Summary exposes provider names more prominently than component roles | Users may see a tool list instead of a system explanation | Medium | PIVOT-006 UX refinement |
| TD-006 | Test Coverage | Full pipeline tests for Expert/Unsupported propagation and all legacy fields are incomplete | Regression risk across domain boundaries | Medium | PIVOT-006 test gate |
| TD-007 | Candidate Selection | Candidate comparison selection is local UI state; durable selection and server-side recalculation remain deferred | Refresh or multi-device selection can lose the chosen candidate | Resolved | STABILIZE-003 |
| TD-008 | External Provider QA | Provider connection validation adapters are not exercised without real user credentials | External verification remains READY_WITH_WARNINGS or WAITING_FOR_USER | Medium | Execution QA follow-up |
| TD-009 | Verification Transactions | Run, target, and attempt inserts are sequential because the client-side Supabase path has no transaction RPC | A failed child insert can leave an incomplete run; cleanup/transaction RPC is follow-up | Medium | Stabilize follow-up after PM review |
| TD-010 | Beta E2E QA | Authenticated browser and live cross-user Project/RLS flow could not be executed in the available QA session | Beta Ready evidence is incomplete; domain and contract tests pass | High | E2E QA rerun with authenticated Browser session |
| TD-011 | Production Evidence QA | Login, second account, browser/device matrix, live Supabase, and live RLS/ownership denial evidence unavailable in the QA session | Production Beta evidence remains incomplete despite automated PASS | High | BETA-QA rerun with authenticated multi-session environment |

## Debt Rules

- Debt is not silently treated as a feature.
- High-priority debt must be linked to a Sprint before Commit Approval for the affected foundation.
- Product Review checks whether debt was reduced, accepted, or re-prioritized.
