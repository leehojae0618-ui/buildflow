import { describe, expect, it } from "vitest";
import { analyzeClarification, createClarificationRevisionDiff, getClarificationQuestions } from "./clarification";
import { getConsentRequirements } from "./consent";
import { assessConstraints } from "./constraints";
import { parseGoal } from "./goal-parser";
import { createRequirementSnapshot, projectClarificationDerivedRevision } from "./snapshot";

function revisionDiff(input: {
  blueprintCandidates: "UNCHANGED" | "REGENERATED" | "SELECTED_CANDIDATE_INVALIDATED";
  buildPlan: "UNCHANGED" | "REGENERATED";
  changed?: boolean;
}) {
  const requirement = parseGoal("AI 쇼핑몰 고객센터 만들고 싶어요");
  const questions = getClarificationQuestions(requirement);
  const previous = analyzeClarification({ requirement, revision: 0 });
  const next = analyzeClarification({
    requirement,
    revision: 1,
    answers: questions.map((question) => ({
      questionId: question.id,
      field: question.field,
      value: `${question.id}-answer`,
      source: "USER" as const,
      impact: question.impact!,
    })),
  });
  return createClarificationRevisionDiff({
    previous: { decisionState: previous.decisionState, exitReason: previous.exitReason },
    next: { decisionState: next.decisionState, exitReason: next.exitReason },
    before: input.changed === false ? [] : [{ field: "automationLevel", value: "unknown", present: true, source: "USER_UNKNOWN" }],
    after: input.changed === false ? [] : [{ field: "automationLevel", value: "high", present: true, source: "USER" }],
    reason: input.changed === false ? "ASSUMPTION_ACCEPTED" : "ANSWER_BATCH",
    sourceQuestionIds: ["automation"],
    derivedEffects: {
      blueprintCandidates: input.blueprintCandidates,
      buildPlan: input.buildPlan,
    },
  });
}

describe("requirement foundation", () => {
  it("parses customer support goals", () => { const result = parseGoal("AI 쇼핑몰 고객센터 만들고 싶어요"); expect(result.goalType).toBe("customer_support"); expect(result.category).toBe("customer_service"); });
  it("parses content goals", () => expect(parseGoal("상품 설명 초안 만들기").expectedOutput).toContain("콘텐츠"));
  it("uses unknown safely", () => expect(parseGoal("새로운 시스템").category).toBe("unknown"));
  it("preserves original goal", () => { const goal = "  고객 문의를 자동화하고 싶어요  "; expect(parseGoal(goal).goalOriginal).toBe(goal.trim()); });
  it("asks platform for customer support", () => expect(getClarificationQuestions(parseGoal("쇼핑몰 고객센터")).some((question) => question.id === "platform")).toBe(true));
  it("asks budget when missing", () => expect(getClarificationQuestions(parseGoal("블로그 작성")).some((question) => question.id === "budget")).toBe(true));
  it("classifies high automation as partial", () => expect(assessConstraints(parseGoal("고객센터", { automation_level: "high" }))[0].level).toBe("PARTIAL"));
  it("classifies unknown goals as manual", () => expect(assessConstraints(parseGoal("무언가", { automation_level: "guide", budget_range: "medium" })).some((item) => item.level === "MANUAL")).toBe(true));
  it("requires consent for email", () => expect(getConsentRequirements(parseGoal("이메일 고객센터")).some((item) => item.subject.includes("이메일"))).toBe(true));
  it("creates a complete snapshot", () => { const snapshot = createRequirementSnapshot("Slack으로 고객 문의 알림", { budget_range: "low", automation_level: "partial", current_tools: ["Slack"] }); expect(snapshot.requirement.version).toBe("requirement-v1"); expect(snapshot.constraints.length).toBeGreaterThan(0); expect(snapshot.consents.length).toBeGreaterThan(0); });
  it("stores the CRUD Blueprint capability source of truth", () => {
    const snapshot = createRequirementSnapshot(
      "Task Manager: 회원가입, 사용자별 Todo CRUD, 검색, 상태 변경, 관리자 조회",
      { budget_range: "free", automation_level: "high" },
    );
    expect(snapshot.applicationBlueprintId).toBe("general-crud-v1");
    expect(snapshot.applicationCapabilities).toEqual([
      "AUTH",
      "USER_SCOPED_CRUD",
      "SEARCH",
      "STATUS_WORKFLOW",
      "ADMIN_READ",
      "RESPONSIVE_UI",
    ]);
    expect(
      snapshot.architecture.components.some(
        (component) => component.id === "supabase-auth",
      ),
    ).toBe(true);
    expect(
      snapshot.architecture.components.some(
        (component) => component.id === "openai",
      ),
    ).toBe(false);
  });
  it("does not contain secret-looking values", () => expect(JSON.stringify(createRequirementSnapshot("고객센터"))).not.toMatch(new RegExp("s" + "k-|sb_" + "secret_")));
});

describe("clarification Blueprint and Plan revision projection", () => {
  it("uses the canonical snapshot path once for a material change and retains a valid existing Blueprint", () => {
    const previousSnapshot = createRequirementSnapshot("AI 쇼핑몰 고객센터 만들고 싶어요");
    const previousBefore = structuredClone(previousSnapshot);
    const projection = projectClarificationDerivedRevision({
      diff: revisionDiff({ blueprintCandidates: "REGENERATED", buildPlan: "REGENERATED" }),
      previousSnapshot,
      goal: "AI 쇼핑몰 고객센터 만들고 싶어요",
      constraints: { automation_level: "high" },
    });

    expect(previousSnapshot).toEqual(previousBefore);
    expect(projection.materialChange).toMatchObject({
      isMaterial: true,
      affectedRequirementFields: ["automationLevel"],
      reason: "REQUIREMENT_FACTS_CHANGED",
    });
    expect(projection.regeneration).toEqual({
      performed: true,
      count: 1,
      path: "CREATE_REQUIREMENT_SNAPSHOT",
    });
    expect(projection.blueprint).toMatchObject({
      status: "RETAINED",
      previousSelectedCandidateId: previousSnapshot.selectedCandidateId,
      selectedCandidateId: previousSnapshot.selectedCandidateId,
    });
    expect(projection.plan).toEqual({
      status: "REGENERATED",
      sourceRevision: 1,
      reason: "MATERIAL_REQUIREMENT_CHANGE",
    });
    expect(projection.snapshot?.selectedCandidateId).toBe(previousSnapshot.selectedCandidateId);
  });

  it("does not regenerate Blueprint or Plan projections for a metadata-only revision", () => {
    const previousSnapshot = createRequirementSnapshot("AI 쇼핑몰 고객센터 만들고 싶어요");
    const projection = projectClarificationDerivedRevision({
      diff: revisionDiff({ changed: false, blueprintCandidates: "UNCHANGED", buildPlan: "UNCHANGED" }),
      previousSnapshot,
      goal: "AI 쇼핑몰 고객센터 만들고 싶어요",
    });

    expect(projection.materialChange).toEqual({
      isMaterial: false,
      affectedRequirementFields: [],
      reason: "NO_REQUIREMENT_FACT_CHANGE",
    });
    expect(projection.regeneration).toEqual({ performed: false, count: 0, path: "NONE" });
    expect(projection.blueprint).toMatchObject({
      status: "UNCHANGED",
      selectedCandidateId: previousSnapshot.selectedCandidateId,
      reason: "NO_MATERIAL_CHANGE",
    });
    expect(projection.plan.status).toBe("UNCHANGED");
    expect(projection.snapshot).toBeNull();
  });

  it("supersedes an invalid Blueprint selection without auto-selecting a replacement", () => {
    const previousSnapshot = createRequirementSnapshot("AI 쇼핑몰 고객센터 만들고 싶어요");
    const projection = projectClarificationDerivedRevision({
      diff: revisionDiff({
        blueprintCandidates: "SELECTED_CANDIDATE_INVALIDATED",
        buildPlan: "REGENERATED",
      }),
      previousSnapshot,
      goal: "AI 쇼핑몰 고객센터 만들고 싶어요",
      constraints: {
        cost_preference: "CUSTOM_BUDGET",
        monthly_budget_limit: 0,
      },
    });

    expect(projection.blueprint).toEqual({
      status: "SUPERSEDED",
      previousSelectedCandidateId: previousSnapshot.selectedCandidateId,
      selectedCandidateId: null,
      reason: "SELECTION_INVALIDATED",
    });
    expect(projection.snapshot?.selectedCandidateId).toBeNull();
  });

  it("rejects a derived-effect intent that disagrees with the material-change policy", () => {
    const previousSnapshot = createRequirementSnapshot("AI 쇼핑몰 고객센터 만들고 싶어요");

    expect(() => projectClarificationDerivedRevision({
      diff: revisionDiff({ blueprintCandidates: "UNCHANGED", buildPlan: "UNCHANGED" }),
      previousSnapshot,
      goal: "AI 쇼핑몰 고객센터 만들고 싶어요",
    })).toThrow("material clarification change must regenerate the Build Plan projection");
  });
});
