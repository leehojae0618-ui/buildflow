# LV5-FOUNDATION-BASELINE-001 Plan

## Status

```text
DRAFT / NOT IMPLEMENTATION APPROVED
```

## Audit Model

This is a planning label, not a release certification or an existing product
metric.

| Level | Meaning |
|---|---|
| LV.0 | No identified implementation or only an aspiration. |
| LV.1 | Types, deterministic helpers, fixtures, or isolated tests exist. |
| LV.2 | A bounded implementation exists, but is not fully product-connected. |
| LV.3 | Product UI/server flow and durable data are connected; real-environment proof may still be missing. |
| LV.4 | Authenticated browser E2E, failure behavior, ownership, and real-environment evidence are verified. |
| LV.5 | The capability is repeatable, observable, evidence-backed, safe against false success, independently audited, and usable in the approved product flow. |

## LV.5 Outcome

The target user journey is not considered LV.5 until every transition is
source-backed and its failure state is visible.

```text
Idea
→ Requirement and Clarification
→ Canonical Blueprint and Acceptance Contract
→ Explicit Approval
→ Approved external execution
→ Result collection
→ Evidence normalization
→ Verification verdict
→ Remediation instruction
→ Reverification
```

## Proposed External-Builder Boundary

| BuildFlow owns | External builder adapter owns |
|---|---|
| Requirement, Clarification, canonical Blueprint, approval policy, acceptance cases, normalized evidence, verdict, remediation, reverification links | Connector-specific configuration, workflow runtime, webhook/scheduler, platform API invocation, action logs, and platform-specific retry mechanics |

The adapter must return only approved reference and safe-summary data to
BuildFlow. It must not receive secrets through a Package, produce a success
claim without an execution reference, or make a write/action before the
relevant approval is consumed.

## Adapter Evaluation Criteria

| Candidate | Existing repository asset | Current assessment | Required future decision |
|---|---|---|---|
| Make | Connector catalog reference in `src/features/connectors/registry.ts` | `CONTRACT-ONLY`; no adapter, webhook, or live test | OSS/API/security evaluation and one-platform scope freeze |
| n8n | Connector catalog reference and historical automation documents | `CONTRACT-ONLY`; no current product adapter invocation is evidenced | Define ownership, webhook, credential, idempotency, and log projection contract |
| Zapier | No observed implementation adapter | `NOT CONNECTED` | Evaluate only after a single-adapter vertical slice proves the canonical contract |
| Manual Handoff Package | `package-builder` and `package-installer` modules | `PARTIAL`; archive export/import exists but no execution-result loop | May serve as a safe interim handoff, not as proof of external execution |

## Proposed Sprint Sequence

All candidates below are DRAFT. None activates implementation or selects an
external platform.

| Order | Candidate | Purpose and dependency | Allowed scope | Explicit exclusions | Completion and validation | Required approval |
|---|---|---|---|---|---|---|
| 1 | `LV5-CANONICAL-CONTRACT-001` | Bridge existing Requirement Snapshot, Architecture/Agent Blueprint, approval, execution, evidence, test, and verdict references | Type/validator/document contract only | Provider/MCP calls, migration, UI redesign | Cross-contract fixtures, deterministic serialization, duplicate-contract audit | Scope + implementation approval |
| 2 | `LV5-APPROVAL-PRODUCT-INTEGRATION-001` | Make the existing approval state visible and create/decide requests from a persisted Project | Authenticated server action and UI projection using existing Runtime Approval repository | Runtime invocation, new approval engine, DB schema expansion | ownership, expiry, reject/revoke, single-use failure tests and browser QA | Product approval scope + live DB gate decision |
| 3 | `LV5-EXTERNAL-BUILDER-ADAPTER-001` | Prove one selected builder adapter against the canonical contracts | One adapter, fake-client contract tests, approved reference-only result mapping | Multi-platform support, queue, hidden fallback, provider/MCP expansion | adapter contract tests, safe-error tests, OSS evaluation | Platform-selection and external-action approval |
| 4 | `LV5-EXECUTION-RESULT-COLLECTOR-001` | Persist execution references and safe platform outcomes | Collector/repository, ownership, idempotency, safe status mapping | Raw logs/payloads, automatic remediation, UI claims without evidence | duplicate/replay/failure tests and approved DB validation | DB and external-environment approval |
| 5 | `LV5-EVIDENCE-NORMALIZATION-001` | Join external result references to Runtime Evidence and Package projections | Canonical evidence envelope and reference validators | Raw payload storage, provider behavior change | checksum, redaction, ordering, cross-source tests | Scope + implementation approval |
| 6 | `LV5-ACCEPTANCE-VERIFICATION-001` | Evaluate approved acceptance cases against normalized evidence | Verdict projector and browser-visible truthful state | Synthetic success, autonomous retry | success/failure/insufficient-evidence tests; browser QA | Scope + implementation approval |
| 7 | `LV5-REMEDIATION-001` | Create a safe human-readable remediation instruction from a failed verdict | Structured remediation contract and UI presentation | Automatic fix execution, secret-bearing instructions | deterministic mapping, unsafe-value rejection, browser QA | Scope + implementation approval |
| 8 | `LV5-REVERIFICATION-001` | Link a new execution attempt to the failed verdict/remediation | Reference-only lineage and terminal-state rules | Reusing consumed approval, retry engine | replay/lineage/idempotency tests and DB validation | Scope + live DB approval |
| 9 | `LV5-REAL-ENVIRONMENT-E2E-001` | Verify one end-to-end approved product path in a non-production environment | authenticated UI, DB/RLS, one approved external action, evidence capture | production rollout, broad load test, multi-provider | E2E evidence, negative authorization test, audit | Environment + external-action approval |
| 10 | `LV5-MULTI-PLATFORM-001` | Add a second adapter only after the first LV.5 path is proven | Capability mapping and adapter compatibility | generalized orchestration rewrite | compatibility, fallback refusal, safety audit | Separate platform approval |

## Risks and Stop Conditions

- Do not make the existing `RuntimeExecutionRequest` or `RuntimePlan` into a
  generic external-builder contract without a compatibility audit.
- Do not treat connector catalog entries as installed, authorized, or live
  connections.
- Do not declare a DB-backed action real until RLS, RPC, ownership, and
  browser evidence are available.
- Do not expose a remediation command that can trigger an external write.
- Stop for a scope amendment if a migration, queue, retry worker, secret
  storage change, new provider, or multi-platform selection becomes necessary.

## Expected Change Areas for Future Work

Future candidates will likely reuse, rather than replace,
`src/features/requirements`, `architecture`, `runtime-approval`,
`product-runtime`, `agents`, `verification`, `package-builder`, and
`package-installer`. The exact file list is intentionally not frozen by this
planning Sprint.

