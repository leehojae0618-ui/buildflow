import { describe, expect, it } from "vitest";
import { createRequirementSnapshot } from "../requirements/snapshot";
import { createTestSuite } from "./engine";

describe("test engine", () => {
  it("surfaces health warnings in the final summary", () => { const snapshot = createRequirementSnapshot("AI 쇼핑몰 고객센터", { automation_level: "high" }); const suite = createTestSuite(snapshot); expect(suite.version).toBe("test-suite-v1"); expect(suite.result.status).toBe("READY_WITH_WARNINGS"); expect(suite.result.warnings).toBeGreaterThan(0); expect(suite.result.failed).toBe(0); });
  it("detects a missing build plan", () => { const snapshot = createRequirementSnapshot("챗봇", { automation_level: "guide" }); const suite = createTestSuite({ ...snapshot, buildPlan: { ...snapshot.buildPlan, tasks: [], phases: [], progress: { total: 0, completed: 0, percentage: 0 } } }); expect(suite.result.status).toBe("FAILED"); });
});
