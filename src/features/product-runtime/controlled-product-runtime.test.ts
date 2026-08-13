import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/env/server", () => ({ hasOpenAIEnv: () => false }));
vi.mock("../../lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({}) }));
vi.mock("../../services/openai/runtime-provider-adapter", () => ({ createOpenAIRuntimeProviderAdapter: () => ({}) }));
vi.mock("../agents/runtime-evidence-supabase", () => ({ SupabaseRuntimeEvidenceRepository: class {} }));
vi.mock("../runtime-approval/runtime-approval-supabase", () => ({ SupabaseRuntimeApprovalRepository: class {} }));

import { projectBf0Runtime } from "../product-experience/bf0-runtime-projection";
import { ControlledProviderAdapter, executeControlledProductRuntime } from "./controlled-product-runtime";

const draft = {
  idea: "입력한 메모를 짧게 정리해 주세요.",
  goal: "핵심 내용을 빠르게 정리",
  source: "직접 입력",
  approval: "항상 승인",
  output: "다운로드 결과",
} as const;

describe("controlled product runtime", () => {
  it("uses a deterministic provider adapter without an external invocation", async () => {
    const adapter = new ControlledProviderAdapter();
    const result = await adapter.execute({
      formatVersion: "buildflow.runtime-provider.v1",
      provider: "openai",
      model: "controlled-runtime-v1",
      promptReference: { referenceId: "prompt", integrityChecksum: "a".repeat(64) },
      inputReference: { referenceId: "input", integrityChecksum: "b".repeat(64) },
      safeInputChecksum: "c".repeat(64),
      transientInput: { systemInstruction: "safe", userInput: "safe" },
      timeoutMs: 1,
      runtimeExecutionId: "runtime",
      runtimeStepId: "step",
      runtimeStepAttemptId: "attempt",
    });
    expect(result).toMatchObject({ status: "SUCCEEDED", latencyMs: 0 });
    expect(adapter.calls).toBe(1);
    expect(JSON.stringify(result)).not.toContain("safe");
  });

  it("runs the existing product/runtime bridge with invocation-local evidence only", async () => {
    const projection = projectBf0Runtime(draft);
    expect(projection.status).toBe("ELIGIBLE");
    if (projection.status !== "ELIGIBLE") return;

    const result = await executeControlledProductRuntime(projection);
    expect(result.status).toBe("SUCCEEDED");
    expect(result).toMatchObject({ controlled: true, evidenceStorage: "INVOCATION_LOCAL_MEMORY" });
    expect(result.status === "SUCCEEDED" && result.packageEvidence.runtimeEvidenceReferences).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain(draft.idea);
    expect(JSON.stringify(result)).not.toMatch(/supabase|openai api|external service/i);
  });

  it("fails closed on a mismatched approval binding", async () => {
    const projection = projectBf0Runtime(draft);
    expect(projection.status).toBe("ELIGIBLE");
    if (projection.status !== "ELIGIBLE") return;

    const result = await executeControlledProductRuntime({
      ...projection,
      runtimeApprovalBinding: { ...projection.runtimeApprovalBinding, bindingChecksum: "0".repeat(64) },
    });
    expect(result).toMatchObject({ status: "REJECTED", errorCode: "APPROVAL_NOT_USABLE" });
  });
});
