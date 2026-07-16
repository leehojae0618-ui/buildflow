# ADR-003: Recommendation Platform to AI System Builder Platform

## Status

Accepted for product and domain language. Implementation deferred to follow-up Tasks.

## Context

BuildFlow currently presents Recommendation, Workflow, Template, Tool Explorer, Workflow Library, and Dashboard experiences. These features provide useful foundations, but the language implies that the product ends when a recommendation is shown or a workflow is selected. The intended product value is broader: transform a user's goal into an AI system that can be designed, built, installed, tested, and used.

## Decision

BuildFlow is officially defined as an AI System Builder Platform.

| Current term | Target term |
|---|---|
| Recommendation | Build Session |
| Workflow | Build Plan |
| Template | Blueprint |
| Tool Explorer | Component Catalog |
| Workflow Library | Blueprint Library |
| Dashboard | Build Center |

Existing implementation terms remain compatibility labels until a dedicated implementation Task defines route, database, API, UI, and migration compatibility. PIVOT-001 changes documentation only.

## Engine Boundary

The Builder domain will be organized around Requirement, Clarification, Constraint, Consent, Architecture, Build Planner, Build, Installation, Test, and Marketplace Engines. Naming an Engine does not claim that it is implemented.

## Marketplace Boundary

The Marketplace sharing unit is an `AI System Package` containing Requirement, Blueprint, Prompt, Build Plan, Environment, Installer, Version, and Artifacts. Secrets and personal data are excluded.

## Consequences

- Product decisions can be evaluated against the complete build journey.
- Existing Recommendation and Guided Execution work remains reusable foundation.
- Existing routes and tables use legacy terms temporarily.
- A later compatibility plan is required before any code or database rename.
