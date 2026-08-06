import { describe, expect, it } from "vitest";
import { createInitialInquiryBlueprint, withApprovalGate } from "../../verification-loop/canonical-blueprint";
import { compileN8nWorkflow } from "./compiler";

describe("n8n internal workflow compiler", () => {
  it("compiles the same canonical blueprint deterministically", () => {
    const blueprint = withApprovalGate(createInitialInquiryBlueprint());
    expect(compileN8nWorkflow({ blueprint }).deterministicChecksum).toBe(compileN8nWorkflow({ blueprint }).deterministicChecksum);
  });

  it("creates deterministic nodes and dependency-order connections", () => {
    const result = compileN8nWorkflow({ blueprint: withApprovalGate(createInitialInquiryBlueprint()) });
    expect(result.artifact.nodes.map((node) => node.id)).toEqual(["receive-inquiry", "classify-inquiry", "summarize-inquiry", "approval-gate", "deliver-slack"]);
    expect(result.artifact.connections).toContainEqual({ from: "approval-gate", to: "deliver-slack" });
  });

  it("keeps the preview inactive and uses only a credential placeholder", () => {
    const result = compileN8nWorkflow({ blueprint: withApprovalGate(createInitialInquiryBlueprint()) });
    expect(result.artifact.active).toBe(false);
    expect(result.artifact.nodes.find((node) => node.id === "deliver-slack")?.credentialReference).toBe("N8N_CREDENTIAL_SLACK_REFERENCE_REQUIRED");
  });

  it("rejects a token-shaped credential reference and flags real schema validation", () => {
    expect(() => compileN8nWorkflow({ blueprint: createInitialInquiryBlueprint(), credentialReference: `xoxb-${"a".repeat(16)}` })).toThrow("CREDENTIAL_REFERENCE_UNSAFE");
    expect(compileN8nWorkflow({ blueprint: createInitialInquiryBlueprint() }).warnings).toContain("N8N_NODE_SCHEMA_REQUIRES_REAL_PLATFORM_VALIDATION");
  });
});
