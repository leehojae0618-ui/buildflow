# Current Task

## Task ID

EXEC-004

## Title

Build Executor v1

## Status

REVIEW

## Goal

확정된 Architecture와 Build Plan을 서버 실행 상태로 변환하고, 안전한 Artifact 작업과 대기·승인 상태를 관리한다.

## Working Directory

`/Users/hojelee/Documents/Codex/buildflow`

## Owner

- Planning and Review: GPT
- Implementation and Verification: Codex
- Direction and Approval: User

## Completion Criteria

- Provider별 Credential Definition과 상태 모델이 존재한다.
- Secret-safe 입력 및 공통 형식 검증 인터페이스가 존재한다.
- Credential Reference가 Connector와 Account Wizard에 연결된다.
- 테스트, lint, typecheck, build, diff check가 통과한다.
