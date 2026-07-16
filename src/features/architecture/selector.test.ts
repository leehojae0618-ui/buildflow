import { describe, expect, it } from "vitest";
import { selectArchitecture } from "./selector";
import { parseGoal } from "../requirements/goal-parser";

describe("architecture selector", () => {
  it("selects a support architecture with notification", () => { const architecture = selectArchitecture(parseGoal("AI 쇼핑몰 고객센터", { automation_level: "high" })); expect(architecture.components.map((component) => component.id)).toEqual(expect.arrayContaining(["openai", "supabase", "n8n", "slack"])); expect(architecture.connections.length).toBeGreaterThan(3); });
  it("adds Google OAuth only when required by the goal", () => { expect(selectArchitecture(parseGoal("이메일 고객센터")).components.some((component) => component.id === "google-oauth")).toBe(true); });
});
