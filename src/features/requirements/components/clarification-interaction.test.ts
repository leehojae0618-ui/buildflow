import { describe, expect, it } from "vitest";
import { prepareClarificationAnswerBatch } from "../clarification";
import { createRequirementSnapshot } from "../snapshot";
import { deriveClarificationInteractionView, getClarificationBlockingReason } from "./clarification-interaction";

function snapshot() {
  return createRequirementSnapshot("쇼핑몰 고객센터 자동화를 만들고 싶어요");
}

describe("ClarificationInteraction view model", () => {
  it("renders a bounded first question batch for a legacy snapshot", () => {
    const view = deriveClarificationInteractionView(snapshot());

    expect(view.kind).toBe("READY");
    if (view.kind !== "READY") return;
    expect(view.clarification.revision).toBe(0);
    expect(view.batch.status).toBe("ASKING");
    expect(view.batch.questions).toHaveLength(3);
    expect(view.batch.questions.map((question) => question.id)).toContain("platform");
  });

  it("projects persisted confidence, diff, and revision history after an answer batch", () => {
    const initial = snapshot();
    const before = deriveClarificationInteractionView(initial);
    if (before.kind !== "READY") throw new Error("fixture must provide a ready view");
    const answers = before.batch.questions.map((question) => ({
      questionId: question.id,
      field: question.field,
      value: `${question.id}-answer`,
      source: "USER" as const,
      impact: question.impact!,
    }));
    const persisted = prepareClarificationAnswerBatch(initial.requirement, undefined, {
      expectedRevision: 0,
      answers,
    });
    const after = deriveClarificationInteractionView({ ...initial, clarification: persisted.clarification });

    expect(after.kind).toBe("READY");
    if (after.kind !== "READY") return;
    expect(after.clarification.confidence).toBeGreaterThan(0);
    expect(after.clarification.revisionDiffs).toHaveLength(1);
    expect(after.clarification.revisionDiffs[0]?.changed).not.toEqual([]);
    expect(after.batch.cycle).toBe(2);
  });

  it("keeps unsupported policy data read-only rather than inventing a question batch", () => {
    const initial = snapshot();
    const view = deriveClarificationInteractionView({
      ...initial,
      clarification: { policyVersion: "clarification-confidence-v0" } as never,
    });

    expect(view).toMatchObject({ kind: "UNSUPPORTED_POLICY" });
  });

  it("prioritizes the persisted Confidence blocking reason over an empty follow-up batch", () => {
    const initial = snapshot();
    const view = deriveClarificationInteractionView(initial);
    if (view.kind !== "READY") throw new Error("fixture must provide a ready view");
    const clarification = {
      ...view.clarification,
      confidence: 0.78,
      decisionState: {
        ...view.clarification.decisionState,
        status: "NOT_READY" as const,
        nextDecision: "ANALYZE_REQUIREMENTS" as const,
        reasonCodes: ["CONFIDENCE_BELOW_THRESHOLD"],
      },
    };

    expect(getClarificationBlockingReason(clarification)?.code).toBe("CONFIDENCE_BELOW_THRESHOLD");
    expect(getClarificationBlockingReason(clarification)?.label).toContain("80%");
  });
});
