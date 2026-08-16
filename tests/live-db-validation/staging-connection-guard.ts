import "server-only";
import { loadLiveDbEnvironment } from "./environment-loader";
import { validateLiveDbEnvironment } from "./environment-guard";
import { createLiveDbClient, type LiveDbClientFactory } from "./live-db-client";
import type { LiveDbClientIdentity, LiveDbSafeErrorCode } from "./types";

type EnvironmentSource = Record<string, string | undefined>;

export type LiveDbStagingConnectionResult =
  | {
      status: "READY";
      targetEnvironment: "staging";
      targetIdentityMasked: string;
      clientIdentity: LiveDbClientIdentity;
    }
  | { status: "BLOCKED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * The staging execution boundary. Refuses to construct a client unless the
 * target guard passes for an explicit `staging` target with
 * LIVE_DB_EXECUTION_CONFIRMED=true; a passing guard only constructs a client
 * object (no query is issued, so this performs zero network calls).
 */
export function evaluateLiveDbStagingConnection(
  source: EnvironmentSource = process.env,
  factory?: LiveDbClientFactory,
): LiveDbStagingConnectionResult {
  const environment = loadLiveDbEnvironment("connection", source);
  const guard = validateLiveDbEnvironment(environment);
  if (!guard.ok) return { status: "BLOCKED", safeErrorCode: guard.safeErrorCode };
  if (guard.targetEnvironment !== "staging") {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_STAGING_TARGET_REQUIRED" };
  }

  const clientResult = createLiveDbClient(
    { url: environment.liveDbSupabaseUrl, serviceRoleKey: environment.liveDbServiceRoleKey },
    factory,
  );
  if (clientResult.status === "BLOCKED") return clientResult;

  return {
    status: "READY",
    targetEnvironment: "staging",
    targetIdentityMasked: guard.targetIdentityMasked,
    clientIdentity: clientResult.identity,
  };
}
