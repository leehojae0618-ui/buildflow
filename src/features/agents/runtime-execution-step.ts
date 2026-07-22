import type { ReferenceIdentifier } from "./runtime-execution-request";

export const RUNTIME_EXECUTION_STEP_FORMAT_VERSION =
  "buildflow.runtime-execution-step.v1" as const;

export const runtimeStepStatuses = [
  "READY",
  "RUNNING",
  "WAITING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
  "SKIPPED",
  "TIMEOUT",
] as const;
export type RuntimeStepStatus = (typeof runtimeStepStatuses)[number];

export const runtimeStepAttemptStatuses = [
  "READY",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
  "TIMEOUT",
] as const;
export type RuntimeStepAttemptStatus = (typeof runtimeStepAttemptStatuses)[number];

export const runtimeInvocationBoundaries = ["NONE", "PROVIDER", "MCP"] as const;
export type RuntimeInvocationBoundary = (typeof runtimeInvocationBoundaries)[number];

export const runtimeStepBlockingReasons = [
  "DEPENDENCY_WAIT",
  "APPROVAL_REQUIRED",
  "CONNECTION_REQUIRED",
  "CREDENTIAL_REQUIRED",
  "POLICY_BLOCKED",
  "TOOL_UNAVAILABLE",
  "PROVIDER_UNAVAILABLE",
  "MCP_UNAVAILABLE",
  "TIMEOUT_POLICY_MISSING",
  "RETRY_POLICY_BLOCKED",
  "CANCELLATION_REQUESTED",
  "VALIDATION_FAILED",
] as const;
export type RuntimeStepBlockingReason = (typeof runtimeStepBlockingReasons)[number];

export const runtimeStepRetryDecisions = [
  "RETRY_ALLOWED",
  "RETRY_DENIED",
  "RETRY_EXHAUSTED",
] as const;
export type RuntimeStepRetryDecisionValue = (typeof runtimeStepRetryDecisions)[number];

export type RuntimeStepReference = ReferenceIdentifier;

export type RuntimeStepCompletionReference = {
  referenceId: string;
  referenceType: string;
  integrityChecksum: string;
  runtimeExecutionId: string;
  runtimeStepId: string;
  runtimeStepAttemptId: string;
};

export type RuntimeStepFailure = {
  code: string;
  target: string;
  safeReference: RuntimeStepReference;
  recoverable: boolean;
  userActionable: boolean;
};

export type RuntimeStepRetryDecision = {
  decision: RuntimeStepRetryDecisionValue;
  retryPolicyReference: RuntimeStepReference;
};

export type RuntimeExecutionStep = {
  formatVersion: typeof RUNTIME_EXECUTION_STEP_FORMAT_VERSION;
  runtimeExecutionId: string;
  runtimeExecutionRequestId: string;
  runtimeExecutionStartId: string;
  runtimeStepId: string;
  sequence: number;
  nameReference: string;
  purposeCode: string;
  stepKind: string;
  invocationBoundary: RuntimeInvocationBoundary;
  status: RuntimeStepStatus;
  inputReferences: RuntimeStepReference[];
  outputReferences: RuntimeStepReference[];
  dependencyRuntimeStepIds: string[];
  blockingReasons: RuntimeStepBlockingReason[];
  evidenceReferences: RuntimeStepReference[];
  approvalReferences: RuntimeStepReference[];
  policyReferences: RuntimeStepReference[];
  limitationCodes: string[];
  integrityChecksum: string;
  parentRuntimeStepId?: string;
  providerInvocationReference?: RuntimeStepReference;
  mcpInvocationReference?: RuntimeStepReference;
  timeoutPolicyReference?: RuntimeStepReference;
  retryPolicyReference?: RuntimeStepReference;
  cancellationReference?: RuntimeStepReference;
  metadata?: Record<string, unknown>;
};

export type RuntimeExecutionStepAttempt = {
  formatVersion: typeof RUNTIME_EXECUTION_STEP_FORMAT_VERSION;
  runtimeExecutionId: string;
  runtimeStepId: string;
  runtimeStepAttemptId: string;
  attemptNumber: number;
  status: RuntimeStepAttemptStatus;
  inputReferences: RuntimeStepReference[];
  outputReferences: RuntimeStepReference[];
  blockingReasons: RuntimeStepBlockingReason[];
  evidenceReferences: RuntimeStepReference[];
  limitationCodes: string[];
  integrityChecksum: string;
  startedAtReference?: RuntimeStepReference;
  completedAtReference?: RuntimeStepCompletionReference;
  failure?: RuntimeStepFailure;
  retryDecision?: RuntimeStepRetryDecision;
  previousRuntimeStepAttemptId?: string;
  providerInvocationAttemptReference?: RuntimeStepReference;
  mcpInvocationAttemptReference?: RuntimeStepReference;
  timeoutPolicyReference?: RuntimeStepReference;
  retryPolicyReference?: RuntimeStepReference;
  cancellationReference?: RuntimeStepReference;
  usageReference?: RuntimeStepReference;
  metadata?: Record<string, unknown>;
};

export type BuildRuntimeExecutionStepInput = RuntimeExecutionStep;
export type BuildRuntimeExecutionStepAttemptInput = RuntimeExecutionStepAttempt;

export type RuntimeExecutionStepFailureCode =
  | "STEP_REQUIRED_FIELD_MISSING"
  | "STEP_IDENTIFIER_INVALID"
  | "STEP_STATUS_INVALID"
  | "STEP_REFERENCE_INVALID"
  | "STEP_REFERENCE_BINDING_MISMATCH"
  | "STEP_STATUS_REFERENCE_INVALID"
  | "STEP_INVOCATION_BOUNDARY_INVALID"
  | "STEP_RETRY_INVALID"
  | "STEP_TRANSITION_INVALID"
  | "STEP_INTEGRITY_INVALID"
  | "STEP_UNKNOWN_FIELD"
  | "STEP_SECRET_DETECTED"
  | "STEP_VALUE_INVALID";

export type RuntimeExecutionStepFailure = {
  code: RuntimeExecutionStepFailureCode;
  target?: string;
};

export type RuntimeExecutionStepValidationResult =
  | { valid: true; failures: [] }
  | { valid: false; failures: RuntimeExecutionStepFailure[] };

export type BuildRuntimeExecutionStepResult =
  | { status: "VALID"; value: RuntimeExecutionStep; failures: [] }
  | { status: "INVALID"; failures: RuntimeExecutionStepFailure[] };

export type BuildRuntimeExecutionStepAttemptResult =
  | { status: "VALID"; value: RuntimeExecutionStepAttempt; failures: [] }
  | { status: "INVALID"; failures: RuntimeExecutionStepFailure[] };

export const DEFAULT_TIMEOUT_POLICY_REFERENCE: RuntimeStepReference = {
  referenceId: "DEFAULT_TIMEOUT_POLICY_REFERENCE",
  referenceType: "TIMEOUT_POLICY",
};

export const DEFAULT_RETRY_POLICY_REFERENCE: RuntimeStepReference = {
  referenceId: "DEFAULT_RETRY_POLICY_REFERENCE",
  referenceType: "RETRY_POLICY",
};

const checksumPattern = /^[a-f0-9]{64}$/;
const limitationCodePattern = /^[A-Z][A-Z0-9_]*$/;
const stepStatusSet = new Set<string>(runtimeStepStatuses);
const attemptStatusSet = new Set<string>(runtimeStepAttemptStatuses);
const invocationBoundarySet = new Set<string>(runtimeInvocationBoundaries);
const blockingReasonSet = new Set<string>(runtimeStepBlockingReasons);
const retryDecisionSet = new Set<string>(runtimeStepRetryDecisions);
const forbiddenKeyPattern =
  /^(?:access_?token|api_?key|authorization|bearer|client_?secret|credential(?:value)?|password|private_?key|refresh_?token|secret|session_?token|token|vault_?secret)$/i;
const secretValuePatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /AKIA[0-9A-Z]{16}/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
  /Authorization:\s*[^\s]+/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
] as const;

const stepKeys = new Set<keyof RuntimeExecutionStep>([
  "formatVersion",
  "runtimeExecutionId",
  "runtimeExecutionRequestId",
  "runtimeExecutionStartId",
  "runtimeStepId",
  "sequence",
  "nameReference",
  "purposeCode",
  "stepKind",
  "invocationBoundary",
  "status",
  "inputReferences",
  "outputReferences",
  "dependencyRuntimeStepIds",
  "blockingReasons",
  "evidenceReferences",
  "approvalReferences",
  "policyReferences",
  "limitationCodes",
  "integrityChecksum",
  "parentRuntimeStepId",
  "providerInvocationReference",
  "mcpInvocationReference",
  "timeoutPolicyReference",
  "retryPolicyReference",
  "cancellationReference",
  "metadata",
]);

const attemptKeys = new Set<keyof RuntimeExecutionStepAttempt>([
  "formatVersion",
  "runtimeExecutionId",
  "runtimeStepId",
  "runtimeStepAttemptId",
  "attemptNumber",
  "status",
  "inputReferences",
  "outputReferences",
  "blockingReasons",
  "evidenceReferences",
  "limitationCodes",
  "integrityChecksum",
  "startedAtReference",
  "completedAtReference",
  "failure",
  "retryDecision",
  "previousRuntimeStepAttemptId",
  "providerInvocationAttemptReference",
  "mcpInvocationAttemptReference",
  "timeoutPolicyReference",
  "retryPolicyReference",
  "cancellationReference",
  "usageReference",
  "metadata",
]);

function failure(
  code: RuntimeExecutionStepFailureCode,
  target?: string,
): RuntimeExecutionStepFailure {
  return { code, ...(target ? { target } : {}) };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isDenseArray(value: unknown): value is unknown[] {
  if (!Array.isArray(value)) return false;
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index) || value[index] === undefined) {
      return false;
    }
  }
  return true;
}

function hasForbiddenContent(value: unknown, ancestors = new WeakSet<object>()): boolean {
  if (typeof value === "string") {
    return secretValuePatterns.some((pattern) => pattern.test(value));
  }
  if (value === null || value === undefined || typeof value !== "object") return false;
  if (ancestors.has(value)) return true;
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return value.some((item) => hasForbiddenContent(item, ancestors));
    }
    if (!isPlainObject(value)) return true;
    return Object.entries(value).some(
      ([key, child]) => forbiddenKeyPattern.test(key) || hasForbiddenContent(child, ancestors),
    );
  } finally {
    ancestors.delete(value);
  }
}

function isValidReference(value: unknown): value is RuntimeStepReference {
  if (!isPlainObject(value) || !isNonEmptyString(value.referenceId)) return false;
  if (value.referenceType !== undefined && !isNonEmptyString(value.referenceType)) return false;
  return (
    value.integrityChecksum === undefined ||
    (isNonEmptyString(value.integrityChecksum) && checksumPattern.test(value.integrityChecksum))
  );
}

function isValidReferenceCollection(value: unknown): value is RuntimeStepReference[] {
  return isDenseArray(value) && value.every((reference) => isValidReference(reference));
}

function isValidStringCollection(value: unknown, pattern?: RegExp): value is string[] {
  return (
    isDenseArray(value) &&
    value.every((item) => isNonEmptyString(item) && (!pattern || pattern.test(item)))
  );
}

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length;
}

function validateMetadata(value: unknown, target: string, failures: RuntimeExecutionStepFailure[]) {
  if (value !== undefined && (!isPlainObject(value) || hasForbiddenContent(value))) {
    failures.push(failure("STEP_VALUE_INVALID", target));
  }
}

function validateOptionalReference(
  value: unknown,
  target: string,
  failures: RuntimeExecutionStepFailure[],
) {
  if (value !== undefined && !isValidReference(value)) {
    failures.push(failure("STEP_REFERENCE_INVALID", target));
  }
}

function validateRequiredReferenceCollection(
  value: unknown,
  target: string,
  failures: RuntimeExecutionStepFailure[],
) {
  if (!isValidReferenceCollection(value)) {
    failures.push(failure("STEP_REFERENCE_INVALID", target));
  }
}

function validateRequiredStringCollection(
  value: unknown,
  target: string,
  failures: RuntimeExecutionStepFailure[],
  pattern?: RegExp,
) {
  if (!isValidStringCollection(value, pattern)) {
    failures.push(failure("STEP_VALUE_INVALID", target));
  }
}

function validateCompletionReference(
  value: unknown,
  attempt: RuntimeExecutionStepAttempt,
): boolean {
  if (!isPlainObject(value)) return false;
  return (
    isNonEmptyString(value.referenceId) &&
    isNonEmptyString(value.referenceType) &&
    isNonEmptyString(value.integrityChecksum) &&
    checksumPattern.test(value.integrityChecksum) &&
    value.runtimeExecutionId === attempt.runtimeExecutionId &&
    value.runtimeStepId === attempt.runtimeStepId &&
    value.runtimeStepAttemptId === attempt.runtimeStepAttemptId
  );
}

function validateFailure(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return (
    isNonEmptyString(value.code) &&
    isNonEmptyString(value.target) &&
    isValidReference(value.safeReference) &&
    typeof value.recoverable === "boolean" &&
    typeof value.userActionable === "boolean" &&
    !hasForbiddenContent(value)
  );
}

function validateRetryDecision(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.decision === "string" &&
    retryDecisionSet.has(value.decision) &&
    isValidReference(value.retryPolicyReference)
  );
}

function cloneAndFreeze<T>(value: T): T {
  const clone = structuredClone(value);
  const freeze = (item: unknown, seen = new WeakSet<object>()): unknown => {
    if (!item || typeof item !== "object" || seen.has(item)) return item;
    seen.add(item);
    for (const child of Object.values(item)) freeze(child, seen);
    return Object.freeze(item);
  };
  return freeze(clone) as T;
}

function terminalStepReferenceFailures(step: RuntimeExecutionStep) {
  const failures: RuntimeExecutionStepFailure[] = [];
  const hasEvidence = step.evidenceReferences.length > 0;
  const hasCancellation = step.cancellationReference !== undefined;
  const hasTimeoutReference = step.timeoutPolicyReference !== undefined;

  if ((step.status === "SUCCESS" || step.status === "FAILED") && !hasEvidence) {
    failures.push(failure("STEP_STATUS_REFERENCE_INVALID", "evidenceReferences"));
  }
  if (step.status === "CANCELLED" && !hasEvidence && !hasCancellation) {
    failures.push(failure("STEP_STATUS_REFERENCE_INVALID", "cancellationReference"));
  }
  if (step.status === "TIMEOUT" && !hasEvidence && !hasTimeoutReference) {
    failures.push(failure("STEP_STATUS_REFERENCE_INVALID", "timeoutPolicyReference"));
  }
  if (step.status === "SKIPPED" && !hasEvidence && step.outputReferences.length === 0) {
    failures.push(failure("STEP_STATUS_REFERENCE_INVALID", "outputReferences"));
  }
  return failures;
}

function attemptStatusFailures(attempt: RuntimeExecutionStepAttempt) {
  const failures: RuntimeExecutionStepFailure[] = [];
  const hasEvidence = attempt.evidenceReferences.length > 0;
  const hasCompletion = attempt.completedAtReference !== undefined;
  const hasStart = attempt.startedAtReference !== undefined;
  const hasFailure = attempt.failure !== undefined;
  const hasRetryDecision = attempt.retryDecision !== undefined;
  const hasCancellation = attempt.cancellationReference !== undefined;

  const forbid = (condition: boolean, target: string) => {
    if (condition) failures.push(failure("STEP_STATUS_REFERENCE_INVALID", target));
  };
  const require = (condition: boolean, target: string) => {
    if (!condition) failures.push(failure("STEP_STATUS_REFERENCE_INVALID", target));
  };

  switch (attempt.status) {
    case "READY":
      forbid(hasStart, "startedAtReference");
      forbid(hasCompletion, "completedAtReference");
      forbid(hasFailure, "failure");
      forbid(hasRetryDecision, "retryDecision");
      forbid(hasCancellation, "cancellationReference");
      break;
    case "RUNNING":
      require(hasStart, "startedAtReference");
      forbid(hasCompletion, "completedAtReference");
      forbid(hasFailure, "failure");
      forbid(hasRetryDecision, "retryDecision");
      forbid(hasCancellation, "cancellationReference");
      break;
    case "SUCCESS":
      require(hasStart, "startedAtReference");
      require(hasCompletion, "completedAtReference");
      require(hasEvidence, "evidenceReferences");
      forbid(hasFailure, "failure");
      forbid(hasRetryDecision, "retryDecision");
      forbid(hasCancellation, "cancellationReference");
      break;
    case "FAILED":
      require(hasStart, "startedAtReference");
      require(hasCompletion, "completedAtReference");
      require(hasEvidence, "evidenceReferences");
      require(hasFailure, "failure");
      require(hasRetryDecision, "retryDecision");
      forbid(hasCancellation, "cancellationReference");
      break;
    case "CANCELLED":
      require(hasCompletion, "completedAtReference");
      require(hasEvidence || hasCancellation, "cancellationReference");
      forbid(hasFailure, "failure");
      forbid(hasRetryDecision, "retryDecision");
      break;
    case "TIMEOUT":
      require(hasStart, "startedAtReference");
      require(hasCompletion, "completedAtReference");
      require(hasRetryDecision, "retryDecision");
      forbid(hasFailure, "failure");
      forbid(hasCancellation, "cancellationReference");
      break;
  }
  return failures;
}

export function resolveRuntimeStepTimeoutPolicyReference(
  value: Pick<RuntimeExecutionStep, "timeoutPolicyReference"> | Pick<RuntimeExecutionStepAttempt, "timeoutPolicyReference">,
): RuntimeStepReference {
  return value.timeoutPolicyReference ?? DEFAULT_TIMEOUT_POLICY_REFERENCE;
}

export function resolveRuntimeStepRetryPolicyReference(
  value: Pick<RuntimeExecutionStep, "retryPolicyReference"> | Pick<RuntimeExecutionStepAttempt, "retryPolicyReference">,
): RuntimeStepReference {
  return value.retryPolicyReference ?? DEFAULT_RETRY_POLICY_REFERENCE;
}

export function canTransitionRuntimeExecutionStep(
  from: RuntimeStepStatus,
  to: RuntimeStepStatus,
): boolean {
  return (
    (from === "READY" && ["RUNNING", "WAITING", "SKIPPED", "CANCELLED"].includes(to)) ||
    (from === "WAITING" && ["READY", "CANCELLED"].includes(to)) ||
    (from === "RUNNING" && ["SUCCESS", "FAILED", "TIMEOUT", "CANCELLED", "READY"].includes(to))
  );
}

export function canTransitionRuntimeExecutionStepAttempt(
  from: RuntimeStepAttemptStatus,
  to: RuntimeStepAttemptStatus,
): boolean {
  return (
    (from === "READY" && ["RUNNING", "CANCELLED"].includes(to)) ||
    (from === "RUNNING" && ["SUCCESS", "FAILED", "TIMEOUT", "CANCELLED"].includes(to))
  );
}

export function validateRuntimeExecutionStepTransition(
  from: RuntimeStepStatus,
  to: RuntimeStepStatus,
): RuntimeExecutionStepValidationResult {
  return canTransitionRuntimeExecutionStep(from, to)
    ? { valid: true, failures: [] }
    : { valid: false, failures: [failure("STEP_TRANSITION_INVALID", "status")] };
}

export function validateRuntimeExecutionStepAttemptTransition(
  from: RuntimeStepAttemptStatus,
  to: RuntimeStepAttemptStatus,
): RuntimeExecutionStepValidationResult {
  return canTransitionRuntimeExecutionStepAttempt(from, to)
    ? { valid: true, failures: [] }
    : { valid: false, failures: [failure("STEP_TRANSITION_INVALID", "status")] };
}

export function validateRuntimeExecutionStep(value: unknown): RuntimeExecutionStepValidationResult {
  if (!isPlainObject(value)) {
    return { valid: false, failures: [failure("STEP_REQUIRED_FIELD_MISSING")] };
  }
  const failures: RuntimeExecutionStepFailure[] = [];
  if (Object.keys(value).some((key) => !stepKeys.has(key as keyof RuntimeExecutionStep))) {
    failures.push(failure("STEP_UNKNOWN_FIELD"));
  }
  if (hasForbiddenContent(value)) failures.push(failure("STEP_SECRET_DETECTED"));

  const step = value as RuntimeExecutionStep;
  if (step.formatVersion !== RUNTIME_EXECUTION_STEP_FORMAT_VERSION) {
    failures.push(failure("STEP_IDENTIFIER_INVALID", "formatVersion"));
  }
  for (const field of [
    "runtimeExecutionId",
    "runtimeExecutionRequestId",
    "runtimeExecutionStartId",
    "runtimeStepId",
    "nameReference",
    "purposeCode",
    "stepKind",
  ] as const) {
    if (!isNonEmptyString(step[field])) failures.push(failure("STEP_REQUIRED_FIELD_MISSING", field));
  }
  if (!Number.isSafeInteger(step.sequence) || step.sequence < 0) {
    failures.push(failure("STEP_IDENTIFIER_INVALID", "sequence"));
  }
  if (!stepStatusSet.has(step.status)) failures.push(failure("STEP_STATUS_INVALID", "status"));
  if (!invocationBoundarySet.has(step.invocationBoundary)) {
    failures.push(failure("STEP_INVOCATION_BOUNDARY_INVALID", "invocationBoundary"));
  }
  for (const field of [
    "inputReferences",
    "outputReferences",
    "evidenceReferences",
    "approvalReferences",
    "policyReferences",
  ] as const) {
    validateRequiredReferenceCollection(step[field], field, failures);
  }
  validateRequiredStringCollection(
    step.dependencyRuntimeStepIds,
    "dependencyRuntimeStepIds",
    failures,
  );
  validateRequiredStringCollection(step.blockingReasons, "blockingReasons", failures);
  validateRequiredStringCollection(step.limitationCodes, "limitationCodes", failures, limitationCodePattern);
  if (hasDuplicates(step.dependencyRuntimeStepIds ?? [])) {
    failures.push(failure("STEP_REFERENCE_INVALID", "dependencyRuntimeStepIds"));
  }
  if (step.dependencyRuntimeStepIds?.includes(step.runtimeStepId)) {
    failures.push(failure("STEP_REFERENCE_BINDING_MISMATCH", "dependencyRuntimeStepIds"));
  }
  if (step.parentRuntimeStepId !== undefined) {
    if (!isNonEmptyString(step.parentRuntimeStepId)) {
      failures.push(failure("STEP_IDENTIFIER_INVALID", "parentRuntimeStepId"));
    } else if (step.parentRuntimeStepId === step.runtimeStepId) {
      failures.push(failure("STEP_REFERENCE_BINDING_MISMATCH", "parentRuntimeStepId"));
    }
  }
  if (!isValidStringCollection(step.blockingReasons) || !step.blockingReasons.every((reason) => blockingReasonSet.has(reason))) {
    failures.push(failure("STEP_STATUS_INVALID", "blockingReasons"));
  }
  if (hasDuplicates(step.blockingReasons ?? [])) {
    failures.push(failure("STEP_REFERENCE_INVALID", "blockingReasons"));
  }
  if (step.blockingReasons?.includes("APPROVAL_REQUIRED") && step.approvalReferences?.length === 0) {
    failures.push(failure("STEP_STATUS_REFERENCE_INVALID", "approvalReferences"));
  }
  if (!checksumPattern.test(step.integrityChecksum ?? "")) {
    failures.push(failure("STEP_INTEGRITY_INVALID", "integrityChecksum"));
  }
  for (const field of [
    "providerInvocationReference",
    "mcpInvocationReference",
    "timeoutPolicyReference",
    "retryPolicyReference",
    "cancellationReference",
  ] as const) {
    validateOptionalReference(step[field], field, failures);
  }
  validateMetadata(step.metadata, "metadata", failures);

  if (step.invocationBoundary === "PROVIDER") {
    if (!isValidReference(step.providerInvocationReference)) {
      failures.push(failure("STEP_INVOCATION_BOUNDARY_INVALID", "providerInvocationReference"));
    }
    if (step.mcpInvocationReference !== undefined) {
      failures.push(failure("STEP_INVOCATION_BOUNDARY_INVALID", "mcpInvocationReference"));
    }
  } else if (step.invocationBoundary === "MCP") {
    if (!isValidReference(step.mcpInvocationReference)) {
      failures.push(failure("STEP_INVOCATION_BOUNDARY_INVALID", "mcpInvocationReference"));
    }
    if (step.providerInvocationReference !== undefined) {
      failures.push(failure("STEP_INVOCATION_BOUNDARY_INVALID", "providerInvocationReference"));
    }
  } else if (
    step.providerInvocationReference !== undefined ||
    step.mcpInvocationReference !== undefined
  ) {
    failures.push(failure("STEP_INVOCATION_BOUNDARY_INVALID", "invocationBoundary"));
  }
  failures.push(...terminalStepReferenceFailures(step));
  return failures.length === 0 ? { valid: true, failures: [] } : { valid: false, failures };
}

export function validateRuntimeExecutionStepAttempt(
  value: unknown,
): RuntimeExecutionStepValidationResult {
  if (!isPlainObject(value)) {
    return { valid: false, failures: [failure("STEP_REQUIRED_FIELD_MISSING")] };
  }
  const failures: RuntimeExecutionStepFailure[] = [];
  if (Object.keys(value).some((key) => !attemptKeys.has(key as keyof RuntimeExecutionStepAttempt))) {
    failures.push(failure("STEP_UNKNOWN_FIELD"));
  }
  if (hasForbiddenContent(value)) failures.push(failure("STEP_SECRET_DETECTED"));

  const attempt = value as RuntimeExecutionStepAttempt;
  if (attempt.formatVersion !== RUNTIME_EXECUTION_STEP_FORMAT_VERSION) {
    failures.push(failure("STEP_IDENTIFIER_INVALID", "formatVersion"));
  }
  for (const field of [
    "runtimeExecutionId",
    "runtimeStepId",
    "runtimeStepAttemptId",
  ] as const) {
    if (!isNonEmptyString(attempt[field])) {
      failures.push(failure("STEP_REQUIRED_FIELD_MISSING", field));
    }
  }
  const hasValidAttemptNumber =
    Number.isSafeInteger(attempt.attemptNumber) && attempt.attemptNumber >= 1;
  if (!hasValidAttemptNumber) {
    failures.push(failure("STEP_IDENTIFIER_INVALID", "attemptNumber"));
  }
  if (!attemptStatusSet.has(attempt.status)) {
    failures.push(failure("STEP_STATUS_INVALID", "status"));
  }
  for (const field of ["inputReferences", "outputReferences", "evidenceReferences"] as const) {
    validateRequiredReferenceCollection(attempt[field], field, failures);
  }
  validateRequiredStringCollection(attempt.blockingReasons, "blockingReasons", failures);
  validateRequiredStringCollection(attempt.limitationCodes, "limitationCodes", failures, limitationCodePattern);
  if (!isValidStringCollection(attempt.blockingReasons) || !attempt.blockingReasons.every((reason) => blockingReasonSet.has(reason))) {
    failures.push(failure("STEP_STATUS_INVALID", "blockingReasons"));
  }
  if (hasDuplicates(attempt.blockingReasons ?? [])) {
    failures.push(failure("STEP_REFERENCE_INVALID", "blockingReasons"));
  }
  if (!checksumPattern.test(attempt.integrityChecksum ?? "")) {
    failures.push(failure("STEP_INTEGRITY_INVALID", "integrityChecksum"));
  }
  for (const field of [
    "startedAtReference",
    "providerInvocationAttemptReference",
    "mcpInvocationAttemptReference",
    "timeoutPolicyReference",
    "retryPolicyReference",
    "cancellationReference",
    "usageReference",
  ] as const) {
    validateOptionalReference(attempt[field], field, failures);
  }
  if (
    attempt.providerInvocationAttemptReference !== undefined &&
    attempt.mcpInvocationAttemptReference !== undefined
  ) {
    failures.push(failure("STEP_INVOCATION_BOUNDARY_INVALID", "providerInvocationAttemptReference"));
  }
  if (attempt.completedAtReference !== undefined && !validateCompletionReference(attempt.completedAtReference, attempt)) {
    failures.push(failure("STEP_REFERENCE_BINDING_MISMATCH", "completedAtReference"));
  }
  if (attempt.failure !== undefined && !validateFailure(attempt.failure)) {
    failures.push(failure("STEP_REFERENCE_INVALID", "failure"));
  }
  if (attempt.retryDecision !== undefined && !validateRetryDecision(attempt.retryDecision)) {
    failures.push(failure("STEP_RETRY_INVALID", "retryDecision"));
  }
  const hasPredecessor = attempt.previousRuntimeStepAttemptId !== undefined;
  const hasValidPredecessor =
    isNonEmptyString(attempt.previousRuntimeStepAttemptId) &&
    attempt.previousRuntimeStepAttemptId !== attempt.runtimeStepAttemptId;
  if (hasPredecessor && !hasValidPredecessor) {
    failures.push(failure("STEP_RETRY_INVALID", "previousRuntimeStepAttemptId"));
  }
  if (hasValidAttemptNumber && attempt.attemptNumber === 1 && hasPredecessor) {
    failures.push(failure("STEP_RETRY_INVALID", "previousRuntimeStepAttemptId"));
  }
  if (hasValidAttemptNumber && attempt.attemptNumber > 1 && !hasValidPredecessor) {
    failures.push(failure("STEP_RETRY_INVALID", "previousRuntimeStepAttemptId"));
  }
  validateMetadata(attempt.metadata, "metadata", failures);
  failures.push(...attemptStatusFailures(attempt));

  if (attempt.status === "TIMEOUT" && attempt.completedAtReference?.referenceType !== "ATTEMPT_TIMEOUT") {
    failures.push(failure("STEP_STATUS_REFERENCE_INVALID", "completedAtReference"));
  }
  return failures.length === 0 ? { valid: true, failures: [] } : { valid: false, failures };
}

export function validateRuntimeExecutionStepAttemptRetry(
  previous: RuntimeExecutionStepAttempt,
  next: RuntimeExecutionStepAttempt,
): RuntimeExecutionStepValidationResult {
  const failures: RuntimeExecutionStepFailure[] = [];
  const previousValidation = validateRuntimeExecutionStepAttempt(previous);
  const nextValidation = validateRuntimeExecutionStepAttempt(next);
  if (!previousValidation.valid || !nextValidation.valid) {
    return { valid: false, failures: [failure("STEP_RETRY_INVALID")] };
  }
  if (
    (previous.status !== "FAILED" && previous.status !== "TIMEOUT") ||
    previous.retryDecision?.decision !== "RETRY_ALLOWED"
  ) {
    failures.push(failure("STEP_RETRY_INVALID", "retryDecision"));
  }
  if (previous.runtimeExecutionId !== next.runtimeExecutionId) {
    failures.push(failure("STEP_REFERENCE_BINDING_MISMATCH", "runtimeExecutionId"));
  }
  if (previous.runtimeStepId !== next.runtimeStepId) {
    failures.push(failure("STEP_REFERENCE_BINDING_MISMATCH", "runtimeStepId"));
  }
  if (previous.runtimeStepAttemptId === next.runtimeStepAttemptId) {
    failures.push(failure("STEP_RETRY_INVALID", "runtimeStepAttemptId"));
  }
  if (next.previousRuntimeStepAttemptId !== previous.runtimeStepAttemptId) {
    failures.push(failure("STEP_RETRY_INVALID", "previousRuntimeStepAttemptId"));
  }
  if (next.attemptNumber !== previous.attemptNumber + 1) {
    failures.push(failure("STEP_RETRY_INVALID", "attemptNumber"));
  }
  return failures.length === 0 ? { valid: true, failures: [] } : { valid: false, failures };
}

export function buildRuntimeExecutionStep(
  input: BuildRuntimeExecutionStepInput,
): BuildRuntimeExecutionStepResult {
  const validation = validateRuntimeExecutionStep(input);
  if (!validation.valid) return { status: "INVALID", failures: validation.failures };
  try {
    return { status: "VALID", value: cloneAndFreeze(input), failures: [] };
  } catch {
    return { status: "INVALID", failures: [failure("STEP_VALUE_INVALID")] };
  }
}

export function buildRuntimeExecutionStepAttempt(
  input: BuildRuntimeExecutionStepAttemptInput,
): BuildRuntimeExecutionStepAttemptResult {
  const validation = validateRuntimeExecutionStepAttempt(input);
  if (!validation.valid) return { status: "INVALID", failures: validation.failures };
  try {
    return { status: "VALID", value: cloneAndFreeze(input), failures: [] };
  } catch {
    return { status: "INVALID", failures: [failure("STEP_VALUE_INVALID")] };
  }
}
