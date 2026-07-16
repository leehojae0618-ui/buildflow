import { describe, expect, it } from "vitest";
import { connectorRegistry } from "./registry";
import { resolveRequiredConnectors } from "./resolver";
import { parseGoal } from "../requirements/goal-parser";
import { selectArchitecture } from "../architecture/selector";

describe("connector engine foundation", () => {
  it("registers the initial provider catalog", () => expect(connectorRegistry.map((item) => item.id)).toEqual(["openai", "anthropic", "gemini", "supabase", "github", "google", "slack", "resend", "n8n", "make"]));
  it("resolves connectors from architecture without adding unrelated providers", () => {
    const requirement = parseGoal("단순 챗봇");
    const connectors = resolveRequiredConnectors(requirement, selectArchitecture(requirement));
    expect(connectors.map((item) => item.providerId)).toEqual(["openai", "supabase"]);
    expect(connectors.every((item) => item.status === "NOT_CONNECTED" && item.required)).toBe(true);
  });
  it("resolves explicit integration requirements", () => {
    const requirement = parseGoal("이메일 자동화", { current_tools: ["GitHub", "Resend"] });
    const connectors = resolveRequiredConnectors(requirement, selectArchitecture(requirement));
    expect(connectors.map((item) => item.providerId)).toEqual(expect.arrayContaining(["github", "resend", "n8n"]));
  });
});
