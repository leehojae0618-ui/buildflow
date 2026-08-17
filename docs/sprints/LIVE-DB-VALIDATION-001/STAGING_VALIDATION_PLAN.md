# LIVE-DB-VALIDATION-001 Supabase Staging Validation Plan

## Plan Identity

```text
Sprint: LIVE-DB-VALIDATION-001
Work Unit: SUPABASE-STAGING-VALIDATION-PLAN
Status: ST-A and every ST-B code gate are IMPLEMENTED and VALIDATED.
  Checkpoints: ST-B0 86c204a, ST-B0-FIX 43e74ed, ST-B0-FIX2 836046f,
  ST-B-EXEC e95927d, ST-B-EXEC FINAL FIX 2fb7451, owner project fixture
  98425bd. Which of those have reached origin/main is a live Git fact —
  verify with `git rev-parse origin/main` and `git rev-list --left-right
  --count HEAD...origin/main`; this document does not track it. The
  executable path is `npm run live-db:execute:staging`. ST-B/ST-C/ST-D
  remain NOT EXECUTION APPROVED — no DB connection, migration, SQL/RPC, or
  staging write has occurred
Baseline: e5fda3026904 (main HEAD at draft time)
Supersedes for target selection only: LOCAL_VALIDATION_PLAN.md Gates L1-L9
  remain NOT APPROVED and Local startup remains not authorized (repeated
  healthcheck failure on the 8GB M1 host); this document does not retry
  Local. It does not replace LOCAL_VALIDATION_PLAN.md's H1 hardening
  record, which is COMPLETE and reused here without change.
```

This is an execution plan only. It grants no Supabase account, CLI, project
creation, database, migration, SQL/RPC, test-user, Provider, commit, push, or
deploy authority. It also grants no code-implementation authority for the
staging execution runner described below — that is its own gate.

## Objective

Validate the currently unverified Runtime Approval and Product Runtime
boundaries — migration application, RPC behavior, RLS, single-use concurrent
consume, and Runtime Evidence persistence — against a disposable, hosted
Supabase **staging** project, since Local execution is blocked and Production
is contractually forbidden by `CONTRACT.md`. The existing H1-hardened dry
harness (`tests/live-db-validation/**`, pushed at `b4eb63f`) is reused and
extended, never bypassed. The Fake Provider remains the only permitted
provider.

## Why Staging, Not Local Retry

`LOCAL_VALIDATION_PLAN.md` Gate L2 (Supabase Local startup) failed on
repeated healthcheck on this 8GB M1 host. `NEXT_TASK.md` and `STATUS.md`
both record "no further Local startup is authorized." `PLAN.md`'s own
Environment Priority table lists Disposable Supabase Staging as the only
remaining permitted environment; this document formalizes that path.

## Two Kinds of Gate in This Plan

Unlike the Local plan, the staging path needs a code-implementation gate
before any DB-touching gate, because no staging-capable execution mode
exists yet — `HARNESS_SCOPE.md` states no `package.json` change was made in
its scope, and `live-db:validate:local`/`:staging` do not exist. The dry
harness's `repository-direct-harness.ts` currently marks every non-dry case
`SKIPPED_REQUIRES_LOCAL` or `SKIPPED_REQUIRES_STAGING` — it has no live
connection path today.

```text
ST-A  Code gate   — build a staging execution mode for the existing harness
ST-B / ST-C       — DB-touching gates that use what ST-A built
```

## Approval Gates

| Gate | Purpose | Touches a real DB | Separate approval | Status |
| --- | --- | --- | --- | --- |
| ST-A | Implement staging execution mode: `live-db-client.ts` staging connection path, a `LIVE_DB_TARGET_ENV=staging` branch through `environment-guard.ts` (already defined in `CONTRACT.md`/`HARNESS_SCOPE.md`, not yet wired to a live connector), and a new `live-db:validate:staging` script that runs ST-B's cases only in dry-check-then-connect order | No | Required | APPROVED / IMPLEMENTED (`staging-connection-guard.ts`, 2026-08-16) |
| ST-B code gates | Build the executable ST-B path: guarded migration boundary, APR/RLS runners, single composition root, `.env.live-db.staging`-only loader, MIG-01 schema and trigger verification, RLS actor/session builder with Postgres→safe-code mapping, real Supabase CLI executor, per-`event_type` journal checks, Evidence client-identity fields, and the post-migration owner project fixture | No | Required (each) | APPROVED / IMPLEMENTED (ST-B0 `86c204a`, FIX `43e74ed`, FIX2 `836046f`, ST-B-EXEC `e95927d`, FINAL FIX `2fb7451`, owner project fixture `98425bd`; push state is not recorded here — verify from Git) |
| ST-B | Tooling/account confirm + migration apply + RPC lifecycle + RLS matrix, bundled as one execution pass (per 2026-08-16 user decision: narrow first pass). Requires `ACTIVATION.md` to be completed first | Yes | Required | NOT APPROVED |
| ST-C | Concurrent consume + Fake-Provider Product Runtime E2E, as a follow-up gate after ST-B is independently audited | Yes | Required | NOT APPROVED |
| ST-D | Cleanup of `live-db-validation-001-*` fixtures and disposable-project disposal decision | Yes (destructive) | Required, explicit | NOT APPROVED |
| ST-E | Evidence audit of ST-B and, separately, ST-C | No | Review only | NOT STARTED |

Any failed gate stops progression; it does not implicitly authorize the next
gate, a retry, or scope beyond what was approved.

## What ST-A Built (code only, no DB connection)

- `tests/live-db-validation/staging-connection-guard.ts`: the staging
  execution boundary. `evaluateLiveDbStagingConnection()` composes the
  existing `environment-loader.ts` (`mode: "connection"`) →
  `environment-guard.ts` → `live-db-client.ts` chain unchanged, and adds one
  new rule on top: a passing guard whose `targetEnvironment` is not
  `"staging"` is blocked with the new `LIVE_DB_STAGING_TARGET_REQUIRED` code
  before any client is constructed. `environment-guard.ts` and
  `live-db-client.ts` needed no code changes — their staging logic
  (hosted-URL-only target identity, known-production-ref rejection failing
  closed if unset, `NEXT_PUBLIC_SUPABASE_URL` collision rejection,
  `LIVE_DB_EXECUTION_CONFIRMED=true` requirement in `mode: "connection"`)
  was already correct per `CONTRACT.md`/`HARNESS_SCOPE.md`; ST-A only wires
  it behind an explicit staging-only entrypoint. A passing guard constructs
  a Supabase client object via the existing `createLiveDbClient()` factory
  seam — object construction only, no query is issued, so this performs
  zero network calls.
- `tests/live-db-validation/staging-connection-guard.test.ts`: covers
  fail-closed-before-construction for missing execution confirmation,
  production target, non-staging target, unknown/matching production ref,
  app-URL collision, and `OPENAI_API_KEY` presence, plus the one
  fully-confirmed staging path reaching `READY` with the factory called
  exactly once and no secret-shaped value in the result. Mirrors the
  `vi.mock("server-only", ...)` pattern from `live-db-client.test.ts`.
- `types.ts`: added the `LIVE_DB_STAGING_TARGET_REQUIRED` safe error code.
- `package.json`: added `live-db:validate:staging` (Vitest-based, per
  `HARNESS_SCOPE.md`'s existing-runner-only rule), scoped to the new test
  file only.
- No `supabase/migrations/**`, Runtime/Approval/Evidence contract, or
  Provider adapter changes. No case-execution logic (MIG-01/APR-*/RLS-*) is
  wired yet — that remains ST-B's scope; a `READY` result here only proves
  the guard-then-client-construction path, not a live connection.

ST-A completion evidence: `npx vitest run tests/live-db-validation` (6 files,
36 tests, all passing, including the 7 new staging-guard tests),
`npx tsc --noEmit` clean, `npx eslint .` clean, full `npm test` regression
(977 passed / 5 skipped, zero new failures), and `npm run
live-db:validate:staging` passing standalone. Code inspection confirms the
staging branch cannot be reached unless `LIVE_DB_TARGET_ENV=staging` and
`LIVE_DB_EXECUTION_CONFIRMED=true` are both set explicitly, and that no test
in this repo exercises it with real credentials.

## Staging Project and Credential Handling

The user creates the disposable staging project directly (Supabase
dashboard or their own authenticated CLI session) — this plan grants no
Supabase account or project-creation authority to the harness or to Claude.
The user then populates the gitignored `.env.live-db.staging` file
themselves:

```text
LIVE_DB_TARGET_ENV=staging
LIVE_DB_SUPABASE_URL=
LIVE_DB_SUPABASE_ANON_KEY=
LIVE_DB_SUPABASE_SERVICE_ROLE_KEY=
LIVE_DB_DATABASE_URL=
LIVE_DB_EXECUTION_CONFIRMED=
LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF=
NEXT_PUBLIC_SUPABASE_URL=
```

`LIVE_DB_EXECUTION_CONFIRMED` stays blank while filling in the rest of this
file and stays blank until ST-B is explicitly approved. It is set to `true`
only immediately before an approved ST-B execution, and returned to blank
afterward — it is a safety switch, not a default-on setting.

- `.env.local` is never modified.
- Raw values are never pasted into chat, logs, commits, or test fixtures by
  either party; only `environment-loader.ts` reads `process.env`, and only
  masked project references are ever recorded as evidence.
- `OPENAI_API_KEY` presence remains a fail-closed stop, unchanged from
  `CONTRACT.md`.

## ST-B Validation Matrix (narrow first pass)

Reuses `LOCAL_VALIDATION_PLAN.md`'s matrix rows `ENV-*`, `MIG-01`, `APR-01`
through `APR-04`, and `RLS-01` through `RLS-03` unchanged in intent, run
against the disposable staging project instead of Local. `CON-01` (concurrent
consume) and `EVD-01` (Product Runtime E2E) are explicitly deferred to ST-C.

| Case ID | Actor | Action | Expected result | Severity |
| --- | --- | --- | --- | --- |
| ENV-STG-01 | Harness | validate staging target, reject prod-ref/prod-URL match | accepted masked target only | P0 if failure-open |
| MIG-01 | Staging admin boundary | apply committed migrations | required tables/RPCs/policies/triggers exist | P0 on partial migration |
| APR-01..04 | service-role setup | create/decide/consume/replay/mismatch | safe state results per `LOCAL_VALIDATION_PLAN.md` | P0/P1 per row |
| RLS-01..03 | owner / other authenticated / anon | select/mutate | owner allowed; other and anon denied | P0 on access violation |

## Stop Conditions (unchanged from Local plan, staging-adapted)

Same list as `LOCAL_VALIDATION_PLAN.md`'s Cleanup/Stop/Recovery section:
production/known-production-ref match, secret/JWT/raw-error exposure,
missing Fake Provider, App/default client use, migration failure or partial
object set, RLS mismatch (P0, halts ST-C and ST-D), and any external
Provider call. A staging-specific addition: network failure or Supabase
project unreachability halts the gate and is recorded without retry.

## Cleanup (ST-D)

`live-db-validation-001-*` prefix, before/after row counts, foreign-key-safe
removal order identical to the Local plan. Additionally: after ST-C and its
audit, the user decides whether to keep the disposable project for a future
gate or dispose of it; disposal is its own explicit approval and is never
implied by test completion.

## Estimate

| Work | Estimate |
| --- | --- |
| ST-A implementation + review | 2-4 hours |
| ST-B execution + evidence | 2-3 hours |
| ST-C execution + evidence (separate gate) | 1-2 hours |
| ST-D cleanup | 30-60 minutes |
| ST-E audit (per gate) | 30-60 minutes |

## Source Basis

- `docs/sprints/LIVE-DB-VALIDATION-001/{PLAN,TASK,CONTRACT,HARNESS_SCOPE,LOCAL_VALIDATION_PLAN}.md`
- `tests/live-db-validation/**`
- `.buildflow/{CURRENT_TASK,STATUS,NEXT_TASK}.md`
