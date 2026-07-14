import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export const serverEnv = serverEnvSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
});

export const hasSupabaseServerEnv = Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY);

export function requireSupabaseServerEnv() {
  if (!hasSupabaseServerEnv) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  return serverEnv as { SUPABASE_SERVICE_ROLE_KEY: string };
}
