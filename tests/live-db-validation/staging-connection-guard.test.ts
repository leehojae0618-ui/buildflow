import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../src/features/runtime-approval/runtime-approval-supabase", () => ({
  SupabaseRuntimeApprovalRepository: class SupabaseRuntimeApprovalRepository {
    constructor(readonly client: unknown) {}
  },
}));
vi.mock("../../src/features/agents/runtime-evidence-supabase", () => ({
  SupabaseRuntimeEvidenceRepository: class SupabaseRuntimeEvidenceRepository {
    constructor(readonly client: unknown) {}
  },
}));

import { hasSecretShapedValue } from "./evidence-summary";
import { evaluateLiveDbStagingConnection } from "./staging-connection-guard";

const fakeClient = {} as never;

const validStagingSource = {
  LIVE_DB_TARGET_ENV: "staging",
  LIVE_DB_SUPABASE_URL: "https://stagingabc.supabase.co",
  LIVE_DB_SUPABASE_SERVICE_ROLE_KEY: "test-service-role-placeholder",
  LIVE_DB_EXECUTION_CONFIRMED: "true",
  LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF: "productionxyz",
};

describe("LIVE-DB staging connection guard", () => {
  it("never constructs a client when execution is not explicitly confirmed", () => {
    const factory = vi.fn(() => fakeClient);
    const result = evaluateLiveDbStagingConnection(
      { ...validStagingSource, LIVE_DB_EXECUTION_CONFIRMED: undefined },
      factory,
    );
    expect(result).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_EXECUTION_CONFIRMATION_REQUIRED" });
    expect(factory).not.toHaveBeenCalled();
  });

  it("rejects a production target before any client construction", () => {
    const factory = vi.fn(() => fakeClient);
    const result = evaluateLiveDbStagingConnection(
      { ...validStagingSource, LIVE_DB_TARGET_ENV: "production" },
      factory,
    );
    expect(result).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_PRODUCTION_FORBIDDEN" });
    expect(factory).not.toHaveBeenCalled();
  });

  it("refuses a non-staging target even when the guard otherwise passes", () => {
    const factory = vi.fn(() => fakeClient);
    const result = evaluateLiveDbStagingConnection(
      {
        LIVE_DB_TARGET_ENV: "local",
        LIVE_DB_SUPABASE_URL: "http://127.0.0.1:54321",
        LIVE_DB_SUPABASE_SERVICE_ROLE_KEY: "test-service-role-placeholder",
        LIVE_DB_EXECUTION_CONFIRMED: "true",
      },
      factory,
    );
    expect(result).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_STAGING_TARGET_REQUIRED" });
    expect(factory).not.toHaveBeenCalled();
  });

  it("blocks a staging target whose production reference is unknown or matches production", () => {
    const factory = vi.fn(() => fakeClient);
    expect(
      evaluateLiveDbStagingConnection(
        { ...validStagingSource, LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF: undefined },
        factory,
      ),
    ).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_PRODUCTION_IDENTITY_UNKNOWN" });
    expect(
      evaluateLiveDbStagingConnection(
        {
          ...validStagingSource,
          LIVE_DB_SUPABASE_URL: "https://productionxyz.supabase.co",
        },
        factory,
      ),
    ).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_PRODUCTION_TARGET_MATCH" });
    expect(factory).not.toHaveBeenCalled();
  });

  it("blocks when the staging URL matches the application's Supabase URL", () => {
    const factory = vi.fn(() => fakeClient);
    const result = evaluateLiveDbStagingConnection(
      { ...validStagingSource, NEXT_PUBLIC_SUPABASE_URL: "https://stagingabc.supabase.co" },
      factory,
    );
    expect(result).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_APP_TARGET_MATCH" });
    expect(factory).not.toHaveBeenCalled();
  });

  it("fails closed before a connection when OPENAI_API_KEY is present", () => {
    const factory = vi.fn(() => fakeClient);
    const result = evaluateLiveDbStagingConnection(
      { ...validStagingSource, OPENAI_API_KEY: "sk-should-never-be-read" },
      factory,
    );
    expect(result).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_OPENAI_KEY_PRESENT" });
    expect(factory).not.toHaveBeenCalled();
    expect(hasSecretShapedValue(result)).toBe(false);
  });

  it("constructs a client only once a fully confirmed staging target passes every guard, with zero network calls", () => {
    const factory = vi.fn(() => fakeClient);
    const result = evaluateLiveDbStagingConnection(validStagingSource, factory);
    expect(result).toMatchObject({
      status: "READY",
      targetEnvironment: "staging",
      targetIdentityMasked: "stag…gabc",
      clientIdentity: {
        supabaseClientMode: "LIVE_DB_EXPLICIT_INJECTION",
        appClientFactoryUsed: false,
        adminClientFactoryUsed: false,
        serverClientFactoryUsed: false,
      },
    });
    expect(factory).toHaveBeenCalledOnce();
    expect(factory).toHaveBeenCalledWith(
      "https://stagingabc.supabase.co",
      "test-service-role-placeholder",
    );
    expect(hasSecretShapedValue(result)).toBe(false);
    expect(JSON.stringify(result)).not.toContain("test-service-role-placeholder");
  });
});
