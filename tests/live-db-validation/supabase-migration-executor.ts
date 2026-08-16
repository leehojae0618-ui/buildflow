import { execFile } from "node:child_process";

import { hasStagingUnsafeValue } from "./staging-evidence";
import type {
  LiveDbMigrationExecutor,
  LiveDbMigrationExecutorInvocation,
  LiveDbMigrationExecutorOutcome,
} from "./staging-migration-executor";

/** Matches the CLI's "Applying migration <name>" progress lines. */
const appliedMigrationLine = /^\s*Applying migration\s+\S+/gim;

export type SpawnResult = { code: number | null; stdout: string; stderr: string };
export type SpawnProcess = (
  executable: string,
  args: readonly string[],
) => Promise<SpawnResult>;

/**
 * Runs the command with `execFile`, which takes an argument vector rather than
 * a shell string. Nothing is interpolated into a shell, so the database URL
 * cannot be re-split, quoted wrong, or land in a shell history file.
 */
const defaultSpawn: SpawnProcess = (executable, args) =>
  new Promise((resolve) => {
    execFile(
      executable,
      [...args],
      { maxBuffer: 8 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const code =
          error && typeof (error as { code?: unknown }).code === "number"
            ? ((error as { code: number }).code)
            : error
              ? 1
              : 0;
        resolve({ code, stdout: String(stdout ?? ""), stderr: String(stderr ?? "") });
      },
    );
  });

/**
 * Counts applied migrations from CLI output without retaining the output.
 *
 * The Supabase CLI echoes the connection target on some paths, so its stdout and
 * stderr are treated as contaminated by default: only this number survives the
 * function, and it is a count, not text.
 */
export function countAppliedMigrations(stdout: string): number {
  return (stdout.match(appliedMigrationLine) ?? []).length;
}

export type CreateSupabaseMigrationExecutorOptions = {
  spawn?: SpawnProcess;
  /**
   * Written the moment a command fails, before any classification. Receives only
   * values this module has already proven safe — never raw CLI output.
   */
  onSafeDiagnostic?: (safeDiagnostic: { exitCode: number | null; outputWasUnsafe: boolean }) => void;
};

/**
 * The real ST-B migration executor.
 *
 * `staging-migration-executor.ts` builds and validates the argv and is asserted
 * to import no process-spawning module; this file is the one place that spawns,
 * and it does nothing else. It never returns, logs, or forwards CLI output:
 * stdout and stderr contain the resolved `--db-url`, which embeds the database
 * password, so the only things that leave here are a migration count and a safe
 * error code.
 */
export function createSupabaseMigrationExecutor(
  options: CreateSupabaseMigrationExecutorOptions = {},
): LiveDbMigrationExecutor {
  const spawn = options.spawn ?? defaultSpawn;

  return async (
    invocation: LiveDbMigrationExecutorInvocation,
  ): Promise<LiveDbMigrationExecutorOutcome> => {
    let result: SpawnResult;
    try {
      result = await spawn(invocation.executable, invocation.args);
    } catch {
      // A thrown spawn error can carry the argv, and the argv carries the URL.
      return { status: "FAILED", safeErrorCode: "LIVE_DB_MIGRATION_EXECUTION_FAILED" };
    }

    const combined = `${result.stdout}\n${result.stderr}`;
    const outputWasUnsafe = hasStagingUnsafeValue(combined);

    if (result.code !== 0) {
      options.onSafeDiagnostic?.({ exitCode: result.code, outputWasUnsafe });
      return { status: "FAILED", safeErrorCode: "LIVE_DB_MIGRATION_EXECUTION_FAILED" };
    }

    return { status: "APPLIED", appliedMigrationCount: countAppliedMigrations(result.stdout) };
  };
}
