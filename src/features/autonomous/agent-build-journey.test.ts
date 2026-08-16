import { describe, expect, it } from "vitest";
import { deriveAgentBuildJourney } from "./components/agent-build-journey";

const completeSnapshot = {
  requirement: { expectedOutput: "AI 고객센터" },
  clarificationQuestions: [],
  selectedCandidateId: "balanced",
  buildPlan: { summary: "saved" },
};

describe("Agent Build Journey", () => {
  it("keeps a missing requirement at the start of the journey", () => {
    const journey = deriveAgentBuildJourney({}, null);
    expect(journey.stages.find((stage) => stage.id === "goal")?.state).toBe("CURRENT");
    expect(journey.nextAction).toContain("목표");
    expect(journey.result.kind).toBe("NONE");
  });

  it("reports required clarification before Blueprint selection", () => {
    const journey = deriveAgentBuildJourney({ requirement: { expectedOutput: "AI 고객센터" }, clarificationQuestions: [{ required: true }] }, null);
    expect(journey.stages.find((stage) => stage.id === "requirement")?.state).toBe("CURRENT");
    expect(journey.nextAction).toContain("확인 항목");
  });

  it("uses persisted waiting state as the next-action source", () => {
    const journey = deriveAgentBuildJourney(completeSnapshot, { id: "session-1", status: "WAITING_FOR_APPROVAL" });
    expect(journey.stages.find((stage) => stage.id === "approval")?.state).toBe("CURRENT");
    expect(journey.nextAction).toContain("승인");
    expect(journey.result.kind).toBe("NONE");
  });

  it("renders READY only from a persisted terminal session and completion report", () => {
    const journey = deriveAgentBuildJourney(completeSnapshot, { id: "session-1", status: "READY", completionReport: { serviceUrl: "https://example.com", outcomes: ["Health check passed"] } });
    expect(journey.result.kind).toBe("READY");
    expect(journey.result.serviceUrl).toBe("https://example.com");
    expect(journey.result.outcomes).toEqual(["Health check passed"]);
  });

  it("does not treat a Build Plan as a successful result", () => {
    const journey = deriveAgentBuildJourney(completeSnapshot, null);
    expect(journey.stages.find((stage) => stage.id === "plan")?.state).toBe("COMPLETE");
    expect(journey.result.kind).toBe("NONE");
  });

  it.each(["READY_WITH_WARNINGS", "FAILED", "CANCELLED"])("preserves persisted terminal state %s without inventing success", (status) => {
    const journey = deriveAgentBuildJourney(completeSnapshot, { id: "session-1", status });
    expect(journey.result.kind).toBe(status);
    expect(journey.result.serviceUrl).toBeUndefined();
  });
});
