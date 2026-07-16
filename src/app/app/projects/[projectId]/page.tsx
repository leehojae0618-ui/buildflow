import Link from "next/link";
import { getProject } from "@/features/projects/queries";
import { updateProject, selectProjectArchitectureCandidate } from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/components/project-form";
import { ArchiveProjectButton } from "@/features/projects/components/archive-project-button";
import { RecommendationButton } from "@/features/recommendations/components/recommendation-button";
import { getLatestRecommendation } from "@/features/recommendations/queries";
import { RecommendationResults } from "@/features/recommendations/components/recommendation-results";
import { getRecommendationErrorMessage } from "@/features/recommendations/errors";
import { RequirementSummary } from "@/features/requirements/components/requirement-summary";
import { normalizeArchitectureSnapshot } from "@/features/architecture/fallback";
import { startBuildExecution } from "@/features/execution/actions";
import { getLatestVerificationRun } from "@/features/verification/repository";

export default async function ProjectDetailPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ error?: string; code?: string; stage?: string; recommendation?: string }> }) {
  const { projectId } = await params;
  const { error, code, stage: failedStage, recommendation: recommendationState } = await searchParams;
  const project = await getProject(projectId);
  const recommendation = await getLatestRecommendation(projectId);
  const verificationRun = await getLatestVerificationRun(projectId);
  const constraints = (project.goal_constraints ?? {}) as Record<string, unknown>;
  const rawRequirementSnapshot = constraints.requirement_snapshot as Record<string, unknown> | undefined;
  const requirementSnapshot = rawRequirementSnapshot ? { ...rawRequirementSnapshot, architecture: normalizeArchitectureSnapshot(rawRequirementSnapshot.architecture) ?? undefined } : undefined;
  const tools = Array.isArray(constraints.current_tools) ? constraints.current_tools.join(", ") : String(constraints.current_tools ?? "없음");
  const debugInfo = process.env.NODE_ENV === "development" && code && failedStage ? `${failedStage} / ${code}` : null;
  const snapshot = recommendation?.input_snapshot as { low_confidence?: boolean } | null;
  return <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100"><section className="mx-auto max-w-2xl"><Link href="/app/projects" className="text-sm text-cyan-300">← 프로젝트 목록</Link><div className="mt-8 flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-zinc-600">Project Detail</p><h1 className="mt-2 text-3xl font-semibold">{project.title}</h1></div><span className="border border-zinc-700 px-3 py-1 text-xs text-zinc-400">{project.status}</span></div>{debugInfo && <p className="mt-3 text-xs text-zinc-600">Debug: {debugInfo}</p>}{error === "archive" && <p role="alert" className="mt-6 border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">프로젝트를 보관하지 못했습니다.</p>}{recommendationState === "error" && <p role="alert" className="mt-6 border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{code ? getRecommendationErrorMessage(code) : "추천을 생성하지 못했습니다. 잠시 후 다시 시도해주세요."}</p>}<RequirementSummary snapshot={requirementSnapshot} projectId={project.id} selectCandidateAction={selectProjectArchitectureCandidate} startExecutionAction={startBuildExecution} persistedVerificationRun={verificationRun} /><div className="mt-8 border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8"><h2 className="mb-6 text-lg font-medium">프로젝트 정보 수정</h2><ProjectForm action={updateProject} project={project} /><dl className="mt-8 grid gap-4 border-t border-zinc-800 pt-6 text-sm sm:grid-cols-2"><Info label="AI 숙련도" value={String(constraints.ai_skill_level ?? "-")} /><Info label="개발 가능 여부" value={constraints.can_code === "true" || constraints.can_code === true ? "가능" : "어려움"} /><Info label="예산" value={String(constraints.budget_range ?? "-")} /><Info label="자동화 수준" value={String(constraints.automation_level ?? "-")} /><Info label="현재 도구" value={tools} /><Info label="생성일" value={new Date(project.created_at).toLocaleString("ko-KR")} /><Info label="수정일" value={new Date(project.updated_at).toLocaleString("ko-KR")} /></dl><div className="mt-8 border-t border-zinc-800 pt-6"><p className="text-sm font-medium text-zinc-300">프로젝트 관리</p><p className="mt-2 text-sm text-zinc-500">이 프로젝트를 보관하면 기본 목록과 Dashboard에서 숨겨집니다.</p><div className="mt-4"><ArchiveProjectButton projectId={project.id} /></div></div></div><section className="mt-8 border border-zinc-800 bg-zinc-950/70 p-6"><h2 className="text-lg font-medium">추천 설계</h2>{recommendation ? <RecommendationResults candidates={recommendation.recommendation_candidates} lowConfidence={Boolean(snapshot?.low_confidence)} /> : <><p className="mt-2 text-sm text-zinc-500">입력한 목표와 조건을 기준으로 적합한 워크플로를 비교합니다.</p><div className="mt-5"><RecommendationButton projectId={project.id} /></div></>}</section></section></main>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-zinc-600">{label}</dt><dd className="mt-1 text-zinc-300">{value}</dd></div>; }
