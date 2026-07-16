"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseProjectForm } from "@/features/projects/validation";
import type { ProjectFormState } from "@/features/projects/types";
import { createRequirementSnapshot } from "@/features/requirements/snapshot";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/projects");
  return { supabase, user };
}

export async function createProject(_state: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const parsed = parseProjectForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };
  const { supabase, user } = await requireUser();
  const requirementSnapshot = createRequirementSnapshot(parsed.data.goal, { automation_level: parsed.data.automation_level, budget_range: parsed.data.budget_range, current_tools: parsed.data.current_tools });
  const { data, error } = await supabase.from("projects").insert({ user_id: user.id, title: parsed.data.title, goal: parsed.data.goal, goal_description: parsed.data.description || null, goal_constraints: { ...parsed.data, requirement_snapshot: requirementSnapshot } }).select("id").single();
  if (error || !data) return { error: "프로젝트를 생성하지 못했습니다. 잠시 후 다시 시도해주세요." };
  revalidatePath("/app");
  revalidatePath("/app/projects");
  redirect(`/app/projects/${data.id}`);
}

export async function updateProject(_state: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const projectId = String(formData.get("projectId") || "");
  const parsed = parseProjectForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) return { error: "프로젝트를 찾을 수 없습니다." };
  const { supabase, user } = await requireUser();
  const requirementSnapshot = createRequirementSnapshot(parsed.data.goal, { automation_level: parsed.data.automation_level, budget_range: parsed.data.budget_range, current_tools: parsed.data.current_tools });
  const { error } = await supabase.from("projects").update({ title: parsed.data.title, goal: parsed.data.goal, goal_description: parsed.data.description || null, goal_constraints: { ...parsed.data, requirement_snapshot: requirementSnapshot } }).eq("id", projectId).eq("user_id", user.id);
  if (error) return { error: "프로젝트를 수정하지 못했습니다. 잠시 후 다시 시도해주세요." };
  revalidatePath("/app"); revalidatePath("/app/projects"); revalidatePath(`/app/projects/${projectId}`);
  return {};
}

export async function archiveProject(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("projects").update({ status: "archived" }).eq("id", projectId).eq("user_id", user.id);
  if (error) redirect(`/app/projects/${projectId}?error=archive`);
  revalidatePath("/app"); revalidatePath("/app/projects");
  redirect("/app/projects");
}
