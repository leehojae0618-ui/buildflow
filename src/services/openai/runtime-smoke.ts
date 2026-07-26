import "server-only";
import { generateAgentDefinition } from "../../features/agents/generator";
import { InMemoryRuntimeEvidenceSink } from "../../features/agents/runtime-evidence";
import { buildRuntimeExecutionRequest } from "../../features/agents/runtime-execution-request";
import {
  executeMinimumRuntime,
  type RuntimeEvent,
  type RuntimeOrchestrationOutcome,
} from "../../features/agents/runtime-orchestrator";
import { buildRuntimePlan } from "../../features/agents/runtime-plan";
import type { ProviderAdapter } from "../../features/agents/runtime-provider";
import { buildRuntimePreflightResult } from "../../features/agents/runtime-execution-start";
import type { AgentBlueprint } from "../../features/agents/types";
import type { PackageApprovalGateResult } from "../../features/agents/package-approval-gate";
import { hasOpenAIEnv, requireOpenAIEnv } from "../../lib/env/server";
import { createOpenAIRuntimeProviderAdapter } from "./runtime-provider-adapter";

const RUNTIME_SMOKE_FORMAT_VERSION = "buildflow.runtime-smoke.v1" as const;

type Clock = () => Date;

export type RuntimeSmokeSummary = {
  formatVersion: typeof RUNTIME_SMOKE_FORMAT_VERSION;
  status: RuntimeOrchestrationOutcome["status"] | "BLOCKED";
  errorCode?: string;
  runtimeExecutionId?: string;
  runtimeStepId?: string;
  runtimeStepAttemptId?: string;
  resultStatus?: string;
  eventTypes: readonly RuntimeEvent["eventType"][];
  evidence: {
    count: number;
    status?: string;
    provider?: "openai";
    model?: string;
    hasSafeInputChecksum: boolean;
    hasSafeOutputChecksum: boolean;
    hasProviderRequestReference: boolean;
    latencyMs?: number;
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    };
    errorCode?: string;
  };
};

export type RunOpenAIRuntimeSmokeTestOptions = {
  /** Test-only injection point. The default is the real OpenAI adapter. */
  provider?: ProviderAdapter;
  signal?: AbortSignal;
  now?: Clock;
};

function checksum(seed: string) {
  return seed.padEnd(64, seed).slice(0, 64);
}

function approvalGate(): PackageApprovalGateResult {
  return {
    formatVersion: "buildflow.package-approval-gate.v1",
    packageId: "agent.runtime-smoke",
    packageVersion: "1.0.0",
    evidenceReportReference: {
      reportId: "report.runtime-smoke",
      reportIntegrityChecksum: checksum("b"),
      reportStatus: "VALID_WITH_LIMITATIONS",
      packageReadiness: "CONDITIONALLY_READY",
    },
    requestReference: {
      approvalRequestId: "approval.runtime-smoke",
      integrityChecksum: checksum("c"),
      requestStatus: "PENDING",
    },
    decisionReferences: [],
    requestedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
    grantedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
    deniedScopes: [],
    pendingScopes: [],
    staleScopes: [],
    revokedScopes: [],
    gateStatus: "APPROVED_WITH_LIMITATIONS",
    authorization: {
      authorizationStatus: "AUTHORIZED_WITH_LIMITATIONS",
      requestedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      grantedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      deniedScopes: [],
      pendingScopes: [],
      staleScopes: [],
      revokedScopes: [],
      reasonCodes: ["ACCEPTED_RISK"],
      limitations: [],
      sourceApprovalReferences: ["approval.runtime-smoke"],
    },
    failures: [],
    warnings: [],
    limitations: [],
    deterministicCore: {
      formatVersion: "buildflow.package-approval-gate.v1",
      packageId: "agent.runtime-smoke",
      packageVersion: "1.0.0",
      evidenceReportId: "report.runtime-smoke",
      evidenceReportIntegrityChecksum: checksum("b"),
      sourceReferences: {
        packageId: "agent.runtime-smoke",
        packageVersion: "1.0.0",
        evidenceReportId: "report.runtime-smoke",
        evidenceReportIntegrityChecksum: checksum("b"),
        packageArtifactChecksum: checksum("a"),
        verificationReportChecksum: checksum("c"),
        evidenceBundleChecksum: checksum("d"),
        pipelineSummaryChecksum: checksum("e"),
      },
      approvalRequestId: "approval.runtime-smoke",
      requestIntegrityChecksum: checksum("c"),
      requestedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      executionScopes: ["RUNTIME_EXECUTION"],
      activeDecisions: [],
      gateStatus: "APPROVED_WITH_LIMITATIONS",
      authorizationStatus: "AUTHORIZED_WITH_LIMITATIONS",
      grantedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      deniedScopes: [],
      pendingScopes: [],
      staleScopes: [],
      revokedScopes: [],
      expirationEvaluation: {
        evaluated: false,
        status: "NOT_EVALUATED",
        evaluationTime: null,
        expiresAt: null,
      },
      failures: [],
      limitations: [],
      packageReadiness: "CONDITIONALLY_READY",
    },
    integrityChecksum: checksum("d"),
    metadata: {},
  };
}

function isoAfter(value: string, milliseconds: number) {
  return new Date(new Date(value).getTime() + milliseconds).toISOString();
}

function smokeBlueprint(model: string): AgentBlueprint {
  return {
    id: "runtime-smoke-v1",
    version: "1.0.0",
    displayName: "Runtime Smoke Agent",
    capabilities: ["AI_RESPONSE"],
    deliveryModes: ["HEADLESS"],
    interfaceModes: ["API"],
    requiredProviders: ["openai"],
    compatibility: {
      minBuildFlowVersion: "0.1.0",
      minRuntimeVersion: "1.0.0",
    },
    blocks: [
      {
        id: "model.openai",
        kind: "MODEL",
        name: "OpenAI smoke model",
        required: true,
        provider: "openai",
        model,
      },
      {
        id: "prompt.runtime-smoke",
        kind: "PROMPT",
        name: "Runtime smoke prompt",
        required: true,
        promptRef: "prompts/runtime-smoke-v1/system",
      },
      {
        id: "guardrail.runtime-smoke",
        kind: "GUARDRAIL",
        name: "No external execution",
        required: true,
        rules: ["NO_SECRET_EXPOSURE", "NO_UNAPPROVED_TOOL_EXECUTION"],
      },
      {
        id: "output.runtime-smoke",
        kind: "OUTPUT",
        name: "Runtime smoke output",
        required: true,
        schema: { id: "runtime-smoke-output", version: "1.0.0" },
      },
      {
        id: "delivery.runtime-smoke",
        kind: "DELIVERY_SURFACE",
        name: "Headless smoke execution",
        required: true,
        deliveryMode: "HEADLESS",
        interfaces: ["API"],
      },
    ],
  };
}

function summary(
  outcome: RuntimeOrchestrationOutcome,
  evidence: InMemoryRuntimeEvidenceSink,
): RuntimeSmokeSummary {
  const records = evidence.values();
  const latestEvidence = records.at(-1);
  return Object.freeze({
    formatVersion: RUNTIME_SMOKE_FORMAT_VERSION,
    status: outcome.status,
    ...(outcome.errorCode ? { errorCode: outcome.errorCode } : {}),
    ...(outcome.runtimeExecutionStart
      ? { runtimeExecutionId: outcome.runtimeExecutionStart.runtimeExecutionId }
      : {}),
    ...(outcome.runtimeStep ? { runtimeStepId: outcome.runtimeStep.runtimeStepId } : {}),
    ...(outcome.runtimeStepAttempt
      ? { runtimeStepAttemptId: outcome.runtimeStepAttempt.runtimeStepAttemptId }
      : {}),
    ...(outcome.result ? { resultStatus: outcome.result.status } : {}),
    eventTypes: Object.freeze(outcome.events.map((event) => event.eventType)),
    evidence: Object.freeze({
      count: records.length,
      ...(latestEvidence ? { status: latestEvidence.status, provider: latestEvidence.provider, model: latestEvidence.model } : {}),
      hasSafeInputChecksum: Boolean(latestEvidence?.safeInputChecksum),
      hasSafeOutputChecksum: Boolean(latestEvidence?.safeOutputChecksum),
      hasProviderRequestReference: Boolean(latestEvidence?.providerRequestReference),
      ...(latestEvidence?.latencyMs !== undefined ? { latencyMs: latestEvidence.latencyMs } : {}),
      ...(latestEvidence?.usage ? { usage: latestEvidence.usage } : {}),
      ...(latestEvidence?.errorCode ? { errorCode: latestEvidence.errorCode } : {}),
    }),
  });
}

/**
 * Executes the existing single-step Runtime through the real OpenAI adapter by
 * default. It is server-only and intentionally returns a redacted summary;
 * neither the static smoke inputs nor the provider output are returned.
 */
export async function runOpenAIRuntimeSmokeTest(
  options: RunOpenAIRuntimeSmokeTestOptions = {},
): Promise<RuntimeSmokeSummary> {
  if (!hasOpenAIEnv && !options.provider) {
    return Object.freeze({
      formatVersion: RUNTIME_SMOKE_FORMAT_VERSION,
      status: "BLOCKED",
      errorCode: "PROVIDER_CONFIGURATION_MISSING",
      eventTypes: Object.freeze([]),
      evidence: Object.freeze({
        count: 0,
        hasSafeInputChecksum: false,
        hasSafeOutputChecksum: false,
        hasProviderRequestReference: false,
      }),
    });
  }

  const model = hasOpenAIEnv ? requireOpenAIEnv().model : "gpt-5-mini";
  const now = options.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const completedAt = isoAfter(startedAt, 1);
  const requestResult = buildRuntimeExecutionRequest({
    approvalGate: approvalGate(),
    requestedExecutionMode: "STANDARD",
    executionProfileReference: {
      referenceId: "runtime.smoke.profile",
      integrityChecksum: checksum("a"),
    },
    runtimePolicyReference: {
      referenceId: "runtime.smoke.policy",
      integrityChecksum: checksum("b"),
    },
    requestedBy: { actorType: "SYSTEM", actorId: "runtime-smoke" },
    inputArtifactReferences: [
      {
        artifactId: "runtime.smoke.input",
        artifactType: "RUNTIME_INPUT",
        integrityChecksum: checksum("c"),
      },
    ],
    requestedCapabilityReferences: [
      { capabilityId: "AI_RESPONSE", integrityChecksum: checksum("d") },
    ],
    expirationPolicy: {
      mode: "EXPLICIT_TIME",
      evaluationTime: startedAt,
      expiresAt: isoAfter(startedAt, 60_000),
    },
  });
  if (requestResult.status !== "VALID") {
    throw new Error("Runtime smoke request fixture is invalid.");
  }

  const request = requestResult.value;
  const blueprint = smokeBlueprint(model);
  const definition = generateAgentDefinition({
    projectId: "runtime-smoke",
    goal: "Verify a bounded OpenAI Runtime response without tools.",
    blueprint,
    selectedDeliveryMode: "HEADLESS",
    selectedInterfaceModes: ["API"],
  }).definition;
  const transientProviderInput = {
    systemInstruction: "Return a concise harmless acknowledgement. Do not use tools.",
    userInput: "Runtime smoke verification request.",
  };
  const planResult = buildRuntimePlan({
    runtimeExecutionRequest: request,
    blueprint,
    blueprintIntegrityChecksum: checksum("a"),
    agentDefinition: definition,
    agentDefinitionIntegrityChecksum: checksum("b"),
    inputArtifactReference: request.inputArtifactReferences[0],
    transientProviderInput,
  });
  if (planResult.status !== "VALID") {
    throw new Error("Runtime smoke plan fixture is invalid.");
  }

  const preflightResult = buildRuntimePreflightResult({
    runtimeExecutionRequest: request,
    approvalStatusSnapshot: {
      approvalReferenceId: request.approvalBinding.approvalRequestId,
      status: "APPROVED",
      scopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      packageBinding: request.packageBinding,
      evidenceBinding: request.evidenceBinding,
      runtimeExecutionRequestBinding: {
        runtimeExecutionRequestId: request.runtimeExecutionRequestId,
        integrityChecksum: request.integrityChecksum,
      },
      approvedAt: startedAt,
      checksum: checksum("a"),
    },
    connectionReadinessSnapshots: [
      {
        connectionReferenceId: "connection.openai.runtime-smoke",
        serviceReference: "openai",
        grantedCapabilityReferences: ["AI_RESPONSE"],
        status: "CONNECTED",
        checksum: checksum("b"),
      },
    ],
    credentialReadinessSnapshots: [
      {
        credentialReferenceId: "credential.openai.runtime-smoke",
        connectionReferenceId: "connection.openai.runtime-smoke",
        status: "ACTIVE",
        checksum: checksum("c"),
      },
    ],
    capabilityReadinessSnapshots: [
      {
        capabilityReferenceId: "AI_RESPONSE",
        supportedByBlock: true,
        supportedByTool: true,
        grantedByConnection: true,
        permittedByPolicy: true,
        coveredByApproval: true,
        status: "AVAILABLE",
        checksum: checksum("d"),
      },
    ],
    providerReadinessSnapshots: [
      {
        providerReference: "openai",
        modelReference: model,
        status: "READY",
        checksum: checksum("e"),
      },
    ],
    mcpReadinessSnapshots: [],
    runtimePolicySnapshot: {
      runtimePolicyReference: request.runtimePolicyReference!,
      status: "ACTIVE",
      allowedExecutionModes: ["STANDARD"],
      checksum: checksum("f"),
    },
    cancellationSnapshot: {
      runtimeExecutionRequestId: request.runtimeExecutionRequestId,
      status: "NONE",
      checksum: checksum("a"),
    },
    idempotencySnapshot: {
      runtimeExecutionRequestId: request.runtimeExecutionRequestId,
      status: "AVAILABLE",
      evaluatedAt: startedAt,
      checksum: checksum("b"),
    },
    evaluatedAt: startedAt,
  });
  if (preflightResult.status !== "VALID") {
    throw new Error("Runtime smoke preflight fixture is invalid.");
  }

  const evidenceSink = new InMemoryRuntimeEvidenceSink();
  const outcome = await executeMinimumRuntime({
    runtimeExecutionRequest: request,
    runtimePreflightResult: preflightResult.value,
    runtimePlan: planResult.value,
    initiatedByActorReference: { actorType: "SYSTEM", actorId: "runtime-smoke" },
    executionSequence: `runtime-smoke-${request.runtimeExecutionRequestId}`,
    startedAt,
    completedAt,
    transientProviderInput,
    provider: options.provider ?? createOpenAIRuntimeProviderAdapter(),
    evidenceSink,
    ...(options.signal ? { signal: options.signal } : {}),
  });

  return summary(outcome, evidenceSink);
}
