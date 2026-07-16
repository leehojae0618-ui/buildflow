# BuildFlow Roadmap

## Product Pivot

PIVOT-001 changes the product direction from an AI Recommendation Platform to an AI System Builder Platform. Existing MVP features remain the foundation while the following domain engines are introduced in sequence: Requirement, Clarification, Constraint, Consent, Architecture, Build Planner, Build, Installation, Test, and Marketplace.

## Phase 1 — Builder MVP

- Requirement analysis
- Clarification
- Constraint and consent
- System design
- Build planning
- Build engine
- Installation wizard
- Test engine
- Existing Discovery and Guided Execution foundations

## Phase 2 — Beta

- Error recovery
- Usage control
- Operational monitoring
- User feedback
- Deployment and onboarding

## Phase 3 — Marketplace

- System sharing
- Version snapshots
- Clone and installation
- Creator model
- Paid listings
- Hosted agents

Marketplace unit: `AI System Package` with Requirement, Blueprint, Prompt, Build Plan, Environment, Installer, Version, and Artifacts.

## Product Review Freeze

Product Review 001 freezes the next five implementation targets: PIVOT-005 Architecture Foundation, PIVOT-006 Build Intelligence, PIVOT-007 Build Planner, PIVOT-008 Installation Wizard, and PIVOT-009 Test Engine. Mid-Sprint product direction changes require change control and are recorded in `docs/project/PRODUCT_REVIEW.md`.

## Release Path

```text
Feature Sprint → Stabilize Sprint → Product Review → RC → Beta → Launch
```

RC permits only bug fixes, performance improvements, QA, and stabilization. No new feature enters RC.

During MVP, ideas outside this frozen roadmap are classified as MVP-required, Beta backlog, or Future backlog and are not started without Product Review approval.
