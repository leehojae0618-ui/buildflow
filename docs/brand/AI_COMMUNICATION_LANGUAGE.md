# BuildFlow AI Communication Language

## Constitution

BuildFlow는 AI Builder가 아니라 **AI Chief Engineer**다. 사용자가 목표를 설명하면 BuildFlow는 계획하고, 구축하고, 검증하고, 결과를 책임 있게 보고한다.

슬로건: **From Idea to Production.**

## Core identity

BuildFlow의 목소리는 차분하고 전문적이며 친절하다. 과장하지 않고, 모르는 것을 숨기지 않으며, 기술보다 사용자가 얻게 될 결과를 먼저 설명한다.

### Golden Rule

모든 문장은 “경험 많은 수석 엔지니어가 고객에게 설명하는 방식”처럼 들려야 한다.

## Message structure

기본 순서는 다음과 같다.

1. 무엇을 하는지
2. 왜 필요한지
3. 다음에 무엇이 일어나는지

문장은 짧고 명확하게 쓴다. 내부 용어(Task, Command, Provider, Execution, enum)는 기본 UI에서 제거하고 상세 정보에서만 사용한다.

## Outcome First

기술 작업을 결과로 번역한다.

| 피할 표현 | BuildFlow 표현 |
|---|---|
| Repository 생성 | 서비스 코드를 안전하게 저장할 공간을 준비합니다. |
| Schema 적용 | 서비스가 사용할 데이터 구조를 준비합니다. |
| Deployment 실행 | 사용자가 접속할 수 있도록 서비스를 배포합니다. |
| Provider Verification | 연결된 서비스가 정상적으로 작동하는지 확인합니다. |

## Confidence Language

확정된 사실만 확정적으로 말한다. 실환경 검증이 없으면 “검증 대기”, “RC 단계 확인 예정”, “사용자 확인 필요”로 구분한다.

금지: `완벽`, `100% 보장`, `절대`, `반드시`, 근거 없는 `완료`.

권장: “자동 구축과 구조 검증이 완료되었습니다. 실제 외부 서비스 검증은 RC 단계에서 추가 확인됩니다.”

## State language

### Progress

- “AI가 인증 기능을 구성하고 있습니다.”
- “AI가 예약 기능을 연결하고 있습니다.”
- “AI가 서비스를 배포하고 있습니다.”
- “AI가 완성된 서비스를 확인하고 있습니다.”

Task 번호, 내부 단계 번호, 기계적인 `Step 14/27`은 기본 화면에 표시하지 않는다.

### Waiting

“GitHub 응답을 기다리고 있습니다. 응답이 오면 자동으로 다음 작업을 진행합니다.”

기다리는 이유와 자동 재개 여부를 함께 말한다.

### Approval

“AI가 서비스 코드와 데이터 환경을 준비하려고 합니다. 이 작업을 승인하면 필요한 단계가 자동으로 이어집니다.”

승인 화면에는 무엇을 하는지, 왜 필요한지, 사용자가 얻게 될 결과, 예상 비용·권한·복구 가능성을 함께 표시한다.

### Loading

- “AI가 다음 작업을 준비하고 있습니다.”
- “현재 정보를 확인하고 있습니다.”
- “잠시만 기다려 주세요. 확인이 끝나면 자동으로 이어집니다.”

### Completion

- “서비스 구축이 완료되었습니다.”
- “자동 구축과 검증이 완료되었습니다.”
- “이제 서비스 주소에서 시작할 수 있습니다.”

`SUCCESS`, `DONE`, `Deployment Complete`를 사용자 완료 제목으로 사용하지 않는다.

### Production Ready

“서비스를 사용할 준비가 완료되었습니다.”

단, URL·Health Check·필수 Verification 등 실제 조건이 충족되지 않았다면 Production Ready로 표시하지 않는다.

### Warning

“추가 확인이 필요한 항목이 있습니다.”

경고에는 영향과 사용자가 할 일을 덧붙인다. 불필요하게 불안을 유발하는 표현은 사용하지 않는다.

### Failure and Recovery

오류는 다음 순서로 설명한다.

1. 원인: 무엇을 확인했는가
2. 영향: 무엇이 아직 진행되지 않았는가
3. 해결: 사용자가 할 일
4. 재개: 자동 재시도 또는 완료 후 자동 재개 여부

예: “AI가 GitHub 연결을 확인하지 못했습니다. 아직 코드 저장소가 준비되지 않았습니다. GitHub 로그인을 완료해 주세요. 완료되면 현재 단계부터 자동으로 다시 진행합니다.”

`ERROR!!`, `FATAL`, `Exception`을 기본 UI에 표시하지 않는다.

## AI Presence

AI는 계속 말하지 않는다. 작업을 시작할 때, 상태가 바뀔 때, 사용자 행동이 필요할 때, 완료·경고·복구가 필요할 때만 짧게 보고한다.

Progress, 부드러운 상태 전환, 절제된 Active Accent를 통해 조용히 일하고 있다는 느낌을 준다. 반복되는 유머, 감탄사, 과한 의인화와 확신 표현은 금지한다.

## Tone by surface

| Surface | 우선 메시지 |
|---|---|
| Build Summary | 완료 후 사용할 수 있는 결과 |
| Progress | AI가 현재 수행하는 일과 예상 시간 |
| Approval | AI가 하려는 일, 영향, 자동 재개 |
| Waiting | 기다리는 이유와 다음 단계 |
| Recovery | 원인, 해결, 재개 |
| Completion | 사용할 수 있는 결과와 다음 권장 작업 |
| Toast | 한 문장 결과 + 필요한 다음 행동 |
| Dialog | 목적, 영향, 선택지, 취소 가능 여부 |

## Developer guide

새 UI, Dialog, Toast, Error, Loading, Empty State, Success Message는 이 문서를 먼저 참조한다. 문구를 추가할 때 다음을 확인한다.

- 결과를 기술보다 먼저 말하는가?
- 확정과 검증 대기를 구분하는가?
- 사용자가 다음 행동을 아는가?
- 자동 재개 여부를 알 수 있는가?
- 불필요한 내부 용어와 공포 표현이 없는가?
- AI Chief Engineer가 고객에게 보고하는 말투인가?

## Brand values

신뢰 · 정확성 · 예측 가능성 · 자동화 · 책임감

BuildFlow의 약속은 코드를 만드는 것이 아니라 프로젝트를 완성하는 것이다.
