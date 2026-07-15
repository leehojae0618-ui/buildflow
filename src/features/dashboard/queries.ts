import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateProgressFromSteps } from "@/features/workflows/progress";
import type { DashboardData } from "@/features/dashboard/types";

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("auth_required");
  const { data: projects, error: projectError } = await supabase.from("projects").select("id, title, goal, status, created_at, updated_at").neq("status", "archived").order("updated_at", { ascending: false }).limit(5);
  if (projectError) throw new Error("dashboard_projects_failed");
  const projectRows = projects ?? [];
  const projectIds = projectRows.map((project) => project.id);
  if (!projectIds.length) return { summary: { projectCount: 0, activeWorkflowCount: 0, completedWorkflowCount: 0, averageProgressPercent: 0 }, continueWorkflow: null, recentProjects: [], recentRecommendations: [], recentActivity: [] };
  const [{ data: recommendations }, { data: workflows }] = await Promise.all([
    supabase.from("recommendations").select("id, project_id, status, created_at, projects(title), recommendation_candidates(rank, score, snapshot)").in("project_id", projectIds).eq("status", "completed").order("created_at", { ascending: false }).limit(5),
    supabase.from("project_workflows").select("id, project_id, status, snapshot, created_at, updated_at").in("project_id", projectIds).neq("status", "archived").order("updated_at", { ascending: false }),
  ]);
  const workflowIds = (workflows ?? []).map((workflow) => workflow.id);
  const { data: steps } = workflowIds.length ? await supabase.from("project_workflow_steps").select("project_workflow_id, is_completed").in("project_workflow_id", workflowIds) : { data: [] };
  const stepMap = new Map<string, { is_completed: boolean }[]>();
  for (const step of steps ?? []) stepMap.set(step.project_workflow_id, [...(stepMap.get(step.project_workflow_id) ?? []), step]);
  const progressMap = new Map((workflows ?? []).map((workflow) => [workflow.id, calculateProgressFromSteps(stepMap.get(workflow.id) ?? [])]));
  const active = (workflows ?? []).filter((workflow) => workflow.status === "selected" || workflow.status === "in_progress");
  const activeProgress = active.map((workflow) => progressMap.get(workflow.id)?.progressPercent ?? 0);
  const projectTitle = new Map(projectRows.map((project) => [project.id, project.title]));
  type WorkflowRow = NonNullable<typeof workflows>[number];
  const workflowTitle = (workflow: WorkflowRow) => String((workflow.snapshot as Record<string, unknown> | null)?.name ?? "Workflow");
  const continueRow = active[0];
  const candidateRows = (recommendations ?? []).map((recommendation) => { const candidates = [...(recommendation.recommendation_candidates ?? [])].sort((a, b) => a.rank - b.rank); const primary = candidates[0]; return { id: recommendation.id, projectId: recommendation.project_id, projectTitle: Array.isArray(recommendation.projects) ? String(recommendation.projects[0]?.title ?? projectTitle.get(recommendation.project_id) ?? "프로젝트") : String(recommendation.projects?.title ?? projectTitle.get(recommendation.project_id) ?? "프로젝트"), candidateTitle: String((primary?.snapshot as Record<string, unknown> | null)?.title ?? "추천 Workflow"), score: primary?.score ?? null, createdAt: recommendation.created_at }; });
  const activity = [...projectRows.map((project) => ({ id: `project-${project.id}`, text: `${project.title} 프로젝트를 만들었습니다.`, createdAt: project.created_at })), ...(recommendations ?? []).map((recommendation) => ({ id: `recommendation-${recommendation.id}`, text: `${projectTitle.get(recommendation.project_id) ?? "프로젝트"}의 추천을 완료했습니다.`, createdAt: recommendation.created_at })), ...(workflows ?? []).map((workflow) => ({ id: `workflow-${workflow.id}`, text: `${workflowTitle(workflow)} Workflow를 ${workflow.status === "completed" ? "완료했습니다." : "선택했습니다."}`, createdAt: workflow.status === "completed" ? workflow.updated_at : workflow.created_at }))].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  return { summary: { projectCount: projectRows.length, activeWorkflowCount: active.length, completedWorkflowCount: (workflows ?? []).filter((workflow) => workflow.status === "completed").length, averageProgressPercent: activeProgress.length ? Math.round(activeProgress.reduce((sum, value) => sum + value, 0) / activeProgress.length) : 0 }, continueWorkflow: continueRow ? { id: continueRow.id, title: workflowTitle(continueRow), projectTitle: projectTitle.get(continueRow.project_id) ?? "프로젝트", status: continueRow.status, ...(progressMap.get(continueRow.id) ?? { completedSteps: 0, totalSteps: 0, progressPercent: 0 }), updatedAt: continueRow.updated_at } : null, recentProjects: projectRows.map((project) => { const projectWorkflows = (workflows ?? []).filter((workflow) => workflow.project_id === project.id); const latest = projectWorkflows[0]; return { id: project.id, title: project.title, goal: project.goal, status: project.status, workflow: latest ? progressMap.get(latest.id) ?? null : null, updatedAt: project.updated_at }; }), recentRecommendations: candidateRows, recentActivity: activity };
}
