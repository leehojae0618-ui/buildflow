import { zodTextFormat } from "openai/helpers/zod";
import { createOpenAIClient } from "@/services/openai/client";
import { recommendationExplanationSchema, type RecommendationExplanation } from "@/features/recommendations/llm-schema";

export type EnrichmentInput = { goal: string; candidates: { id: string; title: string; score: number; reason: string; difficulty: string | null; setupMinutes: number | null; executionSupport: string | null; tools: string[] }[] };
export async function enrichRecommendationWithOpenAI(input: EnrichmentInput): Promise<{ status: "completed"; provider: "openai"; model: string; explanation: RecommendationExplanation } | { status: "fallback"; errorCode: string }> {
  try {
    const client = createOpenAIClient();
    const model = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
    const response = await client.responses.parse({ model, input: [{ role: "system", content: "당신은 BuildFlow의 추천 설명 작성기다. 이미 결정된 후보, 점수, 비용, 난이도, 도구와 실행 지원 수준을 절대 변경하지 말고, 한국어로 비개발자에게 짧고 정확하게 설명하라. 새로운 후보나 사실을 만들지 마라." }, { role: "user", content: JSON.stringify(input) }], text: { format: zodTextFormat(recommendationExplanationSchema, "recommendation_explanation") } });
    const parsed = response.output_parsed;
    if (!parsed || parsed.candidates.length !== input.candidates.length || parsed.candidates.some((candidate) => !input.candidates.some((item) => item.id === candidate.candidateId))) return { status: "fallback", errorCode: "openai_invalid_output" };
    return { status: "completed", provider: "openai", model, explanation: parsed };
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return { status: "fallback", errorCode: message.includes("timeout") ? "openai_timeout" : message.includes("rate") ? "openai_rate_limit" : "openai_provider_error" };
  }
}
