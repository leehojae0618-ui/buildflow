# CAPABILITY-002 Report

## Status

**IMPLEMENTATION AND LIVE EVIDENCE COMPLETE — PM/CTO REVIEW REQUIRED**

## Result

BuildFlow now has two explicit, deterministic application Blueprints:

1. `ai-inquiry-v1`
2. `general-crud-v1`

The Product does not claim unrestricted natural-language SaaS generation.
Unsupported or ambiguous goals are blocked before Provider provisioning.

## Application Capability Model

- `AUTH`
- `USER_SCOPED_CRUD`
- `SEARCH`
- `STATUS_WORKFLOW`
- `ADMIN_READ`
- `RESPONSIVE_UI`

The selected Capability set is stored in the Requirement Snapshot and drives
Architecture, required Credentials, generated Artifacts, Schema expectations,
and functional Verification.

## General CRUD Blueprint

The Task Manager instance includes:

- Supabase email signup and password login
- user-owned Todo create, read, update, and delete
- title search and status filter
- `pending`, `in_progress`, and `completed` workflow
- read-only administrator view
- responsive desktop and mobile UI
- Health endpoint
- idempotent Schema, grants, indexes, trigger, and RLS Policies

Supabase Auth email signup is configured with automatic confirmation in this v1
Blueprint. Email ownership verification and custom SMTP are not claimed and are
tracked separately.

## Provider Reuse

The existing GitHub, Supabase, and Vercel Adapters were reused.

Credential reuse does not copy a Vault reference or expose plaintext to the
application. A service-role-only owner-checked RPC creates a separate encrypted
Vault Secret for the target Project and returns only the copied count.

## Live TEST B Evidence

### BuildFlow

- Project: `8e42f7c9-e002-44e6-adc8-72402c6b72f6`
- Autonomous Session: `81f5f1fb-fffb-44c5-9274-e2c3440cc1e6`
- Build Execution: `719ca471-9dba-4f04-9d76-a2234a836c99`
- Deployment Session: `f40415e3-9461-41fa-a73b-274018dd909e`
- Session result: `READY_WITH_WARNINGS`
- Verification final status: `READY`

`READY_WITH_WARNINGS` remains intentional because backup and long-term
monitoring are not verified.

### GitHub

- Private Repository:
  `https://github.com/leehojae0618-ui/live-evidence-task-manager-8e42f7c9`
- Visibility: Private
- Default branch: `main`
- Source files: 11
- Includes Auth/CRUD page, administrator page, Health route, Supabase client,
  configuration, and documentation

### Supabase

- Disposable Project Ref: `lefxalmlkamlwthrpehc`
- `buildflow_todos`: exists, RLS enabled
- `buildflow_admins`: exists, RLS enabled
- Policies:
  - user/admin read
  - owner insert
  - owner update
  - owner delete
  - administrator membership read
- Verification-created Todo rows remaining after cleanup: 0

### Vercel

- Project: `prj_w68hlfgAnhtAenBHrzGb66QmJm9h`
- Deployment: `dpl_mJGwZJEbLgCHgciiNHmAWjuDwe6w`
- URL:
  `https://live-evidence-ta[REDACTED_OPENAI_KEY].vercel.app`
- Home: HTTP 200
- Administrator page: HTTP 200
- Health: HTTP 200, `general-crud-v1`

### Functional Verification

- public signup request: PASS
- confirmed test-user creation: PASS
- password login for User A and User B: PASS
- User A Todo create: PASS
- User B direct read before admin grant: BLOCKED as required
- User A search and status filter: PASS
- User A title and status update: PASS
- User B administrator read after explicit grant: PASS
- User A delete: PASS
- temporary users, administrator grant, and Todo cleanup: PASS

Persisted Vercel Verification capabilities:

- `deployment_ready`
- `health_check`
- `auth_signup`
- `auth_login`
- `user_scoped_crud`
- `search`
- `status_workflow`
- `admin_read`
- `cross_user_rls`

## Ownership and Security

- another authenticated BuildFlow user Project read: 0 rows
- Session read: 0 rows
- Verification read: 0 rows
- forged Project update: 0 rows
- Secret value in Command, Result, Snapshot, Event, or Report: none
- temporary local Evidence route: removed

## Idempotency

After READY, the same Session was invoked again.

- command count: unchanged at 8
- Repository create attempt: unchanged at 1
- Source upload attempt: unchanged at 1
- Schema application attempt: unchanged at 1
- Vercel Project create attempt: unchanged at 1
- Deployment create attempt: unchanged at 1
- Verification Run count: unchanged at 1
- Session and Deployment identifiers: unchanged

The deployment-status attempt count is 4 because it includes Provider polling,
the initial Auth failure, and the successful recovery.

## Recovery Finding

The first functional run failed at public signup because Supabase's default SMTP
refuses delivery to non-team addresses. The Blueprint now uses the official
Management API to enable email signup with automatic confirmation under the
approved disposable Project scope. The same Session resumed from `RECOVERING`
and completed without recreating successful resources.

## Fatigue Metrics

- user input count: 1
- approval count: 1
- user interruption count: 0
- automatic step count: 8
- retry count: 3
- elapsed time: 230 seconds
- waiting for user: 0 seconds
- automation percentage: 89%

## MVP Impact

BuildFlow expands from one representative AI inquiry application to a second
explicit application class with real Auth, user-owned data, workflow, admin
read, deployment, and end-to-end Verification. A quantified product impact is
not recorded because no agreed adoption baseline exists.

## Quality Gates

- Tests: PASS — 37 files, 163 tests
- Lint: PASS
- Typecheck: PASS
- Production build: PASS
- `git diff --check`: PASS
- Linked Supabase DB lint: PASS — no schema errors
- Local/remote Migration alignment: PASS through `20260718001200`
- Database Types: regenerated
- Secret tracked-source scan: PASS
- `.env.local`: ignored and untracked
- Temporary Evidence route: removed and absent from the production build

## Commit

Not created. Push not performed.
