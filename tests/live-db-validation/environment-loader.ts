import type { LiveDbEnvironmentInput, LiveDbHarnessMode } from "./types";

type EnvironmentSource = Record<string, string | undefined>;

/** The only Harness module permitted to read process.env. It returns no raw values to callers outside composition. */
export function loadLiveDbEnvironment(
  mode: LiveDbHarnessMode,
  source: EnvironmentSource = process.env,
): LiveDbEnvironmentInput {
  return {
    targetEnvironment: source.LIVE_DB_TARGET_ENV,
    liveDbSupabaseUrl: source.LIVE_DB_SUPABASE_URL,
    liveDbAnonKey: source.LIVE_DB_SUPABASE_ANON_KEY,
    liveDbServiceRoleKey: source.LIVE_DB_SUPABASE_SERVICE_ROLE_KEY,
    liveDbDatabaseUrl: source.LIVE_DB_DATABASE_URL,
    executionConfirmed: source.LIVE_DB_EXECUTION_CONFIRMED,
    openAiApiKeyPresent: Boolean(source.OPENAI_API_KEY),
    applicationSupabaseUrl: source.NEXT_PUBLIC_SUPABASE_URL,
    knownProductionProjectRef: source.LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF,
    mode,
  };
}
