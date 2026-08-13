import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/env/server", () => ({
  hasOpenAIEnv: false,
  isRealAIEnabled: false,
  serverEnv: { OPENAI_MODEL: "test-model" },
}));
vi.mock("../../lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({}) }));
vi.mock("../agents/runtime-evidence-supabase", () => ({ SupabaseRuntimeEvidenceRepository: class {} }));
vi.mock("../runtime-approval/runtime-approval-supabase", () => ({ SupabaseRuntimeApprovalRepository: class {} }));

import { digestProviderSafeValue, type ProviderAdapter } from "../agents/runtime-provider";
import { executeRealAIProductRuntime } from "./real-ai-product-runtime";

const design = {
  idea: "고객 문의 답변을 만들어주는 AI가 필요해",
  goal: "고객 문의 답변 초안 만들기",
  source: "직접 입력",
  approval: "항상 승인",
  output: "다운로드 결과",
} as const;

function providerWith(output: string, calls: { count: number; command?: unknown }, captureOutput: (value: string) => void): ProviderAdapter {
  return {
    execute: async (command) => {
      calls.count += 1;
      calls.command = command;
      captureOutput(output);
      return {
        status: "SUCCEEDED",
        providerRequestReference: "provider.request.1",
        outputReference: `provider.output.${digestProviderSafeValue(output)}`,
        outputChecksum: digestProviderSafeValue(output),
        latencyMs: 1,
      };
    },
  };
}

describe("real AI product runtime", () => {
  it("fails closed before constructing a Provider when the feature is disabled", async () => {
    const createProvider = vi.fn();
    const result = await executeRealAIProductRuntime(design, "환불 요청 상태를 확인하고 싶습니다.", {
      isEnabled: () => false,
      isOpenAIConfigured: () => true,
      createProvider,
    });

    expect(result).toMatchObject({ status: "BLOCKED" });
    expect(createProvider).not.toHaveBeenCalled();
  });

  it("rejects empty runtime input before projection or Provider construction", async () => {
    const createProvider = vi.fn();
    const result = await executeRealAIProductRuntime(design, "", {
      isEnabled: () => true,
      isOpenAIConfigured: () => true,
      createProvider,
    });

    expect(result).toMatchObject({ status: "INVALID" });
    expect(createProvider).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(design.idea);
  });

  it("rejects whitespace-only runtime input before Provider construction", async () => {
    const createProvider = vi.fn();
    const result = await executeRealAIProductRuntime(design, "   \n\t", {
      isEnabled: () => true,
      isOpenAIConfigured: () => true,
      createProvider,
    });

    expect(result).toMatchObject({ status: "INVALID" });
    expect(createProvider).not.toHaveBeenCalled();
  });

  it("sends only runtime input to an explicitly requested Provider invocation", async () => {
    const runtimeInput = "환불 요청을 했는데 아직 처리가 되지 않았습니다.";
    const answerDraft = "안녕하세요. 요청하신 환불 상태는 담당자 확인 후 안내드리겠습니다.";
    const calls: { count: number; command?: unknown } = { count: 0 };
    const result = await executeRealAIProductRuntime(design, runtimeInput, {
      isEnabled: () => true,
      isOpenAIConfigured: () => true,
      model: () => "test-model",
      createProvider: (captureOutput) => providerWith(answerDraft, calls, captureOutput),
    });

    expect(calls.count).toBe(1);
    expect(calls.command).toMatchObject({ transientInput: { userInput: runtimeInput } });
    expect(JSON.stringify(calls.command)).not.toContain(design.idea);
    expect(result).toMatchObject({ status: "SUCCEEDED", answerDraft, evidenceStorage: "INVOCATION_LOCAL_MEMORY" });
    if (result.status !== "SUCCEEDED") return;
    const coreSafeResult = JSON.stringify({ runtimeResult: result.runtimeResult, packageEvidence: result.packageEvidence });
    expect(coreSafeResult).not.toContain(answerDraft);
    expect(coreSafeResult).not.toContain(runtimeInput);
  });

  it("rejects secret-shaped runtime input before Provider invocation", async () => {
    const createProvider = vi.fn();
    const result = await executeRealAIProductRuntime(design, `sk-${"a".repeat(24)}`, {
      isEnabled: () => true,
      isOpenAIConfigured: () => true,
      createProvider,
    });

    expect(result).toMatchObject({ status: "INELIGIBLE" });
    expect(createProvider).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("sk-");
  });

  it("keeps external designs ineligible without Provider invocation", async () => {
    const createProvider = vi.fn();
    const result = await executeRealAIProductRuntime({ ...design, source: "Slack" }, "문의 내용", {
      isEnabled: () => true,
      isOpenAIConfigured: () => true,
      createProvider,
    });

    expect(result).toMatchObject({ status: "INELIGIBLE" });
    expect(createProvider).not.toHaveBeenCalled();
  });

  it("does not return a stale answer when an injected Provider omits output capture", async () => {
    const result = await executeRealAIProductRuntime(design, "문의 내용", {
      isEnabled: () => true,
      isOpenAIConfigured: () => true,
      createProvider: () => ({
        execute: async () => ({
          status: "SUCCEEDED",
          providerRequestReference: "provider.request.1",
          outputReference: "provider.output.1",
          outputChecksum: "a".repeat(64),
          latencyMs: 1,
        }),
      }),
    });

    expect(result).toMatchObject({ status: "FAILED" });
    expect(JSON.stringify(result)).not.toContain("문의 내용");
  });
});
