import type { RecipeIntent } from "./types";

const tokenPattern = /[a-z0-9]+|[가-힣]{2,}/gi;
const stopWords = new Set(["해서", "하고", "보내줘", "만들어줘", "싶어", "중요한", "것만", "자동화", "주세요", "매일", "정리", "내용"]);

function includesAny(value: string, patterns: string[]) { return patterns.some((pattern) => value.includes(pattern)); }

export function analyzeRecipeIntent(goal: string): RecipeIntent {
  const originalGoal = goal.trim();
  if (!originalGoal) return { originalGoal, normalizedGoal: "", frequency: "UNKNOWN", domains: [], operations: [], destinations: [], automation: "UNKNOWN", keywords: [], status: "EMPTY" };

  const normalizedGoal = originalGoal.toLocaleLowerCase();
  const frequency = includesAny(normalizedGoal, ["매일", "daily", "매주", "weekly"]) ? (includesAny(normalizedGoal, ["매일", "daily"]) ? "DAILY" : "WEEKLY") : includesAny(normalizedGoal, ["새", "오면", "되면", "when"]) ? "EVENT_DRIVEN" : "ON_DEMAND";
  const domains = [
    ...(includesAny(normalizedGoal, ["ai 뉴스", "뉴스", "rss", "기사"]) ? ["AI_NEWS"] : []),
    ...(includesAny(normalizedGoal, ["이메일", "메일", "gmail"]) ? ["EMAIL"] : []),
    ...(includesAny(normalizedGoal, ["회의", "미팅", "meeting"]) ? ["MEETING"] : []),
    ...(includesAny(normalizedGoal, ["리드", "고객", "문의", "support"]) ? ["CUSTOMER"] : []),
    ...(includesAny(normalizedGoal, ["콘텐츠", "블로그", "게시", "post"]) ? ["CONTENT"] : []),
    ...(includesAny(normalizedGoal, ["주문", "쇼핑", "shopify", "이커머스"]) ? ["COMMERCE"] : []),
  ];
  const operations = [
    ...(includesAny(normalizedGoal, ["찾", "수집", "뉴스", "rss"]) ? ["COLLECT"] : []),
    ...(includesAny(normalizedGoal, ["요약", "summar"]) ? ["SUMMARIZE"] : []),
    ...(includesAny(normalizedGoal, ["중요", "선별", "분류", "rank"]) ? ["RANK"] : []),
    ...(includesAny(normalizedGoal, ["알려", "보내", "전송", "notify"]) ? ["NOTIFY"] : []),
    ...(includesAny(normalizedGoal, ["저장", "기록", "save"]) ? ["STORE"] : []),
    ...(includesAny(normalizedGoal, ["답변", "reply"]) ? ["RESPOND"] : []),
  ];
  const destinations = [
    ...(includesAny(normalizedGoal, ["slack", "슬랙"]) ? ["SLACK"] : []),
    ...(includesAny(normalizedGoal, ["notion", "노션"]) ? ["NOTION"] : []),
    ...(includesAny(normalizedGoal, ["sheets", "시트", "spreadsheet"]) ? ["GOOGLE_SHEETS"] : []),
    ...(includesAny(normalizedGoal, ["email", "이메일", "메일"]) ? ["GMAIL"] : []),
  ];
  const keywords = [...new Set((normalizedGoal.match(tokenPattern) ?? []).filter((token) => !stopWords.has(token) && token.length > 1))];
  const automation = frequency === "DAILY" || frequency === "WEEKLY" ? "SCHEDULED" : frequency === "EVENT_DRIVEN" ? "EVENT_DRIVEN" : operations.length ? "ASSISTED" : "UNKNOWN";
  const status = operations.length ? (domains.length || destinations.length ? "UNDERSTOOD" : "PARTIAL") : "UNSUPPORTED";
  return { originalGoal, normalizedGoal, frequency, domains, operations, destinations, automation, keywords, status };
}
