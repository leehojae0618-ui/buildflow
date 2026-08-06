import { withApprovalGate, createInitialInquiryBlueprint } from "../verification-loop/canonical-blueprint";
import { deliveryBeforeApprovalTest, validInquiryApprovedTest } from "../verification-loop/fixtures";
import { buildNoKeyExecutionPackage } from "./package-builder";
import type { NoKeyResultSubmission } from "./types";

export const noKeyBlueprint = withApprovalGate(createInitialInquiryBlueprint());
export const noKeyN8nPackage = buildNoKeyExecutionPackage("N8N", noKeyBlueprint);
export const noKeyMakePackage = buildNoKeyExecutionPackage("MAKE", noKeyBlueprint);

export const approvedNoKeySubmission: NoKeyResultSubmission = {
  platform: "N8N",
  blueprintChecksum: noKeyN8nPackage.blueprintChecksum,
  testCaseId: validInquiryApprovedTest.id,
  claimedStatus: "SUCCEEDED",
  externalWorkflowReference: "user-n8n-workflow-reference",
  externalExecutionReference: "user-n8n-execution-reference",
  observations: ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "APPROVAL_STATUS_APPROVED", "SLACK_DELIVERY_ATTEMPTED_AFTER_APPROVAL"],
  submittedAt: "2026-08-06T03:00:00.000Z",
  userConfirmed: true,
  sanitizedLogExcerpt: "User confirmed a completed run without sensitive details.",
};

export const forbiddenNoKeySubmission: NoKeyResultSubmission = {
  ...approvedNoKeySubmission,
  testCaseId: deliveryBeforeApprovalTest.id,
  observations: ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL"],
};
