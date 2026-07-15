import "server-only";
import OpenAI from "openai";
import { requireOpenAIEnv } from "@/lib/env/server";

export function createOpenAIClient() {
  const { apiKey } = requireOpenAIEnv();
  return new OpenAI({ apiKey, timeout: 12_000, maxRetries: 0 });
}
