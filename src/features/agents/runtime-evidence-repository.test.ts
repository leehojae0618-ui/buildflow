import { describe, expect, it } from "vitest";
import { InMemoryRuntimeEvidenceRepository } from "./runtime-evidence-repository";

const checksum = (seed: string) => seed.padEnd(64, seed).slice(0, 64);
const context = { projectId: "project.1", userId: "user.1", packageId: "package.1", approvalRequestId: "approval.1" };

function input(overrides: Record<string, unknown> = {}) {
  return {
    runtimePlanId: "plan.1",
    runtimeExecutionId: "execution.1",
    runtimeExecutionRequestId: "request.1",
    runtimeExecutionStartId: "start.1",
    runtimeStepId: "step.1",
    runtimeStepAttemptId: "attempt.1",
    eventType: "PROVIDER_INVOCATION_COMPLETED" as const,
    status: "SUCCEEDED" as const,
    provider: "openai" as const,
    model: "gpt-test",
    safeInputChecksum: checksum("a"),
    safeOutputChecksum: checksum("b"),
    providerRequestReference: "provider.request.1",
    latencyMs: 1,
    occurredAt: "2026-07-27T00:00:00.000Z",
    ...overrides,
  };
}

describe("InMemoryRuntimeEvidenceRepository", () => {
  it("appends, reads, and deterministically lists only owned execution evidence", async () => {
    const repository = new InMemoryRuntimeEvidenceRepository();
    const later = await repository.append(input({ occurredAt: "2026-07-27T00:00:01.000Z" }), context);
    const first = await repository.append(input({ runtimeStepAttemptId: "attempt.2" }), context);
    expect(later.status).toBe("APPENDED");
    expect(first.status).toBe("APPENDED");
    if (first.status !== "APPENDED") return;
    const found = await repository.getByReference({ runtimeEvidenceId: first.value.runtimeEvidenceId, integrityChecksum: first.value.integrityChecksum }, context);
    const listed = await repository.listByExecution("execution.1", context);
    expect(found.status).toBe("FOUND");
    expect(listed).toMatchObject({ status: "LISTED" });
    if (listed.status === "LISTED") expect(listed.values.map((value) => value.occurredAt)).toEqual(["2026-07-27T00:00:00.000Z", "2026-07-27T00:00:01.000Z"]);
  });

  it("rejects duplicates and cross-owner reads without mutation", async () => {
    const repository = new InMemoryRuntimeEvidenceRepository();
    const appended = await repository.append(input(), context);
    expect(await repository.append(input(), context)).toMatchObject({ status: "FAILED", failures: [{ code: "RUNTIME_EVIDENCE_DUPLICATE" }] });
    if (appended.status !== "APPENDED") return;
    await expect(repository.getByReference({ runtimeEvidenceId: appended.value.runtimeEvidenceId, integrityChecksum: appended.value.integrityChecksum }, { projectId: "project.2", userId: "user.2" })).resolves.toMatchObject({ status: "FAILED", failures: [{ code: "RUNTIME_EVIDENCE_UNAUTHORIZED" }] });
    expect(repository.values()).toHaveLength(1);
  });

  it.each([
    ["secret key", { metadata: { apiKey: "safe" } }],
    ["secret value", { metadata: { source: `sk-${"x".repeat(24)}` } }],
    ["nested metadata", { metadata: { nested: { no: "nested" } } }],
    ["too many metadata entries", { metadata: Object.fromEntries(Array.from({ length: 17 }, (_, index) => [`key${index}`, index])) }],
    ["record over 16KiB", { model: "x".repeat(17_000) }],
    ["long reference", { providerRequestReference: "x".repeat(257) }],
  ])("rejects unsafe %s", async (_label, override) => {
    const repository = new InMemoryRuntimeEvidenceRepository();
    await expect(repository.append(input(override), context)).resolves.toMatchObject({ status: "FAILED" });
  });
});
