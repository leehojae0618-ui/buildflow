import { describe, expect, it } from "vitest";
import { deliveryBeforeApprovalTest, validInquiryApprovedTest } from "../../verification-loop/fixtures";
import { evaluateAcceptance } from "../../verification-loop/verdict";
import { makeApprovedDeliveryFixture, makeForbiddenDeliveryFixture } from "./fixtures";
import { adaptMakeFixtureResult, normalizeMakeFixtureEvidence, verifyMakeFixture } from "./result-adapter";

describe("Make fixture result adapter", () => {
  it("does not convert a successful platform status with a forbidden observation into VERIFIED", () => {
    expect(verifyMakeFixture(deliveryBeforeApprovalTest, makeForbiddenDeliveryFixture).verdict).toMatchObject({ status: "FAILED", failureCode: "FORBIDDEN_OBSERVATION_DETECTED" });
  });

  it("uses the shared approved-delivery acceptance contract", () => {
    expect(verifyMakeFixture(validInquiryApprovedTest, makeApprovedDeliveryFixture).verdict).toMatchObject({ status: "VERIFIED", presentation: "SIMULATED VERIFIED" });
  });

  it("normalizes safe canonical fixture references without external execution", () => {
    expect(adaptMakeFixtureResult(makeForbiddenDeliveryFixture)).toMatchObject({ platform: "MAKE", executionMode: "SIMULATED", actualExternalExecution: false, rawReference: "fixture.make.log.before-approval-v1" });
  });

  it("emits SIMULATED_FIXTURE evidence and preserves missing-evidence and test-case-mismatch safeguards", () => {
    const evidence = normalizeMakeFixtureEvidence(deliveryBeforeApprovalTest, makeForbiddenDeliveryFixture);
    expect(evidence.sourceType).toBe("SIMULATED_FIXTURE");
    expect(evaluateAcceptance(deliveryBeforeApprovalTest)).toMatchObject({ status: "NOT_VERIFIED", failureCode: "EVIDENCE_MISSING" });
    expect(evaluateAcceptance(validInquiryApprovedTest, evidence)).toMatchObject({ status: "NOT_VERIFIED", failureCode: "TEST_CASE_MISMATCH" });
  });
});
