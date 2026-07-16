# AGENT-FOUNDATION-001 — Plan

## Objective

BuildFlow가 AI Agent를 안전하게 생성, 검증, 배포, 패키징하기 위한 Agent
계약 계층을 만든다. 이 Sprint는 Runtime 실행보다 Source of Truth와
검증 가능한 Contract를 우선한다.

## Implementation Order

### 1. Contract Skeleton

- `src/features/agents/` 디렉터리 생성
- Agent Capability 타입 정의
- Delivery Mode와 Interface Mode 타입 정의
- Public export 구조 정리

### 2. Block Contract

- Model Block
- Prompt Block
- Trigger Block
- Tool Block
- Memory Block
- Knowledge Block
- Guardrail Block
- Output Block
- Delivery Surface Block
- 각 Block의 required field와 safe metadata 정의

### 3. MCP Reference Contract

- Tool Block에서 MCP Server ID와 Tool Capability를 참조할 수 있게 한다.
- Permission, Approval, input/output schema reference를 계약으로 정의한다.
- 실제 MCP discovery, registry, gateway, invocation은 구현하지 않는다.

### 4. Agent Blueprint Contract

- Agent Blueprint ID, version, compatibility, capability, block graph 정의
- Blueprint dependency와 required credential/provider/tool reference를 분리
- `ai-inquiry-v1` compatibility mapping 추가

### 5. Agent Definition and Validator

- Agent Definition 타입 정의
- Contract Validator 순수 함수 구현
- 중복 Block ID, 누락 Capability, 잘못된 MCP reference, 잘못된 Delivery Mode,
  unsupported Interface Mode를 검증한다.

### 6. Tests

- Agent Capability validation
- Block Contract validation
- Agent Blueprint validation
- Agent Definition validation
- `ai-inquiry-v1` mapping validation
- MCP Reference is contract-only, not executable

### 7. Documentation

- Sprint Report 작성
- Product direction과 Scope exclusion 명시
- MCP Foundation으로 넘길 항목 분리

## Safety Boundaries

- Provider Adapter 변경 금지
- Provisioning Executor 변경 금지
- Verification Persistence 변경 금지
- DB Migration 금지
- Marketplace 구현 금지
- 실제 MCP Server 연결 금지
- Secret 저장 또는 출력 금지

## First Safe Work Unit

첫 번째 구현 단위는 다음으로 제한한다.

- `src/features/agents/types.ts`
- `src/features/agents/validator.ts`
- `src/features/agents/index.ts`
- `src/features/agents/validator.test.ts`

이 단위는 DB, Provider, MCP Runtime, Marketplace에 닿지 않는 순수 계약과
검증 함수만 포함한다.

## Validation Commands

```text
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

## Commit Policy

이 Sprint의 구현은 PM Review와 Commit Approval 전까지 commit하지 않는다.
Push는 별도 승인 전까지 금지한다.

