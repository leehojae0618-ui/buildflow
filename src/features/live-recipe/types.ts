import { z } from "zod";

export const liveConnectionStates = [
  "DISABLED",
  "NOT_CONNECTED",
  "CONNECT_LINK_READY",
  "AUTHORIZING",
  "RETURNED_UNVERIFIED",
  "CONNECTED_VERIFIED",
  "FAILED",
] as const;

export const liveRecipeFailureCodes = [
  "LIVE_DISABLED",
  "CONFIGURATION_MISSING",
  "AUTH_REQUIRED",
  "IDENTITY_UNAVAILABLE",
  "PRODUCTION_ENVIRONMENT_FORBIDDEN",
  "CONNECT_LINK_CREATION_FAILED",
  "CONNECT_CANCELLED",
  "CONNECT_RETURNED_UNVERIFIED",
  "SLACK_ACCOUNT_NOT_VERIFIED",
  "WRITE_NOT_APPROVED",
  "WRITE_DISABLED",
  "DUPLICATE_REQUEST",
  "EXTERNAL_ACTION_FAILED",
  "TIMEOUT",
] as const;

export type LiveConnectionState = (typeof liveConnectionStates)[number];
export type LiveRecipeFailureCode = (typeof liveRecipeFailureCodes)[number];

export type LiveRecipeEvidence = {
  attemptId: string;
  recipeId: string;
  engine: "PIPEDREAM";
  service: "SLACK";
  actionType: "CONNECT_LINK" | "TEST_MESSAGE";
  externalUserSafeReference: string;
  requestedAt: string;
  completedAt?: string;
  status: "PREPARED" | "SUCCEEDED" | "FAILED" | "BLOCKED";
  safeExternalReference?: string;
  failureCode?: LiveRecipeFailureCode;
};

export type SlackConnectLink = {
  connectLinkUrl: string;
  expiresAt: string;
};

export type SlackAccountReference = {
  safeExternalReference: string;
};

export type SlackTestActionPreparation = {
  componentKey: "slack-send-message-to-channel";
  componentVersion: null;
  status: "METADATA_RESOLUTION_REQUIRED";
  testMessage: typeof slackConnectionTestMessage;
};

export type SlackTestActionResult = {
  safeExternalReference: string;
};

export type LiveRecipeResult<T> =
  | { ok: true; value: T; connectionState: LiveConnectionState; evidence: LiveRecipeEvidence }
  | { ok: false; errorCode: LiveRecipeFailureCode; connectionState: LiveConnectionState; evidence: LiveRecipeEvidence };

export const slackWriteRequestSchema = z.object({
  approved: z.literal(true),
  recipeId: z.string().regex(/^recipe\.[a-z0-9-]+$/),
  targetConfigurationReference: z.string().min(3).max(160),
  requestId: z.string().regex(/^slack-test-[a-zA-Z0-9_-]{8,120}$/),
}).strict();

export type SlackWriteRequest = z.infer<typeof slackWriteRequestSchema>;

export const slackConnectionTestMessage = "BuildFlow 연결 테스트가 성공했습니다. ✅";
