import { getExecutionEngineAdapter } from "./engine-adapters";
import { recommendRecipes } from "./catalog";
import type { RecipeRankingPreference } from "./types";

export function buildRecipeFirstView(goal: string, preference: RecipeRankingPreference = {}) {
  const recommendation = recommendRecipes(goal, preference);
  return {
    heading: recommendation.intent.status === "UNDERSTOOD" ? "이해한 목표" : "추천을 준비할게요",
    goalSummary: recommendation.intent.status === "UNDERSTOOD"
      ? [recommendation.intent.frequency === "DAILY" ? "매일" : recommendation.intent.frequency === "WEEKLY" ? "매주" : null, recommendation.intent.domains.includes("AI_NEWS") ? "AI 뉴스 정기 모니터링" : recommendation.intent.originalGoal, recommendation.intent.destinations.includes("SLACK") ? "Slack 요약" : null].filter(Boolean).join(" / ")
      : recommendation.intent.originalGoal,
    recommendation,
    selectedEnginePreview: recommendation.results[0]
      ? getExecutionEngineAdapter(recommendation.results[0].recipe.executionEngineCandidates[0])?.previewBuild(recommendation.results[0].recipe)
      : undefined,
    actualExternalExecution: false as const,
  };
}
