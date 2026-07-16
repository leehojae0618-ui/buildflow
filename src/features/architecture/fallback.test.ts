import { describe, expect, it } from "vitest";
import { normalizeArchitectureSnapshot } from "./fallback";
import { selectArchitecture } from "./selector";
import { parseGoal } from "../requirements/goal-parser";

describe("architecture stabilization", () => {
  it("does not select n8n for a simple chatbot", () => { const architecture = selectArchitecture(parseGoal("간단한 질문 답변 챗봇", { automation_level: "guide" })); expect(architecture.components.some((component) => component.id === "n8n")).toBe(false); });
  it("normalizes valid snapshots and rejects legacy unknown shapes", () => { const architecture = selectArchitecture(parseGoal("자동화 Workflow", { automation_level: "high" })); expect(normalizeArchitectureSnapshot(architecture)?.version).toBe("architecture-v1"); expect(normalizeArchitectureSnapshot({ version: "architecture-v0" })).toBeNull(); expect(normalizeArchitectureSnapshot(undefined)).toBeNull(); });
});
