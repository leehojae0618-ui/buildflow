import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prepareAiNewsDigestRun, requestApprovedAiNewsDigestRun, runAiNewsFetchStep, runAiNewsSlackWriteStep, runAiNewsSummaryStep } from "./actions";

const envKeys = ["BUILDFLOW_LIVE_CONNECT_ENABLED", "BUILDFLOW_LIVE_SLACK_WRITE_ENABLED", "BUILDFLOW_LIVE_SLACK_CHANNEL_ID", "GROQ_API_KEY"] as const;
let originalEnv: Record<string, string | undefined>;

beforeEach(() => {
  originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  for (const key of envKeys) delete process.env[key];
});

afterEach(() => {
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  vi.restoreAllMocks();
});

describe("AI news digest Server Action gates (roadmap Step 7+8)", () => {
  it("blocks with LIVE_DISABLED when the connect switch is off", async () => {
    expect(await prepareAiNewsDigestRun()).toEqual({ ok: false, errorCode: "LIVE_DISABLED" });
  });

  it("blocks with WRITE_DISABLED when connect is on but write is off", async () => {
    process.env.BUILDFLOW_LIVE_CONNECT_ENABLED = "true";
    expect(await prepareAiNewsDigestRun()).toEqual({ ok: false, errorCode: "WRITE_DISABLED" });
  });

  it("blocks with CONFIGURATION_MISSING when switches are on but channel/API key are missing", async () => {
    process.env.BUILDFLOW_LIVE_CONNECT_ENABLED = "true";
    process.env.BUILDFLOW_LIVE_SLACK_WRITE_ENABLED = "true";
    expect(await prepareAiNewsDigestRun()).toEqual({ ok: false, errorCode: "CONFIGURATION_MISSING" });
  });

  it("previews the server-resolved destination once fully configured, with no external call", async () => {
    process.env.BUILDFLOW_LIVE_CONNECT_ENABLED = "true";
    process.env.BUILDFLOW_LIVE_SLACK_WRITE_ENABLED = "true";
    process.env.BUILDFLOW_LIVE_SLACK_CHANNEL_ID = "C_APPROVED";
    process.env.GROQ_API_KEY = "test-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("should not be called"));

    expect(await prepareAiNewsDigestRun()).toEqual({ ok: true, recipeId: "recipe.ai-news-slack-digest", targetConfigurationReference: "C_APPROVED" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("short-circuits before any News/Groq call when the kill switch is off", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("should not be called"));

    expect(await requestApprovedAiNewsDigestRun()).toEqual({ ok: false, errorCode: "LIVE_DISABLED" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("AI news digest step-by-step gates (roadmap Step 9)", () => {
  it("each granular step independently blocks with LIVE_DISABLED and makes no external call when the kill switch is off", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("should not be called"));

    expect(await runAiNewsFetchStep()).toEqual({ ok: false, errorCode: "LIVE_DISABLED" });
    expect(await runAiNewsSummaryStep("unused-attempt-id")).toEqual({ ok: false, errorCode: "LIVE_DISABLED" });
    expect(await runAiNewsSlackWriteStep("unused-attempt-id")).toEqual({ ok: false, errorCode: "LIVE_DISABLED" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("each granular step independently blocks with WRITE_DISABLED when connect is on but write is off", async () => {
    process.env.BUILDFLOW_LIVE_CONNECT_ENABLED = "true";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("should not be called"));

    expect(await runAiNewsFetchStep()).toEqual({ ok: false, errorCode: "WRITE_DISABLED" });
    expect(await runAiNewsSummaryStep("unused-attempt-id")).toEqual({ ok: false, errorCode: "WRITE_DISABLED" });
    expect(await runAiNewsSlackWriteStep("unused-attempt-id")).toEqual({ ok: false, errorCode: "WRITE_DISABLED" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("AI news digest attempt-token provenance (Step 9 hardening)", () => {
  function enableGates() {
    process.env.BUILDFLOW_LIVE_CONNECT_ENABLED = "true";
    process.env.BUILDFLOW_LIVE_SLACK_WRITE_ENABLED = "true";
    process.env.BUILDFLOW_LIVE_SLACK_CHANNEL_ID = "C_APPROVED";
    process.env.GROQ_API_KEY = "test-key";
  }

  it("rejects a forged/unknown attemptId at the summary step instead of accepting client-supplied data", async () => {
    enableGates();
    expect(await runAiNewsSummaryStep("attacker-supplied-id")).toEqual({ ok: false, errorCode: "ATTEMPT_NOT_FOUND" });
  });

  it("rejects a forged/unknown attemptId at the write step", async () => {
    enableGates();
    expect(await runAiNewsSlackWriteStep("attacker-supplied-id")).toEqual({ ok: false, errorCode: "ATTEMPT_NOT_FOUND" });
  });

  it("rejects calling the write step before the summary step has populated the attempt", async () => {
    enableGates();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<rss><channel></channel></rss>",
    } as Response);

    const fetchResult = await runAiNewsFetchStep();
    expect(fetchResult.ok).toBe(true);
    if (!fetchResult.ok) return;

    expect(await runAiNewsSlackWriteStep(fetchResult.attemptId)).toEqual({ ok: false, errorCode: "ATTEMPT_NOT_FOUND" });
  });
});
