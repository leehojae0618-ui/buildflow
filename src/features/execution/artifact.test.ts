import { describe, expect, it } from "vitest";
import { ArtifactExecutor, artifactTemplate } from "./artifact";
describe("artifact executor", () => { it("creates safe artifact metadata without secrets", async () => { const context = { executionId: "e1", task: { taskKey: "configure-openai", title: "OpenAI 준비", action: "AUTO" }, artifacts: {} }; const result = await new ArtifactExecutor().execute(context); expect(result.status).toBe("SUCCEEDED"); expect(result.artifacts?.[0]).toContain("configure-openai"); expect(artifactTemplate(context)).not.toMatch(/api[_-]?key|secret|sk-/i); }); });
