import type { CredentialReference } from "../credentials/types";
import { validateProvider } from "../execution/provider-validation";
import type { ExecutionResult } from "../execution/runtime";
import type { VerificationRun, VerificationTarget, VerificationResult, VerificationStatus } from "./types";

export function createVerificationTargets(connectors: { providerId: string; required: boolean }[]): VerificationTarget[] {
  return connectors.map((connector) => ({
    id: `verification-${connector.providerId}`,
    providerId: connector.providerId,
    required: connector.required,
    stage: "PROVIDER_CONNECTION",
    status: "NOT_RUN",
  }));
}

const blockedStatuses = new Set<VerificationStatus>([
  "NOT_RUN",
  "WAITING_FOR_CREDENTIAL",
  "RUNNING",
  "WARNING",
  "EXPIRED",
  "UNAVAILABLE",
]);

export function calculateFinalVerificationResult(targets: VerificationTarget[]): VerificationResult {
  const verified = targets.filter((target) => target.status === "VERIFIED").length;
  const failed = targets.filter((target) => target.status === "FAILED").length;
  const blocked = targets.filter((target) => blockedStatuses.has(target.status)).length;
  const warnings = targets.filter(
    (target) => !target.required && target.status !== "VERIFIED",
  ).length;
  const requiredFailed = targets.some(
    (target) => target.required && target.status === "FAILED",
  );
  const requiredUnverified = targets.some(
    (target) => target.required && target.status !== "VERIFIED",
  );

  return {
    status: requiredFailed
      ? "FAILED"
      : requiredUnverified
        ? "BLOCKED"
        : warnings > 0
          ? "READY_WITH_WARNINGS"
          : "READY",
    verified,
    warnings,
    failed,
    blocked,
    details: targets
      .filter((target) => target.status !== "VERIFIED")
      .map((target) => `${target.providerId}: ${target.status}`),
  };
}

export function verificationRunStatus(
  targets: VerificationTarget[],
  result: VerificationResult,
): VerificationStatus {
  if (result.status === "READY") return "VERIFIED";
  if (result.status === "READY_WITH_WARNINGS") return "WARNING";
  if (result.status === "FAILED") return "FAILED";
  if (targets.some((target) => target.status === "RUNNING")) return "RUNNING";
  if (targets.some((target) => target.status === "EXPIRED")) return "EXPIRED";
  if (targets.some((target) => target.status === "WAITING_FOR_CREDENTIAL")) {
    return "WAITING_FOR_CREDENTIAL";
  }
  return "NOT_RUN";
}

export function createVerificationRun(
  projectId: string,
  connectors: { providerId: string; required: boolean }[],
): VerificationRun {
  const targets = createVerificationTargets(connectors);
  return {
    id: `verification-run-${projectId}`,
    projectId,
    status: "NOT_RUN",
    targets,
    attempts: [],
    result: calculateFinalVerificationResult(targets),
  };
}

export async function runProviderVerification(
  run: VerificationRun,
  credentials: Record<string, CredentialReference | undefined>,
  fetcher: typeof fetch = fetch,
): Promise<VerificationRun> {
  const targets = run.targets.map((target) => ({
    ...target,
    status: "RUNNING" as VerificationStatus,
  }));
  const attempts = [...run.attempts];

  for (const target of targets) {
    const startedAt = new Date().toISOString();
    const credential = credentials[target.providerId];
    const result: ExecutionResult =
      target.providerId === "openai" || target.providerId === "supabase"
        ? await validateProvider(
            { providerId: target.providerId, credential, timeoutMs: 5000 },
            fetcher,
          )
        : { ok: false, status: "WAITING_FOR_USER" };
    const status: VerificationStatus =
      result.status === "SUCCEEDED"
        ? "VERIFIED"
        : result.status === "WAITING_FOR_USER"
          ? "WAITING_FOR_CREDENTIAL"
          : "FAILED";
    target.status = status;
    attempts.push({
      id: `${target.id}-${Date.now()}`,
      targetId: target.id,
      status,
      startedAt,
      finishedAt: new Date().toISOString(),
      evidence: {
        providerId: target.providerId,
        checkedAt: new Date().toISOString(),
        safeErrorCode: result.error?.code,
        capabilities: status === "VERIFIED" ? ["read_only_connection"] : [],
        expired: false,
      },
    });
  }

  const result = calculateFinalVerificationResult(targets);
  return {
    ...run,
    status: verificationRunStatus(targets, result),
    targets,
    attempts,
    result,
    lastRunAt: new Date().toISOString(),
  };
}

export function retryFailedTargets(run: VerificationRun): VerificationRun {
  const targets = run.targets.map((target) =>
    target.status === "FAILED" || target.status === "EXPIRED"
      ? { ...target, status: "NOT_RUN" as const }
      : target,
  );
  const result = calculateFinalVerificationResult(targets);
  return {
    ...run,
    status: verificationRunStatus(targets, result),
    targets,
    result,
  };
}
