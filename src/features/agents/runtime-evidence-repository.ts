import {
  buildRuntimeEvidenceRecord,
  type AppendRuntimeEvidenceResult,
  type BuildRuntimeEvidenceInput,
  type RuntimeEvidenceAppendContext,
  type RuntimeEvidenceFailure,
  type RuntimeEvidenceRecord,
  type RuntimeEvidenceSink,
} from "./runtime-evidence";

export type RuntimeEvidenceReference = {
  runtimeEvidenceId: string;
  integrityChecksum: string;
};

export type RuntimeEvidenceGetResult =
  | { status: "FOUND"; value: RuntimeEvidenceRecord; failures: [] }
  | { status: "NOT_FOUND" | "FAILED"; failures: RuntimeEvidenceFailure[] };

export type RuntimeEvidenceListResult =
  | { status: "LISTED"; values: readonly RuntimeEvidenceRecord[]; failures: [] }
  | { status: "FAILED"; failures: RuntimeEvidenceFailure[] };

/** The sole append boundary for Runtime Evidence. */
export interface RuntimeEvidenceRepository extends RuntimeEvidenceSink {
  getByReference(
    reference: RuntimeEvidenceReference,
    context: RuntimeEvidenceAppendContext,
  ): Promise<RuntimeEvidenceGetResult>;
  listByExecution(
    runtimeExecutionId: string,
    context: RuntimeEvidenceAppendContext,
  ): Promise<RuntimeEvidenceListResult>;
}

type StoredRuntimeEvidence = {
  record: RuntimeEvidenceRecord;
  context?: RuntimeEvidenceAppendContext;
};

const failed = (code: RuntimeEvidenceFailure["code"], target?: string) => ({
  status: "FAILED" as const,
  failures: [{ code, ...(target ? { target } : {}) }],
});

function sameOwner(
  stored: RuntimeEvidenceAppendContext | undefined,
  requested: RuntimeEvidenceAppendContext,
) {
  return !stored || (stored.projectId === requested.projectId && stored.userId === requested.userId);
}

function validContext(context: RuntimeEvidenceAppendContext) {
  return Boolean(context.projectId?.trim() && context.userId?.trim());
}

/**
 * Deterministic append-only adapter for tests and server-only smoke execution.
 * Its optional context preserves legacy smoke compatibility while enforcing
 * ownership association whenever a context is supplied.
 */
export class InMemoryRuntimeEvidenceRepository implements RuntimeEvidenceRepository {
  private readonly records = new Map<string, StoredRuntimeEvidence>();

  async append(
    input: BuildRuntimeEvidenceInput,
    context?: RuntimeEvidenceAppendContext,
  ): Promise<AppendRuntimeEvidenceResult> {
    if (context && !validContext(context)) {
      return failed("RUNTIME_EVIDENCE_UNAUTHORIZED");
    }
    const built = buildRuntimeEvidenceRecord(input);
    if (built.status !== "VALID") return { status: "FAILED", failures: built.failures };
    if (this.records.has(built.value.runtimeEvidenceId)) {
      return failed("RUNTIME_EVIDENCE_DUPLICATE");
    }
    this.records.set(built.value.runtimeEvidenceId, { record: built.value, context });
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

  async getByReference(
    reference: RuntimeEvidenceReference,
    context: RuntimeEvidenceAppendContext,
  ): Promise<RuntimeEvidenceGetResult> {
    if (!validContext(context)) return failed("RUNTIME_EVIDENCE_UNAUTHORIZED");
    const stored = this.records.get(reference.runtimeEvidenceId);
    if (!stored || stored.record.integrityChecksum !== reference.integrityChecksum) {
      return { status: "NOT_FOUND", failures: [{ code: "RUNTIME_EVIDENCE_NOT_FOUND" }] };
    }
    if (!sameOwner(stored.context, context)) return failed("RUNTIME_EVIDENCE_UNAUTHORIZED");
    return { status: "FOUND", value: stored.record, failures: [] };
  }

  async listByExecution(
    runtimeExecutionId: string,
    context: RuntimeEvidenceAppendContext,
  ): Promise<RuntimeEvidenceListResult> {
    if (!validContext(context)) return failed("RUNTIME_EVIDENCE_UNAUTHORIZED");
    const values = [...this.records.values()]
      .filter((stored) => sameOwner(stored.context, context))
      .map((stored) => stored.record)
      .filter((record) => record.runtimeExecutionId === runtimeExecutionId)
      .sort((first, second) =>
        first.occurredAt === second.occurredAt
          ? first.runtimeEvidenceId.localeCompare(second.runtimeEvidenceId)
          : first.occurredAt.localeCompare(second.occurredAt),
      );
    return { status: "LISTED", values: Object.freeze(values), failures: [] };
  }

  values(): readonly RuntimeEvidenceRecord[] {
    return Object.freeze([...this.records.values()].map((item) => item.record));
  }
}

/** @deprecated Use InMemoryRuntimeEvidenceRepository as the canonical contract. */
export const createInMemoryRuntimeEvidenceRepository = () => new InMemoryRuntimeEvidenceRepository();

// Keeps the old import path/source compatible while there remains one append implementation.
