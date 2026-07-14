import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabasePublicEnv } from "@/lib/env";
import { requireSupabaseServerEnv } from "@/lib/env/server";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = requireSupabasePublicEnv();
  const { SUPABASE_SERVICE_ROLE_KEY } = requireSupabaseServerEnv();
  return createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}
