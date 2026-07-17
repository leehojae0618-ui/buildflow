# Engineering Memory

## Repository

Working directory:

```text
/Users/hojelee/Documents/Codex/buildflow
```

## Stack

Confirmed from `package.json` and architecture docs:

- Next.js `16.2.10`
- React `19.2.4`
- TypeScript
- Supabase SSR / Supabase JS
- PostgreSQL via Supabase
- Supabase Auth and RLS
- OpenAI SDK
- Vitest
- ESLint
- Tailwind CSS

## Commands

Confirmed from `package.json`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
npm run db:types
npm run db:seed
```

Primary quality gate:

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

## Secret and Credential Rules

- Do not print, log, copy, or store secret values.
- `.env.local` must not be committed.
- Credential values must not appear in prompts, snapshots, events, reports, or
  tests.
- Use Credential References, not raw Credential values.
- Use minimum permission and explicit approval boundaries.
- Service Role must not be used in browser code.

## Tool / MCP Execution Rules

- LLM must not directly execute arbitrary Tool names or commands.
- Tool Resolver chooses candidates by contract and capability.
- Approval must precede external writes, cost-incurring actions, public changes,
  destructive operations, or permission changes.
- MCP Registry registration does not grant execution permission.
- Actual MCP Tool Invocation is not implemented and must not be assumed.

## Runtime / MCP / Credential / Cost Engineering Rules

Runtime and evidence contracts must remain:

- deterministic;
- reference-first;
- secret-safe;
- immutable once recorded;
- checksum-bound;
- source-bound;
- idempotent where applicable;
- explicit about retry and cancellation evidence.

Do not duplicate full payloads in evidence or runtime contracts. Use references
and checksums instead.

Provider and MCP rules:

- Provider invocation and MCP invocation are separate contracts.
- Provider evidence must not imply MCP success.
- MCP invocation success must not imply overall Agent success.
- MCP Tool Definition Snapshots must include checksum, risk, read/write state,
  external state mutation state, required Capability, and approval requirement.
- MCP raw request/response bodies, Provider raw request/response bodies, raw
  logs, stack traces, headers, cookies, tokens, and Credential values must not
  be stored in evidence.

Credential rules:

- OAuth tokens and API Keys are excluded from Evidence, Runtime payloads,
  Package artifacts, logs, tests, and UI state.
- Runtime receives Credential References only.
- Connection tests must prefer non-mutating checks.
- Connection status must not become `CONNECTED` until a safe validation succeeds.

Runtime step rules:

- Runtime Step Evidence records user-understandable work steps.
- Do not store private chain-of-thought.
- Retry attempts require new execution or invocation identifiers.
- Approval should be revalidated per execution attempt where policy requires.
- Revocation/cancellation requires explicit evidence; do not infer results.

Cost rules:

- Estimated cost and actual billed cost are separate.
- Cost calculation basis must include usage frequency assumptions.
- Store price table date/source reference or version when available.
- Missing cost data must be reported to the user; it must not silently change
  Runtime status.
- Cost Simulation Engine is not implemented unless explicitly approved.

## Change Control

- Do not implement outside the active approved Sprint.
- Commit only after explicit Commit Approval.
- Push only after explicit Push Approval.
- Deploy only after explicit deploy instruction.
- Existing uncommitted user changes must not be overwritten or reverted.
- Destructive migrations require explicit approval.

## Implementation Status Labels

Use these labels in memory and reports:

- `IMPLEMENTED`: code and/or evidence exists.
- `PARTIAL`: bounded implementation or contract exists, but full product
  capability is incomplete.
- `PLANNED`: approved or roadmap direction, not implemented.
- `FUTURE`: later direction, not active.
- `DRAFT`: candidate document only.
- `NOT APPROVED`: not authorized for implementation.

## Current Known Caveat

`.buildflow/STATUS.md` currently records `Latest Known Commit: be12055`, while
actual Git HEAD after the latest pushed draft scope commit is `de62266`.

Do not silently rewrite operational history; update this only during an approved
status/sprint transition.
