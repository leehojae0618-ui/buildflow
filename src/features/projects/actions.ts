"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseProjectForm } from "@/features/projects/validation";
import type { ProjectFormState } from "@/features/projects/types";
import { createRequirementSnapshot } from "@/features/requirements/snapshot";
import { generateArchitectureCandidates } from "@/features/architecture/candidates";
import { validateCandidateSelection } from "@/features/architecture/selection";
import { resolveRequiredConnectors } from "@/features/connectors/resolver";
import { createCredentialReferences } from "@/features/credentials/references";
import { createAccountConnectionSession } from "@/features/connectors/oauth";
import { calculateBuildIntelligence } from "@/features/requirements/intelligence";
import { generateBuildPlan } from "@/features/planner/generator";
import { createInstallationSession } from "@/features/installation/session";
import { createTestSuite } from "@/features/testing/engine";
import type { ArchitectureCandidates } from "@/features/architecture/candidates";
import type { BuildPreference } from "@/features/preferences/types";
import type { Requirement, ConsentRequirement, CapabilitySummary, ClarificationSummary } from "@/features/requirements/types";
import { normalizeBuildPreference } from "@/features/preferences/types";

type StoredSelectionSnapshot = { [key: string]: unknown; requirement: Requirement; architectureCandidates: ArchitectureCandidates; buildPreference?: BuildPreference; consents?: ConsentRequirement[]; capabilitySummary: CapabilitySummary; clarificationSummary?: ClarificationSummary };

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
  const requirementSnapshot = createRequirementSnapshot(parsed.data.goal, { ...parsed.data, current_tools: parsed.data.current_tools });
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
  const requirementSnapshot = createRequirementSnapshot(parsed.data.goal, { ...parsed.data, current_tools: parsed.data.current_tools });
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

export async function selectProjectArchitectureCandidate(formData: FormData): Promise<ProjectFormState> {
  const projectId = String(formData.get("projectId") ?? "");
  const candidateId = String(formData.get("candidateId") ?? "");
  const confirmOverBudget = formData.get("confirmOverBudget") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(projectId) || !candidateId) return { error: "후보 선택 요청이 올바르지 않습니다." };
  const { supabase, user } = await requireUser();
  const { data: project, error: projectError } = await supabase.from("projects").select("goal_constraints").eq("id", projectId).eq("user_id", user.id).single();
  if (projectError || !project) return { error: "프로젝트를 찾을 수 없습니다." };
  const constraints = (project.goal_constraints ?? {}) as Record<string, unknown>;
  const snapshot = constraints.requirement_snapshot as StoredSelectionSnapshot | undefined;
  if (!snapshot?.requirement || !snapshot.architectureCandidates) return { error: "이 프로젝트는 후보 선택을 다시 계산해야 합니다." };
  const preference = normalizeBuildPreference(snapshot.buildPreference ?? {});
  const currentCandidates = generateArchitectureCandidates(snapshot.requirement, preference);
  const storedCandidates = snapshot.architectureCandidates;
  const candidate = storedCandidates.candidates.find((item: { id: string }) => item.id === candidateId);
  const regenerated = currentCandidates.candidates.find((item) => item.id === candidateId);
  if (!candidate || !regenerated || JSON.stringify(candidate.architecture) !== JSON.stringify(regenerated.architecture)) return { error: "후보 정보가 변경되어 다시 생성해야 합니다." };
  const selection = validateCandidateSelection(storedCandidates, { candidateId, confirmOverBudget, excludedTools: preference.excludedTools ?? [] });
  if (!selection.ok) return { error: selection.reason === "OUT_OF_BUDGET" ? "예산 초과 후보는 동의 후 선택할 수 있습니다." : selection.reason === "EXCLUDED_TOOL" ? "제외한 Tool이 포함된 후보는 선택할 수 없습니다." : "선택할 수 없는 후보입니다." };
  const architecture = regenerated.architecture;
  const consents = snapshot.consents ?? [];
  const capabilitySummary = snapshot.capabilitySummary;
  const buildIntelligence = calculateBuildIntelligence(snapshot.requirement, architecture, capabilitySummary, consents, snapshot.clarificationSummary?.buildReadiness ?? 0);
  const buildPlan = generateBuildPlan({ requirement: snapshot.requirement, architecture, intelligence: buildIntelligence });
  const connectors = resolveRequiredConnectors(snapshot.requirement, architecture);
  const credentialReferences = createCredentialReferences(connectors);
  const connectorsWithReferences = connectors.map((connector) => ({ ...connector, credentialReference: credentialReferences.find((reference) => reference.providerId === connector.providerId) }));
  const nextSnapshot = { ...snapshot, architecture, architectureCandidates: { ...storedCandidates, selectedCandidateId: candidateId }, selectedCandidateId: candidateId, selectedStrategy: regenerated.strategy, selectedAt: new Date().toISOString(), selectedArchitectureSnapshot: architecture, buildPreferenceSnapshotVersion: preference.version ?? "build-preference-v1", architectureCandidatesSnapshotVersion: storedCandidates.version, buildIntelligence, buildPlan, connectors: connectorsWithReferences, credentialReferences, accountConnection: createAccountConnectionSession(connectorsWithReferences), installation: createInstallationSession(buildPlan), testSuite: createTestSuite({ architecture, buildPlan, installation: createInstallationSession(buildPlan) }) };
  const { error } = await supabase.from("projects").update({ goal_constraints: { ...constraints, requirement_snapshot: nextSnapshot } }).eq("id", projectId).eq("user_id", user.id);
  if (error) return { error: "후보 선택을 저장하지 못했습니다." };
  revalidatePath(`/app/projects/${projectId}`);
  return {};
}
