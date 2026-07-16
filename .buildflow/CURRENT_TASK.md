# Current Task

## Task ID

EXEC-003

## Title

Credential Manager Foundation

## Status

REVIEW

## Goal

외부 서비스 Credential을 안전하게 입력·형식 검증·참조하는 기반을 구축한다. 실제 외부 검증과 영구 Secret 저장은 제외한다.

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
