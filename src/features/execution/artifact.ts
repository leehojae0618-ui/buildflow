import type { ExecutorAdapter, ExecutorContext } from "./contract";
import type { ExecutionResult } from "./runtime";

function safeArtifactName(value: string) { return value.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "artifact"; }
export class ArtifactExecutor implements ExecutorAdapter {
  async prepare(context: ExecutorContext): Promise<ExecutionResult> { return { ok: true, status: "SUCCEEDED", artifacts: [`artifacts/${safeArtifactName(context.task.taskKey)}.md`] }; }
  async execute(context: ExecutorContext): Promise<ExecutionResult> { return this.prepare(context); }
  async verify(context: ExecutorContext): Promise<ExecutionResult> { return { ok: true, status: "SUCCEEDED", artifacts: [`artifacts/${safeArtifactName(context.task.taskKey)}.md`] }; }
  async rollback() { return { ok: true, status: "SUCCEEDED" as const }; }
  async cancel() { return { ok: true, status: "SUCCEEDED" as const }; }
  async resume(context: ExecutorContext) { return this.execute(context); }
}
export function artifactTemplate(context: ExecutorContext) { return `# ${context.task.title}\n\n생성된 실행 산출물입니다. 민감한 원문은 포함하지 않습니다.\n`; }
