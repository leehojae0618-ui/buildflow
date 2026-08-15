import { describe, expect, it } from "vitest";
import type { LiveRecipeEnvironment } from "./live-environment";
import type { LiveUserIdentityProvider } from "./identity";
import { FakePipedreamConnectAdapter } from "./pipedream-port";
import { InMemorySlackWriteIdempotency, markSlackConnectReturnedUnverified, prepareSlackConnectLink, prepareSlackTestAction, runApprovedSlackTestWrite, type LiveRecipeServiceDependencies } from "./live-recipe-service";
import { slackConnectionTestMessage } from "./types";

const recipeId = "recipe.ai-news-slack-digest";
const identity: LiveUserIdentityProvider = { resolve: async () => ({ ok: true, value: { internalUserId: "server-user-1", externalUserId: "buildflow_server_derived", safeReference: "user_server_derived" } }) };
const environment = (overrides: Partial<LiveRecipeEnvironment> = {}): LiveRecipeEnvironment => ({
  liveConnectEnabled: false,
  liveSlackWriteEnabled: false,
  pipedreamEnvironment: "development",
  pipedreamClientId: "client-id",
  pipedreamClientSecret: "client-secret",
  pipedreamProjectId: "project-id",
  appOrigin: "http://localhost:3000",
  nodeEnvironment: "test",
  ...overrides,
});
const dependencies = (overrides: Omit<LiveRecipeServiceDependencies, "adapter"> & { adapter?: FakePipedreamConnectAdapter } = {}) => {
  const adapter = overrides.adapter ?? new FakePipedreamConnectAdapter();
  return { environment: environment(), identityProvider: identity, now: () => new Date("2026-08-14T00:00:00.000Z"), createAttemptId: () => "live-recipe-test", ...overrides, adapter };
};
const verifiedSlackAccount = { safeExternalReference: "pd_verified_slack" };

describe("FIRST-LIVE-RECIPE-E2E-001 Phase A", () => {
  it("keeps kill switches default OFF and stops before the adapter", async () => {
    let identityCalls = 0;
    const identityProvider: LiveUserIdentityProvider = { resolve: async () => { identityCalls += 1; return identity.resolve(environment()); } };
    const deps = dependencies({ identityProvider });
    const result = await prepareSlackConnectLink(recipeId, deps);
    expect(result).toMatchObject({ ok: false, errorCode: "LIVE_DISABLED", connectionState: "DISABLED" });
    expect(deps.adapter.invocationCount.createSlackConnectLink).toBe(0);
    expect(identityCalls).toBe(0);
  });

  it("uses only a server-derived external user identity", async () => {
    const deps = dependencies({ environment: environment({ liveConnectEnabled: true }) });
    const result = await prepareSlackConnectLink(recipeId, deps);
    expect(result.ok).toBe(true);
    expect(deps.adapter.invocationCount.createSlackConnectLink).toBe(1);
  });

  it("rejects client-supplied external user IDs", async () => {
    const deps = dependencies({ environment: environment({ liveConnectEnabled: true, liveSlackWriteEnabled: true }) });
    const result = await runApprovedSlackTestWrite({ approved: true, recipeId, targetConfigurationReference: "slack-channel", requestId: "slack-test-request-12345678", externalUserId: "browser-user" } as never, deps);
    expect(result).toMatchObject({ ok: false, errorCode: "WRITE_NOT_APPROVED" });
    expect(deps.adapter.invocationCount.runSlackTestAction).toBe(0);
  });

  it("rejects production and missing Pipedream configuration before invoking the adapter", async () => {
    const production = dependencies({ environment: environment({ liveConnectEnabled: true, pipedreamEnvironment: "production" }) });
    expect(await prepareSlackConnectLink(recipeId, production)).toMatchObject({ ok: false, errorCode: "PRODUCTION_ENVIRONMENT_FORBIDDEN" });
    const missing = dependencies({ environment: environment({ liveConnectEnabled: true, pipedreamClientSecret: undefined }) });
    expect(await prepareSlackConnectLink(recipeId, missing)).toMatchObject({ ok: false, errorCode: "CONFIGURATION_MISSING" });
    expect(production.adapter.invocationCount.createSlackConnectLink + missing.adapter.invocationCount.createSlackConnectLink).toBe(0);
  });

  it("prepares a Slack-only Connect Link without exposing a raw token", async () => {
    const deps = dependencies({ environment: environment({ liveConnectEnabled: true }) });
    const result = await prepareSlackConnectLink(recipeId, deps);
    expect(result).toMatchObject({ ok: true, connectionState: "CONNECT_LINK_READY", value: { connectLinkUrl: expect.stringContaining("app=slack") } });
    expect(JSON.stringify(result)).not.toContain("connect-token");
  });

  it("does not treat an OAuth return as a verified Slack account", () => {
    expect(markSlackConnectReturnedUnverified(recipeId, dependencies())).toMatchObject({ ok: false, errorCode: "CONNECT_RETURNED_UNVERIFIED", connectionState: "RETURNED_UNVERIFIED" });
  });

  it("keeps the required Slack test message as data, not an automatic write", () => {
    expect(slackConnectionTestMessage).toBe("BuildFlow 연결 테스트가 성공했습니다. ✅");
  });

  it("requires the second write switch and explicit approval before test-write adapter invocation", async () => {
    const deps = dependencies({ environment: environment({ liveConnectEnabled: true }) });
    const result = await prepareSlackTestAction(recipeId, deps);
    expect(result).toMatchObject({ ok: false, errorCode: "WRITE_DISABLED" });
    expect(deps.adapter.invocationCount.runSlackTestAction).toBe(0);
  });

  it("rejects a missing explicit approval", async () => {
    const deps = dependencies({ environment: environment({ liveConnectEnabled: true, liveSlackWriteEnabled: true }) });
    const result = await runApprovedSlackTestWrite({ approved: false, recipeId, targetConfigurationReference: "slack-channel", requestId: "slack-test-request-12345678" } as never, deps);
    expect(result).toMatchObject({ ok: false, errorCode: "WRITE_NOT_APPROVED" });
    expect(deps.adapter.invocationCount.runSlackTestAction).toBe(0);
  });

  it("blocks an approved write without a verified Slack account", async () => {
    const deps = dependencies({ environment: environment({ liveConnectEnabled: true, liveSlackWriteEnabled: true }) });
    const result = await runApprovedSlackTestWrite({ approved: true, recipeId, targetConfigurationReference: "slack-channel", requestId: "slack-test-request-no-account" }, deps);
    expect(result).toMatchObject({ ok: false, errorCode: "SLACK_ACCOUNT_NOT_VERIFIED", connectionState: "NOT_CONNECTED" });
    expect(deps.adapter.invocationCount.listSlackAccounts).toBe(1);
    expect(deps.adapter.invocationCount.runSlackTestAction).toBe(0);
  });

  it("allows an approved write only after the fake adapter verifies Slack", async () => {
    const adapter = new FakePipedreamConnectAdapter({ slackAccounts: [verifiedSlackAccount] });
    const result = await runApprovedSlackTestWrite({ approved: true, recipeId, targetConfigurationReference: "slack-channel", requestId: "slack-test-request-verified" }, dependencies({ environment: environment({ liveConnectEnabled: true, liveSlackWriteEnabled: true }), adapter }));
    expect(result).toMatchObject({ ok: true, connectionState: "CONNECTED_VERIFIED" });
    expect(adapter.invocationCount.listSlackAccounts).toBe(1);
    expect(adapter.invocationCount.runSlackTestAction).toBe(1);
  });

  it("reports account lookup failure without attempting a Slack write", async () => {
    const adapter = new FakePipedreamConnectAdapter({ listSlackAccountsError: new Error("lookup unavailable") });
    const result = await runApprovedSlackTestWrite({ approved: true, recipeId, targetConfigurationReference: "slack-channel", requestId: "slack-test-request-lookup-error" }, dependencies({ environment: environment({ liveConnectEnabled: true, liveSlackWriteEnabled: true }), adapter }));
    expect(result).toMatchObject({ ok: false, errorCode: "EXTERNAL_ACTION_FAILED", connectionState: "FAILED" });
    expect(adapter.invocationCount.runSlackTestAction).toBe(0);
  });

  it("guards duplicate requests and emits safe evidence", async () => {
    const deps = dependencies({ environment: environment({ liveConnectEnabled: true, liveSlackWriteEnabled: true }), adapter: new FakePipedreamConnectAdapter({ slackAccounts: [verifiedSlackAccount] }), idempotency: new InMemorySlackWriteIdempotency() });
    const request = { approved: true as const, recipeId, targetConfigurationReference: "slack-channel", requestId: "slack-test-request-12345678" };
    const first = await runApprovedSlackTestWrite(request, deps);
    const duplicate = await runApprovedSlackTestWrite(request, deps);
    expect(first).toMatchObject({ ok: true });
    expect(duplicate).toMatchObject({ ok: false, errorCode: "DUPLICATE_REQUEST" });
    expect(deps.adapter.invocationCount.runSlackTestAction).toBe(1);
    expect(JSON.stringify(first.evidence)).not.toMatch(/client-secret|token|authorization/i);
  });

  it("does not convert adapter failures into success", async () => {
    const adapter = new FakePipedreamConnectAdapter({ slackAccounts: [verifiedSlackAccount] });
    adapter.runSlackTestAction = async () => { throw new Error("upstream"); };
    const result = await runApprovedSlackTestWrite({ approved: true, recipeId, targetConfigurationReference: "slack-channel", requestId: "slack-test-request-abcdefgh" }, dependencies({ environment: environment({ liveConnectEnabled: true, liveSlackWriteEnabled: true }), adapter }));
    expect(result).toMatchObject({ ok: false, errorCode: "EXTERNAL_ACTION_FAILED" });
  });

  it("keeps a failed requestId blocked while allowing a new explicit retry requestId", async () => {
    const adapter = new FakePipedreamConnectAdapter({ slackAccounts: [verifiedSlackAccount] });
    const idempotency = new InMemorySlackWriteIdempotency();
    const successfulRun = adapter.runSlackTestAction.bind(adapter);
    adapter.runSlackTestAction = async () => { adapter.invocationCount.runSlackTestAction += 1; throw new Error("temporary failure"); };
    const deps = dependencies({ environment: environment({ liveConnectEnabled: true, liveSlackWriteEnabled: true }), adapter, idempotency });
    const failedRequest = { approved: true as const, recipeId, targetConfigurationReference: "slack-channel", requestId: "slack-test-request-attempt-a" };
    expect(await runApprovedSlackTestWrite(failedRequest, deps)).toMatchObject({ ok: false, errorCode: "EXTERNAL_ACTION_FAILED" });
    expect(idempotency.state(failedRequest.requestId)).toBe("FAILED");
    expect(await runApprovedSlackTestWrite(failedRequest, deps)).toMatchObject({ ok: false, errorCode: "DUPLICATE_REQUEST" });
    adapter.runSlackTestAction = successfulRun;
    const retry = await runApprovedSlackTestWrite({ ...failedRequest, requestId: "slack-test-request-attempt-b" }, deps);
    expect(retry).toMatchObject({ ok: true });
    expect(adapter.invocationCount.runSlackTestAction).toBe(2);
  });
});
