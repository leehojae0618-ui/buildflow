import { describe, expect, it } from "vitest";
import { InMemoryRuntimeEvidenceSink, buildRuntimeEvidenceRecord } from "./runtime-evidence";

const checksum = (seed: string) => seed.padEnd(64, seed).slice(0, 64);

function evidenceInput(overrides: Record<string, unknown> = {}) {
  return {
    runtimePlanId: "plan.1",
    runtimeExecutionId: "execution.1",
    runtimeStepId: "step.1",
    runtimeStepAttemptId: "attempt.1",
    eventType: "PROVIDER_INVOCATION_COMPLETED" as const,
    status: "SUCCEEDED" as const,
    provider: "openai" as const,
    model: "gpt-test",
    safeInputChecksum: checksum("a"),
    safeOutputChecksum: checksum("b"),
    providerRequestReference: "provider.request.1",
    latencyMs: 10,
    occurredAt: "2026-07-26T00:00:00.000Z",
    ...overrides,
  };
}

describe("Runtime Evidence", () => {
  it("creates immutable safe evidence", () => {
    const result = buildRuntimeEvidenceRecord(evidenceInput());
    expect(result.status).toBe("VALID");
    if (result.status === "VALID") {
      expect(result.value.integrityChecksum).toMatch(/^[a-f0-9]{64}$/);
      expect(Object.isFrozen(result.value)).toBe(true);
    }
  });

  it("rejects secret-shaped values", () => {
    const result = buildRuntimeEvidenceRecord(evidenceInput({ errorCode: `sk-${"x".repeat(24)}` }));
    expect(result).toMatchObject({ status: "INVALID" });
  });

  it("rejects an invalid checksum or timestamp", () => {
    expect(buildRuntimeEvidenceRecord(evidenceInput({ safeInputChecksum: "bad" }))).toMatchObject({ status: "INVALID" });
    expect(buildRuntimeEvidenceRecord(evidenceInput({ occurredAt: "not-a-date" }))).toMatchObject({ status: "INVALID" });
  });

  it("rejects unsupported event/status values without throwing", () => {
    expect(buildRuntimeEvidenceRecord(evidenceInput({ eventType: "UNKNOWN" as never }))).toMatchObject({ status: "INVALID" });
    expect(buildRuntimeEvidenceRecord(evidenceInput({ status: "UNKNOWN" as never }))).toMatchObject({ status: "INVALID" });
  });

  it("appends once in memory and rejects duplicate evidence", async () => {
    const sink = new InMemoryRuntimeEvidenceSink();
    const first = await sink.append(evidenceInput());
    const second = await sink.append(evidenceInput());
    expect(first.status).toBe("APPENDED");
    expect(second).toMatchObject({ status: "FAILED" });
    expect(sink.values()).toHaveLength(1);
  });

  it("accepts safe provider failure metadata", () => {
    const result = buildRuntimeEvidenceRecord(evidenceInput({
      eventType: "PROVIDER_INVOCATION_FAILED",
      status: "FAILED",
      safeOutputChecksum: undefined,
      errorCode: "PROVIDER_AUTHENTICATION_FAILED",
    }));
    expect(result.status).toBe("VALID");
  });
});
