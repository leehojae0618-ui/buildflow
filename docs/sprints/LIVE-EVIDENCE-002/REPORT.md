# LIVE-EVIDENCE-002 Evidence Report

## Status

**PASS — TEST A APPROVED AND TEST B LIVE BUILD VERIFIED**

## TEST A

| Stage | Status | Evidence |
|---|---|---|
| Goal | PASS | AI inquiry classification and Korean response-draft service |
| Requirement | PASS | Persisted in the BuildFlow Project |
| Clarification | PASS | Existing Requirement snapshot used |
| Architecture | PASS | Existing candidate engine |
| Candidate selection | PASS | `candidate-balanced` |
| Build Plan | PASS | 7 persisted Tasks |
| Project | PASS | `d10bcbd6-b588-4c36-87ee-7881538e0218` |
| Autonomous Session | PASS | `ccdc7474-01a4-49d7-9719-cb8532b6a6a7` |
| GitHub Vault Credential | PASS | Reference `599453c2-534b-420a-89f1-9a911b389310`, status `PROVIDED`, owner metadata `leehojae0618-ui`, version 3 |
| GitHub Provider validation | SKIPPED | Provider commands begin only after the complete Credential bundle, Consent, and Approval |
| Disposable Supabase Vault Credential | PASS | Reference `48d990be-54a3-4732-9740-2de6f7ae42dc`, status `PROVIDED`, Project Ref `lefxalmlkamlwthrpehc` |
| Supabase target isolation | PASS | Target is neither PIVUE nor the BuildFlow application database |
| Supabase Provider validation | SKIPPED | Provider commands begin only after the complete Credential bundle, Consent, and Approval |
| Vercel Vault persistence | PASS | Reference `cbb09e7f-301a-4bb0-a9a8-da9497885cb7`, status `PROVIDED` |
| Vercel Vault Credential | PASS | Reference `cbb09e7f-301a-4bb0-a9a8-da9497885cb7`, version 3 |
| Vercel identity validation | PASS | Actual API identity request returned HTTP 200 for `leehojae0618-ui` |
| Vercel scope validation | PASS | Actual scoped Project-list request returned HTTP 200 |
| Vercel persisted status | PASS | Updated to `VALID` after live API evidence |
| OpenAI Vault Credential | PASS | Reference `f76619ae-345a-4271-a0b0-b68e3177729c`, version 1 |
| OpenAI actual response | PASS | `gpt-5-mini-2025-08-07`, status `completed`, expected output received in 3.7 seconds |
| GitHub actual identity | PASS | HTTP 200 for `leehojae0618-ui` |
| Disposable Supabase actual Project | PASS | HTTP 200, `buildflow-test-a`, `ACTIVE_HEALTHY` |
| Credential Gate | PASS | Four Provider references are persisted as `VALID` |
| Consent | PASS | Explicit user direction persisted on the existing Session |
| Approval | PASS | Existing scope `approval-plan-v2-live-build`; Private Repository, disposable Schema/RLS, public Vercel production deployment |
| Private GitHub Repository | PASS | `https://github.com/leehojae0618-ui/live-evidence-ai-d10bcbd6` |
| GitHub visibility | PASS | Actual API reported `private: true` |
| Source upload | PASS | 10 files on `main`, including Next.js UI, health route, inquiry route, README, and configuration |
| Supabase Schema | PASS | `buildflow_inquiries` exists in `buildflow-test-a` |
| Supabase RLS | PASS | RLS enabled |
| Supabase Policy | PASS | `No direct client access`, `using false`, `with check false` |
| Stored inquiry evidence | PASS | Actual row count `2` after functional tests |
| Auth | FAILED SCOPE | Existing generated v1 service does not implement end-user signup/login |
| Administrator inquiry view | FAILED SCOPE | Existing generated v1 service has no admin page |
| Vercel Project | PASS | `prj_t2VynGpq3ugWJhPSJntDFkVoPfcr` |
| Vercel Deployment | PASS | `dpl_gk8ohLr51obZ8V8FSKihVNuN8qio`, production, `READY` |
| Vercel URL | PASS | `https://live-evidence-ai-d10bcbd6-2bd9kilz8-leehojae0618-uis-projects.vercel.app` |
| Public accessibility | PASS | Vercel Authentication disabled through approved public-deployment scope |
| Web page | PASS | HTTP 200; service title and AI request UI rendered |
| Health Check | PASS | HTTP 200, `{"status":"ready"}` |
| AI inquiry | PASS | HTTP 200; actual Korean classification and response draft returned |
| Verification persistence | PASS | Run `69434fe7-01ed-4161-b5e7-0c578669ee11` |
| Verification result | PASS | GitHub, Supabase, Vercel, OpenAI all `VERIFIED`; final status `READY` |
| Session result | PASS WITH WARNINGS | `READY_WITH_WARNINGS`; backup and long-term monitoring remain unknown |
| Build Execution | PASS | `a897f216-b2c8-4fb1-98ee-ec42552d909b`, `SUCCEEDED` |
| Idempotent re-run | PASS | Command attempts, Verification count, Session count, and Deployment count did not change |
| Cross-user ownership | PASS | Other authenticated user saw zero Project, Session, and Verification rows and could not forge state |

### Actual Source Files

- `.gitignore`
- `README.md`
- `app/api/health/route.ts`
- `app/api/inquiries/route.ts`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `next.config.ts`
- `package.json`
- `tsconfig.json`

### Recovery Findings

1. Project Detail did not pass the persisted Autonomous Session to the client.
   Server-rendered Session restoration was added.
2. A Korean Project title produced a Provider-invalid Repository slug. Slug
   generation now emits Provider-safe ASCII.
3. Vercel team defaults enabled Deployment Protection, returning 302/401 for
   Health and functional tests. The approved public deployment path now sets
   `ssoProtection: null`.
4. Atomic Verification persistence accepted browser-user auth only. A
   service-role-only owner-checked RPC was added for the autonomous Worker.

No failed Provider response body or Secret value was persisted.

### Fatigue Metrics

- user input count: 6
- approval count: 1
- user interruption count: 3
- automatic step count: 7
- retry count: 3
- elapsed time: 4,635 seconds
- waiting for user: 4,171 seconds
- automation percentage: 54%

## TEST B

**PASS THROUGH CAPABILITY-002**

- Project: `8e42f7c9-e002-44e6-adc8-72402c6b72f6`
- Session: `81f5f1fb-fffb-44c5-9274-e2c3440cc1e6`
- Private Repository:
  `https://github.com/leehojae0618-ui/live-evidence-task-manager-8e42f7c9`
- Supabase Auth: signup and password login PASS
- Schema: `buildflow_todos`, `buildflow_admins`
- RLS and five ownership/admin Policies: PASS
- CRUD, search, status change, admin read: PASS
- Cross-user Todo access before admin grant: BLOCKED
- Vercel:
  `https://live-evidence-ta[REDACTED_OPENAI_KEY].vercel.app`
- Home, administrator page, and Health: HTTP 200
- Verification Run: `282f67b2-3723-4454-91c9-cc4266af9c5e`
- Verification final status: `READY`
- Session result: `READY_WITH_WARNINGS`
- Idempotent re-run: PASS
- Cross-user BuildFlow ownership: PASS

Full implementation and Evidence details are recorded in
`docs/sprints/CAPABILITY-002/REPORT.md`.

## Secret Safety

- No Secret value was printed or persisted in this report.
- Vercel CLI login is not treated as BuildFlow Vault evidence.
- No Mock success, Placeholder READY, or Provider response fabrication was used.
- `.env.local` remains untracked.

## Final Decision

- TEST A representative AI inquiry Blueprint v1: **PASS / PM APPROVED**
- TEST B General CRUD Blueprint v1: **PASS**
- LIVE-EVIDENCE-002 overall: **PASS / PM REVIEW REQUIRED**

## User Requests During the Run

Only the currently required item was requested at each step:

1. GitHub Vault Credential
2. disposable Supabase Vault Credential
3. Vercel Vault Credential and scope correction
4. quota-enabled OpenAI Vault Credential
5. No additional TEST B Credential input; encrypted GitHub, Supabase, and
   Vercel Credentials were reused through the owner-checked Vault clone path

No Domain, Logo, OAuth customization, or unrelated input was requested.

## UX Improvements Identified

- Persisted Session must always render server-side; client-only recovery can
  hide the only continuation action.
- Optional Vercel Team ID needs inline guidance distinguishing account labels,
  slugs, and API Team IDs.
- The Product must disclose the exact generated feature set before Approval.
- Unsupported feature requirements must block before Provider provisioning.
- Production URL protection state must be included in Approval and Verification.

## Quality Gates

- Tests: PASS — 37 files, 163 tests
- Lint: PASS
- Typecheck: PASS
- Build: PASS
- `git diff --check`: PASS
- Linked Supabase DB lint: PASS — no schema errors
- Local/remote Migration alignment: PASS through `20260718001200`
- Database Types: regenerated
- Secret pattern scan: PASS — no tracked source match
- `.env.local`: ignored and untracked
- Temporary internal Evidence routes: removed

## Commit

Not created. Push not performed.
