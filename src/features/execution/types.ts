export type ExecutionStatus = "PENDING" | "BLOCKED" | "READY" | "RUNNING" | "WAITING_FOR_USER" | "WAITING_FOR_APPROVAL" | "SUCCEEDED" | "FAILED" | "SKIPPED" | "CANCELLED";
export type ExecutionTaskAction = "AUTO" | "USER_ACTION" | "EXPERT_REQUIRED";
export type ExecutionTask = { id: string; taskKey: string; title: string; action: ExecutionTaskAction; status: ExecutionStatus; dependencyKeys: string[]; retryCount: number; maxRetries: number; artifactManifest: string[] };
export type ExecutionAttempt = { id: string; taskId: string; attemptNumber: number; status: "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"; errorCode?: string; errorMessage?: string };
export type ExecutionApproval = { id: string; taskId: string; status: "PENDING" | "APPROVED" | "REJECTED"; description: string; provider?: string; estimatedCostCents: number; impact: string; reversible: boolean; decidedAt?: string };
export type ExecutionEvent = { id: string; executionId: string; taskId?: string; eventType: string; status?: ExecutionStatus; safeMetadata: Record<string, string | number | boolean> };
export type BuildExecution = { id: string; projectId: string; userId: string; idempotencyKey: string; status: ExecutionStatus; selectedCandidateId: string; selectedStrategy: string; tasks: ExecutionTask[]; attempts: ExecutionAttempt[]; approvals: ExecutionApproval[]; events: ExecutionEvent[] };
export type ExecutionError = { code: string; message: string; retryable: boolean };
