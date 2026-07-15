import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getProjectWorkflow(workflowId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("project_workflows").select("*, project_workflow_steps(*), workflow_templates(*, workflow_template_steps(*, tools(*)))").eq("id", workflowId).maybeSingle();
  if (error || !data) notFound();
  return data;
}
