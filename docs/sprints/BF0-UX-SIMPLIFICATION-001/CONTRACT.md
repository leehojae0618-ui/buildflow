# BF0 UX Simplification Contract

## Status

```text
SPRINT ID: BF0-UX-SIMPLIFICATION-001
CONTRACT STATUS: SCOPE FREEZE
IMPLEMENTATION AUTHORITY: NONE
COMMIT AUTHORITY: NONE
PUSH AUTHORITY: NONE
DEPLOY AUTHORITY: NONE
```

This contract governs a future approved UX simplification Sprint for `/bf0`.
It does not authorize source implementation.

## Immutable Conditions

1. The core success criterion is UX complexity reduction, not feature addition.
2. If required user decision count increases, the Sprint fails scope.
3. Existing selection screens must not be preserved merely under new names.
4. Detailed Requirement review is not a mandatory default-journey gate.
5. Clarification occurs only when necessary.
6. A real permission requiring user approval must never be auto-approved by a
   recommendation or default value.
7. False AI analysis, execution, connection, cost, completion, Evidence,
   deployment, or Production claims are prohibited.
8. Existing Runtime, Provider, Evidence, and Approval contracts are not changed.
9. Existing dirty working-tree changes remain user-owned and must be preserved.
10. Implementation, Commit, Push, and Deploy require separate user approval.

## Truth Boundary

The UX may organize user input into deterministic projections supported by the
current ViewModel. It must not claim:

```text
AI analysis completed
Provider executed
Runtime executed
Evidence persisted
Agent built
Deploy completed
Production ready
External service connected
Cost verified
```

unless the repository and approved runtime evidence support that exact claim.

## Clarification Contract

Clarification is allowed only for:

```text
필수 정보 누락
의미 있는 모호성
사용자 승인 방식 미확정
지원되지 않는 입력/결과 위치
truth/safety 상 사용자 결정 필요
```

Clarification must reduce user burden. It must not recreate all existing
Goal/Input/Approval/Output screens as mandatory questions.

## Recommendation Contract

Recommendations and defaults may be used only when deterministic projection is
safe. They must remain editable and must not hide unsupported or unknown
states.

```text
추천값 표시
→ 그대로 진행
→ 필요하면 변경
```

Recommendations do not equal user approval for real external action,
permission, execution, deployment, or cost.

## Progressive Disclosure Contract

The default screen should hide developer-oriented details while preserving
truth:

- Provider details
- Runtime details
- Evidence details
- internal state labels
- technical contract detail
- detailed permission notes
- detailed URLs and implementation instructions

These details may appear under explicit disclosure controls such as
`자세히 보기`.

## Build Plan Contract

Build Plan remains a core final-user surface. It initially shows:

```text
전체 단계 수
각 단계의 목적
현재 사용자가 해야 할 다음 행동
```

The existing BuildFlow structure of step URL, explanation, and additional
detail is preserved but collapsed by default. Step Mode is optional and entered
only when the user chooses:

```text
단계별로 따라하기
```

## Completion Contract

Completion must separate:

```text
1. 준비된 것
2. 아직 실행/연결되지 않은 것
3. 사용자가 다음에 할 행동
```

Design completion is not execution completion. Any copy that can be read as
Agent/Provider/Runtime/Deploy/Evidence completion requires source-backed
evidence or must be rewritten.

## Visual and Accessibility Contract

The Sprint preserves the existing BF_0 identity:

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

The UX must also preserve:

- Keyboard interaction
- Focus visibility
- Reduced-motion behavior
- No horizontal overflow at 375 / 390 / 768 / 1440 viewports
- Truthful unsupported and unknown states

## Non-Goals

The Sprint does not include:

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

## Acceptance Criteria

### AC1

The first core action is clear to a first-time user.

### AC2

Detailed Requirement review is not forced.

### AC3

The user is not repeatedly asked about values that can be safely determined.

### AC4

One screen does not ask the user to make several technical judgments at once.

### AC5

Provider, Runtime, Evidence, and other internal technical terms are not exposed
more than necessary on the default screen.

### AC6

Build Summary lets the user understand the overall Agent flow briefly.

### AC7

Build Plan initially shows the essentials; details expand only when requested.

### AC8

Step Mode is optional.

### AC9

Completion does not confuse design completion with actual execution completion.

### AC10

375 / 390 / 768 / 1440 viewports have no horizontal overflow.

### AC11

Keyboard interaction and reduced-motion behavior are preserved.

### AC12

Product Owner Sprint exit is possible only after the Product Owner directly
uses the real `/bf0` journey and approves that it is not complex and feels
intuitive.

## Stop Conditions

Stop and request scope amendment if implementation requires source changes
outside the future approved file list, a new dependency, a DB/Runtime/Provider/
Evidence/Approval contract change, an LLM/API call, Visual Slice changes,
external execution, or hiding unsupported and unknown states.
