import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { VerificationRun, VerificationStatus } from "./types";
import { toPersistedVerification } from "./persistence";
import {
  calculateFinalVerificationResult,
  verificationRunStatus,
} from "./runner";

async function owner(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: project } = await supabase.from("projects").select("id").eq("id", projectId).eq("user_id", user.id).maybeSingle();
  return project ? { supabase, user } : null;
}

export async function persistVerificationRun(projectId: string, run: VerificationRun, executionId?: string, credentialSnapshotVersion?: string, trustedUserId?: string) {
  const access = trustedUserId
    ? { supabase: createSupabaseAdminClient(), user: { id: trustedUserId } }
    : await owner(projectId);
  if (!access) return { ok: false as const, error: "NOT_AUTHORIZED" };
  const persisted = toPersistedVerification(run, credentialSnapshotVersion);
  const rpcName = trustedUserId
    ? "persist_verification_run_for_owner"
    : "persist_verification_run";
  const { data, error } = await access.supabase.rpc(rpcName, {
    ...(trustedUserId ? { p_user_id: trustedUserId } : {}),
    p_project_id: projectId,
    p_execution_id: (executionId ?? null) as never,
    p_status: run.status,
    p_final_status: run.result.status,
    p_result: run.result as never,
    p_credential_snapshot_version: (credentialSnapshotVersion ?? null) as never,
    p_targets: persisted.targets as never,
    p_attempts: persisted.attempts as never,
  });
  if (error || !data) return { ok: false as const, error: error?.code === "23505" ? "ACTIVE_RUN_EXISTS" : "SAVE_FAILED" };
  return { ok: true as const, id: data };
}

export async function getLatestVerificationRun(projectId: string) {
  const access = await owner(projectId); if (!access) return null;
  const { data } = await access.supabase.from("verification_runs").select("*").eq("project_id", projectId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  const { data: targets } = await access.supabase.from("verification_targets").select("*").eq("verification_run_id", data.id);
  const targetRows = targets ?? [];
  const targetIds = targetRows.map((target) => target.id);
  const attemptsResult = targetIds.length
    ? await access.supabase
        .from("verification_attempts")
        .select("*")
        .in("verification_target_id", targetIds)
        .order("completed_at", { ascending: false })
    : { data: [] };
  const now = Date.now();
  const effectiveTargets = targetRows.map((target) => ({
    id: target.id,
    providerId: target.provider,
    required: target.required,
    stage: target.verification_stage as import("./types").VerificationStage,
    status:
      target.status === "VERIFIED" &&
      target.expires_at &&
      Date.parse(target.expires_at) <= now
        ? ("EXPIRED" as const)
        : (target.status as VerificationStatus),
  }));
  const result = calculateFinalVerificationResult(effectiveTargets);

  return {
    id: data.id,
    projectId,
    status: verificationRunStatus(effectiveTargets, result),
    targets: effectiveTargets,
    attempts: (attemptsResult.data ?? []).map((attempt) => ({
      id: attempt.id,
      targetId: attempt.verification_target_id,
      status: attempt.status as VerificationStatus,
      startedAt: attempt.started_at,
      finishedAt: attempt.completed_at ?? undefined,
      evidence: attempt.safe_evidence as never,
    })),
    result,
    lastRunAt: data.updated_at,
  };
}
