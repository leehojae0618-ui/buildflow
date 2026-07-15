import Link from "next/link";
import { getProjectWorkflow } from "@/features/workflows/queries";
import { WorkflowStepChecklist } from "@/components/workflow-step-checklist";

export default async function WorkflowDetailPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  const workflow = await getProjectWorkflow(workflowId);
  const template = workflow.workflow_templates;
  const snapshot = (workflow.snapshot ?? {}) as Record<string, unknown>;
  const steps = [...(workflow.project_workflow_steps ?? [])].sort((a, b) => a.step_order - b.step_order);
  return <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100"><section className="mx-auto max-w-3xl"><Link href={`/app/projects/${workflow.project_id}`} className="text-sm text-cyan-300">← 프로젝트로 돌아가기</Link><p className="mt-8 text-xs uppercase tracking-[0.2em] text-zinc-600">Workflow Guide</p><h1 className="mt-2 text-3xl font-semibold">{template?.name ?? String(snapshot.name ?? "Workflow")}</h1><p className="mt-3 max-w-2xl text-zinc-400">{template?.description ?? String(snapshot.description ?? "")}</p><div className="mt-6 grid gap-3 text-sm text-zinc-400 sm:grid-cols-3"><div className="border border-zinc-800 p-4">상태<br /><strong className="text-zinc-100">{workflow.status}</strong></div><div className="border border-zinc-800 p-4">난이도<br /><strong className="text-zinc-100">{template?.difficulty ?? String(snapshot.difficulty ?? "확인 필요")}</strong></div><div className="border border-zinc-800 p-4">예상 시간<br /><strong className="text-zinc-100">{template?.estimated_setup_minutes ?? String(snapshot.estimated_setup_minutes ?? "확인 필요")}분</strong></div></div><h2 className="mt-10 text-lg font-medium">Step-by-Step 실행 가이드</h2><WorkflowStepChecklist steps={steps} /></section></main>;
}
