import OpenAI from "openai";
import { runApprovedSlackDigestWrite, type LiveRecipeServiceDependencies } from "../live-recipe/live-recipe-service";
import type { SlackDigestWriteRequest } from "../live-recipe/types";
import { normalizeNewsItems, type AiSummaryPort, type NewsDigestSummary, type NewsItem, type NewsSourcePort, type SelectedNewsItem } from "./manual-recipe";

export const openAiNewsFeedUrl = "https://openai.com/news/rss.xml";
export const groqOpenAiBaseUrl = "https://api.groq.com/openai/v1";
export const defaultGroqModel = "openai/gpt-oss-20b";

type ResponseLike = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<ResponseLike>;

type GroqChatCompletionRequest = {
  model: string;
  temperature: number;
  max_completion_tokens: number;
  messages: Array<{ role: "system" | "user"; content: string }>;
};

type GroqChatClient = {
  chat: {
    completions: {
      create(input: GroqChatCompletionRequest): Promise<{ choices?: Array<{ message?: { content?: string | null } }> }>;
    };
  };
};

export type LiveAiNewsGateEvidence = {
  recipeId: "recipe.ai-news-slack-digest";
  gate: "C1_NEWS_FETCH" | "C2_NEWS_TO_GROQ" | "C3_NEWS_TO_GROQ_TO_SLACK";
  mode: "CONTROLLED_LIVE";
  sourceUrl: string;
  selectedItemCount: number;
  actualExternalActions: Array<"OPENAI_NEWS_RSS_FETCH" | "GROQ_CHAT_COMPLETION" | "SLACK_MESSAGE_WRITE">;
  newsSourceStatus: "VERIFIED";
  aiProviderStatus: "NOT_PERFORMED" | "VERIFIED";
  slackWriteStatus: "NOT_PERFORMED" | "SUCCEEDED";
  safeSlackReference?: string;
  slackTimestamp?: string;
};

export type NewsFetchGateResult = {
  selectedItems: SelectedNewsItem[];
  evidence: LiveAiNewsGateEvidence;
};

export type NewsToGroqSummaryGateResult = NewsFetchGateResult & {
  summary: NewsDigestSummary;
};

export type NewsToGroqToSlackGateResult = NewsToGroqSummaryGateResult & {
  slackResult: { safeExternalReference: string; slackTimestamp?: string };
  message: string;
};

export class OpenAiNewsRssSource implements NewsSourcePort {
  private readonly feedUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(input: { feedUrl?: string; fetchImpl?: FetchLike } = {}) {
    this.feedUrl = input.feedUrl ?? openAiNewsFeedUrl;
    this.fetchImpl = input.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async fetchNews(): Promise<NewsItem[]> {
    const response = await this.fetchImpl(this.feedUrl, {
      headers: { accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8" },
    });
    if (!response.ok) {
      throw new Error(`NEWS_FETCH_FAILED:${response.status}`);
    }

    return parseOpenAiNewsRss(await response.text());
  }
}

export class GroqSummaryAdapter implements AiSummaryPort {
  private readonly client: GroqChatClient;
  private readonly model: string;

  constructor(input: { apiKey?: string; model?: string; client?: GroqChatClient }) {
    const apiKey = input.apiKey?.trim();
    this.model = input.model ?? defaultGroqModel;
    if (input.client) {
      this.client = input.client;
      return;
    }
    if (!apiKey) {
      throw new Error("GROQ_API_KEY_MISSING");
    }
    this.client = new OpenAI({ apiKey, baseURL: groqOpenAiBaseUrl, timeout: 12_000, maxRetries: 0 }) as unknown as GroqChatClient;
  }

  async summarize(input: { items: SelectedNewsItem[] }): Promise<NewsDigestSummary> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      max_completion_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            "You summarize AI news for a Korean Slack digest. Use Korean. Do not invent facts beyond the provided titles, descriptions, and URLs.",
        },
        {
          role: "user",
          content: buildGroqSummaryPrompt(input.items),
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("GROQ_SUMMARY_EMPTY");
    }

    return {
      headline: "BuildFlow AI 뉴스 테스트",
      bullets: normalizeSummaryBullets(content),
      sourceItemIds: input.items.map((item) => item.id),
    };
  }
}

export async function runNewsFetchGate(input: {
  source?: NewsSourcePort;
  selectionLimit?: number;
  sourceUrl?: string;
} = {}): Promise<NewsFetchGateResult> {
  const source = input.source ?? new OpenAiNewsRssSource({ feedUrl: input.sourceUrl });
  const sourceUrl = input.sourceUrl ?? openAiNewsFeedUrl;
  const selectedItems = selectRecentImportantNews(await source.fetchNews(), input.selectionLimit ?? 3);

  return {
    selectedItems,
    evidence: {
      recipeId: "recipe.ai-news-slack-digest",
      gate: "C1_NEWS_FETCH",
      mode: "CONTROLLED_LIVE",
      sourceUrl,
      selectedItemCount: selectedItems.length,
      actualExternalActions: ["OPENAI_NEWS_RSS_FETCH"],
      newsSourceStatus: "VERIFIED",
      aiProviderStatus: "NOT_PERFORMED",
      slackWriteStatus: "NOT_PERFORMED",
    },
  };
}

export async function runNewsToGroqSummaryGate(input: {
  source?: NewsSourcePort;
  summarizer: AiSummaryPort;
  selectionLimit?: number;
  sourceUrl?: string;
}): Promise<NewsToGroqSummaryGateResult> {
  const newsGate = await runNewsFetchGate({
    source: input.source,
    selectionLimit: input.selectionLimit,
    sourceUrl: input.sourceUrl,
  });
  const summary = await input.summarizer.summarize({ items: newsGate.selectedItems });

  return {
    ...newsGate,
    summary,
    evidence: {
      ...newsGate.evidence,
      gate: "C2_NEWS_TO_GROQ",
      actualExternalActions: ["OPENAI_NEWS_RSS_FETCH", "GROQ_CHAT_COMPLETION"],
      aiProviderStatus: "VERIFIED",
      slackWriteStatus: "NOT_PERFORMED",
    },
  };
}

export async function runNewsToGroqToSlackGate(input: {
  source?: NewsSourcePort;
  summarizer: AiSummaryPort;
  slackWrite: Omit<SlackDigestWriteRequest, "message">;
  liveRecipeDependencies?: LiveRecipeServiceDependencies;
  selectionLimit?: number;
  sourceUrl?: string;
}): Promise<NewsToGroqToSlackGateResult> {
  const summaryGate = await runNewsToGroqSummaryGate({
    source: input.source,
    summarizer: input.summarizer,
    selectionLimit: input.selectionLimit,
    sourceUrl: input.sourceUrl,
  });
  const message = formatSlackDigestMessage(summaryGate.summary, summaryGate.selectedItems);
  const slackWrite = await runApprovedSlackDigestWrite({ ...input.slackWrite, message }, input.liveRecipeDependencies);
  if (!slackWrite.ok) throw new Error(`SLACK_WRITE_FAILED:${slackWrite.errorCode}`);
  const slackResult = slackWrite.value;

  return {
    ...summaryGate,
    message,
    slackResult,
    evidence: {
      ...summaryGate.evidence,
      gate: "C3_NEWS_TO_GROQ_TO_SLACK",
      actualExternalActions: ["OPENAI_NEWS_RSS_FETCH", "GROQ_CHAT_COMPLETION", "SLACK_MESSAGE_WRITE"],
      slackWriteStatus: "SUCCEEDED",
      safeSlackReference: slackResult.safeExternalReference,
      ...(slackResult.slackTimestamp ? { slackTimestamp: slackResult.slackTimestamp } : {}),
    },
  };
}

export function parseOpenAiNewsRss(xml: string): NewsItem[] {
  return Array.from(xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi))
    .map((match) => match[1])
    .map((itemXml, index) => {
      const title = cleanXmlText(readXmlField(itemXml, "title"));
      const url = cleanXmlText(readXmlField(itemXml, "link"));
      const publishedAt = toIsoDate(cleanXmlText(readXmlField(itemXml, "pubDate")));
      const description = cleanXmlText(readXmlField(itemXml, "description"));
      return {
        id: stableId(`${title}:${url}:${index}`),
        title,
        url,
        source: "OpenAI News",
        publishedAt,
        score: scoreNewsItem(`${title} ${description}`),
      };
    })
    .filter((item) => item.title && item.url);
}

export function selectRecentImportantNews(items: NewsItem[], limit = 3): SelectedNewsItem[] {
  return normalizeNewsItems(items)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.score - a.score)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      selectionReason: item.score >= 80 ? "recent high-impact AI update" : "recent AI news candidate",
    }));
}

export function formatSlackDigestMessage(summary: NewsDigestSummary, selectedItems: SelectedNewsItem[]): string {
  const titleById = new Map(selectedItems.map((item) => [item.id, item.title]));
  const body = summary.bullets
    .slice(0, 12)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
  const sources = summary.sourceItemIds
    .map((id, index) => `${index + 1}. ${titleById.get(id) ?? id}`)
    .join("\n");

  return [
    "[BuildFlow AI 뉴스 테스트]",
    "",
    body,
    "",
    "Source: OpenAI News",
    sources,
    "Generated by BuildFlow",
  ].join("\n");
}

function buildGroqSummaryPrompt(items: SelectedNewsItem[]): string {
  const sourceBlock = items
    .map((item, index) => [`${index + 1}. ${item.title}`, `URL: ${item.url}`, `Published: ${item.publishedAt}`, `Reason: ${item.selectionReason}`].join("\n"))
    .join("\n\n");

  return [
    "아래 뉴스 3개 이하를 Slack에 보낼 한국어 digest로 요약하세요.",
    "형식은 각 항목마다 제목 한 줄과 핵심 요약 한 줄입니다.",
    "마지막 줄에는 'Source: OpenAI News'를 포함하세요.",
    "",
    sourceBlock,
  ].join("\n");
}

function readXmlField(xml: string, field: string): string {
  const match = xml.match(new RegExp(`<${field}\\b[^>]*>([\\s\\S]*?)<\\/${field}>`, "i"));
  return match?.[1] ?? "";
}

function cleanXmlText(value: string): string {
  return decodeXmlEntities(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function toIsoDate(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return new Date(0).toISOString();
  }
  return new Date(timestamp).toISOString();
}

function scoreNewsItem(text: string): number {
  const haystack = text.toLowerCase();
  let score = 60;
  if (/\b(openai|gpt|model|chatgpt)\b/.test(haystack)) score += 20;
  if (/\b(api|developers?|agents?|research|safety|security|product)\b/.test(haystack)) score += 10;
  if (/\b(release|launch|available|preview|guide)\b/.test(haystack)) score += 5;
  return Math.min(score, 100);
}

function stableId(input: string): string {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `openai-news-${(hash >>> 0).toString(16)}`;
}

function normalizeSummaryBullets(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}
