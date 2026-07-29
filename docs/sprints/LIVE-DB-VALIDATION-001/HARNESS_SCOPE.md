# LIVE-DB-VALIDATION-001 Repository-direct Harness Scope

## Scope Identity

```text
Sprint: LIVE-DB-VALIDATION-001
Work Unit: REPOSITORY-DIRECT-HARNESS-001
Status: SCOPE DRAFT / NOT IMPLEMENTATION APPROVED
Planning Baseline: 7a9d63a16b492b4453e59dcd324cd1b08cf93502
```

## Objective

The future repository-direct harness will validate the Runtime Approval
Repository boundary without a Next.js request context. Before a real DB is
authorized, it will implement the harness structure and safety guards, require
a deterministic Fake Provider, block production targets, and return only
secret-safe validation summaries.

It provides a deterministic entrypoint for a later Supabase Local gate. It
does not authorize a DB connection, migration, SQL/RPC, Provider call, or
staging/production action.

## In Scope After Implementation Approval

- Repository-direct validation runner and dry-validation mode
- Environment-variable schema and target guard
- Deterministic Fake Provider adapter and explicit-injection assertion
- External Provider call counter
- Validation result formatter and secret-safe logger
- Actor/RLS, approval lifecycle, and concurrent-consume case definitions
- Cleanup manifest and evidence-summary schemas
- Focused unit tests and future local-integration test boundary
- Package scripts that invoke the existing Vitest runner only

## Out of Scope

- Supabase CLI/Docker installation or execution
- Supabase Local start, DB connection, migration, SQL/RPC, or test-user creation
- Staging project creation or use
- OpenAI, MCP, or any external Provider call
- UI, API route, deployment, production changes, or cleanup of unrelated work
- Runtime/Approval contracts and migration SQL changes

## Recommended Harness Structure

Use a validation-only module under `tests/`, not `src/features/`. The harness
is not Product Domain behavior; keeping it outside `src/` prevents accidental
Product imports and makes sprint-end isolation/removal straightforward.
`tsconfig.json` includes repository TypeScript files, ESLint may inspect the
repository globally, and Vitest discovers tests without a dedicated config, so
the existing Vitest toolchain can execute this structure without a new runner
or dependency.

```text
tests/live-db-validation/
  environment-guard.ts
  environment-loader.ts
  live-db-client.ts
  fake-provider.ts
  validation-cases.ts
  evidence-summary.ts
  cleanup-manifest.ts
  repository-direct-harness.ts
  environment-guard.test.ts
  live-db-client.test.ts
  fake-provider.test.ts
  repository-direct-harness.test.ts
  validation-cases.test.ts
```

`repository-direct-harness.ts` is the sole composition root. It receives all
repositories, the Fake Provider, target configuration, and clock as explicit
dependencies. The only permitted dependency direction is:

```text
tests/live-db-validation
→ src/features/runtime-approval
→ src/features/product-runtime
→ src/features/agents
```

The reverse direction (`src/** → tests/live-db-validation/**`) is forbidden.
Any Product import of a Harness module is a review-blocking failure.

## Future Entry Points

No `package.json` change is made in this scope. After Harness Implementation
Approval, the expected commands are:

```bash
npm run live-db:validate:dry
npm run live-db:validate:local
```

Both commands must use the existing Vitest runner. `dry` runs only pure
guard/schema/case checks; `local` remains unavailable until a separate
Supabase Local execution approval is granted.

## Environment Contract

The harness reuses the Planning Foundation contract:

```text
LIVE_DB_SUPABASE_URL
LIVE_DB_SUPABASE_ANON_KEY
LIVE_DB_SUPABASE_SERVICE_ROLE_KEY
LIVE_DB_DATABASE_URL
LIVE_DB_TARGET_ENV
LIVE_DB_EXECUTION_CONFIRMED
```

It accepts only `local` or `staging`, rejects `production`, rejects a LIVE_DB
URL equal to `NEXT_PUBLIC_SUPABASE_URL`, and rejects a project reference equal
to the known production reference. If the known production target cannot be
determined, execution fails before a connection. Values are compared in memory
and logged only as masked project references.

`.env.local` is never modified or replaced. Future approved validation uses
only gitignored `.env.live-db.*` files. Presence of `OPENAI_API_KEY` is
fail-closed; the value is never read or printed. OpenAI import/call paths are
forbidden without a separately approved real-Provider gate.

`environment-guard.ts` is a pure function, for example
`validateLiveDbEnvironment(input: LiveDbEnvironmentInput)`, and receives an
explicit environment object. Only `environment-loader.ts` may read
`process.env` after an approved execution gate. This keeps dry tests independent
of automatic `.env` loading and permits placeholders rather than secret fixtures.

`LIVE_DB_EXECUTION_CONFIRMED=true` is mandatory for local/staging connection
modes and is not required for dry mode. It does not replace the user approval
for a DB connection. Hosted project references are derived from the first
hostname segment of `https://<project-ref>.supabase.co`, after allowed-character
validation; invalid hosted URLs fail target identity validation. `localhost` or
`127.0.0.1` targets are classified as local and use a minimally masked identity
such as `local:127.0.0.1:54***`. Hosted evidence records a masked reference such
as `abcd…wxyz`, never a full URL, query string, credential, or full ref.

## Dedicated LIVE_DB Client Contract

The Harness creates its own Supabase clients directly from `LIVE_DB_*` values.
It does not call `createSupabaseAdminClient()`, `createSupabaseServerClient()`,
or any existing App client factory; it never uses `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, or `.env.local` as execution credentials.

`live-db-client.ts` constructs the approved explicit clients from
`LIVE_DB_SUPABASE_URL`, `LIVE_DB_SUPABASE_ANON_KEY`, and
`LIVE_DB_SUPABASE_SERVICE_ROLE_KEY`, then explicitly injects the appropriate
client into `SupabaseRuntimeApprovalRepository` and
`SupabaseRuntimeEvidenceRepository`. A repository default constructor or
unverifiable client identity fails before execution.

Evidence must prove:

```text
supabaseClientMode: LIVE_DB_EXPLICIT_INJECTION
appClientFactoryUsed: false
adminClientFactoryUsed: false
serverClientFactoryUsed: false
```

Any true factory-use flag, App credential, default repository client fallback,
or inability to verify the dedicated identity is a `P0` stop condition.

## Provider Contract

The composition root must receive a deterministic Fake Provider explicitly.

```text
providerMode: FAKE
providerAdapterIdentity: buildflow.live-db-validation.fake-provider.v1
externalProviderCallCount: 0
```

The dry harness fails before Runtime invocation if the Provider is missing, a
default fallback is requested, the identity differs, an external-call counter
is non-zero, or an OpenAI key is present. The Harness files and their
composition code must not import, construct, or call
`createOpenAIRuntimeProviderAdapter`.

The existing Product Runtime Bridge may retain its static OpenAI Adapter import;
that fact alone is not a Harness failure. The failure condition is invoking the
Bridge without the explicitly injected Fake Provider, causing its default
Provider fallback to be used.

## Validation Case Matrix

| Area | Planned cases |
| --- | --- |
| Environment | missing target, invalid target, production URL/ref match, unknown production target, missing required variables, OpenAI key present, masking |
| Approval lifecycle | create, approve, reject, revoke, expire, consume, replay, binding mismatch, consumed/rejected/revoked consume |
| RLS definition | owner own/other, another user, anon select, authenticated direct write/delete, unauthorized RPC |
| Concurrent consume definition | two independent consumes; one success/event; maximum one Provider handoff; no duplicate Runtime Evidence |
| Evidence | safe result summary, Fake Provider identity, masked target, no secrets/raw errors |
| Cleanup | prefix, resource manifest, before/after counts, failed cleanup list, staging disposal marker |

RLS and concurrency assertions are defined in this work unit but are not
executed against Postgres until a separate Local execution approval.

## Stop Conditions

- Production target detected or cannot be classified
- Secret/JWT/raw DB error/stack trace would be logged
- Fake Provider is missing, Harness code imports/constructs/calls the OpenAI
  Adapter, or the default Provider fallback is used
- A LIVE_DB client is not explicit, is created from App credentials, or uses an
  App client factory/default repository fallback
- Migration fails or produces a partial object set
- Owner-external read/write, unauthorized RPC, or direct write succeeds
- Concurrent consume has multiple successes, duplicate events, or duplicate
  Runtime Evidence
- Cleanup manifest is incomplete or a cleanup operation would affect non-prefixed data

Any stop condition halts the current gate. RLS violations are `P0` security
findings and prohibit concurrent consume, E2E, and staging progression.

## Evidence and Cleanup Schemas

The result summary must contain only:

```text
validationRunId
targetEnvironment
targetProjectRefMasked
startedAt
completedAt
providerMode
providerAdapterIdentity
externalProviderCallCount
defaultProviderFallbackUsed
openAIAdapterConstructedByHarness
openAIAdapterCalled
supabaseClientMode
appClientFactoryUsed
adminClientFactoryUsed
serverClientFactoryUsed
migrationVersion
testCaseId
actorType
expectedResult
actualResult
safeErrorCode
approvalStatusBefore
approvalStatusAfter
approvalEventCount
runtimeEvidenceCount
cleanupStatus
secretExposureDetected
verdict
```

For dry mode, `migrationVersion` is exactly `NOT_APPLICABLE_DRY_MODE`. A later
approved Local or staging validation records the applied migration version.

It must never contain Supabase keys, JWTs, DB credentials, full URLs, prompts,
Provider payloads, raw SQL errors, stack traces, or personal data.

Cleanup uses the `live-db-validation-001-*` prefix and records created users,
projects, approval/event/evidence rows, Package Evidence references, before/
after row counts, failures, secret lifecycle, and disposable-staging disposal.
Cleanup failure blocks staging and production progression.

## Expected File Changes After Implementation Approval

### New files

- `tests/live-db-validation/environment-guard.ts`
- `tests/live-db-validation/environment-loader.ts`
- `tests/live-db-validation/live-db-client.ts`
- `tests/live-db-validation/fake-provider.ts`
- `tests/live-db-validation/validation-cases.ts`
- `tests/live-db-validation/evidence-summary.ts`
- `tests/live-db-validation/cleanup-manifest.ts`
- `tests/live-db-validation/repository-direct-harness.ts`
- `tests/live-db-validation/environment-guard.test.ts`
- `tests/live-db-validation/live-db-client.test.ts`
- `tests/live-db-validation/fake-provider.test.ts`
- `tests/live-db-validation/repository-direct-harness.test.ts`
- `tests/live-db-validation/validation-cases.test.ts`
- Focused `*.test.ts` files alongside the above modules

### Modified files

- `package.json` — only to add approved Vitest-based dry/local commands
- `package-lock.json` — only if the package manager changes it without adding a
  dependency; otherwise it remains unchanged

### Explicitly unchanged

- `supabase/migrations/**` and `supabase/config.toml`
- Core Runtime, Runtime Approval, Product Runtime, and Runtime Evidence contracts
- Provider adapters, UI, API routes, `.env*`, `.gitignore`, and deployment configuration

## Test and Completion Plan

Dry unit tests run without a DB connection. Local integration tests run only
after Supabase Local approval. The future implementation validation is:

```bash
git diff --check
npx vitest run <focused harness tests>
npx tsc --noEmit
npx eslint .
npm run build
```

The work unit is complete only when environment/production guards, explicit
LIVE_DB client injection, Fake Provider enforcement, zero external-call count,
secret masking, validation matrix, cleanup manifest, and dry mode all pass;
typecheck/lint/build and a Claude independent code audit also pass. The client
composition module must use `import "server-only"`; implementation must confirm
Vitest compatibility and that no browser/client or Product build artifact can
import it. DB connection and migration remain unperformed at that point.

## Approval Gates

| Gate | Required approval | Current status |
| --- | --- | --- |
| Harness implementation | User | NOT APPROVED |
| Supabase Local setup | User | NOT APPROVED |
| Local migration | User | NOT APPROVED |
| RPC/RLS execution | User | NOT APPROVED |
| Disposable staging | User | NOT APPROVED |
| External Provider | User | NOT APPROVED |
| Deploy | User | NOT APPROVED |

## Repository-direct Limits

This approach avoids a Next.js request context, has low implementation
complexity, focuses on repository boundaries, avoids a production route, and
makes Fake Provider injection simple. It cannot prove browser flows, cookies,
or hosted Supabase JWT/RLS behavior. A later test-only Next.js integration
phase is required after local validation and its independent audit.
