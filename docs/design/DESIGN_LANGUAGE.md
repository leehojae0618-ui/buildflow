# BuildFlow Design Language v1

## Document status

- Status: **APPROVED**
- Role: BuildFlow UI/UX visual source of truth
- Product identity: **AI Agent Command Center**
- Experience principles: **Outcome First · Living Neural Network · Evidence First**
- Communication source of truth: `docs/brand/AI_COMMUNICATION_LANGUAGE.md`

이 문서는 앞으로 생성하거나 수정하는 모든 BuildFlow 화면의 기본 디자인
계약이다. 개별 페이지에서 새로운 색상, radius, glass, shadow, motion,
navigation pattern을 임의로 추가하지 않는다.

문서 승인은 기존 화면 전체가 이미 v1을 준수한다는 의미가 아니다. 기존
화면은 점진적으로 이 문서에 맞춰 전환하고, 별도 UI 적용 Sprint와 Design
Review를 통과한 화면만 v1 적용 완료로 판단한다.

---

## 1. Core identity

> BuildFlow는 AI Agent를 만드는 도구 모음이 아니라, 사용자가 AI 개발팀에
> 결과를 맡기고 진행 상황과 Evidence를 인수하는 AI Agent Command Center다.

사용자는 Workflow를 설계하거나 Provider Command를 조작하지 않는다.
원하는 결과를 설명하고, 비용·권한·외부 변경처럼 중요한 순간만 승인한다.
BuildFlow는 그 사이의 설계·구축·배포·검증을 조용히 이어간다.

화면이 전달해야 하는 감정은 다음과 같다.

```text
내가 AI를 조작하고 있다
          ↓
AI 개발팀에 업무를 맡겼다
          ↓
AI가 계속 진행하고 있다
          ↓
나는 중요한 결정만 승인한다
          ↓
검증된 결과와 Evidence를 인수한다
```

### 1.1 Brand keywords

- AI Agent Command Center
- Outcome First
- Living Neural Network
- Evidence First
- Dark Luxury
- Quiet Confidence
- Controlled Autonomy

### 1.2 Visual character

BuildFlow는 JARVIS에서 영감을 받은 전문 업무 공간이다.

허용:

- 어두운 고대비 Canvas
- 절제된 Electric Blue와 Neon Violet
- 낮은 강도의 Neural Network 배경
- 상태에 반응하는 느린 빛의 흐름
- 명확한 Panel hierarchy
- 중요한 순간에만 나타나는 glow

금지:

- 영화 HUD를 모방한 과도한 SF 장식
- 화면 전체를 덮는 강한 neon
- 지속적으로 움직이는 particle noise
- 가독성을 해치는 glass와 blur
- 모든 요소에 적용한 glow
- 상태와 무관한 가짜 AI activity

시각 효과는 AI가 실제로 일하는 상태를 설명해야 하며, 장식만을 위해
사용하지 않는다.

---

## 2. Experience hierarchy

모든 주요 화면은 다음 순서를 따른다.

1. 완료 후 사용할 수 있는 결과
2. 현재 AI가 수행하는 일
3. 전체 진행률과 예상 남은 시간
4. 예상 또는 발생 비용
5. 사용자가 해야 할 작업과 승인
6. Verification과 Evidence
7. 기술 상세

기본 화면은 시스템 구조보다 사용자가 얻는 결과를 먼저 보여준다.

```text
완료되면 사용할 수 있습니다.

✓ 고객 문의 자동 분류
✓ AI 답변 초안 생성
✓ 문의 내역 저장
✓ 담당자용 관리 화면
```

기술 정보는 삭제하지 않고 `기술 상세 보기`로 분리한다.

---

## 3. Official visual theme

### 3.1 Theme

```text
Dark Luxury
+ Professional Command Center
+ Living Neural Network
+ Restrained AI Presence
```

검은 배경 위에 정보 계층이 선명해야 한다. Cyan과 Violet은 AI 상태와
연결을 표현하고, Orange는 승인·주의·비용, Green은 검증된 성공에만
사용한다.

### 3.2 Color tokens

새 UI는 의미 기반 token을 사용한다. 원시 색상 값을 컴포넌트에 직접
반복하지 않는다.

| CSS token | Value | 역할 |
|---|---:|---|
| `--bf-bg-canvas` | `#05070D` | 전체 Canvas |
| `--bf-bg-section` | `#080B14` | Section layer |
| `--bf-bg-panel` | `rgba(13, 18, 31, .78)` | 기본 glass Panel |
| `--bf-bg-panel-strong` | `rgba(17, 23, 39, .92)` | 중요 Panel |
| `--bf-bg-interactive` | `rgba(25, 33, 54, .82)` | 선택·입력 영역 |
| `--bf-text-primary` | `#F7FAFF` | 결과·제목 |
| `--bf-text-secondary` | `#AAB5C7` | 상태·설명 |
| `--bf-text-muted` | `#758197` | 보조·기술 상세 |
| `--bf-accent-primary` | `#53D8FF` | Electric Blue, AI active |
| `--bf-accent-secondary` | `#7B61FF` | Neon Violet, 연결·보조 강조 |
| `--bf-accent-approval` | `#FF9F43` | 승인·주의·비용 |
| `--bf-accent-success` | `#4ADE80` | 검증 완료 |
| `--bf-accent-error` | `#FF6B6B` | 실패·차단·파괴적 위험 |
| `--bf-border-default` | `rgba(158, 176, 207, .18)` | 기본 경계 |
| `--bf-border-hover` | `rgba(83, 216, 255, .38)` | Hover |
| `--bf-border-active` | `rgba(83, 216, 255, .68)` | AI active·selected |
| `--bf-border-approval` | `rgba(255, 159, 67, .62)` | 승인 필요 |
| `--bf-overlay-scrim` | `rgba(2, 4, 10, .72)` | Dialog 배경 |

Orange는 일반 장식에 사용하지 않는다. Red는 단순한 승인 대기에 사용하지
않고, 보안 위험·실패·파괴적 작업처럼 즉각적인 주의가 필요한 상태에만
사용한다. 일반 Approval badge와 pulse는 Orange를 사용한다.

### 3.3 Contrast

- Canvas, Section, Panel, Interactive Panel은 어두운 Theme에서도 서로
  구분되어야 한다.
- 본문 텍스트와 핵심 Action은 WCAG AA 수준의 대비를 목표로 한다.
- 색상만으로 상태를 구분하지 않는다. Label, icon, border, 설명을 함께
  사용한다.
- Neural background와 glow는 본문 대비를 낮추지 않아야 한다.
- Glass 뒤의 배경이 복잡한 경우 불투명도를 높여 가독성을 우선한다.

---

## 4. Living Neural Network

Neural Network는 BuildFlow의 AI Presence를 표현하는 공통 배경 layer다.
정적인 장식 이미지가 아니라 실제 Session 상태에 반응하는 낮은 강도의
시각 신호로 사용한다.

### 4.1 State behavior

| Product state | Neural response |
|---|---|
| Idle | 거의 정적인 저대비 node와 연결선 |
| Analyzing / Planning | 제한된 영역에 느린 light flow |
| Building | 현재 작업 영역과 연결된 node가 순차 반응 |
| Waiting for user | 움직임을 낮추고 Approval 또는 Action 영역만 강조 |
| Recovering | Orange 계열의 짧고 느린 pulse |
| Verified | Green accent가 Evidence 영역에만 표시 |
| Completed | 전체 network가 한 번 부드럽게 밝아진 뒤 Idle로 복귀 |
| Failed / Blocked | Red를 배경 전체에 퍼뜨리지 않고 문제 영역에만 표시 |

### 4.2 Background rules

- Decorative layer는 `pointer-events: none`이어야 한다.
- 기본 opacity는 낮게 유지한다.
- 입력창, 본문, Dialog 뒤에서는 contrast mask를 사용한다.
- 실제 Session 상태와 연결되지 않은 임의의 “작업 중” animation을 만들지
  않는다.
- 완료 pulse는 한 번만 재생한다.
- 같은 화면에 여러 개의 경쟁하는 pulse를 사용하지 않는다.
- GPU와 배터리 사용량을 고려해 node와 line 수를 제한한다.
- 이미지 asset을 사용할 경우 Secret, Project 데이터, 사용자 콘텐츠를
  합성하지 않는다.

### 4.3 Reduced motion

`prefers-reduced-motion: reduce`에서는 다음을 적용한다.

- light flow와 breathing glow 중단
- 완료 pulse를 짧은 opacity 변화로 대체
- progress 위치 변화는 즉시 또는 짧은 fade로 처리
- 정보와 상태 전달은 animation 없이도 동일해야 함

---

## 5. Layer and panel system

### 5.1 Layout layers

| Layer | 역할 | 표현 |
|---|---|---|
| Layer 0 | Canvas | `#05070D`, Neural background |
| Layer 1 | Section | 넓은 여백, 낮은 대비의 영역 구분 |
| Layer 2 | Panel | glass, light border, 24px radius |
| Layer 3 | Interactive Panel | 더 높은 contrast, hover·selected 상태 |
| Layer 4 | Floating / Approval | shadow, 집중 border, 제한된 glow |

Panel은 floating workspace처럼 보여야 하지만 서로 겹쳐 보이거나 정보
계층을 흐리면 안 된다.

### 5.2 Glass rules

모든 주요 Card는 다음 조합을 기본으로 한다.

```text
Dark translucent surface
+ controlled backdrop blur
+ 1px light border
+ restrained shadow
+ state-specific glow
```

- 기본 blur 권장 범위: `12px`~`20px`
- blur를 사용할 수 없는 환경에서는 불투명 Panel fallback을 제공한다.
- 작은 반복 Card에 강한 blur를 중복 적용하지 않는다.
- 긴 본문과 표는 glass보다 읽기 쉬운 solid surface를 우선할 수 있다.

### 5.3 Radius tokens

| Token | Value | 사용 |
|---|---:|---|
| `--bf-radius-control` | `12px` | 작은 Input, Button, Badge |
| `--bf-radius-card` | `20px` | 반복 Card |
| `--bf-radius-panel` | `24px` | 기본 Panel |
| `--bf-radius-floating` | `28px` | Approval, Dialog, Floating Panel |
| `--bf-radius-pill` | `999px` | Status pill, compact filter |

주요 Panel은 20~28px 범위를 사용한다. 32px 이상의 radius는 특별한 Brand
surface가 아닌 이상 새로 추가하지 않는다.

### 5.4 Border states

| State | Border |
|---|---|
| Default | 1px soft border |
| Hover | Electric Blue opacity 증가 |
| Selected | 명확한 Electric Blue 또는 Violet border |
| AI Active | accent border + 낮은 강도의 breathing glow |
| Approval | Orange border + 제한된 pulse |
| Verified | Green border 또는 check accent |
| Warning | Orange border + 영향 설명 |
| Error | Red border + 원인·영향·해결 |

Border를 숨기지 않는다. Dark Theme에서 배경색 차이만으로 정보 계층을
만들지 않는다.

### 5.5 Elevation and glow

| Token | 권장 값 | 사용 |
|---|---|---|
| `--bf-shadow-panel` | `0 16px 48px rgba(0,0,0,.28)` | Floating Panel |
| `--bf-glow-ai` | `0 0 32px rgba(83,216,255,.12)` | 실제 AI active |
| `--bf-glow-violet` | `0 0 36px rgba(123,97,255,.10)` | 연결·선택 |
| `--bf-glow-approval` | `0 0 28px rgba(255,159,67,.14)` | 승인 필요 |
| `--bf-glow-success` | `0 0 24px rgba(74,222,128,.10)` | Verification PASS |

Glow는 상태를 의미해야 한다. 모든 Card에 동일한 glow를 적용하지 않는다.

---

## 6. Spacing and typography

### 6.1 Spacing

4px base scale을 사용한다.

```text
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80
```

- Panel 내부 기본 padding: Desktop `24~32px`, Mobile `20px`
- 주요 Section 간격: `40~64px`
- 관련 정보 간격: `12~20px`
- Action group 간격: `12~16px`
- 긴 화면은 정보 밀도를 높이기보다 progressive disclosure를 사용한다.

### 6.2 Information typography

텍스트 계층은 다음 순서를 따른다.

1. 결과
2. 현재 상태
3. 핵심 설명
4. Metric과 Evidence
5. 기술 정보

권장 성격:

- 굵고 명확한 결과 제목
- 충분한 line-height와 whitespace
- 짧은 AI status 문장
- 숫자와 비용은 scan하기 쉬운 tabular 표현
- 기술 ID와 safe code만 monospace 사용
- 장식적인 all-caps와 과도한 letter spacing 금지

문구 자체는 `AI_COMMUNICATION_LANGUAGE.md`를 따른다.

---

## 7. Motion system

Motion은 AI가 살아 있다는 느낌을 주되 사용자의 집중을 방해하지 않는다.

| Token | Duration | 사용 |
|---|---:|---|
| `--bf-motion-fast` | `160ms` | Hover, focus |
| `--bf-motion-base` | `240ms` | Panel, state transition |
| `--bf-motion-flow` | `600ms` | Progress 이동 |
| `--bf-motion-presence` | `2800ms` | Breathing glow |
| `--bf-motion-neural` | `6000ms` 이상 | Background light flow |

허용:

- Neuron pulse
- 느린 gradient flow
- state border glow
- Approval pulse
- Agent build line
- 짧은 fade와 floating transition

금지:

- 반복 bounce
- 빠른 flashing
- 상태와 무관한 loading loop
- 주요 정보를 늦게 보여주는 entrance animation
- 완료를 과장하는 confetti

---

## 8. First-screen contract

첫 화면은 Project Dashboard가 아니라 Agent Command Input이다.

가장 먼저 보여주는 질문:

> **무엇을 대신할 AI Agent를 구축할까요?**

기본 구조:

1. Product promise
2. 큰 Agent goal input
3. 결과 중심 추천 Prompt
4. 입력 Mode 선택
5. 진행 중이거나 인수 가능한 Agent 요약

Mode:

- `빠른 입력`: 목표를 한 번에 설명하고 BuildFlow가 필요한 것만 질문
- `대화형 입력`: 복잡한 요구사항을 단계적으로 정리

첫 화면에서 Provider, Model, Workflow, Blueprint를 먼저 선택하게 하지
않는다.

---

## 9. Navigation contract

Desktop에서는 안정적인 left navigation을 사용한다. Mobile에서는 동일한
정보 구조를 drawer 또는 compact navigation으로 제공한다.

### 9.1 Primary navigation

- Command Center
- My Agents
- Build
- Approvals
- Connections
- Marketplace
- Analytics
- Settings

### 9.2 Advanced navigation

- Blueprint
- MCP Registry
- Credential detail
- Technical activity

`Blueprint`, `MCP Registry`, `Credential` 같은 기술 목적지는 제품에
필요하지만 일반 사용자의 기본 경로를 방해해서는 안 된다. 기본
navigation에서는 `Connections`처럼 사용자 언어로 묶고, Advanced 또는
관리자 Context에서만 세부 목적지를 노출한다.

### 9.3 Approval visibility

- 미처리 Approval 수는 navigation과 현재 Build header에서 항상 확인할 수
  있어야 한다.
- 일반 Approval은 Orange badge와 제한된 pulse를 사용한다.
- Red badge는 파괴적 작업, 보안 위험, 즉각적인 중단처럼 긴급도가 높은
  승인에만 사용한다.
- badge만 강조하지 않고 승인 이유와 영향으로 바로 이동할 수 있어야 한다.

---

## 10. Component contracts

### 10.1 Build Summary

표시 순서:

1. Agent가 완료되면 할 수 있는 일
2. 만들 Agent의 이름과 한 줄 목적
3. 예상 시간
4. 예상 비용
5. 자동화율
6. 사용자 작업 수
7. 필요한 Approval
8. 예상 Delivery surface

기술 Snapshot과 내부 Architecture는 상세 보기로 이동한다.

### 10.2 Progress

기본 단계:

```text
요구사항 정리
→ Agent 설계
→ Agent 구성
→ 연결 확인
→ 검증
→ 배포 준비
→ 인수 가능
```

화면 문구:

```text
AI가 고객 문의 Agent를 구성하고 있습니다.

완료한 작업
✓ 문의 분류 방식 준비
✓ 답변 생성 기준 준비

현재
외부 서비스 연결을 확인하고 있습니다.

예상 완료
약 7분
```

`Workflow`, `Task`, `Command`, `Step 14/27`은 기본 Progress에 사용하지
않는다.

### 10.3 Approval

Approval은 기술 로그가 아니라 결과·영향·비용·통제 범위를 보여준다.

```text
AI가 아래 작업을 진행하려고 합니다.

Google Drive에 결과 파일을 생성합니다.

영향
✓ 새 파일 생성
✓ 기존 파일은 수정하지 않음

예상 비용
무료

완료 후
현재 단계부터 자동으로 이어갑니다.

[이 범위 승인] [거부]
```

필수 정보:

- AI가 무엇을 하려는가
- 왜 필요한가
- 사용자가 무엇을 얻게 되는가
- 외부 변경과 권한
- 예상 비용
- 공개 범위
- 취소·Rollback 가능 여부
- 승인 후 자동 재개 여부

가능한 작업은 Session 단위 Approval Plan으로 묶고, 범위가 달라질 때만
추가 승인을 요청한다.

### 10.4 Waiting

기다리는 이유와 다음 동작을 함께 보여준다.

```text
GitHub의 응답을 기다리고 있습니다.

응답이 확인되면 별도 작업 없이 자동으로 다음 단계로 진행합니다.
```

### 10.5 Failure and recovery

Failure Panel은 다음 순서를 지킨다.

1. 확인하지 못한 항목
2. 현재 영향
3. 자동 복구 또는 재시도 상태
4. 사용자가 해야 할 한 가지 작업
5. 완료 후 자동 재개
6. 기술 상세

Error 화면 전체를 Red로 채우지 않는다.

### 10.6 Production Ready and completion

완료 제목은 `Done`, `Success`, `Deployment Complete`가 아니다.

> **AI Agent 구축이 완료되었습니다.**

실제 조건이 충족된 경우에만:

> **이 Agent를 사용할 준비가 완료되었습니다.**

결과 화면:

- Agent 사용 URL 또는 호출 방법
- 관리자 접근
- 사용 시작 방법
- 연결된 서비스
- Verification 결과
- Evidence
- 예상·실제 운영비
- 확인이 필요한 Warning
- 자동화되지 않은 항목
- Package Export
- Marketplace 공유 준비 상태
- 다음 권장 작업

Live Verification이 없는 항목은 `검증 대기`, `사용자 확인 필요`,
`RC Evidence 필요`로 표시한다.

### 10.7 Verification and Evidence

Evidence는 기술 부록이 아니라 완료 신뢰의 핵심이다.

기본 화면에는 다음을 요약한다.

- 무엇을 확인했는가
- 언제 확인했는가
- 유효한지 또는 만료되었는가
- 추가 확인이 필요한지

Provider response body, Secret, raw log는 표시하거나 저장하지 않는다.

---

## 11. Technical disclosure

기본 화면에서 다음 용어와 원문을 노출하지 않는다.

- Workflow
- Task
- JSON
- Provider
- MCP
- Adapter
- Command
- Execution enum
- raw Log
- raw Error

전문가와 지원 담당자는 `기술 상세 보기`에서 다음을 확인할 수 있다.

- Build Plan
- safe Provider status
- MCP Tool name과 permission summary
- Retry와 Recovery history
- Verification Attempt
- safe error code
- sanitized Evidence

기술 상세도 Secret과 원문 Provider response를 노출하지 않는다.

---

## 12. Responsive behavior

### Desktop

- Left navigation 고정
- Command input과 current work를 중심 Column에 배치
- Approval과 사용자 작업은 접근 가능한 보조 영역에 유지
- 상세 정보는 side panel 또는 expandable section 사용

### Tablet

- Navigation compact
- 핵심 결과와 현재 상태를 한 Column 우선으로 재배치
- Metric grid는 2열
- Approval은 화면 흐름 안에서 sticky action으로 제공 가능

### Mobile

- 결과, 현재 상태, 사용자 작업 순서 유지
- Metric은 1~2열
- 기술 상세는 기본 접힘
- 지속 animation과 blur를 줄인다.
- Approval action은 화면 하단에서 명확히 접근 가능해야 한다.

Responsive 전환에서도 Information Priority를 바꾸지 않는다.

---

## 13. Accessibility and performance

- Keyboard focus를 Electric Blue outline과 border로 명확히 표현한다.
- Dialog와 Approval은 focus trap과 올바른 heading 구조를 사용한다.
- icon-only action은 accessible name을 제공한다.
- animation 없이도 상태를 이해할 수 있어야 한다.
- Neural background는 content rendering을 차단하지 않는다.
- low-power device에서는 static background fallback을 허용한다.
- blur, shadow, node animation은 성능 측정 없이 확대하지 않는다.
- Background asset은 다양한 해상도에서 cropping과 contrast를 검증한다.

---

## 14. Design review gate

새 UI와 변경된 UI는 다음 질문을 모두 검토한다.

### Product

- Outcome First인가?
- 사용자가 3초 안에 무엇을 얻는지 이해하는가?
- 사용자가 AI 개발팀에 업무를 맡긴 느낌을 받는가?
- 중요한 승인만 요청하는가?
- Evidence가 완료 판단을 뒷받침하는가?

### Visual

- `#05070D` 기반 layer hierarchy가 명확한가?
- Electric Blue, Violet, Orange, Green의 의미가 지켜졌는가?
- Panel radius가 20~28px 계약을 따르는가?
- Glass와 glow가 가독성을 해치지 않는가?
- Dark Theme에서 Border가 충분히 보이는가?
- Neural background가 콘텐츠와 경쟁하지 않는가?

### Communication

- AI Chief Engineer의 말투인가?
- Task가 아니라 AI가 하는 일을 설명하는가?
- 확정과 검증 대기를 구분하는가?
- 사용자가 다음 행동과 자동 재개 여부를 아는가?

### Safety

- Secret, raw response, raw error가 노출되지 않는가?
- Approval의 비용·권한·공개 범위가 명확한가?
- Red와 urgent motion을 과도하게 사용하지 않는가?
- reduced motion과 keyboard navigation을 지원하는가?

### Brand recognition

> 이 화면만 보아도 BuildFlow의 AI Agent Command Center라는 것을 알 수
> 있는가?

---

## 15. Developer rules

1. 이 문서의 semantic token을 재사용한다.
2. 새 색상, radius, shadow, animation은 Design Review 없이 추가하지 않는다.
3. 문구는 `AI_COMMUNICATION_LANGUAGE.md`를 따른다.
4. 상태 animation은 실제 서버 상태를 반영해야 한다.
5. 기본 UI에 내부 enum과 기술 로그를 노출하지 않는다.
6. Provider, Execution, Security contract를 시각 편의를 위해 우회하지 않는다.
7. Approval과 Verification 상태를 client memory만으로 확정하지 않는다.
8. 화면 구현 후 Desktop, Tablet, Mobile, reduced motion을 검토한다.
9. 기존 화면을 변경할 때 기능 동작과 소유권·보안 경계를 유지한다.
10. Design Language 변경은 개별 페이지가 아니라 이 문서를 먼저 갱신한다.

---

## 16. Version and implementation status

### Version

- Design Language: `v1`
- Approved identity: AI Agent Command Center
- Approved visual system: Dark Luxury + Living Neural Network
- Approved experience system: Outcome First + Evidence First

### Current implementation status

현재 코드에는 초기 Design Language의 Panel, Card, Active, Warning token과
일부 Outcome First UI가 적용되어 있다. 다음 v1 요소는 문서 기준이
확정되었지만 전체 화면 적용과 검증이 아직 필요하다.

- `#05070D` Canvas와 새 semantic color token
- Neon Violet secondary system
- Living Neural Network background와 state response
- 20~28px radius migration
- 공식 left navigation hierarchy
- persistent Approval visibility
- First-screen Agent Command Input
- complete responsive and reduced-motion QA
- 전체 화면 Design Review evidence

따라서 이 문서의 채택만으로 현재 UI 전체를 `v1 compliant`라고 표시하지
않는다. 실제 적용은 현재 활성 Sprint와 분리된 승인 작업에서 진행한다.
