import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function getLatestAutonomousSession(projectId: string) { const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null; const { data } = await supabase.from("autonomous_build_sessions").select("id,status").eq("project_id", projectId).eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(); return data; }
