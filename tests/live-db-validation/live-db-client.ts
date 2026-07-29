import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SupabaseRuntimeEvidenceRepository } from "../../src/features/agents/runtime-evidence-supabase";
import { SupabaseRuntimeApprovalRepository } from "../../src/features/runtime-approval/runtime-approval-supabase";
import type { Database } from "../../src/types/database";
import {
  LIVE_DB_CLIENT_MODE,
  type LiveDbClientIdentity,
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
