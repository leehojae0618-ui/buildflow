"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProject } from "@/features/projects/queries";
import { normalizeRecommendationInput } from "@/features/recommendations/normalize";
import { recommend } from "@/features/recommendations/engine";
import { enrichRecommendationWithOpenAI } from "@/features/recommendations/enrich";
import { recommendationRequestSchema } from "@/features/recommendations/validation";

export async function createRecommendation(formData: FormData) {
  const parsed = recommendationRequestSchema.safeParse({ projectId: formData.get("projectId") });
  if (!parsed.success) redirect("/app/projects");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/projects/${parsed.data.projectId}`);
  const project = await getProject(parsed.data.projectId);
  const { data: processing } = await supabase.from("recommendations").select("id").eq("project_id", project.id).eq("status", "processing").maybeSingle();
  if (processing) redirect(`/app/projects/${project.id}?recommendation=processing`);
  const { data: templates, error: templateError } = await supabase.from("workflow_templates").select("*").eq("is_active", true);
  if (templateError || !templates?.length) redirect(`/app/projects/${project.id}?recommendation=error`);
  const { data: steps } = await supabase.from("workflow_template_steps").select("workflow_template_id, tool_id, tools(slug)");
  const engineTemplates = templates.map((template) => ({ ...template, steps: (steps ?? []).filter((step) => step.workflow_template_id === template.id).map((step) => ({ toolSlug: (step.tools as { slug?: string } | null)?.slug ?? "" })) }));
  const input = normalizeRecommendationInput(project);
  const result = recommend(input, engineTemplates);
  const { data: recommendation, error: recommendationError } = await supabase.from("recommendations").insert({ project_id: project.id, user_id: user.id, status: "processing", input_snapshot: { engine_version: "recommendation-v1-rule", input_summary: { goal: input.goalOriginal, categories: result.categories }, low_confidence: result.lowConfidence } }).select("id").single();
  if (recommendationError || !recommendation) redirect(`/app/projects/${project.id}?recommendation=error`);
  const enrichment = await enrichRecommendationWithOpenAI({ goal: input.goalOriginal, candidates: result.candidates.map((candidate) => ({ id: candidate.template.id, title: candidate.template.name, score: candidate.score.total, reason: candidate.reason, difficulty: candidate.template.difficulty, setupMinutes: candidate.template.estimated_setup_minutes, executionSupport: candidate.template.execution_support_level, tools: candidate.template.steps.map((step) => step.toolSlug) })) });
  const explanations = enrichment.status === "completed" ? new Map(enrichment.explanation.candidates.map((candidate) => [candidate.candidateId, candidate])) : new Map();
  const candidates = result.candidates.map((candidate, index) => { const explanation = explanations.get(candidate.template.id); return { recommendation_id: recommendation.id, workflow_template_id: candidate.template.id, rank: index + 1, score: candidate.score.total, reason: explanation?.explanation ?? candidate.reason, snapshot: { title: candidate.template.name, summary: candidate.template.description, difficulty: candidate.template.difficulty, setup_minutes: candidate.template.estimated_setup_minutes, execution_support: candidate.template.execution_support_level, cost: JSON.stringify(candidate.template.cost_model), breakdown: candidate.score, low_confidence: candidate.lowConfidence, enrichment: explanation ? { headline: explanation.headline, fit_reasons: explanation.fitReasons, cautions: explanation.cautions, next_step: explanation.nextStep } : { status: "fallback" } } }; });
  const { error: candidateError } = await supabase.from("recommendation_candidates").insert(candidates);
  if (candidateError) { await supabase.from("recommendations").update({ status: "failed" }).eq("id", recommendation.id); redirect(`/app/projects/${project.id}?recommendation=error`); }
  await supabase.from("recommendations").update({ status: "completed", input_snapshot: { engine_version: "recommendation-v1-rule", input_summary: { goal: input.goalOriginal, categories: result.categories }, low_confidence: result.lowConfidence, enrichment: enrichment.status === "completed" ? { status: "completed", provider: enrichment.provider, model: enrichment.model } : { status: "fallback", error_code: enrichment.errorCode } } }).eq("id", recommendation.id);
  revalidatePath("/app"); revalidatePath(`/app/projects/${project.id}`);
  redirect(`/app/projects/${project.id}?recommendation=ready`);
}
