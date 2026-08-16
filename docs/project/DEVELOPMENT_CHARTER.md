# BuildFlow Development Charter v1.0

## Status

Binding development direction for BuildFlow.

This charter supersedes previous *interpretations of development priorities*.
It does not bypass approved contracts, security controls, scope freeze, change
control, commit approval, push approval, release approval, or deployment
approval.

## 1. Product Vision

BuildFlow is not a generic web application builder. It is an **AI Agent
Factory**.

The intended user journey is:

```text
Describe a goal
→ AI understands the goal
→ AI collects missing information
→ AI generates an executable Agent
→ AI builds the Agent
→ AI tests the Agent
→ the user can immediately use the Agent
```

Repository work must contribute to this journey or to the safety, reliability,
or operability required to provide it.

## 2. Existing Architecture Remains Valid

Do not discard or bypass the existing architecture. These principles remain
official:

- Capability First
- Blueprint First
- Evidence First
- Approval First
- MCP First
- Contract First

Contract quality is more important than implementation speed. Contract-first
development remains the required approach.

## 3. Documents Support the Product

Documents, contracts, plans, and reports support implementation; they are not
the product outcome by themselves.

The intended development sequence is:

```text
Document
→ Contract
→ Implementation
→ Visible UI
→ User Validation
→ Next Sprint
```

Documentation-only checkpoints may preserve governance or safety history, but
they do not count as product-complete progress on their own.

## 4. Visual Milestone Principle

Every Sprint must include at least one browser-visible improvement that the
project owner can verify.

The owner should be able to answer:

> What can I actually see today that I could not see yesterday?

Examples include:

- Builder UI
- Blueprint visualization
- Runtime progress
- Execution timeline
- Approval dialog
- Provider execution screen
- Tool execution result
- Agent replay

Architecture, contract, or documentation work without visible follow-through
is technically useful but product-incomplete.

## 5. Closed Beta Objective

Closed Beta is not a documentation milestone. It is successful only when a
user can complete an end-to-end automated build experience:

```text
Goal
→ Clarification
→ Blueprint
→ Execution Plan
→ Approval
→ Real Provider Invocation
→ Real Tool Invocation
→ Execution Progress
→ Evidence
→ Result
→ Save Agent
→ Run Again
```

Mock execution, blueprint-only execution, and recommendation-only execution
do not satisfy the Closed Beta objective.

## 6. OSS First Principle

Before implementing infrastructure directly:

1. Search GitHub and official SDKs.
2. Evaluate maintenance, license, security, and compatibility.
3. Estimate integration effort.
4. Recommend adoption or a BuildFlow-specific implementation.

Only BuildFlow-specific business logic should be written from scratch when
reuse or adoption is not suitable.

Suitable OSS categories include UI libraries, Agent frameworks, MCP servers,
runtime helpers, queues, schedulers, monitoring, editors, and diagram tools.

Every OSS adoption proposal must state:

- repository
- license
- maintenance status
- integration effort
- security considerations
- recommendation

No dependency may be adopted without explicit approval.

## 7. Reuse Before Rewrite

Before creating new code:

1. Reuse an existing BuildFlow module.
2. Extend an existing module.
3. Integrate approved OSS.
4. Implement new code only when necessary.

Do not duplicate existing functionality.

## 8. Scope Discipline

Current Closed Beta priorities are:

- Builder
- Requirement Engine
- Blueprint
- Runtime
- Provider Invocation
- Tool Invocation
- Approval
- Evidence
- Execution UI
- Agent Save
- Agent Replay

Deferred unless separately approved:

- Marketplace
- Agent Store
- Creator Economy
- Learning Engine
- Advanced Multi-Agent capabilities
- Massive scaling
- Billing Platform
- Public APIs

Scope expansion requires approval.

## 9. Responsibilities

### GPT

GPT is responsible for:

- product direction
- priority decisions
- scope control
- implementation review
- architecture consistency
- Sprint approval
- user validation

### Codex

Codex is responsible for:

- repository inspection
- implementation
- testing
- code quality
- OSS research
- reuse of existing modules
- technical proposals
- browser-visible implementation

Codex must not independently redefine product priorities.

## 10. Sprint Completion Criteria

A Sprint is complete only when all of the following are true:

- Contracts remain consistent.
- Existing architecture is respected.
- Existing modules are reused where appropriate.
- OSS opportunities have been evaluated when infrastructure is needed.
- Required tests pass.
- Browser-visible progress exists.
- The project owner can verify the new functionality.

## 11. Sprint Lifecycle and Quality Gate

Every Sprint uses the following lifecycle. Current operational documents must
use the same state names.

```text
DRAFT
→ PM REVIEW
→ FROZEN
→ READY
→ ACTIVE
→ IMPLEMENTED
→ CODE REVIEW
→ USER QA
→ DONE
```

`READY` confirms that the Scope is frozen and implementation preparation is
complete. Implementation Authority is `PENDING ACTIVE` at this stage. It does
not itself begin production changes; code work begins only when the Sprint is
recorded as `ACTIVE`.

`ACTIVE` means implementation has officially started. The developer may modify
production code only within the approved Scope. Scope expansion is prohibited.

Every `READY → ACTIVE` transition requires an Activation Record in the Sprint
directory. It must state activation time, activating authority, frozen Scope,
authorized implementation boundary, and explicit restrictions.

Every completed Sprint requires an Exit Record before `IMPLEMENTED → CODE
REVIEW`. It must record completed Scope, out-of-scope work, known issues,
validation evidence, PM review, User QA, and the next Sprint candidate.

No Sprint advances while any P0, P1, or P2 finding remains unresolved. Findings
must be corrected and revalidated before the next lifecycle transition.

## 12. Independent Audit Policy

Routine local Sprint flow is `GPT direction and scope → Codex implementation
and validation → GPT PM/CTO review → next development`. Claude is not required
as a per-Sprint checkpoint.

Independent Claude audit is required immediately before the first Live E2E
that involves OAuth, credential handling, or an external write, and before a
Closed Beta or Release checkpoint. It may be added for a suspected P0/P1
security issue or a substantial Core contract change. This audit policy does
not relax any approval, security, or external-action gate.

## 13. Primary Success Metric

BuildFlow is not judged by the number of files, contracts, reports, or commits.

The primary question is:

> Can the user visibly experience more of the AI Agent automatic-building
> workflow than before?

Every development decision should optimize toward that outcome.
