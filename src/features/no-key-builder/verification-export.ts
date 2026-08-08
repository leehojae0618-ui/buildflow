import { assertNoKeySubmissionSafe } from "./secret-guard";
import type { NoKeyResultSubmission, NoKeySubmissionOutcome } from "./types";

export function createNoKeyVerificationExport(
  submission: NoKeyResultSubmission,
  outcome: NoKeySubmissionOutcome,
): { fileName: string; content: string } {
  assertNoKeySubmissionSafe([
    submission.blueprintChecksum,
    submission.externalWorkflowReference,
    submission.externalExecutionReference,
    submission.sanitizedLogExcerpt,
  ]);
  const generatedAt = new Date().toISOString();
  const reasonCodes: string[] = [];
  if (outcome.verdict.failureCode) reasonCodes.push(outcome.verdict.failureCode);
  if (outcome.limitation) reasonCodes.push(outcome.limitation);
  const payload = {
    submission,
    evidence: outcome.evidence,
    verdict: outcome.verdict,
    reasonCodes,
    provenance: outcome.evidence?.sourceType ?? "UNAVAILABLE",
    trustLevel: outcome.evidence?.trustLevel ?? "UNAVAILABLE",
    externalPlatformDirectlyObservedByBuildFlow: false,
    generatedAt,
  };
  return {
    fileName: `buildflow-verification-${submission.blueprintChecksum.slice(0, 12)}.json`,
    content: JSON.stringify(payload, null, 2),
  };
}
