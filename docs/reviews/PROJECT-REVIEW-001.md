# PROJECT-REVIEW-001 — BuildFlow Product Audit

## Executive decision

**판정: CONDITIONALLY INVESTABLE / NOT YET PUBLIC-BETA READY**

BuildFlow는 Requirement에서 Architecture, Build Plan, 승인, 실행, 검증, Package Export·Import까지 연결된 강한 제품 구조를 갖고 있다. 특히 결과 중심 설계, 승인 경계, Secret 보호, 영속 상태, BPS Package 규격은 경쟁력 있는 기반이다.

다만 현재의 가장 큰 위험은 기능 부족이 아니라 **증거 부족**이다. 대표 GitHub·Supabase·Vercel 경로의 실제 자동 구축, 실제 URL Health Check, Production Ready 결과 전달, 다중 사용자 RLS 거부 흐름이 운영 환경에서 완전히 증명되지 않았다. 수익 모델과 무료·유료 경계도 아직 제품 약속과 연결되지 않았다.

현재 적합한 단계는 공개 Beta가 아니라 **통제된 Design Partner Pilot 및 RC Evidence 준비**다.

## Audit method

이번 Audit은 구현 코드를 검토하지 않았다. 다음 문서만 근거로 사용했다.

- Project Bible, Master PRD, Architecture, Roadmap
- Technical Debt, Release Notes, 기존 Product Review
- E2E, Execution QA, AUTO, MARKET, HARDEN Sprint Reports
- BuildFlow Design Language
- AI Communication Language
- PRODUCT-REVIEW-003.5

점수는 구현 주장보다 사용자·구매자·도입 담당자가 확인할 수 있는 증거를 우선한다.

## Scorecard

| 영역 | 점수 | 판단 |
|---|---:|---|
| Product | 84 | 문제와 방향은 선명하나 ICP와 첫 구매 이유를 더 좁혀야 함 |
| UX | 82 | Outcome First와 진행·승인 UX는 강해졌으나 실제 피로도 측정이 없음 |
| UI / Design | 86 | Design Language가 강하나 전체 화면 적용과 Design Review 증거가 필요 |
| AI Experience | 89 | AI Chief Engineer 정체성과 Narrative가 차별화 요소로 발전 |
| Automation | 81 | 계약·상태·재개는 강하나 대표 Live Provisioning 경로 미증명 |
| Marketplace Readiness | 85 | BPS, Builder, Installer가 준비됨. 유통·신뢰·운영 모델은 이후 범위 |
| Architecture | 91 | 도메인 분리, Snapshot, Package 계약, 영속 상태가 강점 |
| Security | 90 | Secret·RLS·소유권 원칙은 강하나 실제 다중 계정 증거가 부족 |
| Performance / Resilience | 76 | 상태 복원과 retry 모델은 있으나 Queue·장시간 실행·부하 증거가 없음 |
| Business | 60 | 가치 가설은 있으나 가격·플랜·유료 전환 지점·단위 경제가 미확정 |

**종합 점수: 82 / 100**

제품 기반은 투자 검토가 가능한 수준이다. 공개 출시 판단은 Automation, Performance, Business, RC Evidence가 제한한다.

## Product audit

### 누구를 위한 제품인가

가장 적합한 초기 고객은 개발팀을 완전히 대체하려는 사용자가 아니라 다음 조건을 가진 고객이다.

- 표준적인 AI Agent 또는 AI Web App을 빠르게 만들려는 비개발 창업자
- 반복 업무를 AI 시스템으로 전환하려는 SMB 운영자
- 요구사항은 알지만 Architecture·Provider·배포 판단이 어려운 Product Owner
- 외부 개발사에 맡기기 전 작동 가능한 Pilot과 명확한 구축 계획이 필요한 팀

초기 비대상은 규제 산업의 핵심 시스템, 대규모 엔터프라이즈 인프라, 고도의 맞춤형 운영 플랫폼이다.

### 차별점

BuildFlow의 차별점은 단순 코드 생성이 아니다.

1. 목표를 Requirement와 Architecture로 구조화한다.
2. 비용·자동화율·사용자 작업을 시작 전에 설명한다.
3. Credential·비용·권한을 승인 경계 안에 둔다.
4. 중단 후 서버 상태에서 재개한다.
5. 검증된 결과만 Production Ready 판단에 사용한다.
6. 결과를 BPS Package로 내보내고 복원할 수 있다.

이 조합은 “AI 코딩 도구”보다 “AI 프로젝트 매니저”라는 포지션을 지지한다.

### 첫 5분 이해도

Build Summary, Architecture 후보 비교, 예상 시간·비용, 사용자 작업 안내로 이해 기반은 마련됐다. 그러나 기존 Review에서 기술 용어, 여러 Summary 영역, 실제 완료 화면 부재가 확인됐다. 최초 사용자가 5분 안에 이해한다는 실사용 증거는 아직 없다.

## User journey and fatigue audit

아래 수치는 문서 기반 추정이며 실제 telemetry가 아니다.

| 단계 | 예상 사용자 개입 | 주요 이탈 위험 |
|---|---:|---|
| 목표 입력 | 1회 | 기대 가능한 결과가 즉시 보이지 않으면 이탈 |
| Clarification | 1~4회 | 반복 질문 또는 질문 이유가 불명확할 때 피로 |
| 비용·자동화 선택 | 1회 | 추정치 신뢰 근거가 약하면 선택 보류 |
| Architecture 선택 | 1회 | Provider 중심 설명이면 비개발자 혼란 |
| 계정·Credential 준비 | 2~3회 | 가장 큰 이탈 구간 |
| 통합 승인 | 1회 목표 | 비용·권한 영향이 불명확하면 승인 거부 |
| 외부 USER_ACTION | 0~2회 | 완료 후 자동 재개 확신이 없으면 이탈 |
| 구축 중 재방문 | 1회 이상 | 장시간 실행과 현재 상태 신뢰가 핵심 |
| 완료 확인 | 1회 | URL·사용법·운영 상태가 없으면 가치 미완성 |

현재 예상 최소 개입은 약 7회, Provider 연결이 필요한 웹앱은 약 10~14회다. RC 전에는 실제 사용자 세션으로 클릭, 입력, 승인, 중단, 복사·붙여넣기 횟수를 측정해야 한다.

## UI and Design audit

### 강점

- Outcome First 정보 우선순위가 문서로 고정됨
- Dark Theme layer, Border, Radius, Accent 규칙이 존재
- AI Narrative와 Confidence Language가 Design과 연결됨
- Progress와 Approval이 기술 화면에서 업무 보고 화면으로 이동

### 남은 위험

- Design Language의 전체 화면 적용 여부를 검증하는 공식 Design Review가 없음
- Project Detail에 여러 기존 Summary가 쌓여 정보 밀도가 다시 높아질 가능성
- Production Ready와 Failure 화면은 브랜드의 최종 인상을 결정하지만 아직 완성 근거가 부족
- 모바일·태블릿 실사용 검증 증거가 없음

### Design Review gate

모든 신규 UI는 다음 항목을 YES/NO로 기록해야 한다.

- Outcome First
- AI Narrative
- Visual hierarchy
- Border and layer hierarchy
- AI Presence
- Confidence Language
- Responsive consistency
- BuildFlow identity

## AI Experience audit

BuildFlow의 가장 강한 브랜드 자산은 “조용하지만 유능한 AI Chief Engineer”다. Requirement, 진행, 승인, 복구, 완료를 하나의 목소리로 연결할 수 있는 언어 규칙이 있다.

현재 위험은 AI가 실제로 판단·예측하는 것처럼 보이지만, 일부 진행률과 시간 예측은 정적 heuristic일 수 있다는 점이다. Confidence Language를 적용해 측정값, 추정값, 실환경 검증값을 구분해야 한다.

## Automation audit

| 구분 | 현재 판단 |
|---|---|
| 자동 | Requirement 구조화, Architecture·Build Plan 생성, 상태 저장, Package Export·Import |
| 반자동 | Credential 이후 Provider 설정, 승인 후 실행, 일부 Verification |
| 사용자 입력 | Credential, OAuth, Consent, 비용·권한 승인 |
| 사용자 작업 | API 미지원 Provider 단계, Supabase Project 준비 가능성 |
| 전문가 필요 | 규제·보안·고도 커스텀 인프라 |
| 미증명 | GitHub → Supabase → Vercel → URL Health Check 실제 대표 경로 |

자동화 계약은 강하지만 “실제로 어디까지 자동인가”에 대한 공개 제품 문구는 Live Evidence와 정확히 맞춰야 한다.

## Marketplace audit

BPS v1.0, Package Builder, Installer, checksum, compatibility, Secret 제외 규칙은 Marketplace 이전 기반으로 충분히 강하다.

Marketplace 확장 전 필요한 것은 UI가 아니라 다음 운영 계약이다.

- Publisher 신뢰와 Package 검수
- 악성 Artifact·Installer 정책
- Version 지원 기간과 deprecation
- Dependency resolution 실패 처리
- 유료 Package 환불·라이선스·책임 범위
- 설치 후 Provider 비용과 운영 책임 표시

따라서 Marketplace는 RC Evidence와 핵심 제품 유료 가치 검증 이후가 적절하다.

## Architecture and maintainability audit

Snapshot, Domain Engine, persisted Session, Verification, BPS Package 경계는 확장에 유리하다. 기존 기능을 폐기하지 않고 Builder Domain으로 번역한 점도 전환 비용을 줄인다.

주요 위험은 문서 Source of Truth의 노후화다. Master PRD는 일부 Engine을 아직 “미구현 Foundation”으로 설명하고, STATUS의 Latest Known Commit도 실제 진행보다 뒤처져 있다. 제품·운영 문서가 현재 구현 수준과 불일치하면 투자·QA·출시 판단이 흔들린다.

## Security audit

### 강점

- Secret 원문을 LLM, Snapshot, Event, Error, Package에 포함하지 않는 원칙
- Project owner RLS와 Server Action 소유권 재검증
- Provider response body 저장 금지
- 승인 범위를 벗어난 외부 작업 차단
- Package Export·Import에서 Credential 값 제외

### 출시 전 증거 부족

- 다른 계정의 Project 접근 거부
- 실제 로그인·재로그인·다른 브라우저·다른 Device
- 실제 Supabase RLS와 소유권 차단
- 실제 Provider Credential rotation·expiration 후 동작

Security 설계 점수는 높지만 공개 Beta 승인은 실환경 증거가 필요하다.

## Performance and resilience audit

상태 영속화, idempotency, retry, timeout, resume, recovery 상태는 존재한다. 그러나 다음은 문서상 실증되지 않았다.

- 장시간 실행 Queue와 worker 생존성
- 동시 Build Session 제한
- Provider rate limit 시 backoff
- 서버 재시작 중 실행 중 작업 인계
- 대규모 Project Snapshot과 Package 크기
- 실제 P95 대기 시간과 복구 시간

RC에서는 기능 추가보다 이 항목들의 실패 주입과 관측이 우선이다.

## Business audit

### 사용자가 돈을 낼 이유

사용자는 코드 생성에 돈을 내는 것이 아니라 다음 결과에 돈을 낸다.

- 요구사항과 Architecture 판단 시간을 줄임
- 개발자 없이 작동 가능한 Pilot을 얻음
- Credential·권한·비용 위험을 한 번에 관리
- 구축 중단 후에도 이어지는 책임 있는 진행
- Production Ready 근거와 운영 시작 정보를 받음
- 결과를 Package로 보존·복제

### 권장 무료·유료 경계

무료는 목표 분석, Requirement 요약, 제한된 Architecture Preview와 대략적 시간·비용 Estimate까지 제공하는 것이 자연스럽다.

유료 가치는 Autonomous Build Session, 실제 Provisioning·Deployment, 반복 Verification, Production Ready Report, Package Export·Import, 운영 상태 이력에 둔다.

가격은 Provider 비용과 분리해야 한다. BuildFlow 구독료, 외부 서비스 예상 비용, 실제 발생 비용을 명확히 구분해야 한다.

### 현재 판단

비개발 사용자가 지금 즉시 월 구독료를 낼 가능성은 제한적이다. 실제 구축 성공 사례와 운영 결과가 없기 때문이다. 반면 Design Partner Pilot, 구축 성공 기반 과금, 제한된 유료 Concierge 형태로는 충분히 검증 가능하다.

## Investment and adoption questions

### 내가 투자자라면 투자하는가

**조건부 예.** 도메인 구조, 보안 경계, Package portability, AI Chief Engineer 포지션은 매력적이다. 다만 다음 투자 단계의 핵심 증거는 코드량이 아니라 실제 구축 성공률, 사용자 개입 횟수, 완료 시간, 유료 전환 의사다.

### 내가 비개발자라면 구독하는가

**현재는 유료 Pilot에는 참여하지만 장기 구독은 보류한다.** 실제 서비스 URL과 운영 가능한 결과를 반복적으로 받는 증거가 필요하다.

### 내 회사에 도입하는가

**내부 Pilot은 예, 핵심 Production 도입은 아직 아니다.** RLS·Credential·Provider·복구의 실환경 Evidence와 운영 SLA가 필요하다.

## Findings

### Critical — 3

1. **CR-001 Live Provisioning Evidence** — GitHub 저장소, Supabase Schema/RLS, Vercel Deployment, URL Health Check의 대표 경로가 실환경에서 증명되지 않음.
2. **CR-002 Production Ready Evidence** — URL, Health, 필수 Verification, 기능 테스트, Critical 없음, 백업·모니터링을 사용자 결과로 전달하는 실환경 증거가 없음.
3. **CR-003 Production Security Evidence** — 실제 다른 계정·브라우저·Device에서 RLS와 Project Ownership 차단 증거가 불완전함.

### Major — 10

1. 첫 5분 이해도와 전체 클릭·입력·승인 횟수의 실사용 측정 없음.
2. Credential 준비가 Provider별로 분산되어 가장 큰 이탈 지점이 될 가능성.
3. Deployment Session 복원 기반과 실제 사용자 화면 복원 증거가 분리돼 있음.
4. 장시간 Build Queue, worker restart, rate limit, backoff 실증 없음.
5. 비용 Estimate가 정적 heuristic이며 billing-grade가 아님.
6. 무료·유료 플랜, 과금 단위, 유료 전환 지점이 미확정.
7. Master PRD, STATUS, Release Notes 등 Source of Truth가 현재 제품 수준과 일부 불일치.
8. 전체 화면에 대한 Design Review와 Brand Review 기록 체계가 없음.
9. Marketplace 운영 신뢰·검수·라이선스·책임 정책이 정의되지 않음.
10. 실제 고객 성공 사례와 반복 가능한 대표 Package가 없음.

### Minor — 8

1. Architecture 설명에서 Provider 이름이 결과 역할보다 앞설 수 있음.
2. Project Detail의 Summary 누적으로 정보 밀도가 높아질 위험.
3. 실제 예상 시간 대비 완료 시간 비교가 없음.
4. 모바일·태블릿 Design Language 검증 증거 없음.
5. 반복 질문과 복사·붙여넣기 횟수 telemetry 없음.
6. Package READY와 외부 Production Ready 용어 혼동 가능성.
7. 기술 상세 보기의 정보 우선순위가 화면별로 달라질 가능성.
8. Review 문서가 코드 Commit과 분리되면서 누락될 운영 위험.

### Future — 7

1. Marketplace Search, Rating, Community
2. 신규 Provider 확대
3. 고급 Self-Healing과 대체 Provider
4. Enterprise SSO·조직 정책
5. 규제 산업용 Compliance Pack
6. 개인화된 AI Chief Engineer
7. Hosted Agent와 운영 대행

## Recommended roadmap

### Gate 1 — Evidence and completion

1. **HARDEN-004 — Production Ready Experience**
2. **HARDEN-005 — Failure & Recovery Experience**
3. **STABILIZE-RC-001 — Session Restore, Source-of-Truth and Completion Integrity**

### Gate 2 — Live capability proof

4. **RC-EVIDENCE-001 — GitHub·Supabase·Vercel Live Provisioning**
5. **RC-SECURITY-001 — Multi-account RLS, Ownership and Credential Evidence**
6. **RC-RESILIENCE-001 — Queue, Restart, Timeout, Rate Limit and Recovery**

### Gate 3 — Product and business validation

7. **PILOT-001 — Three Design Partner Builds**
8. **BUSINESS-001 — Pricing, Plan Boundary and Cost Disclosure**
9. **UX-EVIDENCE-001 — Click, Input, Approval, Waiting and Completion Metrics**

### Gate 4 — Expansion

10. **AUTO-004 — Self-Healing Engine**, Pilot failures에 근거해 범위 확정
11. **Marketplace**, 핵심 Build 성공률과 유료 가치 확인 후 진행
12. **RC → Beta → Launch**

새 Provider와 Marketplace 확장보다 실제 대표 경로의 성공률과 사용자 결과 증명이 먼저다.

## Final recommendation

BuildFlow는 기술적인 MVP Foundation을 넘어 제품 형태를 갖췄다. 다음 단계의 성공 기준은 기능 수가 아니다.

- 대표 Build 성공률
- 평균 사용자 개입 횟수
- 목표 입력에서 사용 가능한 URL까지 걸린 시간
- 자동 복구율
- Production Ready 오판 0건
- Pilot 고객의 재사용·지불 의사

이 지표가 확보되기 전에는 “공개 Beta Ready”를 선언하지 않는다.
