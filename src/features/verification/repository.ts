import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { VerificationRun, VerificationStatus } from "./types";
import { toPersistedVerification } from "./persistence";

async function owner(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: project } = await supabase.from("projects").select("id").eq("id", projectId).eq("user_id", user.id).maybeSingle();
  return project ? { supabase, user } : null;
}

export async function persistVerificationRun(projectId: string, run: VerificationRun, executionId?: string, credentialSnapshotVersion?: string) {
  const access = await owner(projectId); if (!access) return { ok: false as const, error: "NOT_AUTHORIZED" };
  const persisted = toPersistedVerification(run, credentialSnapshotVersion);
  const { data: saved, error } = await access.supabase.from("verification_runs").insert({ project_id: projectId, execution_id: executionId ?? null, user_id: access.user.id, status: run.status, final_status: run.result.status, result: run.result as never, credential_snapshot_version: credentialSnapshotVersion ?? null }).select("id").single();
  if (error || !saved) return { ok: false as const, error: error?.code === "23505" ? "ACTIVE_RUN_EXISTS" : "SAVE_FAILED" };
  const { data: targets, error: targetError } = await access.supabase.from("verification_targets").insert(persisted.targets.map((target) => ({ verification_run_id: saved.id, provider: target.provider, required: target.required, verification_stage: target.stage, status: target.status, expires_at: target.expiresAt ?? null, verified_capabilities: [], safe_error_code: null }))).select("id,provider");
  if (targetError || !targets) return { ok: false as const, error: "TARGET_SAVE_FAILED" };
  const targetIds = new Map(targets.map((target) => [target.provider, target.id]));
  const rows = persisted.attempts.flatMap((attempt, index) => { const target = persisted.targets.find((item) => item.id === attempt.targetId); const targetId = target && targetIds.get(target.provider); return targetId ? [{ verification_target_id: targetId, attempt_number: index + 1, status: attempt.status, started_at: attempt.startedAt, completed_at: attempt.finishedAt ?? null, safe_evidence: attempt.evidence ?? {} }] : []; });
  if (rows.length) { const { error } = await access.supabase.from("verification_attempts").insert(rows); if (error) return { ok: false as const, error: "ATTEMPT_SAVE_FAILED" }; }
  return { ok: true as const, id: saved.id };
}

export async function getLatestVerificationRun(projectId: string) {
  const access = await owner(projectId); if (!access) return null;
  const { data } = await access.supabase.from("verification_runs").select("*").eq("project_id", projectId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  const { data: targets } = await access.supabase.from("verification_targets").select("*").eq("verification_run_id", data.id);
  const targetRows = targets ?? []; const { data: attempts } = await access.supabase.from("verification_attempts").select("*").in("verification_target_id", targetRows.map((target) => target.id)); const now = Date.now();
  return { id: data.id, projectId, status: data.status as VerificationStatus, targets: targetRows.map((target) => ({ id: target.id, providerId: target.provider, required: target.required, stage: target.verification_stage as import("./types").VerificationStage, status: target.status === "VERIFIED" && target.expires_at && Date.parse(target.expires_at) <= now ? "EXPIRED" as const : target.status as VerificationStatus })), attempts: (attempts ?? []).map((attempt) => ({ id: attempt.id, targetId: attempt.verification_target_id, status: attempt.status as VerificationStatus, startedAt: attempt.started_at, finishedAt: attempt.completed_at ?? undefined, evidence: attempt.safe_evidence as never })), result: data.result as unknown as import("./types").VerificationResult, lastRunAt: data.updated_at };
}
