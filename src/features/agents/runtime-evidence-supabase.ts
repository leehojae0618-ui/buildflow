import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "../../lib/supabase/admin";
import type { Database, Json } from "../../types/database";
import {
  buildRuntimeEvidenceRecord,
  type AppendRuntimeEvidenceResult,
  type BuildRuntimeEvidenceInput,
  type RuntimeEvidenceAppendContext,
  type RuntimeEvidenceFailure,
  type RuntimeEvidenceRecord,
} from "./runtime-evidence";
import type {
  RuntimeEvidenceGetResult,
  RuntimeEvidenceListResult,
  RuntimeEvidenceReference,
  RuntimeEvidenceRepository,
} from "./runtime-evidence-repository";

type RuntimeEvidenceRow = Database["public"]["Tables"]["runtime_evidence_records"]["Row"];
type RuntimeEvidenceInsert = Database["public"]["Tables"]["runtime_evidence_records"]["Insert"];

const failed = (code: RuntimeEvidenceFailure["code"], target?: string) => ({
  status: "FAILED" as const,
  failures: [{ code, ...(target ? { target } : {}) }],
});

function validContext(context: RuntimeEvidenceAppendContext | undefined) {
  return Boolean(context?.projectId?.trim() && context.userId?.trim());
}

function recordToInsert(
  record: RuntimeEvidenceRecord,
  context: RuntimeEvidenceAppendContext,
): RuntimeEvidenceInsert {
  return {
    runtime_evidence_id: record.runtimeEvidenceId,
    integrity_checksum: record.integrityChecksum,
    project_id: context.projectId,
    user_id: context.userId,
    runtime_execution_id: record.runtimeExecutionId,
    runtime_execution_request_id: record.runtimeExecutionRequestId ?? null,
    runtime_execution_start_id: record.runtimeExecutionStartId ?? null,
    runtime_plan_id: record.runtimePlanId,
    runtime_step_id: record.runtimeStepId,
    runtime_step_attempt_id: record.runtimeStepAttemptId,
    package_id: context.packageId ?? null,
    package_version: context.packageVersion ?? null,
    evidence_report_id: context.evidenceReportId ?? null,
    approval_request_id: context.approvalRequestId ?? null,
    format_version: record.formatVersion,
    event_type: record.eventType,
    status: record.status,
    provider: record.provider,
    model: record.model,
    safe_input_checksum: record.safeInputChecksum,
    safe_output_checksum: record.safeOutputChecksum ?? null,
    provider_request_reference: record.providerRequestReference ?? null,
    usage: (record.usage ?? null) as Json | null,
    latency_ms: record.latencyMs ?? null,
    safe_error_code: record.errorCode ?? null,
    metadata: (record.metadata ?? {}) as Json,
    occurred_at: record.occurredAt,
  };
}

/** Converts only validated, safe persisted columns back into a Runtime record. */
export function runtimeEvidenceRecordFromRow(row: unknown): RuntimeEvidenceRecord | null {
  if (!row || typeof row !== "object") return null;
  const candidate = row as Partial<RuntimeEvidenceRow>;
  if (!candidate.runtime_evidence_id || !candidate.integrity_checksum) return null;
  const built = buildRuntimeEvidenceRecord({
    runtimePlanId: candidate.runtime_plan_id ?? "",
    runtimeExecutionId: candidate.runtime_execution_id ?? "",
    runtimeExecutionRequestId: candidate.runtime_execution_request_id ?? undefined,
    runtimeExecutionStartId: candidate.runtime_execution_start_id ?? undefined,
    runtimeStepId: candidate.runtime_step_id ?? "",
    runtimeStepAttemptId: candidate.runtime_step_attempt_id ?? "",
    eventType: candidate.event_type as RuntimeEvidenceRecord["eventType"],
    status: candidate.status as RuntimeEvidenceRecord["status"],
    provider: candidate.provider as "openai",
    model: candidate.model ?? "",
    safeInputChecksum: candidate.safe_input_checksum ?? "",
    safeOutputChecksum: candidate.safe_output_checksum ?? undefined,
    providerRequestReference: candidate.provider_request_reference ?? undefined,
    usage: candidate.usage === null || candidate.usage === undefined
      ? undefined
      : candidate.usage as RuntimeEvidenceRecord["usage"],
    latencyMs: candidate.latency_ms ?? undefined,
    errorCode: candidate.safe_error_code ?? undefined,
    metadata: candidate.metadata && typeof candidate.metadata === "object" && !Array.isArray(candidate.metadata) && Object.keys(candidate.metadata).length > 0
      ? candidate.metadata as RuntimeEvidenceRecord["metadata"]
      : undefined,
    occurredAt: candidate.occurred_at ?? "",
  });
  if (built.status !== "VALID" || built.value.runtimeEvidenceId !== candidate.runtime_evidence_id || built.value.integrityChecksum !== candidate.integrity_checksum) return null;
  return built.value;
}

/** Server-only, append-only Supabase adapter. It never accepts browser-owned identity. */
export class SupabaseRuntimeEvidenceRepository implements RuntimeEvidenceRepository {
  constructor(
    private readonly client: SupabaseClient<Database> = createSupabaseAdminClient(),
  ) {}

  private async owns(context: RuntimeEvidenceAppendContext) {
    const { data, error } = await this.client
      .from("projects")
      .select("id")
      .eq("id", context.projectId)
      .eq("user_id", context.userId)
      .maybeSingle();
    return !error && Boolean(data);
  }

  async append(
    input: BuildRuntimeEvidenceInput,
    context?: RuntimeEvidenceAppendContext,
  ): Promise<AppendRuntimeEvidenceResult> {
    if (!validContext(context) || !context || !(await this.owns(context))) {
      return failed("RUNTIME_EVIDENCE_UNAUTHORIZED");
    }
    const built = buildRuntimeEvidenceRecord(input);
    if (built.status !== "VALID") return { status: "FAILED", failures: built.failures };
    const { data, error } = await this.client
      .from("runtime_evidence_records")
      .insert(recordToInsert(built.value, context))
      .select("*")
      .maybeSingle();
    if (error) return failed(error.code === "23505" ? "RUNTIME_EVIDENCE_DUPLICATE" : "RUNTIME_EVIDENCE_PERSISTENCE_FAILED");
    const persisted = runtimeEvidenceRecordFromRow(data);
    if (!persisted) return failed("RUNTIME_EVIDENCE_MALFORMED_PERSISTED_RECORD");
    return {
      status: "APPENDED",
      value: persisted,
      reference: {
        referenceId: persisted.runtimeEvidenceId,
        referenceType: "RUNTIME_EVIDENCE",
        integrityChecksum: persisted.integrityChecksum,
      },
      failures: [],
    };
  }

  async getByReference(reference: RuntimeEvidenceReference, context: RuntimeEvidenceAppendContext): Promise<RuntimeEvidenceGetResult> {
    if (!validContext(context) || !(await this.owns(context))) return failed("RUNTIME_EVIDENCE_UNAUTHORIZED");
    const { data, error } = await this.client
      .from("runtime_evidence_records")
      .select("*")
      .eq("runtime_evidence_id", reference.runtimeEvidenceId)
      .eq("integrity_checksum", reference.integrityChecksum)
      .eq("project_id", context.projectId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) return failed("RUNTIME_EVIDENCE_PERSISTENCE_FAILED");
    if (!data) return { status: "NOT_FOUND", failures: [{ code: "RUNTIME_EVIDENCE_NOT_FOUND" }] };
    const record = runtimeEvidenceRecordFromRow(data);
    return record ? { status: "FOUND", value: record, failures: [] } : failed("RUNTIME_EVIDENCE_MALFORMED_PERSISTED_RECORD");
  }

  async listByExecution(runtimeExecutionId: string, context: RuntimeEvidenceAppendContext): Promise<RuntimeEvidenceListResult> {
    if (!validContext(context) || !(await this.owns(context))) return failed("RUNTIME_EVIDENCE_UNAUTHORIZED");
    const { data, error } = await this.client
      .from("runtime_evidence_records")
      .select("*")
      .eq("runtime_execution_id", runtimeExecutionId)
      .eq("project_id", context.projectId)
      .eq("user_id", context.userId)
      .order("occurred_at", { ascending: true })
      .order("runtime_evidence_id", { ascending: true });
    if (error) return failed("RUNTIME_EVIDENCE_PERSISTENCE_FAILED");
    const values = (data ?? []).map(runtimeEvidenceRecordFromRow);
    if (values.some((value) => !value)) return failed("RUNTIME_EVIDENCE_MALFORMED_PERSISTED_RECORD");
    return { status: "LISTED", values: Object.freeze(values as RuntimeEvidenceRecord[]), failures: [] };
  }
}
