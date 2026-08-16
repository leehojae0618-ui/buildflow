import "server-only";

import { createHash } from "node:crypto";
import { Pipedream, PipedreamClient } from "@pipedream/sdk";
import type { LiveRecipeEnvironment } from "./live-environment";
import { slackActionCandidate, type PipedreamConnectPort } from "./pipedream-port";
import { slackConnectionTestMessage } from "./types";

function safeReference(value: string) { return `pd_${createHash("sha256").update(value).digest("hex").slice(0, 12)}`; }

function createServerClient(environment: LiveRecipeEnvironment) {
  if (!environment.pipedreamClientId || !environment.pipedreamClientSecret || !environment.pipedreamProjectId) throw new Error("PIPEDREAM_CONFIGURATION_MISSING");
  return new PipedreamClient({
    clientId: environment.pipedreamClientId,
    clientSecret: environment.pipedreamClientSecret,
    projectId: environment.pipedreamProjectId,
    projectEnvironment: Pipedream.ProjectEnvironment.Development,
  });
}

/** This adapter is server-only and is loaded only after all Live gates pass. */
export function createRealPipedreamConnectAdapter(environment: LiveRecipeEnvironment): PipedreamConnectPort {
  const client = createServerClient(environment);
  return {
    async createSlackConnectLink(input) {
      const redirect = new URL("/app/live-recipe/slack/return", input.appOrigin).toString();
      const created = await client.tokens.create({ externalUserId: input.externalUserId, allowedOrigins: [new URL(input.appOrigin).origin], successRedirectUri: redirect, errorRedirectUri: redirect, scope: "connect:*", expiresIn: 300 }, { maxRetries: 0, projectEnvironment: Pipedream.ProjectEnvironment.Development });
      const link = new URL(created.connectLinkUrl);
      link.searchParams.set("app", "slack");
      return { connectLinkUrl: link.toString(), expiresAt: created.expiresAt.toISOString() };
    },
    async listSlackAccounts(input) {
      const accounts = await client.accounts.list({ externalUserId: input.externalUserId, app: "slack", includeCredentials: false }, { maxRetries: 0, projectEnvironment: Pipedream.ProjectEnvironment.Development });
      const safeAccounts = [];
      for await (const account of accounts) safeAccounts.push({ safeExternalReference: safeReference(account.id) });
      return safeAccounts;
    },
    prepareSlackTestAction() { return { componentKey: slackActionCandidate, componentVersion: null, status: "METADATA_RESOLUTION_REQUIRED", testMessage: slackConnectionTestMessage }; },
    async runSlackTestAction(input) {
      const result = await client.actions.run({ id: slackActionCandidate, externalUserId: input.externalUserId, configuredProps: { buildflowTargetReference: input.targetConfigurationReference } }, { maxRetries: 0, projectEnvironment: Pipedream.ProjectEnvironment.Development });
      return { safeExternalReference: safeReference(JSON.stringify(result)) };
    },
    async runSlackDigestAction(input) {
      const accounts = await client.accounts.list({ externalUserId: input.externalUserId, app: "slack", includeCredentials: false }, { maxRetries: 0, projectEnvironment: Pipedream.ProjectEnvironment.Development });
      let slackAccountId = "";
      for await (const account of accounts) {
        if (account.id === input.approvedSlackAccountId && account.healthy !== false && !account.dead) {
          slackAccountId = account.id;
          break;
        }
      }
      if (!slackAccountId) throw new Error("SLACK_ACCOUNT_NOT_VERIFIED");

      const configuredProps = {
        slack: { authProvisionId: slackAccountId },
        conversation: input.targetConfigurationReference,
        text: input.message,
      };
      const result = await client.actions.run({ id: slackActionCandidate, externalUserId: input.externalUserId, configuredProps }, { maxRetries: 0, projectEnvironment: Pipedream.ProjectEnvironment.Development });
      const returned = result.ret && typeof result.ret === "object" ? result.ret as Record<string, unknown> : {};
      const slackTimestamp = typeof returned.ts === "string" ? returned.ts : undefined;
      return { safeExternalReference: safeReference(JSON.stringify(result)), ...(slackTimestamp ? { slackTimestamp } : {}) };
    },
  };
}
