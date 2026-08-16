import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { checksumRuntimeApprovalBinding } from "../../src/features/runtime-approval/validator";
import type { RuntimeApprovalBinding } from "../../src/features/runtime-approval/types";
import { loadLiveDbEnvironment } from "./environment-loader";
import {
  createRlsActorSet,
  type LiveDbActorClient,
  type LiveDbAuthClient,
} from "./rls-actor-factory";
import {
  loadStagingEnvironmentSource,
  type LiveDbEnvironmentSource,
} from "./staging-env-file";
import type { LiveDbStagingEvidenceSummary } from "./staging-evidence";
import { createSupabaseMigrationExecutor } from "./supabase-migration-executor";
import { runStagingValidation } from "./staging-validation-run";
import { LIVE_DB_TEST_PREFIX, type LiveDbSafeErrorCode } from "./types";

/**
 * Checksum placeholders for the validation binding.
 *
 * They are derived from the run id, so two runs never collide on the UNIQUE
 * `binding_checksum`, and they are plain hashes of harness-owned strings — no
 * prompt, plan, or provider payload is involved, because ST-B validates the
 * approval boundary rather than any real execution request.
 */
const seedChecksum = (seed: string) =>
  checksumRuntimeApprovalBinding({
    projectId: seed,
    userId: seed,
    scope: "CORE_RUNTIME_PROVIDER_EXECUTION",
    runtimeExecutionRequestId: seed,
    runtimeExecutionRequestChecksum: "0".repeat(64),
    runtimePlanId: seed,
    runtimePlanChecksum: "0".repeat(64),
    provider: "openai",
    model: seed,
    safeInputChecksum: "0".repeat(64),
  });

export type StagingRunIdentity = {
  projectId: string;
  userId: string;
};

/**
 * Builds the template binding and the APR-04 probe from a run id.
 *
 * Every identifier carries `LIVE_DB_TEST_PREFIX`, which is what makes the rows
 * this run creates findable by ST-D cleanup; `assertApprovalFixtures` refuses a
 * template without it.
 */
export function buildStagingBindings(
  identity: StagingRunIdentity,
  runId: string,
): { binding: RuntimeApprovalBinding; mismatchedBinding: RuntimeApprovalBinding } {
  const prefixed = (suffix: string) => `${LIVE_DB_TEST_PREFIX}${runId}-${suffix}`;
  const core = {
    projectId: identity.projectId,
    userId: identity.userId,
    scope: "CORE_RUNTIME_PROVIDER_EXECUTION" as const,
    runtimeExecutionRequestId: prefixed("request"),
    runtimeExecutionRequestChecksum: seedChecksum(prefixed("request")),
    runtimePlanId: prefixed("plan"),
    runtimePlanChecksum: seedChecksum(prefixed("plan")),
    provider: "openai" as const,
    model: "live-db-validation-model",
    safeInputChecksum: seedChecksum(prefixed("input")),
  };
  const mismatchCore = { ...core, safeInputChecksum: seedChecksum(prefixed("input-mismatch")) };
  return {
    binding: { ...core, bindingChecksum: checksumRuntimeApprovalBinding(core) },
    mismatchedBinding: {
      ...mismatchCore,
      bindingChecksum: checksumRuntimeApprovalBinding(mismatchCore),
    },
  };
}

const authClient = (url: string, anonKey: string): SupabaseClient =>
  createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

export type StagingEntrypointResult = {
  status: "PASSED" | "BLOCKED";
  safeErrorCode?: LiveDbSafeErrorCode;
  evidence?: LiveDbStagingEvidenceSummary;
};

export type StagingEntrypointOptions = {
  /** Overrides the env source; production callers let it read the staging file. */
  source?: LiveDbEnvironmentSource;
  runId?: string;
  now?: () => Date;
  wait?: (milliseconds: number) => Promise<void>;
  maxExpiryWaitMs?: number;
};

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

/**
 * The ST-B entrypoint.
 *
 * It reads `.env.live-db.staging` and nothing else for credentials, builds the
 * three RLS actor clients, hands the composition root a real Supabase CLI
 * executor, and returns only a safe summary.
 *
 * It performs the two things the composition root deliberately cannot: reading
 * the environment file, and establishing owner/other sessions. Everything after
 * that — the guard, the migration, and every case — belongs to the root.
 */
export async function runStagingValidationEntrypoint(
  options: StagingEntrypointOptions = {},
): Promise<StagingEntrypointResult> {
  let source = options.source;
  if (!source) {
    const loaded = loadStagingEnvironmentSource();
    if (loaded.status === "BLOCKED") return { status: "BLOCKED", safeErrorCode: loaded.safeErrorCode };
    source = loaded.source;
  }

  const environment = loadLiveDbEnvironment("connection", source);
  const url = source.LIVE_DB_SUPABASE_URL?.trim();
  const anonKey = source.LIVE_DB_SUPABASE_ANON_KEY?.trim();
  const projectId = source.LIVE_DB_OWNER_PROJECT_ID?.trim();
  const userId = source.LIVE_DB_OWNER_USER_ID?.trim();
  if (!url || !anonKey) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED" };
  }
  if (!projectId || !userId) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_OWNER_IDENTITY_MISSING" };
  }

  const actorSet = await createRlsActorSet({
    ownerClient: authClient(url, anonKey) as unknown as LiveDbAuthClient,
    otherClient: authClient(url, anonKey) as unknown as LiveDbAuthClient,
    anonClient: authClient(url, anonKey) as unknown as LiveDbActorClient,
    owner: {
      email: source.LIVE_DB_OWNER_EMAIL ?? "",
      password: source.LIVE_DB_OWNER_PASSWORD ?? "",
    },
    other: {
      email: source.LIVE_DB_OTHER_EMAIL ?? "",
      password: source.LIVE_DB_OTHER_PASSWORD ?? "",
    },
  });
  if (actorSet.status === "BLOCKED") {
    return { status: "BLOCKED", safeErrorCode: actorSet.safeErrorCode };
  }

  const now = options.now ?? (() => new Date());
  const runId = options.runId ?? `staging-${now().getTime()}`;
  const result = await runStagingValidation({
    environment,
    migrationExecutor: createSupabaseMigrationExecutor(),
    approval: buildStagingBindings({ projectId, userId }, runId),
    rls: { actors: actorSet.actors, identity: actorSet.identity },
    timestamp: now().toISOString(),
    clock: () => now().getTime(),
    wait: options.wait ?? sleep,
    validationRunId: `${LIVE_DB_TEST_PREFIX}${runId}`,
    ...(source.LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF
      ? { forbiddenProjectRefs: [source.LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF] }
      : {}),
    ...(options.maxExpiryWaitMs !== undefined ? { maxExpiryWaitMs: options.maxExpiryWaitMs } : {}),
  });

  return {
    status: result.status,
    ...(result.safeErrorCode ? { safeErrorCode: result.safeErrorCode } : {}),
    evidence: result.evidence,
  };
}
