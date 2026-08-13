# BF0 UX Simplification Plan

## 1. Status

```text
SPRINT ID: BF0-UX-SIMPLIFICATION-001
SPRINT TYPE: DOCUMENTATION / SCOPE FREEZE ONLY
STATUS: SCOPE FROZEN / IMPLEMENTATION NOT APPROVED
IMPLEMENTATION AUTHORITY: NONE
COMMIT AUTHORITY: NONE
PUSH AUTHORITY: NONE
DEPLOY AUTHORITY: NONE
DB / RUNTIME / PROVIDER / MCP / EXTERNAL AUTHORITY: NONE
```

`BF0-PRODUCT-EXPERIENCE-001` remains a historical closed Sprint.

```text
BF0-PRODUCT-EXPERIENCE-001:
HISTORICAL / CLOSED
CLOSED / COMPLETE
USER SPRINT EXIT APPROVED

BF0-UX-SIMPLIFICATION-001:
NEW FOLLOW-UP / SCOPE FREEZE
IMPLEMENTATION NOT APPROVED
```

This plan does not invalidate, rewrite, or reopen the historical BF0 Sprint.
It records a new Product Owner User QA finding and freezes a follow-up UX
reduction scope for later approval.

## 2. Problem Statement

Product Owner real BF_0 User QA result:

```text
BF_0 USER QA: FAIL

P0: 0
P1: 1

P1:
비개발자 대상 핵심 UX가 복잡하고 직관적이지 않음.
사용자에게 보여주는 정보와 사용자가 직접 판단해야 하는 선택이 과도함.
```

Current BF_0 is functionally available, but it feels complex and not intuitive
for non-developer users.

Core problems:

- Information volume is too high for the default journey.
- The user is asked to make too many decisions directly.
- The experience feels closer to writing a specification manually than having
  BuildFlow organize the request first.

Finding classification: `P1`.

## 3. Product Objective

The target product objective is fixed as follows:

```text
사용자가 원하는 것을 자연어로 말한다.
BuildFlow는 기존 지원 범위 내에서 가능한 항목을 먼저 정리한다.
정말 필요한 정보만 추가 질문한다.
사용자는 최소한의 판단으로 최종 구축안을 확인하고 승인한다.
```

The simplification is a UX and presentation reduction, not a new AI capability.
The implementation must stay within existing deterministic ViewModel and data
projection boundaries unless a later Sprint explicitly authorizes a broader
contract.

## 4. Simplified Target Journey

The follow-up Sprint must not force every historical selection step on every
user.

Target journey:

```text
Short Onboarding
→ Idea Input
→ Automatic Request Organization
→ Clarification Only When Needed
→ Build Summary
→ User Approval
→ Build Plan
→ Completion
```

`Automatic Request Organization` means deterministic organization of currently
supported view-model outputs and existing data projections. Without a new LLM
call or actual AI inference, the UI must not claim that AI analysis has
completed.

## 5. UX Reduction Rules

### A. Requirements

Detailed Requirement review is not a mandatory gate in the default journey.

```text
Default:
hidden / summarized

Optional:
내 요청 보기
수정
자세히 보기
```

The user can still inspect or correct request details, but the default path
should not make the user feel they are editing a technical requirement sheet.

### B. Goal / Input / Approval / Output

All users must not be forced to make the four historical choices separately.
When the initial input safely supports a deterministic recommendation:

```text
추천값 표시
→ 그대로 진행
→ 필요하면 변경
```

Only values that cannot be safely inferred move into clarification. The default
interaction rule is one primary question per screen.

### C. Clarification

Clarification appears only when one of the following applies:

```text
필수 정보 누락
의미 있는 모호성
사용자 승인 방식 미확정
지원되지 않는 입력/결과 위치
truth/safety 상 사용자 결정 필요
```

Renaming every existing selection screen to "clarification" is not sufficient.
The goal is fewer questions and fewer mandatory decisions.

### D. Workflow

The default view shows a short human-readable flow, for example:

```text
폼 입력
→ 조건 확인
→ 승인
→ Slack 전달
```

Provider, Runtime, Evidence, internal state, and other developer-oriented
details must not appear at the top of the default user screen. Technical detail
uses progressive disclosure.

### E. Cost & Permission

The default surface shows only:

```text
필요한 연결
사용자 확인 필요 여부
예상 비용 상태
```

Detailed permission, Provider status, and technical contract information stay
under a `자세히 보기` affordance. Unknown costs must not be labeled as `무료`,
`0원`, or equivalent unless there is verified source-backed evidence.

### F. Build Plan

Build Plan remains a core final-user screen. The first view prioritizes:

```text
전체 단계 수
각 단계의 목적
현재 사용자가 해야 할 다음 행동
```

The existing BuildFlow decision to preserve step URLs, explanations, and
supporting detail is retained, but those details are not expanded by default.
They use accordion or disclosure behavior.

### G. Step Mode

Step Mode is not a separate forced journey. The user enters it only by choosing:

```text
단계별로 따라하기
```

from Build Plan.

### H. Completion

Completion must immediately distinguish:

```text
1. 준비된 것
2. 아직 실행/연결되지 않은 것
3. 사용자가 다음에 할 행동
```

Design completion must not be phrased as Agent execution complete, Provider
execution complete, deployment complete, persisted Evidence complete, or
Production complete.

## 6. Interaction Contract Summary

The follow-up implementation scope is governed by these interaction rules:

- One screen should have one primary CTA by default.
- Required user decision count must be minimized.
- Recommendations and defaults come before manual choices.
- Details use progressive disclosure.
- Developer terminology is hidden from the default screen.
- Back/Edit remains available.
- Important approvals are explicit.
- Unsupported and unknown states are not hidden.
- False completion states are prohibited.

## 7. Visual Direction

The follow-up Sprint preserves the existing BF_0 visual identity:

```text
BuildFlow logo
dark visual identity
motion / particle background where appropriate
simple central content rail
idea-input-first experience
clear typography hierarchy
large readable primary actions
mobile-first responsiveness
```

This is not a full brand redesign.

## 8. Explicit Non-Goals

The following are excluded:

- New LLM Provider
- LLM API call
- New AI inference
- DB schema change
- Migration
- RLS
- Runtime redesign
- Provider redesign
- Evidence redesign
- Approval contract redesign
- MCP
- OAuth
- n8n / Make live execution
- External service invocation
- Deploy
- Visual Slice full redesign
- Project Detail full redesign
- New dependency

If simplification is found to require any excluded item, implementation must
stop for scope amendment rather than expanding this Sprint.

## 9. Initial Risk Register

- The existing route model currently includes many mandatory screens:
  onboarding, idea, navigator, goal, source, approval, output, workflow,
  access, plan, step, and complete.
- Existing deterministic extraction may not safely infer every value. Unknown
  states must be preserved rather than overconfidently filled.
- Reducing visible technical detail could accidentally hide unsupported or
  unverified states; this is prohibited.
- Build Plan detail reduction must not remove the existing URL, explanation,
  and supporting-detail structure; it should collapse detail by default.
- A simpler UX must still avoid fake AI, fake cost, fake connection, or fake
  completion claims.

## 10. Next Gate

The next eligible gate is GPT Scope Review. Implementation, Commit, Push,
Deploy, DB, Runtime, Provider, MCP, and external execution remain unapproved.
