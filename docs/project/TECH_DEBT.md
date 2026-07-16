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
| TD-009 | Verification Transactions | Verification Run, Target, Attempt, and safe Error persistence required one atomic owner-checked operation | Partial Verification evidence could previously be stored | Resolved | STABILIZE-READY-001 |
| TD-010 | Beta E2E QA | Authenticated browser and live cross-user Project/RLS flow could not be executed in the available QA session | Beta Ready evidence is incomplete; domain and contract tests pass | High | E2E QA rerun with authenticated Browser session |
| TD-011 | Production Evidence QA | Login, second account, browser/device matrix, live Supabase, and live RLS/ownership denial evidence unavailable in the QA session | Production Beta evidence remains incomplete despite automated PASS | High | BETA-QA rerun with authenticated multi-session environment |
| TD-012 | Autonomous Provider Execution | The orchestrator needed real GitHub, Supabase, and Vercel adapters instead of contract-only commands | Automatic service creation could not reach a deployed result | Resolved | STABILIZE-READY-001 |
| TD-013 | Live Provider Provisioning QA | GitHub, disposable Supabase, Vercel, and OpenAI were exercised through the representative AI inquiry build path | Representative Provider path has live Repository, Schema/RLS, Deployment, Health, functional response, and Verification evidence | Resolved | LIVE-EVIDENCE-002 |
| TD-014 | Production Ready Live Gate | Live Health, functional, and required Provider Verification now pass; backup and long-term monitoring remain explicit warnings | Core service is production-usable but operations evidence is incomplete | Medium | RC operations gate |
| TD-015 | Background Continuation | Provider progress is persisted and resumes automatically on Project re-entry, but Vercel status polling is driven by the active Project UI rather than a dedicated queue worker | External deployment continues after page close, but final verification waits until the user returns | Medium | AUTO-004 queue or scheduled worker |
| TD-016 | Generated Service Breadth | Automatic generation previously targeted one deterministic AI inquiry web-service architecture | Task Manager CRUD/Auth/Admin could not be produced | Resolved | CAPABILITY-002 added an explicit General CRUD Blueprint and TEST B Live Evidence |
| TD-017 | CRUD Auth Email Trust | General CRUD v1 enables Supabase email signup with automatic confirmation so disposable and default-SMTP Projects can complete without an email-delivery dependency | Email ownership is not verified; production applications that require verified email need custom SMTP and a confirmation policy | Medium | RC disclosure; separately approved verified-email Auth option |
| TD-018 | MCP Trust Registry | BuildFlow has no MCP Server publisher, trust, health, compatibility, or deprecation Registry | An unreviewed or unavailable Server could be selected without sufficient trust evidence | High | MCP-FOUNDATION-001 |
| TD-019 | MCP Version Drift | MCP Tool input/output schema and behavior can change independently of an Agent Blueprint | A previously verified Agent can break or perform different actions after a Tool update | High | MCP-FOUNDATION-001 version pinning and re-verification policy |
| TD-020 | MCP Prompt Injection | Runtime content could attempt to redirect the Agent to a different Tool, Permission, or data scope | Tool misuse, unauthorized external actions, or data disclosure | High | MCP-FOUNDATION-001 server-side allowlist and policy enforcement |
| TD-021 | MCP Excess Permission | Tool Credentials or scopes may exceed the minimum Capability requirement | A compromised or incorrect invocation can affect more data than approved | High | MCP-FOUNDATION-001 least-privilege Permission mapping |
| TD-022 | MCP Raw Result Exposure | Raw Tool results can contain Secrets, personal data, private documents, or provider diagnostics | Sensitive information could leak into Prompts, Events, Logs, Evidence, or Packages | High | MCP-FOUNDATION-001 result sanitization and output limits |
| TD-023 | MCP Cost Runaway | Tool calls can incur per-call, data, or downstream service charges without a bounded policy | Unexpected user cost and approval-scope violation | High | MCP-FOUNDATION-001 cost class, budget guard, rate limit |
| TD-024 | MCP Non-idempotent Retry | Retrying write, send, create, or delete Tools may duplicate irreversible external effects | Duplicate messages, records, charges, or destructive actions | High | MCP-FOUNDATION-001 idempotency policy and retry blocking |
| TD-025 | MCP Availability and Fallback | No health-aware Tool fallback policy exists when the selected MCP Server is unavailable | Agent execution can stall without a safe alternative or clear user action | Medium | MCP-FOUNDATION-001 health policy; fallback remains approval-bound |
| TD-026 | MCP Marketplace Trust | Publisher responsibility, review level, evidence freshness, and liability policy are undefined | Marketplace users may install unsafe or misleading Agent and Tool dependencies | High | AGENT-PACKAGE-001 and MARKETPLACE-AGENT-001 trust policy |
| TD-027 | Generated Agent MCP Authentication | Authentication, authorization, tenant isolation, rate limit, and runtime model for exposing generated Agents as MCP Servers are undefined | Published Agents could expose capabilities or user data beyond the intended audience | High | Future Agent MCP Publisher design after MCP-FOUNDATION-001 |

## Debt Rules

- Debt is not silently treated as a feature.
- High-priority debt must be linked to a Sprint before Commit Approval for the affected foundation.
- Product Review checks whether debt was reduced, accepted, or re-prioritized.
