import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "./package-export";
import type { ReferenceIdentifier } from "./runtime-execution-request";
import type { ProviderUsageFacts } from "./runtime-provider";

export const RUNTIME_EVIDENCE_FORMAT_VERSION = "buildflow.runtime-evidence.v1" as const;

export const runtimeEvidenceEventTypes = [
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
export type RuntimeEvidenceEventType = (typeof runtimeEvidenceEventTypes)[number];

export type RuntimeEvidenceStatus =
  | "SUCCEEDED"
  | "FAILED"
  | "TIMED_OUT"
  | "CANCELLED"
  | "BLOCKED";

export type RuntimeEvidenceRecord = {
  formatVersion: typeof RUNTIME_EVIDENCE_FORMAT_VERSION;
  runtimeEvidenceId: string;
  runtimePlanId: string;
  runtimeExecutionId: string;
  runtimeStepId: string;
  runtimeStepAttemptId: string;
  eventType: RuntimeEvidenceEventType;
  status: RuntimeEvidenceStatus;
  provider: "openai";
  model: string;
  safeInputChecksum: string;
  safeOutputChecksum?: string;
  providerRequestReference?: string;
  usage?: ProviderUsageFacts;
  latencyMs?: number;
  errorCode?: string;
  occurredAt: string;
  integrityChecksum: string;
};

export type BuildRuntimeEvidenceInput = Omit<
  RuntimeEvidenceRecord,
  "formatVersion" | "runtimeEvidenceId" | "integrityChecksum"
>;

export type RuntimeEvidenceFailureCode =
  | "RUNTIME_EVIDENCE_REQUIRED_FIELD_MISSING"
  | "RUNTIME_EVIDENCE_REFERENCE_INVALID"
  | "RUNTIME_EVIDENCE_TIMESTAMP_INVALID"
  | "RUNTIME_EVIDENCE_SECRET_DETECTED"
  | "RUNTIME_EVIDENCE_VALUE_INVALID"
  | "RUNTIME_EVIDENCE_DUPLICATE"
  | "RUNTIME_EVIDENCE_INTERNAL_ERROR";

export type RuntimeEvidenceFailure = {
  code: RuntimeEvidenceFailureCode;
  target?: string;
};

export type BuildRuntimeEvidenceResult =
  | { status: "VALID"; value: RuntimeEvidenceRecord; failures: [] }
  | { status: "INVALID"; failures: RuntimeEvidenceFailure[] };

export type AppendRuntimeEvidenceResult =
  | { status: "APPENDED"; value: RuntimeEvidenceRecord; reference: ReferenceIdentifier; failures: [] }
  | { status: "FAILED"; failures: RuntimeEvidenceFailure[] };

export interface RuntimeEvidenceSink {
  append(input: BuildRuntimeEvidenceInput): Promise<AppendRuntimeEvidenceResult>;
}

const checksumPattern = /^[a-f0-9]{64}$/;
const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /AKIA[0-9A-Z]{16}/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
  /Authorization:\s*[^\s]+/i,
] as const;

function digest(value: unknown) {
  return createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");
}

function failure(code: RuntimeEvidenceFailureCode, target?: string): RuntimeEvidenceFailure {
  return { code, ...(target ? { target } : {}) };
}

function isIsoUtc(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    new Date(value).toISOString() === value;
}

function containsSecret(value: unknown): boolean {
  if (typeof value === "string") return secretPatterns.some((pattern) => pattern.test(value));
  if (Array.isArray(value)) return value.some(containsSecret);
  if (value && typeof value === "object") {
    const forbiddenKey = /^(?:secret|token|password|authorization|prompt|output|response|rawPrompt|rawOutput|rawResponse)$/i;
    return Object.entries(value).some(
      ([key, child]) => forbiddenKey.test(key) || containsSecret(child),
    );
  }
  return false;
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

export function buildRuntimeEvidenceRecord(
  input: BuildRuntimeEvidenceInput,
): BuildRuntimeEvidenceResult {
  try {
    const normalized = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as BuildRuntimeEvidenceInput;
    if (containsSecret(normalized)) {
      return { status: "INVALID", failures: [failure("RUNTIME_EVIDENCE_SECRET_DETECTED")] };
    }
    const failures: RuntimeEvidenceFailure[] = [];
    for (const field of [
      "runtimePlanId",
      "runtimeExecutionId",
      "runtimeStepId",
      "runtimeStepAttemptId",
      "model",
      "safeInputChecksum",
    ] as const) {
      if (!normalized[field]?.trim()) failures.push(failure("RUNTIME_EVIDENCE_REQUIRED_FIELD_MISSING", field));
    }
    if (!checksumPattern.test(normalized.safeInputChecksum ?? "")) {
      failures.push(failure("RUNTIME_EVIDENCE_REFERENCE_INVALID", "safeInputChecksum"));
    }
    if (normalized.safeOutputChecksum !== undefined && !checksumPattern.test(normalized.safeOutputChecksum)) {
      failures.push(failure("RUNTIME_EVIDENCE_REFERENCE_INVALID", "safeOutputChecksum"));
    }
    if (!isIsoUtc(normalized.occurredAt)) {
      failures.push(failure("RUNTIME_EVIDENCE_TIMESTAMP_INVALID", "occurredAt"));
    }
    if (normalized.latencyMs !== undefined && (!Number.isFinite(normalized.latencyMs) || normalized.latencyMs < 0)) {
      failures.push(failure("RUNTIME_EVIDENCE_VALUE_INVALID", "latencyMs"));
    }
    if (failures.length > 0) return { status: "INVALID", failures };
    const runtimeEvidenceId = digest(normalized);
    const record: RuntimeEvidenceRecord = {
      formatVersion: RUNTIME_EVIDENCE_FORMAT_VERSION,
      ...normalized,
      runtimeEvidenceId,
      integrityChecksum: digest({ ...normalized, runtimeEvidenceId }),
    };
    return { status: "VALID", value: cloneAndFreeze(record), failures: [] };
  } catch {
    return { status: "INVALID", failures: [failure("RUNTIME_EVIDENCE_INTERNAL_ERROR")] };
  }
}

export class InMemoryRuntimeEvidenceSink implements RuntimeEvidenceSink {
  private readonly records = new Map<string, RuntimeEvidenceRecord>();

  async append(input: BuildRuntimeEvidenceInput): Promise<AppendRuntimeEvidenceResult> {
    const built = buildRuntimeEvidenceRecord(input);
    if (built.status !== "VALID") return { status: "FAILED", failures: built.failures };
    if (this.records.has(built.value.runtimeEvidenceId)) {
      return { status: "FAILED", failures: [failure("RUNTIME_EVIDENCE_DUPLICATE")] };
    }
    this.records.set(built.value.runtimeEvidenceId, built.value);
    return {
      status: "APPENDED",
      value: built.value,
      reference: {
        referenceId: built.value.runtimeEvidenceId,
        referenceType: "RUNTIME_EVIDENCE",
        integrityChecksum: built.value.integrityChecksum,
      },
      failures: [],
    };
  }

  values(): readonly RuntimeEvidenceRecord[] {
    return Object.freeze([...this.records.values()]);
  }
}
