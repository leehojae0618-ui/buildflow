# LIVE-DB-VALIDATION-001 Plan

## Sprint Identity

- Sprint: `LIVE-DB-VALIDATION-001`
- Status: `PLANNING / NOT EXECUTION APPROVED`
- Baseline: `3ffb62b51798e9aa5eab3d56a90b87f724bc4b0d`
- Purpose: Runtime Approval과 Product Runtime Bridge의 실제 Supabase 검증을
  **안전하게 설계**한다. 이 문서는 DB 실행 권한을 부여하지 않는다.

## Goals

다음 미검증 경계를 실제 환경에서 검증할 향후 실행 계획을 고정한다.

1. Runtime Approval migration 및 RPC의 실제 동작
2. RLS와 서버 전용 service-role 경계
3. 동일 Approval의 concurrent consume 원자성
4. 승인 소비 후 Product Runtime Bridge와 Runtime Evidence의 E2E 연결

## Current Validation Gaps

| Gate | Current state | Required environment |
| --- | --- | --- |
| Migration | `NOT VERIFIED` | Local 또는 disposable staging Supabase |
| Approval RPC | `NOT VERIFIED` | Local 또는 disposable staging Supabase |
| RLS | `NOT VERIFIED` | Local 또는 disposable staging Supabase with test identities |
| Concurrent consume | `NOT VERIFIED` | Local 또는 disposable staging Supabase with parallel harness |
| Product Runtime E2E | `NOT PERFORMED` | Local first; staging for authenticated server boundary |
| Real Provider / production | Out of scope | Separate explicit gate |

## Environment Priority

1. **Supabase Local** — migration, schema, RPC, RLS, concurrent consume, fake
   Provider 기반 DB E2E의 기본 검증 환경이다.
2. **Disposable Supabase Staging Project** — 실제 hosted Postgres, JWT/auth,
   Next.js server boundary를 확인하는 한시적 환경이다.
3. **Production** — 이 Sprint에서는 금지한다. migration, RPC, test data,
   Provider 호출, deployment를 수행하지 않는다.

| Environment | Safety | Cost | Fidelity | Recommendation |
| --- | --- | --- | --- | --- |
| Supabase Local | High | Low | Medium | Phase 1 required |
| Disposable staging | High when isolated | Low to medium | High | Phase 2 only after approval |
| Production | Low for validation work | Potentially high | Highest | Forbidden |

## Planned Validation Gates

| Gate | Activity | Separate approval required |
| --- | --- | --- |
| 0 | Planning documents and harness design | Complete with this Sprint phase |
| 1 | Harness code and focused review | Yes |
| 2 | Local execution authority and tool setup | Yes |
| 3 | Local migration, RPC, and RLS tests | Yes |
| 4 | Local concurrent-consume test | Yes |
| 5 | Local fake-Provider Product Runtime E2E | Yes |
| 6 | Local evidence and test-data cleanup | Yes |
| 7 | Claude independent audit of local results | Yes |
| 8 | User approval for disposable staging execution | Yes |
| 9 | Disposable staging migration, RPC, RLS, and fake-Provider validation | Yes |
| 10 | Production-target comparison and staging cleanup | Yes |
| 11 | Final independent audit and closeout | Yes |

Any failed gate stops progression. It does not implicitly authorize the next
gate, a retry, production validation, or a real Provider request.

## Proposed Validation Matrix

| Area | Expected result | Evidence to retain |
| --- | --- | --- |
| Migration | Objects apply once in an isolated target | migration version, safe object inventory |
| RPC state transitions | create/decide/consume returns only defined safe outcomes | test ID, safe code, state transition |
| Binding | project/user/plan/request/provider/model/input mismatch is rejected | masked checksum, safe rejection code |
| RLS | owner allowed; other authenticated user and anonymous user blocked; service role server-only | actor class, expected/actual allow or deny |
| Concurrent consume | exactly one request consumes one approval | attempt count, terminal outcomes, row counts |
| Runtime bridge | one consumed approval produces one bounded fake-runtime result | execution ID, evidence reference IDs, safe result status |
| Replay | reused approval cannot invoke Runtime or append duplicate Evidence | terminal code, evidence row delta |

## Stop Conditions

- Any target resolves to production or a known production project reference.
- A secret, JWT, raw SQL error, raw Provider payload, prompt, output, or stack
  trace would be emitted in a harness log.
- An RLS expectation cannot be run with distinct identities.
- **Migration failure or incomplete migration:** if migration application fails
  or a partial object set is detected, stop immediately. Do not advance a
  Gate, rerun, issue manual SQL, or clean up without separate approval. Record
  only the failed target, created-object inventory, and migration-history state
  without secrets.
- **RLS mismatch:** if an owner-external actor can read or change another
  user's row/event, or an anonymous/authenticated actor can perform an
  unauthorized RPC or direct write, stop immediately and classify it as a
  `P0` security finding. Concurrent consume, Product Runtime E2E, and staging
  progression are prohibited. This condition is distinct from being unable to
  perform a distinct-identity test at all.
- Concurrent consume yields more than one successful consume, Provider handoff,
  or Runtime Evidence append for one approval.
- The requested action requires a migration, external connection, or Provider
  call that has not received the matching gate approval.

## Rollback and Cleanup Plan

Each future execution uses the prefix `live-db-validation-001-*` for data and
records a before/after inventory of test users, projects, approvals, events,
and Runtime Evidence. Local environments are discarded by their local tooling;
disposable staging is deleted only after explicit approval. No destructive
cleanup runs without an explicit cleanup flag and approval.

## MVP Impact

This is a safety and validation plan, not a user-visible feature. It defines
the missing proof path before Runtime Approval and Product Runtime can be
considered production-ready.

## Deferred Technical-Debt / Future Sprint Candidates

- Retrospective `RUNTIME-APPROVAL-FOUNDATION-001` task/plan documentation
  reconciliation is not part of this Sprint.
- Ownership-context deduplication is a future architecture review candidate.
- Supabase Local installation is a future execution-gate decision, not work
  authorized by this plan.
