import type { EngineTemplate, NormalizedRecommendationInput, RecommendationScoreBreakdown } from "@/features/recommendations/types";
import { categoryMatch, keywordMatch } from "./classify";
export function scoreTemplate(template: EngineTemplate, input: NormalizedRecommendationInput, categories: ReturnType<typeof import("@/features/recommendations/classify").classifyCategories>): RecommendationScoreBreakdown {
  const difficulty = template.difficulty === input.aiSkillLevel ? 10 : input.aiSkillLevel === "beginner" && template.difficulty === "advanced" ? 2 : 7;
  const constraints = input.canCode || template.difficulty !== "advanced" ? 20 : 10;
  const toolReuse = Math.min(10, template.steps.filter((step) => input.currentTools.includes(step.toolSlug)).length * 5);
  const executionSupport = input.automationLevel === "high" && template.execution_support_level === "template_available" ? 5 : input.automationLevel === "guide" && template.execution_support_level === "guide_only" ? 5 : 3;
  const total = Math.max(0, Math.min(100, Math.round(categoryMatch(template.category, categories) + keywordMatch(template, `${input.goalNormalized} ${input.descriptionNormalized ?? ""}`) + constraints + toolReuse + difficulty + executionSupport)));
  return { category: categoryMatch(template.category, categories), keyword: keywordMatch(template, `${input.goalNormalized} ${input.descriptionNormalized ?? ""}`), constraints, toolReuse, difficulty, executionSupport, total };
}
