# BuildFlow

## Product Requirements Document

- Version: 1.0
- Status: Draft
- Brand Name: BuildFlow
- Document Owner: Founder
- Last Updated: 2026-07-14
- Internal Codename: Project Flow

BuildFlow는 사용자 노출 브랜드명이며 Project Flow는 내부 프로젝트 코드명이다. 제품 정의는 AI Workflow Design Platform이며 전략적 포지셔닝은 AI Result Platform이다.

## 1. Executive Summary

Project Flow는 AI Tool 목록을 보여주는 서비스가 아니라, 사용자가 원하는 결과를 만들기 위한 AI Workflow를 설계해 주는 AI Result Design Platform이다. 사용자는 도구를 배우러 오는 것이 아니라 “무엇을 만들고 싶나요?”라는 질문에 답하기 위해 방문한다. 시스템은 목표와 조건을 입력받아 실행 가능한 단계, 적합한 도구, 비용, 난이도, 구축 시간을 구조화해 제안한다. 또한 일부 Workflow는 간단 실행 또는 연결 안내까지 제공한다. 핵심 가치는 추천이 아니라 결과 중심의 실행 가능한 설계다.

## 2. Product Vision

### Mission

AI와 자동화 경험이 없는 사용자도 원하는 결과를 만들 수 있도록 실행 가능한 Workflow를 설계한다.

### Vision

사용자가 여러 AI Tool과 자동화 도구를 직접 비교·학습하지 않아도 목표, 비용, 난이도, 운영 방식에 맞는 실행 구조를 얻을 수 있게 한다.

### Product Philosophy

- Tool보다 결과를 먼저 보여준다.
- 복잡성은 시스템이 처리하고 사용자는 선택만 한다.
- 추천보다 설계가 중요하다.
- 설계보다 실행 가능성이 중요하다.
- 실행보다 지속적인 관리 가능성이 중요하다.

## 3. Problem Definition

### 사용자 문제

- AI Tool이 너무 많다.
- 어떤 도구가 자신의 목적에 맞는지 판단하기 어렵다.
- 여러 도구를 어떻게 연결해야 하는지 모른다.
- 예상 비용과 구축 난이도를 알기 어렵다.
- 추천 콘텐츠는 많지만 실제 실행 가능한 구조는 부족하다.
- 비개발자는 API, Webhook, OAuth, Database 개념에서 이탈한다.
- 자동화 플랫폼을 열어도 빈 캔버스 상태에서 무엇을 해야 할지 모른다.

### 기존 해결 방식의 한계

- AI Tool Directory는 도구 목록만 제공한다.
- 비교 서비스는 기능 차이를 설명하지만 결과 달성 과정을 설계하지 않는다.
- n8n, Make 등은 실행 도구이지만 사용자가 Workflow 자체를 설계해야 한다.
- LLM에게 모든 결정을 맡기면 추천 결과의 일관성과 재현성이 낮다.
- 유튜브·블로그 자료는 최신성, 환경, 비용 조건이 서로 다르다.

### 핵심 기회

사용자가 목표를 입력하면 시스템이 다음을 구조화해서 제공하는 것이다.

- 필요한 단계
- 추천 도구
- 대체 도구
- 예상 비용
- 난이도
- 구축 시간
- 필요한 계정과 API
- 실행 전 준비사항
- 운영 시 주의사항

## 4. Target Users

### Primary Target

1. AI 입문자
2. 1인 사업자
3. 쇼핑몰 운영자
4. 마케터
5. 유튜버 및 콘텐츠 제작자
6. 직장인
7. 비개발자

### Secondary Target

- 소규모 에이전시
- 프리랜서
- 초기 스타트업 운영자
- 자동화를 배우려는 기획자

### Initial Non-Target

- 전문 개발자
- 대규모 엔터프라이즈
- 복잡한 멀티에이전트 시스템을 구축하려는 팀
- 자체 인프라 운영이 필요한 조직

초기에는 개발자를 주요 고객으로 삼지 않는다. 개발자는 도구의 구현과 확장을 직접 수행할 수 있어 Project Flow의 가장 큰 가치인 “비개발자용 결과 중심 설계”와 정면으로 겹치지 않기 때문이다. 또한 초기 제품은 단일 사용자, 단계형 UX, 제한된 Integration 중심으로 설계되므로 개발자 중심 요구사항을 우선하면 MVP 범위가 쉽게 확장된다.

## 5. User Personas

### 1인 쇼핑몰 운영자

- 직업 또는 상황: 자체 쇼핑몰을 혼자 운영하며 상품 등록과 고객 응대를 모두 처리한다.
- 현재 사용 도구: 스마트스토어, Gmail, Google Sheets, ChatGPT
- AI 숙련도: 낮음
- 해결하려는 문제: 상품 설명, FAQ 응대, 리뷰 정리, 주문 후 안내를 줄이고 싶다.
- 가장 큰 불안: 자동화 설정이 어렵고, 잘못 설정하면 고객 응대가 꼬일까 걱정한다.
- Project Flow를 사용하는 이유: 자신의 운영 목적에 맞는 단계별 Workflow를 한 번에 보고 싶다.
- 결제 가능성이 발생하는 지점: 반복 문의 응답과 상품 콘텐츠 자동화가 실제로 시간을 절약한다고 확인될 때.

### 마케팅 담당자

- 직업 또는 상황: 광고, 캠페인, 리드 관리, 콘텐츠 운영을 담당한다.
- 현재 사용 도구: Slack, Google Sheets, Notion, Meta Ads, Gmail
- AI 숙련도: 중간
- 해결하려는 문제: 캠페인 리포트, 리드 분류, 콘텐츠 발행 자동화를 설계하고 싶다.
- 가장 큰 불안: 팀에 설명 가능한 구조가 없으면 승인받기 어렵다.
- Project Flow를 사용하는 이유: 비용과 난이도까지 포함된 Workflow 문서를 빠르게 확보하려고 한다.
- 결제 가능성이 발생하는 지점: 팀 공유 가능한 설계안과 실행 가이드가 제공될 때.

### 유튜브 운영자

- 직업 또는 상황: 쇼츠와 롱폼 콘텐츠를 꾸준히 생산한다.
- 현재 사용 도구: YouTube, Google Drive, CapCut, ChatGPT, Google Sheets
- AI 숙련도: 낮음에서 중간
- 해결하려는 문제: 아이디어 정리, 제목/설명 생성, 업로드 전 검수, 소재 재활용을 자동화하고 싶다.
- 가장 큰 불안: 콘텐츠 품질이 떨어지거나 업로드 흐름이 복잡해질까 걱정한다.
- Project Flow를 사용하는 이유: 콘텐츠 제작 흐름을 도구가 아니라 결과 중심으로 보고 싶다.
- 결제 가능성이 발생하는 지점: 업로드 흐름과 초안 생성 시간이 절반 이하로 줄어들 때.

### 반복 업무가 많은 직장인

- 직업 또는 상황: 보고, 메일, 자료 정리, 회의 후속 조치가 많다.
- 현재 사용 도구: Gmail, Slack, Google Drive, Google Sheets
- AI 숙련도: 낮음
- 해결하려는 문제: 매번 같은 일을 수동으로 처리하지 않게 하고 싶다.
- 가장 큰 불안: 회사 계정과 개인 계정을 연결하는 과정에서 보안 문제가 생길까 걱정한다.
- Project Flow를 사용하는 이유: 회사 상황에 맞는 안전한 Workflow만 보고 싶다.
- 결제 가능성이 발생하는 지점: 보안 조건과 실행 구조가 명확할 때.

### AI를 처음 사용하는 1인 사업자

- 직업 또는 상황: 서비스나 상품을 혼자 운영하며 AI 활용 경험이 거의 없다.
- 현재 사용 도구: 카카오톡, Gmail, Google Drive, Excel
- AI 숙련도: 매우 낮음
- 해결하려는 문제: 어디서부터 시작해야 할지, 무엇을 자동화해야 하는지 모르겠다.
- 가장 큰 불안: 돈을 쓰고도 활용하지 못할까 걱정한다.
- Project Flow를 사용하는 이유: 시작점과 순서를 안내받고 싶다.
- 결제 가능성이 발생하는 지점: 목표 입력만으로 바로 실행 가능한 흐름이 보일 때.

## 6. Jobs To Be Done

사용자는 쇼츠 자동 제작이 필요할 때 짧은 영상 콘텐츠를 빠르게 만들기 위해 Project Flow의 콘텐츠 자동화 Workflow를 사용하고 싶다.

사용자는 쇼핑몰 상품 설명 생성이 필요할 때 상품별 설명과 FAQ를 일관되게 만들기 위해 Project Flow의 상품 콘텐츠 Workflow를 사용하고 싶다.

사용자는 고객 문의 분류가 필요할 때 문의 유형에 따라 처리 우선순위를 나누기 위해 Project Flow의 분류 Workflow를 사용하고 싶다.

사용자는 Gmail과 Slack 연결이 필요할 때 중요한 메일을 팀 알림으로 전송하기 위해 Project Flow의 알림 Workflow를 사용하고 싶다.

사용자는 보고서 자동 작성이 필요할 때 주간 데이터를 요약해 문서로 남기기 위해 Project Flow의 리포트 Workflow를 사용하고 싶다.

사용자는 SNS 콘텐츠 예약이 필요할 때 작성한 콘텐츠를 일정에 맞춰 배포하기 위해 Project Flow의 예약 Workflow를 사용하고 싶다.

사용자는 리뷰 분석이 필요할 때 고객 반응을 정리해 개선 포인트를 찾기 위해 Project Flow의 분석 Workflow를 사용하고 싶다.

사용자는 리드 수집이 필요할 때 문의 폼과 스프레드시트를 연결해 영업 기회를 놓치지 않기 위해 Project Flow의 리드 Workflow를 사용하고 싶다.

사용자는 업무 알림이 필요할 때 반복 업무를 일정과 조건에 따라 자동으로 받기 위해 Project Flow의 알림 Workflow를 사용하고 싶다.

사용자는 PDF 요약 및 저장이 필요할 때 문서 내용을 빠르게 파악하고 보관하기 위해 Project Flow의 문서 처리 Workflow를 사용하고 싶다.

## 7. Value Proposition

### 사용자 가치

- 검색 시간 단축
- 잘못된 도구 선택 방지
- 비용 예측
- 실행 구조 확보
- 비개발자의 진입 장벽 감소

### 사업 가치

- Workflow 데이터 축적
- 추천 정확도 개선
- 반복 사용 가능
- 유료 설계와 관리 기능으로 전환 가능
- 특정 Tool에 종속되지 않는 구조

핵심 문장: “Project Flow의 핵심 자산은 AI Tool 목록이 아니라 검증 가능한 Workflow 지식베이스다.”

## 8. Product Positioning

| 구분 | 기존 서비스 | Project Flow |
| --- | --- | --- |
| 시작점 | Tool 선택 | 원하는 결과 |
| 핵심 제공 가치 | 정보 | 실행 가능한 설계 |
| 사용자 행동 | 직접 비교 | 목표 입력 |
| 출력 | Tool 목록 | Workflow 구조 |
| 비용 정보 | 개별 가격 | 전체 예상 비용 |
| 난이도 | 사용자 판단 | 시스템 분석 |
| 실행 | 외부에서 직접 구성 | 간단 실행 또는 연결 안내 |

### Non-Positioning

Project Flow는 다음이 아니다.

- AI 검색 엔진
- AI Tool Directory
- ChatGPT Wrapper
- n8n 대체 서비스
- 범용 Workflow Builder
- AI Agent Framework
- API 재판매 서비스
- 개발자 IDE

## 9. MVP Goals

MVP의 목표는 다음 세 가지로 제한한다.

1. 추천
2. 설계
3. 간단 실행

### 추천

사용자의 목표와 조건을 기반으로 적합한 Workflow 후보를 제공한다.

### 설계

단계, 도구, 비용, 난이도, 구축 시간, 준비사항을 구조화해 제공한다.

### 간단 실행

모든 Workflow를 직접 실행하는 것이 아니라 지원 가능한 소수의 기능에 대해 테스트 실행 또는 n8n 연결을 제공한다.

## 10. MVP Scope

### 반드시 포함

- 회원가입
- 로그인
- 온보딩
- 목표 입력
- 조건 입력
- Recommendation 생성
- Workflow 결과 페이지
- 단계별 Workflow 보기
- Tool 정보 보기
- 예상 비용
- 난이도
- 예상 구축 시간
- 필요한 API 및 계정 안내
- Project 저장
- Workflow 저장
- 결과 수정 요청
- 제한된 테스트 실행
- Subscription 상태 관리
- Usage 기록

### 조건 입력 예시

- 사용 목적
- 예산
- AI 숙련도
- 개발 가능 여부
- 사용 중인 Tool
- 월간 실행량
- 자동화 수준
- 결과물 형태
- 개인정보 포함 여부

### MVP 제외

- 시각적 노드 기반 Workflow Builder
- Marketplace
- Community
- Workflow 판매
- 복잡한 Plugin Store
- 멀티에이전트
- 실시간 공동 편집
- Enterprise SSO
- 고급 RBAC
- 자체 LLM 호스팅
- 모든 Workflow 직접 실행
- 모바일 앱
- 다국어
- 대규모 팀 기능

## 11. Core User Flow

### 로그인 사용자

```text
Landing
→ 회원가입 또는 로그인
→ 온보딩
→ 새 Project 생성
→ 원하는 결과 입력
→ 추가 조건 입력
→ Recommendation 생성
→ 추천 Workflow 비교
→ Workflow 선택
→ 상세 설계 확인
→ 비용·난이도 확인
→ 필요한 API 연결
→ 테스트 실행 또는 구현 가이드 확인
→ Project 저장
→ Dashboard에서 관리
```

### 비로그인 사용자

```text
Landing
→ 목표 입력
→ 제한된 미리보기
→ 회원가입 유도
→ 전체 결과 확인
```

## 12. Functional Requirements

#### FR-001 회원가입

- 목적: 사용자가 개인 공간에서 Workflow를 저장하고 관리할 수 있게 한다.
- 사용자: 신규 사용자
- 입력: 이메일, 비밀번호 또는 OAuth 정보
- 처리: 계정 생성, 기본 프로필 생성, 약관 동의 기록
- 출력: 로그인 가능한 계정
- 예외: 중복 계정, 인증 실패, 약관 미동의
- MVP 우선순위: High
- 완료 조건: 계정 생성 후 온보딩으로 이동 가능

#### FR-002 로그인

- 목적: 기존 사용자가 자신의 Project와 Workflow에 접근하게 한다.
- 사용자: 등록 사용자
- 입력: 이메일, 비밀번호 또는 OAuth 정보
- 처리: 인증, 세션 생성, 접근 권한 확인
- 출력: 대시보드 진입
- 예외: 비밀번호 오류, 세션 만료, 비활성 계정
- MVP 우선순위: High
- 완료 조건: 정상 로그인 시 사용자 대시보드 접근 가능

#### FR-003 온보딩

- 목적: 초기 사용자에게 목표와 조건 입력 방식을 안내한다.
- 사용자: 신규 사용자
- 입력: 사용 목적, 숙련도, 예산, 사용 도구
- 처리: 사용자 유형 분류, 기본 설정 저장
- 출력: 첫 Project 생성 흐름
- 예외: 필수 질문 미응답, 중도 이탈
- MVP 우선순위: High
- 완료 조건: 온보딩 완료 후 목표 입력 화면으로 이동

#### FR-004 Project 생성

- 목적: 하나의 목표 단위를 독립적으로 관리하게 한다.
- 사용자: 로그인 사용자
- 입력: Project 이름, 설명
- 처리: Project 레코드 생성, 소유권 연결
- 출력: 새 Project 상세 페이지
- 예외: 이름 누락, 권한 없음
- MVP 우선순위: High
- 완료 조건: Project가 저장되고 다시 열 수 있음

#### FR-005 목표 입력

- 목적: 사용자의 원하는 결과를 구조화된 입력으로 받는다.
- 사용자: 로그인 또는 비로그인 사용자
- 입력: 목표 문장, 결과물 형태, 사용 목적
- 처리: 입력 정규화, 카테고리 분류 준비
- 출력: 정규화된 목표 데이터
- 예외: 너무 모호한 입력, 금지된 요청
- MVP 우선순위: High
- 완료 조건: 시스템이 목표를 분류 가능한 상태로 저장

#### FR-006 조건 입력

- 목적: Workflow 추천에 필요한 제약 조건을 수집한다.
- 사용자: 로그인 사용자
- 입력: 예산, 숙련도, 개발 가능 여부, 개인정보 포함 여부 등
- 처리: 필터링 가능한 조건으로 변환
- 출력: 추천 엔진 입력값
- 예외: 상충 조건, 필수 조건 누락
- MVP 우선순위: High
- 완료 조건: 조건 값이 추천 로직에 반영됨

#### FR-007 Recommendation 생성

- 목적: 입력한 목표와 조건에 맞는 Workflow 후보를 생성한다.
- 사용자: 로그인 사용자
- 입력: 목표, 조건, 사용자 맥락
- 처리: Rule Engine, Database 조회, LLM 설명 생성
- 출력: Workflow 후보 목록
- 예외: 후보 없음, 내부 오류, LLM 실패
- MVP 우선순위: High
- 완료 조건: 최소 1개 이상의 구조화된 추천 결과 표시

#### FR-008 Workflow 후보 비교

- 목적: 사용자가 여러 후보를 비교하고 선택할 수 있게 한다.
- 사용자: 로그인 사용자
- 입력: 추천 후보들
- 처리: 비용, 난이도, 구축 시간, 호환성 비교
- 출력: 비교 테이블
- 예외: 후보 수 부족, 데이터 누락
- MVP 우선순위: High
- 완료 조건: 사용자가 후보 간 차이를 이해할 수 있음

#### FR-009 Workflow 상세 보기

- 목적: 선택한 Workflow의 구조를 자세히 보여준다.
- 사용자: 로그인 사용자
- 입력: 선택한 Workflow ID
- 처리: 단계, 도구, 준비사항, 주의사항 조회
- 출력: 상세 Workflow 페이지
- 예외: 권한 없음, 데이터 없음
- MVP 우선순위: High
- 완료 조건: 단계별 구조와 설명이 모두 표시됨

#### FR-010 비용 계산

- 목적: 예상 비용을 전체 관점에서 보여준다.
- 사용자: 로그인 사용자
- 입력: Tool 가격, 사용량, Workflow 단계
- 처리: 비용 추정 규칙 적용
- 출력: 월 예상 비용, 항목별 비용
- 예외: 가격 정보 누락, 외부 가격 변경
- MVP 우선순위: High
- 완료 조건: 사용자에게 합리적인 비용 범위를 표시

#### FR-011 난이도 계산

- 목적: 사용자가 실행 난이도를 판단할 수 있게 한다.
- 사용자: 로그인 사용자
- 입력: 조건, 통합 수, 설정 복잡도
- 처리: 난이도 스코어 계산
- 출력: Low / Medium / High 또는 수치화된 난이도
- 예외: 정보 부족, 조건 상충
- MVP 우선순위: High
- 완료 조건: 난이도 설명이 추천 결과에 함께 표시됨

#### FR-012 구축 시간 추정

- 목적: 실행 준비에 필요한 시간을 예측한다.
- 사용자: 로그인 사용자
- 입력: 단계 수, 연동 수, 설정 필요 항목
- 처리: 추정 규칙 적용
- 출력: 예상 구축 시간
- 예외: 복잡한 변형 케이스
- MVP 우선순위: High
- 완료 조건: 사용자가 준비 시간을 가늠할 수 있음

#### FR-013 Workflow 저장

- 목적: 사용자가 선택한 Workflow를 이후 다시 볼 수 있게 한다.
- 사용자: 로그인 사용자
- 입력: Workflow 선택 상태
- 처리: 저장 레코드 생성
- 출력: 저장된 Workflow 목록
- 예외: 저장 실패, 권한 없음
- MVP 우선순위: High
- 완료 조건: 대시보드에서 다시 불러올 수 있음

#### FR-014 Recommendation 수정

- 목적: 사용자가 결과를 요구에 맞게 재조정할 수 있게 한다.
- 사용자: 로그인 사용자
- 입력: 수정 요청 문장, 조건 변경값
- 처리: 추천 다시 생성
- 출력: 수정된 Workflow 결과
- 예외: 반복 수정 제한, 모호한 요청
- MVP 우선순위: Medium
- 완료 조건: 기존 결과와 다른 버전이 생성됨

#### FR-015 사용자 API 연결

- 목적: 외부 서비스와의 간단 실행을 가능하게 한다.
- 사용자: 로그인 사용자
- 입력: OAuth 정보 또는 API Key
- 처리: 안전한 저장, 연결 상태 검증
- 출력: 연결된 Integration 상태
- 예외: 인증 실패, 권한 부족, 키 형식 오류
- MVP 우선순위: High
- 완료 조건: 연결 상태가 UI에 표시되고 재사용 가능

#### FR-016 테스트 실행

- 목적: 일부 Workflow를 실제로 검증해 볼 수 있게 한다.
- 사용자: 로그인 사용자
- 입력: 실행 대상 Workflow, 연결된 계정
- 처리: 제한된 범위에서 실행, 결과 기록
- 출력: 성공/실패 상태 및 로그
- 예외: 외부 API 오류, 쿼터 초과, 입력 불완전
- MVP 우선순위: High
- 완료 조건: 최소 1개 테스트 실행이 성공적으로 수행됨

#### FR-017 Usage 기록

- 목적: 사용량과 실행 이력을 관리한다.
- 사용자: 로그인 사용자
- 입력: 추천, 조회, 실행 이벤트
- 처리: 이벤트 로그 저장, 집계
- 출력: 사용량 화면, 제한 체크
- 예외: 로그 누락, 저장 실패
- MVP 우선순위: High
- 완료 조건: 사용량이 플랜과 연결되어 보임

#### FR-018 Subscription 제한

- 목적: 플랜별 기능 제한을 적용한다.
- 사용자: 로그인 사용자
- 입력: 구독 플랜, 사용량
- 처리: 권한 체크, 제한 도달 시 차단
- 출력: 접근 가능/불가 상태
- 예외: 결제 상태 불일치, 동기화 지연
- MVP 우선순위: High
- 완료 조건: 제한 초과 시 적절한 안내가 표시됨

#### FR-019 Dashboard

- 목적: Project와 Workflow를 한 곳에서 관리하게 한다.
- 사용자: 로그인 사용자
- 입력: 사용자 식별 정보
- 처리: Project, 저장된 Workflow, Usage 조회
- 출력: 대시보드 화면
- 예외: 데이터 없음, 권한 오류
- MVP 우선순위: High
- 완료 조건: 사용자가 자신의 상태를 한눈에 확인 가능

#### FR-020 Project 삭제

- 목적: 사용자가 불필요한 Project를 정리할 수 있게 한다.
- 사용자: 로그인 사용자
- 입력: 삭제 대상 Project ID
- 처리: 소유권 확인 후 삭제 또는 소프트 삭제
- 출력: 삭제 완료 상태
- 예외: 권한 없음, 복구 정책 충돌
- MVP 우선순위: Medium
- 완료 조건: 삭제된 Project가 목록에서 제거됨

## 13. Recommendation Strategy

```text
User Goal
→ Input Normalization
→ Rule Engine
→ Workflow Candidate Retrieval
→ Tool Compatibility Check
→ Cost Calculation
→ Difficulty Calculation
→ LLM Explanation
→ Final Recommendation
```

### Rule Engine 역할

- 카테고리 분류
- 필수 조건 확인
- 예산 필터
- 사용자 숙련도 필터
- Tool 호환성 확인
- 지원 불가능한 Workflow 제거
- 개인정보 및 보안 조건 확인

### Database 역할

- Tool Metadata 제공
- Workflow Template 제공
- Tool 간 호환 관계 제공
- 가격 정보 제공
- 실행 가능 여부 제공

### LLM 역할

- 사용자 목표 정규화
- 설명 생성
- 추천 이유 생성
- 대안 비교
- Workflow 문장 수정
- 사용자의 수정 요청 반영

### LLM이 결정하면 안 되는 것

- 실제 가격 계산
- 지원 여부
- 결제 권한
- API 연결 상태
- 보안 정책
- Workflow 실행 가능 여부
- Subscription 제한

## 14. Initial Tool Support

### LLM

- OpenAI
- Anthropic Claude
- Google Gemini

### Automation

- n8n

### Backend

- Supabase

### Deployment

- Vercel

### Communication

- Slack
- Gmail

### Productivity

- Google Sheets
- Google Drive

### 초기 제한

- Make는 비교 및 추천 정보만 제공할 수 있다.
- Flowise, CrewAI, LangGraph, Mastra는 초기 실행 대상에서 제외한다.
- Plugin 구조는 문서상 확장 가능하도록 설계하되 MVP 코드에서는 구현하지 않는다.

## 15. Execution Policy

Project Flow는 직접 모든 API 비용을 부담하지 않는다.

### Recommendation

Project Flow API 또는 Project Flow가 계약한 LLM API 사용 가능.

### Execution

사용자가 자신의 API Key 또는 OAuth 계정을 연결한다.

### 원칙

- 실행 API 비용은 사용자 부담
- Project Flow는 API 재판매를 핵심 BM으로 삼지 않음
- 사용자 Secret은 암호화 저장
- 가능하면 OAuth 우선
- API Key는 Server-side에서만 사용
- 브라우저에 Secret 노출 금지
- 사용자별 Usage 분리
- 실행 실패 시 명확한 오류 제공

## 16. Business Model

### Free

- 제한된 목표 입력
- 제한된 Recommendation
- 일부 Workflow 미리보기
- Tool 검색
- 비용 개요

### Pro

- 전체 Workflow 설계
- Project 저장
- Recommendation 수정
- API 연결
- 테스트 실행
- 더 높은 Usage
- 상세 비용 및 구현 가이드

### Premium 또는 Managed

- 고급 Workflow 설계
- 운영 관리
- 오류 점검
- Workflow 개선 제안
- 전문가 지원
- 향후 수동 구축 대행 가능

가격은 아직 확정하지 않고 `TBD`로 둔다.

## 17. Success Metrics

### North Star Metric

주간 기준으로 사용자가 생성하고 저장한 유효 Workflow 수.

### Activation

회원가입 후 첫 Workflow 상세 결과를 확인한 사용자 비율.

### Core Metrics

- 목표 입력 완료율: 목표 입력 화면을 끝까지 작성한 비율
- Recommendation 생성 성공률: 입력 대비 추천 결과가 정상 생성된 비율
- Workflow 저장률: 추천 결과 중 저장된 비율
- Recommendation 수정 요청률: 사용자가 결과를 다시 조정한 비율
- API 연결률: 적어도 하나의 Integration을 연결한 비율
- 테스트 실행률: 테스트 실행 화면까지 도달한 비율
- 실행 성공률: 실행 요청 중 성공한 비율
- 7일 재방문율: 일주일 내 재방문한 사용자 비율
- Free → Pro 전환율: 무료에서 유료로 전환한 비율
- Project당 평균 Workflow 수: 한 Project에 저장된 Workflow 평균 개수
- 사용자당 월간 Recommendation 수: 한 사용자가 한 달에 생성한 추천 수

## 18. Non-Functional Requirements

### Performance

- 일반 페이지 초기 로딩은 체감 지연이 없도록 유지한다.
- Recommendation 응답은 가능한 짧은 시간 내에 제공하고, 긴 작업은 상태를 표시한다.
- 중복 요청을 방지한다.

### Security

- Supabase RLS를 적용한다.
- API Key는 암호화 저장한다.
- Server-only Secret을 사용한다.
- Rate Limiting을 적용한다.
- 입력 검증을 수행한다.
- Audit Log를 남긴다.
- 사용자 데이터를 격리한다.

### Reliability

- Recommendation 실패 시 복구 경로를 제공한다.
- LLM 응답은 Schema 검증을 통과해야 한다.
- 실행 상태를 기록한다.
- 오류 메시지는 표준화한다.
- 재시도 정책을 정의한다.

### Maintainability

- Feature 단위 모듈화
- Database Migration 관리
- TypeScript strict
- Lint 및 Build 필수
- 환경변수 검증
- Provider Adapter 구조
- 자동 생성 코드와 수동 코드 분리

### Accessibility

- 키보드 탐색 지원
- 명확한 Label
- 충분한 대비
- 오류 안내
- 모바일 웹 대응

## 19. Technical Constraints

- MacBook Air M1 개발환경
- 1인 개발
- Next.js
- TypeScript
- Supabase
- PostgreSQL
- Vercel
- OpenAI
- Claude
- Gemini
- GitHub
- n8n
- 초기에는 단일 Web Application
- Microservice 금지
- 과도한 추상화 금지
- 조기 Plugin System 구현 금지
- 복잡한 Event-driven Architecture 금지
- 실제 필요 전까지 Vector Database 도입 금지

## 20. Assumptions

- 사용자는 완벽한 자동화보다 빠른 설계를 먼저 원한다.
- 초기 사용자는 Tool 이름보다 결과 중심 문장을 선호한다.
- 많은 Workflow는 직접 실행보다 가이드와 n8n Template 제공만으로도 가치가 있다.
- 초기 추천 품질은 Tool 수보다 Workflow Template 품질의 영향을 더 크게 받는다.
- 100~200개 Tool 전체를 직접 실행 지원할 필요는 없다.
- 사용자는 자신의 API 비용을 부담할 수 있다.
- 한국어 우선으로 시작한다.

## 21. Risks

- 위험: AI Tool Directory처럼 보일 위험
  - 영향: 제품 포지셔닝이 약해지고 사용자 기대가 흔들린다.
  - 대응: 결과 중심 UI, Workflow 중심 카피, Tool 목록 노출 최소화로 방지한다.

- 위험: 추천 결과의 신뢰 부족
  - 영향: 사용자가 결과를 반복 검증해야 해서 이탈할 수 있다.
  - 대응: Rule Engine 우선, 근거 표시, 추천 이유와 제약 조건을 함께 보여준다.

- 위험: Tool 가격 정보 노후화
  - 영향: 비용 계산이 부정확해진다.
  - 대응: 가격 갱신 시점 표시, 출처 기록, 수동 검수 프로세스를 둔다.

- 위험: Workflow 실행 실패
  - 영향: 핵심 경험이 끊기고 신뢰가 떨어진다.
  - 대응: 제한된 Integration만 지원하고, 실패 시 명확한 복구 안내를 제공한다.

- 위험: 너무 넓은 MVP 범위
  - 영향: 출시가 지연되고 품질이 떨어진다.
  - 대응: 추천, 설계, 간단 실행 3가지만 우선한다.

- 위험: API Key 보안
  - 영향: 치명적인 신뢰 손실이 발생한다.
  - 대응: 암호화 저장, Server-only 사용, RLS, 로그 분리를 적용한다.

- 위험: n8n 종속
  - 영향: 실행 구조가 특정 도구에 묶인다.
  - 대응: 추상화된 Adapter를 두고, 문서상 대체 가능성을 유지한다.

- 위험: 사용자 목표 입력의 모호성
  - 영향: 추천 품질이 떨어진다.
  - 대응: 보조 질문, 예시 입력, 조건 템플릿을 제공한다.

- 위험: LLM 비용 증가
  - 영향: 수익성 악화와 운영 부담이 생긴다.
  - 대응: 캐시, 재사용 가능한 Workflow Template, LLM 사용 범위 제한을 적용한다.

- 위험: 낮은 재방문율
  - 영향: 제품 성장과 유료 전환이 약해진다.
  - 대응: 저장, 수정, 재실행, 운영 관리 기능을 통해 반복 사용 가치를 만든다.

- 위험: 사용자가 설계 결과만 보고 외부에서 직접 구현하는 문제
  - 영향: 전환율이 낮아질 수 있다.
  - 대응: 저장, 수정, 테스트 실행, 운영 관리 기능을 유료 가치로 제공한다.

- 위험: 1인 개발자의 운영 부담
  - 영향: 유지보수와 고객 대응이 과중해진다.
  - 대응: 기능 수를 제한하고, 자동화 가능한 운영 항목부터 설계한다.

## 22. Product Decisions

- MVP는 노드 기반 Builder가 아니라 단계형 Workflow UI를 사용한다.
- MVP 실행은 5~10개 제한된 Integration만 지원한다.
- 초기 Automation 실행 기반은 n8n이다.
- Tool DB보다 Workflow DB를 우선 구축한다.
- Recommendation은 Rule Engine + Database + LLM 구조를 사용한다.
- Project Flow는 사용자 실행 API 비용을 부담하지 않는다.
- PIVUE와 코드, Git, Supabase, 배포를 완전히 분리한다.
- 초기 제품 언어는 한국어다.
- Plugin 구조는 문서 수준에서만 고려하고 구현하지 않는다.
- 복잡한 팀 기능은 Product-Market Fit 이후 개발한다.

## 23. Release Criteria

- 회원가입과 로그인 정상 작동
- 사용자가 Project를 생성할 수 있음
- 목표와 조건을 입력할 수 있음
- 최소 10개 핵심 Workflow Template 제공
- Recommendation 결과가 구조화되어 표시됨
- 비용과 난이도 표시
- Workflow 저장 가능
- 최소 1개의 테스트 실행 성공
- 사용자 데이터 RLS 적용
- 오류 상태 UI 제공
- Usage 제한 적용
- Production Build 성공
- Vercel 배포 성공
- 핵심 이벤트 Analytics 기록
- 개인정보처리방침 및 이용약관 기본 문서 존재

## 24. Initial Workflow Categories

### 콘텐츠 제작

- 쇼츠 아이디어 생성 → 초안 스크립트 → 업로드 메모 자동 저장
- 블로그 주제 수집 → 초안 작성 → Google Drive 저장

### 마케팅

- 캠페인 리포트 수집 → 요약 → Slack 공유
- 리드 입력 → 분류 → 후속 메일 초안 생성

### 쇼핑몰

- 상품 정보 입력 → 설명 생성 → Google Sheets 정리
- 리뷰 수집 → 긍정/부정 분류 → 개선 포인트 요약

### 고객 상담

- 문의 접수 → 유형 분류 → 답변 초안 생성
- 자주 묻는 질문 → 응답 템플릿 생성 → Gmail 연동

### 업무 생산성

- 회의 메모 → 할 일 추출 → Slack 알림
- 반복 업무 일정 → 자동 리마인더 → 주간 보고서 작성

### 문서 처리

- PDF 업로드 → 요약 → Drive 저장
- 계약서 검토 → 핵심 조항 추출 → 검토 메모 생성

### 이메일 자동화

- 중요 메일 감지 → Slack 알림 → 대응 초안 작성
- 메일 분류 → 라벨링 → 스프레드시트 기록

### 데이터 정리

- CSV 업로드 → 중복 제거 → Sheets 정리
- 입력 폼 데이터 → 표준화 → DB 저장

### 알림 및 보고

- 매일 KPI 수집 → 요약 → Slack 전송
- 임계치 초과 감지 → 알림 발송 → 로그 저장

### 리드 수집

- 폼 제출 → 리드 등록 → 후속 메일 발송
- 랜딩 페이지 문의 → 유형 분류 → CRM용 스프레드시트 저장

## 25. Open Questions

- 최종 브랜드명: `TBD`
- 요금제 가격: `TBD`
- 무료 Recommendation 횟수: `TBD`
- API Key 암호화 방식: `TBD`
- n8n Cloud와 Self-hosted 중 초기 지원 범위: `TBD`
- 사용자 Workflow 수정 UX: `TBD`
- 관리형 서비스 제공 시점: `TBD`
- Tool 가격 정보 갱신 주기: `TBD`
- Recommendation 품질 평가 방식: `TBD`
- 초기 10~15개 Workflow Template 선정: `TBD`
- Analytics 도구: `TBD`
- 결제 Provider: `TBD`
- 한국 외 시장 진출 시점: `TBD`

## 작성 원칙

- 한국어로 작성한다.
- 실제 개발자가 읽고 구현할 수 있는 수준으로 작성한다.
- 추상적인 홍보 문구보다 요구사항을 우선한다.
- 같은 내용을 반복하지 않는다.
- 긴 문단보다 명확한 제목, 표, 목록을 사용한다.
- 현재 확정되지 않은 가격이나 수치는 임의로 만들지 않는다.
- MVP와 미래 기능을 명확히 분리한다.
- 1인 개발 현실성을 최우선으로 한다.
- Project Flow를 AI Tool Directory로 표현하지 않는다.
- “AI Result Platform”과 “AI Workflow 설계 플랫폼”이라는 정의를 일관되게 사용한다.
