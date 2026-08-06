import type { N8nFixtureResult } from "./result-adapter";

export const n8nForbiddenDeliveryFixture: N8nFixtureResult = {
  workflowId: "inquiry-approval-v1",
  executionId: "before-approval-v1",
  status: "SUCCESS",
  observations: ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL"],
  startedAt: "2026-08-06T01:10:00.000Z",
  finishedAt: "2026-08-06T01:10:05.000Z",
};

export const n8nApprovedDeliveryFixture: N8nFixtureResult = {
  workflowId: "inquiry-approval-v1",
  executionId: "approved-v1",
  status: "SUCCESS",
  observations: ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "APPROVAL_STATUS_APPROVED", "SLACK_DELIVERY_ATTEMPTED_AFTER_APPROVAL"],
  startedAt: "2026-08-06T01:15:00.000Z",
  finishedAt: "2026-08-06T01:15:05.000Z",
};
