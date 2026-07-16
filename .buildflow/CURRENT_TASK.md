# Current Task

## Task ID

AUTO-001

## Title

Autonomous Build Orchestrator Foundation

## Status

REVIEW

## Goal

Requirement, Architecture, Connector, Credential, Build Plan, Execution, Approval, and Verification을 하나의 영구 Autonomous Build Session으로 연결한다.

## Scope

Session state machine, unified user action bundle, approval plan, automatic continuation, failure transitions, fatigue metrics, ownership/RLS, and Project Detail UI.

## Completion Criteria

- Existing engines are reused; no new provider family is added.
- Session state persists across refresh/re-login.
- Secret-safe metrics/events and server ownership checks are maintained.
- Tests, lint, typecheck, build, and diff check pass.
