import type { MakeFixtureResult } from "./result-adapter";

export const makeForbiddenDeliveryFixture: MakeFixtureResult = {
  scenarioId: "inquiry-approval-v1",
  executionId: "before-approval-v1",
  status: "SUCCESS",
  observations: ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL"],
  startedAt: "2026-08-06T01:00:00.000Z",
  finishedAt: "2026-08-06T01:00:05.000Z",
};

export const makeApprovedDeliveryFixture: MakeFixtureResult = {
  scenarioId: "inquiry-approval-v1",
  executionId: "approved-v1",
  status: "SUCCESS",
  observations: ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "APPROVAL_STATUS_APPROVED", "SLACK_DELIVERY_ATTEMPTED_AFTER_APPROVAL"],
  startedAt: "2026-08-06T01:05:00.000Z",
  finishedAt: "2026-08-06T01:05:05.000Z",
};
