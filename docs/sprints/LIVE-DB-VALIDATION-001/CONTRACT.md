# LIVE-DB-VALIDATION-001 Validation Contract

## Authority

This contract defines future validation boundaries only. It grants no DB,
Supabase, Provider, MCP, migration, deployment, or execution authority.

```text
SPRINT PHASE: PLANNING / NOT EXECUTION APPROVED
HARNESS IMPLEMENTATION AUTHORITY: NONE
DB CONNECTION AUTHORITY: NONE
MIGRATION AUTHORITY: NONE
EXTERNAL PROVIDER AUTHORITY: NONE
PRODUCTION AUTHORITY: NONE
DEPLOY AUTHORITY: NONE
```

## Environment Files and Variables

Existing `.env.local` must not be replaced or edited. Future validation may
use these gitignored files only after a matching execution gate is approved:

- `.env.live-db.local`
- `.env.live-db.staging`

The repository currently ignores `.env*`; these names therefore remain outside
Git tracking. Their values must never be printed, committed, or placed in test
fixtures.

| Variable | Purpose |
| --- | --- |
| `LIVE_DB_SUPABASE_URL` | Isolated Local or staging Supabase URL |
| `LIVE_DB_SUPABASE_ANON_KEY` | Test-only anonymous/auth client boundary |
| `LIVE_DB_SUPABASE_SERVICE_ROLE_KEY` | Server-only setup/verification boundary |
| `LIVE_DB_DATABASE_URL` | Approved isolated DB harness connection only |
| `LIVE_DB_TARGET_ENV` | Required target selector: `local` or `staging` |

## Target Guard

Future harnesses must refuse execution unless all rules hold:

1. `LIVE_DB_TARGET_ENV` is exactly `local` or `staging`.
2. `production` is rejected unconditionally.
3. `LIVE_DB_SUPABASE_URL` must not equal the application's
   `NEXT_PUBLIC_SUPABASE_URL`.
4. The LIVE_DB project reference must not equal a known production project
   reference. If the known production target cannot be determined, validation
   approval is blocked.
5. Comparisons may inspect values in memory but log only masked project
   references; they never log URLs or secret values.
6. Service-role credentials are read only in server/test harness code and are
   never returned to a client.
7. A suspected production URL or project reference causes a non-zero exit
   before a DB connection.
8. Cleanup is disabled unless an explicit approved flag is supplied.

## Provider Boundary

Initial validation uses a fake Provider only. A LIVE-DB harness must explicitly
inject its Provider dependency into `executeApprovedProductRuntime()`; a missing
Provider dependency fails before any Runtime function is called. A default or
production Provider fallback is forbidden.

At process start, the harness checks only whether `OPENAI_API_KEY` is present.
Unless a separate real-Provider gate is approved, its presence is a fail-closed
condition: the harness must not read its value, use it, or print it. Real OpenAI
validation is a separate approval gate and is not implied by this contract.

Permitted future fake implementations are dependency injection of a
deterministic fake, a controlled test Provider, or a direct Runtime/repository
harness that never constructs a live Provider. Any detected OpenAI Adapter
import or fallback-path use is a `P0` stop condition.

## Harness Design

### Phase 1 — Repository-direct harness

A local integration harness may call repositories/RPC clients directly. It
does not require Next.js request context and therefore cannot prove a Server
Action authentication boundary. It is the recommended first implementation.

### Phase 2 — Next.js test-only integration harness

A test-only route or integration harness may validate cookie/JWT and server
boundaries only after separate approval. If a route is used, it must be:

- disabled in production;
- protected by the target guard and a dedicated authenticated test user;
- unable to return a service-role key, raw SQL error, secret, prompt, output,
  SDK payload, or stack trace; and
- removed after the Sprint unless a later approved scope retains it.

## Evidence Contract

Allowed validation evidence is limited to test ID, actor class, expected and
actual safe result, safe error code, state transition, row counts, timestamp,
and a masked checksum/project reference. Fake-Provider executions must also
record these safe fields:

```text
providerMode: FAKE
providerAdapterIdentity: buildflow.live-db-validation.fake-provider.v1
externalProviderCallCount: 0
```

The harness fails if `providerMode` is not `FAKE`, the adapter identity differs,
or `externalProviderCallCount` is not zero. Prohibited evidence includes JWTs,
keys, database credentials, raw SQL errors, Provider/MCP payloads, prompts,
outputs, and stack traces.

## Cleanup Contract

Future data uses the `live-db-validation-001-*` prefix. Before/after records
must list test users/projects and approval/event/evidence counts. Disposal of a
staging project, revocation of validation secrets, and destructive cleanup each
require a separate explicit approval. No cleanup touches non-prefixed data.
