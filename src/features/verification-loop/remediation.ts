import { withApprovalGate } from "./canonical-blueprint";
import type { CanonicalBlueprint, RemediationInstruction, VerificationVerdict } from "./types";

export function createApprovalGateRemediation(
  blueprint: CanonicalBlueprint,
  verdict: VerificationVerdict,
): RemediationInstruction {
  if (verdict.status !== "FAILED" || verdict.failureCode !== "FORBIDDEN_OBSERVATION_DETECTED") {
    throw new Error("REMEDIATION_REQUIRES_FORBIDDEN_OBSERVATION_FAILURE");
  }
  if (!blueprint.steps.some((step) => step.id === "deliver-slack")) {
    throw new Error("DELIVERY_STEP_MISSING");
  }
  return {
    id: "remediation.insert-approval-gate.v1",
    failureCode: "FORBIDDEN_OBSERVATION_DETECTED",
    summary: "Slack 전달 Step 앞에 Approval Gate를 배치합니다.",
    targetStepId: "deliver-slack",
    changeType: "INSERT_APPROVAL_GATE",
    before: "Slack 전달은 요약 직후 실행될 수 있습니다.",
    after: "Slack 전달은 Approval 상태가 APPROVED일 때만 실행 가능합니다.",
    reason: "승인 전 전달 관찰을 차단합니다.",
    requiresApproval: true,
  };
}

export function applyRemediation(
  blueprint: CanonicalBlueprint,
  remediation: RemediationInstruction,
): CanonicalBlueprint {
  if (remediation.changeType !== "INSERT_APPROVAL_GATE" || remediation.targetStepId !== "deliver-slack") {
    throw new Error("UNSUPPORTED_REMEDIATION");
  }
  return withApprovalGate(blueprint);
}
