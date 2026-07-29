# BuildFlow Project State

## 1. Document Purpose

이 문서는 BuildFlow 저장소의 현재 상태를 작업 시작 전에 빠르게 확인하기
위한 공식 요약 문서다. GPT, Claude, Codex는 작업 전 이 문서와 Git 상태,
`.buildflow/` 운영 문서를 함께 확인한다.

이 문서는 코드·Git 이력·승인된 Sprint 계약보다 우선하지 않는다. 저장소의
관찰 가능한 상태를 요약하며, 충돌이 있으면 Git 상태와 해당 Sprint 문서를
우선 확인한다.

## 2. Repository Snapshot

- Repository: `leehojae0618-ui/buildflow`
- Default branch: `main`
- Baseline commit: `7a9d63a16b492b4453e59dcd324cd1b08cf93502`
- Last verified date: `2026-07-28`
- `origin/main`: `7a9d63a16b492b4453e59dcd324cd1b08cf93502`
  (`ahead 0 / behind 0` at verification).
- Working tree: clean이 아니다. Visual Slice와 운영 문서 등 미커밋 변경이
  존재한다. Runtime Approval/Product Runtime/Safety 변경은 이 baseline에
  committed 상태다.

## 3. Product Definition

BuildFlow의 공식 제품 정의는 **AI Agent Factory**다. 사용자가 목표를
설명하면 BuildFlow가 필요한 정보를 확인하고, 실행 가능한 AI Agent를 설계·구축·
검증하여 사용할 수 있게 하며, Agent Package 공유를 지향한다.

비개발자 중심 사용자 흐름은 다음과 같다.

```text
Goal
→ Clarification
→ Agent / Blueprint design
→ Build Plan
→ Approval
→ Runtime / Provider / Tool execution
→ Evidence
→ Result
→ Agent use or sharing
```

현재 범위에는 Requirement·Clarification·Agent/Runtime/Evidence Foundation과
기존 Project·Workflow 기반이 포함된다. 범용 Web App Builder, 승인되지 않은
외부 실행, Marketplace 확장, 대규모 Multi-Agent·Billing·공개 API는 현재
명시적으로 보류 또는 별도 승인 대상이다.

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

### 미구현 또는 제품 경로에 미연결인 범위

- Product UI에서 Runtime 실행을 시작하는 동선
- 공개 Product Runtime API Route
- 실제 DB 환경에서의 Runtime Approval RPC/RLS/concurrent consume 검증
- 실제 Product Runtime E2E 및 브라우저 실행 흐름
- MCP 실제 연결·Tool invocation·queue·retry·streaming

### 검증 상태

각 committed Sprint의 검증 수치는 해당 Sprint Report와 Commit 이력에서
확인해야 한다. Runtime Approval/Product Runtime 구현은 로컬 테스트,
typecheck, lint, build 통과를 기록하지만 실제 Supabase DB/RPC/RLS 검증은
`NOT VERIFIED`다.

## 6. Current Sprint State

- 현재 활성 Sprint: `LIVE-DB-VALIDATION-001` — `PLANNING / HARNESS SCOPE
  DEFINITION`.
- Planning Foundation은 `7a9d63a`에서 pushed 상태이며, Claude Plan Re-Audit의
  조건부 승인과 P1-A/P1-B 문서 보완, GPT GitHub Review PASS가 기록됐다.
- 현재 Work Unit은 `REPOSITORY-DIRECT-HARNESS-001`의 Scope Draft다. DB 연결,
  Harness 구현, migration, RPC/RLS 실행, Provider 호출, staging 생성,
  production 작업은 승인되지 않았다.
- `RUNTIME-SAFETY-CORRECTION-001`은 User Sprint Exit 승인 후
  `CLOSED / COMPLETE`다. 구현 Commit은 `a101b9f`, 종료 준비 Commit은
  `06fa299`, 최종 종료 Commit은 `3ffb62`이며 Deploy는 수행되지 않았다.
- `RUNTIME-APPROVAL-FOUNDATION-001`과
  `PRODUCT-RUNTIME-INTEGRATION-001` 구현은 `a101b9f`에 포함되고 독립 감사
  및 GPT GitHub Commit Review를 통과했다.
- 다음 공식 gate: `HARNESS IMPLEMENTATION SCOPE APPROVAL`. 통과 후에도 local
  DB 실행과 staging 사용은 각각 별도 사용자 승인이 필요하다.
- Visual Slice: `BUILDFLOW-VISUAL-CLOSED-BETA-SLICE-001`은 USER QA 대기
  상태로 기록되어 있다.
- 다음 후보 Sprint는 이 계획 Sprint의 re-audit 및 후속 사용자 승인 이후에만
  검토한다. 현재 실행 후보는 활성화되지 않았다.

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

- `LIVE-DB-VALIDATION-001` Repository-direct Harness Scope의 승인 검토. 실제
  DB 검증 환경과 실행은 Harness 구현 및 별도 사용자 승인 이후에만 결정한다.
- Visual Closed Beta Slice의 User QA 결과 확인 및 승인된 결함만 처리.

### P1

- Product Runtime에 대한 실제 Product UI/API 진입점은 별도 Scope Freeze 후
  검토.
- `BUSINESS-PLAN-001`의 사실 기반 작업 계획 검토.

### P2

- Marketplace, Agent Store, Billing, 고급 Multi-Agent, 대규모 운영 기능의
  장기 검토.

## 10. Operating Workflow

1. GPT/Claude/Codex가 작업 전 GitHub 최신 상태와 working tree를 확인한다.
2. GPT가 계획 및 PM/CTO 검토를 수행한다.
3. 사용자가 Scope와 작업 권한을 승인한다.
4. Codex가 승인 범위에서 구현 및 문서 작성을 수행한다.
5. Codex가 Commit hash와 검증 결과를 제출한다.
6. Claude가 독립 감사를 수행한다.
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

단, `LIVE-DB-VALIDATION-001`은 Harness Scope 문서와 최소 운영 상태 동기화에
한해 승인됐다. Harness 구현·DB 연결·migration·외부 API·commit·push·deploy는
승인되지 않았다.

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
- Git commit `7a9d63a16b492b4453e59dcd324cd1b08cf93502`

## 13. Update Rules

- Sprint 종료 시 갱신한다.
- 활성 Sprint 변경 시 갱신한다.
- 핵심 아키텍처 변경 시 갱신한다.
- 배포 상태 변경 시 갱신한다.
- 문서 내용과 저장소가 충돌하면 저장소와 Git 상태를 우선 확인한다.
- `UNKNOWN`을 추측으로 채우지 않는다.
