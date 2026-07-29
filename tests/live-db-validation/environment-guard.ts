import type {
  LiveDbEnvironmentInput,
  LiveDbEnvironmentResult,
  LiveDbTargetEnvironment,
} from "./types";

const hostedProjectRef = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password || parsed.protocol !== "https:") return null;
    if (!parsed.hostname.endsWith(".supabase.co")) return null;
    const [projectRef, ...rest] = parsed.hostname.split(".");
    if (rest.join(".") !== "supabase.co" || !projectRef || !/^[a-z0-9-]{4,}$/i.test(projectRef)) return null;
    return projectRef;
  } catch {
    return null;
  }
};

const localTargetIdentity = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" || (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1")) return null;
    const port = parsed.port || "80";
    return `local:${parsed.hostname}:${port.slice(0, 2)}***`;
  } catch {
    return null;
  }
};

export function maskHostedProjectRef(projectRef: string): string {
  if (projectRef.length <= 4) return `${projectRef.slice(0, 1)}…`;
  return `${projectRef.slice(0, 4)}…${projectRef.slice(-4)}`;
}

export function targetIdentityFromUrl(url: string): { kind: "local" | "hosted"; masked: string; projectRef?: string } | null {
  const local = localTargetIdentity(url);
  if (local) return { kind: "local", masked: local };
  const projectRef = hostedProjectRef(url);
  return projectRef ? { kind: "hosted", masked: maskHostedProjectRef(projectRef), projectRef } : null;
}

function isTargetEnvironment(value: string | undefined): value is LiveDbTargetEnvironment {
  return value === "local" || value === "staging";
}

function normalizedOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.username || parsed.password ? null : parsed.origin;
  } catch {
    return null;
  }
}

/** Pure guard: callers provide a bounded env projection; no process.env is read here. */
export function validateLiveDbEnvironment(input: LiveDbEnvironmentInput): LiveDbEnvironmentResult {
  if (!input.targetEnvironment) return { ok: false, safeErrorCode: "LIVE_DB_TARGET_MISSING" };
  if (input.targetEnvironment === "production") return { ok: false, safeErrorCode: "LIVE_DB_PRODUCTION_FORBIDDEN" };
  if (!isTargetEnvironment(input.targetEnvironment)) return { ok: false, safeErrorCode: "LIVE_DB_TARGET_INVALID" };
  if (input.openAiApiKeyPresent) return { ok: false, safeErrorCode: "LIVE_DB_OPENAI_KEY_PRESENT" };
  if (!input.liveDbSupabaseUrl?.trim()) return { ok: false, safeErrorCode: "LIVE_DB_URL_MISSING" };
  if (!input.liveDbServiceRoleKey?.trim()) return { ok: false, safeErrorCode: "LIVE_DB_SERVICE_ROLE_KEY_MISSING" };
  if (input.mode === "connection" && input.executionConfirmed !== "true") {
    return { ok: false, safeErrorCode: "LIVE_DB_EXECUTION_CONFIRMATION_REQUIRED" };
  }

  const target = targetIdentityFromUrl(input.liveDbSupabaseUrl);
  if (!target) return { ok: false, safeErrorCode: "LIVE_DB_TARGET_IDENTITY_INVALID" };
  const targetOrigin = normalizedOrigin(input.liveDbSupabaseUrl);
  const appOrigin = input.applicationSupabaseUrl ? normalizedOrigin(input.applicationSupabaseUrl) : null;
  if (targetOrigin && appOrigin && targetOrigin === appOrigin) {
    return { ok: false, safeErrorCode: "LIVE_DB_APP_TARGET_MATCH" };
  }
  if (input.targetEnvironment === "staging") {
    if (!input.knownProductionProjectRef?.trim()) {
      return { ok: false, safeErrorCode: "LIVE_DB_PRODUCTION_IDENTITY_UNKNOWN" };
    }
    if (target.kind === "hosted" && target.projectRef === input.knownProductionProjectRef) {
      return { ok: false, safeErrorCode: "LIVE_DB_PRODUCTION_TARGET_MATCH" };
    }
  }
  if (input.targetEnvironment === "local" && target.kind !== "local") {
    return { ok: false, safeErrorCode: "LIVE_DB_TARGET_IDENTITY_INVALID" };
  }
  if (input.targetEnvironment === "staging" && target.kind !== "hosted") {
    return { ok: false, safeErrorCode: "LIVE_DB_TARGET_IDENTITY_INVALID" };
  }
  return { ok: true, targetEnvironment: input.targetEnvironment, targetIdentityMasked: target.masked };
}
