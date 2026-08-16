import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { loadLiveDbEnvironment } from "./environment-loader";
import {
  LIVE_DB_DATABASE_URL_PLACEHOLDER,
  executeStagingMigration,
  validateMigrationCommandArgs,
  type LiveDbMigrationExecutor,
} from "./staging-migration-executor";

const stagingRef = "stagingabc";
const databaseUrl = `postgresql://postgres:pw-placeholder@db.${stagingRef}.supabase.co:5432/postgres`;

const validStagingSource = {
  LIVE_DB_TARGET_ENV: "staging",
  LIVE_DB_SUPABASE_URL: `https://${stagingRef}.supabase.co`,
  LIVE_DB_SUPABASE_SERVICE_ROLE_KEY: "test-service-role-placeholder",
  LIVE_DB_DATABASE_URL: databaseUrl,
  LIVE_DB_EXECUTION_CONFIRMED: "true",
  LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF: "productionxyz",
};

const environmentFor = (overrides: Record<string, string | undefined> = {}) =>
  loadLiveDbEnvironment("connection", { ...validStagingSource, ...overrides });

const applyingExecutor = () =>
  vi.fn<LiveDbMigrationExecutor>(async () => ({ status: "APPLIED", appliedMigrationCount: 20 }));

describe("validateMigrationCommandArgs", () => {
  it("rejects every argument form that resolves a target from linked state", () => {
    for (const argument of ["--linked", "--project-ref", "-p", "--workdir", "--project-ref=abc"]) {
      expect(validateMigrationCommandArgs(["db", "push", argument, "--db-url", "x"])).toEqual({
        status: "INVALID",
        safeErrorCode: "LIVE_DB_LINKED_STATE_FORBIDDEN",
      });
    }
  });

  it("rejects arguments that reference linked project state files", () => {
    expect(validateMigrationCommandArgs(["db", "push", "--db-url", "supabase/.temp/project-ref"])).toEqual({
      status: "INVALID",
      safeErrorCode: "LIVE_DB_LINKED_STATE_FORBIDDEN",
    });
  });

  it("requires an explicit --db-url target", () => {
    expect(validateMigrationCommandArgs(["db", "push"])).toEqual({
      status: "INVALID",
      safeErrorCode: "LIVE_DB_MIGRATION_COMMAND_INVALID",
    });
  });

  it("accepts an explicit db-url invocation", () => {
    expect(validateMigrationCommandArgs(["db", "push", "--db-url", databaseUrl])).toEqual({
      status: "VALID",
    });
  });
});

describe("ST-B guarded migration execution boundary", () => {
  it("hands the injected executor an explicit --db-url argv with no linked flag", async () => {
    const executor = applyingExecutor();
    const result = await executeStagingMigration(environmentFor(), executor);

    expect(result).toEqual({
      status: "APPLIED",
      targetProjectRefMasked: "stag…gabc",
      appliedMigrationCount: 20,
      commandArgs: ["db", "push", "--db-url", LIVE_DB_DATABASE_URL_PLACEHOLDER],
    });
    expect(executor).toHaveBeenCalledOnce();
    expect(executor).toHaveBeenCalledWith({
      executable: "supabase",
      args: ["db", "push", "--db-url", databaseUrl],
    });
    const [invocation] = executor.mock.calls[0];
    expect(invocation.args).not.toContain("--linked");
    expect(invocation.args.join(" ")).not.toContain("--project-ref");
  });

  it("keeps the database URL out of the returned result", async () => {
    const result = await executeStagingMigration(environmentFor(), applyingExecutor());
    const serialized = JSON.stringify(result);
    expect(serialized).toContain(LIVE_DB_DATABASE_URL_PLACEHOLDER);
    expect(serialized).not.toContain("postgresql://");
    expect(serialized).not.toContain("pw-placeholder");
    expect(serialized).not.toContain(stagingRef);
  });

  it("fails closed when no executor is injected", async () => {
    expect(await executeStagingMigration(environmentFor(), undefined)).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_MIGRATION_EXECUTOR_NOT_INJECTED",
    });
  });

  it("never reaches the executor when a guard blocks", async () => {
    const cases: Array<[Record<string, string | undefined>, string]> = [
      [{ LIVE_DB_EXECUTION_CONFIRMED: undefined }, "LIVE_DB_EXECUTION_CONFIRMATION_REQUIRED"],
      [{ OPENAI_API_KEY: "sk-should-never-be-read" }, "LIVE_DB_OPENAI_KEY_PRESENT"],
      [{ LIVE_DB_TARGET_ENV: "production" }, "LIVE_DB_PRODUCTION_FORBIDDEN"],
      [{ LIVE_DB_KNOWN_PRODUCTION_PROJECT_REF: undefined }, "LIVE_DB_PRODUCTION_IDENTITY_UNKNOWN"],
      [{ NEXT_PUBLIC_SUPABASE_URL: `https://${stagingRef}.supabase.co` }, "LIVE_DB_APP_TARGET_MATCH"],
      [
        { LIVE_DB_DATABASE_URL: "postgresql://postgres:pw@db.otherproject.supabase.co:5432/postgres" },
        "LIVE_DB_DB_URL_TARGET_MISMATCH",
      ],
      [{ LIVE_DB_DATABASE_URL: undefined }, "LIVE_DB_DB_URL_MISSING"],
    ];

    for (const [overrides, safeErrorCode] of cases) {
      const executor = applyingExecutor();
      expect(await executeStagingMigration(environmentFor(overrides), executor)).toEqual({
        status: "BLOCKED",
        safeErrorCode,
      });
      expect(executor).not.toHaveBeenCalled();
    }
  });

  it("propagates an executor failure as a safe error code", async () => {
    const executor = vi.fn<LiveDbMigrationExecutor>(async () => ({
      status: "FAILED",
      safeErrorCode: "LIVE_DB_MIGRATION_EXECUTION_FAILED",
    }));
    expect(await executeStagingMigration(environmentFor(), executor)).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_MIGRATION_EXECUTION_FAILED",
    });
  });

  it("performs zero network calls of its own", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await executeStagingMigration(environmentFor(), applyingExecutor());
    await executeStagingMigration(environmentFor(), undefined);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe("ST-B module structure", () => {
  const stBModules = [
    "staging-migration-target.ts",
    "staging-migration-executor.ts",
    "approval-validation-runner.ts",
    "rls-validation-runner.ts",
    "staging-evidence.ts",
  ];

  /**
   * A structural proof rather than a behavioural one: a module that imports
   * neither the filesystem nor a process spawner cannot read
   * `supabase/.temp/project-ref` and cannot invoke the Supabase CLI itself,
   * regardless of what any future call site passes it.
   */
  it("imports no filesystem or process-spawning module", () => {
    for (const moduleName of stBModules) {
      const source = readFileSync(join(__dirname, moduleName), "utf8");
      const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);
      for (const specifier of imports) {
        expect(
          /^(?:node:)?(?:fs|fs\/promises|child_process|process|os|net|dns|http|https)$/.test(specifier),
          `${moduleName} must not import ${specifier}`,
        ).toBe(false);
      }
    }
  });

  it("reads process.env only through the shared environment loader", () => {
    for (const moduleName of stBModules) {
      const source = readFileSync(join(__dirname, moduleName), "utf8");
      expect(source, `${moduleName} must not read process.env directly`).not.toMatch(/process\.env/);
    }
  });
});
