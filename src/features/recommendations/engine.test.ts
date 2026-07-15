import { describe, expect, it } from "vitest";
import { classifyCategories } from "./classify";
import { normalizeRecommendationInput } from "./normalize";
import { LOW_CONFIDENCE_THRESHOLD, recommend } from "./engine";

const input = normalizeRecommendationInput({ title: "테스트", goal: "회의 메모를 요약하고 보고서를 만들고 싶어요", goal_description: "", goal_constraints: { ai_skill_level: "beginner", can_code: false, budget_range: "free", automation_level: "guide", current_tools: ["Gmail", "Gmail"] } });
const templates = [{ id: "1", slug: "meeting", name: "회의 메모 요약", description: "회의 메모를 요약합니다", category: "productivity", goal_summary: "회의 요약", alternatives: [], cost_model: {}, difficulty: "beginner", estimated_setup_minutes: 15, execution_support_level: "guide_only", steps: [{ toolSlug: "gmail" }] }, { id: "2", slug: "blog", name: "블로그 초안", description: "블로그 글", category: "content", goal_summary: "글 작성", alternatives: [], cost_model: {}, difficulty: "advanced", estimated_setup_minutes: 30, execution_support_level: "guide_only", steps: [] }];
describe("recommendation engine", () => {
  it("normalizes whitespace and duplicate tools", () => { expect(input.currentTools).toEqual(["gmail"]); expect(input.goalNormalized).toContain("회의"); });
  it("classifies multiple categories deterministically", () => { expect(classifyCategories("이메일 보고서 분석").map((item) => item.category)).toEqual(["data", "email"]); });
  it("returns sorted candidates with a maximum of three", () => { const result = recommend(input, templates); expect(result.candidates[0].template.slug).toBe("meeting"); expect(result.candidates.length).toBeLessThanOrEqual(3); });
  it("keeps score between zero and one hundred", () => { const result = recommend(input, templates); expect(result.candidates.every((candidate) => candidate.score.total >= 0 && candidate.score.total <= 100)).toBe(true); });
  it("preserves score breakdown", () => { expect(recommend(input, templates).candidates[0].score).toHaveProperty("category"); });
  it("reuses current tools", () => { expect(recommend(input, templates).candidates[0].score.toolReuse).toBeGreaterThan(0); });
  it("marks low confidence below threshold", () => { const result = recommend(input, [{ ...templates[1], category: "unknown", name: "범용", description: "", goal_summary: "" }]); expect(LOW_CONFIDENCE_THRESHOLD).toBe(40); expect(result.lowConfidence).toBe(true); });
  it("uses stable name tie breaker", () => { const result = recommend(input, templates); expect(result.candidates.map((candidate) => candidate.template.name)).toEqual(["회의 메모 요약", "블로그 초안"]); });
  it("defaults missing constraints safely", () => { const normalized = normalizeRecommendationInput({ title: "제목", goal: null, goal_description: null, goal_constraints: {} }); expect(normalized.aiSkillLevel).toBe("beginner"); expect(normalized.budgetRange).toBe("unknown"); });
  it("creates rule-based reasons", () => { expect(recommend(input, templates).candidates[0].reason).toContain("카테고리"); });
  it("does not mutate original goal", () => { const project = { title: "제목", goal: "  원문 목표  ", goal_description: null, goal_constraints: {} }; normalizeRecommendationInput(project); expect(project.goal).toBe("  원문 목표  "); });
  it("supports empty candidate input", () => { expect(recommend(input, []).candidates).toEqual([]); });
});
