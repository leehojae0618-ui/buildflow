import type { AcceptanceTestCase, NormalizedEvidence, VerificationVerdict } from "./types";

export function evaluateAcceptance(
  testCase: AcceptanceTestCase,
  evidence?: NormalizedEvidence,
): VerificationVerdict {
  if (!evidence) {
    return {
      verdictId: `verdict.${testCase.id}.missing-evidence`,
      status: "NOT_VERIFIED",
      presentation: "NOT VERIFIED",
      testCaseId: testCase.id,
      failureCode: "EVIDENCE_MISSING",
      details: ["Evidence is required before a verification claim can be made."],
      actualExternalExecution: false,
    };
  }
  if (evidence.testCaseId !== testCase.id) {
    return {
      verdictId: `verdict.${testCase.id}.test-case-mismatch`,
      status: "NOT_VERIFIED",
      presentation: "NOT VERIFIED",
      testCaseId: testCase.id,
      evidenceReference: evidence.reference,
      failureCode: "TEST_CASE_MISMATCH",
      details: ["Evidence is linked to a different acceptance test case."],
      actualExternalExecution: false,
    };
  }
  const observed = new Set(evidence.observed);
  const forbidden = testCase.forbiddenObservations.filter((item) => observed.has(item));
  if (forbidden.length > 0) {
    return {
      verdictId: `verdict.${testCase.id}.failed`,
      status: "FAILED",
      presentation: "SIMULATED FAILED",
      testCaseId: testCase.id,
      evidenceReference: evidence.reference,
      failureCode: "FORBIDDEN_OBSERVATION_DETECTED",
      details: forbidden.map((item) => `Forbidden observation: ${item}`),
      actualExternalExecution: false,
    };
  }
  const missing = testCase.expectedObservations.filter((item) => !observed.has(item));
  if (missing.length > 0) {
    return {
      verdictId: `verdict.${testCase.id}.expected-observation-missing`,
      status: "NOT_VERIFIED",
      presentation: "NOT VERIFIED",
      testCaseId: testCase.id,
      evidenceReference: evidence.reference,
      failureCode: "EXPECTED_OBSERVATION_MISSING",
      details: missing.map((item) => `Expected observation missing: ${item}`),
      actualExternalExecution: false,
    };
  }
  return {
    verdictId: `verdict.${testCase.id}.verified`,
    status: "VERIFIED",
    presentation: "SIMULATED VERIFIED",
    testCaseId: testCase.id,
    evidenceReference: evidence.reference,
    details: ["All expected observations are present in a simulated fixture."],
    actualExternalExecution: false,
  };
}
