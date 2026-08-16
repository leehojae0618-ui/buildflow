import { describe, expect, it } from "vitest";
import { deriveLiveUserIdentity, type LiveUserIdentityProvider } from "../live-recipe/identity";
import { GroqSummaryAdapter, OpenAiNewsRssSource, runNewsFetchGate, runNewsToGroqSummaryGate, runNewsToGroqToSlackGate } from "./real-adapters";

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

  it.skipIf(process.env.BUILDFLOW_LIVE_COMPOSITE_RECIPE_E2E !== "1")(
    "Composite gate runs News -> Groq -> Guarded Slack write as one continuous execution path",
    async () => {
      const testUserId = process.env.BUILDFLOW_LIVE_TEST_USER_ID;
      const channelId = process.env.BUILDFLOW_LIVE_SLACK_CHANNEL_ID;
      if (!testUserId || !channelId) throw new Error("BUILDFLOW_LIVE_TEST_USER_ID and BUILDFLOW_LIVE_SLACK_CHANNEL_ID are required for this gate");

      const identityProvider: LiveUserIdentityProvider = { resolve: async () => ({ ok: true, value: deriveLiveUserIdentity(testUserId) }) };

      const result = await runNewsToGroqToSlackGate({
        source: new OpenAiNewsRssSource(),
        summarizer: new GroqSummaryAdapter({ apiKey: process.env.GROQ_API_KEY }),
        selectionLimit: 3,
        slackWrite: {
          approved: true,
          recipeId: "recipe.ai-news-slack-digest",
          targetConfigurationReference: channelId,
          requestId: `slack-digest-composite-e2e-${Date.now()}`,
        },
        liveRecipeDependencies: { identityProvider },
      });

      console.info(
        JSON.stringify({
          gate: result.evidence.gate,
          selectedItemCount: result.evidence.selectedItemCount,
          summaryLineCount: result.summary.bullets.length,
          slackWriteStatus: result.evidence.slackWriteStatus,
          safeSlackReference: result.evidence.safeSlackReference,
        }),
      );

      expect(result.evidence).toMatchObject({
        gate: "C3_NEWS_TO_GROQ_TO_SLACK",
        actualExternalActions: ["OPENAI_NEWS_RSS_FETCH", "GROQ_CHAT_COMPLETION", "SLACK_MESSAGE_WRITE"],
        newsSourceStatus: "VERIFIED",
        aiProviderStatus: "VERIFIED",
        slackWriteStatus: "SUCCEEDED",
      });
    },
    30_000,
  );
});
