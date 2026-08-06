import { applyRemediation, createApprovalGateRemediation } from "./remediation";
import { createInitialInquiryBlueprint } from "./canonical-blueprint";
import { normalizeSimulatedEvidence } from "./evidence";
import { createReverificationLink } from "./reverification";
import { evaluateAcceptance } from "./verdict";
import type { AcceptanceTestCase, SimulatedExecutionResult } from "./types";

export const validInquiryApprovedTest: AcceptanceTestCase = {
  id: "VALID_INQUIRY_APPROVED",
  title: "승인된 문의 전달",
  preconditions: ["Approval 상태가 APPROVED입니다."],
  input: "배송 문의가 접수되었습니다.",
  expectedObservations: ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "APPROVAL_STATUS_APPROVED", "SLACK_DELIVERY_ATTEMPTED_AFTER_APPROVAL"],
  forbiddenObservations: ["SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL"],
  severity: "HIGH",
};

export const deliveryBeforeApprovalTest: AcceptanceTestCase = {
  id: "DELIVERY_BEFORE_APPROVAL",
  title: "승인 전 Slack 전달 차단",
  preconditions: ["Approval 상태가 APPROVED가 아닙니다."],
  input: "환불 문의가 접수되었습니다.",
  expectedObservations: ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "APPROVAL_GATE_ENFORCED", "SLACK_DELIVERY_BLOCKED_UNTIL_APPROVED"],
  forbiddenObservations: ["SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL"],
  severity: "CRITICAL",
};

const initialResult: SimulatedExecutionResult = {
  executionId: "simulation.inquiry.before-approval.v1",
  executionMode: "SIMULATED",
  platform: "FIXTURE",
  testCaseId: "DELIVERY_BEFORE_APPROVAL",
  observations: ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL"],
  occurredAt: "2026-08-06T00:00:00.000Z",
  source: "LV5_FIRST_VERTICAL_SLICE_FIXTURE",
};

const correctedResult: SimulatedExecutionResult = {
  executionId: "simulation.inquiry.reverification.v1",
  executionMode: "SIMULATED",
  platform: "FIXTURE",
  testCaseId: "DELIVERY_BEFORE_APPROVAL",
  observations: ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "APPROVAL_GATE_ENFORCED", "SLACK_DELIVERY_BLOCKED_UNTIL_APPROVED"],
  occurredAt: "2026-08-06T00:05:00.000Z",
  source: "LV5_FIRST_VERTICAL_SLICE_FIXTURE",
};

export function createInquiryVerificationLoopFixture() {
  const initialBlueprint = createInitialInquiryBlueprint();
  const initialEvidence = normalizeSimulatedEvidence(deliveryBeforeApprovalTest, initialResult);
  const initialVerdict = evaluateAcceptance(deliveryBeforeApprovalTest, initialEvidence);
  const remediation = createApprovalGateRemediation(initialBlueprint, initialVerdict);
  const remediatedBlueprint = applyRemediation(initialBlueprint, remediation);
  const reverificationEvidence = normalizeSimulatedEvidence(deliveryBeforeApprovalTest, correctedResult);
  const reverificationVerdict = evaluateAcceptance(deliveryBeforeApprovalTest, reverificationEvidence);
  const lineage = createReverificationLink(
    deliveryBeforeApprovalTest,
    initialResult,
    initialVerdict,
    remediation.id,
    correctedResult,
    reverificationVerdict,
  );
  return {
    goal: initialBlueprint.goal,
    acceptanceTests: [validInquiryApprovedTest, deliveryBeforeApprovalTest] as const,
    initialBlueprint,
    initialResult,
    initialEvidence,
    initialVerdict,
    remediation,
    remediatedBlueprint,
    reverificationResult: correctedResult,
    reverificationEvidence,
    reverificationVerdict,
    lineage,
  };
}
