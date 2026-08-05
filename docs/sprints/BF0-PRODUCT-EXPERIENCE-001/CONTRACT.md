# BF0 Product Experience Contract

## Status

```text
CONTRACT STATUS: SCOPE FREEZE / ACTIVE USER QA REFINEMENT
IMPLEMENTATION AUTHORITY: APPROVED — FROZEN UI-ONLY SCOPE
ACTIVATION RECORD: ACTIVATION.md
```

## Immutable Conditions

1. BF_0 is recreated with Next.js and TypeScript components, never through an
   iframe or a static HTML embedding.
2. Existing Runtime Core, Provider, Evidence, Approval, and Package Evidence
   contracts are not redesigned or bypassed for UI work.
3. A UI label may claim a capability, connection, cost, result, or completion
   only when the existing backend has source-backed evidence for that claim.
4. Cost values are not hardcoded. `외부 LLM 비용 없음`, `무료`, and `비용 0원`
   are prohibited unless a future supported capability proves them.
5. Unsupported states use truthful labels such as `설계 초안`, `연결 필요`,
   `구축 가이드 제공`, `현재 미지원`, `백엔드 연결 대기`, or `실행 준비 전`.
6. Existing dirty working-tree changes remain user-owned and are not reset,
   restored, stashed, cleaned, overwritten, or automatically staged.
7. DB, migrations, server Draft persistence, authentication changes, Runtime
   execution, Provider calls, external connections, and live external actions
   are out of scope.
8. Future implementation must preserve keyboard accessibility, responsive
   layouts, reduced-motion behavior, and safe client/server boundaries.
9. Implementation, Commit, Push, and Deploy require separate user authority.
10. `완료` or equivalent success language is used only with verified evidence.

## Truthful UI Projection Rule

Future screens may project existing read models into a workflow draft and build
guide. They must not convert a Plan, approval-ready state, UI selection, or
missing capability into a claim of Provider, MCP, Evidence, or Agent-execution
success.

## External Link Rule

Future build-plan links use only verified official URLs or internal routes.
When an official integration path is not source-backed, the screen presents a
guide-only state rather than inventing a URL or a completed connection.
