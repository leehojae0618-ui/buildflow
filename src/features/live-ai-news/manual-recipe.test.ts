import { describe, expect, it } from "vitest";
import { normalizeNewsItems, runManualAiNewsSlackRecipe, selectImportantNews, type NewsItem } from "./manual-recipe";

const items: NewsItem[] = [
  { id: "low", title: "Minor AI tooling note", url: "https://example.com/low", source: "example", publishedAt: "2026-08-15T00:00:00.000Z", score: 40 },
  { id: "top", title: "Major model release", url: "https://example.com/top", source: "example", publishedAt: "2026-08-15T01:00:00.000Z", score: 95 },
  { id: "duplicate", title: "Duplicate model release", url: "https://example.com/top", source: "example", publishedAt: "2026-08-15T02:00:00.000Z", score: 100 },
  { id: "unsafe-url", title: "Unsafe URL", url: "http://example.com/nope", source: "example", publishedAt: "2026-08-15T03:00:00.000Z", score: 99 },
];

describe("LIVE-RECIPE-AI-NEWS-001 local manual recipe", () => {
  it("normalizes and ranks news items without external I/O", () => {
    expect(normalizeNewsItems(items).map((item) => item.id)).toEqual(["top", "low"]);
    expect(selectImportantNews(items, 1)).toEqual([expect.objectContaining({ id: "top", selectionReason: "high-impact AI update" })]);
  });

  it("runs the manual recipe with fake ports and simulated evidence only", async () => {
    const calls: string[] = [];
    const result = await runManualAiNewsSlackRecipe({
      newsSource: { fetchNews: async () => { calls.push("news"); return items; } },
      summarizer: { summarize: async ({ items }) => { calls.push("ai"); return { headline: "AI news digest", bullets: items.map((item) => item.title), sourceItemIds: items.map((item) => item.id) }; } },
      slackOutput: { prepareMessage: async ({ summary }) => { calls.push("slack"); return { messagePreview: summary.bullets.join("\\n") }; } },
      selectionLimit: 2,
    });

    expect(calls).toEqual(["news", "ai", "slack"]);
    expect(result).toMatchObject({
      status: "SIMULATED_READY",
      evidence: {
        mode: "LOCAL_SIMULATION",
        newsSourceStatus: "SIMULATED",
        aiProviderStatus: "SIMULATED",
        slackWriteStatus: "SIMULATED",
        actualExternalAction: false,
      },
    });
    expect(result.evidence.messagePreview).toContain("Major model release");
  });

  it("does not call summarizer or Slack output when no usable news exists", async () => {
    const result = await runManualAiNewsSlackRecipe({
      newsSource: { fetchNews: async () => [{ ...items[0], title: "", url: "http://example.com" }] },
      summarizer: { summarize: async () => { throw new Error("must not summarize"); } },
      slackOutput: { prepareMessage: async () => { throw new Error("must not prepare Slack"); } },
    });

    expect(result).toMatchObject({ status: "NOT_READY", summary: null, evidence: { selectedItemCount: 0, actualExternalAction: false } });
  });
});
