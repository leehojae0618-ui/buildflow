"use client";

import { useFormStatus } from "react-dom";
import { toggleWorkflowStep } from "@/features/workflows/actions";

function SubmitButton({ completed }: { completed: boolean }) { const { pending } = useFormStatus(); return <button type="submit" disabled={pending} className="mt-2 text-left text-sm text-cyan-300 disabled:opacity-50">{pending ? "저장 중..." : completed ? "완료 취소" : "완료 처리"}</button>; }
export function WorkflowStepChecklist({ workflowId, steps }: { workflowId: string; steps: { id: string; title: string; description: string; is_completed: boolean }[] }) {
  return <div className="mt-8 grid gap-3">{steps.map((step, index) => <form action={toggleWorkflowStep} key={step.id} className={`border p-4 ${step.is_completed ? "border-emerald-400/40 bg-emerald-400/5" : "border-zinc-800"}`}><input type="hidden" name="workflowId" value={workflowId} /><input type="hidden" name="stepId" value={step.id} /><input type="hidden" name="nextCompletedState" value={String(!step.is_completed)} /><label className="flex gap-4"><span aria-hidden="true" className={`mt-1 h-4 w-4 rounded-sm border ${step.is_completed ? "border-emerald-300 bg-emerald-300" : "border-zinc-600"}`} /><span><span className="text-xs text-cyan-300">Step {index + 1}</span><span className={`mt-1 block font-medium ${step.is_completed ? "text-emerald-200 line-through" : "text-zinc-100"}`}>{step.title}</span><span className="mt-1 block text-sm text-zinc-500">{step.description}</span><SubmitButton completed={step.is_completed} /></span></label></form>)}</div>;
}
