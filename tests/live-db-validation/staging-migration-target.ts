import { targetIdentityFromUrl, validateLiveDbEnvironment } from "./environment-guard";
import type { LiveDbEnvironmentInput, LiveDbSafeErrorCode } from "./types";

/**
 * Carries the staging database URL without letting it reach Evidence or logs.
 * `JSON.stringify` and string coercion both yield a redacted marker, so a
 * carrier accidentally embedded in an Evidence summary cannot leak the URL
 * (which contains the database password). Only `reveal()` returns the value,
 * and only the injected migration executor is expected to call it.
 */
export class LiveDbSecretCarrier {
  readonly #value: string;

  constructor(value: string) {
    this.#value = value;
  }

  reveal(): string {
    return this.#value;
  }

  toJSON(): string {
    return "[redacted]";
  }

  toString(): string {
    return "[redacted]";
  }
}

export type LiveDbStagingMigrationTarget = {
  targetEnvironment: "staging";
  /** Masked form of the ref both bindings agreed on; safe for Evidence. */
  targetProjectRefMasked: string;
  databaseUrl: LiveDbSecretCarrier;
};

export type LiveDbStagingMigrationTargetResult =
  | { status: "RESOLVED"; target: LiveDbStagingMigrationTarget }
  | { status: "BLOCKED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * Extracts the Supabase project ref from a postgres connection URL.
 * Supabase exposes two shapes, and only these two are accepted:
 *   direct  postgresql://postgres:PW@db.<ref>.supabase.co:5432/postgres
 *   pooler  postgresql://postgres.<ref>:PW@aws-0-<region>.pooler.supabase.com:6543/postgres
 * Anything else returns null so the caller fails closed rather than guessing.
 */
export function projectRefFromDatabaseUrl(databaseUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") return null;

  const hostname = parsed.hostname.toLowerCase();
  // Mirrors the ref shape the ST-A guard accepts, so the two bindings cannot
  // disagree merely because one parser is stricter than the other. The safety
  // property comes from the equality check, not from the length.
  const isRef = (value: string) => /^[a-z0-9-]{4,}$/.test(value);

  if (hostname.startsWith("db.") && hostname.endsWith(".supabase.co")) {
    const ref = hostname.slice("db.".length, -".supabase.co".length);
    return isRef(ref) ? ref : null;
  }

  if (hostname.endsWith(".pooler.supabase.com")) {
    // The pooler carries the ref in the username as `postgres.<ref>`.
    const [role, ref, ...rest] = decodeURIComponent(parsed.username).split(".");
    if (!role || rest.length > 0 || !ref) return null;
    return isRef(ref.toLowerCase()) ? ref.toLowerCase() : null;
  }

  return null;
}

/**
 * Resolves the ST-B migration target under dual binding.
 *
 * Binding 1 is LIVE_DB_SUPABASE_URL, run through the ST-A environment guard
 * unchanged, so every existing protection still applies: production target,
 * app-target match, unknown production ref, OPENAI_API_KEY presence, and
 * LIVE_DB_EXECUTION_CONFIRMED are all enforced there.
 *
 * Binding 2 is LIVE_DB_DATABASE_URL. Migration only proceeds when the ref
 * derived from it is identical to the ref the guard already approved. The
 * linked project state under `supabase/.temp/` is never consulted.
 */
export function resolveStagingMigrationTarget(
  environment: LiveDbEnvironmentInput,
): LiveDbStagingMigrationTargetResult {
  const guard = validateLiveDbEnvironment({ ...environment, mode: "connection" });
  if (!guard.ok) return { status: "BLOCKED", safeErrorCode: guard.safeErrorCode };
  if (guard.targetEnvironment !== "staging") {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_STAGING_TARGET_REQUIRED" };
  }

  const approved = targetIdentityFromUrl(environment.liveDbSupabaseUrl ?? "");
  if (!approved || approved.kind !== "hosted" || !approved.projectRef) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_TARGET_IDENTITY_INVALID" };
  }

  const databaseUrl = environment.liveDbDatabaseUrl?.trim();
  if (!databaseUrl) return { status: "BLOCKED", safeErrorCode: "LIVE_DB_DB_URL_MISSING" };

  const databaseRef = projectRefFromDatabaseUrl(databaseUrl);
  if (!databaseRef) return { status: "BLOCKED", safeErrorCode: "LIVE_DB_DB_URL_IDENTITY_INVALID" };

  if (databaseRef !== approved.projectRef.toLowerCase()) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_DB_URL_TARGET_MISMATCH" };
  }

  // Re-check the production ref against the DB-derived ref as well. The guard
  // already compared it against the Supabase URL, but the two bindings are only
  // known to agree at this point, so this makes the production block explicit
  // for whichever binding the executor actually uses.
  if (environment.knownProductionProjectRef?.trim().toLowerCase() === databaseRef) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_PRODUCTION_TARGET_MATCH" };
  }

  return {
    status: "RESOLVED",
    target: {
      targetEnvironment: "staging",
      targetProjectRefMasked: guard.targetIdentityMasked,
      databaseUrl: new LiveDbSecretCarrier(databaseUrl),
    },
  };
}
