import { readFileSync } from "node:fs";

import type { LiveDbSafeErrorCode } from "./types";

export const LIVE_DB_STAGING_ENV_PATH = ".env.live-db.staging" as const;

/**
 * Credentials and target selectors that may come only from the staging env
 * file. Deliberately never read from `process.env`: `.env.local` is loaded into
 * the process by other tooling, and silently inheriting an application value
 * here is exactly how a validation run would end up pointed at the app project.
 */
const fileOnlyKeys = [
  "LIVE_DB_TARGET_ENV",
  "LIVE_DB_SUPABASE_URL",
  "LIVE_DB_SUPABASE_ANON_KEY",
  "LIVE_DB_SUPABASE_SERVICE_ROLE_KEY",
  "LIVE_DB_DATABASE_URL",
  "LIVE_DB_EXECUTION_CONFIRMED",
  "LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF",
  "LIVE_DB_OWNER_USER_ID",
  "LIVE_DB_OWNER_PROJECT_ID",
  "LIVE_DB_OWNER_EMAIL",
  "LIVE_DB_OWNER_PASSWORD",
  "LIVE_DB_OTHER_EMAIL",
  "LIVE_DB_OTHER_PASSWORD",
] as const;

/**
 * Keys whose job is to *detect danger*, so the widest view is the safe one.
 * A value present in either place counts:
 *
 * - `OPENAI_API_KEY` is a fail-closed stop under CONTRACT.md, and it stops the
 *   run because it is reachable by the process — not because it happens to sit
 *   in one particular file.
 * - `NEXT_PUBLIC_SUPABASE_URL` is what the app-target collision check compares
 *   against; missing it would weaken that check rather than the credentials.
 */
const dangerDetectorKeys = ["OPENAI_API_KEY", "NEXT_PUBLIC_SUPABASE_URL"] as const;

export type LiveDbEnvironmentSource = Record<string, string | undefined>;

export type StagingEnvFileResult =
  | { status: "LOADED"; source: LiveDbEnvironmentSource }
  | { status: "BLOCKED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * Minimal `KEY=VALUE` reader. Deliberately not a general dotenv implementation:
 * no interpolation, no command substitution, no `export` handling beyond a
 * leading keyword. A validation credential file should be literal, and a parser
 * that can expand `$OTHER` is a parser that can pull `.env.local` values in
 * through the back door.
 */
export function parseEnvFile(contents: string): LiveDbEnvironmentSource {
  const parsed: LiveDbEnvironmentSource = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const withoutExport = line.startsWith("export ") ? line.slice("export ".length).trim() : line;
    const separator = withoutExport.indexOf("=");
    if (separator <= 0) continue;
    const key = withoutExport.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = withoutExport.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

export type ReadEnvFile = (path: string) => string;

const defaultReader: ReadEnvFile = (path) => readFileSync(path, "utf8");

/**
 * Builds the environment projection for a staging run from the staging file
 * only, plus the two danger detectors.
 *
 * The returned object is a bounded projection — the keys this harness declares
 * and nothing else — so an unrelated variable in either source cannot reach the
 * guard or the clients. No value is ever logged or returned to a caller outside
 * the composition path.
 */
export function loadStagingEnvironmentSource(
  options: {
    path?: string;
    processEnv?: LiveDbEnvironmentSource;
    readFile?: ReadEnvFile;
  } = {},
): StagingEnvFileResult {
  const path = options.path ?? LIVE_DB_STAGING_ENV_PATH;
  const processEnv = options.processEnv ?? process.env;
  const read = options.readFile ?? defaultReader;

  let contents: string;
  try {
    contents = read(path);
  } catch {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_STAGING_ENV_FILE_UNREADABLE" };
  }

  const fileValues = parseEnvFile(contents);
  const source: LiveDbEnvironmentSource = {};
  for (const key of fileOnlyKeys) {
    if (fileValues[key] !== undefined) source[key] = fileValues[key];
  }
  for (const key of dangerDetectorKeys) {
    const value = fileValues[key] ?? processEnv[key];
    if (value !== undefined) source[key] = value;
  }
  return { status: "LOADED", source };
}
