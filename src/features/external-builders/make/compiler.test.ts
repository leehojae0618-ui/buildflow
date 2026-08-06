import { describe, expect, it } from "vitest";
import { createInitialInquiryBlueprint, hasEnforcedApprovalGate, withApprovalGate } from "../../verification-loop/canonical-blueprint";
import { compileMakeScenario, isSafeCredentialReference } from "./compiler";

describe("Make internal preview compiler", () => {
  it("compiles the same canonical blueprint deterministically", () => {
    const blueprint = createInitialInquiryBlueprint();
    expect(compileMakeScenario({ blueprint }).deterministicChecksum).toBe(compileMakeScenario({ blueprint }).deterministicChecksum);
  });

  it("keeps scheduling serialization stable and preserves every canonical step", () => {
    const result = compileMakeScenario({ blueprint: createInitialInquiryBlueprint() });
    expect(result.artifact.scheduling.serialized).toBe(stableScheduling());
    expect(result.artifact.blueprint.modules.map((module) => module.id)).toEqual(["receive-inquiry", "classify-inquiry", "summarize-inquiry", "deliver-slack"]);
  });

  it("places Slack delivery after the approval gate in the remediated preview", () => {
    const result = compileMakeScenario({ blueprint: withApprovalGate(createInitialInquiryBlueprint()) });
    const delivery = result.artifact.blueprint.modules.find((module) => module.id === "deliver-slack");
    expect(delivery?.dependsOn).toEqual(["approval-gate"]);
    expect(hasEnforcedApprovalGate(withApprovalGate(createInitialInquiryBlueprint()))).toBe(true);
  });

  it("accepts placeholders and rejects token-shaped credential references", () => {
    expect(isSafeCredentialReference("MAKE_CONNECTION_SLACK_REFERENCE_REQUIRED")).toBe(true);
    expect(isSafeCredentialReference(`sk-${"a".repeat(24)}`)).toBe(false);
  });

  it("marks platform schema validation as required instead of silently omitting it", () => {
    expect(compileMakeScenario({ blueprint: createInitialInquiryBlueprint() }).warnings).toContain("MAKE_MODULE_SCHEMA_REQUIRES_REAL_PLATFORM_VALIDATION");
  });
});

function stableScheduling() {
  return compileMakeScenario({ blueprint: createInitialInquiryBlueprint() }).artifact.scheduling.serialized;
}
