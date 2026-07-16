import { describe, expect, it } from "vitest";
import { getClarificationQuestions } from "./clarification";
import { getConsentRequirements } from "./consent";
import { assessConstraints } from "./constraints";
import { parseGoal } from "./goal-parser";
import { createRequirementSnapshot } from "./snapshot";

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
