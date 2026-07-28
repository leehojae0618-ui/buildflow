import type { RuntimeExecutionRequest } from "../agents/runtime-execution-request";
import type { RuntimePlan } from "../agents/runtime-plan";

export const runtimeApprovalScope = "CORE_RUNTIME_PROVIDER_EXECUTION" as const;
export type RuntimeApprovalScope = typeof runtimeApprovalScope;

export const runtimeApprovalStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REVOKED",
  "EXPIRED",
  "CONSUMED",
] as const;
export type RuntimeApprovalStatus = (typeof runtimeApprovalStatuses)[number];

export type RuntimeApprovalBinding = {
  projectId: string;
  userId: string;
  scope: RuntimeApprovalScope;
  runtimeExecutionRequestId: string;
  runtimeExecutionRequestChecksum: string;
  runtimePlanId: string;
  runtimePlanChecksum: string;
  provider: "openai";
  model: string;
  safeInputChecksum: string;
  bindingChecksum: string;
};

export type RuntimeApprovalRequest = RuntimeApprovalBinding & {
  approvalId: string;
  status: RuntimeApprovalStatus;
  createdAt: string;
  expiresAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  revokedAt?: string;
  consumedAt?: string;
  approvedByUserId?: string;
  rejectedByUserId?: string;
  revokedByUserId?: string;
};

export type RuntimeApprovalEventType =
  | "CREATED"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED"
  | "EXPIRED"
  | "CONSUMED";

export type RuntimeApprovalFailureCode =
  | "RUNTIME_APPROVAL_INVALID"
  | "RUNTIME_APPROVAL_NOT_FOUND"
  | "RUNTIME_APPROVAL_NOT_AUTHORIZED"
  | "RUNTIME_APPROVAL_SCOPE_MISMATCH"
  | "RUNTIME_APPROVAL_BINDING_MISMATCH"
  | "RUNTIME_APPROVAL_EXPIRED"
  | "RUNTIME_APPROVAL_REVOKED"
  | "RUNTIME_APPROVAL_CONSUMED"
  | "RUNTIME_APPROVAL_NOT_APPROVED"
  | "RUNTIME_APPROVAL_PERSISTENCE_FAILED";

export type RuntimeApprovalFailure = { code: RuntimeApprovalFailureCode; target?: string };

export type BuildRuntimeApprovalBindingInput = {
  projectId: string;
  userId: string;
  runtimeExecutionRequest: RuntimeExecutionRequest;
  runtimePlan: RuntimePlan;
};

export type BuildRuntimeApprovalBindingResult =
  | { status: "VALID"; value: RuntimeApprovalBinding; failures: [] }
  | { status: "INVALID"; failures: RuntimeApprovalFailure[] };

export type CreateRuntimeApprovalInput = {
  binding: RuntimeApprovalBinding;
};

export type DecideRuntimeApprovalInput = {
  approvalId: string;
  projectId: string;
  userId: string;
  decision: "APPROVE" | "REJECT" | "REVOKE";
};

export type ConsumeRuntimeApprovalInput = {
  approvalId: string;
  binding: RuntimeApprovalBinding;
};
