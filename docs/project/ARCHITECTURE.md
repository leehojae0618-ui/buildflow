# BuildFlow Architecture

## Current Stack

- Next.js
- TypeScript
- Supabase PostgreSQL
- Supabase Authentication
- Supabase RLS
- OpenAI Responses API
- Vitest

## Target Domain Engines

- Requirement Engine
- Clarification Engine
- Constraint Engine
- Consent Engine
- Architecture Engine
- Build Planner
- Build Engine
- Installation Wizard
- Test Engine
- Marketplace Engine

## Requirement Foundation

`src/features/requirements/` contains the first domain layer: Goal Parser, prioritized Clarification Queue, Conversation State, Missing Requirement detection, Summary generation, Constraint assessment, Consent requirements, Capability Calculator, and Requirement Snapshot creation. Project creation stores the snapshot inside the existing `projects.goal_constraints` JSONB field, so no Migration is needed. Recommendation code remains a downstream-compatible layer. Future Build Planner and Installation Wizard components consume `Snapshot.capabilities` rather than inventing their own constraint vocabulary.

`intelligence.ts` derives a deterministic Build Intelligence result from the Snapshot. It estimates build/setup time, monthly cost, risk, confidence, and Build Score without calling an external AI or changing the database schema.

`src/features/architecture/` owns the Component Registry and deterministic Component Selection Engine. It creates an `architecture-v1` snapshot with components, connections, and dependencies; the snapshot is embedded in the existing project JSONB payload until a later schema decision.

## Domain Translation

- Recommendation → Build Session
- Workflow → Build Plan
- Template → Blueprint
- Tool Explorer → Component Catalog
- Workflow Library → Blueprint Library
- Dashboard → Build Center

These names describe the target domain. Existing database tables and routes remain unchanged until a separately approved implementation task defines a migration and compatibility plan.

## AI System Package

Marketplace packages are versioned snapshots containing Requirement, Blueprint, Prompt, Build Plan, Environment, Installer, Version, and Artifacts. Secrets and personal data are excluded.

## Architecture Rule

기존 기능을 폐기하기보다 새로운 Planning 및 Build Domain의 기반으로 확장한다.
