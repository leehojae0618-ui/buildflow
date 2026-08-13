export type Bf0Route =
  | "onboarding"
  | "idea"
  | "goal"
  | "source"
  | "approval"
  | "output"
  | "navigator"
  | "workflow"
  | "access"
  | "plan"
  | "step"
  | "complete";

export type Bf0DesignDraft = {
  idea: string;
  originalIdea?: string;
  goal: string | null;
  source: string | null;
  approval: string | null;
  output: string | null;
  requirementCandidates?: Bf0RequirementCandidate[];
  userEditedRequirements?: Bf0RequirementCandidate[];
  hasUserEditedRequirements?: boolean;
  unsupportedRequirements?: Bf0RequirementCandidate[];
  unresolvedQuestions?: string[];
};

export type Bf0RequirementKind = "trigger" | "source" | "action" | "condition" | "destination" | "constraint" | "schedule" | "data" | "unknown";
export type Bf0RequirementSupport = "표준 선택으로 표현 가능" | "구축 가이드 가능" | "추가 연결 필요" | "별도 도구 선택 필요" | "기준 추가 확인 필요" | "현재 템플릿으로 표현 어려움";
export type Bf0RequirementCandidate = {
  id: string;
  kind: Bf0RequirementKind;
  label: string;
  value: string;
  sourceText: string;
  support: Bf0RequirementSupport;
  confidence: "높음" | "중간" | "낮음";
  editable: boolean;
};

export type Bf0ChoiceOption = {
  value: string;
  title: string;
  description: string;
  status?: Bf0CapabilityStatus;
};

export type Bf0CapabilityStatus =
  | "설계 선택 가능"
  | "구축 가이드 제공"
  | "연결 필요"
  | "추가 연결 필요"
  | "현재 미지원";

export type Bf0InputVerificationState = "OFFICIAL_VERIFIED" | "NOT_VERIFIED";

export type Bf0InputTarget = {
  id: string;
  label: string;
  service: string;
  screen: string;
  control: string;
  field: string;
  value: string;
  format?: string;
  setting?: string;
  verificationState: Bf0InputVerificationState;
  officialSource?: string;
};

export type Bf0BuildPlanItem = {
  id: string;
  title: string;
  state: "설계 초안" | "연결 필요" | "구축 가이드" | "현재 미지원" | "검증 필요";
  actor: string;
  timing: string;
  workLocation: string;
  task: string;
  reason: string;
  summary: string;
  detail: string;
  steps: string[];
  actionInputs?: Array<{ label: string; values: string[] }>;
  inputTargets?: Bf0InputTarget[];
  completion: string;
  caution: string;
  nextAction: string;
  guideLabel: string;
  guideState: "설계 초안" | "연결 필요" | "구축 가이드" | "현재 미지원" | "검증 필요";
  guideUrl?: string;
  guideRoute?: Bf0Route;
  editRoute?: Bf0Route;
  editLabel?: string;
  requirements?: Bf0RequirementCandidate[];
};

export type Bf0FeasibilityStatus =
  | "지금 구축 가능"
  | "조건부 구축 가능"
  | "안내만 가능"
  | "현재 지원 어려움"
  | "추가 확인 필요";

export type Bf0NavigatorPreview = {
  status: Bf0FeasibilityStatus;
  recommendedPath: string[];
  recommendationReasons: string[];
  difficulty: "초급" | "중급" | "고급";
  estimatedSteps: number;
  requiredAccounts: string[];
  costStatus: string;
  finalFlow: string[];
  remainingQuestions: string[];
  disclaimer: string;
};

export type Bf0NavigatorSummary = Bf0NavigatorPreview;

export type Bf0ClarificationRoute = Extract<Bf0Route, "goal" | "source" | "approval" | "output">;

export type Bf0Clarification = {
  route: Bf0ClarificationRoute;
  label: string;
  question: string;
  reason: string;
};

export type Bf0StepProgress = "not-started" | "in-progress" | "user-reported-complete" | "problem-reported";

export const BF0_STEP_PROBLEM_OPTIONS = [
  "로그인 화면이 보이지 않아요",
  "설명과 다른 화면이 보여요",
  "권한 오류가 보여요",
  "어디를 눌러야 할지 모르겠어요",
  "기타 오류",
] as const;

export const BF0_DESIGN_STEPS: Array<{ route: Bf0Route; label: string }> = [
  { route: "navigator", label: "요약" },
  { route: "goal", label: "필요 확인" },
  { route: "source", label: "필요 확인" },
  { route: "approval", label: "필요 확인" },
  { route: "output", label: "필요 확인" },
  { route: "plan", label: "구축 계획" },
  { route: "complete", label: "완료" },
];

export const BF0_GOAL_OPTIONS: Bf0ChoiceOption[] = [
  { value: "분류하고 담당자에게 전달", title: "분류하고 전달", description: "들어온 내용을 구분해 적절한 담당자에게 보냅니다." },
  { value: "정기 보고서 생성", title: "보고서 만들기", description: "정해진 주기에 데이터를 모아 요약합니다." },
  { value: "데이터 정리 및 저장", title: "데이터 정리", description: "흩어진 정보를 일정한 형식으로 정리합니다." },
  { value: "검사·검증", title: "검사·검증", description: "결과나 변경사항이 정해진 조건을 충족하는지 확인합니다." },
  { value: "반복 업무 알림", title: "반복 업무 알림", description: "조건이나 시간에 맞춰 필요한 사람에게 알립니다." },
];

export const BF0_SOURCE_OPTIONS: Bf0ChoiceOption[] = [
  { value: "Gmail", title: "Gmail", description: "새 이메일이나 문의 메일을 입력 후보로 설계합니다.", status: "연결 필요" },
  { value: "웹 폼", title: "웹 폼", description: "사이트에서 제출된 문의를 입력으로 설계합니다.", status: "설계 선택 가능" },
  { value: "파일 업로드", title: "파일 업로드", description: "문서나 표가 들어오는 흐름을 가이드합니다.", status: "구축 가이드 제공" },
  { value: "Slack", title: "Slack", description: "Slack 메시지 입력은 연결 범위를 먼저 확인해야 합니다.", status: "연결 필요" },
  { value: "직접 입력", title: "직접 입력", description: "사용자가 직접 입력한 내용을 시작점으로 설계합니다.", status: "설계 선택 가능" },
  { value: "정해진 시간", title: "정해진 시간", description: "정기 실행 방식은 구축 순서만 안내합니다.", status: "구축 가이드 제공" },
  { value: "GitHub / Repository", title: "GitHub / Repository", description: "PR·코드 변경 입력은 연결 방식과 권한을 별도로 검토해야 합니다.", status: "추가 연결 필요" },
  { value: "Webhook / API", title: "Webhook / API", description: "외부 이벤트 입력은 별도 연결과 인증 방식을 검토해야 합니다.", status: "추가 연결 필요" },
];

export const BF0_APPROVAL_OPTIONS: Bf0ChoiceOption[] = [
  { value: "항상 승인", title: "실행 전 확인", description: "모든 외부 작업을 사용자 확인 뒤 진행하는 안전한 설계 선호입니다." },
  { value: "중요 작업만 승인", title: "중요 작업만 승인", description: "전송·삭제·수정 같은 영향이 큰 작업을 확인하는 설계 선호입니다." },
  { value: "조건부 승인", title: "조건부 승인", description: "정한 조건에서만 확인을 요구하는 설계 선호입니다." },
  { value: "자동 진행", title: "자동 진행", description: "자동 실행 가능 상태가 아니라, 향후 설계 선호를 기록합니다." },
];

export const BF0_OUTPUT_OPTIONS: Bf0ChoiceOption[] = [
  { value: "Slack", title: "Slack", description: "담당 채널 또는 사람에게 결과를 전달하는 흐름입니다.", status: "연결 필요" },
  { value: "이메일", title: "이메일", description: "요약 결과나 확인 요청을 이메일로 보내는 흐름입니다.", status: "연결 필요" },
  { value: "문서", title: "문서", description: "보고서나 구축 문서를 남기는 흐름입니다.", status: "구축 가이드 제공" },
  { value: "데이터베이스", title: "데이터베이스", description: "결과 누적은 현재 UI-only 범위에서 지원하지 않습니다.", status: "현재 미지원" },
  { value: "다운로드 결과", title: "다운로드 결과", description: "사용자가 결과를 내려받는 방식을 설계합니다.", status: "구축 가이드 제공" },
];

export const BF0_IDEA_EXAMPLES = [
  "고객 문의를 분류해 담당자에게 보내고 싶어요",
  "매주 매출 데이터를 모아 보고서를 만들고 싶어요",
  "새 파일이 올라오면 내용을 요약해 문서로 저장하고 싶어요",
  "결제 실패가 발생하면 담당자에게 바로 알리고 싶어요",
];

export const EMPTY_BF0_DRAFT: Bf0DesignDraft = {
  idea: "",
  originalIdea: "",
  goal: null,
  source: null,
  approval: null,
  output: null,
  requirementCandidates: [],
  userEditedRequirements: [],
  hasUserEditedRequirements: false,
  unsupportedRequirements: [],
  unresolvedQuestions: [],
};

export function normalizeIdea(value: string): string {
  return value.trim();
}

export function getIdeaValidationError(value: string): string | null {
  const normalized = normalizeIdea(value);
  if (!normalized) return "아이디어를 입력해 주세요.";
  if (normalized.length < 5) return "아이디어를 5자 이상 입력해 주세요.";
  if (normalized.length > 280) return "아이디어는 280자 이내로 입력해 주세요.";
  return null;
}

export function buildNavigatorPreview(idea: string, requirementOverrides?: Bf0RequirementCandidate[]): Bf0NavigatorSummary {
  return buildNavigatorSummary({
    ...EMPTY_BF0_DRAFT,
    idea,
    originalIdea: idea,
    requirementCandidates: requirementOverrides ?? extractRequirementCandidates(idea),
    userEditedRequirements: requirementOverrides,
    hasUserEditedRequirements: Boolean(requirementOverrides),
  });
}

export function buildRecommendedDraft(idea: string, requirementCandidates = extractRequirementCandidates(idea)): Bf0DesignDraft {
  const normalized = normalizeIdea(idea);
  return {
    ...EMPTY_BF0_DRAFT,
    idea: normalized,
    originalIdea: normalized,
    goal: recommendGoal(normalized, requirementCandidates),
    source: recommendSource(normalized, requirementCandidates),
    approval: "항상 승인",
    output: recommendOutput(normalized, requirementCandidates),
    requirementCandidates,
    userEditedRequirements: requirementCandidates,
    hasUserEditedRequirements: true,
    unsupportedRequirements: getRequirementGaps(requirementCandidates),
    unresolvedQuestions: getUnresolvedQuestions(requirementCandidates),
  };
}

function recommendGoal(idea: string, requirements: Bf0RequirementCandidate[]): string | null {
  const lower = idea.toLowerCase();
  if (requirements.some((item) => item.id === "security-check" || item.id === "risk-condition") || /검사|검증|보안|취약점|risk|위험/.test(lower)) return "검사·검증";
  if (/보고서|요약|매주|매월|매일|리포트/.test(idea)) return "정기 보고서 생성";
  if (/문의|담당자|분류|전달/.test(idea)) return "분류하고 담당자에게 전달";
  if (/정리|저장|파일|데이터/.test(idea)) return "데이터 정리 및 저장";
  if (/알림|알려|실패|발생/.test(idea)) return "반복 업무 알림";
  return null;
}

function recommendSource(idea: string, requirements: Bf0RequirementCandidate[]): string | null {
  const lower = idea.toLowerCase();
  if (/직접\s*(입력|작성|기입|써서|적어서)/.test(idea)) return "직접 입력";
  if (requirements.some((item) => item.id === "github-trigger" || item.id === "github-source")) return "GitHub / Repository";
  if (/gmail|메일|이메일/.test(lower) && !/이메일.*받|이메일.*보내|메일.*받/.test(idea)) return "Gmail";
  if (/파일|업로드|문서/.test(idea) && !/문서로 저장|문서로 남/.test(idea)) return "파일 업로드";
  if (/웹\s*폼|web\s*form|구글\s*폼|google\s*forms?|사이트\s*폼|폼\s*제출|설문(?:\s*(폼|응답))?/i.test(idea)) return "웹 폼";
  if (/slack/i.test(idea) && !/slack.*보내|slack.*전달|slack.*알려/.test(lower)) return "Slack";
  if (/매주|매월|매일|정해진 시간/.test(idea) && !/후기|리뷰/.test(idea)) return "정해진 시간";
  return null;
}

function recommendOutput(idea: string, requirements: Bf0RequirementCandidate[]): string | null {
  if (requirements.some((item) => item.id === "slack-destination")) return "Slack";
  if (/slack/i.test(idea) && /보내|전달|알려|채널/.test(idea)) return "Slack";
  if (/이메일|메일/.test(idea) && /받|보내|전달/.test(idea)) return "이메일";
  if (/문서|docs|보고서/.test(idea) && /저장|남|문서/.test(idea)) return "문서";
  if (/데이터베이스|db|database/.test(idea)) return "데이터베이스";
  if (/다운로드|내려받/.test(idea)) return "다운로드 결과";
  return null;
}

export function buildNavigatorSummary(draft: Bf0DesignDraft): Bf0NavigatorSummary {
  const requirements = getActiveRequirements(draft);
  const byId = (id: string) => requirements.find((item) => item.id === id);
  const has = (id: string) => Boolean(byId(id));
  const hasGitHubRequirement = has("github-trigger") || has("github-source");
  const gaps = getRequirementGaps(requirements);
  const unresolvedQuestions = getUnresolvedQuestions(requirements);
  const base = {
    status: requirements.length === 0 || requirements.every((item) => item.kind === "unknown") ? "추가 확인 필요" as Bf0FeasibilityStatus : gaps.length > 0 ? "조건부 구축 가능" as Bf0FeasibilityStatus : "안내만 가능" as Bf0FeasibilityStatus,
    difficulty: hasGitHubRequirement ? "고급" as const : requirements.some((item) => item.kind === "condition" || item.kind === "schedule") ? "중급" as const : "초급" as const,
    estimatedSteps: Math.max(1, Math.min(7, requirements.length + 1)),
    remainingQuestions: unresolvedQuestions,
    costStatus: "선택한 도구와 사용량, AI 방식에 따라 비용이 발생할 수 있으며 현재 정확한 비용은 산정할 수 없습니다.",
    disclaimer: "현재는 구축 경로 초안입니다. 실제 연결과 검증은 아직 수행되지 않았으며, 작동 여부를 보장하지 않습니다.",
  };

  if (hasGitHubRequirement) {
    const additionalRequirements = getAdditionalRequirements(requirements, GITHUB_REQUIREMENT_IDS);
    const path = [
      has("github-trigger") ? byId("github-trigger")!.value : null,
      has("github-source") ? "코드 변경 분석" : null,
      has("security-check") ? "보안 검사" : null,
      has("risk-condition") ? "고위험 조건 판단" : null,
      has("slack-destination") ? byId("slack-destination")!.value : null,
      has("merge-constraint") ? byId("merge-constraint")!.value : null,
      ...additionalRequirementPathParts(additionalRequirements),
    ].filter((item): item is string => Boolean(item));
    const recommendationReasons = [
      has("github-trigger") ? "PR 생성이 명확한 시작 조건입니다." : null,
      has("github-source") ? "코드 변경사항 분석 범위를 먼저 정해야 합니다." : null,
      has("security-check") ? "보안 검사가 핵심 처리로 포함됐습니다." : null,
      has("risk-condition") ? "고위험 조건일 때만 알림이 필요합니다." : null,
      has("slack-destination") ? "지정한 Slack 채널 전달에는 별도 연결과 권한이 필요합니다." : null,
      has("merge-constraint") ? "자동 merge는 승인 규칙으로 제한해야 합니다." : null,
      ...additionalRequirementReasons(additionalRequirements),
    ].filter((item): item is string => Boolean(item));
    const requiredAccounts = [
      has("github-trigger") || has("github-source") ? "GitHub" : null,
      has("slack-destination") ? "Slack" : draft.output === "Slack" ? "Slack (결과 위치 선택)" : null,
      has("security-check") ? "보안 검사 도구" : null,
      ...additionalRequirementAccounts(additionalRequirements),
    ].filter((item): item is string => Boolean(item));
    return {
      ...base,
      estimatedSteps: Math.max(1, path.length + 1),
      recommendedPath: path,
      recommendationReasons,
      requiredAccounts,
      finalFlow: path,
    };
  }

  if (has("review-source")) {
    const additionalRequirements = getAdditionalRequirements(requirements, REVIEW_REQUIREMENT_IDS);
    const hasSchedule = requirements.some((item) => item.kind === "schedule");
    const path = [
      "후기 저장 위치",
      "후기 수집",
      hasSchedule && has("summary-action") ? "주간 정리 및 요약" : null,
      hasSchedule && !has("summary-action") ? "주간 실행" : null,
      !hasSchedule && has("summary-action") ? "정리 및 요약" : null,
      has("self-destination") ? "사용자에게 결과 전달" : null,
      ...additionalRequirementPathParts(additionalRequirements),
    ].filter((item): item is string => Boolean(item));
    const recommendationReasons = [
      has("review-input-gap") ? "후기 입력 위치가 아직 정해지지 않았습니다." : null,
      hasSchedule ? "주간 실행 시간은 별도로 확인해야 합니다." : null,
      has("summary-action") ? "요약 기준을 먼저 정해야 합니다." : null,
      has("self-destination") ? "결과 전달 방식과 개인정보 범위를 별도로 확인해야 합니다." : null,
      ...additionalRequirementReasons(additionalRequirements),
    ].filter((item): item is string => Boolean(item));
    return {
      ...base,
      estimatedSteps: Math.max(1, path.length + 1),
      recommendedPath: path,
      recommendationReasons,
      requiredAccounts: [draft.source ?? "입력 위치 확인 필요", has("self-destination") ? draft.output ?? "결과 전달 위치 확인 필요" : null, ...additionalRequirementAccounts(additionalRequirements)].filter((item): item is string => Boolean(item)),
      finalFlow: path,
    };
  }

  const pathFromRequirements = requirements.map((item) => {
    if (item.kind === "trigger" || item.kind === "source" || item.kind === "data") return item.value;
    if (item.kind === "action") return item.value;
    if (item.kind === "condition" || item.kind === "schedule") return item.value;
    if (item.kind === "destination") return item.value;
    if (item.kind === "constraint") return item.value;
    return "추가 확인";
  });
  const path = [...new Set(pathFromRequirements)].slice(0, 6);
  const selectedAccounts = [draft.source, draft.output].filter((value): value is string => Boolean(value));
  const requiredAccounts = [...new Set(selectedAccounts)];
  return {
    ...base,
    recommendedPath: path.length > 0 ? path : ["입력 위치 확인", "작업 목표 정리", "승인 기준 확인", "결과 위치 선택"],
    recommendationReasons: requirements.length > 0
      ? ["입력에서 찾은 요구사항 후보를 기준으로 경로를 정리했습니다.", "추가 연결 또는 기준 확인이 필요한 항목은 실제 구축 전에 검토해야 합니다."]
      : ["입력 문구만으로는 필요한 도구와 권한을 확정할 수 없습니다."],
    requiredAccounts: requiredAccounts.length > 0 ? requiredAccounts : ["사용 중인 도구 확인 필요"],
    finalFlow: path.length > 0 ? path : ["입력 확인", "처리 기준", "사용자 확인", "결과 선택"],
  };
}

export function getFirstIncompleteRoute(draft: Bf0DesignDraft): Bf0Route {
  if (!draft.idea) return "idea";
  return getClarificationQueue(draft)[0]?.route ?? "plan";
}

export function getClarificationQueue(draft: Bf0DesignDraft): Bf0Clarification[] {
  if (!draft.idea) return [];
  const queue: Bf0Clarification[] = [];
  if (!draft.goal) queue.push({
    route: "goal",
    label: "목표 확인",
    question: "가장 중요한 결과는 무엇인가요?",
    reason: "입력만으로 기대 결과를 안전하게 정하지 못했습니다.",
  });
  if (!draft.source) queue.push({
    route: "source",
    label: "입력 위치 확인",
    question: "정보는 어디에서 들어오나요?",
    reason: "시작 위치가 명확해야 구축 계획을 안전하게 만들 수 있습니다.",
  });
  if (!draft.approval) queue.push({
    route: "approval",
    label: "실행 전 확인 방식",
    question: "실행 전에 어떻게 확인할까요?",
    reason: "외부 작업 통제 방식은 사용자가 명시적으로 정해야 합니다.",
  });
  if (!draft.output) queue.push({
    route: "output",
    label: "결과 위치 확인",
    question: "결과는 어디로 보내면 될까요?",
    reason: "결과 전달 위치가 정해져야 계획의 마지막 단계를 정리할 수 있습니다.",
  });
  return queue;
}

function candidate(id: string, kind: Bf0RequirementKind, label: string, value: string, sourceText: string, support: Bf0RequirementSupport, confidence: Bf0RequirementCandidate["confidence"] = "높음"): Bf0RequirementCandidate {
  return { id, kind, label, value, sourceText, support, confidence, editable: true };
}

export function extractRequirementCandidates(idea: string): Bf0RequirementCandidate[] {
  const normalized = normalizeIdea(idea);
  const lower = normalized.toLowerCase();
  const found: Bf0RequirementCandidate[] = [];
  const add = (item: Bf0RequirementCandidate) => { if (!found.some((existing) => existing.id === item.id)) found.push(item); };
  if (/매주|주기적으로/.test(normalized)) add(candidate("schedule-weekly", "schedule", "언제 진행하나요?", "매주", normalized, "기준 추가 확인 필요"));
  if (/매일/.test(normalized)) add(candidate("schedule-daily", "schedule", "언제 진행하나요?", "매일", normalized, "기준 추가 확인 필요"));
  if (/매월/.test(normalized)) add(candidate("schedule-monthly", "schedule", "언제 진행하나요?", "매월", normalized, "기준 추가 확인 필요"));
  if (/월요일|금요일|오전|오후|정해진 시간/.test(normalized)) add(candidate("schedule-time-detail", "schedule", "일정의 상세 기준", normalized.match(/월요일|금요일|오전|오후|정해진 시간/)?.[0] ?? "시간 확인 필요", normalized, "기준 추가 확인 필요", "중간"));
  if (/후기|리뷰/.test(normalized)) {
    add(candidate("review-source", "data", "무엇을 정리하나요?", /손님 후기/.test(normalized) ? "손님 후기" : "후기", normalized, "기준 추가 확인 필요"));
    add(candidate("review-input-gap", "unknown", "후기가 어디에 쌓이나요?", "입력 출처는 아직 확인되지 않았습니다", normalized, "기준 추가 확인 필요", "낮음"));
  }
  if (/요약|보고서/.test(normalized)) add(candidate("summary-action", "action", "무엇을 해야 하나요?", /요약/.test(normalized) ? "후기 또는 데이터를 정리해 요약" : "보고서 생성", normalized, "구축 가이드 가능"));
  if (/저한테|나에게|본인/.test(normalized)) add(candidate("self-destination", "destination", "결과는 누구에게 가나요?", "사용자 본인", normalized, "기준 추가 확인 필요"));
  if (/github|pr|pull request|repository|repo|코드|diff|merge|머지/.test(lower)) {
    add(candidate("github-trigger", "trigger", "언제 시작되나요?", /새 pr|pr이 올라오면|pull request/.test(lower) ? "GitHub에 새 PR이 생성될 때" : "GitHub 또는 Repository 변경 시", normalized, "추가 연결 필요"));
    add(candidate("github-source", "source", "무엇을 확인하나요?", "GitHub PR 코드 변경사항", normalized, "추가 연결 필요"));
  }
  if (/보안|취약점|검사|스캔/.test(normalized)) add(candidate("security-check", "action", "무엇을 확인하나요?", "코드 변경사항의 보안 취약점 검사", normalized, "별도 도구 선택 필요"));
  if (/위험도|고위험|높으면/.test(normalized)) add(candidate("risk-condition", "condition", "어떤 조건이 중요한가요?", "위험도가 높은 경우", normalized, "기준 추가 확인 필요"));
  const slackChannel = normalized.match(/Slack\s*(#[\w-]+)/i);
  if (slackChannel) add(candidate("slack-destination", "destination", "결과는 어디로 가나요?", `Slack ${slackChannel[1]}`, normalized, "추가 연결 필요"));
  else if (/slack/i.test(normalized)) add(candidate("slack-destination", "destination", "결과는 어디로 가나요?", "Slack", normalized, "추가 연결 필요"));
  if (/승인 없이는|절대|자동.*머지|머지.*안/.test(normalized)) add(candidate("merge-constraint", "constraint", "절대 하면 안 되는 일", "승인 없는 자동 merge 금지", normalized, "표준 선택으로 표현 가능"));
  if (/문의/.test(normalized)) add(candidate("inquiry-data", "data", "무엇을 처리하나요?", "고객 문의", normalized, "구축 가이드 가능"));
  return found.length > 0 ? found : [candidate("unknown-goal", "unknown", "무엇을 먼저 확인할까요?", "입력 위치와 기대 결과를 추가로 확인해야 합니다", normalized, "기준 추가 확인 필요", "낮음")];
}

export function getActiveRequirements(draft: Bf0DesignDraft): Bf0RequirementCandidate[] {
  return draft.hasUserEditedRequirements ? draft.userEditedRequirements ?? [] : draft.requirementCandidates ?? [];
}

const GITHUB_REQUIREMENT_IDS = new Set([
  "github-trigger",
  "github-source",
  "security-check",
  "risk-condition",
  "slack-destination",
  "merge-constraint",
]);

const REVIEW_REQUIREMENT_IDS = new Set([
  "review-source",
  "review-input-gap",
  "summary-action",
  "self-destination",
  "schedule-weekly",
  "schedule-daily",
  "schedule-monthly",
  "schedule-time-detail",
]);

function normalizedRequirementText(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function requirementsAreEquivalent(left: Bf0RequirementCandidate, right: Bf0RequirementCandidate): boolean {
  return normalizedRequirementText(left.value) === normalizedRequirementText(right.value)
    || (left.kind === right.kind && normalizedRequirementText(left.label) === normalizedRequirementText(right.label) && normalizedRequirementText(left.value) === normalizedRequirementText(right.value));
}

export function getAdditionalRequirements(requirements: Bf0RequirementCandidate[], handledIds: Set<string>): Bf0RequirementCandidate[] {
  const handled = requirements.filter((requirement) => handledIds.has(requirement.id));
  const additional: Bf0RequirementCandidate[] = [];
  for (const requirement of requirements.filter((item) => !handledIds.has(item.id))) {
    if (handled.some((item) => requirementsAreEquivalent(item, requirement)) || additional.some((item) => requirementsAreEquivalent(item, requirement))) continue;
    additional.push(requirement);
  }
  return additional;
}

function additionalRequirementPathParts(requirements: Bf0RequirementCandidate[]): string[] {
  const order: Bf0RequirementKind[] = ["trigger", "source", "data", "action", "condition", "constraint", "destination", "schedule", "unknown"];
  return order.flatMap((kind) => requirements
    .filter((requirement) => requirement.kind === kind)
    .map((requirement) => requirement.kind === "unknown" ? `추가 확인: ${requirement.value}` : requirement.value));
}

function additionalRequirementReasons(requirements: Bf0RequirementCandidate[]): string[] {
  return requirements.flatMap((requirement) => {
    if (requirement.kind === "destination") return [`추가 결과 위치로 “${requirement.value}”이 지정됐습니다.`];
    if (requirement.kind === "condition") return [`추가 조건 “${requirement.value}”을 반영해야 합니다.`];
    if (requirement.kind === "constraint") return [`추가 제한 “${requirement.value}”을 반영해야 합니다.`];
    if (requirement.kind === "source" || requirement.kind === "data") return [`추가 입력 또는 데이터 “${requirement.value}”의 연결 범위를 확인해야 합니다.`];
    if (requirement.kind === "action") return [`추가 처리 작업 “${requirement.value}”의 기준을 정해야 합니다.`];
    if (requirement.kind === "schedule") return [`추가 실행 일정 “${requirement.value}”의 세부 기준을 정해야 합니다.`];
    if (requirement.kind === "trigger") return [`추가 시작 조건 “${requirement.value}”을 확인해야 합니다.`];
    if (requirement.kind === "unknown") return [`추가 요구 “${requirement.value}”는 별도 확인이 필요합니다.`];
    return [];
  });
}

function additionalRequirementAccounts(requirements: Bf0RequirementCandidate[]): string[] {
  return requirements.flatMap((requirement) => {
    const value = normalizedRequirementText(requirement.value);
    if (value.includes("teams")) return ["Teams 관련 연결 확인 필요"];
    if (value.includes("사내 시스템")) return ["사내 시스템 연결 확인 필요"];
    if (requirement.kind === "destination") return ["추가 결과 위치 연결 확인 필요"];
    if (requirement.kind === "source" || requirement.kind === "data") return ["추가 입력 위치 연결 확인 필요"];
    return [];
  });
}

export function getRequirementGaps(requirements: Bf0RequirementCandidate[]): Bf0RequirementCandidate[] {
  return requirements.filter((item) => item.support !== "표준 선택으로 표현 가능" && item.support !== "구축 가이드 가능");
}

export function getUnresolvedQuestions(requirements: Bf0RequirementCandidate[]): string[] {
  const questions: string[] = [];
  const customRequirements = requirements.filter((item) => item.id.startsWith("user-") || item.id.startsWith("custom-"));
  if (requirements.some((item) => item.id === "review-input-gap")) questions.push("후기는 어디에 저장되어 있나요?");
  if (requirements.some((item) => item.kind === "unknown" && item.id !== "review-input-gap")) questions.push("입력 위치와 기대 결과를 더 구체적으로 알려주실 수 있나요?");
  if (requirements.some((item) => item.kind === "schedule")) questions.push("매주 어느 요일과 시간에 실행할까요?");
  if (requirements.some((item) => item.id === "summary-action")) questions.push("어떤 기준으로 요약할까요?");
  if (requirements.some((item) => item.id === "review-source" || item.id === "inquiry-data")) questions.push("개인정보나 민감한 내용이 포함되나요?");
  if (requirements.some((item) => item.id === "github-trigger" || item.id === "github-source")) questions.push("Repository 연결 방식은 무엇인가요?");
  if (requirements.some((item) => item.id === "security-check" || item.support === "별도 도구 선택 필요")) questions.push("사용할 보안 검사 도구는 무엇인가요?");
  if (requirements.some((item) => item.id === "risk-condition")) questions.push("고위험 판정 기준은 무엇인가요?");
  if (requirements.some((item) => item.kind === "condition" && item.id !== "risk-condition")) questions.push("추가 조건과 기준은 어떻게 정할까요?");
  if (requirements.some((item) => item.id === "slack-destination")) questions.push("Slack 연결 및 권한은 어떻게 설정할까요?");
  if (requirements.some((item) => item.id === "merge-constraint")) questions.push("승인 없는 merge 차단 적용 방식은 무엇인가요?");
  if (requirements.some((item) => item.kind === "destination" && item.support !== "표준 선택으로 표현 가능")) questions.push("결과는 어떤 방식으로 받을까요?");
  if (requirements.some((item) => item.kind === "unknown" && item.id !== "review-input-gap")) {
    questions.push("개인정보나 민감한 정보가 포함되나요?");
    questions.push("사용자 확인이 필요한 조건이 있나요?");
  }
  for (const requirement of customRequirements) {
    if (requirement.kind === "unknown") questions.push(`추가 요구사항 “${requirement.value}”의 적용 위치는 어디인가요?`);
    if (requirement.kind === "source" || requirement.kind === "data") questions.push(`추가 입력 “${requirement.value}”의 연결 및 권한은 어떻게 확인할까요?`);
    if (requirement.kind === "destination") questions.push(`추가 결과 위치 “${requirement.value}”의 연결 및 권한은 어떻게 확인할까요?`);
  }
  return [...new Set(questions)];
}

export function getCapabilityStatus(options: Bf0ChoiceOption[], value: string | null): Bf0CapabilityStatus {
  const selectedStatus = options.find((option) => option.value === value)?.status;
  if (selectedStatus) return selectedStatus;
  if (!value?.trim()) return "현재 미지원";
  if (options === BF0_SOURCE_OPTIONS || options === BF0_OUTPUT_OPTIONS) return "연결 필요";
  if (options === BF0_GOAL_OPTIONS) return "구축 가이드 제공";
  return "현재 미지원";
}

export function getCapabilityDescription(options: Bf0ChoiceOption[], value: string | null): string {
  return options.find((option) => option.value === value)?.description ?? "선택한 항목의 구축 가능 여부를 확인해야 합니다.";
}

export function buildWorkflowDraft(draft: Bf0DesignDraft) {
  return [
    { label: "입력", value: draft.source ?? "입력 위치 미정", description: "새 정보가 들어오면 설계 검토를 시작합니다." },
    { label: "처리", value: draft.goal ?? "목표 미정", description: "선택한 목표에 맞는 처리 규칙을 구축 단계에서 정의합니다." },
    { label: "확인", value: draft.approval ?? "승인 방식 미정", description: "실제 외부 작업 전에는 승인 범위와 조건을 별도로 확인합니다." },
    { label: "결과", value: draft.output ?? "결과 위치 미정", description: "선택한 위치로 결과를 보내기 위한 연결 여부를 구축 단계에서 확인합니다." },
  ];
}

type PlanState = Bf0BuildPlanItem["state"];
type BuildPlanDraftItem = Omit<Bf0BuildPlanItem, "actor" | "timing" | "workLocation" | "task" | "reason" | "actionInputs" | "inputTargets" | "nextAction"> & Partial<Pick<Bf0BuildPlanItem, "actor" | "timing" | "workLocation" | "task" | "reason" | "actionInputs" | "inputTargets" | "nextAction">>;

const OFFICIAL_SOURCES = {
  googleForms: "https://support.google.com/docs/answer/2839737",
  githubPullRequestReview: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-pull-requests-quickstart",
  githubPullRequestReviews: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews",
  slackCreateChannel: "https://slack.com/help/articles/201402297-Create-a-channel",
  slackSendMessages: "https://slack.com/help/articles/201457107-Send-and-read-messages",
} as const;

const UNVERIFIED_LOCATION_COPY = "현재 공식 화면 기준 확인 필요";

function planStateFromCapability(status: Bf0CapabilityStatus): PlanState {
  if (status === "추가 연결 필요") return "연결 필요";
  if (status === "연결 필요") return "연결 필요";
  if (status === "구축 가이드 제공") return "구축 가이드";
  if (status === "현재 미지원") return "현재 미지원";
  return "설계 초안";
}

function sourcePlan(draft: Bf0DesignDraft): Omit<BuildPlanDraftItem, "id"> {
  const source = draft.source ?? "입력 위치";
  const state = planStateFromCapability(getCapabilityStatus(BF0_SOURCE_OPTIONS, draft.source));
  const guides: Record<string, Omit<BuildPlanDraftItem, "id">> = {
    Gmail: {
      title: "Gmail 입력 준비",
      state,
      workLocation: "Gmail",
      summary: "문의 메일을 구분하기 전에 사용할 계정, 테스트 메일, 읽기 권한 범위를 정리합니다.",
      detail: "새 문의를 가져오려면 메일을 읽을 수 있는 계정과 최소 권한 범위가 필요합니다.",
      steps: ["자동화에 사용할 Google 계정을 선택합니다.", "개인정보가 없는 테스트 문의 메일을 한 통 준비합니다.", "실제 연결 전에는 읽기 권한만 필요한지 검토합니다."],
      actionInputs: [{ label: "준비할 테스트 입력", values: ["개인정보가 없는 문의 메일 1건", "자동화에 사용할 Google 계정", "읽기 권한 검토 기준"] }],
      completion: "사용할 계정과 테스트 메일, 필요한 최소 권한이 정리되면 완료입니다.",
      caution: "아직 BuildFlow와 Gmail은 연결되지 않았습니다. 테스트 계정 또는 별도 라벨 사용을 권장합니다.",
      guideLabel: "Gmail 공식 설정 열기",
      guideState: "연결 필요",
      guideUrl: "https://mail.google.com/",
      editRoute: "source",
      editLabel: "입력 위치 다시 선택",
    },
    "웹 폼": {
      title: "웹 폼 입력 준비",
      state,
      workLocation: "Google Forms 또는 사용 중인 웹 폼",
      summary: "문의에 필요한 필드와 테스트 응답을 정리해 웹 폼 기반 설계의 입력 구조를 확인합니다.",
      detail: "웹 폼의 제출 데이터는 이름, 문의 내용처럼 실제 분류에 필요한 항목만 포함해야 합니다.",
      steps: ["새 테스트 폼을 준비하거나 사용할 기존 폼을 정하세요.", "질문 항목에 이름, 이메일, 문의 유형, 문의 내용을 추가할지 확인하세요.", "개인정보가 없는 테스트 응답 1건을 직접 입력할 준비를 하세요."],
      actionInputs: [{ label: "질문 항목", values: ["이름", "이메일", "문의 유형", "문의 내용"] }],
      inputTargets: googleFormQuestionTargets(["이름", "이메일", "문의 유형", "문의 내용"]),
      completion: "필요한 입력 항목이 준비됐고 개인정보가 없는 테스트 응답 1건을 직접 입력할 준비가 되면 완료입니다.",
      caution: "폼 응답이 BuildFlow로 전달되거나 저장되는 상태는 아닙니다.",
      guideLabel: "Google Forms 열기",
      guideState: "구축 가이드",
      guideUrl: "https://forms.google.com/",
      editRoute: "source",
      editLabel: "입력 위치 다시 선택",
    },
    "파일 업로드": {
      title: "사용할 파일 형식 정하기",
      state,
      workLocation: "Google Drive 또는 파일 보관 위치",
      summary: "파일 업로드로 시작하는 설계에 사용할 형식, 필수 항목, 테스트 파일을 정합니다.",
      detail: "파일마다 열 이름과 내용 형식이 다를 수 있으므로 정리할 정보와 출력 형식을 먼저 합의해야 합니다.",
      steps: ["우선 지원할 파일 형식과 최대 크기를 정합니다.", "정리할 열 또는 문서 항목을 목록으로 만듭니다.", "개인정보가 없는 샘플 파일 한 개를 준비합니다."],
      actionInputs: [{ label: "준비할 내용", values: ["파일 형식", "정리할 열 또는 문서 항목", "개인정보가 없는 샘플 파일 1개"] }],
      completion: "파일 형식, 정리 대상, 샘플 파일이 준비되면 완료입니다.",
      caution: "파일 업로드와 저장은 현재 UI-only 범위에서 수행하지 않습니다.",
      guideLabel: "Google Drive 열기",
      guideState: "구축 가이드",
      guideUrl: "https://drive.google.com/",
      editRoute: "source",
      editLabel: "입력 위치 다시 선택",
    },
    Slack: {
      title: "Slack 입력 범위 정하기",
      state,
      workLocation: "Slack 설정",
      summary: "어떤 채널의 어떤 메시지를 입력으로 볼지와 테스트 채널을 먼저 정합니다.",
      detail: "Slack 메시지를 입력으로 사용하려면 대상 채널과 읽기 권한의 범위를 최소화해야 합니다.",
      steps: ["대상 Slack 워크스페이스와 테스트 채널을 정합니다.", "처리할 메시지 유형과 제외할 대화를 구분합니다.", "민감정보가 없는 테스트 메시지를 준비합니다."],
      actionInputs: [{ label: "정할 내용", values: ["워크스페이스", "테스트 채널", "처리할 메시지 유형", "제외할 대화 기준"] }],
      completion: "대상 채널과 메시지 범위, 테스트 메시지가 정리되면 완료입니다.",
      caution: "Slack 연결이나 메시지 읽기는 아직 시작되지 않았습니다.",
      guideLabel: "Slack 공식 사이트 열기",
      guideState: "연결 필요",
      guideUrl: "https://slack.com/",
      editRoute: "source",
      editLabel: "입력 위치 다시 선택",
    },
    "직접 입력": {
      title: "직접 입력 기준 정리",
      state,
      workLocation: "BuildFlow 내부 설계",
      summary: "사용자가 직접 넣는 정보의 형식과 확인 항목을 설계 초안으로 정리합니다.",
      detail: "직접 입력은 외부 연결 없이 시작점을 확인할 수 있지만, 실제 처리 규칙은 별도 검토가 필요합니다.",
      steps: ["입력할 내용과 기대 결과를 한 문장으로 정리합니다.", "민감한 정보는 입력하지 않는 기준을 정합니다.", "테스트에 사용할 예시 입력을 준비합니다."],
      actionInputs: [{ label: "작성할 내용", values: ["입력 예시 1개", "기대 결과", "민감정보 제외 기준"] }],
      completion: "입력 기준과 안전한 예시가 준비되면 완료입니다.",
      caution: "직접 입력도 실제 Runtime 실행이나 저장을 시작하지 않습니다.",
      guideLabel: "입력 위치 다시 보기",
      guideState: "설계 초안",
      guideRoute: "source",
      editRoute: "source",
      editLabel: "입력 위치 다시 선택",
    },
    "정해진 시간": {
      title: "실행 주기와 시간대 정하기",
      state,
      workLocation: "일정 설계",
      summary: "정기 실행을 위한 주기, 시간대, 실행하지 않을 기간을 설계합니다.",
      detail: "예약 실행은 실제 연결과 운영 검증 전에 시간대와 실패 시 처리 방식을 먼저 정해야 합니다.",
      steps: ["매일·매주 등 원하는 실행 주기를 정합니다.", "사용자 기준 시간대와 휴일 처리 기준을 적습니다.", "샘플 데이터로 검토할 시간을 정합니다."],
      actionInputs: [{ label: "정할 내용", values: ["실행 주기", "요일과 시간", "휴일 또는 예외 기간"] }],
      completion: "주기, 시간대, 예외 기간이 정리되면 완료입니다.",
      caution: "현재 화면은 예약 실행을 설정하거나 시작하지 않습니다.",
      guideLabel: "Google Calendar 열기",
      guideState: "구축 가이드",
      guideUrl: "https://calendar.google.com/",
      editRoute: "source",
      editLabel: "입력 위치 다시 선택",
    },
  };

  return guides[source] ?? {
    title: `${source} 입력 준비`, state, workLocation: source, summary: getCapabilityDescription(BF0_SOURCE_OPTIONS, draft.source), detail: "입력 위치의 실제 연결과 권한 획득은 이 UI 범위에 포함되지 않습니다.", steps: ["입력 형식과 빈도를 적으세요.", "개인정보가 없는 안전한 샘플을 준비하세요."], completion: "입력 위치와 검토 범위가 정리되면 완료입니다.", caution: "현재 선택은 연결되었거나 수신을 시작했다는 뜻이 아닙니다.", guideLabel: "입력 위치 다시 보기", guideState: state, guideRoute: "source", editRoute: "source", editLabel: "입력 위치 다시 선택",
  };
}

function goalPlan(draft: Bf0DesignDraft): Omit<BuildPlanDraftItem, "id"> {
  const goal = draft.goal ?? "선택한 목표";
  const guides: Record<string, Omit<BuildPlanDraftItem, "id">> = {
    "분류하고 담당자에게 전달": { title: "문의 분류 기준 정리", state: "설계 초안", workLocation: "BuildFlow 내부 설계", summary: "문의 유형, 담당자, 전달하지 않을 예외를 기준으로 분류 초안을 만듭니다.", detail: "분류 결과가 누구에게 전달되는지와 잘못 분류됐을 때의 처리 기준이 필요합니다.", steps: ["자주 발생하는 문의 유형을 3~5개로 적으세요.", "각 문의 유형 옆에 담당자 또는 검토자를 적으세요.", "분류가 불명확할 때 사용자 확인으로 보내는 기준을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["문의 유형", "담당자 또는 검토자", "분류가 애매할 때의 확인 기준"] }], completion: "문의 유형, 담당자, 예외 기준이 한 번에 볼 수 있게 정리되면 완료입니다.", caution: "분류 규칙과 메시지 전달은 아직 실행되지 않습니다.", guideLabel: "목표 다시 보기", guideState: "설계 초안", guideRoute: "goal", editRoute: "goal", editLabel: "목표 다시 선택" },
    "정기 보고서 생성": { title: "보고서에 포함할 항목 확인", state: "설계 초안", workLocation: "BuildFlow 내부 설계", summary: "보고서 목적, 포함할 지표, 수신자가 이해할 형식을 설계합니다.", detail: "보고서 생성 전에는 데이터 출처와 갱신 주기, 누락 데이터 처리 방식을 확인해야 합니다.", steps: ["보고서가 답해야 할 질문을 적으세요.", "포함할 지표와 기간을 선택하세요.", "읽는 사람이 확인할 요약 형식을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["보고서 질문", "포함할 지표", "기간", "요약 형식"] }], completion: "지표, 기간, 요약 형식이 정리되면 완료입니다.", caution: "보고서 데이터 수집이나 생성은 아직 수행하지 않습니다.", guideLabel: "목표 다시 보기", guideState: "설계 초안", guideRoute: "goal", editRoute: "goal", editLabel: "목표 다시 선택" },
    "데이터 정리 및 저장": { title: "정리할 항목과 출력 형식 확인", state: "설계 초안", workLocation: "BuildFlow 내부 설계", summary: "흩어진 정보에서 남길 항목, 형식, 검토 기준을 설계합니다.", detail: "데이터 정리는 원본 보존 여부와 중복·누락 처리 기준을 먼저 정해야 합니다.", steps: ["남길 항목과 제거할 항목을 나눠 적으세요.", "출력 형식과 이름 규칙을 적으세요.", "중복·누락 값의 처리 기준을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["남길 항목", "제거할 항목", "출력 형식", "중복·누락 처리 기준"] }], completion: "정리 대상과 출력 형식, 예외 기준이 정리되면 완료입니다.", caution: "데이터 변경이나 저장은 이 화면에서 수행하지 않습니다.", guideLabel: "목표 다시 보기", guideState: "설계 초안", guideRoute: "goal", editRoute: "goal", editLabel: "목표 다시 선택" },
    "검사·검증": { title: "검사 기준과 예외 조건 정리", state: "설계 초안", workLocation: "BuildFlow 내부 설계", summary: "무엇을 확인할지, 어떤 결과를 위험으로 볼지, 사용자 확인이 필요한 경우를 설계합니다.", detail: "검사 기준과 결과 처리 방식은 실제 도구 연결이나 실행 전에 먼저 확인해야 합니다.", steps: ["확인할 변경사항이나 결과 범위를 적으세요.", "위험 또는 예외로 판단할 기준을 적으세요.", "사용자 확인이 필요한 결과 처리 방식을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["검사 범위", "위험 기준", "사용자 확인 조건"] }], completion: "검사 기준, 예외 조건, 사용자 확인 지점이 정리되면 완료입니다.", caution: "이 선택은 실제 검사 실행이나 검증 성공을 의미하지 않습니다.", guideLabel: "목표 다시 보기", guideState: "설계 초안", guideRoute: "goal", editRoute: "goal", editLabel: "목표 다시 선택" },
    "반복 업무 알림": { title: "알림 조건과 수신자 정리", state: "설계 초안", workLocation: "BuildFlow 내부 설계", summary: "어떤 조건에서 누구에게 어떤 내용을 알려줄지 설계합니다.", detail: "알림이 과도해지지 않도록 조건, 빈도, 중단 기준을 명확히 해야 합니다.", steps: ["알림을 시작할 조건을 한 문장으로 적으세요.", "수신자와 전달 내용을 적으세요.", "반복 알림 제한과 취소 기준을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["알림 조건", "수신자", "전달 내용", "반복 제한"] }], completion: "조건, 수신자, 빈도 기준이 정리되면 완료입니다.", caution: "알림 발송이나 예약은 아직 시작되지 않습니다.", guideLabel: "목표 다시 보기", guideState: "설계 초안", guideRoute: "goal", editRoute: "goal", editLabel: "목표 다시 선택" },
  };
  return guides[goal] ?? { title: `${goal} 기준 정리`, state: "설계 초안", workLocation: "BuildFlow 내부 설계", summary: `“${draft.idea || "입력한 아이디어"}”의 기대 결과와 제외 범위를 정리합니다.`, detail: "현재 선택은 브라우저 세션에만 유지되는 설계 초안입니다.", steps: ["기대 결과를 한 문장으로 적으세요.", "제외할 작업과 예외 상황을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["기대 결과", "제외할 작업", "예외 상황"] }], completion: "목표와 제외 범위가 검토되면 완료입니다.", caution: "실제 Agent나 실행 계획을 생성하지 않습니다.", guideLabel: "목표 다시 보기", guideState: "설계 초안", guideRoute: "goal", editRoute: "goal", editLabel: "목표 다시 선택" };
}

function approvalPlan(draft: Bf0DesignDraft): Omit<BuildPlanDraftItem, "id"> {
  const approval = draft.approval ?? "승인 방식";
  const details: Record<string, { summary: string; steps: string[]; actionInputs: Bf0BuildPlanItem["actionInputs"]; completion: string; caution: string }> = {
    "항상 승인": { summary: "모든 외부 작업 전 사용자의 확인을 받는 기준을 정합니다.", steps: ["승인 요청을 받을 사람을 적으세요.", "확인해야 하는 정보와 취소 기준을 적으세요.", "응답이 없을 때 진행하지 않는 원칙을 확인하세요."], actionInputs: [{ label: "입력할 내용", values: ["승인 담당자", "확인할 정보", "취소 기준", "응답 없음 처리"] }], completion: "승인 담당자와 취소 기준이 정리되면 완료입니다.", caution: "이 선택은 실제 승인 요청을 만들거나 소비하지 않습니다." },
    "중요 작업만 승인": { summary: "전송·삭제·수정처럼 영향이 큰 작업만 구분해 확인하는 기준을 정합니다.", steps: ["외부 영향이 큰 작업을 목록으로 적으세요.", "자동 검토와 사용자 확인의 경계를 적으세요.", "경계가 애매한 작업은 승인으로 보내는 원칙을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["승인이 필요한 작업", "자동 검토 가능 작업", "애매한 작업 처리 원칙"] }], completion: "승인이 필요한 작업 범위가 정리되면 완료입니다.", caution: "실제 승인 정책이나 자동 실행 허가가 아닙니다." },
    "조건부 승인": { summary: "금액, 대상, 분류 결과처럼 확인이 필요한 조건을 설계합니다.", steps: ["승인을 요구할 조건을 구체적으로 적으세요.", "조건에 맞지 않을 때의 중단 기준을 적으세요.", "조건 변경 권한을 가진 사람을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["승인 조건", "중단 기준", "조건 변경 담당자"] }], completion: "조건과 중단 기준이 검토되면 완료입니다.", caution: "조건 기반 실행은 별도 Runtime·Approval Gate에서 검증해야 합니다." },
    "자동 진행": { summary: "향후 자동화를 검토할 수 있는 반복 작업의 조건을 설계 선호로 기록합니다.", steps: ["반복되고 영향이 낮은 작업만 후보로 적으세요.", "사용자 확인이 필요한 예외를 먼저 적으세요.", "실제 허가 전 검증 기준을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["자동화 후보", "사용자 확인 예외", "실제 허가 전 검증 기준"] }], completion: "자동화 후보와 예외 기준이 정리되면 완료입니다.", caution: "자동 진행은 실제 실행 가능·승인 완료·자동 실행 허가를 의미하지 않습니다." },
  };
  const detail = details[approval] ?? details["항상 승인"];
  return { title: `${approval} 방식 확인`, state: "검증 필요", workLocation: "BuildFlow 내부 설계", summary: detail.summary, detail: "승인 요청 생성·결정·소비는 기존 Product/Runtime 경계의 별도 기능이며 이 UI가 실행하지 않습니다.", steps: detail.steps, actionInputs: detail.actionInputs, completion: detail.completion, caution: detail.caution, guideLabel: "승인 방식 다시 보기", guideState: "검증 필요", guideRoute: "approval", editRoute: "approval", editLabel: "승인 방식 다시 선택" };
}

function outputPlan(draft: Bf0DesignDraft): Omit<BuildPlanDraftItem, "id"> {
  const output = draft.output ?? "결과 위치";
  const state = planStateFromCapability(getCapabilityStatus(BF0_OUTPUT_OPTIONS, draft.output));
  const guides: Record<string, Omit<BuildPlanDraftItem, "id">> = {
    Slack: { title: "Slack 결과 채널 준비", state, workLocation: "Slack 설정", summary: "결과를 받을 워크스페이스와 테스트 채널, 메시지 형식을 정합니다.", detail: "결과를 전달하려면 대상 채널과 메시지 작성 권한의 범위를 최소화해야 합니다.", steps: ["결과를 받을 테스트용 Slack 채널을 정하세요.", "누가 결과를 확인할지와 메시지 형식을 적으세요.", "실제 연결 전 테스트 메시지 기준을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["워크스페이스", "테스트 채널", "결과 확인자", "메시지 형식"] }], inputTargets: slackChannelTargets(["테스트 채널", "메시지 형식"]), completion: "테스트 채널과 결과 형식이 정리되면 완료입니다.", caution: "Slack으로 메시지를 보내거나 연결하지 않았습니다.", guideLabel: "Slack 공식 사이트 열기", guideState: "연결 필요", guideUrl: "https://slack.com/", editRoute: "output", editLabel: "결과 위치 다시 선택" },
    "이메일": { title: "이메일 수신자와 제목 형식 정하기", state, workLocation: "이메일 설정", summary: "결과를 받을 수신자, 제목 규칙, 검토용 테스트 메일을 정합니다.", detail: "이메일 전달은 수신자 범위와 민감 정보 포함 여부를 먼저 검토해야 합니다.", steps: ["테스트 수신자와 제목 형식을 적으세요.", "결과 본문에 포함할 정보와 제외할 정보를 구분하세요.", "테스트용 수신 환경을 준비하세요."], actionInputs: [{ label: "입력할 내용", values: ["테스트 수신자", "제목 형식", "본문 포함 항목", "본문 제외 항목"] }], completion: "수신자, 제목, 본문 기준이 정리되면 완료입니다.", caution: "이메일 발송이나 계정 연결은 아직 수행하지 않습니다.", guideLabel: "결과 위치 다시 보기", guideState: "연결 필요", guideRoute: "output", editRoute: "output", editLabel: "결과 위치 다시 선택" },
    "문서": { title: "문서 저장 위치와 이름 규칙 정하기", state, workLocation: "Google Docs 또는 문서 보관 위치", summary: "문서의 위치, 제목 형식, 접근 권한과 검토 기준을 설계합니다.", detail: "문서에 남길 내용과 공유 범위는 실제 저장 전 별도로 확인해야 합니다.", steps: ["테스트용 문서 위치를 정하세요.", "문서 제목과 섹션 형식을 적으세요.", "검토자와 공유 범위를 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["문서 위치", "제목 형식", "섹션 형식", "검토자", "공유 범위"] }], completion: "저장 위치, 이름 규칙, 공유 범위가 정리되면 완료입니다.", caution: "문서 생성이나 저장은 아직 수행하지 않습니다.", guideLabel: "Google Docs 열기", guideState: "구축 가이드", guideUrl: "https://docs.google.com/", editRoute: "output", editLabel: "결과 위치 다시 선택" },
    "데이터베이스": { title: "데이터베이스 결과 저장은 현재 미지원", state, workLocation: "후속 DB Scope 필요", summary: "현재 UI-only 범위에는 결과를 데이터베이스에 저장하는 기능이 포함되지 않습니다.", detail: "데이터 저장에는 별도 스키마, 권한, 보존 정책, 검증 Gate가 필요합니다.", steps: ["필요한 저장 항목과 보존 기간을 적으세요.", "별도 제품·DB Scope 요청 전에 사용자 영향과 권한을 검토하세요."], actionInputs: [{ label: "후속 Scope에 필요한 내용", values: ["저장 항목", "보존 기간", "권한 범위"] }], completion: "후속 Scope에서 저장 요구를 검토할 준비가 되면 완료입니다.", caution: "현재 상태에서 DB 연결·Migration·저장은 진행하지 않습니다.", guideLabel: "결과 위치 다시 보기", guideState: "현재 미지원", guideRoute: "output", editRoute: "output", editLabel: "다른 결과 위치 선택" },
    "다운로드 결과": { title: "다운로드 결과 형식 정하기", state, workLocation: "BuildFlow 내부 설계", summary: "사용자가 내려받을 결과의 파일 형식, 이름, 검토 기준을 설계합니다.", detail: "다운로드 결과는 생성 시점과 보관 방식, 민감 정보 포함 여부를 별도로 확인해야 합니다.", steps: ["필요한 파일 형식과 이름 규칙을 적으세요.", "결과에 포함할 항목과 제외할 항목을 정하세요.", "샘플 결과를 검토할 기준을 적으세요."], actionInputs: [{ label: "입력할 내용", values: ["파일 형식", "이름 규칙", "포함 항목", "제외 항목", "검토 기준"] }], completion: "파일 형식, 이름, 검토 기준이 정리되면 완료입니다.", caution: "파일 생성이나 다운로드 제공은 아직 수행하지 않습니다.", guideLabel: "결과 위치 다시 보기", guideState: "구축 가이드", guideRoute: "output", editRoute: "output", editLabel: "결과 위치 다시 선택" },
  };
  return guides[output] ?? { title: `${output} 결과 준비`, state, workLocation: output, summary: getCapabilityDescription(BF0_OUTPUT_OPTIONS, draft.output), detail: "결과 전달은 실제 외부 서비스 연결과 검증이 완료된 뒤에만 사용할 수 있습니다.", steps: ["결과 형식과 수신자를 적으세요.", "필요한 권한과 실패 시 대처 방법을 검토하세요."], actionInputs: [{ label: "입력할 내용", values: ["결과 형식", "수신자", "필요 권한", "실패 시 대처"] }], completion: "전달 위치와 사용자 검토 기준이 정리되면 완료입니다.", caution: "이 UI는 메시지를 보내거나 데이터를 저장하지 않습니다.", guideLabel: "결과 위치 다시 보기", guideState: state, guideRoute: "output", editRoute: "output", editLabel: "결과 위치 다시 선택" };
}

export function buildBuildPlan(draft: Bf0DesignDraft): Bf0BuildPlanItem[] {
  const source = draft.source ?? "입력 위치";
  const goal = draft.goal ?? "선택한 목표";
  const approval = draft.approval ?? "승인 방식";
  const output = draft.output ?? "결과 위치";
  const requirements = getActiveRequirements(draft);
  const hasGitHubRequirement = requirements.some((item) => item.id === "github-trigger" || item.id === "github-source");
  const hasReviewRequirement = requirements.some((item) => item.id === "review-source");
  const specializedHandledIds = hasGitHubRequirement ? GITHUB_REQUIREMENT_IDS : hasReviewRequirement ? REVIEW_REQUIREMENT_IDS : new Set<string>();
  const additionalRequirements = specializedHandledIds.size > 0
    ? getAdditionalRequirements(requirements, specializedHandledIds)
    : requirements.filter((requirement) => requirement.id.startsWith("user-"));
  const additionalIds = new Set(additionalRequirements.map((requirement) => requirement.id));
  const handledRequirements = requirements.filter((requirement) => !additionalIds.has(requirement.id));
  const requirementPlan = buildRequirementPlan(handledRequirements);
  const additionalRequirementPlan = additionalRequirements.map(buildAdditionalRequirementPlanItem);
  const standardPlan: BuildPlanDraftItem[] = [
    { id: "source", ...sourcePlan(draft) },
    { id: "goal", ...goalPlan(draft) },
    { id: "approval", ...approvalPlan(draft) },
    { id: "output", ...outputPlan(draft) },
    { id: "verification", title: "샘플로 전체 흐름 확인", state: "검증 필요", workLocation: "BuildFlow 내부 설계", summary: `${source} → ${goal} → ${approval} → ${output} 순서를 개인정보가 없는 샘플로 검토합니다.`, detail: "실제 연결 전에는 기대 결과, 실패 시 중단 조건, 사용자 확인 지점을 명확히 해야 합니다.", steps: ["개인정보가 없는 샘플 입력 1건을 준비하세요.", "각 단계의 기대 결과와 중단 조건을 적으세요.", "실제 실행은 별도 승인 및 검증 Gate에서만 진행한다는 점을 확인하세요."], actionInputs: [{ label: "입력할 내용", values: ["개인정보가 없는 샘플 1건", "기대 결과", "실패 시 중단 조건", "사용자 확인 지점"] }], completion: "샘플 입력, 기대 결과, 중단 조건이 정리되면 완료입니다.", caution: "현재 화면은 검증 실행이나 Evidence 생성을 수행하지 않습니다.", guideLabel: "작동 흐름 다시 보기", guideState: "검증 필요", guideRoute: "workflow", editRoute: "workflow", editLabel: "작동 흐름 다시 보기" },
  ];
  const verification = standardPlan.filter((item) => item.id === "verification");
  const requirementsFor = (...kinds: Bf0RequirementKind[]) => handledRequirements.filter((requirement) => kinds.includes(requirement.kind));
  const assignedStandardPlan = standardPlan
    .filter((item) => item.id !== "verification")
    .map((item) => {
      const requirementLinks = item.id === "source"
        ? requirementsFor("trigger", "source", "unknown")
        : item.id === "goal"
          ? requirementsFor("action")
          : item.id === "approval"
            ? requirementsFor("constraint")
            : requirementsFor("destination");
      if (!hasReviewRequirement) return { ...item, requirements: requirementLinks };
      if (item.id === "source") return { ...item, title: "후기 입력 위치 확인", summary: "후기가 어디에 저장되어 있는지와 입력 형식을 먼저 확인합니다.", detail: "후기 저장 위치와 데이터 형식이 정해지기 전에는 실제 수집 방식을 확정할 수 없습니다.", requirements: requirementLinks };
      if (item.id === "goal" && requirementLinks.length > 0) return { ...item, title: "요약 기준 정하기", summary: "주간 요약에 포함할 내용과 제외할 내용을 정합니다.", detail: "요약 기준과 검토 방식은 사용자가 먼저 확인해야 합니다.", requirements: requirementLinks };
      if (item.id === "approval") return { ...item, title: "사용자 확인 방식 정하기", summary: "요약 결과를 확인하거나 수정할 기준을 설계합니다.", detail: "승인과 확인 방식은 실제 실행 허가가 아닌 설계 조건입니다.", requirements: requirementLinks };
      if (item.id === "output" && requirementLinks.length > 0) return { ...item, title: "결과 전달 위치 정하기", summary: "사용자가 결과를 받을 위치와 전달 방식을 확인합니다.", detail: "결과 위치가 정해진 뒤에도 실제 연결과 권한은 별도 검토가 필요합니다.", requirements: requirementLinks };
      return { ...item, requirements: requirementLinks };
    });
  if (requirementPlan.length === 0) return finalizeBuildPlanItems([...assignedStandardPlan, ...additionalRequirementPlan, ...verification]);
  if (hasGitHubRequirement) return finalizeBuildPlanItems([...requirementPlan, ...additionalRequirementPlan, ...verification]);
  const dataAndSchedulePlan = requirementPlan.filter((item) => item.id.startsWith("data-") || item.id.startsWith("schedule-") || item.id.startsWith("condition-"));
  return finalizeBuildPlanItems([
    ...assignedStandardPlan.filter((item) => item.id === "source"),
    ...dataAndSchedulePlan.filter((item) => item.id.startsWith("data-")),
    ...dataAndSchedulePlan.filter((item) => item.id.startsWith("schedule-")),
    ...assignedStandardPlan.filter((item) => item.id === "goal"),
    ...assignedStandardPlan.filter((item) => item.id === "output"),
    ...assignedStandardPlan.filter((item) => item.id === "approval"),
    ...dataAndSchedulePlan.filter((item) => item.id.startsWith("condition-")),
    ...additionalRequirementPlan,
    ...verification,
  ]);
}

function buildRequirementPlan(requirements: Bf0RequirementCandidate[]): BuildPlanDraftItem[] {
  const byId = (id: string) => requirements.filter((item) => item.id === id);
  const hasGitHub = requirements.some((item) => item.id === "github-trigger" || item.id === "github-source");
  if (hasGitHub) {
    const plans: BuildPlanDraftItem[] = [];
    const githubInputRequirements = [...byId("github-trigger"), ...byId("github-source")];
    if (githubInputRequirements.length > 0) plans.push(requirementPlanItem("github-pr-input", "GitHub PR 입력 방식 확인", "연결 필요", "새 PR 생성 이벤트와 코드 변경사항을 어떤 방식으로 받을지 정리합니다.", "GitHub 연결 방식과 최소 권한은 별도 확인이 필요합니다.", ["대상 Repository와 PR 이벤트 범위를 정합니다.", "테스트용 PR 이벤트 범위를 정합니다."], "입력 이벤트와 최소 권한 범위가 정리되면 완료입니다.", "GitHub 연결이나 API 호출은 시작하지 않습니다.", githubInputRequirements));
    if (byId("github-source").length > 0) plans.push(requirementPlanItem("code-change-scope", "분석할 코드 변경 범위 정하기", "구축 가이드", "PR의 어떤 변경사항을 검사할지 정리합니다.", "코드 diff 범위와 제외할 파일을 먼저 확인해야 합니다.", ["검사할 Repository와 경로를 정합니다.", "제외할 생성 파일·민감 파일 기준을 정합니다."], "검사 대상과 제외 기준이 정리되면 완료입니다.", "실제 코드 분석은 수행하지 않습니다.", byId("github-source")));
    if (byId("security-check").length > 0) plans.push(requirementPlanItem("security-tool", "사용할 보안 검사 방식 선택", "검증 필요", "보안 취약점 확인에는 별도 검사 도구 선택이 필요합니다.", "현재 BF0 템플릿은 보안 검사를 실행하거나 검증하지 않습니다.", ["필요한 보안 검사 범위를 정합니다.", "별도 도구의 권한·비용·결과 형식을 검토합니다."], "검사 방식과 검토 기준이 합의되면 완료입니다.", "보안 취약점이 확인됐다고 표현하지 않습니다.", byId("security-check")));
    if (byId("risk-condition").length > 0) plans.push(requirementPlanItem("risk-threshold", "고위험 판정 기준 정하기", "검증 필요", "위험도가 높은 경우를 판단할 기준을 정합니다.", "임계값과 예외 처리는 사용자 또는 보안 담당자가 정해야 합니다.", ["고위험으로 볼 조건을 적습니다.", "오탐과 예외 처리 기준을 정합니다."], "고위험 기준과 예외가 검토되면 완료입니다.", "현재 UI는 위험도를 계산하지 않습니다.", byId("risk-condition")));
    const slackRequirement = byId("slack-destination")[0];
    if (slackRequirement) plans.push(requirementPlanItem("security-slack", `${slackRequirement.value} 알림 위치 준비`, "연결 필요", "고위험 결과를 받을 채널과 수신 범위를 정합니다.", "Slack 연결과 메시지 발송은 별도 권한이 필요합니다.", ["대상 채널과 수신자를 확인합니다.", "테스트 메시지 형식을 정합니다."], "수신 채널과 메시지 형식이 정리되면 완료입니다.", "Slack으로 실제 알림을 보내지 않습니다.", [slackRequirement]));
    const mergeRequirement = byId("merge-constraint")[0];
    if (mergeRequirement) plans.push(requirementPlanItem("merge-constraint", `${mergeRequirement.value} 규칙 확인`, "검증 필요", "승인 없는 자동 merge 금지 요구를 별도 제약으로 보존합니다.", "실제 merge 차단은 GitHub 정책과 승인 설정을 별도로 검토해야 합니다.", ["승인이 필요한 대상과 담당자를 정합니다.", "자동 merge 금지 범위와 예외를 검토합니다."], "승인·차단 규칙이 문서화되면 완료입니다.", "현재 UI는 merge를 차단하거나 승인하지 않습니다.", [mergeRequirement]));
    return plans;
  }
  return requirements.flatMap((item) => {
    if (item.kind === "data") return [requirementPlanItem(`data-${item.id}`, `${item.value} 데이터 형식과 개인정보 범위 확인`, "검증 필요", item.value, "입력 데이터의 형식, 필요한 항목, 개인정보 또는 민감한 정보 포함 여부를 확인합니다.", ["후기 또는 데이터의 저장 위치와 형식을 정합니다.", "개인정보와 제외할 항목을 확인합니다."], "입력 데이터의 범위와 개인정보 처리 원칙이 정리되면 완료입니다.", "현재 UI는 데이터를 읽거나 저장하지 않습니다.", [item])];
    if (item.kind === "schedule") return [requirementPlanItem(`schedule-${item.id}`, "주간 실행 일정 정하기", "검증 필요", item.value, "주기, 요일, 시간대와 예외 일정을 설계합니다.", ["실행할 요일과 시간을 정합니다.", "실행하지 않을 기간과 예외를 정합니다."], "일정과 예외 기준이 정리되면 완료입니다.", "현재 UI는 예약 실행을 설정하지 않습니다.", [item])];
    if (item.kind === "condition") return [requirementPlanItem(`condition-${item.id}`, `${item.value} 기준 정하기`, "검증 필요", item.value, "조건의 기준과 예외 처리를 별도로 확인합니다.", ["조건의 임계값을 정합니다.", "오탐과 예외 처리 기준을 정합니다."], "조건과 예외 기준이 정리되면 완료입니다.", "현재 UI는 조건을 계산하거나 실행하지 않습니다.", [item])];
    return [];
  });
}

function buildAdditionalRequirementPlanItem(requirement: Bf0RequirementCandidate): BuildPlanDraftItem {
  const state: Bf0BuildPlanItem["state"] = requirement.support === "추가 연결 필요" ? "연결 필요" : requirement.support === "구축 가이드 가능" ? "구축 가이드" : requirement.support === "표준 선택으로 표현 가능" ? "설계 초안" : "검증 필요";
  const content: Record<Bf0RequirementKind, { title: string; detail: string; steps: string[] }> = {
    trigger: { title: "추가 시작 조건 확인", detail: "추가 시작 조건의 적용 범위와 예외를 확인합니다.", steps: ["시작 조건을 한 문장으로 검토합니다.", "예외와 중단 기준을 정합니다."] },
    source: { title: "추가 입력 위치 연결 방식 확인", detail: "추가 입력 위치의 형식, 연결 범위, 권한을 확인합니다.", steps: ["입력 형식과 필요한 범위를 정합니다.", "실제 연결 전 권한과 안전한 샘플을 검토합니다."] },
    data: { title: "추가 입력 데이터 확인", detail: "추가 데이터의 형식과 개인정보 포함 여부를 확인합니다.", steps: ["필요한 데이터 항목을 정합니다.", "민감한 정보와 제외할 항목을 검토합니다."] },
    action: { title: "추가 처리 작업 정의", detail: "추가 처리 작업의 기준과 기대 결과를 정합니다.", steps: ["처리 작업의 범위를 적습니다.", "예외와 사용자 확인 기준을 정합니다."] },
    condition: { title: "추가 조건과 기준 정하기", detail: "추가 조건의 임계값과 예외 처리를 확인합니다.", steps: ["조건의 기준을 적습니다.", "오탐과 예외 처리 기준을 정합니다."] },
    destination: { title: "추가 결과 위치 연결 방식 확인", detail: "추가 결과 위치의 연결 방식과 권한 범위를 확인합니다.", steps: ["결과를 받을 위치와 형식을 정합니다.", "실제 연결 전 권한과 수신 범위를 검토합니다."] },
    constraint: { title: "추가 제한 및 승인 규칙 확인", detail: "추가 제한 조건과 승인 경계를 확인합니다.", steps: ["금지 또는 제한 조건을 적습니다.", "예외와 승인 기준을 정합니다."] },
    schedule: { title: "추가 실행 일정 정하기", detail: "추가 일정의 시간대와 예외를 확인합니다.", steps: ["일정과 시간대를 정합니다.", "실행하지 않을 기간을 정합니다."] },
    unknown: { title: "추가 요구사항 확인", detail: "의미와 적용 위치가 확정되지 않은 추가 요구사항을 확인합니다.", steps: ["요구사항의 의미를 구체화합니다.", "적용 위치와 확인 기준을 정합니다."] },
  };
  const item = content[requirement.kind];
  return requirementPlanItem(`additional-${requirement.id}`, `${item.title}: ${requirement.value}`, state, requirement.value, item.detail, item.steps, "추가 요구사항의 의미와 남은 확인 사항이 정리되면 완료입니다.", "이 항목은 설계 초안이며 실제 연결·실행·검증 결과가 아닙니다.", [requirement]);
}

function requirementPlanItem(id: string, title: string, state: Bf0BuildPlanItem["state"], summary: string, detail: string, steps: string[], completion: string, caution: string, requirements: Bf0RequirementCandidate[]): BuildPlanDraftItem {
  const guide = requirementGuide(requirements);
  const actionInputs = actionInputsFromRequirements(requirements);
  const inputValues = actionInputs?.flatMap((group) => group.values) ?? [];
  const inputTargets = id === "github-pr-input"
    ? githubPullRequestTargets(inputValues)
    : id === "security-slack"
      ? slackChannelTargets(["테스트 채널", "메시지 형식"])
      : undefined;
  return { id, title, state, workLocation: inferRequirementWorkLocation(requirements), summary, detail, steps: steps.map(toActionSentence), actionInputs, inputTargets, completion: toCompletionCheck(completion), caution, guideLabel: guide.label, guideState: state, guideUrl: guide.url, guideRoute: guide.url ? undefined : "plan", editRoute: "plan", editLabel: "요구사항 다시 보기", requirements };
}

function finalizeBuildPlanItems(items: BuildPlanDraftItem[]): Bf0BuildPlanItem[] {
  return items.map((item, index) => {
    const actionInputs = item.actionInputs?.filter((group) => group.values.length > 0);
    const workLocation = item.workLocation ?? workLocationFromGuide(item);
    return {
      ...item,
      actor: item.actor ?? "사용자",
      timing: item.timing ?? timingForIndex(index),
      workLocation,
      task: item.task ?? item.summary,
      reason: item.reason ?? item.detail,
      actionInputs,
      inputTargets: item.inputTargets ?? inputTargetsFromActionInputs(item, workLocation, actionInputs),
      nextAction: item.nextAction ?? (items[index + 1] ? `${String(index + 2).padStart(2, "0")} · ${items[index + 1].title}` : "구축 계획 확인 완료"),
    };
  });
}

function timingForIndex(index: number): string {
  if (index === 0) return "구축 계획을 확인한 뒤 첫 번째로 수행합니다.";
  return `STEP ${index} 완료 후 수행합니다.`;
}

function inputTargetsFromActionInputs(item: BuildPlanDraftItem, workLocation: string, actionInputs?: Bf0BuildPlanItem["actionInputs"]): Bf0InputTarget[] | undefined {
  const values = actionInputs?.flatMap((group) => group.values.map((value) => ({ label: group.label, value }))) ?? [];
  if (values.length === 0) return undefined;
  return values.map(({ label, value }, index) => ({
    id: `${item.id}-input-${index + 1}`,
    label,
    service: workLocation,
    screen: UNVERIFIED_LOCATION_COPY,
    control: UNVERIFIED_LOCATION_COPY,
    field: label,
    value,
    format: "현재 공식 화면 기준 확인 필요",
    setting: "현재 공식 화면 기준 확인 필요",
    verificationState: "NOT_VERIFIED",
  }));
}

function googleFormQuestionTargets(values: string[]): Bf0InputTarget[] {
  return values.map((value, index) => ({
    id: `google-form-question-${index + 1}`,
    label: "질문 항목",
    service: "Google Forms",
    screen: "폼 편집 화면",
    control: "질문 추가",
    field: "질문 제목",
    value,
    format: "질문 유형은 설계에 따라 선택",
    setting: "필수 여부는 설계에 따라 설정",
    verificationState: "OFFICIAL_VERIFIED",
    officialSource: OFFICIAL_SOURCES.googleForms,
  }));
}

function slackChannelTargets(values: string[]): Bf0InputTarget[] {
  return values.map((value, index) => ({
    id: `slack-channel-${index + 1}`,
    label: "Slack 채널 설정",
    service: "Slack",
    screen: "채널 생성 화면 또는 채널/DM 화면",
    control: value === "메시지 형식" ? "message field" : "사이드바의 plus sign → Channel",
    field: value === "메시지 형식" ? "message field" : "channel name",
    value,
    format: value === "메시지 형식" ? "텍스트 메시지" : "Slack 채널 이름",
    setting: value === "메시지 형식" ? "전송 전 사용자 확인 기준" : "public/private 여부 선택",
    verificationState: "OFFICIAL_VERIFIED",
    officialSource: value === "메시지 형식" ? OFFICIAL_SOURCES.slackSendMessages : OFFICIAL_SOURCES.slackCreateChannel,
  }));
}

function githubPullRequestTargets(values: string[]): Bf0InputTarget[] {
  return values.map((value, index) => ({
    id: `github-pr-${index + 1}`,
    label: "GitHub PR 확인 항목",
    service: "GitHub",
    screen: index === 0 ? UNVERIFIED_LOCATION_COPY : "Pull request",
    control: index === 0 ? UNVERIFIED_LOCATION_COPY : "Files changed",
    field: index === 0 ? "Repository / PR 범위" : "PR 이벤트 범위",
    value,
    format: "현재 연결 방식과 Repository 기준 확인 필요",
    setting: "현재 공식 화면 기준 확인 필요",
    verificationState: index === 0 ? "NOT_VERIFIED" : "OFFICIAL_VERIFIED",
    officialSource: index === 0 ? undefined : OFFICIAL_SOURCES.githubPullRequestReview,
  }));
}

function workLocationFromGuide(item: BuildPlanDraftItem): string {
  if (item.guideUrl?.includes("mail.google.com")) return "Gmail";
  if (item.guideUrl?.includes("forms.google.com")) return "Google Forms";
  if (item.guideUrl?.includes("drive.google.com")) return "Google Drive";
  if (item.guideUrl?.includes("slack.com")) return "Slack 설정";
  if (item.guideUrl?.includes("docs.google.com")) return "Google Docs";
  if (item.guideUrl?.includes("calendar.google.com")) return "일정 설계";
  if (item.guideRoute) return "BuildFlow 내부 설계";
  return "확인 필요";
}

function inferRequirementWorkLocation(requirements: Bf0RequirementCandidate[]): string {
  if (requirements.some((item) => item.value.toLowerCase().includes("github") || item.id.includes("github"))) return "GitHub 또는 Repository 설정";
  if (requirements.some((item) => item.value.toLowerCase().includes("slack") || item.id.includes("slack"))) return "Slack 설정";
  if (requirements.some((item) => item.kind === "schedule")) return "일정 설계";
  return "BuildFlow 내부 설계";
}

function requirementGuide(requirements: Bf0RequirementCandidate[]): { label: string; url?: string } {
  if (requirements.some((item) => item.value.toLowerCase().includes("github") || item.id.includes("github"))) return { label: "GitHub 열기", url: "https://github.com/" };
  if (requirements.some((item) => item.value.toLowerCase().includes("slack") || item.id.includes("slack"))) return { label: "Slack 공식 사이트 열기", url: "https://slack.com/" };
  return { label: "구축 계획 다시 보기" };
}

function actionInputsFromRequirements(requirements: Bf0RequirementCandidate[]): Bf0BuildPlanItem["actionInputs"] {
  const values = requirements.map((item) => item.value).filter(Boolean);
  return values.length > 0 ? [{ label: "입력할 내용", values }] : undefined;
}

function toActionSentence(value: string): string {
  if (/하세요\.?$/.test(value)) return value;
  return value
    .replace(/정합니다\.$/, "정하세요.")
    .replace(/검토합니다\.$/, "검토하세요.")
    .replace(/준비합니다\.$/, "준비하세요.")
    .replace(/만듭니다\.$/, "만드세요.")
    .replace(/기록합니다\.$/, "기록하세요.")
    .replace(/적습니다\.$/, "적으세요.");
}

function toCompletionCheck(value: string): string {
  return value
    .replace(/정리되면 완료입니다\.$/, "정리되면 완료입니다.")
    .replace(/합의되면 완료입니다\.$/, "합의되면 완료입니다.");
}

export function getCostAndAccessSummary(draft: Bf0DesignDraft) {
  return {
    costRows: [
      ["설계 단계 예상 비용", "현재 구성 기준 산정 전"],
      ["외부 서비스 비용", "연결 후 확인"],
      ["AI Provider 비용", "Provider 선택 후 확인"],
      ["저장 비용", "백엔드 연결 후 확인"],
    ],
    permissionRows: [
      { id: `source-${draft.source ?? "unknown"}`, label: draft.source ?? "입력 위치", detail: `${draft.source ?? "입력 위치"} 처리에 필요한 권한은 연결 후 확인` },
      { id: `output-${draft.output ?? "unknown"}`, label: draft.output ?? "결과 위치", detail: `${draft.output ?? "결과 위치"} 전달에 필요한 권한은 연결 후 확인` },
      { id: `approval-${draft.approval ?? "unknown"}`, label: "외부 작업", detail: `${draft.approval ?? "승인 방식"} 기준을 별도 승인 경계에서 검토` },
    ],
  };
}

export function getStepProgressSummary(items: Bf0BuildPlanItem[], progress: Record<string, Bf0StepProgress>) {
  const userReportedComplete = items.filter((item) => progress[item.id] === "user-reported-complete").length;
  const problemReported = items.filter((item) => progress[item.id] === "problem-reported").length;
  return {
    userReportedComplete,
    problemReported,
    remaining: items.length - userReportedComplete,
    automaticallyVerified: false,
  };
}

export function clampStepIndex(index: number, length: number): number {
  return Math.min(Math.max(0, index), Math.max(0, length - 1));
}

export function getCompletionCopy(draft: Bf0DesignDraft) {
  const activeRequirements = getActiveRequirements(draft);
  const requirementGaps = getRequirementGaps(activeRequirements);
  const unresolvedQuestions = getUnresolvedQuestions(activeRequirements);
  const hasUnresolved = unresolvedQuestions.length > 0 || requirementGaps.length > 0;
  const flow = `${draft.source ?? "입력 확인 필요"} → ${draft.goal ?? "처리 확인 필요"} → ${draft.approval ?? "실행 전 확인"} → ${draft.output ?? "결과 위치 확인 필요"}`;
  return {
    title: "구축 경로 초안이 정리되었습니다",
    lines: [
      hasUnresolved ? "실제 구축 전에 확인할 항목이 남아 있습니다." : "실제 연결과 자동 검증은 아직 수행되지 않았습니다.",
      "외부 서비스는 아직 연결되지 않았습니다.",
      "실제 Agent는 아직 구축 또는 실행되지 않았습니다.",
    ],
    prepared: [
      "요청 요약",
      "구축 계획 초안",
      "사용자가 검토할 다음 행동",
    ],
    notExecuted: [
      "외부 서비스 연결",
      "Runtime 또는 Provider 실행",
      "Agent 구축·배포·자동 검증",
    ],
    nextActions: [
      hasUnresolved ? "남은 확인 항목을 검토합니다." : "구축 계획을 검토합니다.",
      "실제 연결과 실행은 별도 승인 Gate에서 진행합니다.",
    ],
    flow,
    activeRequirements,
    requirementGaps,
    unresolvedQuestions,
    actualVerificationState: "자동 검증되지 않음",
    externalConnectionState: "확인되지 않음",
  };
}
