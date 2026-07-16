# Current Task

## Task ID

STABILIZE-003

## Title

Persist Architecture Candidate Selection

## Status

REVIEW

## Goal

사용자가 선택한 Architecture 후보를 서버 소유 프로젝트 Snapshot에 저장하고, 선택된 후보만 하위 Engine의 확정 입력으로 사용한다.

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
