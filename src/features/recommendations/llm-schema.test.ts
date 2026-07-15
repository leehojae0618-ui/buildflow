import { describe, expect, it } from "vitest";
import { candidateExplanationSchema, recommendationExplanationSchema } from "./llm-schema";

const candidate = { candidateId: "a", headline: "회의 내용을 빠르게 정리하는 방법", explanation: "회의 메모를 핵심 내용과 실행할 일로 나누어 다음 행동을 확인하기 쉽게 정리합니다. 담당자와 일정까지 검토할 수 있습니다.", fitReasons: ["회의 요약 목표와 맞습니다."], cautions: [], nextStep: "회의 메모를 준비해 내용을 검토하세요." };
describe("structured explanation schema", () => {
  it("accepts valid candidate output", () => { expect(candidateExplanationSchema.parse(candidate).candidateId).toBe("a"); });
  it("requires a headline", () => { expect(candidateExplanationSchema.safeParse({ ...candidate, headline: "짧음" }).success).toBe(false); });
  it("limits fit reasons", () => { expect(candidateExplanationSchema.safeParse({ ...candidate, fitReasons: [] }).success).toBe(false); });
  it("limits cautions", () => { expect(candidateExplanationSchema.safeParse({ ...candidate, cautions: ["a", "b", "c", "d"] }).success).toBe(false); });
  it("accepts a complete root object", () => { expect(recommendationExplanationSchema.safeParse({ overview: "이 추천은 입력한 목표와 현재 조건을 기준으로 가장 가까운 Workflow 후보를 비교해 보여줍니다. 각 후보의 적합한 이유와 주의사항도 함께 확인할 수 있습니다.", candidates: [candidate] }).success).toBe(true); });
  it("rejects a short overview", () => { expect(recommendationExplanationSchema.safeParse({ overview: "짧음", candidates: [candidate] }).success).toBe(false); });
  it("rejects missing candidates", () => { expect(recommendationExplanationSchema.safeParse({ overview: "이 추천은 입력한 목표와 현재 조건을 기준으로 후보를 비교해 보여줍니다." }).success).toBe(false); });
  it("rejects invalid candidate id type", () => { expect(candidateExplanationSchema.safeParse({ ...candidate, candidateId: 1 }).success).toBe(false); });
});
