# Current Task

## Task ID

STABILIZE-004

## Title

Persist Verification Runs and Results

## Status

REVIEW

## Goal

Provider Verification Run·Target·Attempt·Evidence를 서버에 저장하고 새로고침·재로그인 후 동일한 상태를 복원한다.

## Working Directory

`/Users/hojelee/Documents/Codex/buildflow`

## Owner

- Planning and Review: GPT
- Implementation and Verification: Codex
- Direction and Approval: User

## Completion Criteria

- Verification Run과 Provider별 검증 상태가 존재한다.
- Secret-safe evidence와 최종 Ready 상태 계산이 존재한다.
- 실제 Provider QA Pending과 코드/Mock 검증이 분리된다.
- 테스트, lint, typecheck, build, diff check가 통과한다.
