import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SupabaseRuntimeEvidenceRepository } from "../../src/features/agents/runtime-evidence-supabase";
import { SupabaseRuntimeApprovalRepository } from "../../src/features/runtime-approval/runtime-approval-supabase";
import type { Database } from "../../src/types/database";
import {
  LIVE_DB_CLIENT_MODE,
  type LiveDbClientIdentity,
  type LiveDbClientIdentityCandidate,
  type LiveDbSafeErrorCode,
} from "./types";

export type LiveDbClientConfiguration = {
  url?: string;
  serviceRoleKey?: string;
};

export type LiveDbClientFactory = (
  url: string,
  serviceRoleKey: string,
) => SupabaseClient<Database>;

export type LiveDbClientResult =
  | { status: "READY"; client: SupabaseClient<Database>; identity: LiveDbClientIdentity }
  | { status: "BLOCKED"; safeErrorCode: LiveDbSafeErrorCode };

export type ExplicitRepositoryInjection = {
  approvalRepository: SupabaseRuntimeApprovalRepository;
  evidenceRepository: SupabaseRuntimeEvidenceRepository;
  identity: LiveDbClientIdentity;
};

const identity = (): LiveDbClientIdentity => ({
  supabaseClientMode: LIVE_DB_CLIENT_MODE,
  appClientFactoryUsed: false,
  adminClientFactoryUsed: false,
  serverClientFactoryUsed: false,
});

const defaultFactory: LiveDbClientFactory = (url, serviceRoleKey) =>
  createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

/**
 * Builds a dedicated validation client from explicit LIVE_DB values only.
 * It intentionally does not call any application Supabase client factory.
 */
export function createLiveDbClient(
  configuration: LiveDbClientConfiguration,
  factory: LiveDbClientFactory = defaultFactory,
): LiveDbClientResult {
  if (!configuration.url?.trim()) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_URL_MISSING" };
  }
  if (!configuration.serviceRoleKey?.trim()) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_SERVICE_ROLE_KEY_MISSING" };
  }
  return { status: "READY", client: factory(configuration.url, configuration.serviceRoleKey), identity: identity() };
}

/**
 * Validates a caller's declaration about how its Supabase access was built.
 *
 * This is an attestation check, not a proof: it can only confirm that the
 * caller claims no application, admin or server factory was used and no
 * repository default was relied on. Use it where the boundary cannot construct
 * the access itself — for anything it can construct, build it instead.
 */
export function liveDbClientIdentityFailure(
  identity: LiveDbClientIdentityCandidate | undefined,
): LiveDbSafeErrorCode | undefined {
  if (!identity) return "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED";
  if (identity.supabaseClientMode !== LIVE_DB_CLIENT_MODE) return "LIVE_DB_CLIENT_MODE_INVALID";
  if (identity.appClientFactoryUsed === true) return "LIVE_DB_APP_CLIENT_FACTORY_USED";
  if (identity.adminClientFactoryUsed === true) return "LIVE_DB_ADMIN_CLIENT_FACTORY_USED";
  if (identity.serverClientFactoryUsed === true) return "LIVE_DB_SERVER_CLIENT_FACTORY_USED";
  if (identity.repositoryDefaultClientFallbackUsed === true) {
    return "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED";
  }
  // An omitted or non-false flag is not a denial, so it cannot be trusted.
  if (
    identity.appClientFactoryUsed !== false ||
    identity.adminClientFactoryUsed !== false ||
    identity.serverClientFactoryUsed !== false
  ) {
    return "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED";
  }
  return undefined;
}

/**
 * Requires two explicitly supplied clients before constructing repository adapters.
 * The repositories therefore cannot fall back to an application default client.
 */
export function createExplicitRepositoryInjection(
  approvalClient: SupabaseClient<Database> | undefined,
  evidenceClient: SupabaseClient<Database> | undefined,
): ExplicitRepositoryInjection | { status: "BLOCKED"; safeErrorCode: LiveDbSafeErrorCode } {
  if (!approvalClient || !evidenceClient) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED" };
  }
  return {
    approvalRepository: new SupabaseRuntimeApprovalRepository(approvalClient),
    evidenceRepository: new SupabaseRuntimeEvidenceRepository(evidenceClient),
    identity: identity(),
  };
}
