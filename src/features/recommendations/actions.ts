"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProject } from "@/features/projects/queries";
import { normalizeRecommendationInput } from "@/features/recommendations/normalize";
import { recommend } from "@/features/recommendations/engine";
import { enrichRecommendationWithOpenAI } from "@/features/recommendations/enrich";
import { recommendationRequestSchema } from "@/features/recommendations/validation";
import { logRecommendationDatabaseError, logRecommendationError, logRecommendationEvent, type RecommendationStage } from "@/features/recommendations/debug";

const stage = (name: RecommendationStage, projectId?: string, recommendationId?: string) => { const started = Date.now(); logRecommendationEvent({ event: "recommendation_stage_started", stage: name, projectId, recommendationId }); return (candidateCount?: number, code?: string) => { logRecommendationEvent({ event: "recommendation_stage_completed", stage: name, projectId, recommendationId, durationMs: Date.now() - started, candidateCount, code }); }; };
async function fail(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, projectId: string, code: string, stageName: RecommendationStage, recommendationId?: string) { logRecommendationError({ event: "recommendation_stage_failed", stage: stageName, code, projectId, recommendationId }); if (recommendationId) await supabase.from("recommendations").update({ status: "failed", input_snapshot: { failure: { stage: stageName, code, failed_at: new Date().toISOString() } } }).eq("id", recommendationId); redirect(`/app/projects/${projectId}?recommendation=error&code=${encodeURIComponent(code)}&stage=${stageName}`); }

export async function createRecommendation(formData: FormData) {
  const parsed = recommendationRequestSchema.safeParse({ projectId: formData.get("projectId") });
  if (!parsed.success) redirect("/app/projects");
  const supabase = await createSupabaseServerClient();
  const authDone = stage("auth");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=/app/projects/${parsed.data.projectId}`);
  authDone();
  const projectDone = stage("project", parsed.data.projectId);
  let project;
  try { project = await getProject(parsed.data.projectId); } catch { return fail(supabase, parsed.data.projectId, "project_not_found", "project"); }
  projectDone();
  const processingDone = stage("processing-check", project.id);
  const { data: processing } = await supabase.from("recommendations").select("id").eq("project_id", project.id).eq("status", "pending").maybeSingle();
  processingDone();
  if (processing) redirect(`/app/projects/${project.id}?recommendation=processing&code=recommendation_in_progress`);
  const createDone = stage("recommendation-create", project.id);
  const recommendationPayload = { project_id: project.id, user_id: user.id, status: "pending" as const, input_snapshot: { engine_version: "recommendation-v1-rule", started_at: new Date().toISOString() } };
  const { data: recommendation, error: recommendationError } = await supabase.from("recommendations").insert(recommendationPayload).select("id").single();
  if (recommendationError) logRecommendationDatabaseError({ stage: "recommendation-create", operation: "recommendations.insert.select.single", projectId: project.id, code: recommendationError.code, message: recommendationError.message, details: recommendationError.details, hint: recommendationError.hint, payloadKeys: Object.keys(recommendationPayload) });
  if (recommendationError || !recommendation) return fail(supabase, project.id, "recommendation_create_failed", "recommendation-create");
  createDone(undefined, "pending");
  const normalizeDone = stage("normalize", project.id, recommendation.id);
  const input = normalizeRecommendationInput(project);
  normalizeDone();
  const templateDone = stage("template-query", project.id, recommendation.id);
  const { data: templates, error: templateError } = await supabase.from("workflow_templates").select("*").eq("is_active", true);
  if (templateError) return fail(supabase, project.id, "template_query_failed", "template-query", recommendation.id);
  if (!templates?.length) return fail(supabase, project.id, "no_templates", "template-query", recommendation.id);
  const { data: steps, error: stepsError } = await supabase.from("workflow_template_steps").select("workflow_template_id, tool_id, tools(slug)");
  if (stepsError) return fail(supabase, project.id, "template_query_failed", "template-query", recommendation.id);
  templateDone(templates.length);
  const engineTemplates = templates.map((template) => ({ ...template, steps: (steps ?? []).filter((step) => step.workflow_template_id === template.id).map((step) => ({ toolSlug: (step.tools as { slug?: string } | null)?.slug ?? "" })) }));
  const ruleDone = stage("rule-engine", project.id, recommendation.id);
  const result = recommend(input, engineTemplates);
  ruleDone(result.candidates.length);
  const openaiDone = stage("openai", project.id, recommendation.id);
  const enrichment = await enrichRecommendationWithOpenAI({ goal: input.goalOriginal, candidates: result.candidates.map((candidate) => ({ id: candidate.template.id, title: candidate.template.name, score: candidate.score.total, reason: candidate.reason, difficulty: candidate.template.difficulty, setupMinutes: candidate.template.estimated_setup_minutes, executionSupport: candidate.template.execution_support_level, tools: candidate.template.steps.map((step) => step.toolSlug) })) });
  openaiDone(result.candidates.length, enrichment.status === "fallback" ? enrichment.errorCode : "completed");
  if (enrichment.status === "fallback") logRecommendationEvent({ event: "recommendation_openai_fallback", stage: "openai", projectId: project.id, recommendationId: recommendation.id, code: enrichment.errorCode });
  const explanations = enrichment.status === "completed" ? new Map(enrichment.explanation.candidates.map((candidate) => [candidate.candidateId, candidate])) : new Map();
  const candidates = result.candidates.map((candidate, index) => { const explanation = explanations.get(candidate.template.id); return { recommendation_id: recommendation.id, workflow_template_id: candidate.template.id, rank: index + 1, score: candidate.score.total, reason: explanation?.explanation ?? candidate.reason, snapshot: { title: candidate.template.name, summary: candidate.template.description, difficulty: candidate.template.difficulty, setup_minutes: candidate.template.estimated_setup_minutes, execution_support: candidate.template.execution_support_level, cost: JSON.stringify(candidate.template.cost_model), breakdown: candidate.score, low_confidence: candidate.lowConfidence, enrichment: explanation ? { headline: explanation.headline, fit_reasons: explanation.fitReasons, cautions: explanation.cautions, next_step: explanation.nextStep } : { status: "fallback" } } }; });
  const candidateDone = stage("candidate-save", project.id, recommendation.id);
  const { error: candidateError } = await supabase.from("recommendation_candidates").insert(candidates);
  if (candidateError) return fail(supabase, project.id, "candidate_save_failed", "candidate-save", recommendation.id);
  candidateDone(candidates.length);
  const finalizeDone = stage("recommendation-finalize", project.id, recommendation.id);
  const { error: finalizeError } = await supabase.from("recommendations").update({ status: "completed", input_snapshot: { engine_version: "recommendation-v1-rule", input_summary: { goal: input.goalOriginal, categories: result.categories }, low_confidence: result.lowConfidence, enrichment: enrichment.status === "completed" ? { status: "completed", provider: enrichment.provider, model: enrichment.model } : { status: "fallback", error_code: enrichment.errorCode } } }).eq("id", recommendation.id);
  if (finalizeError) return fail(supabase, project.id, "recommendation_finalize_failed", "recommendation-finalize", recommendation.id);
  finalizeDone(candidates.length);
  revalidatePath("/app"); revalidatePath(`/app/projects/${project.id}`);
  logRecommendationEvent({ event: "recommendation_completed", stage: "redirect", projectId: project.id, recommendationId: recommendation.id, candidateCount: candidates.length });
  redirect(`/app/projects/${project.id}?recommendation=ready`);
}
