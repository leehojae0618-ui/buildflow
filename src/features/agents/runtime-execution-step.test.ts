import { describe, expect, it } from "vitest";
import {
  DEFAULT_RETRY_POLICY_REFERENCE,
  DEFAULT_TIMEOUT_POLICY_REFERENCE,
  RUNTIME_EXECUTION_STEP_FORMAT_VERSION,
  buildRuntimeExecutionStep,
  buildRuntimeExecutionStepAttempt,
  canTransitionRuntimeExecutionStep,
  canTransitionRuntimeExecutionStepAttempt,
  resolveRuntimeStepRetryPolicyReference,
  resolveRuntimeStepTimeoutPolicyReference,
  validateRuntimeExecutionStep,
  validateRuntimeExecutionStepAttempt,
  validateRuntimeExecutionStepAttemptRetry,
  type BuildRuntimeExecutionStepAttemptInput,
  type BuildRuntimeExecutionStepInput,
  type RuntimeStepAttemptStatus,
  type RuntimeStepReference,
} from "./runtime-execution-step";

const checksum = (value: string) => value.padEnd(64, value).slice(0, 64);

function reference(
  referenceId: string,
  referenceType = "REFERENCE",
  checksumSeed?: string,
): RuntimeStepReference {
  return {
    referenceId,
    referenceType,
    ...(checksumSeed ? { integrityChecksum: checksum(checksumSeed) } : {}),
  };
}

function validStep(
  overrides: Partial<BuildRuntimeExecutionStepInput> = {},
): BuildRuntimeExecutionStepInput {
  return {
    formatVersion: RUNTIME_EXECUTION_STEP_FORMAT_VERSION,
    runtimeExecutionId: "execution-1",
    runtimeExecutionRequestId: "request-1",
    runtimeExecutionStartId: "start-1",
    runtimeStepId: "step-1",
    sequence: 0,
    nameReference: "step-name-1",
    purposeCode: "PROCESS_INPUT",
    stepKind: "TRANSFORM",
    invocationBoundary: "NONE",
    status: "READY",
    inputReferences: [reference("input-1", "INPUT")],
    outputReferences: [],
    dependencyRuntimeStepIds: [],
    blockingReasons: [],
    evidenceReferences: [],
    approvalReferences: [],
    policyReferences: [],
    limitationCodes: [],
    integrityChecksum: checksum("a"),
    ...overrides,
  };
}

function completionReference(
  overrides: Partial<BuildRuntimeExecutionStepAttemptInput> = {},
  referenceType = "ATTEMPT_COMPLETED",
) {
  return {
    referenceId: "completion-1",
    referenceType,
    integrityChecksum: checksum("b"),
    runtimeExecutionId: overrides.runtimeExecutionId ?? "execution-1",
    runtimeStepId: overrides.runtimeStepId ?? "step-1",
    runtimeStepAttemptId: overrides.runtimeStepAttemptId ?? "attempt-1",
  };
}

function validAttempt(
  overrides: Partial<BuildRuntimeExecutionStepAttemptInput> = {},
): BuildRuntimeExecutionStepAttemptInput {
  return {
    formatVersion: RUNTIME_EXECUTION_STEP_FORMAT_VERSION,
    runtimeExecutionId: "execution-1",
    runtimeStepId: "step-1",
    runtimeStepAttemptId: "attempt-1",
    attemptNumber: 1,
    status: "READY",
    inputReferences: [reference("input-1", "INPUT")],
    outputReferences: [],
    blockingReasons: [],
    evidenceReferences: [],
    limitationCodes: [],
    integrityChecksum: checksum("c"),
    ...overrides,
  };
}

function attemptForStatus(
  status: RuntimeStepAttemptStatus,
): BuildRuntimeExecutionStepAttemptInput {
  const base = validAttempt({ status });
  switch (status) {
    case "READY":
      return base;
    case "RUNNING":
      return { ...base, startedAtReference: reference("started-1", "ATTEMPT_STARTED") };
    case "SUCCESS":
      return {
        ...base,
        startedAtReference: reference("started-1", "ATTEMPT_STARTED"),
        completedAtReference: completionReference(base),
        evidenceReferences: [reference("evidence-1", "EVIDENCE")],
      };
    case "FAILED":
      return {
        ...base,
        startedAtReference: reference("started-1", "ATTEMPT_STARTED"),
        completedAtReference: completionReference(base),
        evidenceReferences: [reference("evidence-1", "EVIDENCE")],
        failure: {
          code: "INPUT_INVALID",
          target: "inputReferences",
          safeReference: reference("failure-1", "SAFE_FAILURE"),
          recoverable: true,
          userActionable: true,
        },
        retryDecision: {
          decision: "RETRY_DENIED",
          retryPolicyReference: reference("retry-policy-1", "RETRY_POLICY"),
        },
      };
    case "CANCELLED":
      return {
        ...base,
        completedAtReference: completionReference(base),
        cancellationReference: reference("cancel-1", "CANCELLATION"),
      };
    case "TIMEOUT":
      return {
        ...base,
        startedAtReference: reference("started-1", "ATTEMPT_STARTED"),
        completedAtReference: completionReference(base, "ATTEMPT_TIMEOUT"),
        retryDecision: {
          decision: "RETRY_DENIED",
          retryPolicyReference: reference("retry-policy-1", "RETRY_POLICY"),
        },
      };
  }
}

describe("RuntimeExecutionStep", () => {
  it.each([
    "READY",
    "RUNNING",
    "WAITING",
    "SUCCESS",
    "FAILED",
    "CANCELLED",
    "SKIPPED",
    "TIMEOUT",
  ] as const)("builds a valid %s Step when its terminal reference rule is satisfied", (status) => {
    const terminalOverrides: Partial<BuildRuntimeExecutionStepInput> =
      status === "SUCCESS" || status === "FAILED"
        ? { evidenceReferences: [reference("evidence-1", "EVIDENCE")] }
        : status === "CANCELLED"
          ? { cancellationReference: reference("cancel-1", "CANCELLATION") }
          : status === "SKIPPED"
            ? { outputReferences: [reference("skip-1", "SKIP_REASON")] }
            : status === "TIMEOUT"
              ? { timeoutPolicyReference: reference("timeout-1", "TIMEOUT") }
              : {};

    const result = buildRuntimeExecutionStep(validStep({ status, ...terminalOverrides }));

    expect(result.status).toBe("VALID");
    if (result.status === "VALID") {
      expect(validateRuntimeExecutionStep(result.value)).toEqual({ valid: true, failures: [] });
    }
  });

  it("enforces the Provider, MCP, and NONE invocation boundary", () => {
    const provider = buildRuntimeExecutionStep(
      validStep({
        invocationBoundary: "PROVIDER",
        providerInvocationReference: reference("provider-1", "PROVIDER_INVOCATION"),
      }),
    );
    const mcp = buildRuntimeExecutionStep(
      validStep({
        invocationBoundary: "MCP",
        mcpInvocationReference: reference("mcp-1", "MCP_INVOCATION"),
      }),
    );
    const invalid = buildRuntimeExecutionStep(
      validStep({
        invocationBoundary: "NONE",
        providerInvocationReference: reference("provider-1", "PROVIDER_INVOCATION"),
      }),
    );

    expect(provider.status).toBe("VALID");
    expect(mcp.status).toBe("VALID");
    expect(invalid).toEqual(
      expect.objectContaining({
        status: "INVALID",
        failures: expect.arrayContaining([
          expect.objectContaining({ code: "STEP_INVOCATION_BOUNDARY_INVALID" }),
        ]),
      }),
    );
  });

  it("requires an approval reference when approval is a blocking reason", () => {
    const result = buildRuntimeExecutionStep(
      validStep({ blockingReasons: ["APPROVAL_REQUIRED"] }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        status: "INVALID",
        failures: expect.arrayContaining([
          expect.objectContaining({ target: "approvalReferences" }),
        ]),
      }),
    );
  });

  it("rejects invalid Step identities and dependency self-references", () => {
    const result = buildRuntimeExecutionStep(
      validStep({ runtimeExecutionStartId: "", dependencyRuntimeStepIds: ["step-1"] }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") {
      expect(result.failures).toContainEqual(
        expect.objectContaining({ target: "runtimeExecutionStartId" }),
      );
      expect(result.failures).toContainEqual(
        expect.objectContaining({ target: "dependencyRuntimeStepIds" }),
      );
    }
  });

  it.each(["READY", "RUNNING", "SUCCESS", "FAILED", "CANCELLED", "TIMEOUT"] as const)(
    "builds a valid %s Attempt matching the approved field matrix",
    (status) => {
      const result = buildRuntimeExecutionStepAttempt(attemptForStatus(status));

      expect(result.status).toBe("VALID");
      if (result.status === "VALID") {
        expect(validateRuntimeExecutionStepAttempt(result.value)).toEqual({
          valid: true,
          failures: [],
        });
      }
    },
  );

  it("rejects forbidden Attempt fields and missing terminal references", () => {
    const readyWithCompletion = buildRuntimeExecutionStepAttempt(
      validAttempt({ completedAtReference: completionReference() }),
    );
    const successWithoutEvidence = buildRuntimeExecutionStepAttempt(
      validAttempt({
        status: "SUCCESS",
        startedAtReference: reference("started-1", "ATTEMPT_STARTED"),
        completedAtReference: completionReference(),
      }),
    );
    const failedWithoutFailure = buildRuntimeExecutionStepAttempt({
      ...attemptForStatus("FAILED"),
      failure: undefined,
    });

    for (const result of [readyWithCompletion, successWithoutEvidence, failedWithoutFailure]) {
      expect(result.status).toBe("INVALID");
    }
  });

  it("enforces completedAtReference identity binding and timeout type", () => {
    const bindingMismatch = buildRuntimeExecutionStepAttempt({
      ...attemptForStatus("SUCCESS"),
      completedAtReference: {
        ...completionReference(),
        runtimeStepAttemptId: "attempt-other",
      },
    });
    const timeoutTypeMismatch = buildRuntimeExecutionStepAttempt({
      ...attemptForStatus("TIMEOUT"),
      completedAtReference: completionReference(validAttempt({ status: "TIMEOUT" })),
    });

    expect(bindingMismatch.status).toBe("INVALID");
    expect(timeoutTypeMismatch.status).toBe("INVALID");
  });

  it("keeps failure reference-first and never exposes raw secret values", () => {
    const result = buildRuntimeExecutionStepAttempt({
      ...attemptForStatus("FAILED"),
      failure: {
        code: "INPUT_INVALID",
        target: "inputReferences",
        safeReference: {
          referenceId: "failure-1",
          referenceType: "SAFE_FAILURE",
          secret: "redacted-test-value",
        } as RuntimeStepReference,
        recoverable: true,
        userActionable: true,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "INVALID",
        failures: expect.arrayContaining([{ code: "STEP_SECRET_DETECTED" }]),
      }),
    );
    expect(JSON.stringify(result)).not.toContain("redacted-test-value");
  });

  it("enforces retry identity without executing a retry", () => {
    const previous = attemptForStatus("FAILED");
    previous.retryDecision = {
      decision: "RETRY_ALLOWED",
      retryPolicyReference: reference("retry-policy-1", "RETRY_POLICY"),
    };
    const next = validAttempt({
      runtimeStepAttemptId: "attempt-2",
      attemptNumber: 2,
      previousRuntimeStepAttemptId: "attempt-1",
    });

    expect(validateRuntimeExecutionStepAttemptRetry(previous, next)).toEqual({
      valid: true,
      failures: [],
    });
    expect(
      validateRuntimeExecutionStepAttemptRetry(previous, {
        ...next,
        runtimeExecutionId: "execution-other",
      }),
    ).toEqual(
      expect.objectContaining({
        valid: false,
        failures: expect.arrayContaining([
          expect.objectContaining({ target: "runtimeExecutionId" }),
        ]),
      }),
    );
    expect(
      validateRuntimeExecutionStepAttemptRetry(previous, {
        ...next,
        runtimeStepId: "step-other",
      }),
    ).toEqual(
      expect.objectContaining({
        valid: false,
        failures: expect.arrayContaining([expect.objectContaining({ target: "runtimeStepId" })]),
      }),
    );
    expect(
      validateRuntimeExecutionStepAttemptRetry(previous, {
        ...next,
        runtimeStepAttemptId: "attempt-1",
      }),
    ).toEqual(
      expect.objectContaining({
        valid: false,
        failures: expect.arrayContaining([expect.objectContaining({ code: "STEP_RETRY_INVALID" })]),
      }),
    );
    expect(
      validateRuntimeExecutionStepAttemptRetry(previous, {
        ...next,
        previousRuntimeStepAttemptId: "attempt-other",
      }),
    ).toEqual(
      expect.objectContaining({
        valid: false,
        failures: expect.arrayContaining([
          expect.objectContaining({ target: "previousRuntimeStepAttemptId" }),
        ]),
      }),
    );
    expect(
      validateRuntimeExecutionStepAttemptRetry(previous, {
        ...next,
        attemptNumber: 3,
      }),
    ).toEqual(
      expect.objectContaining({
        valid: false,
        failures: expect.arrayContaining([expect.objectContaining({ target: "attemptNumber" })]),
      }),
    );
  });

  it("enforces the 1-based initial and retry predecessor discriminator", () => {
    for (const attemptNumber of [0, -1, 1.5, Number.NaN]) {
      expect(validateRuntimeExecutionStepAttempt(validAttempt({ attemptNumber }))).toEqual(
        expect.objectContaining({
          valid: false,
          failures: expect.arrayContaining([expect.objectContaining({ target: "attemptNumber" })]),
        }),
      );
    }

    expect(
      validateRuntimeExecutionStepAttempt(
        validAttempt({ previousRuntimeStepAttemptId: "attempt-previous" }),
      ),
    ).toEqual(
      expect.objectContaining({
        valid: false,
        failures: expect.arrayContaining([
          expect.objectContaining({ target: "previousRuntimeStepAttemptId" }),
        ]),
      }),
    );

    for (const previousRuntimeStepAttemptId of [undefined, "", "attempt-2"]) {
      expect(
        validateRuntimeExecutionStepAttempt(
          validAttempt({
            attemptNumber: 2,
            runtimeStepAttemptId: "attempt-2",
            previousRuntimeStepAttemptId,
          }),
        ),
      ).toEqual(
        expect.objectContaining({
          valid: false,
          failures: expect.arrayContaining([
            expect.objectContaining({ target: "previousRuntimeStepAttemptId" }),
          ]),
        }),
      );
    }
  });

  it("applies only the approved state transitions", () => {
    expect(canTransitionRuntimeExecutionStep("READY", "RUNNING")).toBe(true);
    expect(canTransitionRuntimeExecutionStep("SUCCESS", "RUNNING")).toBe(false);
    expect(canTransitionRuntimeExecutionStepAttempt("RUNNING", "TIMEOUT")).toBe(true);
    expect(canTransitionRuntimeExecutionStepAttempt("TIMEOUT", "RUNNING")).toBe(false);
  });

  it("uses explicit default policy references without serializing or hashing", () => {
    expect(resolveRuntimeStepTimeoutPolicyReference(validStep())).toEqual(
      DEFAULT_TIMEOUT_POLICY_REFERENCE,
    );
    expect(resolveRuntimeStepRetryPolicyReference(validAttempt())).toEqual(
      DEFAULT_RETRY_POLICY_REFERENCE,
    );
  });

  it("returns an immutable copy without mutating caller-owned records", () => {
    const input = validStep({ inputReferences: [reference("input-1", "INPUT")] });
    const result = buildRuntimeExecutionStep(input);

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") return;
    input.inputReferences[0].referenceId = "caller-mutated";
    expect(result.value.inputReferences[0].referenceId).toBe("input-1");
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.inputReferences)).toBe(true);
  });
});
