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
