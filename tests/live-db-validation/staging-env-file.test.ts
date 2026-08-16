import { describe, expect, it, vi } from "vitest";

import {
  LIVE_DB_STAGING_ENV_PATH,
  loadStagingEnvironmentSource,
  parseEnvFile,
} from "./staging-env-file";

const stagingFile = [
  "# disposable staging project",
  "LIVE_DB_TARGET_ENV=staging",
  "LIVE_DB_SUPABASE_URL=https://stagingabc.supabase.co",
  'LIVE_DB_SUPABASE_SERVICE_ROLE_KEY="service-role-placeholder"',
  "LIVE_DB_SUPABASE_ANON_KEY='anon-placeholder'",
  "LIVE_DB_DATABASE_URL=postgresql://postgres:pw@db.stagingabc.supabase.co:5432/postgres",
  "LIVE_DB_EXECUTION_CONFIRMED=true",
  "LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF=productionxyz",
  "NEXT_PUBLIC_SUPABASE_URL=https://appproject.supabase.co",
  "",
].join("\n");

const load = (contents: string, processEnv: Record<string, string | undefined> = {}) =>
  loadStagingEnvironmentSource({
    path: "/fake/.env.live-db.staging",
    processEnv,
    readFile: () => contents,
  });

describe("parseEnvFile", () => {
  it("reads plain, quoted and exported assignments", () => {
    const parsed = parseEnvFile(
      ['A=1', 'B="two"', "C='three'", "export D=4", "  E = 5  "].join("\n"),
    );
    expect(parsed).toMatchObject({ A: "1", B: "two", C: "three", D: "4", E: "5" });
  });

  it("ignores comments, blanks and malformed lines", () => {
    const parsed = parseEnvFile(["# comment", "", "novalue", "=novalue", "1BAD=x"].join("\n"));
    expect(Object.keys(parsed)).toEqual([]);
  });

  it("does not interpolate, so one variable cannot pull in another", () => {
    // A parser that expanded $HOME would also expand a value from .env.local.
    const parsed = parseEnvFile("LIVE_DB_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL");
    expect(parsed.LIVE_DB_SUPABASE_URL).toBe("$NEXT_PUBLIC_SUPABASE_URL");
  });
});

describe("loadStagingEnvironmentSource", () => {
  it("defaults to the staging file path", () => {
    const readFile = vi.fn(() => stagingFile);
    loadStagingEnvironmentSource({ processEnv: {}, readFile });
    expect(readFile).toHaveBeenCalledWith(LIVE_DB_STAGING_ENV_PATH);
  });

  it("fails closed when the file cannot be read", () => {
    expect(
      loadStagingEnvironmentSource({
        path: "/missing",
        processEnv: {},
        readFile: () => {
          throw new Error("ENOENT");
        },
      }),
    ).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_STAGING_ENV_FILE_UNREADABLE" });
  });

  it("takes LIVE_DB credentials from the file only", () => {
    const result = load(stagingFile);
    expect(result.status).toBe("LOADED");
    expect(result.status === "LOADED" && result.source).toMatchObject({
      LIVE_DB_TARGET_ENV: "staging",
      LIVE_DB_SUPABASE_URL: "https://stagingabc.supabase.co",
      LIVE_DB_EXECUTION_CONFIRMED: "true",
    });
  });

  it("never inherits a LIVE_DB value from the process, which is where .env.local lands", () => {
    const result = load("LIVE_DB_TARGET_ENV=staging", {
      LIVE_DB_SUPABASE_URL: "https://appproject.supabase.co",
      LIVE_DB_SUPABASE_SERVICE_ROLE_KEY: "app-service-role",
      LIVE_DB_DATABASE_URL: "postgresql://postgres:pw@db.appproject.supabase.co:5432/postgres",
      LIVE_DB_EXECUTION_CONFIRMED: "true",
    });
    expect(result.status).toBe("LOADED");
    const source = result.status === "LOADED" ? result.source : {};
    expect(source.LIVE_DB_SUPABASE_URL).toBeUndefined();
    expect(source.LIVE_DB_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(source.LIVE_DB_DATABASE_URL).toBeUndefined();
    expect(source.LIVE_DB_EXECUTION_CONFIRMED).toBeUndefined();
  });

  it("detects OPENAI_API_KEY from the process even when the file omits it", () => {
    const result = load(stagingFile, { OPENAI_API_KEY: "sk-should-stop-the-run" });
    expect(result.status === "LOADED" && Boolean(result.source.OPENAI_API_KEY)).toBe(true);
  });

  it("prefers the file's app URL but falls back to the process one", () => {
    expect(
      load(stagingFile, { NEXT_PUBLIC_SUPABASE_URL: "https://other.supabase.co" }).status ===
        "LOADED",
    ).toBe(true);
    const fromFile = load(stagingFile, { NEXT_PUBLIC_SUPABASE_URL: "https://other.supabase.co" });
    expect(fromFile.status === "LOADED" && fromFile.source.NEXT_PUBLIC_SUPABASE_URL).toBe(
      "https://appproject.supabase.co",
    );

    const fromProcess = load("LIVE_DB_TARGET_ENV=staging", {
      NEXT_PUBLIC_SUPABASE_URL: "https://appproject.supabase.co",
    });
    expect(fromProcess.status === "LOADED" && fromProcess.source.NEXT_PUBLIC_SUPABASE_URL).toBe(
      "https://appproject.supabase.co",
    );
  });

  it("returns a bounded projection rather than the whole file", () => {
    const result = load([stagingFile, "UNRELATED_SECRET=leak-me"].join("\n"));
    expect(result.status === "LOADED" && "UNRELATED_SECRET" in result.source).toBe(false);
  });
});
