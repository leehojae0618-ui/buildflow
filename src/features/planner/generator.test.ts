import { describe, expect, it } from "vitest";
import { generateBuildPlan } from "./generator";
import { createRequirementSnapshot } from "../requirements/snapshot";

describe("build planner", () => {
  it("generates ordered phases and dependent tasks", () => { const snapshot = createRequirementSnapshot("AI 쇼핑몰 고객센터", { automation_level: "high" }); const plan = generateBuildPlan({ requirement: snapshot.requirement, architecture: snapshot.architecture, intelligence: snapshot.buildIntelligence }); expect(plan.version).toBe("build-plan-v1"); expect(plan.phases.map((phase) => phase.title)).toContain("Verification"); expect(plan.tasks.at(-1)?.dependencyIds.length).toBeGreaterThan(0); expect(plan.progress.percentage).toBe(0); });
  it("separates user actions for authentication", () => { const snapshot = createRequirementSnapshot("이메일 고객센터", { automation_level: "high" }); const plan = generateBuildPlan({ requirement: snapshot.requirement, architecture: snapshot.architecture, intelligence: snapshot.buildIntelligence }); expect(plan.tasks.some((task) => task.action === "USER_ACTION" && task.phaseId === "authentication")).toBe(true); });
});
