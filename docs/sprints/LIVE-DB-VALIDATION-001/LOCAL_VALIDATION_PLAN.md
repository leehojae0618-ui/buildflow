# LIVE-DB-VALIDATION-001 Supabase Local Validation Plan

## Plan Identity

```text
Sprint: LIVE-DB-VALIDATION-001
Work Unit: SUPABASE-LOCAL-VALIDATION-PLAN
Status: PLAN DRAFT / NOT EXECUTION APPROVED
Baseline: b4eb63fab005eb98381ae318c6c17be9c729fb9d
```

This is an execution plan only. It grants no Supabase CLI, Docker, database,
migration, SQL/RPC, test-user, Provider, commit, push, or deploy authority.

## Objective

Plan a disposable Supabase Local validation of the currently unverified Runtime
Approval and Product Runtime boundaries: migration application, RPC behavior,
RLS, single-use concurrent consume, and Runtime Evidence persistence. The
repository-direct dry harness is reused as a safety guard; the Fake Provider is
the only permitted provider. Production and application Supabase targets must
be blocked before any connection. Every execution gate needs separate user
approval.

## Current Validation State

| Completed without DB access | Not performed |
| --- | --- |
| Environment and production/app target guards | Supabase Local startup |
| Explicit `LIVE_DB_*` client composition contract | Migration reset/application |
| Fake Provider and OpenAI fail-closed guard | RPC and approval lifecycle calls |
| Safe evidence summary and cleanup manifest structure | RLS matrix with distinct identities |
| Dry case registry and focused tests | Concurrent consume execution |
| Full regression, typecheck, lint, build | Runtime Evidence count and cleanup execution |

The dry harness was pushed at `b4eb63f`. This is not evidence that Local DB
validation, staging, production, or external Provider validation has occurred.

## Tooling and Local Environment Preconditions

At the separately approved tooling-inspection gate, inspect only:

```bash
node --version
npm --version
docker --version
docker info
npx supabase --version
git status --short
git rev-parse HEAD
```

These commands are examples for a future gate and are not authorized now.
`npx supabase` is the recommended CLI strategy: it avoids a new dependency or
permanent global install, keeps repository changes at zero, and can be
version-pinned in a later approved command if needed. An already-installed or
devDependency CLI may be used only after its version is inspected.

`supabase/config.toml` defines Local ports: API `54321`, database `54322`,
Studio `54323`, and local SMTP UI `54324`. Docker must be healthy before Local
startup. No port or config is changed by this plan.

## Future Environment File Contract

The execution-only file is `.env.live-db.local`, covered by `.env*` ignore
rules. It may be created only at an approved Local startup gate and is never
printed or committed.

```text
LIVE_DB_TARGET_ENV=local
LIVE_DB_SUPABASE_URL=
LIVE_DB_SUPABASE_ANON_KEY=
LIVE_DB_SUPABASE_SERVICE_ROLE_KEY=
LIVE_DB_DATABASE_URL=
LIVE_DB_EXECUTION_CONFIRMED=true
LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF=
NEXT_PUBLIC_SUPABASE_URL=
```

- `.env.local` is never modified.
- A Local URL must be `localhost` or `127.0.0.1`.
- `OPENAI_API_KEY` presence is a fail-closed stop; its value is never read or
  printed.
- `LIVE_DB_EXECUTION_CONFIRMED=true` does not replace user approval.
- Keys, JWTs, database passwords, full URLs, and full project references are
  excluded from logs and evidence.

## Approval Gates

| Gate | Purpose | Separate approval | Status |
| --- | --- | --- | --- |
| L0 | Plan audit and safety review | no external execution | READY FOR AUDIT |
| H1 | Pre-L1 safety hardening | separate code/test scope and review required | NOT APPROVED |
| L1 | Tooling inspection | required | NOT APPROVED |
| L2 | Supabase Local startup and Local values | required | NOT APPROVED |
| L3 | Migration reset/application and schema/RPC inspection | required | NOT APPROVED |
| L4 | Auth and disposable fixture setup | required | NOT APPROVED |
| L5 | RPC and approval lifecycle | required | NOT APPROVED |
| L6 | RLS matrix | required | NOT APPROVED |
| L7 | Concurrent consume | required | NOT APPROVED |
| L8 | Cleanup and Local shutdown | required | NOT APPROVED |
| L9 | Claude evidence audit | evidence review only | NOT STARTED |

### H1 — Pre-L1 Safety Hardening

H1 is mandatory before L1 may become an approval candidate. This document
defines H1 only; it does not grant H1 code or test modification authority.

#### H1-1 — `executedCaseIds` semantics

`executedCaseIds` must contain only Case IDs for which the specific validation
run completed an actual action and assertion. It must not mean every registered
or dry-runnable Case. Future evidence must distinguish at least:

```text
executedCaseIds
failedCaseIds
skippedCaseIds
notApplicableCaseIds
```

An equivalent per-case result structure is acceptable if it preserves
`caseId`, execution status, expected/actual safe result, safe error code, and
verdict. Approved status vocabulary is `EXECUTED_PASS`, `EXECUTED_FAIL`,
`SKIPPED_REQUIRES_LOCAL`, `SKIPPED_REQUIRES_STAGING`, and `NOT_APPLICABLE`.

#### H1-2 — Client identity tampering regression test

H1 must add dedicated fail-closed tests for each of the following before a
Runtime or Repository call:

```text
supabaseClientMode !== LIVE_DB_EXPLICIT_INJECTION
appClientFactoryUsed === true
adminClientFactoryUsed === true
serverClientFactoryUsed === true
explicit client missing
repository default-client fallback possible
```

Expected bounded failures include `LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED` and
`LIVE_DB_APP_CLIENT_FACTORY_USED`; H1 may add a more specific safe code only in
its separately approved implementation scope.

H1 is complete only after its focused tests, full regression, typecheck, lint,
and build pass; network, DB/RPC, and secret exposure remain zero; Claude
independent hardening audit, user-approved commit/push, and GPT GitHub review
are complete. Until then, the authority boundary is:

```text
H1 PLAN DEFINITION AUTHORITY: APPROVED
H1 CODE IMPLEMENTATION AUTHORITY: NONE
H1 TEST MODIFICATION AUTHORITY: NONE
TOOLING INSPECTION AUTHORITY: NONE
SUPABASE CLI AUTHORITY: NONE
DOCKER AUTHORITY: NONE
SUPABASE LOCAL AUTHORITY: NONE
DB CONNECTION AUTHORITY: NONE
MIGRATION AUTHORITY: NONE
SQL/RPC AUTHORITY: NONE
```

L1 tooling inspection cannot be approved or executed before H1 has completed
all of those implementation, audit, commit, push, and review gates.

## Migration Strategy

An approved `npx supabase db reset` would apply migrations in filename order.
The Local validation focuses on these already-committed migrations:

| Migration | Expected objects |
| --- | --- |
| `20260727000100_add_runtime_evidence_persistence.sql` | `runtime_evidence_records`, owned-read RLS, append-only triggers |
| `20260728000100_add_runtime_approval_foundation.sql` | approval requests/events, RLS, immutable-binding trigger, create/decide/consume RPCs |

The reset seed is configured at `supabase/seed.sql`; Gate L3 must inspect its
effect before moving on. Migration failure, partial object creation, unexpected
destructive behavior, or a need to alter migration history stops the gate. Only
safe migration filenames, expected/observed object names, and migration history
status may be recorded. Retry, manual SQL, history manipulation, or cleanup
need fresh approval.

## Validation Matrix

| Case ID | Actor | Action | Expected DB/RPC result | Status/event/evidence expectation | Severity | Cleanup |
| --- | --- | --- | --- | --- | --- | --- |
| ENV-LOCAL-01 | Harness | validate Local target | accepted masked target only | no rows | P0 if failure-open | no |
| MIG-01 | Local admin boundary | reset and inspect | required tables/RPCs/policies/triggers exist | no runtime evidence | P0 on partial migration | reset only by approval |
| APR-01 | service-role setup | create | `PENDING` approval | one `CREATED`; evidence 0 | P1 | yes |
| APR-02 | service-role setup | approve/reject/revoke/expire isolated fixtures | safe state result | one matching event; evidence 0 | P1 | yes |
| APR-03 | service-role setup | consume exact approved binding | `CONSUMED` once | one `CONSUMED`; no repository-only Provider | P0 on replay | yes |
| APR-04 | service-role setup | consume mismatched binding | safe mismatch error | unconsumed; evidence 0 | P0 if consumed | yes |
| RLS-01 | owner | select owned records | allowed | no mutation | P0 if policy differs from expectation | yes |
| RLS-02 | other authenticated | select/mutate owner rows | denied or empty | no changed rows/events/evidence | P0 on access | yes |
| RLS-03 | anon | select/direct write/RPC | denied | no changed rows/events/evidence | P0 on access | yes |
| CON-01 | two independent clients | simultaneous consume | exactly one success | one event; handoff/evidence max one | P0 on multiple success | yes |
| EVD-01 | injected Fake Provider | approved product runtime path | safe Runtime Result | FAKE identity; external count 0; evidence one as defined | P0 on duplicate/fallback | yes |
| CLN-01 | Harness | cleanup prefixed fixtures | only prefixed data removed | before/after counts | P1 on failure | Local stop/reset by approval |

## RPC, RLS, and Concurrent Consume Design

The relevant RPCs are `create_runtime_approval_request`,
`decide_runtime_approval_request`, and `consume_runtime_approval_request`.
They are service-role functions; direct authenticated reads use owned-project
RLS. Local validation separates owner, other authenticated user, anon, and the
service-role setup boundary.

CON-01 uses two separately injected clients or database connections, one
approval ID, the identical binding, and a Promise barrier. After release,
inspect only safe results and verify exactly one success, `CONSUMED` status,
one `CONSUMED` event, maximum one Runtime handoff/Evidence record, and replay
rejection. This document neither implements nor runs that design.

## Fake Provider and Evidence

Future Product Runtime validation requires explicit injection of the existing
Fake Provider and records only:

```text
providerMode: FAKE
providerAdapterIdentity: buildflow.live-db-validation.fake-provider.v1
externalProviderCallCount: 0
defaultProviderFallbackUsed: false
openAIAdapterConstructedByHarness: false
openAIAdapterCalled: false
```

The Product Runtime Bridge's static adapter import is not a failure alone.
Harness-owned OpenAI construction/call, a default fallback, or an external
provider call count above zero is P0.

Per-case evidence may contain only validation run ID, baseline commit, target
environment and masked target, CLI/Docker/migration versions, case and actor,
expected/actual safe result, safe error code, approval state/event count,
Runtime Evidence count, Fake Provider identity, cleanup state, secret flag, and
verdict. It excludes keys, JWTs, passwords, URLs, prompts, payloads, raw SQL
errors, stack traces, and personal data.

## Cleanup, Stop, and Recovery

All fixtures use `live-db-validation-001-`. Cleanup records before/after counts
and removes only prefixed data in foreign-key-safe order: Runtime Evidence,
approval events (counted; normally cascaded), approval requests, Package
Evidence references if created, test projects, then test users.

Stop immediately for baseline/target mismatch, unknown production identity,
OpenAI key, missing Fake Provider, app/default client use, secret/JWT/raw
error/stack trace exposure, Docker/Local startup failure, migration
failure/partial state, unexpected destructive SQL, missing RPC, RLS mismatch,
unauthorized write/RPC, multiple consume successes, duplicate event/evidence,
external provider call, or cleanup failure. RLS/replay/double consume violations
are P0 and prohibit E2E, staging, and production progression.

Safe automatic recovery is limited to stopping the current command, recording a
safe failure, and stopping Local processes. Reset retry, fixture recreation,
cleanup retry, or Docker restart require user approval. Production SQL, manual
migration edits/history manipulation, force cleanup, and staging/production
bypass are forbidden.

## Expected Future Commands

These examples are not approved by this plan:

```bash
# L1 inspection — only after H1 completion and separate user approval
docker --version
docker info
npx supabase --version

# L2 Local startup
npx supabase start

# Dry guard
npm run live-db:validate:dry

# L3 disposable Local reset
npx supabase db reset

# Future Local runner; not present today
npm run live-db:validate:local

# L8 Local shutdown
npx supabase stop
```

`live-db:validate:local` does not exist in `package.json`. It requires a
separate Local Harness Integration approval; this plan makes no package change.

## P2 Hardening Recommendation

H1 must resolve the two P1 items before L1. The three P2 items are recommended
for the same small hardening work unit but do not independently block L1.

| Item | Classification | Timing | Blocking Before L1 |
| --- | --- | --- | --- |
| Classification naming | P2 | H1에서 함께 처리 권장 | NO |
| `executedCaseIds` semantics | P1 | H1 필수 | YES |
| Registry error code | P2 | H1에서 함께 처리 권장 | NO |
| Client identity tampering test | P1 | H1 필수 | YES |
| Failed target environment | P2 | H1에서 함께 처리 권장 | NO |

## Estimate and Completion Criteria

| Work | Estimate | Cost |
| --- | --- | --- |
| P2 hardening | 1–2 hours | ₩0 |
| L1 tooling inspection | 15–30 minutes | ₩0 |
| L2 Local startup | 30–60 minutes | ₩0 assuming Docker is available |
| L3 migration inspection | 30–60 minutes | ₩0 |
| L4–L6 fixtures, RPC, RLS | 2–4 hours | ₩0 |
| L7 concurrent consume | 1–2 hours | ₩0 |
| L8 cleanup/evidence | 30–60 minutes | ₩0 |
| L9 Claude audit | 30–60 minutes | ₩0 |

Total Local validation work is estimated at 6.75–12.5 hours after H1. If the
Supabase CLI or Docker runtime is unavailable, tooling installation or repair
may add approximately 30 minutes–2 hours and requires its own approval.

The planning work unit completes when Gates L0–L9 and H1, the validation matrix,
evidence, cleanup/recovery, production block, Fake Provider rule, and P2
timing are documented, with no Local/DB/Provider execution.

## Source Basis

- `supabase/config.toml`
- `supabase/migrations/20260727000100_add_runtime_evidence_persistence.sql`
- `supabase/migrations/20260728000100_add_runtime_approval_foundation.sql`
- `tests/live-db-validation/**`
- `docs/sprints/LIVE-DB-VALIDATION-001/{PLAN,TASK,CONTRACT,HARNESS_SCOPE}.md`
- `.buildflow/{CURRENT_TASK,STATUS,NEXT_TASK}.md`
