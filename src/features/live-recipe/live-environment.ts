export type LiveRecipeEnvironment = {
  liveConnectEnabled: boolean;
  liveSlackWriteEnabled: boolean;
  pipedreamEnvironment: "development" | "production" | "invalid";
  pipedreamClientId?: string;
  pipedreamClientSecret?: string;
  pipedreamProjectId?: string;
  liveTestUserId?: string;
  approvedSlackAccountId?: string;
  approvedSlackChannelId?: string;
  appOrigin: string;
  nodeEnvironment: string;
};

export function readLiveRecipeEnvironment(source: NodeJS.ProcessEnv = process.env): LiveRecipeEnvironment {
  const environment = source.PIPEDREAM_ENVIRONMENT ?? "development";
  return {
    liveConnectEnabled: source.BUILDFLOW_LIVE_CONNECT_ENABLED === "true",
    liveSlackWriteEnabled: source.BUILDFLOW_LIVE_SLACK_WRITE_ENABLED === "true",
    pipedreamEnvironment: environment === "development" || environment === "production" ? environment : "invalid",
    pipedreamClientId: source.PIPEDREAM_CLIENT_ID || undefined,
    pipedreamClientSecret: source.PIPEDREAM_CLIENT_SECRET || undefined,
    pipedreamProjectId: source.PIPEDREAM_PROJECT_ID || undefined,
    liveTestUserId: source.BUILDFLOW_LIVE_TEST_USER_ID || undefined,
    approvedSlackAccountId: source.BUILDFLOW_LIVE_SLACK_ACCOUNT_ID || undefined,
    approvedSlackChannelId: source.BUILDFLOW_LIVE_SLACK_CHANNEL_ID || undefined,
    appOrigin: source.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    nodeEnvironment: source.NODE_ENV || "development",
  };
}

export function hasPipedreamConfiguration(environment: LiveRecipeEnvironment) {
  return Boolean(environment.pipedreamClientId && environment.pipedreamClientSecret && environment.pipedreamProjectId);
}
