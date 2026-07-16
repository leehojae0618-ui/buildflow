"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { initialMetrics, nextState, recordUserEvent } from "./state-machine";
import type { ActionBundle, ApprovalPlan, AutonomousSession } from "./types";
import {
  continueAutonomousProvisioning,
  runAutonomousProvisioning,
} from "@/features/provisioning/executor";
import {
  BlueprintSelectionError,
  selectApplicationBlueprint,
} from "@/features/provisioning/blueprints";
type UserResumeEvent = "CREDENTIALS_READY" | "CONSENT_GRANTED" | "APPROVAL_GRANTED" | "CANCEL";
const userResumeEvents = new Set<UserResumeEvent>(["CREDENTIALS_READY", "CONSENT_GRANTED", "APPROVAL_GRANTED", "CANCEL"]);
async function owned(projectId: string) { const client = await createSupabaseServerClient(); const { data: { user } } = await client.auth.getUser(); if (!user) return null; const { data: project } = await client.from("projects").select("id,goal_constraints").eq("id", projectId).eq("user_id", user.id).maybeSingle(); return project ? { supabase: createSupabaseAdminClient(), user, project } : null; }
export async function getAutonomousBuildSession(projectId: string) { const access = await owned(projectId); if (!access) return null; const { data } = await access.supabase.from("autonomous_build_sessions").select("id,status").eq("project_id", projectId).eq("user_id", access.user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (!data) return null; const { data: deployment } = await access.supabase.from("deployment_sessions").select("completion_report").eq("project_id", projectId).eq("user_id", access.user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(); return { ...data, completionReport: deployment?.completion_report ?? null }; }
function selectedBlueprint(snapshot: Record<string, unknown>) {
  const requirement = snapshot.requirement as { goalOriginal?: string } | undefined;
  return selectApplicationBlueprint({
    title: "",
    goal: requirement?.goalOriginal ?? "",
    requestedCapabilities: Array.isArray(snapshot.applicationCapabilities)
      ? (snapshot.applicationCapabilities as Parameters<
          typeof selectApplicationBlueprint
        >[0]["requestedCapabilities"])
      : undefined,
  });
}
function bundle(
  providers: ReturnType<typeof selectedBlueprint>["requiredProviders"],
): ActionBundle { const required = providers.map((providerId) => ({ id: `credential-${providerId}`, label: `${providerId} 계정 연결`, required: true, kind: "CREDENTIAL" as const, estimatedMinutes: 5, estimatedCostCents: 0, autoResume: true })); return { required, optional: [], totalEstimatedMinutes: required.length * 5, totalEstimatedCostCents: 0, autoResume: true }; }
function approval(snapshot: Record<string, unknown>, blueprint: ReturnType<typeof selectedBlueprint>): ApprovalPlan { const architecture = snapshot.selectedArchitectureSnapshot as { components?: Array<{ name?: string; monthlyCostCents?: number; required?: boolean }> } | undefined; const components = architecture?.components ?? []; return { resources: ["Private GitHub Repository", "Supabase Schema and RLS", "Vercel Project and Production Deployment", ...components.filter((item) => item.required).map((item) => item.name ?? "resource")], estimatedCostCents: components.reduce((sum, item) => sum + (item.monthlyCostCents ?? 0), 0), permissionChanges: ["Private Repository 파일 쓰기", "기존 Supabase Project Schema 적용", ...(blueprint.id === "general-crud-v1" ? ["Supabase 이메일 회원가입 자동 확인 설정"] : []), "Vercel 환경변수와 배포 생성"], publicDeployment: true, reversible: true, scopeVersion: `approval-plan-v3-${blueprint.id}` }; }
export async function startAutonomousBuildSession(projectId: string) { const access = await owned(projectId); if (!access) return { ok: false as const, error: "NOT_AUTHORIZED" }; const { data: existing } = await access.supabase.from("autonomous_build_sessions").select("id,status").eq("project_id", projectId).eq("user_id", access.user.id).not("status", "in", "(READY,READY_WITH_WARNINGS,FAILED,CANCELLED)").order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (existing) return { ok: true as const, sessionId: existing.id, status: existing.status }; const constraints = (access.project.goal_constraints ?? {}) as Record<string, unknown>; const snapshot = (constraints.requirement_snapshot ?? {}) as Record<string, unknown>; if (!snapshot.requirement || !snapshot.selectedArchitectureSnapshot || !snapshot.buildPlan) return { ok: false as const, error: "BUILD_INPUT_INCOMPLETE" }; let blueprint: ReturnType<typeof selectedBlueprint>; try { blueprint = selectedBlueprint(snapshot); } catch (error) { return { ok: false as const, error: error instanceof BlueprintSelectionError ? error.code : "BLUEPRINT_NOT_SUPPORTED" }; } const actionBundle = bundle(blueprint.requiredProviders); const approvalPlan = approval(snapshot, blueprint); const status = "WAITING_FOR_CREDENTIAL"; const { data, error } = await access.supabase.from("autonomous_build_sessions").insert({ project_id: projectId, user_id: access.user.id, status, current_phase: "PREPARATION", action_bundle: actionBundle as never, approval_plan: approvalPlan as never, metrics: initialMetrics() as never }).select("id").single(); if (error || !data) return { ok: false as const, error: "SESSION_CREATE_FAILED" }; revalidatePath(`/app/projects/${projectId}`); return { ok: true as const, sessionId: data.id, status }; }
export async function resumeAutonomousBuildSession(projectId: string, sessionId: string, event: UserResumeEvent) {
  if (!userResumeEvents.has(event)) return { ok: false as const, error: "SYSTEM_EVENT_NOT_ALLOWED" };
  const access = await owned(projectId);
  if (!access) return { ok: false as const, error: "NOT_AUTHORIZED" };
  const { data } = await access.supabase.from("autonomous_build_sessions").select("*").eq("id", sessionId).eq("project_id", projectId).eq("user_id", access.user.id).maybeSingle();
  if (!data) return { ok: false as const, error: "SESSION_NOT_FOUND" };
  if (event === "CREDENTIALS_READY") {
    const { data: references } = await access.supabase
      .from("provider_credentials")
      .select("provider,status")
      .eq("project_id", projectId)
      .eq("user_id", access.user.id);
    const configured = new Map(
      (references ?? []).map((reference) => [
        reference.provider,
        reference.status,
      ]),
    );
    const constraints = (access.project.goal_constraints ?? {}) as Record<
      string,
      unknown
    >;
    const snapshot = (constraints.requirement_snapshot ?? {}) as Record<
      string,
      unknown
    >;
    let providers: ReturnType<typeof selectedBlueprint>["requiredProviders"];
    try {
      providers = selectedBlueprint(snapshot).requiredProviders;
    } catch (error) {
      return {
        ok: false as const,
        error:
          error instanceof BlueprintSelectionError
            ? error.code
            : "BLUEPRINT_NOT_SUPPORTED",
      };
    }
    const missing = providers.some(
      (provider) =>
        !["PROVIDED", "VALID"].includes(configured.get(provider) ?? ""),
    );
    if (missing) return { ok: false as const, error: "CREDENTIAL_EVIDENCE_REQUIRED" };
  }
  const current = { id: data.id, projectId: data.project_id, userId: data.user_id, status: data.status, currentPhase: data.current_phase, completedPhases: data.completed_phases, blockedReason: data.blocked_reason ?? undefined, actionBundle: data.action_bundle, approvalPlan: data.approval_plan, metrics: data.metrics, executionId: data.execution_id ?? undefined } as AutonomousSession;
  const updated = nextState(current, event);
  if (updated.status === current.status && event !== "CANCEL") return { ok: false as const, error: "INVALID_SESSION_TRANSITION" };
  const approvalPlan = data.approval_plan as { scopeVersion?: string };
  const metrics = event === "CANCEL" ? updated.metrics : recordUserEvent(updated.metrics, event);
  const evidence = event === "CONSENT_GRANTED" ? { consent_granted_at: new Date().toISOString() } : event === "APPROVAL_GRANTED" ? { approval_granted_at: new Date().toISOString(), approval_scope_version: approvalPlan.scopeVersion ?? null } : {};
  const { error } = await access.supabase.from("autonomous_build_sessions").update({ status: updated.status, current_phase: updated.currentPhase, completed_phases: updated.completedPhases as never, metrics: metrics as never, ...evidence }).eq("id", sessionId).eq("project_id", projectId).eq("user_id", access.user.id);
  if (error) return { ok: false as const, error: "SESSION_UPDATE_FAILED" };
  revalidatePath(`/app/projects/${projectId}`);
  if (event === "APPROVAL_GRANTED" && updated.status === "PROVISIONING") {
    return runAutonomousProvisioning(projectId, sessionId);
  }
  return { ok: true as const, status: updated.status };
}

export async function continueAutonomousBuildSession(projectId: string, sessionId: string) {
  const access = await owned(projectId);
  if (!access) return { ok: false as const, error: "NOT_AUTHORIZED" };
  const { data: session } = await access.supabase
    .from("autonomous_build_sessions")
    .select("id,status")
    .eq("id", sessionId)
    .eq("project_id", projectId)
    .eq("user_id", access.user.id)
    .maybeSingle();
  if (!session) return { ok: false as const, error: "SESSION_NOT_FOUND" };
  const result =
    session.status === "PROVISIONING"
      ? await runAutonomousProvisioning(projectId, sessionId)
      : await continueAutonomousProvisioning(projectId, sessionId);
  revalidatePath(`/app/projects/${projectId}`);
  return result;
}
