import { slackConnectionTestMessage, type SlackAccountReference, type SlackConnectLink, type SlackTestActionPreparation, type SlackTestActionResult } from "./types";

export const slackActionCandidate = "slack-send-message-to-channel" as const;

export type PipedreamConnectPort = {
  createSlackConnectLink(input: { externalUserId: string; appOrigin: string }): Promise<SlackConnectLink>;
  listSlackAccounts(input: { externalUserId: string }): Promise<SlackAccountReference[]>;
  prepareSlackTestAction(): SlackTestActionPreparation;
  runSlackTestAction(input: { externalUserId: string; targetConfigurationReference: string }): Promise<SlackTestActionResult>;
};

export class FakePipedreamConnectAdapter implements PipedreamConnectPort {
  invocationCount = { createSlackConnectLink: 0, listSlackAccounts: 0, runSlackTestAction: 0 };
  slackAccounts: SlackAccountReference[];
  listSlackAccountsError: Error | null;

  constructor(options: { slackAccounts?: SlackAccountReference[]; listSlackAccountsError?: Error | null } = {}) {
    this.slackAccounts = options.slackAccounts ?? [];
    this.listSlackAccountsError = options.listSlackAccountsError ?? null;
  }

  async createSlackConnectLink(): Promise<SlackConnectLink> {
    this.invocationCount.createSlackConnectLink += 1;
    return { connectLinkUrl: "https://connect.example.test/link?app=slack", expiresAt: "2026-08-14T00:05:00.000Z" };
  }

  async listSlackAccounts(): Promise<SlackAccountReference[]> {
    this.invocationCount.listSlackAccounts += 1;
    if (this.listSlackAccountsError) throw this.listSlackAccountsError;
    return this.slackAccounts.map((account) => ({ ...account }));
  }

  prepareSlackTestAction(): SlackTestActionPreparation {
    return { componentKey: slackActionCandidate, componentVersion: null, status: "METADATA_RESOLUTION_REQUIRED", testMessage: slackConnectionTestMessage };
  }

  async runSlackTestAction(): Promise<SlackTestActionResult> {
    this.invocationCount.runSlackTestAction += 1;
    return { safeExternalReference: "pd_fake_action" };
  }
}
