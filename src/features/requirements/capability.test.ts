import { describe, expect, it } from "vitest";
import { calculateCapabilities, calculateCapabilitySummary } from "./constraints";
import { createRequirementSnapshot } from "./snapshot";
import { parseGoal } from "./goal-parser";

describe("constraint capability foundation", () => {
  it("calculates automatic and user-action capabilities", () => {
    const snapshot = createRequirementSnapshot("이메일 고객센터", { automation_level: "high", budget_range: "free" });
    expect(snapshot.capabilities.some((capability) => capability.level === "USER_ACTION")).toBe(true);
    expect(snapshot.capabilitySummary.automationPercentage).toBeLessThan(100);
  });
  it("keeps calculator extensible for new component capabilities", () => {
    const requirement = parseGoal("보고서 작성");
    const capabilities = calculateCapabilities(requirement, 0);
    const summary = calculateCapabilitySummary([...capabilities, { id: "future", label: "Future", level: "EXPERT_REQUIRED", reason: "전문가 검토", requiresConsent: false }]);
    expect(summary.expertRequired).toBe(1);
    expect(summary.total).toBe(capabilities.length + 1);
  });
});
