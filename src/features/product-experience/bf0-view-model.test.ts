import { describe, expect, it } from "vitest";
import {
  BF0_GOAL_OPTIONS,
  BF0_OUTPUT_OPTIONS,
  BF0_SOURCE_OPTIONS,
  EMPTY_BF0_DRAFT,
  buildBuildPlan,
  buildNavigatorSummary,
  buildNavigatorPreview,
  buildWorkflowDraft,
  clampStepIndex,
  getCapabilityStatus,
  getCompletionCopy,
  getCostAndAccessSummary,
  getActiveRequirements,
  getFirstIncompleteRoute,
  getIdeaValidationError,
  extractRequirementCandidates,
  getRequirementGaps,
  getUnresolvedQuestions,
  getStepProgressSummary,
  normalizeIdea,
} from "./bf0-view-model";

describe("BF0 product experience ViewModel", () => {
  const completeDraft = {
    idea: "고객 문의를 분류해 담당자에게 보내고 싶어요",
    goal: "분류하고 담당자에게 전달",
    source: "Gmail",
    approval: "항상 승인",
    output: "Slack",
  };

  it("trims and validates idea input without accepting an empty value", () => {
    expect(normalizeIdea("  문의 자동 분류  ")).toBe("문의 자동 분류");
    expect(getIdeaValidationError("   ")).toBe("아이디어를 입력해 주세요.");
    expect(getIdeaValidationError("짧음")).toBe("아이디어를 5자 이상 입력해 주세요.");
    expect(getIdeaValidationError("고객 문의를 자동으로 분류합니다")).toBeNull();
  });

  it("returns the earliest incomplete decision step", () => {
    expect(getFirstIncompleteRoute(EMPTY_BF0_DRAFT)).toBe("idea");
    expect(getFirstIncompleteRoute({ ...EMPTY_BF0_DRAFT, idea: "요청을 정리합니다" })).toBe("goal");
    expect(getFirstIncompleteRoute({ ...completeDraft, output: null })).toBe("output");
    expect(getFirstIncompleteRoute(completeDraft)).toBe("workflow");
  });

  it("projects the selected values into a four-part workflow draft", () => {
    expect(buildWorkflowDraft(completeDraft).map((stage) => stage.value)).toEqual([
      "Gmail",
      "분류하고 담당자에게 전달",
      "항상 승인",
      "Slack",
    ]);
  });

  it("offers the inspection and verification goal without claiming a completed check", () => {
    expect(BF0_GOAL_OPTIONS).toContainEqual(expect.objectContaining({
      value: "검사·검증",
      title: "검사·검증",
      description: "결과나 변경사항이 정해진 조건을 충족하는지 확인합니다.",
    }));
    const draft = { ...completeDraft, goal: "검사·검증" };
    expect(buildWorkflowDraft(draft).find((stage) => stage.label === "처리")?.value).toBe("검사·검증");
    expect(getCompletionCopy(draft).flow).toContain("검사·검증");
    expect(buildBuildPlan(draft).find((item) => item.id === "goal")).toMatchObject({
      title: "검사 기준과 예외 조건 정리",
      caution: expect.stringContaining("실제 검사 실행이나 검증 성공을 의미하지 않습니다"),
    });
  });

  it("keeps unsupported output truthful", () => {
    expect(getCapabilityStatus(BF0_OUTPUT_OPTIONS, "데이터베이스")).toBe("현재 미지원");
    expect(buildBuildPlan({ ...completeDraft, output: "데이터베이스" }).find((item) => item.id === "output")?.state).toBe("현재 미지원");
  });

  it("builds dynamic plan text from selection changes", () => {
    const plan = buildBuildPlan({ ...completeDraft, source: "웹 폼", output: "문서" });
    expect(plan.find((item) => item.id === "source")?.title).toContain("웹 폼");
    expect(plan.find((item) => item.id === "output")?.title).toContain("문서");
  });

  it("maps the Gmail classification plan to official guides and safe plan states", () => {
    const plan = buildBuildPlan(completeDraft);
    expect(plan.map((item) => item.id)).toEqual(["source", "goal", "approval", "output", "verification"]);
    expect(plan.find((item) => item.id === "source")).toMatchObject({
      title: "Gmail 입력 준비",
      state: "연결 필요",
      guideUrl: "https://mail.google.com/",
    });
    expect(plan.find((item) => item.id === "goal")).toMatchObject({ title: "문의 분류 기준 정리", state: "설계 초안", guideRoute: "goal" });
    expect(plan.find((item) => item.id === "approval")).toMatchObject({ state: "검증 필요", guideRoute: "approval" });
    expect(plan.find((item) => item.id === "output")).toMatchObject({ title: "Slack 결과 채널 준비", state: "연결 필요", guideUrl: "https://slack.com/" });
  });

  it("changes the plan for file, report, approval, and email selections", () => {
    const plan = buildBuildPlan({
      idea: "매주 파일 데이터를 정리한 보고서를 이메일로 받고 싶어요",
      source: "파일 업로드",
      goal: "정기 보고서 생성",
      approval: "중요 작업만 승인",
      output: "이메일",
    });
    expect(plan.find((item) => item.id === "source")).toMatchObject({ title: "사용할 파일 형식 정하기", state: "구축 가이드", guideUrl: "https://drive.google.com/" });
    expect(plan.find((item) => item.id === "goal")?.title).toBe("보고서에 포함할 항목 확인");
    expect(plan.find((item) => item.id === "approval")?.title).toBe("중요 작업만 승인 방식 확인");
    expect(plan.find((item) => item.id === "output")?.title).toBe("이메일 수신자와 제목 형식 정하기");
  });

  it("keeps same-provider permission rows uniquely keyed", () => {
    const summary = getCostAndAccessSummary(completeDraft);
    expect(summary.permissionRows.map((row) => row.id)).toEqual(["source-Gmail", "output-Slack", "approval-항상 승인"]);
    expect(new Set(summary.permissionRows.map((row) => row.id)).size).toBe(summary.permissionRows.length);
  });

  it("provides a guide or an internal route for every build-plan item", () => {
    const plan = buildBuildPlan(completeDraft);
    expect(plan.every((item) => Boolean(item.guideUrl || item.guideRoute))).toBe(true);
    expect(plan.every((item) => Boolean(item.editRoute))).toBe(true);
  });

  it("creates a requirement-aware inquiry preview without claiming a verified integration", () => {
    const preview = buildNavigatorPreview("고객 문의를 분류해서 Slack으로 보내고 싶어요");
    expect(preview.status).toBe("조건부 구축 가능");
    expect(preview.recommendedPath.join(" ")).toMatch(/고객 문의|Slack/);
    expect(preview.recommendationReasons.length).toBeGreaterThan(0);
    expect(preview.remainingQuestions.length).toBeGreaterThan(0);
    expect(preview.costStatus).not.toMatch(/0원|무료|외부 LLM 비용 없음/);
    expect(preview.disclaimer).toContain("보장하지 않습니다");
  });

  it("maps report and file ideas to distinct requirement-aware navigator paths", () => {
    expect(buildNavigatorPreview("매주 보고서를 받고 싶어요").recommendedPath.join(" ")).toMatch(/매주|보고서/);
    expect(buildNavigatorPreview("파일을 요약해 문서로 저장하고 싶어요").recommendedPath.join(" ")).toMatch(/요약/);
  });

  it("keeps an ambiguous idea in the additional-confirmation state", () => {
    const preview = buildNavigatorPreview("좋은 일을 자동으로 하고 싶어요");
    expect(preview.status).toBe("추가 확인 필요");
    expect(preview.remainingQuestions.length).toBeGreaterThanOrEqual(3);
  });

  it("separates user step reporting from automatic verification", () => {
    const plan = buildBuildPlan(completeDraft);
    const summary = getStepProgressSummary(plan, {
      source: "user-reported-complete",
      goal: "problem-reported",
    });
    expect(summary.userReportedComplete).toBe(1);
    expect(summary.problemReported).toBe(1);
    expect(summary.automaticallyVerified).toBe(false);
  });

  it("preserves the review, weekly, summary, and unresolved source requirements from Persona A", () => {
    const idea = "손님 후기가 계속 쌓이는데 이걸 좀 정리해서 매주 저한테 요약해서 보여주면 좋겠어요";
    const requirements = extractRequirementCandidates(idea);
    const values = requirements.map((item) => item.value).join(" ");
    expect(values).toContain("손님 후기");
    expect(values).toContain("매주");
    expect(values).toContain("요약");
    expect(values).toContain("사용자 본인");
    expect(values).toContain("입력 출처는 아직 확인되지 않았습니다");
    expect(buildNavigatorPreview(idea, requirements).status).toBe("조건부 구축 가능");
    expect(getUnresolvedQuestions(requirements).join(" ")).toMatch(/후기는 어디|요일과 시간|요약할까요|개인정보|결과/);
    expect(buildBuildPlan({ ...completeDraft, idea, originalIdea: idea, requirementCandidates: requirements, userEditedRequirements: requirements }).map((item) => `${item.title} ${item.summary}`).join(" ")).toMatch(/후기|요약/);
  });

  it("preserves Persona B GitHub PR, security, Slack channel, and merge constraint through the build plan", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요. 승인 없이는 절대 자동 머지되면 안 됩니다.";
    const requirements = extractRequirementCandidates(idea);
    expect(requirements).toContainEqual(expect.objectContaining({ kind: "trigger", value: "GitHub에 새 PR이 생성될 때" }));
    expect(requirements).toContainEqual(expect.objectContaining({ kind: "source", value: "GitHub PR 코드 변경사항" }));
    expect(requirements).toContainEqual(expect.objectContaining({ value: "코드 변경사항의 보안 취약점 검사", support: "별도 도구 선택 필요" }));
    expect(requirements).toContainEqual(expect.objectContaining({ kind: "condition", value: "위험도가 높은 경우" }));
    expect(requirements).toContainEqual(expect.objectContaining({ kind: "destination", value: "Slack #security" }));
    expect(requirements).toContainEqual(expect.objectContaining({ kind: "constraint", value: "승인 없는 자동 merge 금지" }));
    expect(buildNavigatorPreview(idea, requirements).status).toBe("조건부 구축 가능");
    expect(getRequirementGaps(requirements).length).toBeGreaterThan(0);
    const titles = buildBuildPlan({ ...completeDraft, idea, originalIdea: idea, source: "GitHub / Repository", requirementCandidates: requirements, userEditedRequirements: requirements }).map((item) => item.title).join(" ");
    expect(titles).toMatch(/GitHub PR|코드 변경|보안|고위험|Slack #security|merge/);
  });

  it("preserves Persona B requirements when the inspection goal is selected", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요. 승인 없이는 절대 자동 머지되면 안 됩니다.";
    const requirements = extractRequirementCandidates(idea);
    const draft = { ...completeDraft, idea, originalIdea: idea, goal: "검사·검증", source: "GitHub / Repository", output: "Slack", requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true };
    expect(buildWorkflowDraft(draft).map((stage) => stage.value).join(" ")).toMatch(/GitHub|검사·검증|승인|Slack/);
    expect(buildBuildPlan(draft).map((item) => `${item.title} ${item.summary}`).join(" ")).toMatch(/GitHub PR|코드 변경|보안|고위험|Slack #security|merge/);
    expect(getCompletionCopy(draft).unresolvedQuestions.join(" ")).toMatch(/Repository|보안 검사|고위험|Slack|merge/);
  });

  it("uses one requirement-aware summary for Persona B preview and workflow", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요. 승인 없이는 절대 자동 머지되면 안 됩니다.";
    const requirements = extractRequirementCandidates(idea);
    const draft = { ...completeDraft, idea, originalIdea: idea, source: "GitHub / Repository", output: "Slack", requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true };
    const previewSummary = buildNavigatorSummary(draft);
    const workflowSummary = buildNavigatorSummary(draft);
    expect(previewSummary.recommendedPath.join(" ")).toMatch(/GitHub|PR|코드|보안|위험|Slack #security|merge/);
    expect(previewSummary.recommendedPath.join(" ")).not.toMatch(/웹 폼|문의 접수|고객 문의|이메일/);
    expect(workflowSummary.finalFlow).toEqual(previewSummary.finalFlow);
  });

  it("removes deleted Persona B security and risk requirements from every summary and plan projection", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요. 승인 없이는 절대 자동 머지되면 안 됩니다.";
    const edited = extractRequirementCandidates(idea).filter((requirement) => requirement.id !== "security-check" && requirement.id !== "risk-condition");
    const draft = { ...completeDraft, idea, originalIdea: idea, source: "GitHub / Repository", output: "Slack", requirementCandidates: edited, userEditedRequirements: edited, hasUserEditedRequirements: true };
    const summary = buildNavigatorSummary(draft);
    const plan = buildBuildPlan(draft);
    expect(summary.recommendedPath.join(" ")).not.toMatch(/보안 검사|고위험 조건/);
    expect(summary.finalFlow.join(" ")).not.toMatch(/보안 검사|고위험 조건/);
    expect(plan.map((item) => item.title).join(" ")).not.toMatch(/보안 검사|고위험/);
    expect(getCompletionCopy(draft).unresolvedQuestions.join(" ")).not.toMatch(/보안 검사|고위험/);
  });

  it("updates Slack labels and removes merge restrictions after live requirement edits", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요. 승인 없이는 절대 자동 머지되면 안 됩니다.";
    const edited = extractRequirementCandidates(idea)
      .filter((requirement) => requirement.id !== "merge-constraint")
      .map((requirement) => requirement.id === "slack-destination" ? { ...requirement, value: "Slack #security-alerts" } : requirement);
    const draft = { ...completeDraft, idea, originalIdea: idea, source: "GitHub / Repository", output: "Slack", requirementCandidates: edited, userEditedRequirements: edited, hasUserEditedRequirements: true };
    const summary = buildNavigatorSummary(draft);
    const plan = buildBuildPlan(draft);
    expect(summary.recommendedPath.join(" ")).toContain("Slack #security-alerts");
    expect(summary.recommendedPath.join(" ")).not.toMatch(/merge|머지/);
    expect(plan.map((item) => item.title).join(" ")).toContain("Slack #security-alerts");
    expect(plan.map((item) => item.title).join(" ")).not.toMatch(/merge|머지/);
    expect(getCompletionCopy(draft).unresolvedQuestions.join(" ")).not.toMatch(/merge/);
  });

  it("removes deleted Persona A summary and destination meanings without replacing them", () => {
    const idea = "손님 후기가 계속 쌓이는데 이걸 좀 정리해서 매주 저한테 요약해서 보여주면 좋겠어요";
    const edited = extractRequirementCandidates(idea).filter((requirement) => requirement.id !== "summary-action" && requirement.id !== "self-destination");
    const draft = { ...completeDraft, idea, originalIdea: idea, requirementCandidates: edited, userEditedRequirements: edited, hasUserEditedRequirements: true };
    const summary = buildNavigatorSummary(draft);
    const plan = buildBuildPlan(draft);
    expect(summary.recommendedPath.join(" ")).toMatch(/후기 저장 위치|후기 수집|주간 실행/);
    expect(summary.recommendedPath.join(" ")).not.toMatch(/요약|사용자에게 결과 전달/);
    expect(plan.map((item) => item.title).join(" ")).not.toMatch(/요약 기준|결과 전달 위치/);
    expect(getCompletionCopy(draft).unresolvedQuestions.join(" ")).not.toMatch(/결과는 어떤 방식/);
  });

  it("projects an added Persona B destination into summary, plan, and linked requirements", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요. 승인 없이는 절대 자동 머지되면 안 됩니다.";
    const added = { id: "custom-destination-teams", kind: "destination" as const, label: "추가 결과 위치", value: "Teams #security 채널에도 전달", sourceText: idea, support: "추가 연결 필요" as const, confidence: "높음" as const, editable: true };
    const requirements = [...extractRequirementCandidates(idea), added];
    const draft = { ...completeDraft, idea, originalIdea: idea, source: "GitHub / Repository", output: "Slack", requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true };
    const summary = buildNavigatorSummary(draft);
    const plan = buildBuildPlan(draft);
    expect(summary.recommendedPath.join(" ")).toContain("Teams #security");
    expect(summary.finalFlow.join(" ")).toContain("Teams #security");
    expect(summary.requiredAccounts).toContain("Teams 관련 연결 확인 필요");
    expect(plan.map((item) => item.title).join(" ")).toContain("Teams #security");
    expect(plan.flatMap((item) => item.requirements ?? []).map((item) => item.id)).toContain("custom-destination-teams");
  });

  it("projects an added unknown requirement as an explicit confirmation item across every projection", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요.";
    const added = { id: "custom-unknown-log-location", kind: "unknown" as const, label: "기타 요구", value: "이 로그는 어디에 남는가요?", sourceText: idea, support: "현재 템플릿으로 표현 어려움" as const, confidence: "낮음" as const, editable: true };
    const requirements = [...extractRequirementCandidates(idea), added];
    const draft = { ...completeDraft, idea, originalIdea: idea, requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true };
    const summary = buildNavigatorSummary(draft);
    const plan = buildBuildPlan(draft);
    const completion = getCompletionCopy(draft);
    expect(summary.recommendedPath.join(" ")).toContain("이 로그는 어디에 남는가요?");
    expect(summary.recommendationReasons.join(" ")).toMatch(/추가 확인|별도 확인/);
    expect(summary.finalFlow.join(" ")).toContain("이 로그는 어디에 남는가요?");
    expect(plan.flatMap((item) => item.requirements ?? []).map((item) => item.id)).toContain("custom-unknown-log-location");
    expect(completion.unresolvedQuestions.join(" ")).toContain("이 로그는 어디에 남는가요?");
    expect(completion.requirementGaps.map((item) => item.id)).toContain("custom-unknown-log-location");
  });

  it("removes a deleted unknown requirement from summary, plan, and completion", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요.";
    const added = { id: "custom-unknown-log-location", kind: "unknown" as const, label: "기타 요구", value: "이 로그는 어디에 남는가요?", sourceText: idea, support: "현재 템플릿으로 표현 어려움" as const, confidence: "낮음" as const, editable: true };
    const requirements = [...extractRequirementCandidates(idea), added].filter((requirement) => requirement.id !== "custom-unknown-log-location");
    const draft = { ...completeDraft, idea, originalIdea: idea, requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true };
    expect(buildNavigatorSummary(draft).recommendedPath.join(" ")).not.toContain("이 로그는 어디에 남는가요?");
    expect(buildNavigatorSummary(draft).recommendationReasons.join(" ")).not.toContain("이 로그는 어디에 남는가요?");
    expect(buildBuildPlan(draft).flatMap((item) => item.requirements ?? []).map((item) => item.id)).not.toContain("custom-unknown-log-location");
    expect(getCompletionCopy(draft).unresolvedQuestions.join(" ")).not.toContain("이 로그는 어디에 남는가요?");
    expect(getCompletionCopy(draft).requirementGaps.map((item) => item.id)).not.toContain("custom-unknown-log-location");
  });

  it("updates a custom destination name everywhere without retaining its previous value", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요.";
    const added = { id: "custom-destination-teams", kind: "destination" as const, label: "추가 결과 위치", value: "Teams #security-alerts", sourceText: idea, support: "추가 연결 필요" as const, confidence: "높음" as const, editable: true };
    const requirements = [...extractRequirementCandidates(idea), added];
    const draft = { ...completeDraft, idea, originalIdea: idea, requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true };
    const summary = buildNavigatorSummary(draft);
    const plan = buildBuildPlan(draft);
    expect(summary.recommendedPath.join(" ")).toContain("Teams #security-alerts");
    expect(summary.recommendedPath.join(" ")).not.toContain("Teams #security 채널에도 전달");
    expect(plan.map((item) => item.title).join(" ")).toContain("Teams #security-alerts");
  });

  it("removes a deleted custom destination from every user-facing projection", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요.";
    const added = { id: "custom-destination-teams", kind: "destination" as const, label: "추가 결과 위치", value: "Teams #security 채널에도 전달", sourceText: idea, support: "추가 연결 필요" as const, confidence: "높음" as const, editable: true };
    const requirements = [...extractRequirementCandidates(idea), added].filter((requirement) => requirement.id !== "custom-destination-teams");
    const draft = { ...completeDraft, idea, originalIdea: idea, requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true };
    expect(buildNavigatorSummary(draft).recommendedPath.join(" ")).not.toContain("Teams");
    expect(buildBuildPlan(draft).map((item) => item.title).join(" ")).not.toContain("Teams");
  });

  it("projects an added Persona A condition into the summary, plan, and completion gap", () => {
    const idea = "손님 후기가 계속 쌓이는데 이걸 좀 정리해서 매주 저한테 요약해서 보여주면 좋겠어요";
    const added = { id: "custom-condition-negative-reviews", kind: "condition" as const, label: "추가 조건", value: "부정 후기가 3개 이상일 때만 별도 경고", sourceText: idea, support: "기준 추가 확인 필요" as const, confidence: "높음" as const, editable: true };
    const requirements = [...extractRequirementCandidates(idea), added];
    const draft = { ...completeDraft, idea, originalIdea: idea, requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true };
    expect(buildNavigatorSummary(draft).recommendedPath.join(" ")).toContain("부정 후기가 3개 이상");
    expect(buildBuildPlan(draft).map((item) => item.title).join(" ")).toContain("부정 후기가 3개 이상");
    expect(getCompletionCopy(draft).requirementGaps.map((item) => item.id)).toContain("custom-condition-negative-reviews");
  });

  it("removes only the Slack requirement while preserving other Persona B requirements", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요. 승인 없이는 절대 자동 머지되면 안 됩니다.";
    const requirements = extractRequirementCandidates(idea).filter((requirement) => requirement.id !== "slack-destination");
    const draft = { ...completeDraft, idea, originalIdea: idea, source: "GitHub / Repository", output: "문서", requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true };
    const summary = buildNavigatorSummary(draft);
    expect(summary.recommendedPath.join(" ")).not.toMatch(/Slack/);
    expect(summary.requiredAccounts.join(" ")).not.toMatch(/Slack/);
    expect(buildBuildPlan(draft).map((item) => item.title).join(" ")).not.toMatch(/Slack/);
    expect(getCompletionCopy(draft).unresolvedQuestions.join(" ")).not.toMatch(/Slack/);
  });

  it("does not create a duplicate step for an added requirement equivalent to Slack #security", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요.";
    const duplicate = { id: "custom-destination-slack", kind: "destination" as const, label: "추가 결과 위치", value: "  slack   #SECURITY ", sourceText: idea, support: "추가 연결 필요" as const, confidence: "높음" as const, editable: true };
    const requirements = [...extractRequirementCandidates(idea), duplicate];
    const plan = buildBuildPlan({ ...completeDraft, idea, originalIdea: idea, requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true });
    expect(plan.filter((item) => item.title.includes("Slack #security")).length).toBe(1);
    expect(plan.flatMap((item) => item.requirements ?? []).map((item) => item.id)).not.toContain("custom-destination-slack");
  });

  it("removes only the weekly schedule from Persona A projections", () => {
    const idea = "손님 후기가 계속 쌓이는데 이걸 좀 정리해서 매주 저한테 요약해서 보여주면 좋겠어요";
    const requirements = extractRequirementCandidates(idea).filter((requirement) => requirement.id !== "schedule-weekly");
    const draft = { ...completeDraft, idea, originalIdea: idea, requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true };
    expect(buildNavigatorSummary(draft).recommendedPath.join(" ")).not.toMatch(/주간/);
    expect(buildBuildPlan(draft).map((item) => item.title).join(" ")).not.toMatch(/주간 실행 일정/);
    expect(getCompletionCopy(draft).unresolvedQuestions.join(" ")).not.toMatch(/요일과 시간/);
  });

  it("keeps a Step Mode index within the current dynamic plan range", () => {
    expect(clampStepIndex(7, 3)).toBe(2);
    expect(clampStepIndex(-1, 3)).toBe(0);
    expect(clampStepIndex(0, 0)).toBe(0);
  });

  it("keeps Persona B completion gaps and unresolved questions visible", () => {
    const idea = "GitHub에 새 PR이 올라오면 코드 변경사항을 분석해서 보안 취약점이 있는지 확인하고, 위험도가 높으면 Slack #security 채널에 바로 알려줘야 해요. 승인 없이는 절대 자동 머지되면 안 됩니다.";
    const requirements = extractRequirementCandidates(idea);
    const completion = getCompletionCopy({ ...completeDraft, idea, originalIdea: idea, requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true });
    expect(completion.unresolvedQuestions.join(" ")).toMatch(/Repository|보안 검사|고위험|Slack|merge/);
    expect(completion.requirementGaps.length).toBeGreaterThan(0);
  });

  it("assigns each Persona A requirement to one core build-plan item", () => {
    const idea = "손님 후기가 계속 쌓이는데 이걸 좀 정리해서 매주 저한테 요약해서 보여주면 좋겠어요";
    const requirements = extractRequirementCandidates(idea);
    const plan = buildBuildPlan({ ...completeDraft, idea, originalIdea: idea, requirementCandidates: requirements, userEditedRequirements: requirements, hasUserEditedRequirements: true });
    const linkedIds = plan.flatMap((item) => item.requirements?.map((requirement) => requirement.id) ?? []);
    expect(linkedIds.filter((id) => id === "schedule-weekly")).toHaveLength(1);
    expect(linkedIds.filter((id) => id === "review-source")).toHaveLength(1);
    expect(plan.map((item) => item.title)).toEqual(expect.arrayContaining(["후기 입력 위치 확인", "손님 후기 데이터 형식과 개인정보 범위 확인", "주간 실행 일정 정하기", "사용자 확인 방식 정하기", "샘플로 전체 흐름 확인"]));
  });

  it("marks custom source and output selections as requiring connection", () => {
    expect(getCapabilityStatus(BF0_SOURCE_OPTIONS, "내 사내 시스템")).toBe("연결 필요");
    expect(getCapabilityStatus(BF0_OUTPUT_OPTIONS, "내부 알림판")).toBe("연결 필요");
  });

  it("uses the user-edited requirement list even when the user removes every extracted item", () => {
    const requirements = extractRequirementCandidates("후기를 매주 요약해 주세요");
    expect(getActiveRequirements({ ...completeDraft, requirementCandidates: requirements, userEditedRequirements: [], hasUserEditedRequirements: true })).toEqual([]);
  });

  it("does not claim a fixed or zero cost", () => {
    const summary = getCostAndAccessSummary(completeDraft);
    expect(summary.costRows.flat().join(" ")).toContain("산정 전");
    expect(summary.costRows.flat().join(" ")).not.toMatch(/0원|무료|외부 LLM 비용 없음/);
  });

  it("uses completion copy that does not claim execution", () => {
    const completion = getCompletionCopy(completeDraft);
    expect(completion.title).toBe("구축 경로 초안이 정리되었습니다");
    expect(completion.lines.join(" ")).toContain("아직 구축 또는 실행되지 않았습니다");
  });
});
