import { describe, expect, it } from "vitest";
import { hasSecretShapedValue } from "./evidence-summary";
import { createLiveDbFakeProvider } from "./fake-provider";
import {
  runRepositoryDirectDryHarness,
  type ExplicitDryClientInjection,
} from "./repository-direct-harness";
import type { LiveDbClientIdentityCandidate } from "./types";
import { liveDbValidationCases } from "./validation-cases";

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

function trackedClients(identity: LiveDbClientIdentityCandidate = clients.identity): {
  clients: ExplicitDryClientInjection;
  calls: () => { repositoryCalls: number; networkCalls: number };
} {
  let repositoryCalls = 0;
  let networkCalls = 0;
  return {
    clients: {
      approvalClient: { call() { repositoryCalls += 1; networkCalls += 1; } },
      evidenceClient: { call() { repositoryCalls += 1; networkCalls += 1; } },
      identity,
    },
    calls: () => ({ repositoryCalls, networkCalls }),
  };
}

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
    expect(result.evidence.executedCaseIds).toEqual([
      "environment-local-target",
      "provider-fake-identity",
      "client-explicit-injection",
      "registry-integrity",
      "evidence-safety",
    ]);
    expect(result.evidence.failedCaseIds).toEqual([]);
    expect(result.evidence.skippedCaseIds).toContain("consume-exactly-one-winner");
    expect(result.evidence.skippedCaseIds).toContain("product-runtime-fake-provider");
    expect(result.evidence.notApplicableCaseIds).toContain("environment-production-block");
    expect(result.evidence.executedCaseIds).not.toContain("environment-production-block");
    expect(result.evidence.caseResults).toHaveLength(liveDbValidationCases.length);
    expect(new Set(result.evidence.caseResults.map((item) => item.caseId)).size).toBe(liveDbValidationCases.length);
    expect(new Set([
      ...result.evidence.executedCaseIds,
      ...result.evidence.failedCaseIds,
      ...result.evidence.skippedCaseIds,
      ...result.evidence.notApplicableCaseIds,
    ]).size).toBe(liveDbValidationCases.length);
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

  it("normalizes invalid registry input to the dedicated safe error without exposing registry data", () => {
    const invalidRegistry = [
      ...liveDbValidationCases,
      { ...liveDbValidationCases[0] },
    ];
    const result = runRepositoryDirectDryHarness({
      environment: validEnvironment,
      provider: createLiveDbFakeProvider(),
      clients,
      validationCases: invalidRegistry,
    });
    expect(result).toMatchObject({ status: "BLOCKED", safeErrorCode: "LIVE_DB_VALIDATION_REGISTRY_INVALID" });
    expect(result.evidence.failedCaseIds).toEqual(["registry-integrity"]);
    expect(hasSecretShapedValue(result.evidence)).toBe(false);
  });

  it.each([
    ["invalid client mode", { ...clients.identity, supabaseClientMode: "APP_CLIENT" }, "LIVE_DB_CLIENT_MODE_INVALID"],
    ["app factory flag", { ...clients.identity, appClientFactoryUsed: true }, "LIVE_DB_APP_CLIENT_FACTORY_USED"],
    ["admin factory flag", { ...clients.identity, adminClientFactoryUsed: true }, "LIVE_DB_ADMIN_CLIENT_FACTORY_USED"],
    ["server factory flag", { ...clients.identity, serverClientFactoryUsed: true }, "LIVE_DB_SERVER_CLIENT_FACTORY_USED"],
    ["default fallback possible", { ...clients.identity, repositoryDefaultClientFallbackUsed: true }, "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED"],
  ] as const)("fails closed before calls for %s", (_label, identity, expectedCode) => {
    const provider = createLiveDbFakeProvider();
    const tracked = trackedClients(identity);
    const result = runRepositoryDirectDryHarness({ environment: validEnvironment, provider, clients: tracked.clients });
    expect(result).toMatchObject({ status: "BLOCKED", safeErrorCode: expectedCode });
    expect(result.evidence).toMatchObject({ verdict: "FAIL", externalProviderCallCount: 0 });
    expect(result.evidence.failedCaseIds).toEqual(["client-explicit-injection"]);
    expect(tracked.calls()).toEqual({ repositoryCalls: 0, networkCalls: 0 });
    expect(provider.invocationCount).toBe(0);
    expect(hasSecretShapedValue(result.evidence)).toBe(false);
  });

  it("fails closed before calls when the approval client is missing", () => {
    const provider = createLiveDbFakeProvider();
    const tracked = trackedClients();
    const result = runRepositoryDirectDryHarness({
      environment: validEnvironment,
      provider,
      clients: { evidenceClient: tracked.clients.evidenceClient, identity: tracked.clients.identity },
    });
    expect(result).toMatchObject({ status: "BLOCKED", safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED" });
    expect(result.evidence.failedCaseIds).toEqual(["client-explicit-injection"]);
    expect(tracked.calls()).toEqual({ repositoryCalls: 0, networkCalls: 0 });
    expect(provider.invocationCount).toBe(0);
  });

  it("fails closed before calls when the evidence client is missing", () => {
    const provider = createLiveDbFakeProvider();
    const tracked = trackedClients();
    const result = runRepositoryDirectDryHarness({
      environment: validEnvironment,
      provider,
      clients: { approvalClient: tracked.clients.approvalClient, identity: tracked.clients.identity },
    });
    expect(result).toMatchObject({ status: "BLOCKED", safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED" });
    expect(result.evidence.failedCaseIds).toEqual(["client-explicit-injection"]);
    expect(tracked.calls()).toEqual({ repositoryCalls: 0, networkCalls: 0 });
    expect(provider.invocationCount).toBe(0);
  });

  it.each([
    ["production target", { ...validEnvironment, targetEnvironment: "production" }, "LIVE_DB_PRODUCTION_FORBIDDEN"],
    ["invalid target", { ...validEnvironment, targetEnvironment: "invalid" }, "LIVE_DB_TARGET_INVALID"],
    ["OpenAI environment", { ...validEnvironment, openAiApiKeyPresent: true }, "LIVE_DB_OPENAI_KEY_PRESENT"],
    ["application target match", { ...validEnvironment, applicationSupabaseUrl: "http://localhost:54321" }, "LIVE_DB_APP_TARGET_MATCH"],
  ] as const)("uses a neutral failure target for %s", (_label, environment, expectedCode) => {
    const result = runRepositoryDirectDryHarness({ environment, provider: createLiveDbFakeProvider(), clients });
    expect(result).toMatchObject({ status: "BLOCKED", safeErrorCode: expectedCode });
    expect(result.evidence.targetEnvironment).toBe("unknown");
    expect(result.evidence.targetProjectRefMasked).toBe("unavailable");
  });
});
