# BuildFlow Package Specification (BPS) v1.0

Status: Approved specification for MARKET-001
Scope: Package standard only. Package Builder, Installer, Marketplace UI, APIs, and storage are out of scope.

## 1. Purpose and authority

BPS is the canonical, portable description of an AI System Package. BuildFlow Runtime MUST accept only packages conforming to this specification; future Builder and Installer implementations MUST produce and consume the same format. A package is a versioned, reviewable snapshot and MUST NOT contain secrets, personal data, provider response bodies, or live mutable state.

The package model extends [PROJECT_BIBLE.md](../project/PROJECT_BIBLE.md), [MASTER_PRD.md](../project/MASTER_PRD.md), and [ARCHITECTURE.md](../project/ARCHITECTURE.md). Existing terms remain compatible: Recommendation is the entry into a Build Session, Workflow is a Build Plan, Template is a Blueprint, and Tool Explorer is the Component Catalog.

## 2. Package manifest

Every package root MUST contain `package.yaml`. YAML is the authoring and export format; canonical serialization for checksums uses UTF-8, LF line endings, sorted mapping keys, and no comments.

```yaml
id: com.example.ai-customer-support
name: ai-customer-support
displayName: AI Customer Support
description: Support assistant package
version: 1.0.0
author: { name: Example, id: example }
license: Apache-2.0
homepage: https://example.com/support
repository: https://github.com/example/support
icon: assets/icon.svg
category: customer-support
tags: [support, retrieval]
visibility: private
createdAt: 2026-07-16T00:00:00Z
updatedAt: 2026-07-16T00:00:00Z
```

`id` is a globally stable reverse-domain identifier and MUST remain stable across versions. `name` is a package slug. `displayName`, `description`, `author`, `license`, `version`, `category`, `tags`, `visibility`, `createdAt`, and `updatedAt` are required. `homepage`, `repository`, and `icon` are optional relative or HTTPS references. Visibility is one of `private`, `published`, `deprecated`, or `archived`.

## 3. Compatibility

`compatibility` MUST declare `minRuntime`, `minBuildFlowVersion`, `providers`, `connectors`, `regions`, and `hosting`. Providers and connectors use stable IDs, not display names. Breaking changes include removing an artifact, changing a required input, changing permissions, changing provider semantics, or making an existing dependency incompatible. Such changes require a new major package version. Runtime MUST reject unsupported major versions before execution.

## 4. Requirement

`requirement` contains `goal`, `constraints`, `consent`, `clarification`, and `buildPreference`. It is the portable form of the Requirement Snapshot. Constraints use `AUTO`, `PARTIAL`, `CONSENT_REQUIRED`, `MANUAL`, `EXPERT`, and `UNSUPPORTED`. Consent identifies action, data scope, external party, and required approval; it never contains approval tokens or credentials.

## 5. Architecture

`architecture` contains an immutable `snapshot`, zero or more `candidates`, and `selectedCandidate`. A snapshot has schema version, components, connections, dependencies, and capability metadata. The selected candidate MUST reference an included candidate. Runtime MUST validate the graph and dependencies before planning.

## 6. Connector and credential

Each connector declares provider ID, connector ID, purpose, required/optional status, credential references, and requested permissions. A credential definition declares an opaque reference, required fields by name/type, validation rules, rotation policy, and expiration policy. References are resolved at runtime and credential values are never exportable.

## 7. Build Plan

`buildPlan` contains ordered phases and tasks. Each task has ID, action, inputs, dependencies, execution strategy (`AUTO`, `USER_ACTION`, or `EXPERT_REQUIRED`), idempotency expectation, and completion condition. Dependencies MUST be acyclic. User approval boundaries for external access, cost, installation, and destructive actions are mandatory.

## 8. Artifact

Artifacts are typed, content-addressed entries with `id`, `type`, `path`, `mediaType`, `checksum`, and `sensitive` metadata. v1 types are `prompt`, `workflow`, `sql`, `environment-template`, `config`, `document`, and `installer`. Templates and configs use placeholders for credentials. SQL declares read-only or mutating behavior; mutation requires explicit consent.

## 9. Verification

`verification` defines rules, required providers, optional providers, stages, safe evidence fields, expiration, and the ready rule. Evidence is metadata only: status class, latency, capabilities, timestamps, and safe error codes. Required providers must be valid and unexpired for `READY`; optional unverified providers yield `READY_WITH_WARNINGS`; missing or failed required providers yield `BLOCKED` or `FAILED`. Structural Test Summary alone MUST NOT produce `READY`.

## 10. Versioning and dependency

Versions use Semantic Versioning: patch fixes non-contract defects, minor adds backward-compatible capabilities, and major may break inputs, outputs, permissions, artifacts, or dependencies. Migration rules declare handling of persisted package state; rollback identifies a prior compatible version and never implies rollback of irreversible external effects.

Dependencies are explicitly typed as `package`, `blueprint`, `connector`, or `provider`, with ID, version range, optionality, and compatibility constraints. Required unresolved dependencies block installation.

## 11. Security and integrity

Secrets, raw credentials, access tokens, private keys, personal data, provider response bodies, and unredacted logs are forbidden. Permissions follow least privilege and are declared per connector/task. The canonical manifest and every artifact use SHA-256 checksums recorded in `integrity.yaml`. Future signatures may add a BPS-compatible signature field; unsigned packages are marked untrusted according to host policy.

## 12. Lifecycle

`draft` is editable and non-installable by default. `private` is owner-only and immutable to other users. `published` is discoverable and immutable; changes create a new version. `deprecated` remains resolvable for existing dependents but is not recommended for new installs. `archived` is hidden and cannot be newly installed unless restored by policy.

## 13. Export and import

```text
package-root/
├── package.yaml
├── requirement.yaml
├── architecture.yaml
├── connectors.yaml
├── credentials.yaml
├── build-plan.yaml
├── verification.yaml
├── dependencies.yaml
├── integrity.yaml
├── artifacts/{prompts,workflows,sql,configs,documents,installers}/
└── assets/
```

Export MUST be deterministic and secret-free. Import MUST validate schema, IDs, SemVer, checksums, dependencies, compatibility, permissions, and forbidden content before any build or external action. Import is validation, not execution or publication.

## 14. Minimum package examples

- **AI Customer Support** — `com.buildflow.ai-customer-support`; OpenAI required, Supabase optional, retrieval workflow, support prompt, and knowledge-base SQL/config.
- **AI Review Platform** — `com.buildflow.ai-review-platform`; OpenAI and Supabase, classification prompt, moderation workflow, review-schema SQL, and declared data consent.
- **AI CRM** — `com.buildflow.ai-crm`; OpenAI, optional CRM connector, lead-summary prompt, CRM sync workflow, environment template, and installer instructions. CRM write permissions remain explicit user actions.

## 15. Conformance

A BPS v1.0 package conforms only when required manifest fields exist, references resolve, compatibility and permissions validate, the selected architecture is valid, checksums match, forbidden content is absent, and verification can determine a final state without client memory. Future Package Builder, Installer, and Marketplace tasks MUST use this specification rather than redefine these terms.
