# STABILIZE-READY-001 Task

- [x] Required unverified or expired Provider cannot produce READY.
- [x] Restored Verification results are recomputed from effective target states.
- [x] Package installation returns `SETUP_REQUIRED`, never READY.
- [x] Client cannot submit `PROVISIONED`, `VERIFIED`, or failure/retry system events.
- [x] Credential-ready transition requires durable server evidence.
- [x] Provider Credentials are encrypted in Supabase Vault and resolved server-side.
- [x] GitHub, Supabase, Vercel, and OpenAI representative build path is implemented.
- [x] Provider Commands are durable, idempotent, bounded, and Secret-safe.
- [x] Health and functional tests persist Verification evidence before READY.
- [x] Session, Deployment, Provider Command, and Verification evidence is read-only to authenticated clients.
- [x] Pending Autonomous and Deployment migrations are applied remotely.
- [x] Execution Event insert ownership policy is applied.
- [x] Database types are regenerated from the linked schema.
- [x] Tests, lint, typecheck, build, and diff check pass.
- [x] Secret and `.env.local` tracking checks pass.
