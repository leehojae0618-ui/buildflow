# LIVE-DB-VALIDATION-001 Task

## Status

`PLANNING / NOT EXECUTION APPROVED`

## Objective

Create the official plan, safety contract, and operating-state record for
validating Runtime Approval and Product Runtime Integration against an isolated
Supabase environment. This task authorizes documentation only.

## In Scope

- Official LIVE-DB validation planning documents
- Repository-direct and Next.js test-only harness designs
- Local/staging/production separation rules
- Dedicated environment-variable naming and production guard requirements
- Validation matrix, evidence format, cleanup plan, stop conditions, and
  future approval gates
- Operational state that records this Sprint as planning-only

## Out of Scope

- Harness, test route, SQL, migration, or product-code implementation
- Supabase CLI installation, login, linking, project creation, database access,
  migration application, RPC invocation, or test-user creation
- Real Provider, MCP, or external API calls
- `.env` changes or secret creation
- Commit, push, merge, deploy, and remote cleanup

## Audit Finding Responses

| Finding | Planning response |
| --- | --- |
| P0-001: Live DB validation lacks an official plan | This Task, PLAN, and CONTRACT create the required official plan; execution remains blocked. |
| P1-001: Harness design absent | CONTRACT defines a phased repository-direct then test-only integration harness. |
| P1-002: Environment separation and production guard absent | CONTRACT reserves `LIVE_DB_*` variables and defines local/staging-only guards. |
| P1-003: Provider boundary must remain safe | Fake Provider only is planned; real OpenAI requires a separate gate. |

## Completion Criteria

- `PLAN.md`, `TASK.md`, and `CONTRACT.md` exist for this Sprint.
- The documents distinguish planning from execution and require approval for
  every external/DB gate.
- P0-001 and the three P1 planning responses are documented without claiming
  they have been live-validated.
- Operational documents state `PLANNING / NOT EXECUTION APPROVED`.
- Documentation-only validation passes with no code, test, migration, or
  environment file changed.

## Required Follow-up Gates

1. Claude plan re-audit
2. User approval for harness implementation
3. User approval for local execution
4. Separate approval for any disposable staging environment

## Prohibited Work

This task does not authorize any database connection, migration execution,
external service call, Provider call, MCP call, code/test implementation,
commit, push, or deployment.

## MVP Impact

Qualitative: this is a prerequisite safety plan for proving critical runtime
authorization and evidence persistence behavior. It changes no product
capability in the current phase.
