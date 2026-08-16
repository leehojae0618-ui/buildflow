import { describe, expect, it } from "vitest";
import { GroqSummaryAdapter, OpenAiNewsRssSource, runNewsFetchGate, runNewsToGroqSummaryGate } from "./real-adapters";

describe("LIVE-RECIPE-AI-NEWS-001 controlled live gates", () => {
  it.skipIf(process.env.BUILDFLOW_LIVE_NEWS_FETCH !== "1")("Gate C1 fetches real OpenAI News RSS without Slack write", async () => {
    const result = await runNewsFetchGate({ source: new OpenAiNewsRssSource(), selectionLimit: 3 });

    expect(result.selectedItems.length).toBeGreaterThan(0);
    expect(result.selectedItems.length).toBeLessThanOrEqual(3);
    expect(result.selectedItems.every((item) => item.url.startsWith("https://openai.com/"))).toBe(true);
    expect(result.evidence.slackWriteStatus).toBe("NOT_PERFORMED");
    console.info(
      JSON.stringify({
        gate: result.evidence.gate,
        selectedItemCount: result.evidence.selectedItemCount,
        titles: result.selectedItems.map((item) => item.title),
        slackWriteStatus: result.evidence.slackWriteStatus,
      }),
    );
  });

  it.skipIf(process.env.BUILDFLOW_LIVE_GROQ_SUMMARY !== "1" || !process.env.GROQ_API_KEY)(
    "Gate C2 summarizes real news through Groq without Slack write",
    async () => {
      const result = await runNewsToGroqSummaryGate({
        source: new OpenAiNewsRssSource(),
        summarizer: new GroqSummaryAdapter({ apiKey: process.env.GROQ_API_KEY }),
        selectionLimit: 3,
      });

      expect(result.summary.bullets.length).toBeGreaterThan(0);
      expect(result.evidence.aiProviderStatus).toBe("VERIFIED");
      expect(result.evidence.slackWriteStatus).toBe("NOT_PERFORMED");
      console.info(
        JSON.stringify({
          gate: result.evidence.gate,
          selectedItemCount: result.evidence.selectedItemCount,
          summaryLineCount: result.summary.bullets.length,
          slackWriteStatus: result.evidence.slackWriteStatus,
        }),
      );
    },
  );

});
