import { createHash } from "node:crypto";
import type {
  ReferenceIdentifier,
  RuntimeExecutionRequest,
} from "./runtime-execution-request";
import type {
  RuntimeExecutionStart,
  RuntimePreflightResult,
} from "./runtime-execution-start";

export const RUNTIME_EXECUTION_RESULT_FORMAT_VERSION =
  "buildflow.runtime-execution-result.v1" as const;

export const runtimeExecutionResultStatuses = [
  "SUCCEEDED",
  "SUCCEEDED_WITH_LIMITATIONS",
  "FAILED",
  "CANCELLED",
  "TIMED_OUT",
  "BLOCKED",
  "INVALID",
] as const;

export type RuntimeExecutionResultStatus =
  (typeof runtimeExecutionResultStatuses)[number];

export type RuntimeExecutionResultReference = ReferenceIdentifier;

export type RuntimeExecutionResultRequestReference = {
  runtimeExecutionRequestId: string;
  integrityChecksum: string;
};

export type RuntimeExecutionResultPreflightReference = {
  runtimePreflightResultId: string;
  integrityChecksum: string;
};

export type RuntimeExecutionResultStartReference = {
  runtimeExecutionStartId: string;
  integrityChecksum: string;
};

export type RuntimeExecutionResult = {
  formatVersion: typeof RUNTIME_EXECUTION_RESULT_FORMAT_VERSION;
  runtimeExecutionResultId: string;
  runtimeExecutionId: string;
  runtimeExecutionRequestReference: RuntimeExecutionResultRequestReference;
  runtimePreflightResultReference: RuntimeExecutionResultPreflightReference;
  runtimeExecutionStartReference: RuntimeExecutionResultStartReference;
  status: RuntimeExecutionResultStatus;
  completedAt: string;
  stepSummaryReference?: RuntimeExecutionResultReference;
  attemptSummaryReference?: RuntimeExecutionResultReference;
  evidenceReferences?: RuntimeExecutionResultReference[];
  limitationCode?: string;
  limitationReferences?: RuntimeExecutionResultReference[];
  outputReference?: RuntimeExecutionResultReference;
  errorReference?: RuntimeExecutionResultReference;
  blockingReference?: RuntimeExecutionResultReference;
  cancellationReference?: RuntimeExecutionResultReference;
  timeoutReference?: RuntimeExecutionResultReference;
  validationReference?: RuntimeExecutionResultReference;
  integrityChecksum: string;
};

export type BuildRuntimeExecutionResultInput = {
  runtimeExecutionRequest: Pick<
    RuntimeExecutionRequest,
    "runtimeExecutionRequestId" | "integrityChecksum"
  >;
  runtimePreflightResult: Pick<
    RuntimePreflightResult,
    | "runtimePreflightResultId"
    | "integrityChecksum"
    | "runtimeExecutionRequestReference"
  >;
  runtimeExecutionStart: Pick<
    RuntimeExecutionStart,
    | "runtimeExecutionStartId"
    | "runtimeExecutionId"
    | "integrityChecksum"
    | "runtimeExecutionRequestReference"
    | "runtimePreflightResultReference"
    | "startedAt"
  >;
  status: RuntimeExecutionResultStatus;
  completedAt: string;
  stepSummaryReference?: RuntimeExecutionResultReference;
  attemptSummaryReference?: RuntimeExecutionResultReference;
  evidenceReferences?: RuntimeExecutionResultReference[];
  limitationCode?: string;
  limitationReferences?: RuntimeExecutionResultReference[];
  outputReference?: RuntimeExecutionResultReference;
  errorReference?: RuntimeExecutionResultReference;
  blockingReference?: RuntimeExecutionResultReference;
  cancellationReference?: RuntimeExecutionResultReference;
  timeoutReference?: RuntimeExecutionResultReference;
  validationReference?: RuntimeExecutionResultReference;
};

export type RuntimeExecutionResultFailureCode =
  | "RESULT_REQUIRED_FIELD_MISSING"
  | "RESULT_IDENTIFIER_INVALID"
  | "RESULT_REFERENCE_INVALID"
  | "RESULT_REFERENCE_BINDING_MISMATCH"
  | "RESULT_STATUS_INVALID"
  | "RESULT_STATUS_REFERENCE_INVALID"
  | "RESULT_TIMESTAMP_INVALID"
  | "RESULT_INTEGRITY_INVALID"
  | "RESULT_UNKNOWN_FIELD"
  | "RESULT_SECRET_DETECTED"
  | "RESULT_CANONICALIZATION_INVALID";

export type RuntimeExecutionResultFailure = {
  code: RuntimeExecutionResultFailureCode;
  target?: string;
};

export type RuntimeExecutionResultValidationResult =
  | { valid: true; failures: [] }
  | { valid: false; failures: RuntimeExecutionResultFailure[] };

export type BuildRuntimeExecutionResultResult =
  | { status: "VALID"; value: RuntimeExecutionResult; failures: [] }
  | { status: "INVALID"; failures: RuntimeExecutionResultFailure[] };

export class RuntimeExecutionResultCanonicalizationError extends Error {
  constructor(message = "Runtime Execution Result cannot be canonicalized.") {
    super(message);
    this.name = "RuntimeExecutionResultCanonicalizationError";
  }
}

const checksumPattern = /^[a-f0-9]{64}$/;
const limitationCodePattern = /^[A-Z][A-Z0-9_]*$/;
const resultStatusSet = new Set<string>(runtimeExecutionResultStatuses);
const forbiddenKeyPattern =
  /^(?:access_?token|api_?key|authorization|bearer|client_?secret|credential(?:value)?|password|private_?key|refresh_?token|secret|session_?token|token|vault_?secret)$/i;
const secretValuePatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /AKIA[0-9A-Z]{16}/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
] as const;

function failure(
  code: RuntimeExecutionResultFailureCode,
  target?: string,
): RuntimeExecutionResultFailure {
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

function isCanonicalIsoUtc(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function compareUtf8(left: string, right: string) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function referenceSortKey(reference: RuntimeExecutionResultReference) {
  return [
    reference.referenceType ?? "",
    reference.referenceId,
    reference.integrityChecksum ?? "",
  ] as const;
}

function referencesAreCanonical(references: RuntimeExecutionResultReference[]) {
  for (let index = 1; index < references.length; index += 1) {
    const previous = referenceSortKey(references[index - 1]);
    const current = referenceSortKey(references[index]);
    for (let part = 0; part < previous.length; part += 1) {
      const comparison = compareUtf8(previous[part], current[part]);
      if (comparison > 0) return false;
      if (comparison < 0) break;
    }
  }
  return true;
}

function referencesHaveDuplicates(references: RuntimeExecutionResultReference[]) {
  const seen = new Set<string>();
  for (const reference of references) {
    const key = referenceSortKey(reference).join("\u0000");
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
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

function hasForbiddenValue(value: unknown, ancestors = new WeakSet<object>()): boolean {
  if (typeof value === "string") {
    return secretValuePatterns.some((pattern) => pattern.test(value));
  }
  if (!value || typeof value !== "object") return false;
  if (ancestors.has(value)) return false;
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return value.some((item) => hasForbiddenValue(item, ancestors));
    }
    if (!isPlainObject(value)) return true;
    return Object.entries(value).some(
      ([key, child]) => forbiddenKeyPattern.test(key) || hasForbiddenValue(child, ancestors),
    );
  } finally {
    ancestors.delete(value);
  }
}

function cloneReference(
  reference: RuntimeExecutionResultReference | undefined,
): RuntimeExecutionResultReference | undefined {
  if (!reference) return undefined;
  return {
    referenceId: reference.referenceId,
    ...(reference.integrityChecksum
      ? { integrityChecksum: reference.integrityChecksum }
      : {}),
    ...(reference.referenceType ? { referenceType: reference.referenceType } : {}),
  };
}

function cloneReferences(references: RuntimeExecutionResultReference[] | undefined) {
  return references?.map((reference) => cloneReference(reference)!);
}

function isValidReference(reference: unknown): reference is RuntimeExecutionResultReference {
  if (!isPlainObject(reference) || !isNonEmptyString(reference.referenceId)) return false;
  if (
    reference.integrityChecksum !== undefined &&
    (!isNonEmptyString(reference.integrityChecksum) ||
      !checksumPattern.test(reference.integrityChecksum))
  ) {
    return false;
  }
  return reference.referenceType === undefined || isNonEmptyString(reference.referenceType);
}

function isValidReferenceCollection(value: unknown): value is RuntimeExecutionResultReference[] {
  return (
    isDenseArray(value) &&
    value.every(isValidReference) &&
    !referencesHaveDuplicates(value) &&
    referencesAreCanonical(value)
  );
}

function canonicalValue(value: unknown, ancestors = new WeakSet<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new RuntimeExecutionResultCanonicalizationError("Non-finite number.");
    }
    return value;
  }
  if (
    value === undefined ||
    typeof value === "bigint" ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    throw new RuntimeExecutionResultCanonicalizationError("Unsupported value.");
  }
  if (!value || typeof value !== "object") {
    throw new RuntimeExecutionResultCanonicalizationError("Unsupported value.");
  }
  if (ancestors.has(value)) {
    throw new RuntimeExecutionResultCanonicalizationError("Cyclic value.");
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const items: unknown[] = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.prototype.hasOwnProperty.call(value, index) || value[index] === undefined) {
          throw new RuntimeExecutionResultCanonicalizationError("Sparse or undefined array value.");
        }
        items.push(canonicalValue(value[index], ancestors));
      }
      return items;
    }
    if (!isPlainObject(value)) {
      throw new RuntimeExecutionResultCanonicalizationError("Non-plain object.");
    }
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalValue(value[key], ancestors)]),
    );
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalizeRuntimeExecutionResult(value: unknown) {
  return JSON.stringify(canonicalValue(value));
}

export function digestRuntimeExecutionResult(value: unknown) {
  return createHash("sha256")
    .update(canonicalizeRuntimeExecutionResult(value), "utf8")
    .digest("hex");
}

function resultDeterministicCore(
  result: Omit<RuntimeExecutionResult, "runtimeExecutionResultId" | "integrityChecksum">,
) {
  return result;
}

function resultIntegrityPayload(result: RuntimeExecutionResult) {
  return Object.fromEntries(
    Object.entries(result).filter(([key]) => key !== "integrityChecksum"),
  );
}

function statusReferenceFailures(
  result: Omit<RuntimeExecutionResult, "runtimeExecutionResultId" | "integrityChecksum">,
) {
  const failures: RuntimeExecutionResultFailure[] = [];
  type ConditionalField =
    | "stepSummaryReference"
    | "attemptSummaryReference"
    | "evidenceReferences"
    | "limitationCode"
    | "limitationReferences"
    | "outputReference"
    | "errorReference"
    | "blockingReference"
    | "cancellationReference"
    | "timeoutReference"
    | "validationReference";

  const conditionalFields: ConditionalField[] = [
    "stepSummaryReference",
    "attemptSummaryReference",
    "evidenceReferences",
    "limitationCode",
    "limitationReferences",
    "outputReference",
    "errorReference",
    "blockingReference",
    "cancellationReference",
    "timeoutReference",
    "validationReference",
  ];
  const requireReference = (
    field:
      | "stepSummaryReference"
      | "errorReference"
      | "blockingReference"
      | "cancellationReference"
      | "timeoutReference"
      | "validationReference",
  ) => {
    if (!isValidReference(result[field])) {
      failures.push(failure("RESULT_STATUS_REFERENCE_INVALID", field));
    }
  };
  const requireEvidence = () => {
    if (!result.evidenceReferences?.length) {
      failures.push(failure("RESULT_STATUS_REFERENCE_INVALID", "evidenceReferences"));
    }
  };
  const forbidAllExcept = (allowed: ConditionalField[]) => {
    for (const field of conditionalFields) {
      if (!allowed.includes(field) && result[field] !== undefined) {
        failures.push(failure("RESULT_STATUS_REFERENCE_INVALID", field));
      }
    }
  };

  switch (result.status) {
    case "SUCCEEDED":
      requireReference("stepSummaryReference");
      requireEvidence();
      forbidAllExcept([
        "stepSummaryReference",
        "attemptSummaryReference",
        "evidenceReferences",
        "outputReference",
      ]);
      break;
    case "SUCCEEDED_WITH_LIMITATIONS":
      requireReference("stepSummaryReference");
      requireEvidence();
      if (
        !isNonEmptyString(result.limitationCode) &&
        (!result.limitationReferences || result.limitationReferences.length === 0)
      ) {
        failures.push(failure("RESULT_STATUS_REFERENCE_INVALID", "limitationCode"));
      }
      forbidAllExcept([
        "stepSummaryReference",
        "attemptSummaryReference",
        "evidenceReferences",
        "limitationCode",
        "limitationReferences",
        "outputReference",
      ]);
      break;
    case "FAILED":
      requireReference("stepSummaryReference");
      requireReference("errorReference");
      requireEvidence();
      forbidAllExcept([
        "stepSummaryReference",
        "attemptSummaryReference",
        "evidenceReferences",
        "outputReference",
        "errorReference",
      ]);
      break;
    case "CANCELLED":
      requireReference("cancellationReference");
      forbidAllExcept([
        "stepSummaryReference",
        "attemptSummaryReference",
        "evidenceReferences",
        "outputReference",
        "cancellationReference",
      ]);
      break;
    case "TIMED_OUT":
      requireReference("timeoutReference");
      forbidAllExcept([
        "stepSummaryReference",
        "attemptSummaryReference",
        "evidenceReferences",
        "outputReference",
        "timeoutReference",
      ]);
      break;
    case "BLOCKED":
      requireReference("blockingReference");
      forbidAllExcept([
        "stepSummaryReference",
        "attemptSummaryReference",
        "outputReference",
        "blockingReference",
        "validationReference",
      ]);
      break;
    case "INVALID":
      requireReference("validationReference");
      forbidAllExcept([
        "stepSummaryReference",
        "attemptSummaryReference",
        "outputReference",
        "errorReference",
        "validationReference",
      ]);
      break;
  }
  return failures;
}

function validateReferences(result: RuntimeExecutionResult) {
  const failures: RuntimeExecutionResultFailure[] = [];
  const references: Array<[string, RuntimeExecutionResultReference | undefined]> = [
    ["stepSummaryReference", result.stepSummaryReference],
    ["attemptSummaryReference", result.attemptSummaryReference],
    ["outputReference", result.outputReference],
    ["errorReference", result.errorReference],
    ["blockingReference", result.blockingReference],
    ["cancellationReference", result.cancellationReference],
    ["timeoutReference", result.timeoutReference],
    ["validationReference", result.validationReference],
  ];
  for (const [target, reference] of references) {
    if (reference !== undefined && !isValidReference(reference)) {
      failures.push(failure("RESULT_REFERENCE_INVALID", target));
    }
  }
  if (result.evidenceReferences !== undefined) {
    if (!isValidReferenceCollection(result.evidenceReferences)) {
      failures.push(failure("RESULT_REFERENCE_INVALID", "evidenceReferences"));
    }
  }
  if (result.limitationReferences !== undefined) {
    if (!isValidReferenceCollection(result.limitationReferences)) {
      failures.push(failure("RESULT_REFERENCE_INVALID", "limitationReferences"));
    }
  }
  return failures;
}

const resultKeys = new Set<keyof RuntimeExecutionResult>([
  "formatVersion",
  "runtimeExecutionResultId",
  "runtimeExecutionId",
  "runtimeExecutionRequestReference",
  "runtimePreflightResultReference",
  "runtimeExecutionStartReference",
  "status",
  "completedAt",
  "stepSummaryReference",
  "attemptSummaryReference",
  "evidenceReferences",
  "limitationCode",
  "limitationReferences",
  "outputReference",
  "errorReference",
  "blockingReference",
  "cancellationReference",
  "timeoutReference",
  "validationReference",
  "integrityChecksum",
]);

export function validateRuntimeExecutionResult(
  value: unknown,
): RuntimeExecutionResultValidationResult {
  if (!isPlainObject(value)) {
    return { valid: false, failures: [failure("RESULT_REQUIRED_FIELD_MISSING")] };
  }
  const failures: RuntimeExecutionResultFailure[] = [];
  if (Object.keys(value).some((key) => !resultKeys.has(key as keyof RuntimeExecutionResult))) {
    failures.push(failure("RESULT_UNKNOWN_FIELD"));
  }
  if (hasForbiddenValue(value)) failures.push(failure("RESULT_SECRET_DETECTED"));

  const result = value as RuntimeExecutionResult;
  if (result.formatVersion !== RUNTIME_EXECUTION_RESULT_FORMAT_VERSION) {
    failures.push(failure("RESULT_IDENTIFIER_INVALID", "formatVersion"));
  }
  if (!isNonEmptyString(result.runtimeExecutionResultId)) {
    failures.push(failure("RESULT_REQUIRED_FIELD_MISSING", "runtimeExecutionResultId"));
  }
  if (!isNonEmptyString(result.runtimeExecutionId)) {
    failures.push(failure("RESULT_REQUIRED_FIELD_MISSING", "runtimeExecutionId"));
  }
  if (
    !isNonEmptyString(result.runtimeExecutionRequestReference?.runtimeExecutionRequestId) ||
    !checksumPattern.test(result.runtimeExecutionRequestReference?.integrityChecksum ?? "")
  ) {
    failures.push(failure("RESULT_REFERENCE_INVALID", "runtimeExecutionRequestReference"));
  }
  if (
    !isNonEmptyString(result.runtimePreflightResultReference?.runtimePreflightResultId) ||
    !checksumPattern.test(result.runtimePreflightResultReference?.integrityChecksum ?? "")
  ) {
    failures.push(failure("RESULT_REFERENCE_INVALID", "runtimePreflightResultReference"));
  }
  if (
    !isNonEmptyString(result.runtimeExecutionStartReference?.runtimeExecutionStartId) ||
    !checksumPattern.test(result.runtimeExecutionStartReference?.integrityChecksum ?? "")
  ) {
    failures.push(failure("RESULT_REFERENCE_INVALID", "runtimeExecutionStartReference"));
  }
  if (!resultStatusSet.has(result.status)) {
    failures.push(failure("RESULT_STATUS_INVALID", "status"));
  }
  if (!isCanonicalIsoUtc(result.completedAt)) {
    failures.push(failure("RESULT_TIMESTAMP_INVALID", "completedAt"));
  }
  if (!checksumPattern.test(result.integrityChecksum ?? "")) {
    failures.push(failure("RESULT_INTEGRITY_INVALID", "integrityChecksum"));
  }
  if (result.limitationCode && !limitationCodePattern.test(result.limitationCode)) {
    failures.push(failure("RESULT_STATUS_REFERENCE_INVALID", "limitationCode"));
  }
  failures.push(...validateReferences(result));
  failures.push(...statusReferenceFailures(result));

  if (failures.length > 0) return { valid: false, failures };
  try {
    const { runtimeExecutionResultId, integrityChecksum, ...core } = result;
    if (runtimeExecutionResultId !== digestRuntimeExecutionResult(core)) {
      failures.push(failure("RESULT_INTEGRITY_INVALID", "runtimeExecutionResultId"));
    }
    if (integrityChecksum !== digestRuntimeExecutionResult(resultIntegrityPayload(result))) {
      failures.push(failure("RESULT_INTEGRITY_INVALID", "integrityChecksum"));
    }
  } catch {
    failures.push(failure("RESULT_CANONICALIZATION_INVALID"));
  }
  return failures.length === 0 ? { valid: true, failures: [] } : { valid: false, failures };
}

export function buildRuntimeExecutionResult(
  input: BuildRuntimeExecutionResultInput,
): BuildRuntimeExecutionResultResult {
  try {
    if (hasForbiddenValue(input)) {
      return { status: "INVALID", failures: [failure("RESULT_SECRET_DETECTED")] };
    }
    const failures: RuntimeExecutionResultFailure[] = [];
    if (!isNonEmptyString(input.runtimeExecutionRequest.runtimeExecutionRequestId)) {
      failures.push(failure("RESULT_REQUIRED_FIELD_MISSING", "runtimeExecutionRequest"));
    }
    if (!checksumPattern.test(input.runtimeExecutionRequest.integrityChecksum ?? "")) {
      failures.push(failure("RESULT_REFERENCE_INVALID", "runtimeExecutionRequest.integrityChecksum"));
    }
    if (!isNonEmptyString(input.runtimePreflightResult.runtimePreflightResultId)) {
      failures.push(failure("RESULT_REQUIRED_FIELD_MISSING", "runtimePreflightResult"));
    }
    if (!checksumPattern.test(input.runtimePreflightResult.integrityChecksum ?? "")) {
      failures.push(failure("RESULT_REFERENCE_INVALID", "runtimePreflightResult.integrityChecksum"));
    }
    if (!isNonEmptyString(input.runtimeExecutionStart.runtimeExecutionStartId)) {
      failures.push(failure("RESULT_REQUIRED_FIELD_MISSING", "runtimeExecutionStart"));
    }
    if (!checksumPattern.test(input.runtimeExecutionStart.integrityChecksum ?? "")) {
      failures.push(failure("RESULT_REFERENCE_INVALID", "runtimeExecutionStart.integrityChecksum"));
    }
    if (!isNonEmptyString(input.runtimeExecutionStart.runtimeExecutionId)) {
      failures.push(failure("RESULT_REQUIRED_FIELD_MISSING", "runtimeExecutionStart.runtimeExecutionId"));
    }
    if (
      input.runtimePreflightResult.runtimeExecutionRequestReference
        .runtimeExecutionRequestId !== input.runtimeExecutionRequest.runtimeExecutionRequestId ||
      input.runtimePreflightResult.runtimeExecutionRequestReference.integrityChecksum !==
        input.runtimeExecutionRequest.integrityChecksum ||
      input.runtimeExecutionStart.runtimeExecutionRequestReference
        .runtimeExecutionRequestId !== input.runtimeExecutionRequest.runtimeExecutionRequestId ||
      input.runtimeExecutionStart.runtimeExecutionRequestReference.integrityChecksum !==
        input.runtimeExecutionRequest.integrityChecksum ||
      input.runtimeExecutionStart.runtimePreflightResultReference
        .runtimePreflightResultId !== input.runtimePreflightResult.runtimePreflightResultId ||
      input.runtimeExecutionStart.runtimePreflightResultReference.integrityChecksum !==
        input.runtimePreflightResult.integrityChecksum
    ) {
      failures.push(failure("RESULT_REFERENCE_BINDING_MISMATCH"));
    }
    if (!isCanonicalIsoUtc(input.completedAt) || !isCanonicalIsoUtc(input.runtimeExecutionStart.startedAt)) {
      failures.push(failure("RESULT_TIMESTAMP_INVALID", "completedAt"));
    } else if (input.completedAt < input.runtimeExecutionStart.startedAt) {
      failures.push(failure("RESULT_TIMESTAMP_INVALID", "completedAt"));
    }
    if (!resultStatusSet.has(input.status)) {
      failures.push(failure("RESULT_STATUS_INVALID", "status"));
    }
    if (input.limitationCode && !limitationCodePattern.test(input.limitationCode)) {
      failures.push(failure("RESULT_STATUS_REFERENCE_INVALID", "limitationCode"));
    }
    if (
      input.evidenceReferences !== undefined &&
      !isValidReferenceCollection(input.evidenceReferences)
    ) {
      failures.push(failure("RESULT_REFERENCE_INVALID", "evidenceReferences"));
    }
    if (
      input.limitationReferences !== undefined &&
      !isValidReferenceCollection(input.limitationReferences)
    ) {
      failures.push(failure("RESULT_REFERENCE_INVALID", "limitationReferences"));
    }
    if (failures.length > 0) return { status: "INVALID", failures };

    const core = resultDeterministicCore({
      formatVersion: RUNTIME_EXECUTION_RESULT_FORMAT_VERSION,
      runtimeExecutionId: input.runtimeExecutionStart.runtimeExecutionId,
      runtimeExecutionRequestReference: {
        runtimeExecutionRequestId: input.runtimeExecutionRequest.runtimeExecutionRequestId,
        integrityChecksum: input.runtimeExecutionRequest.integrityChecksum,
      },
      runtimePreflightResultReference: {
        runtimePreflightResultId: input.runtimePreflightResult.runtimePreflightResultId,
        integrityChecksum: input.runtimePreflightResult.integrityChecksum,
      },
      runtimeExecutionStartReference: {
        runtimeExecutionStartId: input.runtimeExecutionStart.runtimeExecutionStartId,
        integrityChecksum: input.runtimeExecutionStart.integrityChecksum,
      },
      status: input.status,
      completedAt: input.completedAt,
      ...(input.stepSummaryReference
        ? { stepSummaryReference: cloneReference(input.stepSummaryReference) }
        : {}),
      ...(input.attemptSummaryReference
        ? { attemptSummaryReference: cloneReference(input.attemptSummaryReference) }
        : {}),
      ...(input.evidenceReferences ? { evidenceReferences: cloneReferences(input.evidenceReferences) } : {}),
      ...(input.limitationCode ? { limitationCode: input.limitationCode } : {}),
      ...(input.limitationReferences
        ? { limitationReferences: cloneReferences(input.limitationReferences) }
        : {}),
      ...(input.outputReference ? { outputReference: cloneReference(input.outputReference) } : {}),
      ...(input.errorReference ? { errorReference: cloneReference(input.errorReference) } : {}),
      ...(input.blockingReference
        ? { blockingReference: cloneReference(input.blockingReference) }
        : {}),
      ...(input.cancellationReference
        ? { cancellationReference: cloneReference(input.cancellationReference) }
        : {}),
      ...(input.timeoutReference ? { timeoutReference: cloneReference(input.timeoutReference) } : {}),
      ...(input.validationReference
        ? { validationReference: cloneReference(input.validationReference) }
        : {}),
    });
    const runtimeExecutionResultId = digestRuntimeExecutionResult(core);
    const candidate: RuntimeExecutionResult = {
      ...core,
      runtimeExecutionResultId,
      integrityChecksum: "0".repeat(64),
    };
    const preliminaryValidation = validateRuntimeExecutionResult(candidate);
    const nonIntegrityFailures = preliminaryValidation.valid
      ? []
      : preliminaryValidation.failures.filter(
          (item) => item.target !== "integrityChecksum",
        );
    if (nonIntegrityFailures.length > 0) {
      return { status: "INVALID", failures: nonIntegrityFailures };
    }
    candidate.integrityChecksum = digestRuntimeExecutionResult(
      resultIntegrityPayload(candidate),
    );
    const validation = validateRuntimeExecutionResult(candidate);
    return validation.valid
      ? { status: "VALID", value: candidate, failures: [] }
      : { status: "INVALID", failures: validation.failures };
  } catch {
    return {
      status: "INVALID",
      failures: [failure("RESULT_CANONICALIZATION_INVALID")],
    };
  }
}
