export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  score: number;
};

export type SelectedNewsItem = NewsItem & {
  selectionReason: string;
};

export type NewsDigestSummary = {
  headline: string;
  bullets: string[];
  sourceItemIds: string[];
};

export type LiveAiNewsEvidence = {
  recipeId: "recipe.ai-news-slack-digest";
  mode: "LOCAL_SIMULATION";
  newsSourceStatus: "SIMULATED";
  aiProviderStatus: "SIMULATED";
  slackWriteStatus: "SIMULATED";
  selectedItemCount: number;
  messagePreview: string;
  actualExternalAction: false;
};

export type ManualAiNewsRecipeResult = {
  status: "SIMULATED_READY" | "NOT_READY";
  selectedItems: SelectedNewsItem[];
  summary: NewsDigestSummary | null;
  evidence: LiveAiNewsEvidence;
};

export type NewsSourcePort = {
  fetchNews(): Promise<NewsItem[]>;
};

export type AiSummaryPort = {
  summarize(input: { items: SelectedNewsItem[] }): Promise<NewsDigestSummary>;
};

export type SlackOutputPort = {
  prepareMessage(input: { summary: NewsDigestSummary }): Promise<{ messagePreview: string }>;
};

export function normalizeNewsItems(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items
    .filter((item) => item.id && item.title.trim() && item.url.startsWith("https://"))
    .filter((item) => {
      const key = `${item.source}:${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score || a.publishedAt.localeCompare(b.publishedAt));
}

export function selectImportantNews(items: NewsItem[], limit = 3): SelectedNewsItem[] {
  return normalizeNewsItems(items)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      selectionReason: item.score >= 80 ? "high-impact AI update" : "ranked AI news candidate",
    }));
}

export async function runManualAiNewsSlackRecipe(input: {
  newsSource: NewsSourcePort;
  summarizer: AiSummaryPort;
  slackOutput: SlackOutputPort;
  selectionLimit?: number;
}): Promise<ManualAiNewsRecipeResult> {
  const selectedItems = selectImportantNews(await input.newsSource.fetchNews(), input.selectionLimit);
  if (!selectedItems.length) {
    return {
      status: "NOT_READY",
      selectedItems,
      summary: null,
      evidence: {
        recipeId: "recipe.ai-news-slack-digest",
        mode: "LOCAL_SIMULATION",
        newsSourceStatus: "SIMULATED",
        aiProviderStatus: "SIMULATED",
        slackWriteStatus: "SIMULATED",
        selectedItemCount: 0,
        messagePreview: "",
        actualExternalAction: false,
      },
    };
  }
  const summary = await input.summarizer.summarize({ items: selectedItems });
  const prepared = await input.slackOutput.prepareMessage({ summary });
  return {
    status: "SIMULATED_READY",
    selectedItems,
    summary,
    evidence: {
      recipeId: "recipe.ai-news-slack-digest",
      mode: "LOCAL_SIMULATION",
      newsSourceStatus: "SIMULATED",
      aiProviderStatus: "SIMULATED",
      slackWriteStatus: "SIMULATED",
      selectedItemCount: selectedItems.length,
      messagePreview: prepared.messagePreview,
      actualExternalAction: false,
    },
  };
}

