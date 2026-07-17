# UI/UX Memory

## Design Language

Source of truth:

- `docs/design/DESIGN_LANGUAGE.md`
- `docs/brand/AI_COMMUNICATION_LANGUAGE.md`

Design Language v1 status: `APPROVED`.

## Core Identity

BuildFlow UI should feel like an **AI Agent Command Center**.

The user is not designing workflows. The user is assigning work to an AI
development team and receiving verified outcomes.

## Visual Theme

Decision / planned direction from design docs:

- Dark Luxury
- JARVIS-inspired professional workspace
- Living Neural Network
- AI Agent Command Center
- Glass panels
- Electric Blue `#53D8FF`
- Neon Violet `#7B61FF`
- Orange for approval, warning, and cost
- Green for verified success

## Experience Hierarchy

Default screens should prioritize:

1. Outcome the user will receive
2. Current AI work
3. Progress and estimated remaining time
4. Cost
5. User actions and approvals
6. Verification and Evidence
7. Technical details

## First Screen Principle

Planned / design decision:

```text
무엇을 대신할 AI Agent를 구축할까요?
```

The first screen should be an Agent Command Input, not a project dashboard.

Expected first-screen elements:

- Large natural-language input
- Recommended prompts
- Mode selection: quick input / conversational input

## Navigation Direction

Planned design direction includes a fixed left navigation such as:

- Command Center
- My Agents
- Build
- Approval
- Credential
- Blueprint
- MCP Registry
- Marketplace
- Analytics
- Settings

Implementation compliance is not fully audited in this memory migration.

## Approval UX

Approval must be visible and outcome-focused.

## Alignment — Connections, Permissions, Cost

BuildFlow UX must help non-developers connect services safely. It must not show
only a raw API Key input as the default experience.

Connection priority:

1. OAuth or service permission approval
2. API Key or Token manual entry with service-specific guide
3. Managed Connection provided by BuildFlow or an organization admin

When OAuth is available, the preferred flow is:

```text
Connect button
→ service login
→ requested permission review
→ approval
→ return to BuildFlow
→ safe connection test
→ connected state
```

API Key UX must include:

- why the key is needed;
- where it will be used;
- official issuance page;
- exact menu names and steps;
- one-time visibility warning;
- minimum required permission;
- cost or billing warning;
- connection test;
- rotation and disconnect guidance;
- common errors and recovery steps.

Connection and permission UX rules:

- Explain why each connection is needed.
- Distinguish read, write, modify, delete, and admin permissions visually.
- Request minimum permission at the moment it becomes necessary.
- Show safe connection test results before marking a connection as connected.
- Never show raw Credential values after connection.
- Use safe display hints only, such as masked references.

Cost UX rules:

- Show expected cost before Agent execution and before deployment.
- Always show usage frequency assumptions.
- Required meaning: "시뮬레이션상의 계산 금액입니다" with daily/monthly run counts.
- Prefer ranges and scenarios over one exact number.
- Distinguish simulated estimate from actual billing.
- Show confidence as `HIGH`, `MEDIUM`, or `LOW` based on available inputs.
- Highlight cost-incurring actions and approval requests clearly.

## Runtime State UX

Runtime and MCP state enums must not be shown directly to non-technical users.

Examples:

- `WAITING_FOR_CONNECTION`: "Gmail 연결이 필요합니다."
- `WAITING_FOR_CREDENTIAL`: "OpenAI API Key가 만료되었거나 연결되지 않았습니다."
- `WAITING_FOR_APPROVAL`: "이메일 발송 전에 승인이 필요합니다."
- `RUNNING`: "문의 내용을 분석하고 있습니다."
- `PARTIAL_SUCCESS`: "답변 초안은 생성됐지만 이메일 발송은 완료되지 않았습니다."
- `EXPIRED`: "승인 또는 실행 요청의 유효시간이 지났습니다."

Approval cards for external effects should show:

- action summary
- service name
- safe account display
- read/write/delete classification
- target reference
- affected item count
- expected external effect
- estimated cost and simulation frequency
- approval expiration
- one-time or reusable scope
- cancellation possibility
- limitations

Cancellation and partial success should never erase completed evidence. The UI
must explain what completed, what stopped, and what the user can do next.

Approval surfaces should explain:

- What the AI will do
- Why permission is needed
- Impact
- Cost
- Whether the action can be retried or recovered

Users should not be forced to read raw logs.

## Completion UX

Completion should emphasize:

- Agent ready state
- URL or usage surface
- Admin / management surface when applicable
- Verification
- Evidence
- Package Export readiness

Avoid user-facing titles such as `Done`, `Success`, or `Deployment Complete`
when stronger Production/Agent readiness language is needed.

## Hidden by Default

The default UI should not expose these terms to non-technical users:

- Workflow internals
- Task IDs
- JSON
- Provider commands
- MCP internals
- Adapter logs
- Raw execution logs

These belong in detail views.

## Communication Tone

BuildFlow speaks as an **AI Chief Engineer**:

- calm
- precise
- professional
- not exaggerated
- clear about uncertainty
- clear about next action

## Implementation Status Notes

- The design language is approved.
- Some UI refactor work has been completed in prior HARDEN/DESIGN/BRAND
  Sprints.
- This memory migration does not audit every component for design compliance.
- Living Neural Network and full Agent Command Center visuals should be treated
  as `DECISION` / `PLANNED` unless a specific screen implementation is verified.
