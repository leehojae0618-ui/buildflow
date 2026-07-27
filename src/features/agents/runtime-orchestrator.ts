import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "./package-export";
import type {
  RuntimeExecutionRequest,
  RuntimeActorReference,
  ReferenceIdentifier,
} from "./runtime-execution-request";
import {
  buildRuntimeExecutionResult,
  type RuntimeExecutionResult,
  type RuntimeExecutionResultStatus,
} from "./runtime-execution-result";
import {
  buildRuntimeExecutionStart,
  type RuntimePreflightResult,
  type RuntimeExecutionStart,
} from "./runtime-execution-start";
import {
  RUNTIME_EXECUTION_STEP_FORMAT_VERSION,
  buildRuntimeExecutionStep,
  buildRuntimeExecutionStepAttempt,
  validateRuntimeExecutionStepAttemptTransition,
  validateRuntimeExecutionStepTransition,
  type RuntimeExecutionStep,
  type RuntimeExecutionStepAttempt,
  type RuntimeStepAttemptStatus,
  type RuntimeStepStatus,
} from "./runtime-execution-step";
import type {
  RuntimeEvidenceAppendContext,
  RuntimeEvidenceRecord,
  RuntimeEvidenceSink,
  RuntimeEvidenceStatus,
} from "./runtime-evidence";
import {
  isSafeRuntimeTransientProviderInput,
  validateRuntimePlan,
  type RuntimePlan,
  type RuntimeTransientProviderInput,
} from "./runtime-plan";
import {
  isValidProviderInvocationResult,
  type ProviderAdapter,
  type ProviderErrorCode,
  type ProviderInvocationResult,
} from "./runtime-provider";

export const RUNTIME_ORCHESTRATOR_FORMAT_VERSION = "buildflow.runtime-orchestrator.v1" as const;

export const runtimeEventTypes = [
  "RUNTIME_STARTED",
  "PLAN_ACCEPTED",
  "PROVIDER_INVOCATION_STARTED",
  "PROVIDER_INVOCATION_COMPLETED",
  "PROVIDER_INVOCATION_FAILED",
  "STEP_COMPLETED",
  "STEP_FAILED",
  "EVIDENCE_APPENDED",
  "RUNTIME_COMPLETED",
  "RUNTIME_FAILED",
] as const;
export type RuntimeEventType = (typeof runtimeEventTypes)[number];

export type RuntimeEvent = {
  formatVersion: typeof RUNTIME_ORCHESTRATOR_FORMAT_VERSION;
  eventType: RuntimeEventType;
  occurredAt: string;
  runtimeExecutionId?: string;
  runtimePlanId: string;
  runtimeStepId?: string;
  runtimeStepAttemptId?: string;
  safeCode?: string;
};

export type RuntimeOrchestratorErrorCode =
  | "RUNTIME_REQUEST_INVALID"
  | "RUNTIME_PLAN_INVALID"
  | "RUNTIME_START_INVALID"
  | "RUNTIME_CANCELLED_BEFORE_INVOCATION"
  | ProviderErrorCode
  | "RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED"
  | "RUNTIME_EVIDENCE_CONSTRUCTION_FAILED"
  | "RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED";

export type RuntimeOrchestrationOutcome = {
  status: RuntimeExecutionResultStatus | "FINALIZATION_FAILED";
  userMessage: string;
  errorCode?: RuntimeOrchestratorErrorCode;
  runtimeExecutionStart?: RuntimeExecutionStart;
  runtimeStep?: RuntimeExecutionStep;
  runtimeStepAttempt?: RuntimeExecutionStepAttempt;
  evidence?: RuntimeEvidenceRecord;
  result?: RuntimeExecutionResult;
  events: readonly RuntimeEvent[];
};

export type RuntimeIdentityFactory = {
  createStepId(input: { runtimePlanId: string; runtimeExecutionId: string }): string;
  createAttemptId(input: { runtimeStepId: string }): string;
};

export type ExecuteMinimumRuntimeInput = {
  runtimeExecutionRequest: RuntimeExecutionRequest;
  runtimePreflightResult: RuntimePreflightResult;
  runtimePlan: RuntimePlan;
  initiatedByActorReference: RuntimeActorReference;
  executionSequence: string;
  startedAt: string;
  completedAt: string;
  transientProviderInput: RuntimeTransientProviderInput;
  provider: ProviderAdapter;
  evidenceSink: RuntimeEvidenceSink;
  /** Server-trusted ownership association for durable evidence repositories. */
  evidenceContext?: RuntimeEvidenceAppendContext;
  identityFactory?: RuntimeIdentityFactory;
  cancelBeforeInvocation?: boolean;
  signal?: AbortSignal;
};

const retryPolicyReference: ReferenceIdentifier = {
  referenceId: "runtime.retry.denied.v1",
  referenceType: "RETRY_POLICY",
  integrityChecksum: "d".repeat(64),
};

function digest(value: unknown) {
  return createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");
}

function reference(referenceId: string, referenceType: string, integrityChecksum = digest({ referenceId, referenceType })): ReferenceIdentifier {
  return { referenceId, referenceType, integrityChecksum };
}

function defaultIdentityFactory(): RuntimeIdentityFactory {
  return {
    createStepId: ({ runtimePlanId, runtimeExecutionId }) => digest({ runtimePlanId, runtimeExecutionId, sequence: 1 }),
    createAttemptId: ({ runtimeStepId }) => digest({ runtimeStepId, attemptNumber: 1 }),
  };
}

function userMessage(code: RuntimeOrchestratorErrorCode) {
  switch (code) {
    case "RUNTIME_REQUEST_INVALID":
      return "The runtime request could not be validated.";
    case "RUNTIME_PLAN_INVALID":
      return "The runtime plan is invalid.";
    case "RUNTIME_START_INVALID":
      return "The runtime could not be started.";
    case "RUNTIME_CANCELLED_BEFORE_INVOCATION":
    case "PROVIDER_CANCELLED":
      return "Execution was cancelled before the provider completed the request.";
    case "PROVIDER_CONFIGURATION_MISSING":
      return "Provider configuration is required before execution.";
    case "PROVIDER_AUTHENTICATION_FAILED":
      return "The provider could not authenticate this execution.";
    case "PROVIDER_TIMEOUT":
      return "The provider did not respond before the timeout.";
    case "PROVIDER_RATE_LIMITED":
      return "The provider is temporarily rate limited.";
    case "PROVIDER_EMPTY_RESPONSE":
    case "PROVIDER_OUTPUT_INVALID":
      return "The provider response could not be validated.";
    case "RUNTIME_EVIDENCE_CONSTRUCTION_FAILED":
      return "Execution evidence could not be recorded.";
    case "RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED":
    case "RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED":
      return "The runtime could not finalize the execution result.";
    default:
      return "The provider could not complete this execution.";
  }
}

function event(
  eventType: RuntimeEventType,
  occurredAt: string,
  runtimePlanId: string,
  values: Partial<Pick<RuntimeEvent, "runtimeExecutionId" | "runtimeStepId" | "runtimeStepAttemptId" | "safeCode">> = {},
): RuntimeEvent {
  return {
    formatVersion: RUNTIME_ORCHESTRATOR_FORMAT_VERSION,
    eventType,
    occurredAt,
    runtimePlanId,
    ...values,
  };
}

function isRequestValid(request: RuntimeExecutionRequest) {
  return (
    request.runtimeExecutionRequestId.trim().length > 0 &&
    /^[a-f0-9]{64}$/.test(request.integrityChecksum) &&
    request.formatVersion === "buildflow.runtime-execution-request.v1"
  );
}

function isPlanBoundToRequest(plan: RuntimePlan, request: RuntimeExecutionRequest) {
  return (
    validateRuntimePlan(plan).valid &&
    plan.runtimeExecutionRequestReference.runtimeExecutionRequestId === request.runtimeExecutionRequestId &&
    plan.runtimeExecutionRequestReference.integrityChecksum === request.integrityChecksum &&
    plan.steps.length === 1 &&
    plan.steps[0].provider === "openai" &&
    plan.steps[0].invocationBoundary === "PROVIDER" &&
    plan.steps[0].retryAllowed === false
  );
}

function buildStep(
  plan: RuntimePlan,
  request: RuntimeExecutionRequest,
  start: RuntimeExecutionStart,
  stepId: string,
  attemptId: string,
  status: RuntimeStepStatus,
  evidenceReferences: ReferenceIdentifier[] = [],
): RuntimeExecutionStep | undefined {
  const step = {
    formatVersion: RUNTIME_EXECUTION_STEP_FORMAT_VERSION,
    runtimeExecutionId: start.runtimeExecutionId,
    runtimeExecutionRequestId: request.runtimeExecutionRequestId,
    runtimeExecutionStartId: start.runtimeExecutionStartId,
    runtimeStepId: stepId,
    sequence: 1,
    nameReference: plan.steps[0].promptReference.referenceId,
    purposeCode: "OPENAI_RUNTIME_RESPONSE",
    stepKind: "PROVIDER_RESPONSE",
    invocationBoundary: "PROVIDER" as const,
    status,
    inputReferences: [plan.steps[0].inputArtifactReference],
    outputReferences: [],
    dependencyRuntimeStepIds: [],
    blockingReasons: [],
    evidenceReferences,
    approvalReferences: [
      reference(
        request.approvalBinding.approvalRequestId,
        "RUNTIME_APPROVAL",
        request.approvalBinding.approvalGateIntegrityChecksum,
      ),
    ],
    policyReferences: request.runtimePolicyReference ? [request.runtimePolicyReference] : [],
    limitationCodes: start.limitationCodes,
    integrityChecksum: digest({ plan: plan.runtimePlanId, stepId, attemptId, status, evidenceReferences }),
    providerInvocationReference: reference(`provider.invocation.${attemptId}`, "PROVIDER_INVOCATION"),
    retryPolicyReference,
  };
  const built = buildRuntimeExecutionStep(step);
  return built.status === "VALID" ? built.value : undefined;
}

function completionReference(
  start: RuntimeExecutionStart,
  stepId: string,
  attemptId: string,
  occurredAt: string,
  type = "ATTEMPT_COMPLETED",
) {
  return {
    referenceId: digest({ start: start.runtimeExecutionId, stepId, attemptId, occurredAt, type }),
    referenceType: type,
    integrityChecksum: digest({ start: start.runtimeExecutionId, stepId, attemptId, occurredAt, type, integrity: true }),
    runtimeExecutionId: start.runtimeExecutionId,
    runtimeStepId: stepId,
    runtimeStepAttemptId: attemptId,
  };
}

function buildAttempt(
  plan: RuntimePlan,
  start: RuntimeExecutionStart,
  stepId: string,
  attemptId: string,
  status: RuntimeStepAttemptStatus,
  occurredAt: string,
  evidenceReferences: ReferenceIdentifier[] = [],
  failureCode?: RuntimeOrchestratorErrorCode,
): RuntimeExecutionStepAttempt | undefined {
  const isTerminal = status !== "READY" && status !== "RUNNING";
  const completedAtReference = isTerminal
    ? completionReference(
        start,
        stepId,
        attemptId,
        occurredAt,
        status === "TIMEOUT" ? "ATTEMPT_TIMEOUT" : "ATTEMPT_COMPLETED",
      )
    : undefined;
  const attempt = {
    formatVersion: RUNTIME_EXECUTION_STEP_FORMAT_VERSION,
    runtimeExecutionId: start.runtimeExecutionId,
    runtimeStepId: stepId,
    runtimeStepAttemptId: attemptId,
    attemptNumber: 1,
    status,
    inputReferences: [plan.steps[0].inputArtifactReference],
    outputReferences: [],
    blockingReasons: [],
    evidenceReferences,
    limitationCodes: start.limitationCodes,
    integrityChecksum: digest({ plan: plan.runtimePlanId, stepId, attemptId, status, occurredAt, evidenceReferences }),
    ...(status === "READY"
      ? {}
      : { startedAtReference: reference(`attempt.started.${attemptId}`, "ATTEMPT_STARTED") }),
    ...(completedAtReference ? { completedAtReference } : {}),
    providerInvocationAttemptReference: reference(`provider.invocation.${attemptId}`, "PROVIDER_INVOCATION"),
    retryPolicyReference,
    ...(status === "FAILED" && failureCode
      ? {
          failure: {
            code: failureCode,
            target: "provider",
            safeReference: reference(`runtime.error.${attemptId}.${failureCode}`, "RUNTIME_ERROR"),
            recoverable: false,
            userActionable: true,
          },
          retryDecision: { decision: "RETRY_DENIED" as const, retryPolicyReference },
        }
      : {}),
    ...(status === "TIMEOUT"
      ? { retryDecision: { decision: "RETRY_DENIED" as const, retryPolicyReference } }
      : {}),
  };
  const built = buildRuntimeExecutionStepAttempt(attempt);
  return built.status === "VALID" ? built.value : undefined;
}

function statusForProviderOutcome(outcome: ProviderInvocationResult): RuntimeExecutionResultStatus {
  if (outcome.status === "SUCCEEDED") return "SUCCEEDED";
  if (outcome.status === "TIMED_OUT") return "TIMED_OUT";
  if (outcome.status === "CANCELLED") return "CANCELLED";
  if (outcome.status === "BLOCKED") return "BLOCKED";
  return "FAILED";
}

function evidenceStatus(outcome: ProviderInvocationResult): RuntimeEvidenceStatus {
  if (outcome.status === "SUCCEEDED") return "SUCCEEDED";
  if (outcome.status === "TIMED_OUT") return "TIMED_OUT";
  if (outcome.status === "CANCELLED") return "CANCELLED";
  if (outcome.status === "BLOCKED") return "BLOCKED";
  return "FAILED";
}

export async function executeMinimumRuntime(
  input: ExecuteMinimumRuntimeInput,
): Promise<RuntimeOrchestrationOutcome> {
  const events: RuntimeEvent[] = [];
  const plan = input.runtimePlan;
  if (!isRequestValid(input.runtimeExecutionRequest)) {
    return {
      status: "INVALID",
      errorCode: "RUNTIME_REQUEST_INVALID",
      userMessage: userMessage("RUNTIME_REQUEST_INVALID"),
      events,
    };
  }
  if (!isPlanBoundToRequest(plan, input.runtimeExecutionRequest)) {
    return {
      status: "INVALID",
      errorCode: "RUNTIME_PLAN_INVALID",
      userMessage: userMessage("RUNTIME_PLAN_INVALID"),
      events,
    };
  }
  if (
    !isSafeRuntimeTransientProviderInput(input.transientProviderInput) ||
    digest({
      systemInstruction: input.transientProviderInput.systemInstruction,
      userInput: input.transientProviderInput.userInput,
    }) !== plan.steps[0].safeInputChecksum
  ) {
    return {
      status: "INVALID",
      errorCode: "RUNTIME_PLAN_INVALID",
      userMessage: userMessage("RUNTIME_PLAN_INVALID"),
      events,
    };
  }
  events.push(event("PLAN_ACCEPTED", input.startedAt, plan.runtimePlanId));
  const started = buildRuntimeExecutionStart({
    runtimeExecutionRequest: input.runtimeExecutionRequest,
    runtimePreflightResult: input.runtimePreflightResult,
    executionIntent: "INITIAL",
    executionSequence: input.executionSequence,
    initiatedByActorReference: input.initiatedByActorReference,
    startedAt: input.startedAt,
  });
  if (started.status !== "VALID") {
    return {
      status: "INVALID",
      errorCode: "RUNTIME_START_INVALID",
      userMessage: userMessage("RUNTIME_START_INVALID"),
      events,
    };
  }
  const start = started.value;
  events.push(event("RUNTIME_STARTED", input.startedAt, plan.runtimePlanId, { runtimeExecutionId: start.runtimeExecutionId }));
  const identities = input.identityFactory ?? defaultIdentityFactory();
  const stepId = identities.createStepId({ runtimePlanId: plan.runtimePlanId, runtimeExecutionId: start.runtimeExecutionId });
  const attemptId = identities.createAttemptId({ runtimeStepId: stepId });
  const readyStep = buildStep(plan, input.runtimeExecutionRequest, start, stepId, attemptId, "READY");
  const readyAttempt = buildAttempt(plan, start, stepId, attemptId, "READY", input.startedAt);
  if (!readyStep || !readyAttempt || !validateRuntimeExecutionStepTransition("READY", "RUNNING").valid || !validateRuntimeExecutionStepAttemptTransition("READY", "RUNNING").valid) {
    return {
      status: "FINALIZATION_FAILED",
      errorCode: "RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED",
      userMessage: userMessage("RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED"),
      runtimeExecutionStart: start,
      events,
    };
  }
  if (input.cancelBeforeInvocation) {
    const appended = await input.evidenceSink.append({
      runtimePlanId: plan.runtimePlanId,
      runtimeExecutionId: start.runtimeExecutionId,
      runtimeExecutionRequestId: input.runtimeExecutionRequest.runtimeExecutionRequestId,
      runtimeExecutionStartId: start.runtimeExecutionStartId,
      runtimeStepId: stepId,
      runtimeStepAttemptId: attemptId,
      eventType: "RUNTIME_FAILED",
      status: "CANCELLED",
      provider: "openai",
      model: plan.steps[0].model,
      safeInputChecksum: plan.steps[0].safeInputChecksum,
      errorCode: "RUNTIME_CANCELLED_BEFORE_INVOCATION",
      occurredAt: input.completedAt,
    }, input.evidenceContext);
    if (appended.status !== "APPENDED") {
      return {
        status: "FINALIZATION_FAILED",
        errorCode: "RUNTIME_EVIDENCE_CONSTRUCTION_FAILED",
        userMessage: userMessage("RUNTIME_EVIDENCE_CONSTRUCTION_FAILED"),
        runtimeExecutionStart: start,
        events,
      };
    }
    const cancelledStep = buildStep(plan, input.runtimeExecutionRequest, start, stepId, attemptId, "CANCELLED", [appended.reference]);
    const cancelledAttempt = buildAttempt(plan, start, stepId, attemptId, "CANCELLED", input.completedAt, [appended.reference]);
    if (!cancelledStep || !cancelledAttempt) {
      return {
        status: "FINALIZATION_FAILED",
        errorCode: "RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED",
        userMessage: userMessage("RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED"),
        runtimeExecutionStart: start,
        evidence: appended.value,
        events,
      };
    }
    const cancellationReference = reference(`runtime.cancelled.${attemptId}`, "RUNTIME_CANCELLATION");
    const result = buildRuntimeExecutionResult({
      runtimeExecutionRequest: input.runtimeExecutionRequest,
      runtimePreflightResult: input.runtimePreflightResult,
      runtimeExecutionStart: start,
      status: "CANCELLED",
      completedAt: input.completedAt,
      stepSummaryReference: reference(stepId, "RUNTIME_STEP"),
      attemptSummaryReference: reference(attemptId, "RUNTIME_STEP_ATTEMPT"),
      evidenceReferences: [appended.reference],
      cancellationReference,
    });
    if (result.status !== "VALID") {
      return {
        status: "FINALIZATION_FAILED",
        errorCode: "RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED",
        userMessage: userMessage("RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED"),
        runtimeExecutionStart: start,
        runtimeStep: cancelledStep,
        runtimeStepAttempt: cancelledAttempt,
        evidence: appended.value,
        events,
      };
    }
    events.push(event("EVIDENCE_APPENDED", input.completedAt, plan.runtimePlanId, { runtimeExecutionId: start.runtimeExecutionId, runtimeStepId: stepId, runtimeStepAttemptId: attemptId }));
    events.push(event("RUNTIME_FAILED", input.completedAt, plan.runtimePlanId, { runtimeExecutionId: start.runtimeExecutionId, safeCode: "RUNTIME_CANCELLED_BEFORE_INVOCATION" }));
    return { status: "CANCELLED", errorCode: "RUNTIME_CANCELLED_BEFORE_INVOCATION", userMessage: userMessage("RUNTIME_CANCELLED_BEFORE_INVOCATION"), runtimeExecutionStart: start, runtimeStep: cancelledStep, runtimeStepAttempt: cancelledAttempt, evidence: appended.value, result: result.value, events };
  }

  const runningStep = buildStep(plan, input.runtimeExecutionRequest, start, stepId, attemptId, "RUNNING");
  const runningAttempt = buildAttempt(plan, start, stepId, attemptId, "RUNNING", input.startedAt);
  if (!runningStep || !runningAttempt) {
    return { status: "FINALIZATION_FAILED", errorCode: "RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED", userMessage: userMessage("RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED"), runtimeExecutionStart: start, events };
  }
  events.push(event("PROVIDER_INVOCATION_STARTED", input.startedAt, plan.runtimePlanId, { runtimeExecutionId: start.runtimeExecutionId, runtimeStepId: stepId, runtimeStepAttemptId: attemptId }));
  let providerResponse: unknown;
  try {
    providerResponse = await input.provider.execute({
      formatVersion: "buildflow.runtime-provider.v1",
      provider: "openai",
      model: plan.steps[0].model,
      promptReference: plan.steps[0].promptReference,
      inputReference: plan.steps[0].inputArtifactReference,
      safeInputChecksum: plan.steps[0].safeInputChecksum,
      transientInput: input.transientProviderInput,
      timeoutMs: 12_000,
      ...(input.signal ? { signal: input.signal } : {}),
      runtimeExecutionId: start.runtimeExecutionId,
      runtimeStepId: stepId,
      runtimeStepAttemptId: attemptId,
    });
  } catch {
    providerResponse = { status: "FAILED", errorCode: "PROVIDER_REQUEST_FAILED", latencyMs: 0, retryEligible: false };
  }
  const providerOutcome: ProviderInvocationResult = isValidProviderInvocationResult(providerResponse)
    ? providerResponse
    : { status: "FAILED", errorCode: "PROVIDER_OUTPUT_INVALID", latencyMs: 0, retryEligible: false };
  const providerFailure = providerOutcome.status !== "SUCCEEDED";
  const providerErrorCode = providerOutcome.status === "SUCCEEDED" ? undefined : providerOutcome.errorCode;
  const providerSuccess = providerOutcome.status === "SUCCEEDED" ? providerOutcome : undefined;
  events.push(event(providerFailure ? "PROVIDER_INVOCATION_FAILED" : "PROVIDER_INVOCATION_COMPLETED", input.completedAt, plan.runtimePlanId, { runtimeExecutionId: start.runtimeExecutionId, runtimeStepId: stepId, runtimeStepAttemptId: attemptId, ...(providerErrorCode ? { safeCode: providerErrorCode } : {}) }));

  const appended = await input.evidenceSink.append({
    runtimePlanId: plan.runtimePlanId,
    runtimeExecutionId: start.runtimeExecutionId,
    runtimeExecutionRequestId: input.runtimeExecutionRequest.runtimeExecutionRequestId,
    runtimeExecutionStartId: start.runtimeExecutionStartId,
    runtimeStepId: stepId,
    runtimeStepAttemptId: attemptId,
    eventType: providerFailure ? "PROVIDER_INVOCATION_FAILED" : "PROVIDER_INVOCATION_COMPLETED",
    status: evidenceStatus(providerOutcome),
    provider: "openai",
    model: plan.steps[0].model,
    safeInputChecksum: plan.steps[0].safeInputChecksum,
    ...(providerSuccess
      ? { safeOutputChecksum: providerSuccess.outputChecksum, providerRequestReference: providerSuccess.providerRequestReference, usage: providerSuccess.usage, latencyMs: providerSuccess.latencyMs }
      : { providerRequestReference: providerOutcome.providerRequestReference, latencyMs: providerOutcome.latencyMs, errorCode: providerErrorCode ?? "PROVIDER_REQUEST_FAILED" }),
    occurredAt: input.completedAt,
  }, input.evidenceContext);
  if (appended.status !== "APPENDED") {
    return { status: "FINALIZATION_FAILED", errorCode: "RUNTIME_EVIDENCE_CONSTRUCTION_FAILED", userMessage: userMessage("RUNTIME_EVIDENCE_CONSTRUCTION_FAILED"), runtimeExecutionStart: start, runtimeStep: runningStep, runtimeStepAttempt: runningAttempt, events };
  }
  events.push(event("EVIDENCE_APPENDED", input.completedAt, plan.runtimePlanId, { runtimeExecutionId: start.runtimeExecutionId, runtimeStepId: stepId, runtimeStepAttemptId: attemptId }));
  const resultStatus = statusForProviderOutcome(providerOutcome);
  if (resultStatus === "BLOCKED") {
    const blockedStep = buildStep(plan, input.runtimeExecutionRequest, start, stepId, attemptId, "WAITING");
    if (!blockedStep) return { status: "FINALIZATION_FAILED", errorCode: "RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED", userMessage: userMessage("RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED"), runtimeExecutionStart: start, evidence: appended.value, events };
    const result = buildRuntimeExecutionResult({
      runtimeExecutionRequest: input.runtimeExecutionRequest,
      runtimePreflightResult: input.runtimePreflightResult,
      runtimeExecutionStart: start,
      status: "BLOCKED",
      completedAt: input.completedAt,
      stepSummaryReference: reference(stepId, "RUNTIME_STEP"),
      attemptSummaryReference: reference(attemptId, "RUNTIME_STEP_ATTEMPT"),
      blockingReference: reference(`runtime.blocked.${attemptId}`, "RUNTIME_BLOCKING"),
    });
    if (result.status !== "VALID") return { status: "FINALIZATION_FAILED", errorCode: "RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED", userMessage: userMessage("RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED"), runtimeExecutionStart: start, runtimeStep: blockedStep, evidence: appended.value, events };
    const errorCode = providerErrorCode ?? "PROVIDER_REQUEST_FAILED";
    events.push(event("RUNTIME_FAILED", input.completedAt, plan.runtimePlanId, { runtimeExecutionId: start.runtimeExecutionId, safeCode: errorCode }));
    return { status: "BLOCKED", errorCode, userMessage: userMessage(errorCode), runtimeExecutionStart: start, runtimeStep: blockedStep, runtimeStepAttempt: readyAttempt, evidence: appended.value, result: result.value, events };
  }
  const terminalAttemptStatus: RuntimeStepAttemptStatus = resultStatus === "SUCCEEDED" ? "SUCCESS" : resultStatus === "TIMED_OUT" ? "TIMEOUT" : resultStatus === "CANCELLED" ? "CANCELLED" : "FAILED";
  const terminalStepStatus: RuntimeStepStatus = resultStatus === "SUCCEEDED" ? "SUCCESS" : resultStatus === "TIMED_OUT" ? "TIMEOUT" : resultStatus === "CANCELLED" ? "CANCELLED" : "FAILED";
  const terminalStep = buildStep(plan, input.runtimeExecutionRequest, start, stepId, attemptId, terminalStepStatus, [appended.reference]);
  const terminalAttempt = buildAttempt(plan, start, stepId, attemptId, terminalAttemptStatus, input.completedAt, [appended.reference], providerErrorCode);
  if (!terminalStep || !terminalAttempt) {
    return { status: "FINALIZATION_FAILED", errorCode: "RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED", userMessage: userMessage("RUNTIME_STEP_RESULT_CONSTRUCTION_FAILED"), runtimeExecutionStart: start, evidence: appended.value, events };
  }
  events.push(event(resultStatus === "SUCCEEDED" ? "STEP_COMPLETED" : "STEP_FAILED", input.completedAt, plan.runtimePlanId, { runtimeExecutionId: start.runtimeExecutionId, runtimeStepId: stepId, runtimeStepAttemptId: attemptId, ...(providerOutcome.status === "SUCCEEDED" ? {} : { safeCode: providerOutcome.errorCode }) }));
  const common = {
    runtimeExecutionRequest: input.runtimeExecutionRequest,
    runtimePreflightResult: input.runtimePreflightResult,
    runtimeExecutionStart: start,
    completedAt: input.completedAt,
    stepSummaryReference: reference(stepId, "RUNTIME_STEP"),
    attemptSummaryReference: reference(attemptId, "RUNTIME_STEP_ATTEMPT"),
    evidenceReferences: [appended.reference],
  };
  const result = buildRuntimeExecutionResult(
    resultStatus === "SUCCEEDED"
      ? { ...common, status: "SUCCEEDED", outputReference: reference(providerSuccess?.outputReference ?? "invalid-provider-output", "PROVIDER_OUTPUT", providerSuccess?.outputChecksum ?? digest("invalid-provider-output")) }
      : resultStatus === "TIMED_OUT"
        ? { ...common, status: "TIMED_OUT", timeoutReference: reference(`runtime.timeout.${attemptId}`, "RUNTIME_TIMEOUT") }
        : resultStatus === "CANCELLED"
          ? { ...common, status: "CANCELLED", cancellationReference: reference(`runtime.cancelled.${attemptId}`, "RUNTIME_CANCELLATION") }
          : { ...common, status: "FAILED", errorReference: reference(`runtime.error.${attemptId}.${providerErrorCode ?? "PROVIDER_REQUEST_FAILED"}`, "RUNTIME_ERROR") },
  );
  if (result.status !== "VALID") {
    return { status: "FINALIZATION_FAILED", errorCode: "RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED", userMessage: userMessage("RUNTIME_FINAL_RESULT_CONSTRUCTION_FAILED"), runtimeExecutionStart: start, runtimeStep: terminalStep, runtimeStepAttempt: terminalAttempt, evidence: appended.value, events };
  }
  events.push(event(resultStatus === "SUCCEEDED" ? "RUNTIME_COMPLETED" : "RUNTIME_FAILED", input.completedAt, plan.runtimePlanId, { runtimeExecutionId: start.runtimeExecutionId, ...(providerErrorCode ? { safeCode: providerErrorCode } : {}) }));
  return { status: resultStatus, ...(providerErrorCode ? { errorCode: providerErrorCode } : {}), userMessage: providerErrorCode ? userMessage(providerErrorCode) : "Runtime execution completed.", runtimeExecutionStart: start, runtimeStep: terminalStep, runtimeStepAttempt: terminalAttempt, evidence: appended.value, result: result.value, events };
}
