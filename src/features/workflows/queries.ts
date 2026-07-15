import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateWorkflowProgress } from "@/features/workflows/progress";

export async function getProjectWorkflow(workflowId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("project_workflows").select("*, project_workflow_steps(*), workflow_templates(*, workflow_template_steps(*, tools(*)))").eq("id", workflowId).maybeSingle();
  if (error || !data) notFound();
  const steps = [...(data.project_workflow_steps ?? [])].sort((a, b) => a.step_order - b.step_order);
  return { ...data, project_workflow_steps: steps, progress: calculateWorkflowProgress(steps.length, steps.filter((step) => step.is_completed).length) };
}
