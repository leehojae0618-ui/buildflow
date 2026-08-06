import { describe, expect, it } from "vitest";
import { createInitialInquiryBlueprint, hasEnforcedApprovalGate } from "./canonical-blueprint";
import { normalizeSimulatedEvidence, verifyNormalizedEvidenceChecksum } from "./evidence";
import { createInquiryVerificationLoopFixture, deliveryBeforeApprovalTest } from "./fixtures";
import { createApprovalGateRemediation } from "./remediation";
import { createReverificationLink } from "./reverification";
import { evaluateAcceptance } from "./verdict";

describe("LV5 simulated verification loop", () => {
  it("marks delivery before approval as FAILED", () => {
    expect(createInquiryVerificationLoopFixture().initialVerdict).toMatchObject({ status: "FAILED", failureCode: "FORBIDDEN_OBSERVATION_DETECTED", actualExternalExecution: false });
  });

  it("does not verify without evidence", () => {
    expect(evaluateAcceptance(deliveryBeforeApprovalTest)).toMatchObject({ status: "NOT_VERIFIED", failureCode: "EVIDENCE_MISSING" });
  });

  it("creates a remediation that inserts an approval gate before delivery", () => {
    const loop = createInquiryVerificationLoopFixture();
    expect(loop.remediation).toMatchObject({ changeType: "INSERT_APPROVAL_GATE", targetStepId: "deliver-slack", requiresApproval: true });
  });

  it("applies the approval-gate remediation to the canonical blueprint", () => {
    const loop = createInquiryVerificationLoopFixture();
    expect(hasEnforcedApprovalGate(loop.remediatedBlueprint)).toBe(true);
  });

  it("reverifies the same test case as simulated VERIFIED", () => {
    const loop = createInquiryVerificationLoopFixture();
    expect(loop.reverificationVerdict).toMatchObject({ status: "VERIFIED", presentation: "SIMULATED VERIFIED", testCaseId: "DELIVERY_BEFORE_APPROVAL", actualExternalExecution: false });
  });

  it("links the failed execution and the reverification execution", () => {
    const lineage = createInquiryVerificationLoopFixture().lineage;
    expect(lineage).toMatchObject({ originalVerdict: "FAILED", reverificationVerdict: "VERIFIED", testCaseId: "DELIVERY_BEFORE_APPROVAL" });
  });

  it("keeps simulated evidence distinct from external evidence", () => {
    const evidence = createInquiryVerificationLoopFixture().initialEvidence;
    expect(evidence).toMatchObject({ sourceType: "SIMULATED_FIXTURE", executionMode: "SIMULATED", trustLevel: "SIMULATED" });
  });

  it("generates a stable checksum for identical simulated evidence", () => {
    const result = createInquiryVerificationLoopFixture().initialResult;
    const first = normalizeSimulatedEvidence(deliveryBeforeApprovalTest, result);
    const second = normalizeSimulatedEvidence(deliveryBeforeApprovalTest, result);
    expect(first.integrityChecksum).toBe(second.integrityChecksum);
    expect(verifyNormalizedEvidenceChecksum(first)).toBe(true);
  });

  it("rejects a mismatched test-case link", () => {
    const result = { ...createInquiryVerificationLoopFixture().initialResult, testCaseId: "VALID_INQUIRY_APPROVED" as const };
    expect(() => normalizeSimulatedEvidence(deliveryBeforeApprovalTest, result)).toThrow("TEST_CASE_ID_MISMATCH");
  });

  it("lets a forbidden observation win even when expected output is present", () => {
    const result = { ...createInquiryVerificationLoopFixture().reverificationResult, observations: [...createInquiryVerificationLoopFixture().reverificationResult.observations, "SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL" as const] };
    const evidence = normalizeSimulatedEvidence(deliveryBeforeApprovalTest, result);
    expect(evaluateAcceptance(deliveryBeforeApprovalTest, evidence).status).toBe("FAILED");
  });

  it("rejects reverification lineage with a different test case", () => {
    const loop = createInquiryVerificationLoopFixture();
    const mismatched = { ...loop.reverificationResult, testCaseId: "VALID_INQUIRY_APPROVED" as const };
    expect(() => createReverificationLink(deliveryBeforeApprovalTest, loop.initialResult, loop.initialVerdict, loop.remediation.id, mismatched, loop.reverificationVerdict)).toThrow("REVERIFICATION_TEST_CASE_MISMATCH");
  });

  it("does not create remediation for a non-failed verdict", () => {
    const loop = createInquiryVerificationLoopFixture();
    expect(() => createApprovalGateRemediation(createInitialInquiryBlueprint(), loop.reverificationVerdict)).toThrow("REMEDIATION_REQUIRES_FORBIDDEN_OBSERVATION_FAILURE");
  });
});
