import "server-only";

import { hasOpenAIEnv, isRealAIEnabled, serverEnv } from "../../lib/env/server";
import { createOpenAIRuntimeProviderAdapter } from "../../services/openai/runtime-provider-adapter";
import { executeMinimumRuntime } from "../agents/runtime-orchestrator";
import type { ProviderAdapter } from "../agents/runtime-provider";
import { InMemoryRuntimeEvidenceRepository } from "../agents/runtime-evidence-repository";
import type { Bf0DesignDraft } from "../product-experience/bf0-view-model";
import { projectBf0Runtime } from "../product-experience/bf0-runtime-projection";
import { executeApprovedProductRuntime } from "./execute-approved-product-runtime";
import { InvocationLocalRuntimeApprovalRepository } from "./controlled-product-runtime";
import type { ProductRuntimePackageEvidenceProjection, SafeProductRuntimeResult } from "./types";

const customerReplyInstruction = [
  "고객 문의에 대한 답변 초안만 한국어로 작성하세요.",
  "정중하고 간결하게 답하세요.",
  "확인되지 않은 환불, 배송, 정책, 처리 상태를 사실처럼 단정하지 마세요.",
  "확인이 필요한 내용은 담당자 확인이 필요하다고 안내하세요.",
].join(" ");

type Bf0RuntimeDesign = Pick<Bf0DesignDraft, "idea" | "goal" | "source" | "approval" | "output">;

export type RealAIProductRuntimeDependencies = {
  isEnabled?: () => boolean;
  isOpenAIConfigured?: () => boolean;
  model?: () => string;
  createProvider?: (captureOutput: (output: string) => void) => ProviderAdapter;
};

export type RealAIProductRuntimeResult =
  | {
      status: "SUCCEEDED";
      answerDraft: string;
      runtimeResult: SafeProductRuntimeResult;
      packageEvidence: ProductRuntimePackageEvidenceProjection;
      evidenceStorage: "INVOCATION_LOCAL_MEMORY";
    }
  | {
      status: "BLOCKED" | "FAILED" | "INELIGIBLE" | "INVALID";
      safeMessage: string;
    };

function unavailable(status: Extract<RealAIProductRuntimeResult, { status: "BLOCKED" | "FAILED" | "INELIGIBLE" | "INVALID" }> ["status"], safeMessage: string): RealAIProductRuntimeResult {
  return { status, safeMessage };
}

export function getRealAIProductRuntimeAvailability() {
  return isRealAIEnabled && hasOpenAIEnv;
}

/**
 * Product-owned composition: only the returned answerDraft holds raw model text,
 * and only for this server action invocation. Core Runtime stays reference-only.
 */
export async function executeRealAIProductRuntime(
  design: Bf0RuntimeDesign,
  runtimeInput: string,
  dependencies: RealAIProductRuntimeDependencies = {},
): Promise<RealAIProductRuntimeResult> {
  const trimmedRuntimeInput = runtimeInput.trim();
  if (!trimmedRuntimeInput) {
    return unavailable("INVALID", "AI 답변 초안을 만들 문의 내용을 입력해 주세요.");
  }

  const enabled = dependencies.isEnabled ?? (() => isRealAIEnabled);
  if (!enabled()) return unavailable("BLOCKED", "실제 AI 실행은 현재 준비 중입니다. 내부 설계와 실행 경로는 준비되어 있습니다.");

  const configured = dependencies.isOpenAIConfigured ?? (() => hasOpenAIEnv);
  if (!configured()) return unavailable("BLOCKED", "실제 AI 실행을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.");

  const projection = projectBf0Runtime(design, {
    runtimeInput: trimmedRuntimeInput,
    systemInstruction: customerReplyInstruction,
    model: (dependencies.model ?? (() => serverEnv.OPENAI_MODEL))(),
    profileId: "bf0-real-ai-runtime",
  });
  if (projection.status !== "ELIGIBLE") return unavailable(projection.status, projection.safeMessage);

  let capturedOutput: string | undefined;
  const captureOutput = (output: string) => {
    if (!output.trim()) throw new Error("Empty captured provider output.");
    capturedOutput = output;
  };
  const provider = dependencies.createProvider?.(captureOutput)
    ?? createOpenAIRuntimeProviderAdapter(undefined, { onOutputText: captureOutput });
  const approvalRepository = new InvocationLocalRuntimeApprovalRepository();

  const created = await approvalRepository.create({ binding: projection.runtimeApprovalBinding });
  if (created.status !== "OK") return unavailable("FAILED", "AI 답변 초안을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  const approved = await approvalRepository.decide({
    approvalId: created.value.approvalId,
    projectId: projection.projectId,
    userId: projection.userId,
    decision: "APPROVE",
  });
  if (approved.status !== "OK") return unavailable("FAILED", "AI 답변 초안을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.");

  const result = await executeApprovedProductRuntime({
    projectId: projection.projectId,
    approvalRequestId: created.value.approvalId,
    runtimeExecutionRequest: projection.runtimeExecutionRequest,
    runtimePlan: projection.runtimePlan,
    transientProviderInput: projection.transientProviderInput,
  }, {
    resolveOwnedProject: async () => ({ projectId: projection.projectId, userId: projection.userId }),
    approvalRepository,
    evidenceRepository: new InMemoryRuntimeEvidenceRepository(),
    provider,
    isProviderConfigured: configured,
    executeRuntime: executeMinimumRuntime,
  });

  if (result.status !== "SUCCEEDED" || !capturedOutput) {
    return unavailable("FAILED", "AI 답변 초안을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  return {
    status: "SUCCEEDED",
    answerDraft: capturedOutput,
    runtimeResult: result.runtimeResult,
    packageEvidence: result.packageEvidence,
    evidenceStorage: "INVOCATION_LOCAL_MEMORY",
  };
}
