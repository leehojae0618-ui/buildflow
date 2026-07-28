import "server-only";

import { createHash } from "node:crypto";
import { hasOpenAIEnv } from "../../lib/env/server";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { stableSerializeAgentPackage } from "../agents/package-export";
import type { PackageRuntimeEvidenceReference } from "../agents/package-evidence-bundle";
import { buildRuntimePreflightResult, type RuntimePreflightResult } from "../agents/runtime-execution-start";
import { executeMinimumRuntime, type RuntimeOrchestrationOutcome } from "../agents/runtime-orchestrator";
import {
  isSafeRuntimeTransientProviderInput,
  type RuntimeTransientProviderInput,
  validateRuntimePlan,
} from "../agents/runtime-plan";
import type { ProviderAdapter } from "../agents/runtime-provider";
import type { RuntimeEvidenceRepository } from "../agents/runtime-evidence-repository";
import { SupabaseRuntimeEvidenceRepository } from "../agents/runtime-evidence-supabase";
import { createOpenAIRuntimeProviderAdapter } from "../../services/openai/runtime-provider-adapter";
import type { RuntimeApprovalRepository } from "../runtime-approval/repository";
import { SupabaseRuntimeApprovalRepository } from "../runtime-approval/runtime-approval-supabase";
import { buildRuntimeApprovalBinding } from "../runtime-approval/validator";
import type {
  ExecuteApprovedProductRuntimeInput,
  ExecuteApprovedProductRuntimeResult,
  ProductRuntimeErrorCode,
} from "./types";

type OwnedRuntimeContext = { projectId: string; userId: string };
type OwnershipResolution = OwnedRuntimeContext | "UNAUTHENTICATED" | "PROJECT_ACCESS_DENIED";

export type ProductRuntimeBridgeDependencies = {
  resolveOwnedProject?: (projectId: string) => Promise<OwnershipResolution>;
  approvalRepository?: RuntimeApprovalRepository;
  evidenceRepository?: RuntimeEvidenceRepository;
  provider?: ProviderAdapter;
  isProviderConfigured?: () => boolean;
  executeRuntime?: typeof executeMinimumRuntime;
  now?: () => Date;
};

const checksum = (value: unknown) =>
  createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");

const rejected = (errorCode: ProductRuntimeErrorCode, userMessage: string): ExecuteApprovedProductRuntimeResult => ({
  status: "REJECTED",
  errorCode,
  userMessage,
  failures: [errorCode],
});

/**
 * Runtime Plan checksums cover only these two explicitly approved transient
 * fields. Runtime callers cannot affect the binding by attaching additional
 * runtime-only object properties.
 */
function canonicalTransientProviderInput(
  input: ExecuteApprovedProductRuntimeInput["transientProviderInput"],
): RuntimeTransientProviderInput {
  return {
    systemInstruction: input.systemInstruction,
    userInput: input.userInput,
  };
}

async function resolveOwnedProject(projectId: string): Promise<OwnershipResolution> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "UNAUTHENTICATED";
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  return project ? { projectId, userId: user.id } : "PROJECT_ACCESS_DENIED";
}

function providerReadyPreflight(
  input: ExecuteApprovedProductRuntimeInput,
  approvalId: string,
  now: Date,
  providerConfigured: boolean,
): RuntimePreflightResult | null {
  const request = input.runtimeExecutionRequest;
  const plan = input.runtimePlan;
  const providerSnapshot = {
    providerReference: "openai",
    modelReference: plan.steps[0]?.model,
    status: providerConfigured ? "READY" as const : "CONFIGURATION_MISSING" as const,
    checksum: checksum({ provider: "openai", model: plan.steps[0]?.model, providerConfigured }),
  };
  const approvalSnapshot = {
    // This is an execution-authority projection after an immutable approval
    // binding has been consumed. The persisted row never enters Core Runtime.
    approvalReferenceId: approvalId,
    status: "APPROVED" as const,
    scopes: ["RUNTIME_EXECUTION"],
    packageBinding: request.packageBinding,
    evidenceBinding: request.evidenceBinding,
    runtimeExecutionRequestBinding: {
      runtimeExecutionRequestId: request.runtimeExecutionRequestId,
      integrityChecksum: request.integrityChecksum,
    },
    approvedAt: now.toISOString(),
    checksum: checksum({ approvalId, request: request.runtimeExecutionRequestId, requestChecksum: request.integrityChecksum }),
  };
  const built = buildRuntimePreflightResult({
    runtimeExecutionRequest: request,
    approvalStatusSnapshot: approvalSnapshot,
    providerReadinessSnapshots: [providerSnapshot],
    cancellationSnapshot: {
      runtimeExecutionRequestId: request.runtimeExecutionRequestId,
      status: "NONE",
      checksum: checksum({ request: request.runtimeExecutionRequestId, cancellation: "NONE" }),
    },
    idempotencySnapshot: {
      runtimeExecutionRequestId: request.runtimeExecutionRequestId,
      status: "AVAILABLE",
      evaluatedAt: now.toISOString(),
      checksum: checksum({ request: request.runtimeExecutionRequestId, idempotency: "AVAILABLE" }),
    },
    evaluatedAt: now.toISOString(),
  });
  return built.status === "VALID" ? built.value : null;
}

function safeEvidence(
  outcome: RuntimeOrchestrationOutcome,
  approvalRequestId: string,
): readonly PackageRuntimeEvidenceReference[] {
  if (!outcome.evidence) return [];
  const evidence = outcome.evidence;
  return [{
    runtimeEvidenceId: evidence.runtimeEvidenceId,
    integrityChecksum: evidence.integrityChecksum,
    runtimeExecutionId: evidence.runtimeExecutionId,
    eventType: evidence.eventType,
    status: evidence.status,
    occurredAt: evidence.occurredAt,
    ...(evidence.errorCode ? { safeErrorCode: evidence.errorCode } : {}),
    approvalRequestReference: approvalRequestId,
  }];
}

function safeOutcome(
  input: ExecuteApprovedProductRuntimeInput,
  outcome: RuntimeOrchestrationOutcome,
  approvalRequestId: string,
): ExecuteApprovedProductRuntimeResult {
  const runtimeResult = {
    ...(outcome.runtimeExecutionStart ? { executionId: outcome.runtimeExecutionStart.runtimeExecutionId } : {}),
    status: outcome.status,
    runtimeExecutionRequestId: input.runtimeExecutionRequest.runtimeExecutionRequestId,
    runtimeExecutionRequestChecksum: input.runtimeExecutionRequest.integrityChecksum,
    runtimePlanId: input.runtimePlan.runtimePlanId,
    runtimePlanChecksum: input.runtimePlan.integrityChecksum,
    ...(outcome.result ? {
      runtimeExecutionResultId: outcome.result.runtimeExecutionResultId,
      runtimeExecutionResultChecksum: outcome.result.integrityChecksum,
    } : {}),
    ...(outcome.errorCode ? { safeErrorCode: outcome.errorCode } : {}),
  };
  return {
    status: outcome.status === "SUCCEEDED" || outcome.status === "SUCCEEDED_WITH_LIMITATIONS" ? "SUCCEEDED" : "FAILED",
    runtimeResult,
    packageEvidence: { approvalRequestId, runtimeEvidenceReferences: safeEvidence(outcome, approvalRequestId) },
    failures: [],
  };
}

function failedAfterApprovalConsume(
  input: ExecuteApprovedProductRuntimeInput,
  approvalRequestId: string,
  errorCode: "RUNTIME_EXECUTION_FAILED" | "EVIDENCE_PERSISTENCE_FAILED",
): ExecuteApprovedProductRuntimeResult {
  return {
    status: "FAILED",
    runtimeResult: {
      status: "FINALIZATION_FAILED",
      runtimeExecutionRequestId: input.runtimeExecutionRequest.runtimeExecutionRequestId,
      runtimeExecutionRequestChecksum: input.runtimeExecutionRequest.integrityChecksum,
      runtimePlanId: input.runtimePlan.runtimePlanId,
      runtimePlanChecksum: input.runtimePlan.integrityChecksum,
      safeErrorCode: errorCode,
    },
    packageEvidence: { approvalRequestId, runtimeEvidenceReferences: [] },
    failures: [],
  };
}

/**
 * Product-layer composition root. It deliberately does not build plans,
 * create approvals, expose an API route, or change Core Runtime contracts.
 */
export async function executeApprovedProductRuntime(
  input: ExecuteApprovedProductRuntimeInput,
  dependencies: ProductRuntimeBridgeDependencies = {},
): Promise<ExecuteApprovedProductRuntimeResult> {
  let consumedApprovalId: string | undefined;
  try {
    const owned = await (dependencies.resolveOwnedProject ?? resolveOwnedProject)(input.projectId);
    if (owned === "UNAUTHENTICATED") return rejected("UNAUTHENTICATED", "Authentication is required.");
    if (owned === "PROJECT_ACCESS_DENIED") return rejected("PROJECT_ACCESS_DENIED", "Project access is required.");

    if (!validateRuntimePlan(input.runtimePlan).valid) {
      return rejected("INVALID_RUNTIME_PLAN", "The runtime plan is invalid.");
    }
    const transientProviderInput = canonicalTransientProviderInput(input.transientProviderInput);
    if (
      !isSafeRuntimeTransientProviderInput(transientProviderInput) ||
      checksum(transientProviderInput) !== input.runtimePlan.steps[0]?.safeInputChecksum
    ) {
      return rejected("RUNTIME_BINDING_MISMATCH", "The approved runtime bindings do not match this request.");
    }
    const binding = buildRuntimeApprovalBinding({
      projectId: owned.projectId,
      userId: owned.userId,
      runtimeExecutionRequest: input.runtimeExecutionRequest,
      runtimePlan: input.runtimePlan,
    });
    if (binding.status !== "VALID") return rejected("INVALID_RUNTIME_REQUEST", "The runtime request is invalid.");
    if (
      input.runtimePlan.runtimeExecutionRequestReference.runtimeExecutionRequestId !== input.runtimeExecutionRequest.runtimeExecutionRequestId ||
      input.runtimePlan.runtimeExecutionRequestReference.integrityChecksum !== input.runtimeExecutionRequest.integrityChecksum ||
      input.runtimePlan.steps[0]?.provider !== binding.value.provider ||
      input.runtimePlan.steps[0]?.model !== binding.value.model ||
      input.runtimePlan.steps[0]?.safeInputChecksum !== binding.value.safeInputChecksum
    ) {
      return rejected("RUNTIME_BINDING_MISMATCH", "The approved runtime bindings do not match this request.");
    }

    const approvals = dependencies.approvalRepository ?? new SupabaseRuntimeApprovalRepository();
    // This read is a defensive binding comparison only. The following consume
    // RPC remains the sole atomic authorization decision.
    const approvedBinding = await approvals.get(input.approvalRequestId, owned.projectId, owned.userId);
    if (approvedBinding.status !== "OK" || approvedBinding.value.bindingChecksum !== binding.value.bindingChecksum) {
      return rejected("RUNTIME_BINDING_MISMATCH", "The approved runtime bindings do not match this request.");
    }

    const now = dependencies.now?.() ?? new Date();
    const providerConfigured = dependencies.isProviderConfigured?.() ?? hasOpenAIEnv;
    const preflight = providerReadyPreflight(input, input.approvalRequestId, now, providerConfigured);
    if (!preflight || preflight.preflightStatus !== "READY") {
      return rejected("INVALID_RUNTIME_REQUEST", "The runtime is not ready to start.");
    }

    const consumed = await approvals.consume({ approvalId: input.approvalRequestId, binding: binding.value });
    if (consumed.status !== "OK") return rejected("APPROVAL_NOT_USABLE", "The runtime approval is not available.");
    consumedApprovalId = consumed.value.approvalId;

    const execute = dependencies.executeRuntime ?? executeMinimumRuntime;
    const outcome = await execute({
      runtimeExecutionRequest: input.runtimeExecutionRequest,
      runtimePreflightResult: preflight,
      runtimePlan: input.runtimePlan,
      initiatedByActorReference: { actorType: "USER", actorId: owned.userId },
      executionSequence: `product-runtime.${input.approvalRequestId}`,
      startedAt: now.toISOString(),
      completedAt: now.toISOString(),
      transientProviderInput,
      provider: dependencies.provider ?? createOpenAIRuntimeProviderAdapter(),
      evidenceSink: dependencies.evidenceRepository ?? new SupabaseRuntimeEvidenceRepository(),
      evidenceContext: { projectId: owned.projectId, userId: owned.userId, approvalRequestId: consumedApprovalId },
    });
    return safeOutcome(input, outcome, consumedApprovalId);
  } catch {
    return consumedApprovalId
      ? failedAfterApprovalConsume(input, consumedApprovalId, "RUNTIME_EXECUTION_FAILED")
      : rejected("APPROVAL_NOT_USABLE", "The runtime request could not be processed safely.");
  }
}
