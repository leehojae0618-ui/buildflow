# BuildFlow Product Review 001

## Review Point

- Review scope: SETUP-001 through PIVOT-005
- Review type: Level 2 Product Review
- Status: APPROVED / ROADMAP AND OPERATING MODEL FROZEN
- Date: 2026-07-16

## Product Direction

BuildFlow remains an AI System Builder Platform. The product promise is not recommendation alone; it is to understand a goal, ask only necessary questions, classify constraints, select an architecture, and proceed toward a buildable system.

The current direction is accepted:

```text
Goal → Requirement → Clarification → Constraint → Consent
→ Architecture → Build Plan → Build Intelligence → Installation → Testing
```

## Review Findings

- Foundation, Recommendation, Workflow, Dashboard, Discovery, and Product Pivot foundations are sufficiently established.
- Requirement and Conversation foundations are technically usable and preserve the existing Recommendation layer.
- Architecture Foundation is the current frozen implementation scope.
- Build Intelligence must consume an approved Architecture Snapshot rather than estimate from goals alone.

## Decisions

1. Keep the current product direction through the MVP review.
2. Do not change the pipeline order during an active Sprint.
3. Treat Architecture as the source input for future Build Intelligence and Build Planner work.
4. Keep DB schema changes out of the current foundation phase unless a later approved ADR requires them.
5. Require PM Review before Commit Approval; Push requires a separate approval.

## Deferred Ideas

| Class | Idea | Decision | Reason |
|---|---|---|---|
| B | Reorder Architecture and Build Intelligence | Accepted as this review decision | Architecture is needed for reliable cost/time estimates |
| B | Add richer provider pricing catalogs | Backlog | Requires pricing source and freshness policy |
| C | Marketplace expansion | Post-MVP | Not required to validate the Builder MVP |
| C | AI routing between providers | Post-MVP | Adds complexity before core build flow is stable |

## Next Five Sprint Targets

1. PIVOT-005 — Architecture Foundation
2. PIVOT-006 — Build Intelligence Engine Foundation
3. PIVOT-007 — Build Planner Foundation
4. PIVOT-008 — Installation Wizard Foundation
5. PIVOT-009 — Test Engine Foundation

PIVOT-010 will begin only after the next Level 2 Product Review. The frozen scope may be refined within a Sprint only through an explicit change-control decision.

## Review Gate

- Product direction: approved
- Roadmap: frozen for PIVOT-005 through PIVOT-009; stabilization findings remain registered technical debt and must be handled within the approved Sprint gates
- Active implementation: one Sprint only
- PIVOT-005 Commit approval: not granted
- Push approval: not granted

## Final Operating Model Decision

This review is the final planned operating-model change during MVP. Sprint operations, Product Review, Technical Debt, Release Management, approval gates, and Semantic Version rules are frozen until a serious issue requires a new Product Review.

## Product Direction Amendment — 2026-07-17

Status: **PRODUCT OWNER APPROVED**

BuildFlow의 활성 제품 범위를 AI Agent 자동 구축과 Marketplace 공유에
집중한다.

- Core result: 배포·검증 가능한 AI Agent
- Supporting surface: Agent 사용·관리용 Web UI, API, Database, Auth, Hosting
- Marketplace unit: BPS-compatible AI Agent Package
- Preserved evidence: `general-crud-v1`과 기존 Web App Live Evidence
- On hold: 범용 Web App, SaaS, Platform Blueprint 확장

이 변경은 기존 Evidence와 구현을 삭제하지 않는다. 현재 CAPABILITY-002
Review를 완료한 뒤 후속 Sprint는 AI Agent 구축·검증·Package·Marketplace
경로 안에서만 승인한다.
