import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/admin", () => ({ createSupabaseAdminClient: () => ({}) }));

import { buildRuntimeEvidenceRecord } from "./runtime-evidence";
import {
  SupabaseRuntimeEvidenceRepository,
  runtimeEvidenceRecordFromRow,
} from "./runtime-evidence-supabase";

const checksum = (seed: string) => seed.padEnd(64, seed).slice(0, 64);
const context = { projectId: "project.1", userId: "user.1" };

function input(overrides: Record<string, unknown> = {}) {
  return {
    runtimePlanId: "plan.1", runtimeExecutionId: "execution.1",
    runtimeExecutionRequestId: "request.1", runtimeExecutionStartId: "start.1",
    runtimeStepId: "step.1", runtimeStepAttemptId: "attempt.1",
    eventType: "PROVIDER_INVOCATION_COMPLETED" as const, status: "SUCCEEDED" as const,
    provider: "openai" as const, model: "gpt-test", safeInputChecksum: checksum("a"),
    safeOutputChecksum: checksum("b"), providerRequestReference: "provider.request.1",
    latencyMs: 1, occurredAt: "2026-07-27T00:00:00.000Z", ...overrides,
  };
}

function row(malformed = false, overrides: Record<string, unknown> = {}) {
  const built = buildRuntimeEvidenceRecord(input(overrides));
  if (built.status !== "VALID") throw new Error("fixture invalid");
  return {
    runtime_evidence_id: built.value.runtimeEvidenceId,
    integrity_checksum: malformed ? checksum("z") : built.value.integrityChecksum,
    project_id: context.projectId, user_id: context.userId,
    runtime_execution_id: built.value.runtimeExecutionId,
    runtime_execution_request_id: built.value.runtimeExecutionRequestId ?? null,
    runtime_execution_start_id: built.value.runtimeExecutionStartId ?? null,
    runtime_plan_id: built.value.runtimePlanId, runtime_step_id: built.value.runtimeStepId,
    runtime_step_attempt_id: built.value.runtimeStepAttemptId,
    event_type: built.value.eventType, status: built.value.status, provider: built.value.provider,
    model: built.value.model, safe_input_checksum: built.value.safeInputChecksum,
    safe_output_checksum: built.value.safeOutputChecksum ?? null,
    provider_request_reference: built.value.providerRequestReference ?? null,
    usage: null, latency_ms: built.value.latencyMs ?? null, safe_error_code: null,
    metadata: built.value.metadata ?? {}, occurred_at: built.value.occurredAt, created_at: built.value.occurredAt,
    package_id: null, package_version: null, evidence_report_id: null, approval_request_id: null,
    format_version: built.value.formatVersion,
  };
}

function client(returnedRow: ReturnType<typeof row>) {
  const query = { eq: () => query, maybeSingle: async () => ({ data: { id: context.projectId }, error: null }) };
  const insert = { select: () => ({ maybeSingle: async () => ({ data: returnedRow, error: null }) }) };
  return {
    from: (table: string) => table === "projects"
      ? { select: () => query }
      : { insert: () => insert },
  } as never;
}

describe("Supabase Runtime Evidence adapter", () => {
  it("uses the server-side append path and returns a validated safe record", async () => {
    const repository = new SupabaseRuntimeEvidenceRepository(client(row()));
    await expect(repository.append(input(), context)).resolves.toMatchObject({
      status: "APPENDED", value: { runtimeExecutionId: "execution.1" },
    });
  });

  it.each([
    ["absent metadata", {}],
    ["explicit empty metadata", { metadata: {} }],
    ["flat metadata", { metadata: { region: "seoul", attempt: 1 } }],
  ])("preserves checksum identity across %s", async (_label, overrides) => {
    const repository = new SupabaseRuntimeEvidenceRepository(client(row(false, overrides)));
    const result = await repository.append(input(overrides), context);
    expect(result).toMatchObject({ status: "APPENDED" });
    if (result.status === "APPENDED") {
      const expected = buildRuntimeEvidenceRecord(input(overrides));
      expect(expected.status).toBe("VALID");
      if (expected.status === "VALID") expect(result.value.integrityChecksum).toBe(expected.value.integrityChecksum);
    }
  });

  it("rejects malformed stored rows without exposing stored payload", async () => {
    expect(runtimeEvidenceRecordFromRow(row(true))).toBeNull();
    const repository = new SupabaseRuntimeEvidenceRepository(client(row(true)));
    await expect(repository.append(input(), context)).resolves.toMatchObject({
      status: "FAILED", failures: [{ code: "RUNTIME_EVIDENCE_MALFORMED_PERSISTED_RECORD" }],
    });
  });
});
