# BuildFlow Project State

## 1. Document Purpose

이 문서는 BuildFlow 저장소의 현재 상태를 작업 시작 전에 빠르게 확인하기
위한 공식 요약 문서다. GPT, Claude, Codex는 작업 전 이 문서와 Git 상태,
`.buildflow/` 운영 문서를 함께 확인한다.

이 문서는 코드·Git 이력·승인된 Sprint 계약보다 우선하지 않는다. 저장소의
관찰 가능한 상태를 요약하며, 충돌이 있으면 Git 상태와 해당 Sprint 문서를
우선 확인한다.

문서에 기록된 source baseline은 이 상태 기록을 작성할 때 사용한 provenance다.
현재 HEAD 또는 `origin/main`을 대신하지 않으며, 작업 시작 시 실제 Git 상태는
반드시 Git 명령으로 직접 재확인한다.

## 2. Repository State Record

- Repository: `leehojae0618-ui/buildflow`
- Default branch: `main`
- State record source baseline:
  `db3512f4485d060718c2b183a592270d506b5494`
- Source baseline verification: local HEAD and `origin/main` were synchronized
  at this baseline (`ahead 0 / behind 0`) when this state record was prepared.
- State record verified date: `2026-08-10`
- Current Git state: MUST be verified directly from Git at task start. This
  document does not guarantee that its source baseline is the current HEAD or
  `origin/main` after this document or later commits.
- Working tree: clean이 아니다. User-owned Visual Slice, MCP, Charter, memory,
  autonomous UI, and prior operational documentation changes are present.
  They are not implicitly authorized for a single Commit.

## 3. Product Definition

BuildFlow의 공식 제품 정의는 **Recipe-First Integration and Orchestration
Product**다. 사용자가 목표를 설명하면 BuildFlow가 기존 AI·자동화·업무 서비스를
engine-independent Recipe로 조합하고, 필요한 연결·구축·테스트·관리 계획을
제시한다.

비개발자 중심 사용자 흐름은 다음과 같다.

```text
Goal
→ Intent Understanding
→ Recipe Search and Ranking
→ Recipe Selection
→ Connection Plan
→ Approved Build / Install
→ Verification / Evidence
→ Health and Management
```

Requirement·Clarification·Capability·Approval·Evidence·Provider/Tool Adapter와
기존 Project·Workflow 기반은 재사용한다. BF0 및 Agent/Runtime-first UX는
Legacy / Not Primary Product Path로 보존한다. 승인되지 않은 외부 실행,
Marketplace 확장, 대규모 Multi-Agent·Billing·공개 API는 보류 또는 별도 승인
대상이다.

## 4. Current Architecture

- **Requirement / Clarification Engine**: 목표를 Requirement Snapshot으로
  구조화하고, Unknown·질문·Decision State·Snapshot Diff를 관리한다.
- **Blueprint / Agent Foundation**: Agent definition, validation, package profile,
  Runtime Plan을 위한 순수 계약과 생성·검증 기반이 있다.
- **Core Runtime**: OpenAI 단일 Provider, 단일 Step, 단일 Attempt의
  `executeMinimumRuntime()` 경계가 있다. Provider 성공만으로 Runtime 성공이
  되지 않으며, 안전한 Runtime Result와 Event를 조립한다.
- **Runtime Evidence**: append-only Repository 계약, In-memory Adapter,
  Supabase Adapter, checksum 및 reference-only Package Evidence projection이
  있다.
- **Human Approval**: Runtime 전용 Approval request/event, binding checksum,
  single-use consume 경계는 committed 상태다. 실제 DB RPC/RLS/concurrency
  검증은 아직 수행되지 않았다.
- **Policies**: Scope Freeze, Commit/Push/Deploy 승인 게이트, Contract-first,
  Evidence-first, Approval-first 원칙은 `DEVELOPMENT_CHARTER.md`와 `AGENTS.md`
  에 기록되어 있다.
- **OSS 책임 영역**: 외부 SDK·Provider·MCP·Queue·Monitoring 같은 기반 기술은
  도입 전 공식 SDK/OSS 조사와 명시적 승인을 요구한다. 외부 Provider SDK는
  service adapter 경계에 격리하는 방향이다.
- **Product/Core 경계**: Core Runtime은 Provider Port와 Evidence Sink에만
  의존한다. 인증·소유권·Supabase Repository 조합은 Product/server 계층의
  책임이다.

## 5. Current Development Status

### 완료된 committed foundation

- Clarification Interaction
- Minimum Core Runtime 및 OpenAI smoke validation
- MCP readiness/safety contract remediation
- Agent Foundation documentation closeout
- Runtime Evidence persistence 및 Package Evidence reference-only projection

### committed Runtime integration

- `RUNTIME-APPROVAL-FOUNDATION-001`과
  `PRODUCT-RUNTIME-INTEGRATION-001`의 server-only Approval/Product Runtime
  Bridge 구현은 `a101b9f`에 포함됐다.
- `RUNTIME-SAFETY-CORRECTION-001`은 예외 경계, checksum canonicalization,
  binding tamper 방어, rejected approval 처리, action 안전성 테스트를 보완했고
  독립 감사 및 GPT GitHub Commit Review를 통과했다.
- `REPOSITORY-DIRECT-HARNESS-001`은 Local DB 실행 전의 dry guard, 명시적
  LIVE_DB client 주입 경계, Fake Provider, 안전한 validation evidence 및
  결정적 테스트를 `b4eb63f`에서 추가했다. 실제 DB 실행은 포함하지 않는다.

### Builder / No-Key verification capability

- `LV5-NO-KEY-REMEDIATION-001`: CLOSED / COMPLETE. IMPLEMENTED / VALIDATED /
  INDEPENDENT AUDIT PASS / PUSHED
  (`54bbc89529c735445b1ef68ea68195c317ea3877`); User Sprint Exit은
  APPROVED — 2026-08-10이다.
- Static n8n Import Readiness는 IMPLEMENTED다. Actual n8n Import는 NOT
  VERIFIED다.
- Browser QA, real Make Configuration, external execution은 NOT VERIFIED다.
- Evidence는 `USER_SUBMITTED`이며 직접적인 platform observation을 주장하지
  않는다. Production Ready: NO.

### 미구현 또는 제품 경로에 미연결인 범위

- Product UI에서 실제 Provider/외부 Runtime 실행을 시작하는 동선
- 공개 Product Runtime API Route
- 실제 DB 환경에서의 Runtime Approval RPC/RLS/concurrent consume 검증
- 실제 Product Runtime E2E 및 브라우저 실행 흐름
- MCP 실제 연결·Tool invocation·queue·retry·streaming

`PRODUCT-RUNTIME-VERTICAL-SLICE-001`의 controlled runtime 구현은
`609eb083`의 main에서 관찰된다. Controlled Runtime은 코드에 IMPLEMENTED 상태이며
외부 Provider 호출과 외부 서비스 작업은 NONE, Persistent DB Evidence는 NOT VERIFIED다.
이 관찰은 과거 구현 권한 provenance를 소급해 주장하지 않는다. Production Ready는 NO다.

`PRODUCT-RUNTIME-REAL-AI-SLICE-001`은 local checkpoint `e3d0f1f`에 기록됐고
Push는 NOT PERFORMED다. Browser QA와 Live Provider, DB, external service
evidence는 NOT VERIFIED다.

`RECIPE-FIRST-PRODUCT-RESET-001`은 local uncommitted change로 구현 중이며,
successor `RECIPE-FIRST-BUILD-PACKAGE-001`이 ACTIVE / LOCAL IMPLEMENTATION
ONLY다. BuildPackage, engine compatibility/recommendation, connection plan,
configuration plan, missing-information, test plan, and build preview UI를
포함한다. 실제 Provider/API/OAuth, engine 생성·실행, credential 저장, DB
migration, Commit, Push, Deploy는 NOT AUTHORIZED다.

### 검증 상태

각 committed Sprint의 검증 수치는 해당 Sprint Report와 Commit 이력에서
확인해야 한다. Runtime Approval/Product Runtime 구현은 로컬 테스트,
typecheck, lint, build 통과를 기록하지만 실제 Supabase DB/RPC/RLS 검증은
`NOT VERIFIED`다.

## 6. Current Sprint State

- Recipe-First Product Reset 및 Build Package는 local checkpoint `ebd0290`에
  구현되어 있으며 NOT PUSHED다.
- `FIRST-LIVE-RECIPE-E2E-001 / LIVE GATE A+B`는 CLOSED / COMPLETE / LIVE
  VERIFIED다. Pipedream development에서 Slack OAuth/account verification을
  완료했고, Product Owner가 승인한 corrective retry 1회가 `aiwork`
  `#새-채널` (`C0BQB1ACGFP`)에 실제 Slack 메시지를 전송했다. Slack API
  응답은 `ok: true`, timestamp는 `1786778717.560079`이며 write kill switch는
  OFF로 복구됐다.
- 현재 활성 implementation Sprint는 `LIVE-RECIPE-AI-NEWS-001`이다. 범위는
  local manual Recipe contract, fake adapter, real OpenAI News RSS adapter,
  Groq summary adapter, controlled Gate C1/C2 validation, 그리고 non-live
  guarded C3 safety remediation이다.
- Gate C1 live OpenAI News RSS fetch는 PASS다. `https://openai.com/news/rss.xml`
  에서 최근 항목 3개를 선택했고 Slack write는 `NOT_PERFORMED`로 유지됐다.
- Gate C2 live Groq call은 PASS다. Groq OpenAI-compatible API와
  `openai/gpt-oss-20b`로 요약 7줄이 생성됐고 Slack write는 `NOT_PERFORMED`로
  유지됐다. Mock validation과 typecheck/lint는 PASS다.
- Gate C3 external Slack side effect는 earlier approved retry에서 OBSERVED /
  SUCCEEDED다. 하지만 당시 harness는 guarded BuildFlow service를 통과하지
  않았으므로 guarded C3 execution은 NOT VERIFIED다. Manual Live Recipe E2E는
  PARTIAL / REMEDIATION REQUIRED이며, 새 live retry는 승인되지 않았다.
- Commit, Push, Deploy, additional Slack write, Scheduler, production Pipedream, DB
  migration, MCP invocation, additional news/API source는 허용되지 않는다.
- `BF0-UX-SIMPLIFICATION-001`은 `CLOSED / COMPLETE / USER SPRINT EXIT
  APPROVED`다. 최종 checkpoint는
  `84ac5e2da7c3642d322b69adaf76fe2186af7b63`이며 Push는 COMPLETE다. Codex
  Final Regression, Final Browser Gap Check, GPT PM/CTO Final Review는 PASS다.
  Claude Final Independent Audit은 `SKIPPED BY PRODUCT OWNER`다. Deploy는 NOT
  PERFORMED이고 Production Ready는 NO다.
- `BF0-PRODUCT-EXPERIENCE-001`은 `CLOSED / COMPLETE`다. User Sprint Exit은
  APPROVED이며, product checkpoint는 `15746f14d8c5e5adf75045b2d4d774ad12335549`,
  exit-record checkpoint는 `51011d66c3a3fea9ec7b2058592fbabfbdd4f78d`다.
  Deploy는 NOT PERFORMED다.
- `LIVE-DB-VALIDATION-001`은 `PAUSED / BLOCKED BY LOCAL ENVIRONMENT`다.
  8GB M1 host에서 반복된 Local Supabase healthcheck 실패로 Local DB 검증은
  현 상태에서 진행하지 않는다. 이 Sprint는 closed, completed, 또는 저장소
  구현 실패가 아니며, 원격 검증은 별도 승인이 필요한 미래 옵션이다.
- Planning Foundation은 `7a9d63a`에서 pushed 상태이며,
  `REPOSITORY-DIRECT-HARNESS-001`은 `b4eb63f`에서 구현·독립 감사·push까지
  완료됐다. 실제 DB 연결, migration, RPC/RLS, Provider 호출, staging, 및
  production 작업은 승인되지 않았다.
- `RUNTIME-SAFETY-CORRECTION-001`은 User Sprint Exit 승인 후
  `CLOSED / COMPLETE`다. 구현 Commit은 `a101b9f`, 종료 준비 Commit은
  `06fa299`, 최종 종료 Commit은 `3ffb62`이며 Deploy는 수행되지 않았다.
- `RUNTIME-APPROVAL-FOUNDATION-001`과
  `PRODUCT-RUNTIME-INTEGRATION-001` 구현은 `a101b9f`에 포함되고 독립 감사
  및 GPT GitHub Commit Review를 통과했다.
- `LV5-NO-KEY-REMEDIATION-001`은 CLOSED / COMPLETE다. 기술 lifecycle은
  IMPLEMENTED / VALIDATED / INDEPENDENT AUDIT PASS / PUSHED 상태이고 User
  Sprint Exit은 APPROVED — 2026-08-10이다. 이는 현재 활성 Sprint가 아니며,
  Browser QA, actual n8n Import, real Make Configuration, external execution은
  별도 NOT VERIFIED gate다. Deploy는 NOT PERFORMED이고 Production Ready는 NO다.
- Visual Slice: `BUILDFLOW-VISUAL-CLOSED-BETA-SLICE-001`은
  IMPLEMENTED / USER QA / WAITING FOR USER FEEDBACK 상태이며, implementation
  authority는 PAUSED — USER QA다.
- Open gates는 Visual Slice User QA, 별도 사용자 승인이 필요한 LIVE-DB 원격 또는
  대체 검증, local Real-AI checkpoint의 PM/CTO Commit Review,
  `LIVE-RECIPE-AI-NEWS-001`의 guarded C3 remediation 및 별도 live retry
  승인 gate다.

근거 문서:

- `.buildflow/CURRENT_TASK.md`
- `.buildflow/STATUS.md`
- `.buildflow/NEXT_TASK.md`
- `docs/sprints/RUNTIME-APPROVAL-FOUNDATION-001/REPORT.md`
- `docs/sprints/PRODUCT-RUNTIME-INTEGRATION-001/REPORT.md`

## 7. Recent Major Commits

| Area | Commit | Description |
|---|---|---|
| Development Charter | `1bab9d1d07b0bb0485c4bb0ff3e87d25f8d0f820` | `docs(project): establish official BuildFlow Development Charter` |
| Clarification Interaction | `f84e1ad13d047855711b5af51639b08b1e7c8221` | `feat(requirements): add clarification interaction` |
| Core Runtime | `6060a679d635a8048626d120b23bc347606ca9e8` | `feat(runtime): add minimal single-step core runtime` |
| MCP Readiness/Safety | `619b4802a36a4168a57b2f97269f9d86902a38c1` | `fix(mcp): harden readiness and safety contracts` |
| Agent Foundation closure | `fd3aff11a1cdfae8821835542d8e2cce9a8bfebb` | `docs(ops): close agent foundation sprint` |
| Runtime Evidence Persistence | `e8b8d600ed85637b01e0d790643fa1b74d428b46` | `feat(evidence): add runtime evidence persistence` |
| Runtime Safety Correction | `a101b9f293048f6399d65ba2b45e43e798c26faf` | `fix(runtime): harden approval execution safety` |
| Simulated Verification Loop | `ef3b798b7a87a0b8e9afb873c4c35fec26638e5c` | `feat(verification): add simulated remediation loop` |
| Make/n8n Preview Adapters | `13542a2af8dee21cf10df22398e88cb3418f2f6a` | `feat(builders): add Make and n8n preview adapters` |
| Guarded Builder Client Foundation | `0a286466b5f21771fc740b57ad8378d4599beabc` | `feat(builders): add guarded Make and n8n client foundation` |
| No-Key Execution Flow | `e52cb8294a25ce84da6a50ae5456d5e0820bd37b` | `feat(builders): add no-key execution flow` |
| No-Key Remediation Hardening | `54bbc89529c735445b1ef68ea68195c317ea3877` | `fix(builders): harden no-key remediation flow` |
| BF0 Product Experience entry | `15746f14d8c5e5adf75045b2d4d774ad12335549` | `feat(product): expose bf0 draft from home` |
| BF0 Product Experience exit | `51011d66c3a3fea9ec7b2058592fbabfbdd4f78d` | `docs(product): close bf0 product experience sprint` |
| BF0 UX Simplification | `84ac5e2da7c3642d322b69adaf76fe2186af7b63` | `feat(product): simplify bf0 guided build experience` |
| Guarded Real-AI Product Slice | `e3d0f1ff5d1f78cd6a73b60ae57b1abac3b57fe6` | Local checkpoint only; NOT PUSHED |

## 8. Known Issues and Technical Debt

확인 가능한 항목만 기록한다.

- `TD-010`, `TD-011`: 인증 브라우저·다중 사용자·실제 RLS 흐름의 Beta E2E
  Evidence가 불완전하다.
- `TD-014`: 장기 운영/backup/monitoring Evidence가 RC 운영 게이트로 남아
  있다.
- `TD-015`: Provider 진행 확인은 전용 queue worker가 아닌 Project UI 재진입에
  의존한다.
- Runtime Approval과 Product Runtime Bridge의 실제 DB RPC/RLS/concurrency
  검증은 `NOT VERIFIED`다. Production Ready로 해석하면 안 된다.

## 9. Current Priorities

### P0

- `RECIPE-FIRST-PRODUCT-RESET-001` is the active local-only implementation scope.
  Actual Provider, OAuth, execution engine, DB, Commit, Push, and Deploy remain
  separate gates.
- Visual Closed Beta Slice User QA, 그리고 별도 승인 범위의 LIVE-DB 대체
  검증만 open gate로 유지한다.

### P1

- BF0 Runtime Artifact Projection과 controlled no-network Slice는 별도 구현
  승인 뒤 검토. 실제 Product UI/API Provider 진입점은 이 후보의 범위 밖이다.
- `BUSINESS-PLAN-001`의 사실 기반 작업 계획 검토.

### P2

- Marketplace, Agent Store, Billing, 고급 Multi-Agent, 대규모 운영 기능의
  장기 검토.

## 10. Operating Workflow

1. GPT/Codex가 작업 전 GitHub 최신 상태와 working tree를 확인한다.
2. GPT가 계획 및 PM/CTO 검토를 수행한다.
3. 사용자가 Scope와 작업 권한을 승인한다.
4. Codex가 승인 범위에서 구현 및 문서 작성을 수행한다.
5. Codex가 Commit hash와 검증 결과를 제출한다.
6. Live E2E, Closed Beta/Release, P0/P1 security, substantial Core change에서만
   Claude가 독립 감사를 수행한다.
7. GPT가 최종 검토를 수행한다.
8. 사용자가 Sprint Exit를 승인한다.

## 11. Approval Policy

사용자 승인 없이 다음을 수행하지 않는다.

- 코드 수정
- 문서 수정
- 파일 생성 또는 삭제
- Commit
- Push
- Deploy
- Live external action

DB 연결·migration·외부 API·commit·push·deploy는 별도 사용자 승인이 필요하다.

## 12. Source Documents

- `README.md`
- `AGENTS.md`
- `.buildflow/CURRENT_TASK.md`
- `.buildflow/STATUS.md`
- `.buildflow/NEXT_TASK.md`
- `docs/project/MASTER_PRD.md`
- `docs/project/PROJECT_BIBLE.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/ROADMAP.md`
- `docs/project/TECH_DEBT.md`
- `docs/project/DEVELOPMENT_CHARTER.md`
- `docs/sprints/README.md`
- `docs/sprints/BUILDFLOW-CLARIFICATION-INTERACTION-001/CLOSEOUT.md`
- `docs/sprints/CORE-RUNTIME-002/CLOSEOUT.md`
- `docs/sprints/AGENT-FOUNDATION-001/CLOSEOUT.md`
- `docs/sprints/EVIDENCE-RUNTIME-INTEGRATION-001/REPORT.md`
- `docs/sprints/RUNTIME-APPROVAL-FOUNDATION-001/REPORT.md`
- `docs/sprints/PRODUCT-RUNTIME-INTEGRATION-001/REPORT.md`
- `docs/sprints/RUNTIME-SAFETY-CORRECTION-001/REPORT.md`
- `docs/audits/PROJECT-AUDIT-001.md`
- `docs/sprints/LIVE-DB-VALIDATION-001/PLAN.md`
- `docs/sprints/LIVE-DB-VALIDATION-001/TASK.md`
- `docs/sprints/LIVE-DB-VALIDATION-001/CONTRACT.md`
- `docs/sprints/LIVE-DB-VALIDATION-001/HARNESS_SCOPE.md`
- `docs/sprints/LIVE-DB-VALIDATION-001/LOCAL_VALIDATION_PLAN.md`
- Git commits `7a9d63a16b492b4453e59dcd324cd1b08cf93502` and
  `b4eb63fab005eb98381ae318c6c17be9c729fb9d`

## 13. Update Rules

- Sprint 종료 시 갱신한다.
- 활성 Sprint 변경 시 갱신한다.
- 핵심 아키텍처 변경 시 갱신한다.
- 배포 상태 변경 시 갱신한다.
- 문서 내용과 저장소가 충돌하면 저장소와 Git 상태를 우선 확인한다.
- `UNKNOWN`을 추측으로 채우지 않는다.
