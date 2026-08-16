import { describe, expect, it } from "vitest";
import { applyBuildPackageClarification, createBuildPackage, evaluateEngineCompatibility } from "./build-package";
import { getExecutionEngineAdapter } from "./engine-adapters";
import { analyzeRecipeIntent } from "./intent";
import { recipeRankingPolicy, rankRecipes, recommendRecipes, retrieveRecipes } from "./catalog";
import { buildRecipeFirstView } from "./recipe-first-view-model";
import { recipeSeeds } from "./seed-recipes";
import { serviceRegistry } from "./service-registry";
import { recipeSchema, serviceDefinitionSchema } from "./types";

const aiNewsGoal = "매일 AI 뉴스를 찾아서 중요한 것만 요약해서 Slack으로 보내줘";

describe("Recipe-First product domain", () => {
  it("validates 21 provenance-bearing canonical recipe seeds", () => {
    expect(recipeSeeds).toHaveLength(21);
    for (const recipe of recipeSeeds) {
      expect(recipeSchema.parse(recipe)).toMatchObject({ verificationStatus: "CURATED" });
      expect(recipe.sourceReferences[0]).toMatchObject({ usageRightsStatus: "GENERALIZED_COMPOSITION" });
    }
  });

  it("validates capability and no-credential connection metadata", () => {
    expect(serviceRegistry.length).toBeGreaterThanOrEqual(12);
    for (const service of serviceRegistry) {
      expect(serviceDefinitionSchema.parse(service)).toEqual(service);
      expect(service.connectionRequirements.every((connection) => connection.storesCredential === false)).toBe(true);
    }
  });

  it("extracts the representative news-to-Slack intent deterministically", () => {
    expect(analyzeRecipeIntent(aiNewsGoal)).toMatchObject({ frequency: "DAILY", domains: ["AI_NEWS"], destinations: ["SLACK"], automation: "SCHEDULED", status: "UNDERSTOOD" });
  });

  it("returns the AI news digest as the first explainable recommendation", () => {
    const result = recommendRecipes(aiNewsGoal);
    expect(result.results).toHaveLength(3);
    expect(result.results[0].recipe.id).toBe("recipe.ai-news-slack-digest");
    expect(result.results[0].reasons).not.toHaveLength(0);
    expect(result.results[0].cautions.join(" ")).toContain("실제 외부 실행");
  });

  it("handles empty and unsupported intent without inventing a recommendation", () => {
    expect(recommendRecipes("").results).toEqual([]);
    expect(recommendRecipes("저녁 메뉴를 골라줘").results).toEqual([]);
  });

  it("applies visible ranking policy for cost and fewer connections", () => {
    const intent = analyzeRecipeIntent("Slack으로 알림 보내줘");
    const base = recipeSeeds.find((recipe) => recipe.id === "recipe.ai-news-slack-digest")!;
    const expensive = { ...base, id: "recipe.expensive", title: "비용 높은 Slack 알림", requiredConnections: ["slack", "groq", "gmail"], costProfile: { tier: "PAID_DEPENDENT" as const, label: "유료" } };
    const economical = { ...base, id: "recipe.economical", title: "무료 Slack 알림", requiredConnections: ["slack"], costProfile: { tier: "FREE_FIRST" as const, label: "무료 우선" } };
    const ranked = rankRecipes(intent, [expensive, economical], { costPreference: "FREE_FIRST", connectionPreference: "FEWER_CONNECTIONS" });
    expect(ranked.map((item) => item.recipe.id)).toEqual(["recipe.economical", "recipe.expensive"]);
    expect(recipeRankingPolicy.freeFirst).toBeGreaterThan(0);
  });

  it("creates preview-only engine plans without external execution", () => {
    const recipe = recipeSeeds[0];
    const adapter = getExecutionEngineAdapter("PIPEDREAM")!;
    expect(adapter.supports(recipe)).toBe(true);
    expect(adapter.previewBuild(recipe)).toMatchObject({ previewStatus: "PREVIEW_ONLY", actualExternalAction: false });
    expect(adapter.validateConfiguration({ recipe, connectedServiceIds: [] }).valid).toBe(false);
  });

  it("keeps the UI view model aligned with top-ranked content", () => {
    const view = buildRecipeFirstView(aiNewsGoal);
    expect(view.goalSummary).toContain("AI 뉴스 정기 모니터링");
    expect(view.recommendation.results[0].recipe.title).toContain("AI 뉴스");
    expect(view.selectedEnginePreview).toMatchObject({ engine: "PIPEDREAM", actualExternalAction: false });
    expect(retrieveRecipes(view.recommendation.intent).length).toBeGreaterThanOrEqual(3);
  });

  it("creates an explainable build package for the representative scheduled recipe", () => {
    const recommendation = recommendRecipes(aiNewsGoal);
    const buildPackage = createBuildPackage({ recipe: recommendation.results[0].recipe, intent: recommendation.intent });
    expect(buildPackage).toMatchObject({ selectedEngine: "MAKE", status: "CONNECTION_REQUIRED", actualExternalAction: false });
    expect(buildPackage.alternativeEngines).toEqual(expect.arrayContaining(["PIPEDREAM", "ACTIVEPIECES", "N8N"]));
    expect(buildPackage.connections).toEqual(expect.arrayContaining([expect.objectContaining({ serviceId: "rss", status: "READY" }), expect.objectContaining({ serviceId: "slack", status: "NOT_CONNECTED", connectionType: "OAUTH" }), expect.objectContaining({ serviceId: "groq", status: "NOT_CONNECTED", connectionType: "API_KEY" })]));
    expect(buildPackage.missingInformation.map((item) => item.question)).toEqual(["몇 시에 실행할까요?", "어느 Slack 채널로 보낼까요?"]);
    expect(buildPackage.testPlan.every((item) => item.status === "PLANNED")).toBe(true);
  });

  it("completes a build package once all missing information is answered (roadmap Step 4)", () => {
    const recommendation = recommendRecipes(aiNewsGoal);
    const buildPackage = createBuildPackage({ recipe: recommendation.results[0].recipe, intent: recommendation.intent });

    const partiallyAnswered = applyBuildPackageClarification(buildPackage, { "schedule-time": "매일 오전 9시" });
    expect(partiallyAnswered.missingInformation.map((item) => item.id)).toEqual(["slack-delivery"]);
    expect(partiallyAnswered.configurationRequirements.find((item) => item.id === "schedule-time")?.defaultValue).toBe("매일 오전 9시");

    const fullyAnswered = applyBuildPackageClarification(partiallyAnswered, { "slack-delivery": "#ai-news" });
    expect(fullyAnswered.missingInformation).toEqual([]);
    expect(fullyAnswered.configurationRequirements.find((item) => item.id === "slack-delivery")?.defaultValue).toBe("#ai-news");
  });

  it("ignores empty or whitespace-only clarification answers instead of fabricating a value", () => {
    const recommendation = recommendRecipes(aiNewsGoal);
    const buildPackage = createBuildPackage({ recipe: recommendation.results[0].recipe, intent: recommendation.intent });

    const result = applyBuildPackageClarification(buildPackage, { "schedule-time": "   ", "slack-delivery": "" });
    expect(result.missingInformation).toEqual(buildPackage.missingInformation);
    expect(result).toEqual(buildPackage);
  });

  it("ignores answers for ids that are not currently missing information", () => {
    const recommendation = recommendRecipes(aiNewsGoal);
    const buildPackage = createBuildPackage({ recipe: recommendation.results[0].recipe, intent: recommendation.intent });

    const result = applyBuildPackageClarification(buildPackage, { "not-a-real-id": "무시되어야 함" });
    expect(result).toEqual(buildPackage);
  });

  it("varies engine ranking with Recipe characteristics and keeps limits visible", () => {
    const scheduled = recipeSeeds.find((recipe) => recipe.id === "recipe.ai-news-slack-digest")!;
    const eventDriven = recipeSeeds.find((recipe) => recipe.id === "recipe.priority-email-alert")!;
    expect(evaluateEngineCompatibility(scheduled)[0]).toMatchObject({ engine: "MAKE", compatibilityScore: 90 });
    expect(evaluateEngineCompatibility(eventDriven)[0]).toMatchObject({ engine: "PIPEDREAM", compatibilityScore: 88 });
    expect(evaluateEngineCompatibility(scheduled).find((item) => item.engine === "PIPEDREAM")?.limitations.join(" ")).toContain("end-user ID");
  });

  it.each([
    ["매일 AI 뉴스를 찾아서 중요한 것만 요약해서 Slack으로 보내줘", "recipe.ai-news-slack-digest"],
    ["중요한 이메일만 골라서 Slack으로 알려줘", "recipe.priority-email-alert"],
    ["회의가 끝나면 내용을 요약해서 Notion에 저장해줘", "recipe.meeting-notion-summary"],
    ["신규 고객 문의를 분류해서 Google Sheets에 기록해줘", "recipe.support-sheet-triage"],
  ])("builds a package for %s", (goal, expectedRecipeId) => {
    const recommendation = recommendRecipes(goal);
    const recipe = recommendation.results.find((item) => item.recipe.id === expectedRecipeId)?.recipe;
    expect(recipe?.id).toBe(expectedRecipeId);
    const buildPackage = createBuildPackage({ recipe: recipe!, intent: recommendation.intent });
    expect(buildPackage.engineCompatibility.some((item) => item.supported)).toBe(true);
    expect(buildPackage.connections.length).toBeGreaterThan(0);
    expect(buildPackage.configurationRequirements.length).toBeGreaterThan(0);
    expect(buildPackage.testPlan.length).toBeGreaterThan(0);
    expect(buildPackage.actualExternalAction).toBe(false);
  });
});
