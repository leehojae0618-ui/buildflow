import { describe, expect, it } from "vitest";
import { createRequirementSnapshot } from "./snapshot";

describe("build intelligence", () => {
  it("creates a build receipt from the selected architecture", () => { const snapshot = createRequirementSnapshot("이메일 고객센터", { automation_level: "high", budget_range: "low" }); const intelligence = snapshot.buildIntelligence; expect(snapshot.architecture.components.some((component) => component.id === "n8n")).toBe(true); expect(intelligence.buildScore).toBeGreaterThan(0); expect(intelligence.estimatedBuildMinutes).toBeGreaterThanOrEqual(snapshot.architecture.components.length); expect(intelligence.requiredAccounts).toContain("Google"); expect(intelligence.confidence).toBeGreaterThan(0); });
  it("increases risk for unsupported or expert work", () => { const snapshot = createRequirementSnapshot("새로운 시스템", { budget_range: "medium", automation_level: "guide" }); expect(snapshot.buildIntelligence.riskScore).toBeGreaterThan(0); expect(snapshot.buildIntelligence.difficulty).not.toBe("easy"); });
});
