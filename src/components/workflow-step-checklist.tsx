"use client";

import { useState } from "react";

export function WorkflowStepChecklist({ steps }: { steps: { id: string; title: string; description: string; status: string }[] }) {
  const [completed, setCompleted] = useState(() => new Set(steps.filter((step) => step.status === "completed").map((step) => step.id)));
  return <div className="mt-8 grid gap-3">{steps.map((step, index) => { const done = completed.has(step.id); return <label key={step.id} className={`flex gap-4 border p-4 ${done ? "border-emerald-400/40 bg-emerald-400/5" : "border-zinc-800"}`}><input type="checkbox" checked={done} onChange={() => setCompleted((current) => { const next = new Set(current); if (done) next.delete(step.id); else next.add(step.id); return next; })} className="mt-1 accent-cyan-400" /><span><span className="text-xs text-cyan-300">Step {index + 1}</span><span className={`mt-1 block font-medium ${done ? "text-emerald-200 line-through" : "text-zinc-100"}`}>{step.title}</span><span className="mt-1 block text-sm text-zinc-500">{step.description}</span></span></label>; })}</div>;
}
