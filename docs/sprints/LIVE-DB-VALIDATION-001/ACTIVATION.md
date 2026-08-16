# LIVE-DB-VALIDATION-001 — ST-B Activation Record (PREPARED, NOT ACTIVE)

## Status

```text
State: PREPARED / NOT ACTIVATED
ST-B R3 approval: NOT GRANTED
Activation time: (unset — filled in only at activation)
Activating authority: (unset — the user, at activation)
DB CONNECTION AUTHORITY: NONE
MIGRATION AUTHORITY: NONE
RPC / RLS EXECUTION AUTHORITY: NONE
TEST USER / PROJECT CREATION AUTHORITY: NONE
PUSH / DEPLOY AUTHORITY: NONE
```

This document does not activate ST-B and grants no authority. `DEVELOPMENT_CHARTER.md`
§11a requires an Activation Record in the Sprint directory for every
`READY → ACTIVE` transition on R3 work; this file exists so that requirement is
already satisfied in form when the user grants ST-B R3, and so the boundary it
records is fixed in advance rather than written in the moment. Until the two
unset fields above are filled in by the user, ST-B remains `NOT APPROVED` in
`STAGING_VALIDATION_PLAN.md`'s Approval Gates table, which stays authoritative.

## Frozen Scope at activation

ST-B, narrow first pass, as fixed by `STAGING_VALIDATION_PLAN.md`:

```text
ENV-STG-01  staging target guard
MIG-01      migration apply + schema object verification
APR-01..04  approval lifecycle, events, binding mismatch
RLS-01..03  owner / other authenticated / anon
```

`CON-01` (concurrent consume) and `EVD-01` (Fake-Provider Product Runtime E2E)
are ST-C and are not authorized by this record. Cleanup is ST-D. Disposal of the
staging project is its own explicit approval and is never implied by ST-B
completion.

## Authorized implementation boundary at activation

```text
npm run live-db:execute:staging
```

That command is the only authorized execution path. It requires two switches,
both of which are blank in the repository and are set by the user immediately
before the run and returned to blank afterward:

```text
LIVE_DB_EXECUTION_CONFIRMED=true
LIVE_DB_ST_B_EXECUTE=true
```

With either unset the entrypoint skips and no connection is opened.

Credentials come only from the gitignored `.env.live-db.staging`.
`staging-env-file.ts` reads that file for every LIVE_DB value and never falls
back to `process.env` for one, so `.env.local` cannot supply a credential or a
target. `.env.local` is not modified.

## Preconditions the user must satisfy before running

These are prerequisites of the gate, not steps the harness performs.

1. **Disposable staging project** created by the user, with
   `.env.live-db.staging` populated. `LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF` must
   name the real production project; if it is blank the guard fails closed.
2. **Owner user** in `auth.users`, and a **`public.projects` row owned by that
   user**. `create_runtime_approval_request` raises
   `RUNTIME_APPROVAL_NOT_AUTHORIZED` unless
   `projects.user_id = approval.requester_user_id`, so APR-01 fails immediately
   without it. Supply both ids as `LIVE_DB_OWNER_USER_ID` and
   `LIVE_DB_OWNER_PROJECT_ID`.
3. **A second authenticated user** for RLS-02, distinct from the owner. Supply
   `LIVE_DB_OWNER_EMAIL` / `LIVE_DB_OWNER_PASSWORD` and `LIVE_DB_OTHER_EMAIL` /
   `LIVE_DB_OTHER_PASSWORD`; the harness signs in with them and never creates a
   user.
4. **Time budget.** The expiry case cannot be shortened: the TTL is server-set
   at 15 minutes and `reject_runtime_approval_request_mutation` refuses any
   update to `expires_at`, so not even service-role SQL can backdate a fixture.
   The run creates the expiry fixture first, executes everything else while the
   TTL runs down, then waits out the remainder. Budget roughly 20 minutes.

## Explicit restrictions in force during ST-B

```text
No production target. The guard rejects a LIVE_DB URL equal to
NEXT_PUBLIC_SUPABASE_URL and a project ref equal to the known production ref,
and fails closed when the production ref is unknown.

No linked-project state. Migration passes --db-url explicitly; --linked,
--project-ref, -p, --workdir and any supabase/.temp path are rejected in both
the built and the resolved argv.

No application client. The composition root builds the LIVE_DB clients and the
approval repository itself from the guarded environment; there is no injection
point through which an application or admin client could arrive.

No external Provider. OPENAI_API_KEY presence is a fail-closed stop, detected
from the process as well as the file. ST-B invokes no Provider at all.

No Runtime Evidence writes. ST-B asserts the runtime_evidence_records count is
zero; writing Evidence is ST-C.

No cleanup. ST-B deletes nothing. Rows it creates carry the
live-db-validation-001-* prefix and are ST-D's responsibility.

No Push, Merge, Release, or Deploy.
```

## Stop conditions

Any of these halts ST-B where it stands, without retry:

```text
production or known-production ref match
secret, JWT, or raw database error that would reach Evidence
migration failure or a partial object set (MIG-01)
RLS access violation (P0 — also blocks ST-C and ST-D)
approval event count that does not match the matrix
non-zero Runtime Evidence count
network failure or staging project unreachability
```

A blocked run still produces Evidence: the summary is built on every exit path,
and if it would contain anything unsafe it is replaced by a redacted one and the
run is blocked on that ground alone.

## Evidence produced

`npm run live-db:execute:staging` prints the safe summary for the ST-E audit. It
records the masked staging ref, per-case expected and actual safe results, safe
error codes, the migration count, `secretExposureDetected`, and the four client
-identity fields `CONTRACT.md` requires. It is scanned for unsafe values before
it is returned.

## Known limitation carried into ST-B

MIG-01 verifies tables and RPCs structurally and the immutable-binding trigger
behaviourally. **Row-level policies are not read from the catalog**: they live in
`pg_catalog`, which PostgREST does not expose, and this harness has no Postgres
driver. Policy correctness is therefore proven by RLS-01 through RLS-03 behaving
as required, not by inspecting `pg_policies`. Evidence should be read with that
distinction in mind, and closing it would need either a driver dependency or a
CLI query path — neither of which is in ST-B's scope.
