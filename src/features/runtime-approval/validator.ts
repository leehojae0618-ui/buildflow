import { createHash } from "node:crypto";
import { validateRuntimePlan } from "../agents/runtime-plan";
import {
  runtimeApprovalScope,
  type BuildRuntimeApprovalBindingInput,
  type BuildRuntimeApprovalBindingResult,
  type RuntimeApprovalBinding,
  type RuntimeApprovalFailure,
} from "./types";

const sha256 = /^[a-f0-9]{64}$/;

function fail(code: RuntimeApprovalFailure["code"], target?: string): RuntimeApprovalFailure {
  return { code, ...(target ? { target } : {}) };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

/**
 * Stable JSON serialization for the safe approval binding only. It must never
 * receive prompt text, credentials, provider payloads, or SDK objects.
 */
export function canonicalSerializeRuntimeApprovalBinding(
  binding: Omit<RuntimeApprovalBinding, "bindingChecksum">,
) {
  return JSON.stringify(canonicalize(binding));
}

export function checksumRuntimeApprovalBinding(
  binding: Omit<RuntimeApprovalBinding, "bindingChecksum">,
) {
  return createHash("sha256")
    .update(canonicalSerializeRuntimeApprovalBinding(binding))
    .digest("hex");
}

export function buildRuntimeApprovalBinding(
  input: BuildRuntimeApprovalBindingInput,
): BuildRuntimeApprovalBindingResult {
  const failures: RuntimeApprovalFailure[] = [];
  const request = input.runtimeExecutionRequest;
  const plan = input.runtimePlan;
  if (!input.projectId.trim()) failures.push(fail("RUNTIME_APPROVAL_INVALID", "projectId"));
  if (!input.userId.trim()) failures.push(fail("RUNTIME_APPROVAL_INVALID", "userId"));
  if (!validateRuntimePlan(plan).valid) failures.push(fail("RUNTIME_APPROVAL_INVALID", "runtimePlan"));
  if (!sha256.test(request.integrityChecksum)) {
    failures.push(fail("RUNTIME_APPROVAL_INVALID", "runtimeExecutionRequestChecksum"));
  }
  if (!sha256.test(plan.integrityChecksum)) {
    failures.push(fail("RUNTIME_APPROVAL_INVALID", "runtimePlanChecksum"));
  }
  if (
    plan.runtimeExecutionRequestReference.runtimeExecutionRequestId !== request.runtimeExecutionRequestId ||
    plan.runtimeExecutionRequestReference.integrityChecksum !== request.integrityChecksum
  ) {
    failures.push(fail("RUNTIME_APPROVAL_BINDING_MISMATCH", "runtimePlan.runtimeExecutionRequestReference"));
  }
  const step = plan.steps[0];
  if (!step || step.provider !== "openai" || !step.model.trim() || !sha256.test(step.safeInputChecksum)) {
    failures.push(fail("RUNTIME_APPROVAL_INVALID", "runtimePlan.steps[0]"));
  }
  if (failures.length) return { status: "INVALID", failures };
  const core = {
    projectId: input.projectId.trim(),
    userId: input.userId.trim(),
    scope: runtimeApprovalScope,
    runtimeExecutionRequestId: request.runtimeExecutionRequestId,
    runtimeExecutionRequestChecksum: request.integrityChecksum,
    runtimePlanId: plan.runtimePlanId,
    runtimePlanChecksum: plan.integrityChecksum,
    provider: "openai" as const,
    model: step.model,
    safeInputChecksum: step.safeInputChecksum,
  };
  return {
    status: "VALID",
    value: { ...core, bindingChecksum: checksumRuntimeApprovalBinding(core) },
    failures: [],
  };
}

export function validateRuntimeApprovalBinding(binding: RuntimeApprovalBinding) {
  const core = {
    projectId: binding.projectId,
    userId: binding.userId,
    scope: binding.scope,
    runtimeExecutionRequestId: binding.runtimeExecutionRequestId,
    runtimeExecutionRequestChecksum: binding.runtimeExecutionRequestChecksum,
    runtimePlanId: binding.runtimePlanId,
    runtimePlanChecksum: binding.runtimePlanChecksum,
    provider: binding.provider,
    model: binding.model,
    safeInputChecksum: binding.safeInputChecksum,
  };
  return Boolean(
    binding.projectId.trim() &&
      binding.userId.trim() &&
      binding.scope === runtimeApprovalScope &&
      binding.runtimeExecutionRequestId.trim() &&
      binding.runtimePlanId.trim() &&
      binding.model.trim() &&
      sha256.test(binding.runtimeExecutionRequestChecksum) &&
      sha256.test(binding.runtimePlanChecksum) &&
      sha256.test(binding.safeInputChecksum) &&
      sha256.test(binding.bindingChecksum) &&
      checksumRuntimeApprovalBinding(core) === binding.bindingChecksum,
  );
}
