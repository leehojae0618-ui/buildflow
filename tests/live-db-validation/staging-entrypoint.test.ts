import { beforeEach, describe, expect, it, vi } from "vitest";

/** Records every authentication attempt so ordering can be asserted. */
const auth = vi.hoisted(() => ({ signIns: [] as string[] }));

/**
 * The entrypoint builds the real Supabase CLI executor, which spawns a process.
 * Stubbed here so the ordering assertions below cannot cause `npm test` to run
 * `supabase db push` on a machine that has the CLI installed. The stub fails, so
 * a run that gets this far stops immediately at the migration.
 */
vi.mock("./supabase-migration-executor", () => ({
  createSupabaseMigrationExecutor: () => async () => ({
    status: "FAILED",
    safeErrorCode: "LIVE_DB_MIGRATION_EXECUTION_FAILED",
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: async () => ({ error: null, count: 0 }) }),
      update: () => ({ eq: async () => ({ error: null, count: 0 }) }),
    }),
    rpc: async () => ({ error: null, data: null }),
    auth: {
      signInWithPassword: async ({ email }: { email: string }) => {
        auth.signIns.push(email);
        return { error: null };
      },
    },
  }),
}));

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

  beforeEach(() => {
    auth.signIns.length = 0;
  });

  /**
   * The ordering guarantee this gate turns on: signing a user in is a real
   * request to whatever project the env file names, so it must not happen until
   * that project has been proven to be the approved staging target.
   */
  it.each([
    [
      "the URL points at the known production project",
      { LIVE_DB_SUPABASE_URL: "https://productionxyz.supabase.co" },
      "LIVE_DB_PRODUCTION_TARGET_MATCH",
    ],
    [
      "execution was never confirmed",
      { LIVE_DB_EXECUTION_CONFIRMED: undefined },
      "LIVE_DB_EXECUTION_CONFIRMATION_REQUIRED",
    ],
    [
      "the target collides with the application project",
      { NEXT_PUBLIC_SUPABASE_URL: "https://stagingabc.supabase.co" },
      "LIVE_DB_APP_TARGET_MATCH",
    ],
    [
      "an OpenAI key is reachable",
      { OPENAI_API_KEY: "sk-should-stop-the-run" },
      "LIVE_DB_OPENAI_KEY_PRESENT",
    ],
    [
      "the database URL names a different project than the Supabase URL",
      {
        LIVE_DB_DATABASE_URL:
          "postgresql://postgres:pw@db.someotherproject.supabase.co:5432/postgres",
      },
      "LIVE_DB_DB_URL_TARGET_MISMATCH",
    ],
    [
      "the production ref is unknown, so the guard cannot clear the target",
      { LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF: undefined },
      "LIVE_DB_PRODUCTION_IDENTITY_UNKNOWN",
    ],
  ])("signs nobody in when %s", async (_label, overrides, code) => {
    const result = await runStagingValidationEntrypoint({ source: { ...source, ...overrides } });

    expect(result).toMatchObject({ status: "BLOCKED", safeErrorCode: code });
    expect(auth.signIns).toEqual([]);
  });

  it("signs the two users in only once the environment guard has passed", async () => {
    // The guard clears, so the run proceeds to authentication — which is what
    // makes the assertions above meaningful rather than vacuous.
    await runStagingValidationEntrypoint({ source });
    expect(auth.signIns).toEqual(["owner@example.test", "other@example.test"]);
  });

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
