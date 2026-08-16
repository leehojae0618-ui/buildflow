import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prepareAiNewsDigestRun, requestApprovedAiNewsDigestRun, runAiNewsFetchStep, runAiNewsSlackWriteStep, runAiNewsSummaryStep } from "./actions";

const slackDigestWriteMock = vi.fn(async () => ({
  ok: true as const,
  value: { safeExternalReference: "slack_ref_test" },
  connectionState: "CONNECTED_VERIFIED" as const,
  evidence: {
    attemptId: "evidence-id",
    recipeId: "recipe.ai-news-slack-digest",
    engine: "PIPEDREAM" as const,
    service: "SLACK" as const,
    actionType: "AI_NEWS_DIGEST" as const,
    externalUserSafeReference: "user_test",
    requestedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: "SUCCEEDED" as const,
    safeExternalReference: "slack_ref_test",
  },
}));

vi.mock("../live-recipe/live-recipe-service", () => ({
  runApprovedSlackDigestWrite: (...args: unknown[]) => slackDigestWriteMock(...(args as [])),
}));

// GroqSummaryAdapter otherwise builds a real OpenAI client and hits the network.
// The lifecycle tests below only need *a* summary to reach the SUMMARIZED state,
// so stub summarization while leaving fetch/format/RSS parsing real.
vi.mock("./real-adapters", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./real-adapters")>();
  return {
    ...actual,
    GroqSummaryAdapter: class {
      async summarize() {
        return { headline: "테스트 요약", bullets: ["요약 1", "요약 2"], sourceItemIds: [] };
      }
    },
  };
});

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
  slackDigestWriteMock.mockClear();
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

describe("AI news digest attempt lifecycle hardening (Step 9 follow-up: TTL + concurrency)", () => {
  const attemptTtlMs = 10 * 60 * 1000;

  function enableGates() {
    process.env.BUILDFLOW_LIVE_CONNECT_ENABLED = "true";
    process.env.BUILDFLOW_LIVE_SLACK_WRITE_ENABLED = "true";
    process.env.BUILDFLOW_LIVE_SLACK_CHANNEL_ID = "C_APPROVED";
    process.env.GROQ_API_KEY = "test-key";
  }

  async function fetchAttemptId() {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<rss><channel></channel></rss>",
    } as Response);
    const fetchResult = await runAiNewsFetchStep();
    if (!fetchResult.ok) throw new Error("test setup: expected fetch step to succeed");
    return fetchResult.attemptId;
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects the summary step once the attempt's TTL has elapsed", async () => {
    enableGates();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(0);
    const attemptId = await fetchAttemptId();

    vi.setSystemTime(attemptTtlMs + 1);
    expect(await runAiNewsSummaryStep(attemptId)).toEqual({ ok: false, errorCode: "ATTEMPT_NOT_FOUND" });
  });

  it("rejects the write step once the attempt's TTL has elapsed", async () => {
    enableGates();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(0);
    const attemptId = await fetchAttemptId();
    expect((await runAiNewsSummaryStep(attemptId)).ok).toBe(true);

    vi.setSystemTime(attemptTtlMs + 1);
    expect(await runAiNewsSlackWriteStep(attemptId)).toEqual({ ok: false, errorCode: "ATTEMPT_NOT_FOUND" });
    expect(slackDigestWriteMock).not.toHaveBeenCalled();
  });

  it("lets only one of two concurrent write-step calls for the same attempt reach the Slack adapter", async () => {
    enableGates();
    const attemptId = await fetchAttemptId();
    expect((await runAiNewsSummaryStep(attemptId)).ok).toBe(true);

    const [first, second] = await Promise.all([runAiNewsSlackWriteStep(attemptId), runAiNewsSlackWriteStep(attemptId)]);

    const rejected = [first, second].filter((result) => !result.ok && result.errorCode === "ATTEMPT_NOT_FOUND");
    const succeeded = [first, second].filter((result) => result.ok);
    expect(rejected).toHaveLength(1);
    expect(succeeded).toHaveLength(1);
    expect(slackDigestWriteMock).toHaveBeenCalledTimes(1);
  });

  it("rejects re-running the write step on an attempt the Slack write has already consumed", async () => {
    enableGates();
    const attemptId = await fetchAttemptId();
    expect((await runAiNewsSummaryStep(attemptId)).ok).toBe(true);

    expect((await runAiNewsSlackWriteStep(attemptId)).ok).toBe(true);
    expect(await runAiNewsSlackWriteStep(attemptId)).toEqual({ ok: false, errorCode: "ATTEMPT_NOT_FOUND" });
    expect(slackDigestWriteMock).toHaveBeenCalledTimes(1);
  });
});
