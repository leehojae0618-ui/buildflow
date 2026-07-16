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

## Debt Rules

- Debt is not silently treated as a feature.
- High-priority debt must be linked to a Sprint before Commit Approval for the affected foundation.
- Product Review checks whether debt was reduced, accepted, or re-prioritized.
