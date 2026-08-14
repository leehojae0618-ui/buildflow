import { analyzeRecipeIntent } from "./intent";
import { recipeSeeds } from "./seed-recipes";
import type { RankedRecipe, Recipe, RecipeIntent, RecipeRankingPreference, RecipeRecommendation } from "./types";

export const recipeRankingPolicy = { goalFit: 55, fewerConnections: 12, freeFirst: 10, verification: 9, automationCoverage: 8, privacyBurden: 6 } as const;

function overlap(needles: string[], haystack: string) { return needles.filter((needle) => haystack.includes(needle)).length; }
function recipeText(recipe: Recipe) { return [recipe.title, recipe.description, ...recipe.userGoalPatterns, ...recipe.inputs, ...recipe.outputs, ...recipe.requiredServices].join(" ").toLocaleLowerCase(); }

export function retrieveRecipes(intent: RecipeIntent, recipes = recipeSeeds): Recipe[] {
  if (intent.status === "EMPTY" || intent.status === "UNSUPPORTED") return [];
  const markers = [...intent.keywords, ...intent.destinations.map((destination) => destination.toLocaleLowerCase()), ...intent.domains.map((domain) => domain.toLocaleLowerCase())];
  return recipes.filter((recipe) => overlap(markers, recipeText(recipe)) > 0 || recipe.userGoalPatterns.some((pattern) => intent.normalizedGoal.includes(pattern)));
}

export function rankRecipes(intent: RecipeIntent, recipes: Recipe[], preference: RecipeRankingPreference = {}): RankedRecipe[] {
  return recipes.map((recipe) => {
    const text = recipeText(recipe);
    const goalMatches = overlap(intent.keywords, text) + overlap(intent.destinations.map((value) => value.toLocaleLowerCase()), text) * 2 + overlap(intent.domains.map((value) => value.toLocaleLowerCase()), text) * 2 + overlap(intent.operations.map((value) => value.toLocaleLowerCase()), text);
    const goalFit = Math.min(recipeRankingPolicy.goalFit, goalMatches * 7 + (recipe.userGoalPatterns.some((pattern) => intent.normalizedGoal.includes(pattern)) ? 20 : 0));
    const connectionScore = preference.connectionPreference === "FULL_CAPABILITY" ? 0 : Math.max(0, recipeRankingPolicy.fewerConnections - recipe.requiredConnections.length * 3);
    const costScore = preference.costPreference === "BALANCED" ? 4 : recipe.costProfile.tier === "FREE_FIRST" ? recipeRankingPolicy.freeFirst : recipe.costProfile.tier === "LOW_COST" ? 6 : 1;
    const verificationScore = recipe.verificationStatus === "LIVE_VALIDATED" ? recipeRankingPolicy.verification : recipe.verificationStatus === "LOCALLY_VALIDATED" ? 7 : 4;
    const automationScore = recipe.automationLevel === "FULL" ? recipeRankingPolicy.automationCoverage : recipe.automationLevel === "PARTIAL" ? 5 : 3;
    const privacyScore = Math.max(0, recipeRankingPolicy.privacyBurden - recipe.requiredConnections.length);
    const score = goalFit + connectionScore + costScore + verificationScore + automationScore + privacyScore;
    const reasons = [goalFit >= 20 ? "입력한 목표와 서비스 조합이 가깝습니다." : "입력한 목표의 일부를 지원합니다.", recipe.costProfile.tier === "FREE_FIRST" ? "무료/저비용 우선 구성입니다." : "연결 수와 설정 난이도를 고려한 구성입니다.", recipe.setupDifficulty === "LOW" ? "설정 난이도가 낮습니다." : `설정 난이도는 ${recipe.setupDifficulty}입니다.`];
    const cautions = [recipe.verificationStatus === "CURATED" ? "추천 데이터는 curated recipe이며 실제 외부 실행은 아직 검증되지 않았습니다." : "검증 상태를 연결 전 다시 확인하세요.", ...recipe.approvalRequirements];
    return { recipe, score, reasons, cautions, connectionCount: recipe.requiredConnections.length };
  }).sort((a, b) => b.score - a.score || a.connectionCount - b.connectionCount || a.recipe.title.localeCompare(b.recipe.title, "ko"));
}

export function recommendRecipes(goal: string, preference: RecipeRankingPreference = {}): RecipeRecommendation {
  const intent = analyzeRecipeIntent(goal);
  const retrieved = retrieveRecipes(intent);
  const results = rankRecipes(intent, retrieved, preference).slice(0, 3);
  return { intent, results, ...(results.length ? {} : { noMatchReason: intent.status === "EMPTY" ? "자동화하고 싶은 일을 입력해 주세요." : "아직 이 목표와 맞는 Recipe를 찾지 못했습니다. 목적과 대상 서비스를 더 구체적으로 알려 주세요." }) };
}
