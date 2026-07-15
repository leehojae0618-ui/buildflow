import Link from "next/link";
import { getProjectWorkflow } from "@/features/workflows/queries";
import { WorkflowStepChecklist } from "@/components/workflow-step-checklist";
import { difficultyLabel, workflowStatusLabel } from "@/features/workflows/progress";

export default async function WorkflowDetailPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  const workflow = await getProjectWorkflow(workflowId);
  const template = workflow.workflow_templates;
  const snapshot = (workflow.snapshot ?? {}) as Record<string, unknown>;
  const steps = workflow.project_workflow_steps ?? [];
  return <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100"><section className="mx-auto max-w-3xl"><Link href={`/app/projects/${workflow.project_id}`} className="text-sm text-cyan-300">← 프로젝트로 돌아가기</Link><p className="mt-8 text-xs uppercase tracking-[0.2em] text-zinc-600">Workflow Guide</p><h1 className="mt-2 text-3xl font-semibold">{template?.name ?? String(snapshot.name ?? "Workflow")}</h1><p className="mt-3 max-w-2xl text-zinc-400">{template?.description ?? String(snapshot.description ?? "")}</p><div className="mt-6 grid gap-3 text-sm text-zinc-400 sm:grid-cols-3"><div className="border border-zinc-800 p-4">상태<br /><strong className="text-zinc-100">{workflowStatusLabel[workflow.status] ?? "확인 필요"}</strong></div><div className="border border-zinc-800 p-4">난이도<br /><strong className="text-zinc-100">{difficultyLabel[template?.difficulty ?? ""] ?? "확인 필요"}</strong></div><div className="border border-zinc-800 p-4">진행률<br /><strong className="text-zinc-100">{workflow.progress.completedSteps} / {workflow.progress.totalSteps} 완료</strong></div></div><div className="mt-5" role="progressbar" aria-label="Workflow 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={workflow.progress.progressPercent}><div className="h-2 bg-zinc-800"><div className="h-2 bg-cyan-400" style={{ width: `${workflow.progress.progressPercent}%` }} /></div><p className="mt-2 text-right text-xs text-zinc-500">{workflow.progress.progressPercent}%</p></div>{workflow.progress.isCompleted && <p className="mt-6 border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">워크플로를 완료했습니다.</p>}<h2 className="mt-10 text-lg font-medium">Step-by-Step 실행 가이드</h2><WorkflowStepChecklist workflowId={workflow.id} steps={steps} /></section></main>;
}
