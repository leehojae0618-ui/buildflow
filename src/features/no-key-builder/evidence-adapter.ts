import { evaluateAcceptance } from "../verification-loop/verdict";
import type { AcceptanceTestCase, NormalizedEvidence, VerificationVerdict } from "../verification-loop/types";
import type { NoKeyUserSubmittedEvidence } from "./types";

export function evaluateUserSubmittedEvidence(
  testCase: AcceptanceTestCase,
  evidence: NoKeyUserSubmittedEvidence,
): VerificationVerdict {
  // The Verdict engine only reads test identity, observations, and a safe reference.
  // Provenance remains on NoKeyUserSubmittedEvidence and is rendered separately.
  const compatibilityProjection = {
    evidenceId: `user-submitted.${evidence.reference}`,
    sourceType: evidence.sourceType,
    executionMode: "SIMULATED",
    testCaseId: evidence.testCaseId,
    expected: testCase.expectedObservations,
    observed: evidence.observed,
    occurredAt: evidence.occurredAt,
    reference: evidence.reference,
    integrityChecksum: "user-submitted-not-externally-verified",
    trustLevel: "SIMULATED",
  } as unknown as NormalizedEvidence;
  return evaluateAcceptance(testCase, compatibilityProjection);
}
