import "server-only";

import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "../agents/package-export";
import { executeMinimumRuntime } from "../agents/runtime-orchestrator";
import { digestProviderSafeValue, type ProviderAdapter, type ProviderExecutionCommand } from "../agents/runtime-provider";
import { InMemoryRuntimeEvidenceRepository } from "../agents/runtime-evidence-repository";
import { validateRuntimeApprovalBinding } from "../runtime-approval/validator";
import type { RuntimeApprovalRepository, RuntimeApprovalRepositoryResult } from "../runtime-approval/repository";
import type { ConsumeRuntimeApprovalInput, CreateRuntimeApprovalInput, DecideRuntimeApprovalInput, RuntimeApprovalFailure, RuntimeApprovalRequest } from "../runtime-approval/types";
import type { Bf0RuntimeProjection } from "../product-experience/bf0-runtime-projection";
import { executeApprovedProductRuntime } from "./execute-approved-product-runtime";
import type { ExecuteApprovedProductRuntimeResult } from "./types";

const fixedNow = "2026-08-13T00:00:00.000Z";

const checksum = (value: unknown) => createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");
const failed = (code: RuntimeApprovalFailure["code"]): RuntimeApprovalRepositoryResult<never> => ({ status: "FAILED", failures: [{ code }] });

export class ControlledProviderAdapter implements ProviderAdapter {
  calls = 0;

  async execute(command: ProviderExecutionCommand) {
    this.calls += 1;
    const reference = digestProviderSafeValue({ runtimeExecutionId: command.runtimeExecutionId, runtimeStepId: command.runtimeStepId, runtimeStepAttemptId: command.runtimeStepAttemptId, safeInputChecksum: command.safeInputChecksum });
    return { status: "SUCCEEDED" as const, providerRequestReference: `controlled-provider:${reference.slice(0, 24)}`, outputReference: `controlled-output:${reference.slice(0, 24)}`, outputChecksum: checksum({ reference, kind: "controlled-internal-reference" }), latencyMs: 0 };
  }
}

export class InvocationLocalRuntimeApprovalRepository implements RuntimeApprovalRepository {
  private value: RuntimeApprovalRequest | null = null;

  async create(input: CreateRuntimeApprovalInput) {
    if (!validateRuntimeApprovalBinding(input.binding) || this.value) return failed("RUNTIME_APPROVAL_INVALID");
    const approvalId = `controlled-approval-${checksum(input.binding).slice(0, 24)}`;
    this.value = { ...input.binding, approvalId, status: "PENDING", createdAt: fixedNow, expiresAt: "2026-08-13T00:05:00.000Z" };
    return { status: "OK" as const, value: this.value, failures: [] as [] };
  }

  async decide(input: DecideRuntimeApprovalInput) {
    if (!this.value || this.value.approvalId !== input.approvalId || this.value.projectId !== input.projectId || this.value.userId !== input.userId) return failed("RUNTIME_APPROVAL_NOT_FOUND");
    if (this.value.status !== "PENDING") return failed("RUNTIME_APPROVAL_NOT_APPROVED");
    this.value = input.decision === "APPROVE" ? { ...this.value, status: "APPROVED", approvedAt: fixedNow, approvedByUserId: input.userId } : { ...this.value, status: "REJECTED", rejectedAt: fixedNow, rejectedByUserId: input.userId };
    return { status: "OK" as const, value: this.value, failures: [] as [] };
  }

  async get(approvalId: string, projectId: string, userId: string) {
    if (!this.value || this.value.approvalId !== approvalId || this.value.projectId !== projectId || this.value.userId !== userId) return failed("RUNTIME_APPROVAL_NOT_FOUND");
    return { status: "OK" as const, value: this.value, failures: [] as [] };
  }

  async consume(input: ConsumeRuntimeApprovalInput) {
    if (!this.value || this.value.approvalId !== input.approvalId) return failed("RUNTIME_APPROVAL_NOT_FOUND");
    if (!validateRuntimeApprovalBinding(input.binding) || input.binding.bindingChecksum !== this.value.bindingChecksum) return failed("RUNTIME_APPROVAL_BINDING_MISMATCH");
    if (this.value.status === "CONSUMED") return failed("RUNTIME_APPROVAL_CONSUMED");
    if (this.value.status !== "APPROVED") return failed("RUNTIME_APPROVAL_NOT_APPROVED");
    this.value = { ...this.value, status: "CONSUMED", consumedAt: fixedNow };
    return { status: "OK" as const, value: this.value, failures: [] as [] };
  }
}

export type ControlledProductRuntimeResult = ExecuteApprovedProductRuntimeResult & {
  controlled: true;
  evidenceStorage: "INVOCATION_LOCAL_MEMORY";
};

export async function executeControlledProductRuntime(projection: Extract<Bf0RuntimeProjection, { status: "ELIGIBLE" }>): Promise<ControlledProductRuntimeResult> {
  const approvalRepository = new InvocationLocalRuntimeApprovalRepository();
  const created = await approvalRepository.create({ binding: projection.runtimeApprovalBinding });
  if (created.status !== "OK") return { status: "REJECTED", errorCode: "APPROVAL_NOT_USABLE", userMessage: "The controlled runtime approval is unavailable.", failures: ["APPROVAL_NOT_USABLE"], controlled: true, evidenceStorage: "INVOCATION_LOCAL_MEMORY" };
  const approved = await approvalRepository.decide({ approvalId: created.value.approvalId, projectId: projection.projectId, userId: projection.userId, decision: "APPROVE" });
  if (approved.status !== "OK") return { status: "REJECTED", errorCode: "APPROVAL_NOT_USABLE", userMessage: "The controlled runtime approval is unavailable.", failures: ["APPROVAL_NOT_USABLE"], controlled: true, evidenceStorage: "INVOCATION_LOCAL_MEMORY" };
  const result = await executeApprovedProductRuntime({ projectId: projection.projectId, approvalRequestId: created.value.approvalId, runtimeExecutionRequest: projection.runtimeExecutionRequest, runtimePlan: projection.runtimePlan, transientProviderInput: projection.transientProviderInput }, {
    resolveOwnedProject: async () => ({ projectId: projection.projectId, userId: projection.userId }),
    approvalRepository,
    evidenceRepository: new InMemoryRuntimeEvidenceRepository(),
    provider: new ControlledProviderAdapter(),
    isProviderConfigured: () => true,
    executeRuntime: executeMinimumRuntime,
    now: () => new Date(fixedNow),
  });
  return { ...result, controlled: true, evidenceStorage: "INVOCATION_LOCAL_MEMORY" };
}
