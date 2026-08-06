import { describe, expect, it } from "vitest";
import { deliveryBeforeApprovalTest, validInquiryApprovedTest } from "../../verification-loop/fixtures";
import { n8nApprovedDeliveryFixture, n8nForbiddenDeliveryFixture } from "./fixtures";
import { adaptN8nFixtureResult, normalizeN8nFixtureEvidence, verifyN8nFixture } from "./result-adapter";

describe("n8n fixture result adapter", () => {
  it("does not map a successful n8n status directly to VERIFIED", () => {
    expect(verifyN8nFixture(deliveryBeforeApprovalTest, n8nForbiddenDeliveryFixture).verdict).toMatchObject({ status: "FAILED", failureCode: "FORBIDDEN_OBSERVATION_DETECTED" });
  });

  it("uses the same approved-delivery acceptance contract as Make", () => {
    expect(verifyN8nFixture(validInquiryApprovedTest, n8nApprovedDeliveryFixture).verdict).toMatchObject({ status: "VERIFIED", presentation: "SIMULATED VERIFIED" });
  });

  it("normalizes a waiting result into a safe canonical result", () => {
    const result = adaptN8nFixtureResult({ ...n8nForbiddenDeliveryFixture, status: "WAITING", safeErrorCode: "N8N_EXECUTION_WAITING" });
    expect(result).toMatchObject({ platform: "N8N", status: "WAITING", errors: ["N8N_EXECUTION_WAITING"], actualExternalExecution: false });
  });

  it("marks normalized fixture evidence as simulated", () => {
    expect(normalizeN8nFixtureEvidence(validInquiryApprovedTest, n8nApprovedDeliveryFixture)).toMatchObject({ sourceType: "SIMULATED_FIXTURE", executionMode: "SIMULATED", trustLevel: "SIMULATED" });
  });
});
