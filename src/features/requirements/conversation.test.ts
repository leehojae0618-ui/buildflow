import { describe, expect, it } from "vitest";
import { createConversation, getMissingRequirements } from "./conversation";
import { getClarificationQuestions } from "./clarification";
import { parseGoal } from "./goal-parser";

describe("conversation engine", () => {
  it("asks the highest-priority missing question first", () => { const requirement = parseGoal("AI 쇼핑몰 고객센터"); const questions = getClarificationQuestions(requirement); const conversation = createConversation(requirement, questions, 40); expect(conversation.state).toBe("ASKING"); expect(conversation.summary.nextQuestion?.id).toBe("platform"); });
  it("detects required missing requirements", () => { const requirement = parseGoal("블로그 작성", { budget_range: "medium", automation_level: "guide" }); expect(getMissingRequirements(requirement, getClarificationQuestions(requirement))).toContain("주요 사용자"); });
  it("can become ready when no questions remain", () => { const requirement = parseGoal("보고서 작성", { budget_range: "medium", automation_level: "partial", current_tools: ["Notion"] }); const conversation = createConversation(requirement, [], 100); expect(conversation.state).toBe("READY_FOR_BUILD"); expect(conversation.summary.nextQuestion).toBeNull(); });
});
