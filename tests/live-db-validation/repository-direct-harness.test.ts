import { describe, expect, it } from "vitest";
import { hasSecretShapedValue } from "./evidence-summary";
import { createLiveDbFakeProvider } from "./fake-provider";
import { runRepositoryDirectDryHarness } from "./repository-direct-harness";

const validEnvironment = {
  targetEnvironment: "local",
  liveDbSupabaseUrl: "http://localhost:54321",
  liveDbServiceRoleKey: "test-service-role-placeholder",
  openAiApiKeyPresent: false,
  mode: "dry" as const,
};

const clients = {
  approvalClient: {},
  evidenceClient: {},
  identity: {
    supabaseClientMode: "LIVE_DB_EXPLICIT_INJECTION" as const,
    appClientFactoryUsed: false as const,
    adminClientFactoryUsed: false as const,
    serverClientFactoryUsed: false as const,
  },
};

describe("repository-direct dry harness", () => {
  it("performs only dry checks and produces safe evidence plus a no-op cleanup manifest", () => {
    const result = runRepositoryDirectDryHarness({
      environment: validEnvironment,
      provider: createLiveDbFakeProvider(),
      clients,
      validationRunId: "live-db-validation-001-run",
    });
    expect(result.status).toBe("PASSED");
    expect(result.evidence).toMatchObject({
      providerMode: "FAKE",
      externalProviderCallCount: 0,
      executionMode: "DRY",
      migrationVersion: "NOT_APPLICABLE_DRY_MODE",
      verdict: "PASS",
    });
    expect(result.evidence.executedCaseIds).toEqual(["environment-local-target", "environment-production-block"]);
    expect(result.evidence.skippedCaseIds).toContain("consume-exactly-one-winner");
    expect(result.cleanupManifest).toMatchObject({ cleanupExecuted: false, cleanupStatus: "NOT_EXECUTED_DRY_MODE" });
    expect(hasSecretShapedValue(result.evidence)).toBe(false);
  });

  it("fails before any execution for a missing fake provider, missing explicit clients, or OpenAI-key guard", () => {
    expect(runRepositoryDirectDryHarness({ environment: validEnvironment, provider: undefined, clients })).toMatchObject({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_PROVIDER_NOT_INJECTED",
    });
    expect(runRepositoryDirectDryHarness({ environment: validEnvironment, provider: createLiveDbFakeProvider(), clients: undefined })).toMatchObject({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED",
    });
    expect(runRepositoryDirectDryHarness({
      environment: { ...validEnvironment, openAiApiKeyPresent: true },
      provider: createLiveDbFakeProvider(),
      clients,
    })).toMatchObject({ status: "BLOCKED", safeErrorCode: "LIVE_DB_OPENAI_KEY_PRESENT" });
  });

  it("does not execute database-classified cases in dry mode", () => {
    const result = runRepositoryDirectDryHarness({ environment: validEnvironment, provider: createLiveDbFakeProvider(), clients });
    expect(result.evidence.executedCaseIds).not.toContain("rls-owner-read");
    expect(result.evidence.executedCaseIds).not.toContain("product-runtime-fake-provider");
  });
});
