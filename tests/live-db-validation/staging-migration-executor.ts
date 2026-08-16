import {
  resolveStagingMigrationTarget,
  type LiveDbSecretCarrier,
  type LiveDbStagingMigrationTarget,
} from "./staging-migration-target";
import type { LiveDbEnvironmentInput, LiveDbSafeErrorCode } from "./types";

/** Placeholder that stands in for the database URL inside a loggable argv. */
export const LIVE_DB_DATABASE_URL_PLACEHOLDER = "<LIVE_DB_DATABASE_URL>" as const;

/**
 * Argument forms that would let the Supabase CLI pick its own target from the
 * linked project state instead of the explicitly approved staging target.
 */
const forbiddenArguments = [
  "--linked",
  "--project-ref",
  "-p",
  "--workdir",
] as const;

const forbiddenArgumentSubstrings = ["supabase/.temp", ".temp/project-ref", "linked-project"] as const;

export type LiveDbMigrationCommand = {
  executable: string;
  /** Safe to log and to place in Evidence: contains a placeholder, not the URL. */
  args: readonly string[];
  databaseUrl: LiveDbSecretCarrier;
};

export type LiveDbMigrationExecutorInvocation = {
  executable: string;
  /** Resolved argv with the placeholder substituted; never returned to Evidence. */
  args: readonly string[];
};

export type LiveDbMigrationExecutorOutcome =
  | { status: "APPLIED"; appliedMigrationCount: number }
  | { status: "FAILED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * Dependency-injection seam. R2 tests supply a fake; no default is provided on
 * purpose, so an un-injected call fails closed instead of shelling out.
 */
export type LiveDbMigrationExecutor = (
  invocation: LiveDbMigrationExecutorInvocation,
) => Promise<LiveDbMigrationExecutorOutcome>;

export type LiveDbMigrationResult =
  | {
      status: "APPLIED";
      targetProjectRefMasked: string;
      appliedMigrationCount: number;
      commandArgs: readonly string[];
    }
  | { status: "BLOCKED"; safeErrorCode: LiveDbSafeErrorCode };

/**
 * Builds the migration argv for an already-resolved staging target. The target
 * is passed as `--db-url`, which is the only form that ignores linked state.
 */
export function buildStagingMigrationCommand(
  target: LiveDbStagingMigrationTarget,
): LiveDbMigrationCommand {
  return {
    executable: "supabase",
    args: ["db", "push", "--db-url", LIVE_DB_DATABASE_URL_PLACEHOLDER],
    databaseUrl: target.databaseUrl,
  };
}

/**
 * Rejects any argv that could resolve its target from linked project state.
 * Applied to the built command and again to what the executor would receive,
 * so a caller cannot smuggle `--linked` in through either path.
 */
export function validateMigrationCommandArgs(
  args: readonly string[],
): { status: "VALID" } | { status: "INVALID"; safeErrorCode: LiveDbSafeErrorCode } {
  for (const argument of args) {
    const normalized = argument.trim().toLowerCase();
    if (forbiddenArguments.some((item) => normalized === item || normalized.startsWith(`${item}=`))) {
      return { status: "INVALID", safeErrorCode: "LIVE_DB_LINKED_STATE_FORBIDDEN" };
    }
    if (forbiddenArgumentSubstrings.some((item) => normalized.includes(item))) {
      return { status: "INVALID", safeErrorCode: "LIVE_DB_LINKED_STATE_FORBIDDEN" };
    }
  }
  if (!args.includes("--db-url")) {
    return { status: "INVALID", safeErrorCode: "LIVE_DB_MIGRATION_COMMAND_INVALID" };
  }
  return { status: "VALID" };
}

/**
 * The ST-B migration boundary. Resolves the target under dual binding, refuses
 * every linked-state form, and hands an explicit argv to an injected executor.
 * This function performs no process spawn and no network call of its own.
 */
export async function executeStagingMigration(
  environment: LiveDbEnvironmentInput,
  executor: LiveDbMigrationExecutor | undefined,
): Promise<LiveDbMigrationResult> {
  const resolved = resolveStagingMigrationTarget(environment);
  if (resolved.status === "BLOCKED") {
    return { status: "BLOCKED", safeErrorCode: resolved.safeErrorCode };
  }

  const command = buildStagingMigrationCommand(resolved.target);
  const commandCheck = validateMigrationCommandArgs(command.args);
  if (commandCheck.status === "INVALID") {
    return { status: "BLOCKED", safeErrorCode: commandCheck.safeErrorCode };
  }

  if (typeof executor !== "function") {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_MIGRATION_EXECUTOR_NOT_INJECTED" };
  }

  const resolvedArgs = command.args.map((item) =>
    item === LIVE_DB_DATABASE_URL_PLACEHOLDER ? command.databaseUrl.reveal() : item,
  );
  const resolvedCheck = validateMigrationCommandArgs(resolvedArgs);
  if (resolvedCheck.status === "INVALID") {
    return { status: "BLOCKED", safeErrorCode: resolvedCheck.safeErrorCode };
  }

  const outcome = await executor({ executable: command.executable, args: resolvedArgs });
  if (outcome.status === "FAILED") {
    return { status: "BLOCKED", safeErrorCode: outcome.safeErrorCode };
  }

  return {
    status: "APPLIED",
    targetProjectRefMasked: resolved.target.targetProjectRefMasked,
    appliedMigrationCount: outcome.appliedMigrationCount,
    // The placeholder form, never the resolved one.
    commandArgs: command.args,
  };
}
