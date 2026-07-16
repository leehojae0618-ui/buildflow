import type { ExecutionResult } from "./runtime";
import type { ExecutionError } from "./types";
export type ExecutorContext = { executionId: string; task: { taskKey: string; title: string; action: string }; artifacts: Record<string, string> };
export interface ExecutorAdapter { prepare(context: ExecutorContext): Promise<ExecutionResult>; execute(context: ExecutorContext): Promise<ExecutionResult>; verify(context: ExecutorContext): Promise<ExecutionResult>; rollback(context: ExecutorContext): Promise<ExecutionResult>; cancel(context: ExecutorContext): Promise<ExecutionResult>; resume(context: ExecutorContext): Promise<ExecutionResult>; }
export type { ExecutionError };
