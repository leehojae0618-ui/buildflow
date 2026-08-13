import { describe, expect, it } from "vitest";
import { projectBf0Runtime } from "./bf0-runtime-projection";

const directDraft = {
  idea: "입력한 회의 메모를 짧게 정리해 주세요.",
  goal: "핵심 내용을 빠르게 정리",
  source: "직접 입력",
  approval: "항상 승인",
  output: "다운로드 결과",
} as const;

describe("projectBf0Runtime", () => {
  it("creates deterministic, validated artifacts for a direct-input design", () => {
    const first = projectBf0Runtime(directDraft);
    const second = projectBf0Runtime(directDraft);

    expect(first.status).toBe("ELIGIBLE");
    expect(second.status).toBe("ELIGIBLE");
    if (first.status !== "ELIGIBLE" || second.status !== "ELIGIBLE") return;
    expect(first.runtimePlan.integrityChecksum).toBe(second.runtimePlan.integrityChecksum);
    expect(first.runtimeExecutionRequest.integrityChecksum).toBe(second.runtimeExecutionRequest.integrityChecksum);
    expect(first.approvalGate.gateStatus).toBe("APPROVED_WITH_LIMITATIONS");
    expect(first.definition.validationStatus).toBe("VALID");
    expect(first.blueprint.capabilities).toEqual(["AI_RESPONSE"]);
    expect(first.blueprint.blocks.some((block) => block.kind === "TOOL" || block.kind === "MEMORY")).toBe(false);
  });

  it("preserves controlled runtime fallback only when runtime input is omitted", () => {
    const value = projectBf0Runtime(directDraft);
    expect(value.status).toBe("ELIGIBLE");
    if (value.status !== "ELIGIBLE") return;
    expect(value.transientProviderInput.userInput).toBe(directDraft.idea);
  });

  it("does not fall back to design input when explicit runtime input is empty", () => {
    const value = projectBf0Runtime(directDraft, { runtimeInput: "" });
    expect(value.status).toBe("INVALID");
    expect(JSON.stringify(value)).not.toContain(directDraft.idea);
  });

  it("uses explicit runtime input instead of design input when provided", () => {
    const runtimeInput = "환불 요청이 아직 처리되지 않았습니다.";
    const value = projectBf0Runtime(directDraft, { runtimeInput });
    expect(value.status).toBe("ELIGIBLE");
    if (value.status !== "ELIGIBLE") return;
    expect(value.transientProviderInput.userInput).toBe(runtimeInput);
    expect(value.transientProviderInput.userInput).not.toBe(directDraft.idea);
  });

  it.each([
    ["Gmail", "다운로드 결과"],
    ["Slack", "다운로드 결과"],
    ["GitHub / Repository", "다운로드 결과"],
    ["웹 폼", "다운로드 결과"],
    ["Webhook / API", "다운로드 결과"],
    ["직접 입력", "데이터베이스"],
  ])("rejects external flow %s / %s", (source, output) => {
    expect(projectBf0Runtime({ ...directDraft, source, output }).status).toBe("INELIGIBLE");
  });

  it("rejects secret-like transient input without returning it", () => {
    const value = projectBf0Runtime({ ...directDraft, idea: `sk-${"a".repeat(24)}` });
    expect(value).toMatchObject({ status: "INELIGIBLE", reason: "UNSAFE_INPUT" });
    expect(JSON.stringify(value)).not.toContain("sk-");
  });
});
