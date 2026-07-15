import { describe, expect, it } from "vitest";
import { getRecommendationErrorMessage } from "./errors";
import { toRecommendationFailure } from "./debug";

describe("recommendation diagnostics", () => {
  it("maps template failures safely", () => { expect(getRecommendationErrorMessage("template_query_failed")).toContain("기준 데이터"); });
  it("maps unknown failures generically", () => { expect(getRecommendationErrorMessage("secret_internal_error")).toContain("추천을 생성하지 못했습니다"); });
  it("marks database failures retryable", () => { expect(toRecommendationFailure("candidate-save", "candidate_save_failed").retryable).toBe(true); });
  it("does not mark auth failures retryable", () => { expect(toRecommendationFailure("auth", "auth_required").retryable).toBe(false); });
  it("preserves stage and code", () => { expect(toRecommendationFailure("openai", "openai_timeout")).toMatchObject({ stage: "openai", code: "openai_timeout" }); });
  it("uses a safe default message", () => { expect(toRecommendationFailure("rule-engine", "rule_failed").message).not.toContain("Stack"); });
  it("maps candidate save failures", () => { expect(getRecommendationErrorMessage("candidate_save_failed")).toContain("저장"); });
  it("maps in-progress state", () => { expect(getRecommendationErrorMessage("recommendation_in_progress")).toContain("생성하고 있습니다"); });
});
