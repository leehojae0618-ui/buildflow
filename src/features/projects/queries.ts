import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getProjects() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("projects").select("*").neq("status", "archived").order("updated_at", { ascending: false });
  if (error) throw new Error("프로젝트를 불러오지 못했습니다.");
  return data;
}

export async function getRecentProjects(limit = 3) {
  const projects = await getProjects();
  return projects.slice(0, limit);
}

export async function getProject(projectId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (error || !data) notFound();
  return data;
}
