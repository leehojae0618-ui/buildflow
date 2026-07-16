# BuildFlow Design Language

## 1. Product character

BuildFlow는 일반 SaaS Dashboard가 아니라 사용자를 대신해 AI가 프로젝트를 구축하는 AI Control Center다. 인터페이스는 미니멀하고 차분해야 하며, AI가 일하고 있다는 존재감은 절제된 Cyan accent, 상태 변화, 부드러운 진행 표현으로 전달한다.

Nothing·Apple·Linear의 명료함을 참고한다. 과도한 SF 연출, Glow, Glass, 장식적인 애니메이션은 사용하지 않는다.

## 2. Information hierarchy

모든 주요 화면은 다음 순서를 따른다.

1. 완료 후 사용할 수 있는 결과
2. 현재 진행 상황
3. 예상 시간
4. 예상 비용
5. 사용자 작업
6. 기술 상세

기본 화면에는 Task, Command, Adapter, Provider, Execution 같은 내부 용어를 노출하지 않는다. 필요한 경우 `상세 보기` 안에서만 제공한다.

## 3. AI Narrative

상태는 시스템 명령이 아니라 AI의 업무 보고처럼 쓴다.

- “AI가 로그인 기능을 구성하고 있습니다.”
- “AI가 데이터를 준비하고 있습니다.”
- “AI가 서비스를 배포하고 있습니다.”
- “AI가 완성된 서비스를 확인하고 있습니다.”

문장은 짧고 현재형으로 쓴다. 사용자가 해야 할 작업은 “이 작업을 완료하면 AI가 자동으로 이어갑니다”처럼 다음 행동과 자동 재개를 함께 설명한다.

## 4. Layout layers

| Layer | 역할 | 기준 |
|---|---|---|
| 0 | Background | `#090909`~`#111111`, 시각적 소음 없음 |
| 1 | Section | 섹션 간 명확한 여백과 얇은 구분선 |
| 2 | Panel | 주요 정보 그룹, 24px radius |
| 3 | Interactive/Floating | 선택·승인·활성 상태, 28~32px radius와 은은한 shadow |

직각 Box를 기본값으로 사용하지 않는다. Panel은 정보를 묶되 화면을 무겁게 만들지 않아야 한다.

## 5. Tokens

### Color

| Token | Value | 사용 |
|---|---|---|
| `bg.canvas` | `#090909` | 전체 배경 |
| `bg.panel` | `#111111` / 88% | 기본 Panel |
| `bg.interactive` | `#171717` | hover·action 영역 |
| `text.primary` | `#F4F4F5` | 결과·제목 |
| `text.secondary` | `#A1A1AA` | 상태·설명 |
| `text.muted` | `#71717A` | 보조·기술 상세 |
| `accent.cyan` | `#67E8F9` | AI active·주요 action |
| `accent.blue` | `#93C5FD` | 보조 정보·진행 |
| `attention.orange` | `#FDBA74` | 주의·사용자 작업 |
| `error.red` | `#FCA5A5` | 실패·차단 |

Orange와 Red는 일반 장식에 사용하지 않는다.

### Spacing

4px base scale을 사용한다: `4, 8, 12, 16, 24, 32, 48, 64px`. Panel 내부 기본 padding은 24px, 주요 섹션 간격은 32px다.

### Radius and border

- Panel: 24px
- Floating/Interactive Panel: 28~32px
- Button/Input: 12~16px
- Default border: `1px solid rgba(161,161,170,.18)`
- Hover border: accent opacity를 소폭 증가
- Selected border: 명확한 Cyan/Blue border
- AI Active: 얇은 accent border와 약한 glow

Border는 제거하지 않는다. 배경 대비만으로 구분하기 어려운 Section, Panel, Action Area를 명확히 나누는 데 사용한다.

### Elevation

기본 Panel은 평면에 가깝게 유지한다. Floating Panel만 `0 16px 40px rgba(0,0,0,.28)` 수준의 은은한 shadow를 사용한다. Glass blur는 정보 가독성을 해치지 않는 범위에서만 사용한다.

### Motion

150~240ms의 짧은 transition을 기본으로 한다. Progress는 부드럽게 변화시키고 AI Active 상태에는 느린 breathing glow를 사용한다. 반복·주의를 끄는 과도한 bounce, particle, 장시간 blocking animation은 금지한다.

## 6. Component rules

### Build Summary

결과를 가장 먼저 보여주고 시간·비용·자동화율·사용자 작업을 동일한 Metric grid로 배치한다. 기술 snapshot은 아래로 내린다.

### Progress

AI Narrative 제목, 한 줄 설명, 진행률, 단계 Flow, 다음 사용자 작업 순서다. 내부 enum은 숨긴다.

### Approval

AI가 하려는 결과와 영향, 비용, 권한, 복구 가능성, 승인 후 자동 재개를 한 카드에 묶는다. 개별 기술 Task 승인 카드는 만들지 않는다.

### Production Ready

서비스 URL, 관리자 접근, 사용 시작 방법, 운영비, 백업·모니터링, 경고, 다음 권장 작업을 결과 카드로 제공한다. Live QA가 없는 값은 검증 대기로 명시한다.

### Failure

무엇이 멈췄는지, 사용자가 할 일, 자동 재개 여부를 먼저 보여준다. safe error code와 기술 로그는 상세 보기로 보낸다.

## 7. Developer checklist

새 Component는 이 문서의 token과 hierarchy를 재사용한다. 새로운 색상·radius·shadow·motion을 임의로 추가하지 않는다. 기능 추가나 엔진 변경이 필요한 경우 Design Sprint 범위를 벗어나므로 별도 승인한다.
