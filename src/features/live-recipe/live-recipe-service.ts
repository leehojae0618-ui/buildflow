import { createHash, randomUUID } from "node:crypto";
import type { LiveUserIdentityProvider } from "./identity";
import { hasPipedreamConfiguration, readLiveRecipeEnvironment, type LiveRecipeEnvironment } from "./live-environment";
import type { PipedreamConnectPort } from "./pipedream-port";
import { slackDigestWriteRequestSchema, slackWriteRequestSchema, type LiveConnectionState, type LiveRecipeEvidence, type LiveRecipeFailureCode, type LiveRecipeResult, type SlackDigestWriteRequest, type SlackTestActionPreparation, type SlackWriteRequest } from "./types";

type IdempotencyState = "NEW" | "APPROVED" | "RUNNING" | "SUCCEEDED" | "FAILED";

export class InMemorySlackWriteIdempotency {
  private readonly states = new Map<string, IdempotencyState>();

  begin(requestId: string) {
    if (this.states.has(requestId)) return false;
    this.states.set(requestId, "NEW");
    this.states.set(requestId, "APPROVED");
    this.states.set(requestId, "RUNNING");
    return true;
  }

  finish(requestId: string, succeeded: boolean) {
    this.states.set(requestId, succeeded ? "SUCCEEDED" : "FAILED");
  }

  state(requestId: string) { return this.states.get(requestId); }
}

export type LiveRecipeServiceDependencies = {
  environment?: LiveRecipeEnvironment;
  identityProvider?: LiveUserIdentityProvider;
  adapter?: PipedreamConnectPort;
  idempotency?: InMemorySlackWriteIdempotency;
  now?: () => Date;
  createAttemptId?: () => string;
};

const defaultIdempotency = new InMemorySlackWriteIdempotency();

function now(dependencies: LiveRecipeServiceDependencies) { return dependencies.now?.() ?? new Date(); }
function attemptId(dependencies: LiveRecipeServiceDependencies) { return dependencies.createAttemptId?.() ?? `live-recipe-${randomUUID()}`; }
function safeUserReference(value: string) { return `user_${createHash("sha256").update(value).digest("hex").slice(0, 12)}`; }

function evidence(input: { dependencies: LiveRecipeServiceDependencies; recipeId: string; actionType: LiveRecipeEvidence["actionType"]; externalUserSafeReference?: string; status: LiveRecipeEvidence["status"]; failureCode?: LiveRecipeFailureCode; safeExternalReference?: string }): LiveRecipeEvidence {
  const requestedAt = now(input.dependencies).toISOString();
  return {
    attemptId: attemptId(input.dependencies),
    recipeId: input.recipeId,
    engine: "PIPEDREAM",
    service: "SLACK",
    actionType: input.actionType,
    externalUserSafeReference: input.externalUserSafeReference ?? safeUserReference("unresolved"),
    requestedAt,
    completedAt: input.status === "PREPARED" ? undefined : requestedAt,
    status: input.status,
    ...(input.failureCode ? { failureCode: input.failureCode } : {}),
    ...(input.safeExternalReference ? { safeExternalReference: input.safeExternalReference } : {}),
  };
}

function failed<T>(input: { dependencies: LiveRecipeServiceDependencies; recipeId: string; actionType: LiveRecipeEvidence["actionType"]; errorCode: LiveRecipeFailureCode; connectionState: LiveConnectionState; externalUserSafeReference?: string }): LiveRecipeResult<T> {
  return {
    ok: false,
    errorCode: input.errorCode,
    connectionState: input.connectionState,
    evidence: evidence({ ...input, status: "BLOCKED" }),
  };
}

async function resolveIdentity(dependencies: LiveRecipeServiceDependencies, environment: LiveRecipeEnvironment) {
  if (dependencies.identityProvider) return dependencies.identityProvider.resolve(environment);
  const { serverLiveUserIdentityProvider } = await import("./server-live-identity");
  return serverLiveUserIdentityProvider.resolve(environment);
}

async function readyContext(dependencies: LiveRecipeServiceDependencies, recipeId: string, actionType: LiveRecipeEvidence["actionType"], requiresWrite: boolean) {
  const environment = dependencies.environment ?? readLiveRecipeEnvironment();
  // OFF is a hard stop: no auth lookup, SDK construction, or external I/O is allowed.
  if (!environment.liveConnectEnabled) return failed<never>({ dependencies, recipeId, actionType, errorCode: "LIVE_DISABLED", connectionState: "DISABLED" });
  if (requiresWrite && !environment.liveSlackWriteEnabled) return failed<never>({ dependencies, recipeId, actionType, errorCode: "WRITE_DISABLED", connectionState: "NOT_CONNECTED" });
  if (environment.pipedreamEnvironment !== "development" || environment.nodeEnvironment === "production") return failed<never>({ dependencies, recipeId, actionType, errorCode: "PRODUCTION_ENVIRONMENT_FORBIDDEN", connectionState: "FAILED" });
  if (!hasPipedreamConfiguration(environment)) return failed<never>({ dependencies, recipeId, actionType, errorCode: "CONFIGURATION_MISSING", connectionState: "FAILED" });
  const identity = await resolveIdentity(dependencies, environment);
  if (!identity.ok) return failed<never>({ dependencies, recipeId, actionType, errorCode: identity.errorCode, connectionState: "NOT_CONNECTED" });
  if (dependencies.adapter) return { environment, identity: identity.value, adapter: dependencies.adapter };
  const { createRealPipedreamConnectAdapter } = await import("./pipedream-real-adapter");
  return { environment, identity: identity.value, adapter: createRealPipedreamConnectAdapter(environment) };
}

function externalFailure(error: unknown): "EXTERNAL_ACTION_FAILED" | "SLACK_ACCOUNT_NOT_VERIFIED" | "TIMEOUT" {
  if (error instanceof Error && /SLACK_ACCOUNT_NOT_VERIFIED/i.test(error.message)) return "SLACK_ACCOUNT_NOT_VERIFIED";
  return error instanceof Error && /timeout|abort/i.test(error.name + error.message) ? "TIMEOUT" : "EXTERNAL_ACTION_FAILED";
}

export async function prepareSlackConnectLink(recipeId: string, dependencies: LiveRecipeServiceDependencies = {}): Promise<LiveRecipeResult<{ connectLinkUrl: string; expiresAt: string }>> {
  const context = await readyContext(dependencies, recipeId, "CONNECT_LINK", false);
  if ("ok" in context) return context;
  try {
    const value = await context.adapter.createSlackConnectLink({ externalUserId: context.identity.externalUserId, appOrigin: context.environment.appOrigin });
    return { ok: true, value, connectionState: "CONNECT_LINK_READY", evidence: evidence({ dependencies, recipeId, actionType: "CONNECT_LINK", externalUserSafeReference: context.identity.safeReference, status: "PREPARED" }) };
  } catch (error) {
    return failed({ dependencies, recipeId, actionType: "CONNECT_LINK", errorCode: externalFailure(error) === "TIMEOUT" ? "TIMEOUT" : "CONNECT_LINK_CREATION_FAILED", connectionState: "FAILED", externalUserSafeReference: context.identity.safeReference });
  }
}

export async function prepareSlackTestAction(recipeId: string, dependencies: LiveRecipeServiceDependencies = {}): Promise<LiveRecipeResult<SlackTestActionPreparation>> {
  const context = await readyContext(dependencies, recipeId, "TEST_MESSAGE", true);
  if ("ok" in context) return context;
  return { ok: true, value: context.adapter.prepareSlackTestAction(), connectionState: "NOT_CONNECTED", evidence: evidence({ dependencies, recipeId, actionType: "TEST_MESSAGE", externalUserSafeReference: context.identity.safeReference, status: "PREPARED" }) };
}

export async function runApprovedSlackTestWrite(request: SlackWriteRequest, dependencies: LiveRecipeServiceDependencies = {}): Promise<LiveRecipeResult<{ safeExternalReference: string }>> {
  const parsed = slackWriteRequestSchema.safeParse(request);
  if (!parsed.success) return failed({ dependencies, recipeId: request.recipeId || "recipe.invalid", actionType: "TEST_MESSAGE", errorCode: "WRITE_NOT_APPROVED", connectionState: "NOT_CONNECTED" });
  const context = await readyContext(dependencies, parsed.data.recipeId, "TEST_MESSAGE", true);
  if ("ok" in context) return context;
  try {
    const accounts = await context.adapter.listSlackAccounts({ externalUserId: context.identity.externalUserId });
    if (!accounts.length) {
      return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "TEST_MESSAGE", errorCode: "SLACK_ACCOUNT_NOT_VERIFIED", connectionState: "NOT_CONNECTED", externalUserSafeReference: context.identity.safeReference });
    }
  } catch (error) {
    return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "TEST_MESSAGE", errorCode: externalFailure(error), connectionState: "FAILED", externalUserSafeReference: context.identity.safeReference });
  }
  const idempotency = dependencies.idempotency ?? defaultIdempotency;
  if (!idempotency.begin(parsed.data.requestId)) return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "TEST_MESSAGE", errorCode: "DUPLICATE_REQUEST", connectionState: "NOT_CONNECTED", externalUserSafeReference: context.identity.safeReference });
  try {
    const value = await context.adapter.runSlackTestAction({ externalUserId: context.identity.externalUserId, targetConfigurationReference: parsed.data.targetConfigurationReference });
    idempotency.finish(parsed.data.requestId, true);
    return { ok: true, value, connectionState: "CONNECTED_VERIFIED", evidence: evidence({ dependencies, recipeId: parsed.data.recipeId, actionType: "TEST_MESSAGE", externalUserSafeReference: context.identity.safeReference, status: "SUCCEEDED", safeExternalReference: value.safeExternalReference }) };
  } catch (error) {
    idempotency.finish(parsed.data.requestId, false);
    return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "TEST_MESSAGE", errorCode: externalFailure(error), connectionState: "FAILED", externalUserSafeReference: context.identity.safeReference });
  }
}

export async function runApprovedSlackDigestWrite(request: SlackDigestWriteRequest, dependencies: LiveRecipeServiceDependencies = {}): Promise<LiveRecipeResult<{ safeExternalReference: string; slackTimestamp?: string }>> {
  const parsed = slackDigestWriteRequestSchema.safeParse(request);
  if (!parsed.success) return failed({ dependencies, recipeId: request.recipeId || "recipe.invalid", actionType: "AI_NEWS_DIGEST", errorCode: "WRITE_NOT_APPROVED", connectionState: "NOT_CONNECTED" });
  const environment = dependencies.environment ?? readLiveRecipeEnvironment();
  if (!environment.approvedSlackAccountId || !environment.approvedSlackChannelId) {
    return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "AI_NEWS_DIGEST", errorCode: "CONFIGURATION_MISSING", connectionState: "NOT_CONNECTED" });
  }
  if (parsed.data.targetConfigurationReference !== environment.approvedSlackChannelId) {
    return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "AI_NEWS_DIGEST", errorCode: "DESTINATION_NOT_APPROVED", connectionState: "NOT_CONNECTED" });
  }
  const context = await readyContext({ ...dependencies, environment }, parsed.data.recipeId, "AI_NEWS_DIGEST", true);
  if ("ok" in context) return context;
  try {
    const accounts = await context.adapter.listSlackAccounts({ externalUserId: context.identity.externalUserId });
    if (!accounts.length) {
      return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "AI_NEWS_DIGEST", errorCode: "SLACK_ACCOUNT_NOT_VERIFIED", connectionState: "NOT_CONNECTED", externalUserSafeReference: context.identity.safeReference });
    }
  } catch (error) {
    return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "AI_NEWS_DIGEST", errorCode: externalFailure(error), connectionState: "FAILED", externalUserSafeReference: context.identity.safeReference });
  }
  if (!context.adapter.runSlackDigestAction) {
    return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "AI_NEWS_DIGEST", errorCode: "EXTERNAL_ACTION_FAILED", connectionState: "FAILED", externalUserSafeReference: context.identity.safeReference });
  }
  const idempotency = dependencies.idempotency ?? defaultIdempotency;
  if (!idempotency.begin(parsed.data.requestId)) return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "AI_NEWS_DIGEST", errorCode: "DUPLICATE_REQUEST", connectionState: "NOT_CONNECTED", externalUserSafeReference: context.identity.safeReference });
  try {
    const value = await context.adapter.runSlackDigestAction({ externalUserId: context.identity.externalUserId, approvedSlackAccountId: environment.approvedSlackAccountId, targetConfigurationReference: parsed.data.targetConfigurationReference, message: parsed.data.message });
    idempotency.finish(parsed.data.requestId, true);
    return { ok: true, value, connectionState: "CONNECTED_VERIFIED", evidence: evidence({ dependencies, recipeId: parsed.data.recipeId, actionType: "AI_NEWS_DIGEST", externalUserSafeReference: context.identity.safeReference, status: "SUCCEEDED", safeExternalReference: value.safeExternalReference }) };
  } catch (error) {
    idempotency.finish(parsed.data.requestId, false);
    return failed({ dependencies, recipeId: parsed.data.recipeId, actionType: "AI_NEWS_DIGEST", errorCode: externalFailure(error), connectionState: "FAILED", externalUserSafeReference: context.identity.safeReference });
  }
}

export function getDisabledLiveRecipeState() {
  const environment = readLiveRecipeEnvironment();
  return environment.liveConnectEnabled ? "NOT_CONNECTED" as const : "DISABLED" as const;
}

/** An OAuth redirect proves only that control returned to BuildFlow. Account verification is a later networked gate. */
export function markSlackConnectReturnedUnverified(recipeId: string, dependencies: LiveRecipeServiceDependencies = {}) {
  return failed<never>({ dependencies, recipeId, actionType: "CONNECT_LINK", errorCode: "CONNECT_RETURNED_UNVERIFIED", connectionState: "RETURNED_UNVERIFIED" });
}

export function markSlackConnectCancelled(recipeId: string, dependencies: LiveRecipeServiceDependencies = {}) {
  return failed<never>({ dependencies, recipeId, actionType: "CONNECT_LINK", errorCode: "CONNECT_CANCELLED", connectionState: "NOT_CONNECTED" });
}
