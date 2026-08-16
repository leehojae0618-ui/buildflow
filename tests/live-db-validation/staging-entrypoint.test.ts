import { describe, expect, it, vi } from "vitest";

import { validateRuntimeApprovalBinding } from "../../src/features/runtime-approval/validator";
import { assertApprovalFixtures } from "./approval-validation-runner";
import { buildStagingBindings, runStagingValidationEntrypoint } from "./staging-entrypoint";
import { hasStagingUnsafeValue } from "./staging-evidence";
import { LIVE_DB_TEST_PREFIX } from "./types";

const identity = {
  projectId: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
};

describe("buildStagingBindings", () => {
  it("produces fixtures the lifecycle accepts", () => {
    const { binding, mismatchedBinding } = buildStagingBindings(identity, "run-1");
    expect(validateRuntimeApprovalBinding(binding)).toBe(true);
    expect(validateRuntimeApprovalBinding(mismatchedBinding)).toBe(true);
    expect(assertApprovalFixtures({ binding, mismatchedBinding })).toBeUndefined();
  });

  it("prefixes every identifier so ST-D cleanup can find the rows", () => {
    const { binding } = buildStagingBindings(identity, "run-1");
    expect(binding.runtimeExecutionRequestId.startsWith(LIVE_DB_TEST_PREFIX)).toBe(true);
    expect(binding.runtimePlanId.startsWith(LIVE_DB_TEST_PREFIX)).toBe(true);
  });

  it("gives two runs different binding checksums, which are UNIQUE in the database", () => {
    const first = buildStagingBindings(identity, "run-1");
    const second = buildStagingBindings(identity, "run-2");
    expect(first.binding.bindingChecksum).not.toBe(second.binding.bindingChecksum);
    expect(first.binding.bindingChecksum).not.toBe(first.mismatchedBinding.bindingChecksum);
  });

  it("carries the owner identity the create RPC checks against projects", () => {
    const { binding } = buildStagingBindings(identity, "run-1");
    expect(binding.projectId).toBe(identity.projectId);
    expect(binding.userId).toBe(identity.userId);
  });

  it("leaks nothing", () => {
    expect(hasStagingUnsafeValue(buildStagingBindings(identity, "run-1"))).toBe(false);
  });
});

describe("runStagingValidationEntrypoint preconditions", () => {
  const source = {
    LIVE_DB_TARGET_ENV: "staging",
    LIVE_DB_SUPABASE_URL: "https://stagingabc.supabase.co",
    LIVE_DB_SUPABASE_ANON_KEY: "anon-placeholder",
    LIVE_DB_SUPABASE_SERVICE_ROLE_KEY: "service-role-placeholder",
    LIVE_DB_DATABASE_URL: "postgresql://postgres:pw@db.stagingabc.supabase.co:5432/postgres",
    LIVE_DB_EXECUTION_CONFIRMED: "true",
    LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF: "productionxyz",
    LIVE_DB_OWNER_USER_ID: identity.userId,
    LIVE_DB_OWNER_PROJECT_ID: identity.projectId,
    LIVE_DB_OWNER_EMAIL: "owner@example.test",
    LIVE_DB_OWNER_PASSWORD: "owner-pw",
    LIVE_DB_OTHER_EMAIL: "other@example.test",
    LIVE_DB_OTHER_PASSWORD: "other-pw",
  };

  it("blocks before building anything when the anon key is absent", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await runStagingValidationEntrypoint({
      source: { ...source, LIVE_DB_SUPABASE_ANON_KEY: undefined },
    });
    expect(result).toMatchObject({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("blocks when the owner identity the create RPC needs is missing", async () => {
    for (const key of ["LIVE_DB_OWNER_USER_ID", "LIVE_DB_OWNER_PROJECT_ID"]) {
      const result = await runStagingValidationEntrypoint({
        source: { ...source, [key]: undefined },
      });
      expect(result).toMatchObject({
        status: "BLOCKED",
        safeErrorCode: "LIVE_DB_OWNER_IDENTITY_MISSING",
      });
    }
  });

  it("emits nothing unsafe when it blocks", async () => {
    const result = await runStagingValidationEntrypoint({
      source: { ...source, LIVE_DB_OWNER_USER_ID: undefined },
    });
    expect(hasStagingUnsafeValue(result, { forbiddenProjectRefs: ["stagingabc"] })).toBe(false);
  });
});
