"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateProgressFromSteps, workflowStatusForProgress } from "@/features/workflows/progress";

export async function selectWorkflow(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "");
  const recommendationId = String(formData.get("recommendationId") ?? "") || null;
  if (!templateId || !recommendationId) redirect("/app/projects");
  const supabase = await createSupabaseServerClient();
  const { data: recommendation } = await supabase.from("recommendations").select("project_id").eq("id", recommendationId).maybeSingle();
  const projectId = recommendation?.project_id;
  if (!projectId) redirect("/app/projects");
  const { data: template } = await supabase.from("workflow_templates").select("*, workflow_template_steps(*)").eq("id", templateId).eq("is_active", true).maybeSingle();
  if (!template) redirect(`/app/projects/${projectId}`);
  const { data: workflow, error } = await supabase.from("project_workflows").insert({ project_id: projectId, workflow_template_id: templateId, recommendation_id: recommendationId, status: "selected", snapshot: { name: template.name, description: template.description, difficulty: template.difficulty, estimated_setup_minutes: template.estimated_setup_minutes, cost_model: template.cost_model } }).select("id").single();
  if (error || !workflow) redirect(`/app/projects/${projectId}`);
  const steps = [...(template.workflow_template_steps ?? [])].sort((a, b) => a.step_order - b.step_order).map((step) => ({ project_workflow_id: workflow.id, step_order: step.step_order, title: step.title, description: step.description, status: "pending", snapshot: { tool_id: step.tool_id, is_required: step.is_required } }));
  if (steps.length) await supabase.from("project_workflow_steps").insert(steps);
  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/workflows/${workflow.id}`);
}

export async function toggleWorkflowStep(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  const stepId = String(formData.get("stepId") ?? "");
  const nextCompleted = formData.get("nextCompletedState") === "true";
  if (!workflowId || !stepId) redirect("/app/projects");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/workflows/${workflowId}`);
  const { data: workflow } = await supabase.from("project_workflows").select("id, project_id").eq("id", workflowId).maybeSingle();
  if (!workflow) redirect(`/app/workflows/${workflowId}?error=workflow_not_found`);
  const { data: step } = await supabase.from("project_workflow_steps").select("id, project_workflow_id").eq("id", stepId).maybeSingle();
  if (!step || step.project_workflow_id !== workflowId) redirect(`/app/workflows/${workflowId}?error=step_not_in_workflow`);
  const { error } = await supabase.from("project_workflow_steps").update({ is_completed: nextCompleted, completed_at: nextCompleted ? new Date().toISOString() : null }).eq("id", stepId);
  if (error) redirect(`/app/workflows/${workflowId}?error=step_update_failed`);
  const { data: steps } = await supabase.from("project_workflow_steps").select("is_completed").eq("project_workflow_id", workflowId);
  const progress = calculateProgressFromSteps(steps ?? []);
  const { error: statusError } = await supabase.from("project_workflows").update({ status: workflowStatusForProgress(progress.totalSteps, progress.completedSteps) }).eq("id", workflowId);
  if (statusError) redirect(`/app/workflows/${workflowId}?error=workflow_status_update_failed`);
  revalidatePath(`/app/workflows/${workflowId}`); revalidatePath(`/app/projects/${workflow.project_id}`); revalidatePath("/app");
  redirect(`/app/workflows/${workflowId}`);
}
