"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { estimateBuild } from "./engine";
import type { BuildEstimate, DeploymentSession } from "./types";

async function owned(projectId: string) {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data: project } = await client.from("projects").select("id, user_id, goal_constraints").eq("id", projectId).eq("user_id", user.id).maybeSingle();
  return project ? { supabase: createSupabaseAdminClient(), user, project } : null;
}

export async function startDeploymentSession(projectId: string): Promise<{ error?: string; session?: DeploymentSession }> {
  const access = await owned(projectId);
  if (!access) return { error: "프로젝트에 접근할 수 없습니다." };
  const constraints = (access.project.goal_constraints ?? {}) as Record<string, unknown>;
  const snapshot = (constraints.requirement_snapshot ?? {}) as { architecture?: Parameters<typeof estimateBuild>[0]; buildPlan?: Parameters<typeof estimateBuild>[1]; buildPreference?: Parameters<typeof estimateBuild>[2] };
  if (!snapshot.architecture || !snapshot.buildPlan) return { error: "Architecture와 Build Plan을 먼저 확정하세요." };
  const estimate = estimateBuild(snapshot.architecture, snapshot.buildPlan, snapshot.buildPreference);
  const { data, error } = await access.supabase.from("deployment_sessions").insert({ project_id: projectId, user_id: access.user.id, state: "PREPARING", current_stage: "준비 중", completed_stages: [], estimate: estimate as never, completion_report: { state: "PREPARING", productionReady: false, warnings: ["구축이 아직 시작되지 않았습니다."] } as never, retry_count: 0, automatic_recovery_count: 0 }).select("*").single();
  if (error) return { error: "구축 세션을 저장하지 못했습니다." };
  return { session: { id: data.id, projectId, userId: access.user.id, state: data.state as DeploymentSession["state"], currentStage: data.current_stage, completedStages: data.completed_stages as string[], estimate: data.estimate as unknown as BuildEstimate, report: data.completion_report as unknown as DeploymentSession["report"], retryCount: data.retry_count, automaticRecoveryCount: data.automatic_recovery_count, createdAt: data.created_at, updatedAt: data.updated_at } };
}

export async function getLatestDeploymentSession(projectId: string) {
  const access = await owned(projectId);
  if (!access) return null;
  const { data } = await access.supabase.from("deployment_sessions").select("id,state,estimate,completion_report,current_stage,updated_at").eq("project_id", projectId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}
