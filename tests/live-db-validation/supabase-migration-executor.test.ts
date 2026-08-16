import { describe, expect, it, vi } from "vitest";

import { hasStagingUnsafeValue } from "./staging-evidence";
import {
  countAppliedMigrations,
  createSupabaseMigrationExecutor,
  type SpawnResult,
} from "./supabase-migration-executor";

const invocation = {
  executable: "supabase",
  args: ["db", "push", "--db-url", "postgresql://postgres:hunter2@db.stagingabc.supabase.co:5432/postgres"],
};

const spawnReturning = (result: Partial<SpawnResult>) =>
  vi.fn(async () => ({ code: 0, stdout: "", stderr: "", ...result }));

describe("countAppliedMigrations", () => {
  it("counts the CLI's per-migration progress lines", () => {
    expect(
      countAppliedMigrations(
        [
          "Connecting to remote database...",
          "Applying migration 20260728000100_add_runtime_approval_foundation.sql...",
          "Applying migration 20260727000100_add_runtime_evidence_persistence.sql...",
          "Finished supabase db push.",
        ].join("\n"),
      ),
    ).toBe(2);
  });

  it("returns zero when nothing was applied", () => {
    expect(countAppliedMigrations("Remote database is up to date.")).toBe(0);
    expect(countAppliedMigrations("")).toBe(0);
  });
});

describe("createSupabaseMigrationExecutor", () => {
  it("passes the argument vector through untouched", async () => {
    const spawn = spawnReturning({ stdout: "Applying migration a.sql\n" });
    await createSupabaseMigrationExecutor({ spawn })(invocation);
    expect(spawn).toHaveBeenCalledWith("supabase", invocation.args);
  });

  it("returns only a count on success", async () => {
    const outcome = await createSupabaseMigrationExecutor({
      spawn: spawnReturning({ stdout: "Applying migration a.sql\nApplying migration b.sql\n" }),
    })(invocation);
    expect(outcome).toEqual({ status: "APPLIED", appliedMigrationCount: 2 });
  });

  it("never lets CLI output reach the caller, even when it contains the database URL", async () => {
    // The CLI echoes its connection target; stdout is treated as contaminated.
    const stdout = `Connecting to ${invocation.args[3]}\nApplying migration a.sql\n`;
    const outcome = await createSupabaseMigrationExecutor({ spawn: spawnReturning({ stdout }) })(
      invocation,
    );
    expect(outcome).toEqual({ status: "APPLIED", appliedMigrationCount: 1 });
    expect(hasStagingUnsafeValue(outcome)).toBe(false);
  });

  it("reports a failure as a safe code and drops stderr entirely", async () => {
    const outcome = await createSupabaseMigrationExecutor({
      spawn: spawnReturning({
        code: 1,
        stderr: `failed to connect to ${invocation.args[3]}: password authentication failed`,
      }),
    })(invocation);
    expect(outcome).toEqual({
      status: "FAILED",
      safeErrorCode: "LIVE_DB_MIGRATION_EXECUTION_FAILED",
    });
    expect(hasStagingUnsafeValue(outcome)).toBe(false);
  });

  it("hands the diagnostic hook a safe summary rather than the output", async () => {
    const onSafeDiagnostic = vi.fn();
    await createSupabaseMigrationExecutor({
      spawn: spawnReturning({ code: 2, stderr: `dial ${invocation.args[3]}` }),
      onSafeDiagnostic,
    })(invocation);
    expect(onSafeDiagnostic).toHaveBeenCalledWith({ exitCode: 2, outputWasUnsafe: true });
    const [[diagnostic]] = onSafeDiagnostic.mock.calls;
    expect(hasStagingUnsafeValue(diagnostic)).toBe(false);
  });

  it("flags clean output as clean", async () => {
    const onSafeDiagnostic = vi.fn();
    await createSupabaseMigrationExecutor({
      spawn: spawnReturning({ code: 1, stderr: "migration 20260728000100 failed to apply" }),
      onSafeDiagnostic,
    })(invocation);
    expect(onSafeDiagnostic).toHaveBeenCalledWith({ exitCode: 1, outputWasUnsafe: false });
  });

  it("fails closed when the spawn itself throws, since the error can carry the argv", async () => {
    const outcome = await createSupabaseMigrationExecutor({
      spawn: vi.fn(async () => {
        throw new Error(`spawn failed: supabase db push --db-url ${invocation.args[3]}`);
      }),
    })(invocation);
    expect(outcome).toEqual({
      status: "FAILED",
      safeErrorCode: "LIVE_DB_MIGRATION_EXECUTION_FAILED",
    });
    expect(hasStagingUnsafeValue(outcome)).toBe(false);
  });
});
