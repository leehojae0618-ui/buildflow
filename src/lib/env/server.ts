import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional().default("gpt-5.6-luna"),
});

export const serverEnv = serverEnvSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
  OPENAI_MODEL: process.env.OPENAI_MODEL || undefined,
});

export const hasSupabaseServerEnv = Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY);

export function requireSupabaseServerEnv() {
  if (!hasSupabaseServerEnv) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  return serverEnv as { SUPABASE_SERVICE_ROLE_KEY: string };
}

export const hasOpenAIEnv = Boolean(serverEnv.OPENAI_API_KEY && serverEnv.OPENAI_MODEL);

export function requireOpenAIEnv() {
  if (!hasOpenAIEnv || !serverEnv.OPENAI_API_KEY) throw new Error("OpenAI is not configured.");
  return { apiKey: serverEnv.OPENAI_API_KEY, model: serverEnv.OPENAI_MODEL };
}
