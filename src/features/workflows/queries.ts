import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateProgressFromSteps } from "@/features/workflows/progress";
import { buildGuidedStepDetail } from "@/features/workflows/guided";

export async function getProjectWorkflow(workflowId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("project_workflows").select("*, project_workflow_steps(*), workflow_templates(*, workflow_template_steps(*, tools(*)))").eq("id", workflowId).maybeSingle();
  if (error || !data) notFound();
  const steps = [...(data.project_workflow_steps ?? [])].sort((a, b) => a.step_order - b.step_order);
  const templateSteps = data.workflow_templates?.workflow_template_steps ?? [];
  const guidedSteps = steps.map((step) => buildGuidedStepDetail({ templateSlug: data.workflow_templates?.slug ?? "", step, templateStep: templateSteps.find((candidate) => candidate.step_order === step.step_order) }));
  return { ...data, project_workflow_steps: steps, guidedSteps, progress: calculateProgressFromSteps(steps) };
}
