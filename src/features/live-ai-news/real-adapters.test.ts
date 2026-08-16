import { describe, expect, it } from "vitest";
import type { LiveRecipeEnvironment } from "../live-recipe/live-environment";
import type { LiveUserIdentityProvider } from "../live-recipe/identity";
import { InMemorySlackWriteIdempotency } from "../live-recipe/live-recipe-service";
import { FakePipedreamConnectAdapter } from "../live-recipe/pipedream-port";
import {
  GroqSummaryAdapter,
  OpenAiNewsRssSource,
  formatSlackDigestMessage,
  parseOpenAiNewsRss,
  runNewsFetchGate,
  runNewsToGroqSummaryGate,
  runNewsToGroqToSlackGate,
  selectRecentImportantNews,
  type FetchLike,
} from "./real-adapters";

const guardedEnvironment: LiveRecipeEnvironment = {
  liveConnectEnabled: true,
  liveSlackWriteEnabled: true,
  pipedreamEnvironment: "development",
  pipedreamClientId: "client-id",
  pipedreamClientSecret: "client-secret",
  pipedreamProjectId: "project-id",
  approvedSlackAccountId: "approved-account",
  approvedSlackChannelId: "approved-channel",
  appOrigin: "http://localhost:3000",
  nodeEnvironment: "test",
};
const guardedIdentity: LiveUserIdentityProvider = { resolve: async () => ({ ok: true, value: { internalUserId: "server-user", externalUserId: "buildflow_server", safeReference: "user_server" } }) };

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>OpenAI News</title>
    <item>
      <title><![CDATA[New GPT model release]]></title>
      <link>https://openai.com/news/new-gpt-model</link>
      <pubDate>Sat, 15 Aug 2026 01:00:00 GMT</pubDate>
      <description><![CDATA[Product release for developers and agents.]]></description>
    </item>
    <item>
      <title>Security research update</title>
      <link>https://openai.com/news/security-research</link>
      <pubDate>Sat, 15 Aug 2026 00:00:00 GMT</pubDate>
      <description>Research and safety work.</description>
    </item>
    <item>
      <title>Company note</title>
      <link>https://openai.com/news/company-note</link>
      <pubDate>Fri, 14 Aug 2026 00:00:00 GMT</pubDate>
      <description>Company update.</description>
    </item>
  </channel>
</rss>`;

describe("LIVE-RECIPE-AI-NEWS-001 real adapter contracts", () => {
  it("parses OpenAI RSS items into normalized news candidates", () => {
    const items = parseOpenAiNewsRss(rss);

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      title: "New GPT model release",
      url: "https://openai.com/news/new-gpt-model",
      source: "OpenAI News",
      publishedAt: "2026-08-15T01:00:00.000Z",
    });
    expect(items[0].score).toBeGreaterThan(items[2].score);
  });

  it("fetches RSS through an injectable fetch boundary", async () => {
    const calls: string[] = [];
    const fetchImpl: FetchLike = async (input) => {
      calls.push(String(input));
      return { ok: true, status: 200, text: async () => rss };
    };

    const source = new OpenAiNewsRssSource({ feedUrl: "https://example.com/rss.xml", fetchImpl });
    await expect(source.fetchNews()).resolves.toHaveLength(3);
    expect(calls).toEqual(["https://example.com/rss.xml"]);
  });

  it("selects recent items before older high-scoring archive items", () => {
    const items = parseOpenAiNewsRss(`${rss.replace("</channel>", "")}
      <item>
        <title>GPT archive release</title>
        <link>https://openai.com/news/gpt-archive</link>
        <pubDate>Mon, 01 Jan 2018 00:00:00 GMT</pubDate>
        <description>Major GPT model release for developers.</description>
      </item>
    </channel></rss>`);

    expect(selectRecentImportantNews(items, 1)).toEqual([expect.objectContaining({ title: "New GPT model release" })]);
  });

  it("fails closed when the RSS source rejects the request", async () => {
    const source = new OpenAiNewsRssSource({
      feedUrl: "https://example.com/rss.xml",
      fetchImpl: async () => ({ ok: false, status: 503, text: async () => "" }),
    });

    await expect(source.fetchNews()).rejects.toThrow("NEWS_FETCH_FAILED:503");
  });

  it("runs Gate C1 with news fetch evidence and no Slack write", async () => {
    const result = await runNewsFetchGate({
      source: new OpenAiNewsRssSource({
        fetchImpl: async () => ({ ok: true, status: 200, text: async () => rss }),
      }),
    });

    expect(result.selectedItems).toHaveLength(3);
    expect(result.evidence).toMatchObject({
      gate: "C1_NEWS_FETCH",
      actualExternalActions: ["OPENAI_NEWS_RSS_FETCH"],
      aiProviderStatus: "NOT_PERFORMED",
      slackWriteStatus: "NOT_PERFORMED",
    });
  });

  it("runs Gate C2 through an injectable Groq-compatible client and still does not write Slack", async () => {
    const requests: unknown[] = [];
    const summarizer = new GroqSummaryAdapter({
      client: {
        chat: {
          completions: {
            create: async (request) => {
              requests.push(request);
              return {
                choices: [{ message: { content: "1. New GPT model release\n- 개발자용 모델 업데이트입니다.\nSource: OpenAI News" } }],
              };
            },
          },
        },
      },
    });

    const result = await runNewsToGroqSummaryGate({
      source: new OpenAiNewsRssSource({
        fetchImpl: async () => ({ ok: true, status: 200, text: async () => rss }),
      }),
      summarizer,
    });

    expect(requests).toHaveLength(1);
    expect(result.summary.bullets).toContain("New GPT model release");
    expect(result.evidence).toMatchObject({
      gate: "C2_NEWS_TO_GROQ",
      actualExternalActions: ["OPENAI_NEWS_RSS_FETCH", "GROQ_CHAT_COMPLETION"],
      aiProviderStatus: "VERIFIED",
      slackWriteStatus: "NOT_PERFORMED",
    });
  });

  it("formats a bounded Slack digest message", () => {
    const items = selectRecentImportantNews(parseOpenAiNewsRss(rss), 2);
    const message = formatSlackDigestMessage({
      headline: "BuildFlow AI 뉴스 테스트",
      bullets: ["New GPT model release", "- 개발자용 모델 업데이트입니다."],
      sourceItemIds: items.map((item) => item.id),
    }, items);

    expect(message).toContain("[BuildFlow AI 뉴스 테스트]");
    expect(message).toContain("Source: OpenAI News");
    expect(message).toContain("Generated by BuildFlow");
  });

  it("runs Gate C3 with exactly one injected Slack write", async () => {
    const requests: unknown[] = [];
    const adapter = new FakePipedreamConnectAdapter({ slackAccounts: [{ safeExternalReference: "pd_verified" }] });
    const summarizer = new GroqSummaryAdapter({
      client: {
        chat: {
          completions: {
            create: async (request) => {
              requests.push(request);
              return {
                choices: [{ message: { content: "1. New GPT model release\n- 개발자용 모델 업데이트입니다.\nSource: OpenAI News" } }],
              };
            },
          },
        },
      },
    });

    const result = await runNewsToGroqToSlackGate({
      source: new OpenAiNewsRssSource({
        fetchImpl: async () => ({ ok: true, status: 200, text: async () => rss }),
      }),
      summarizer,
      slackWrite: {
        approved: true,
        recipeId: "recipe.ai-news-slack-digest",
        targetConfigurationReference: "approved-channel",
        requestId: "slack-digest-request-12345678",
      },
      liveRecipeDependencies: { environment: guardedEnvironment, identityProvider: guardedIdentity, adapter, idempotency: new InMemorySlackWriteIdempotency() },
    });

    expect(requests).toHaveLength(1);
    expect(adapter.invocationCount.runSlackTestAction).toBe(1);
    expect(result.evidence).toMatchObject({
      gate: "C3_NEWS_TO_GROQ_TO_SLACK",
      actualExternalActions: ["OPENAI_NEWS_RSS_FETCH", "GROQ_CHAT_COMPLETION", "SLACK_MESSAGE_WRITE"],
      aiProviderStatus: "VERIFIED",
      slackWriteStatus: "SUCCEEDED",
      safeSlackReference: "pd_fake_digest_action",
      slackTimestamp: "1786779999.000001",
    });
  });

  it("requires a Groq API key when no test client is injected", () => {
    expect(() => new GroqSummaryAdapter({ apiKey: "" })).toThrow("GROQ_API_KEY_MISSING");
  });
});
