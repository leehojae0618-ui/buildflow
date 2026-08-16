import { describe, expect, it } from "vitest";

import { loadLiveDbEnvironment } from "./environment-loader";
import {
  LiveDbSecretCarrier,
  projectRefFromDatabaseUrl,
  resolveStagingMigrationTarget,
} from "./staging-migration-target";

const stagingRef = "stagingabc";
const productionRef = "productionxyz";

const validStagingSource = {
  LIVE_DB_TARGET_ENV: "staging",
  LIVE_DB_SUPABASE_URL: `https://${stagingRef}.supabase.co`,
  LIVE_DB_SUPABASE_SERVICE_ROLE_KEY: "test-service-role-placeholder",
  LIVE_DB_DATABASE_URL: `postgresql://postgres:pw-placeholder@db.${stagingRef}.supabase.co:5432/postgres`,
  LIVE_DB_EXECUTION_CONFIRMED: "true",
  LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF: productionRef,
};

const resolve = (overrides: Record<string, string | undefined> = {}) =>
  resolveStagingMigrationTarget(
    loadLiveDbEnvironment("connection", { ...validStagingSource, ...overrides }),
  );

describe("projectRefFromDatabaseUrl", () => {
  it("reads the ref from a direct connection host", () => {
    expect(
      projectRefFromDatabaseUrl(`postgresql://postgres:pw@db.${stagingRef}.supabase.co:5432/postgres`),
    ).toBe(stagingRef);
  });

  it("reads the ref from the pooler username", () => {
    expect(
      projectRefFromDatabaseUrl(
        `postgresql://postgres.${stagingRef}:pw@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`,
      ),
    ).toBe(stagingRef);
  });

  it("returns null for shapes it cannot attribute to a project", () => {
    expect(projectRefFromDatabaseUrl("postgresql://postgres:pw@localhost:5432/postgres")).toBeNull();
    expect(projectRefFromDatabaseUrl(`https://${stagingRef}.supabase.co`)).toBeNull();
    expect(projectRefFromDatabaseUrl("not-a-url")).toBeNull();
    expect(projectRefFromDatabaseUrl(`postgresql://postgres:pw@db..supabase.co:5432/postgres`)).toBeNull();
  });
});

describe("LiveDbSecretCarrier", () => {
  it("redacts under serialization but reveals on explicit request", () => {
    const carrier = new LiveDbSecretCarrier("postgresql://postgres:pw@db.x.supabase.co:5432/postgres");
    expect(JSON.stringify({ carrier })).toBe('{"carrier":"[redacted]"}');
    expect(`${carrier}`).toBe("[redacted]");
    expect(carrier.reveal()).toContain("postgresql://");
  });
});

describe("ST-B staging migration target (dual binding)", () => {
  it("resolves only when both bindings agree on the same project ref", () => {
    const result = resolve();
    expect(result.status).toBe("RESOLVED");
    if (result.status !== "RESOLVED") return;
    expect(result.target.targetEnvironment).toBe("staging");
    expect(result.target.targetProjectRefMasked).toBe("stag…gabc");
    expect(result.target.databaseUrl.reveal()).toBe(validStagingSource.LIVE_DB_DATABASE_URL);
  });

  it("blocks when the database URL points at a different project than the approved URL", () => {
    expect(
      resolve({
        LIVE_DB_DATABASE_URL: `postgresql://postgres:pw@db.otherproject.supabase.co:5432/postgres`,
      }),
    ).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_DB_URL_TARGET_MISMATCH" });
  });

  it("blocks when the database URL resolves to the known production ref", () => {
    expect(
      resolve({
        LIVE_DB_SUPABASE_URL: `https://${productionRef}.supabase.co`,
        LIVE_DB_DATABASE_URL: `postgresql://postgres:pw@db.${productionRef}.supabase.co:5432/postgres`,
      }),
    ).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_PRODUCTION_TARGET_MATCH" });
  });

  it("blocks when the known production ref is unknown", () => {
    expect(resolve({ LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF: undefined })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_PRODUCTION_IDENTITY_UNKNOWN",
    });
  });

  it("blocks when the staging target equals the application target", () => {
    expect(resolve({ NEXT_PUBLIC_SUPABASE_URL: `https://${stagingRef}.supabase.co` })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APP_TARGET_MATCH",
    });
  });

  it("blocks when execution is not explicitly confirmed", () => {
    expect(resolve({ LIVE_DB_EXECUTION_CONFIRMED: undefined })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_EXECUTION_CONFIRMATION_REQUIRED",
    });
    expect(resolve({ LIVE_DB_EXECUTION_CONFIRMED: "TRUE" })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_EXECUTION_CONFIRMATION_REQUIRED",
    });
  });

  it("blocks when OPENAI_API_KEY is present", () => {
    expect(resolve({ OPENAI_API_KEY: "sk-should-never-be-read" })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_OPENAI_KEY_PRESENT",
    });
  });

  it("blocks a production target outright", () => {
    expect(resolve({ LIVE_DB_TARGET_ENV: "production" })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_PRODUCTION_FORBIDDEN",
    });
  });

  it("blocks a local target, which has no migration boundary here", () => {
    expect(
      resolve({
        LIVE_DB_TARGET_ENV: "local",
        LIVE_DB_SUPABASE_URL: "http://127.0.0.1:54321",
      }),
    ).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_STAGING_TARGET_REQUIRED" });
  });

  it("blocks when the database URL is missing or unattributable", () => {
    expect(resolve({ LIVE_DB_DATABASE_URL: undefined })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_DB_URL_MISSING",
    });
    expect(resolve({ LIVE_DB_DATABASE_URL: "postgresql://postgres:pw@localhost:5432/postgres" })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_DB_URL_IDENTITY_INVALID",
    });
  });

  it("ignores linked project state entirely: the same env resolves the same target", () => {
    // The linked project under supabase/.temp/ is real in this repository, yet
    // the resolved target depends only on the injected environment values.
    const first = resolve();
    const second = resolve();
    expect(first).toMatchObject({ status: "RESOLVED" });
    expect(second).toMatchObject({ status: "RESOLVED" });
    if (first.status !== "RESOLVED" || second.status !== "RESOLVED") return;
    expect(first.target.targetProjectRefMasked).toBe(second.target.targetProjectRefMasked);
  });

  it("never emits the database URL, key, or full ref in a blocked result", () => {
    const blockedResults = [
      resolve({ LIVE_DB_DATABASE_URL: `postgresql://postgres:pw@db.otherproject.supabase.co:5432/postgres` }),
      resolve({ LIVE_DB_EXECUTION_CONFIRMED: undefined }),
      resolve({ LIVE_DB_TARGET_ENV: "production" }),
    ];
    for (const result of blockedResults) {
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("postgresql://");
      expect(serialized).not.toContain("pw-placeholder");
      expect(serialized).not.toContain("test-service-role-placeholder");
      expect(serialized).not.toContain(stagingRef);
    }
  });
});
