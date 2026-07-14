# BuildFlow

## Development Rules

- Version: 1.0
- Status: Active
- Brand Name: BuildFlow
- Internal Codename: Project Flow
- Development Model: Solo Founder + ChatGPT + Codex
- Last Updated: 2026-07-14

## 1. Purpose

이 문서는 BuildFlow 프로젝트의 코드 품질, 작업 방식, 검증 방법, 변경 통제 기준을 정의한다. Codex가 수행하는 작업 범위를 통제하고, 일관된 구조와 검증 방법을 제공하며, 1인 개발의 유지보수 비용을 최소화한다. 또한 MVP 범위 확장을 방지해 첫 출시 전후의 혼선을 줄인다.

## 2. Role Separation

### ChatGPT

- 제품 및 기술 방향 결정
- 요구사항 정리
- Task 작성
- DB·API·UX·아키텍처 설계
- Codex 결과 검수
- 다음 Task 결정

### Codex

- 명시된 범위만 구현
- 파일 생성 및 수정
- Migration 작성
- 테스트와 검증
- 오류 원인 분석
- 변경사항 보고

### User

- Codex에 Task 전달
- Supabase·Google·Vercel 등 계정 권한 작업
- 실행 결과 전달
- 최종 제품 결정 승인

Codex는 임의로 제품 범위와 기술 방향을 바꾸지 않는다.

## 3. Source of Truth

우선순위:

1. 현재 승인된 Codex Task
2. `docs/04-mvp.md`
3. `docs/06-documentation-audit.md`
4. `docs/01-prd.md`
5. `docs/02-information-architecture.md`
6. `docs/03-user-flow.md`
7. `docs/00-brand.md`
8. `MASTER_PLAN.md`

단, 브랜드 정의는 `docs/00-brand.md`, 보안 원칙은 PRD 및 개발 규칙을 따른다.

충돌이 있으면 임의 판단하지 않고 보고한다.

## 4. MVP Scope Control

- P0만 출시 차단 기능으로 취급한다.
- P1은 별도 승인 없이 구현하지 않는다.
- P2는 구현하지 않는다.
- 새 기능 발견 시 Backlog로 기록한다.
- 기존 Task를 확장하여 추가 기능을 구현하지 않는다.
- 미래 확장성을 이유로 조기 추상화하지 않는다.

## 5. Technology Baseline

현재 기준:

- Next.js
- React
- TypeScript
- App Router
- Tailwind CSS
- Supabase
- PostgreSQL
- Vercel
- n8n
- GitHub

구체적인 버전은 프로젝트 생성 Task에서 확정한다.

원칙:

- 단일 Next.js 애플리케이션
- Microservice 금지
- 초기 Monorepo 금지
- 조기 Plugin System 금지
- 실제 필요 전 Vector Database 금지
- 상태관리 라이브러리는 필요성이 입증되기 전 추가하지 않음
- UI Component Library는 프로젝트 생성 전 임의 선택 금지

## 6. Folder Structure Principles

권장 구조:

```text
src/
  app/
  components/
  features/
  lib/
  services/
  types/
  hooks/

docs/
supabase/
  migrations/
  seed/
public/
```

원칙:

- 기능 코드는 features 중심으로 구성한다.
- 공통 UI만 components에 둔다.
- 외부 서비스 연결은 services 또는 명확한 provider 영역으로 둔다.
- Supabase client와 server 코드를 분리한다.
- 하나의 거대한 utils.ts를 만들지 않는다.
- 순환 의존성을 금지한다.
- 실제 프로젝트 생성 시 필요 없는 빈 폴더를 대량 생성하지 않는다.

## 7. TypeScript Rules

- strict mode를 필수로 사용한다.
- any 사용 금지 원칙을 따른다.
- 불가피하면 이유를 주석 또는 보고에 기록한다.
- 외부 입력은 runtime validation을 거친다.
- Database Type은 Supabase 생성 타입을 우선한다.
- LLM 응답은 Schema 검증 후 사용한다.
- type assertion 남용을 금지한다.
- domain type과 UI state type을 구분한다.

## 8. React and Next.js Rules

- Server Component를 기본으로 사용한다.
- 브라우저 상태와 이벤트가 필요한 경우만 Client Component를 사용한다.
- 불필요한 `use client`를 금지한다.
- Server Action과 Route Handler 선택 기준을 명확히 유지한다.
- Secret이 필요한 작업은 server only로 처리한다.
- 보호 페이지는 서버 권한 확인을 포함한다.
- Loading, Empty, Error 상태를 구현한다.
- 접근성 있는 HTML 요소를 사용한다.
- 핵심 Route에서 모바일 웹을 지원한다.

## 9. Component Rules

- 한 Component는 하나의 명확한 책임을 가진다.
- 지나치게 큰 Component는 분리한다.
- 추상화보다 읽기 쉬운 코드를 우선한다.
- 의미 없는 Wrapper Component를 만들지 않는다.
- UI와 business logic을 분리한다.
- 공통화는 두세 번 실제 반복된 후 검토한다.
- Props는 명확한 타입을 사용한다.
- Boolean Props 과다 사용을 금지한다.

## 10. Styling and Design Direction

BuildFlow 초기 디자인 기준:

- Dark Minimal SaaS
- Near-black background
- Neutral gray surfaces
- Cyan accent
- Thin borders
- High readability
- Generous spacing
- Low visual noise

원칙:

- 참고 디자인의 분위기는 사용하되 복잡도를 낮춘다.
- 과도한 네온과 glow를 금지한다.
- 전체 화면 격자 효과 남용을 금지한다.
- 모든 텍스트에 미래형 폰트를 사용하지 않는다.
- 본문과 Form은 높은 가독성을 우선한다.
- 한 화면의 Primary CTA는 하나를 원칙으로 한다.
- Tool Logo Wall을 금지한다.
- Agent Architecture 제품처럼 보이지 않게 한다.
- 노드 Canvas는 MVP에서 구현하지 않는다.
- Cyan Accent는 상태 표현 전체에 남용하지 않는다.
- 구체적인 색상 Token은 Foundation UI Task에서 확정한다.

## 11. Naming Convention

- Component: PascalCase
- Function 및 Variable: camelCase
- Constant: 의미가 있는 경우 UPPER_SNAKE_CASE
- File: 프로젝트 생성 시 한 방식으로 확정
- Database: snake_case
- Route segment: lowercase-kebab-case
- Environment Variable: UPPER_SNAKE_CASE
- 사용자 노출 용어는 브랜드 문서 기준을 사용한다.

## 12. Supabase Rules

- 모든 DB 변경은 Migration으로 관리한다.
- Production에서 Dashboard 수동 Schema 변경을 금지한다.
- 사용자 데이터 Table은 RLS를 필수로 적용한다.
- RLS 없이 Table을 출시하지 않는다.
- Service Role Key를 브라우저에 노출하지 않는다.
- Migration과 Seed를 분리한다.
- Supabase 생성 Type을 코드에 반영한다.
- 사용자 소유권 조건을 server와 RLS 양쪽에서 확인한다.
- SQL은 재현 가능해야 한다.
- Migration 적용 전 diff 또는 영향 검토를 수행한다.

## 13. Environment Variables

- 실제 Secret은 `.env.local`에 둔다.
- `.env.example`에는 이름과 설명만 작성한다.
- Secret 값 Git 기록을 금지한다.
- 환경변수 startup validation을 수행한다.
- `NEXT_PUBLIC_`는 브라우저에 공개 가능한 값만 사용한다.
- 환경별 값을 구분한다.
- 로그에 Secret을 출력하지 않는다.

## 14. Authentication and Authorization

- 인증과 권한을 구분한다.
- 로그인 여부만으로 자원 접근을 허용하지 않는다.
- Redirect 대상 검증을 수행한다.
- Open Redirect를 방지한다.
- Session 만료를 처리한다.
- 사용자가 다른 사용자의 Project를 읽거나 수정할 수 없어야 한다.
- OAuth Provider 추가는 별도 Task로만 진행한다.

## 15. API and Server Rules

- 입력 검증을 필수로 한다.
- 표준화된 성공과 오류 처리를 사용한다.
- 내부 오류를 사용자에게 그대로 노출하지 않는다.
- 중복 Recommendation 요청을 방지한다.
- 외부 Provider Timeout을 처리한다.
- retry는 안전한 작업에만 사용한다.
- idempotency가 필요한 요청은 별도로 설계한다.
- Client에서 Provider API를 직접 호출하지 않는다.

## 16. LLM Rules

- LLM은 설명 생성과 자연어 정규화에 사용한다.
- 가격, 권한, 실행 가능 여부를 LLM이 결정하지 않는다.
- Structured Output 또는 Schema Validation을 사용한다.
- Prompt와 출력 Version 관리를 고려한다.
- 실패 응답은 저장 또는 추적한다.
- 사용자 입력을 로그에 무조건 저장하지 않는다.
- Provider 교체를 고려하되 과도한 Adapter를 미리 만들지 않는다.

## 17. Error Handling

오류 범주:

- Validation
- Authentication
- Authorization
- Database
- Provider
- Rate Limit
- Network
- Internal

모든 주요 오류는 다음을 제공한다.

- 사용자 친화적 메시지
- 재시도 가능 여부
- 입력 보존
- 내부 추적용 오류 식별자
- Secret과 내부 Stack 비노출

## 18. Logging

- `console.log` 남용을 금지한다.
- 개발 로그와 운영 로그를 구분한다.
- 개인정보와 Secret 로그를 금지한다.
- 외부 API 전체 응답을 무분별하게 기록하지 않는다.
- Recommendation 실패 원인을 추적할 수 있어야 한다.
- Error Monitoring 도구는 추후 별도 결정한다.

## 19. Testing

초기 기준:

- 핵심 Rule과 Cost Calculation은 Unit Test 대상
- 권한과 RLS는 반드시 검증
- 핵심 사용자 Flow는 수동 Acceptance Test
- Form Validation Test
- Recommendation Schema Test
- 모든 시각 요소에 Snapshot Test를 강제하지 않음
- Test framework는 프로젝트 초기화 단계에서 확정

## 20. Required Verification

코드 변경 Task 후 기본 실행:

```bash
npm run lint
npx tsc --noEmit
npm run build
git status --short
git diff --stat
```

프로젝트 script에 typecheck가 추가되면 다음을 사용한다.

```bash
npm run typecheck
```

Test가 존재하면:

```bash
npm test
```

문서 전용 Task에는 관련 문서 검증만 수행한다.

## 21. Git Rules

- 자동 commit 금지
- 자동 push 금지
- force push 금지
- 사용자 승인 없이 remote 변경 금지
- 하나의 Task에서 관련 없는 변경 금지
- `.env.local` commit 금지
- 생성 파일도 필요성을 검토한다
- Commit은 사용자가 승인한 시점에 수행한다
- Git history 재작성 금지

## 22. Branch Rules

- 초기 1인 개발에서는 기본 Branch 전략을 단순하게 유지한다.
- `main`은 배포 가능 상태를 유지한다.
- 큰 기능은 `feature/<name>`을 사용할 수 있다.
- 문서 작업만으로 불필요한 Branch를 만들지 않는다.
- 최종 Branch 규칙은 GitHub 연결 시 확정한다.

## 23. Migration Rules

- Migration 파일명은 의미 있게 작성한다.
- 한 Migration에 무관한 변경을 혼합하지 않는다.
- Table 생성 시 index와 RLS를 검토한다.
- destructive migration은 별도 승인을 받는다.
- Production 적용 전 backup 필요성을 검토한다.
- 기존 Migration 수정 대신 새 Migration 추가 원칙을 따른다.
- Seed가 Migration에 의존하지 않도록 구분한다.

## 24. Dependency Rules

새 패키지 추가 전:

- 표준 기능으로 해결 가능한가?
- 기존 패키지로 해결 가능한가?
- Bundle과 유지보수 비용은 적절한가?
- 활성 유지보수 중인가?
- 해당 Task에 정말 필요한가?

Codex는 승인되지 않은 대규모 라이브러리를 임의 설치하지 않는다.

## 25. Performance Rules

- 초기 최적화보다 단순한 구조를 우선한다.
- 불필요한 Client JavaScript를 최소화한다.
- 이미지를 최적화한다.
- 긴 Recommendation 상태를 표시한다.
- 중복 API 호출을 방지한다.
- DB Query에 필요한 index를 검토한다.
- 측정 전 과도한 memoization을 금지한다.

## 26. Accessibility

- Semantic HTML
- Label 연결
- 키보드 탐색
- Focus 상태
- 충분한 대비
- 오류 메시지 연결
- Icon-only Button에 accessible name
- 색상만으로 상태를 전달하지 않음

## 27. Security Checklist

- RLS
- Server Secret
- 입력 Validation
- Redirect Validation
- Rate Limit
- 사용자 소유권 검사
- Secret 로그 금지
- CSRF·OAuth Callback 검토
- 개인정보 최소 수집
- 민감정보 처리 Workflow 제한

## 28. Codex Task Rules

Codex는 매 Task 시작 전:

```bash
pwd
git status --short
```

그리고 다음 문서를 확인한다.

- `MASTER_PLAN.md`
- `docs/04-mvp.md`
- `docs/05-development-rule.md`
- 현재 Task에서 지정한 관련 문서

Codex는:

- 지정한 범위만 수정한다.
- 현재 변경사항을 덮어쓰지 않는다.
- 불명확한 중대 결정은 임의 처리하지 않고 보고한다.
- 경미하고 안전한 구현 세부사항은 합리적으로 판단할 수 있다.
- 완료 후 변경 파일, 검증 결과, 남은 문제를 보고한다.
- 자동 commit과 push를 하지 않는다.

## 29. Task Completion Report

완료 보고 기본 형식:

- 확인한 작업 경로
- 변경한 파일
- 구현 내용
- 주요 기술 결정
- 실행한 검증
- 검증 결과
- 남은 문제
- 사용자 직접 작업
- Git 상태
- Commit 및 push 여부

## 30. Definition of Done

기능 완료 조건:

- Task 범위 충족
- Scope 외 변경 없음
- Type 오류 없음
- Lint 통과
- Build 통과
- 필요한 Test 통과
- Loading·Empty·Error 상태
- Mobile 핵심 Flow 확인
- 권한과 보안 확인
- 관련 문서 또는 환경변수 템플릿 업데이트
- 완료 보고 작성
