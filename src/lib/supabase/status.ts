import { hasSupabasePublicEnv } from "@/lib/env";
import { hasSupabaseServerEnv } from "@/lib/env/server";

export type SupabaseConfigurationStatus = { publicConfigured: boolean; serverConfigured: boolean };

export function getSupabaseConfigurationStatus(): SupabaseConfigurationStatus {
  return { publicConfigured: hasSupabasePublicEnv, serverConfigured: hasSupabaseServerEnv };
}
