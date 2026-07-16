import { describe, expect, it } from "vitest";
import { createRequirementSnapshot } from "./snapshot";

describe("build intelligence", () => {
  it("creates a build receipt from the selected architecture", () => { const snapshot = createRequirementSnapshot("이메일 고객센터", { automation_level: "high", budget_range: "low" }); const intelligence = snapshot.buildIntelligence; expect(snapshot.architecture.components.some((component) => component.id === "n8n")).toBe(true); expect(intelligence.buildScore).toBeGreaterThan(0); expect(intelligence.estimatedBuildMinutes).toBeGreaterThanOrEqual(snapshot.architecture.components.length); expect(intelligence.requiredAccounts).toContain("Google"); expect(intelligence.confidence).toBeGreaterThan(0); });
  it("uses registry costs and graph complexity", () => { const snapshot = createRequirementSnapshot("AI 쇼핑몰 고객센터", { budget_range: "medium", automation_level: "high" }); expect(snapshot.buildIntelligence.estimatedMonthlyCostCents).toBe(1500); expect(snapshot.buildIntelligence.estimatedBuildMinutes).toBeGreaterThan(snapshot.architecture.components.length); expect(snapshot.buildIntelligence.riskScore).toBeGreaterThan(0); });
});
