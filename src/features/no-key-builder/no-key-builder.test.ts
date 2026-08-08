import { describe, expect, it } from "vitest";
import { deliveryBeforeApprovalTest, validInquiryApprovedTest } from "../verification-loop/fixtures";
import { approvedNoKeySubmission, forbiddenNoKeySubmission, noKeyBlueprint, noKeyMakePackage, noKeyN8nPackage } from "./fixtures";
import { buildNoKeyExecutionPackage } from "./package-builder";
import { submitNoKeyResult } from "./result-submission";
import { assertNoKeySubmissionSafe } from "./secret-guard";
import { createNoKeyVerificationExport } from "./verification-export";

describe("No-Key Builder Flow", () => {
  it("keeps packages in No-Key mode with no external creation or execution", () => {
    expect(noKeyN8nPackage).toMatchObject({ mode: "NO_KEY", actualExternalCreation: false, actualExternalExecution: false, requiresExternalLogin: true, requiresUserCredentialSetup: true });
    expect(noKeyMakePackage).toMatchObject({ mode: "NO_KEY", actualExternalCreation: false, actualExternalExecution: false });
  });

  it("creates deterministic n8n and Make packages without credential values", () => {
    expect(buildNoKeyExecutionPackage("N8N", noKeyBlueprint)).toEqual(noKeyN8nPackage);
    expect(buildNoKeyExecutionPackage("MAKE", noKeyBlueprint)).toEqual(noKeyMakePackage);
    expect(noKeyN8nPackage.artifact.kind).toBe("N8N_WORKFLOW_EXPORT");
    expect(JSON.stringify(noKeyN8nPackage)).not.toMatch(new RegExp("s" + "k-"));
    expect(JSON.stringify(noKeyMakePackage)).not.toMatch(new RegExp("s" + "k-"));
  });

  it("does not misrepresent Make Import compatibility and includes manual setup guidance", () => {
    if (noKeyMakePackage.artifact.kind !== "MAKE_MANUAL_SETUP_GUIDE") throw new Error("unexpected artifact");
    expect(noKeyMakePackage.artifact.importCompatibility).toBe("MANUAL_SETUP_REQUIRED");
    expect(noKeyMakePackage.artifact.importCompatibility).not.toBe("CONFIRMED");
    expect(noKeyMakePackage.artifact.scenarioGuide.join(" ")).toContain("수동 구성");
    expect(noKeyMakePackage.artifact.connectionInstructions.join(" ")).toContain("직접 설정");
  });

  it("includes n8n Import and user-managed credential instructions", () => {
    if (noKeyN8nPackage.artifact.kind !== "N8N_WORKFLOW_EXPORT") throw new Error("unexpected artifact");
    expect(noKeyN8nPackage.artifact.importInstructions.join(" ")).toContain("Import");
    expect(noKeyN8nPackage.artifact.connectionInstructions.join(" ")).toContain("직접");
    expect(noKeyN8nPackage.artifact.workflowJson).toContain("n8n-nodes-base.manualTrigger");
    expect(noKeyN8nPackage.artifact.importReadiness).toMatchObject({ status: "PASS", realPlatformValidation: "REQUIRES_REAL_PLATFORM_VALIDATION" });
    expect(noKeyN8nPackage.artifact.workflow.active).toBe(false);
  });

  it("rejects API-key, Bearer, Cookie, and sensitive log input", () => {
    expect(() => assertNoKeySubmissionSafe([`sk-${"a".repeat(24)}`])).toThrow("NO_KEY_SUBMISSION_CONTAINS_SENSITIVE_VALUE");
    expect(() => assertNoKeySubmissionSafe([`Bearer ${"a".repeat(20)}`])).toThrow("NO_KEY_SUBMISSION_CONTAINS_SENSITIVE_VALUE");
    expect(() => assertNoKeySubmissionSafe(["Cookie=session-value"])).toThrow("NO_KEY_SUBMISSION_CONTAINS_SENSITIVE_VALUE");
    expect(() => submitNoKeyResult(noKeyN8nPackage, validInquiryApprovedTest, { ...approvedNoKeySubmission, sanitizedLogExcerpt: "password=do-not-store" })).toThrow("NO_KEY_SUBMISSION_CONTAINS_SENSITIVE_VALUE");
    expect(() => submitNoKeyResult(noKeyN8nPackage, validInquiryApprovedTest, { ...approvedNoKeySubmission, blueprintChecksum: `sk-${"a".repeat(24)}` })).toThrow("NO_KEY_SUBMISSION_CONTAINS_SENSITIVE_VALUE");
  });

  it("records user-submitted provenance without claiming an external observation", () => {
    const outcome = submitNoKeyResult(noKeyN8nPackage, validInquiryApprovedTest, approvedNoKeySubmission);
    expect(outcome.evidence).toMatchObject({ sourceType: "USER_SUBMITTED", trustLevel: "USER_SUBMITTED", actualExternalExecution: false });
    expect(outcome.verdict).toMatchObject({ status: "VERIFIED", actualExternalExecution: false });
  });

  it("returns NOT_VERIFIED for checksum mismatch, test-case mismatch, missing evidence, and missing user confirmation", () => {
    expect(submitNoKeyResult(noKeyN8nPackage, validInquiryApprovedTest, { ...approvedNoKeySubmission, blueprintChecksum: "other" })).toMatchObject({ limitation: "BLUEPRINT_CHECKSUM_MISMATCH", verdict: { status: "NOT_VERIFIED" } });
    expect(submitNoKeyResult(noKeyN8nPackage, validInquiryApprovedTest, { ...approvedNoKeySubmission, testCaseId: deliveryBeforeApprovalTest.id })).toMatchObject({ verdict: { status: "NOT_VERIFIED", failureCode: "TEST_CASE_MISMATCH" } });
    expect(submitNoKeyResult(noKeyN8nPackage, validInquiryApprovedTest, { ...approvedNoKeySubmission, observations: [] })).toMatchObject({ limitation: "EVIDENCE_MISSING", verdict: { status: "NOT_VERIFIED" } });
    expect(submitNoKeyResult(noKeyN8nPackage, validInquiryApprovedTest, { ...approvedNoKeySubmission, userConfirmed: false })).toMatchObject({ limitation: "USER_CONFIRMATION_REQUIRED", verdict: { status: "NOT_VERIFIED" } });
  });

  it("fails a user-submitted approval-before-Slack observation", () => {
    expect(submitNoKeyResult(noKeyN8nPackage, deliveryBeforeApprovalTest, forbiddenNoKeySubmission)).toMatchObject({ verdict: { status: "FAILED", failureCode: "FORBIDDEN_OBSERVATION_DETECTED" } });
  });

  it("does not treat a package alone as verified evidence", () => {
    expect(submitNoKeyResult(noKeyN8nPackage, validInquiryApprovedTest, { ...approvedNoKeySubmission, observations: [] }).verdict.status).not.toBe("VERIFIED");
  });

  it("exports only sanitized user-submitted verification data", () => {
    const outcome = submitNoKeyResult(noKeyN8nPackage, validInquiryApprovedTest, approvedNoKeySubmission);
    const exported = createNoKeyVerificationExport(approvedNoKeySubmission, outcome);
    expect(exported.fileName).toMatch(/^buildflow-verification-[a-f0-9]{12}\.json$/);
    expect(JSON.parse(exported.content)).toMatchObject({
      provenance: "USER_SUBMITTED",
      trustLevel: "USER_SUBMITTED",
      externalPlatformDirectlyObservedByBuildFlow: false,
      verdict: { status: "VERIFIED" },
    });
    expect(() => createNoKeyVerificationExport({ ...approvedNoKeySubmission, sanitizedLogExcerpt: "Authorization: Bearer unsafe" }, outcome)).toThrow("NO_KEY_SUBMISSION_CONTAINS_SENSITIVE_VALUE");
    expect(() => createNoKeyVerificationExport({ ...approvedNoKeySubmission, blueprintChecksum: `sk-${"a".repeat(24)}` }, outcome)).toThrow("NO_KEY_SUBMISSION_CONTAINS_SENSITIVE_VALUE");
  });

  it("keeps Make as manual setup with approval before Slack and no external execution", () => {
    if (noKeyMakePackage.artifact.kind !== "MAKE_MANUAL_SETUP_GUIDE") throw new Error("unexpected artifact");
    const sequence = noKeyMakePackage.artifact.moduleSequence.join(" ");
    expect(sequence.indexOf("Approval")).toBeLessThan(sequence.indexOf("Slack"));
    expect(noKeyMakePackage.artifact).not.toHaveProperty("credentials");
    expect(JSON.stringify(noKeyMakePackage)).not.toMatch(/sk-|Bearer\s|authorization\s*:/i);
    expect(noKeyMakePackage).toMatchObject({ actualExternalCreation: false, actualExternalExecution: false });
  });
});
