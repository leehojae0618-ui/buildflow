import { evaluateAcceptance } from "../verification-loop/verdict";
import type { AcceptanceTestCase } from "../verification-loop/types";
import { assertNoKeySubmissionSafe } from "./secret-guard";
import { evaluateUserSubmittedEvidence } from "./evidence-adapter";
import type { NoKeyExecutionPackage, NoKeyResultSubmission, NoKeySubmissionOutcome, NoKeyUserSubmittedEvidence } from "./types";

function notVerified(testCase: AcceptanceTestCase, limitation: NonNullable<NoKeySubmissionOutcome["limitation"]>): NoKeySubmissionOutcome {
  return { verdict: evaluateAcceptance(testCase), limitation };
}

export function submitNoKeyResult(
  executionPackage: NoKeyExecutionPackage,
  testCase: AcceptanceTestCase,
  submission: NoKeyResultSubmission,
): NoKeySubmissionOutcome {
  assertNoKeySubmissionSafe([
    submission.blueprintChecksum,
    submission.externalWorkflowReference,
    submission.externalExecutionReference,
    submission.sanitizedLogExcerpt,
  ]);
  if (!submission.userConfirmed) return notVerified(testCase, "USER_CONFIRMATION_REQUIRED");
  if (submission.blueprintChecksum !== executionPackage.blueprintChecksum) return notVerified(testCase, "BLUEPRINT_CHECKSUM_MISMATCH");
  if (submission.testCaseId !== testCase.id) {
    const mismatchEvidence: NoKeyUserSubmittedEvidence = {
      sourceType: "USER_SUBMITTED",
      trustLevel: "USER_SUBMITTED",
      platform: submission.platform,
      blueprintChecksum: submission.blueprintChecksum,
      testCaseId: submission.testCaseId,
      observed: submission.observations,
      occurredAt: submission.submittedAt,
      reference: `user-submitted.${submission.platform.toLowerCase()}.${submission.externalExecutionReference ?? "no-execution-reference"}`,
      userConfirmed: true,
      actualExternalExecution: false,
      ...(submission.sanitizedLogExcerpt === undefined ? {} : { sanitizedLogExcerpt: submission.sanitizedLogExcerpt }),
    };
    return { evidence: mismatchEvidence, verdict: evaluateUserSubmittedEvidence(testCase, mismatchEvidence) };
  }
  if (submission.observations.length === 0) return notVerified(testCase, "EVIDENCE_MISSING");
  const evidence: NoKeyUserSubmittedEvidence = {
    sourceType: "USER_SUBMITTED",
    trustLevel: "USER_SUBMITTED",
    platform: submission.platform,
    blueprintChecksum: submission.blueprintChecksum,
    testCaseId: submission.testCaseId,
    observed: submission.observations,
    occurredAt: submission.submittedAt,
    reference: `user-submitted.${submission.platform.toLowerCase()}.${submission.externalExecutionReference ?? "no-execution-reference"}`,
    userConfirmed: true,
    actualExternalExecution: false,
    ...(submission.sanitizedLogExcerpt === undefined ? {} : { sanitizedLogExcerpt: submission.sanitizedLogExcerpt }),
  };
  return { evidence, verdict: evaluateUserSubmittedEvidence(testCase, evidence) };
}
