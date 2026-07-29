import { describe, expect, it } from "vitest";
import { loadLiveDbEnvironment } from "./environment-loader";
import {
  maskHostedProjectRef,
  targetIdentityFromUrl,
  validateLiveDbEnvironment,
} from "./environment-guard";

const localEnvironment = {
  targetEnvironment: "local",
  liveDbSupabaseUrl: "http://127.0.0.1:54321",
  liveDbServiceRoleKey: "test-service-role-placeholder",
  openAiApiKeyPresent: false,
  mode: "dry" as const,
};

describe("LIVE-DB environment guard", () => {
  it("allows an explicit local dry target without exposing credentials", () => {
    const result = validateLiveDbEnvironment(localEnvironment);
    expect(result).toEqual({ ok: true, targetEnvironment: "local", targetIdentityMasked: "local:127.0.0.1:54***" });
    expect(JSON.stringify(result)).not.toContain("test-service-role-placeholder");
  });

  it("blocks production targets and production-equivalent application targets", () => {
    expect(validateLiveDbEnvironment({ ...localEnvironment, targetEnvironment: "production" })).toMatchObject({ safeErrorCode: "LIVE_DB_PRODUCTION_FORBIDDEN" });
    expect(validateLiveDbEnvironment({
      ...localEnvironment,
      targetEnvironment: "staging",
      liveDbSupabaseUrl: "https://stagingabc.supabase.co",
      applicationSupabaseUrl: "https://stagingabc.supabase.co",
      knownProductionProjectRef: "productionabc",
    })).toMatchObject({ safeErrorCode: "LIVE_DB_APP_TARGET_MATCH" });
  });

  it("blocks a staging target when its identity is unknown or matches production", () => {
    expect(validateLiveDbEnvironment({
      ...localEnvironment,
      targetEnvironment: "staging",
      liveDbSupabaseUrl: "https://stagingabc.supabase.co",
    })).toMatchObject({ safeErrorCode: "LIVE_DB_PRODUCTION_IDENTITY_UNKNOWN" });
    expect(validateLiveDbEnvironment({
      ...localEnvironment,
      targetEnvironment: "staging",
      liveDbSupabaseUrl: "https://productionabc.supabase.co",
      knownProductionProjectRef: "productionabc",
    })).toMatchObject({ safeErrorCode: "LIVE_DB_PRODUCTION_TARGET_MATCH" });
  });

  it("fails closed when an OpenAI key is present or connection execution is unconfirmed", () => {
    expect(validateLiveDbEnvironment({ ...localEnvironment, openAiApiKeyPresent: true })).toMatchObject({ safeErrorCode: "LIVE_DB_OPENAI_KEY_PRESENT" });
    expect(validateLiveDbEnvironment({ ...localEnvironment, mode: "connection" })).toMatchObject({ safeErrorCode: "LIVE_DB_EXECUTION_CONFIRMATION_REQUIRED" });
  });

  it("loads only the documented LIVE_DB environment names", () => {
    const loaded = loadLiveDbEnvironment("dry", {
      LIVE_DB_TARGET_ENV: "local",
      LIVE_DB_SUPABASE_URL: "http://localhost:54321",
      LIVE_DB_SUPABASE_SERVICE_ROLE_KEY: "test-service-role-placeholder",
      OPENAI_API_KEY: "",
    });
    expect(loaded.targetEnvironment).toBe("local");
    expect(loaded.liveDbSupabaseUrl).toBe("http://localhost:54321");
    expect(loaded.openAiApiKeyPresent).toBe(false);
  });

  it("masks only safe target identities", () => {
    expect(maskHostedProjectRef("testproject")).toBe("test…ject");
    expect(targetIdentityFromUrl("not-a-url")).toBeNull();
  });
});
