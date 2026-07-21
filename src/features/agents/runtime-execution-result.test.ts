import { describe, expect, it } from "vitest";
import {
  RUNTIME_EXECUTION_RESULT_FORMAT_VERSION,
  buildRuntimeExecutionResult,
  canonicalizeRuntimeExecutionResult,
  digestRuntimeExecutionResult,
  validateRuntimeExecutionResult,
  type BuildRuntimeExecutionResultInput,
  type RuntimeExecutionResultReference,
  type RuntimeExecutionResultStatus,
} from "./runtime-execution-result";

const checksum = (value: string) => value.padEnd(64, value).slice(0, 64);

function reference(
  referenceId: string,
  referenceType: string,
  checksumSeed?: string,
): RuntimeExecutionResultReference {
  return {
    referenceId,
    referenceType,
    ...(checksumSeed ? { integrityChecksum: checksum(checksumSeed) } : {}),
  };
}

function validInput(
  overrides: Partial<BuildRuntimeExecutionResultInput> = {},
): BuildRuntimeExecutionResultInput {
  const requestChecksum = checksum("a");
  const preflightChecksum = checksum("b");
  const startChecksum = checksum("c");
  return {
    runtimeExecutionRequest: {
      runtimeExecutionRequestId: "request-1",
      integrityChecksum: requestChecksum,
    },
    runtimePreflightResult: {
      runtimePreflightResultId: "preflight-1",
      integrityChecksum: preflightChecksum,
      runtimeExecutionRequestReference: {
        runtimeExecutionRequestId: "request-1",
        integrityChecksum: requestChecksum,
      },
    },
    runtimeExecutionStart: {
      runtimeExecutionStartId: "start-1",
      runtimeExecutionId: "execution-1",
      integrityChecksum: startChecksum,
      runtimeExecutionRequestReference: {
        runtimeExecutionRequestId: "request-1",
        integrityChecksum: requestChecksum,
      },
      runtimePreflightResultReference: {
        runtimePreflightResultId: "preflight-1",
        integrityChecksum: preflightChecksum,
      },
      startedAt: "2026-07-21T00:00:00.000Z",
    },
    status: "SUCCEEDED",
    completedAt: "2026-07-21T00:01:00.000Z",
    stepSummaryReference: reference("step-summary-1", "STEP_SUMMARY"),
    evidenceReferences: [reference("evidence-1", "EVIDENCE", "d")],
    ...overrides,
  };
}

function inputForStatus(status: RuntimeExecutionResultStatus): BuildRuntimeExecutionResultInput {
  switch (status) {
    case "SUCCEEDED":
      return validInput({ status });
    case "SUCCEEDED_WITH_LIMITATIONS":
      return validInput({
        status,
        limitationReferences: [reference("limitation-1", "LIMITATION", "e")],
      });
    case "FAILED":
      return validInput({
        status,
        errorReference: reference("error-1", "ERROR"),
      });
    case "CANCELLED":
      return validInput({
        status,
        stepSummaryReference: undefined,
        evidenceReferences: undefined,
        cancellationReference: reference("cancel-1", "CANCELLATION"),
      });
    case "TIMED_OUT":
      return validInput({
        status,
        stepSummaryReference: undefined,
        evidenceReferences: undefined,
        timeoutReference: reference("timeout-1", "TIMEOUT"),
      });
    case "BLOCKED":
      return validInput({
        status,
        stepSummaryReference: undefined,
        evidenceReferences: undefined,
        blockingReference: reference("blocked-1", "BLOCKING"),
      });
    case "INVALID":
      return validInput({
        status,
        stepSummaryReference: undefined,
        evidenceReferences: undefined,
        validationReference: reference("validation-1", "VALIDATION"),
      });
  }
}

describe("RuntimeExecutionResult", () => {
  const invalidMatrixCases: Array<[
    RuntimeExecutionResultStatus,
    Partial<BuildRuntimeExecutionResultInput>,
    string,
  ]> = [
    ["SUCCEEDED", { errorReference: reference("error-1", "ERROR") }, "errorReference"],
    [
      "SUCCEEDED_WITH_LIMITATIONS",
      { errorReference: reference("error-1", "ERROR") },
      "errorReference",
    ],
    ["FAILED", { cancellationReference: reference("cancel-1", "CANCELLATION") }, "cancellationReference"],
    ["CANCELLED", { timeoutReference: reference("timeout-1", "TIMEOUT") }, "timeoutReference"],
    ["TIMED_OUT", { cancellationReference: reference("cancel-1", "CANCELLATION") }, "cancellationReference"],
    ["BLOCKED", { errorReference: reference("error-1", "ERROR") }, "errorReference"],
    ["INVALID", { evidenceReferences: [reference("evidence-1", "EVIDENCE", "d")] }, "evidenceReferences"],
  ];
  const missingRequiredCases: Array<[
    RuntimeExecutionResultStatus,
    Partial<BuildRuntimeExecutionResultInput>,
    string,
  ]> = [
    ["SUCCEEDED", { stepSummaryReference: undefined }, "stepSummaryReference"],
    ["SUCCEEDED_WITH_LIMITATIONS", { limitationReferences: undefined }, "limitationCode"],
    ["FAILED", { errorReference: undefined }, "errorReference"],
    ["CANCELLED", { cancellationReference: undefined }, "cancellationReference"],
    ["TIMED_OUT", { timeoutReference: undefined }, "timeoutReference"],
    ["BLOCKED", { blockingReference: undefined }, "blockingReference"],
    ["INVALID", { validationReference: undefined }, "validationReference"],
  ];

  it.each([
    "SUCCEEDED",
    "SUCCEEDED_WITH_LIMITATIONS",
    "FAILED",
    "CANCELLED",
    "TIMED_OUT",
    "BLOCKED",
    "INVALID",
  ] as const)("constructs a valid %s Result", (status) => {
    const result = buildRuntimeExecutionResult(inputForStatus(status));

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") return;
    expect(result.value.formatVersion).toBe(RUNTIME_EXECUTION_RESULT_FORMAT_VERSION);
    expect(validateRuntimeExecutionResult(result.value)).toEqual({ valid: true, failures: [] });
  });

  it.each(invalidMatrixCases)("rejects forbidden references for %s", (status, overrides, target) => {
    const result = buildRuntimeExecutionResult({
      ...inputForStatus(status),
      ...overrides,
    });

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") return;
    expect(result.failures).toContainEqual(expect.objectContaining({ target }));
  });

  it.each(missingRequiredCases)("rejects missing required references for %s", (status, overrides, target) => {
    const result = buildRuntimeExecutionResult({
      ...inputForStatus(status),
      ...overrides,
    });

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") return;
    expect(result.failures).toContainEqual(expect.objectContaining({ target }));
  });

  it.each([
    "SUCCEEDED",
    "SUCCEEDED_WITH_LIMITATIONS",
    "FAILED",
    "CANCELLED",
    "TIMED_OUT",
    "BLOCKED",
    "INVALID",
  ] as const)("allows an output reference for %s", (status) => {
    const result = buildRuntimeExecutionResult({
      ...inputForStatus(status),
      outputReference: reference("output-1", "OUTPUT"),
    });

    expect(result.status).toBe("VALID");
  });

  it("rejects missing status-required references", () => {
    const result = buildRuntimeExecutionResult(
      validInput({
        status: "CANCELLED",
        stepSummaryReference: undefined,
        evidenceReferences: undefined,
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") return;
    expect(result.failures).toContainEqual(
      expect.objectContaining({ target: "cancellationReference" }),
    );
  });

  it("requires a limitation reference collection or code for SUCCEEDED_WITH_LIMITATIONS", () => {
    const result = buildRuntimeExecutionResult(
      validInput({ status: "SUCCEEDED_WITH_LIMITATIONS" }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") return;
    expect(result.failures).toContainEqual(
      expect.objectContaining({ target: "limitationCode" }),
    );
  });

  it("rejects upstream source bindings that do not identify the same execution chain", () => {
    const input = validInput();
    input.runtimeExecutionStart.runtimePreflightResultReference = {
      runtimePreflightResultId: "preflight-other",
      integrityChecksum: checksum("e"),
    };

    const result = buildRuntimeExecutionResult(input);

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") return;
    expect(result.failures).toContainEqual(
      expect.objectContaining({ code: "RESULT_REFERENCE_BINDING_MISMATCH" }),
    );
  });

  it("canonicalizes top-level, nested, Unicode object keys, and negative zero deterministically", () => {
    expect(canonicalizeRuntimeExecutionResult({ z: { y: 1, a: 2 }, a: true })).toBe(
      '{"a":true,"z":{"a":2,"y":1}}',
    );
    expect(canonicalizeRuntimeExecutionResult({ é: "accent", z: "latin" })).toBe(
      '{"z":"latin","é":"accent"}',
    );
    expect(canonicalizeRuntimeExecutionResult({ value: -0 })).toBe('{"value":0}');
  });

  it("preserves exact order for valid dense arrays", () => {
    expect(canonicalizeRuntimeExecutionResult({ values: ["second", "first"] })).toBe(
      '{"values":["second","first"]}',
    );
  });

  it("rejects unsupported, sparse, undefined, cyclic, and custom-prototype values", () => {
    expect(() => canonicalizeRuntimeExecutionResult({ value: undefined })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: [undefined] })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: new Array(2) })).toThrow();
    const nestedSparse = { value: ["valid", "value"] as string[] };
    delete nestedSparse.value[0];
    expect(() => canonicalizeRuntimeExecutionResult(nestedSparse)).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: Number.NaN })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: Number.POSITIVE_INFINITY })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: BigInt(1) })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: Symbol("value") })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: () => undefined })).toThrow();

    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(() => canonicalizeRuntimeExecutionResult(cyclic)).toThrow();

    const customPrototype = Object.create({ inherited: "value" }) as { own?: string };
    customPrototype.own = "value";
    expect(() => canonicalizeRuntimeExecutionResult(customPrototype)).toThrow();
  });

  it("accepts a shared non-cyclic object reference", () => {
    const shared = { value: "shared" };

    expect(canonicalizeRuntimeExecutionResult({ right: shared, left: shared })).toBe(
      '{"left":{"value":"shared"},"right":{"value":"shared"}}',
    );
  });

  it("produces the same serialization and digest for logically identical input", () => {
    const left = { z: 1, nested: { b: "value", a: [2, 1] } };
    const right = { nested: { a: [2, 1], b: "value" }, z: 1 };

    expect(canonicalizeRuntimeExecutionResult(left)).toBe(
      canonicalizeRuntimeExecutionResult(right),
    );
    expect(digestRuntimeExecutionResult(left)).toBe(digestRuntimeExecutionResult(right));
  });

  it("uses lowercase SHA-256 integrity digests and changes them for significant fields", () => {
    const first = buildRuntimeExecutionResult(inputForStatus("SUCCEEDED"));
    const second = buildRuntimeExecutionResult(
      validInput({ outputReference: reference("output-2", "OUTPUT") }),
    );

    expect(first.status).toBe("VALID");
    expect(second.status).toBe("VALID");
    if (first.status !== "VALID" || second.status !== "VALID") return;
    expect(first.value.integrityChecksum).toMatch(/^[a-f0-9]{64}$/);
    expect(first.value.integrityChecksum).not.toBe(second.value.integrityChecksum);
  });

  it("enforces canonical and duplicate-free Evidence and limitation collections", () => {
    const unorderedEvidence = buildRuntimeExecutionResult(
      validInput({
        evidenceReferences: [
          reference("evidence-2", "EVIDENCE", "e"),
          reference("evidence-1", "EVIDENCE", "d"),
        ],
      }),
    );
    const duplicateLimitations = buildRuntimeExecutionResult(
      validInput({
        status: "SUCCEEDED_WITH_LIMITATIONS",
        limitationReferences: [
          reference("limitation-1", "LIMITATION", "e"),
          reference("limitation-1", "LIMITATION", "e"),
        ],
      }),
    );
    const unorderedLimitations = buildRuntimeExecutionResult(
      validInput({
        status: "SUCCEEDED_WITH_LIMITATIONS",
        limitationReferences: [
          reference("limitation-2", "LIMITATION", "f"),
          reference("limitation-1", "LIMITATION", "e"),
        ],
      }),
    );
    const canonicalLimitations = buildRuntimeExecutionResult(
      validInput({
        status: "SUCCEEDED_WITH_LIMITATIONS",
        limitationReferences: [
          reference("limitation-1", "LIMITATION", "e"),
          reference("limitation-2", "LIMITATION", "f"),
        ],
      }),
    );

    expect(unorderedEvidence.status).toBe("INVALID");
    expect(duplicateLimitations.status).toBe("INVALID");
    expect(unorderedLimitations.status).toBe("INVALID");
    expect(canonicalLimitations.status).toBe("VALID");
    if (unorderedEvidence.status === "INVALID") {
      expect(unorderedEvidence.failures).toContainEqual(
        expect.objectContaining({ target: "evidenceReferences" }),
      );
    }
    if (duplicateLimitations.status === "INVALID") {
      expect(duplicateLimitations.failures).toContainEqual(
        expect.objectContaining({ target: "limitationReferences" }),
      );
    }
    if (unorderedLimitations.status === "INVALID") {
      expect(unorderedLimitations.failures).toContainEqual(
        expect.objectContaining({ target: "limitationReferences" }),
      );
    }
  });

  it("changes the digest when a limitation reference changes", () => {
    const first = buildRuntimeExecutionResult(
      validInput({
        status: "SUCCEEDED_WITH_LIMITATIONS",
        limitationReferences: [reference("limitation-1", "LIMITATION", "e")],
      }),
    );
    const second = buildRuntimeExecutionResult(
      validInput({
        status: "SUCCEEDED_WITH_LIMITATIONS",
        limitationReferences: [reference("limitation-2", "LIMITATION", "f")],
      }),
    );

    expect(first.status).toBe("VALID");
    expect(second.status).toBe("VALID");
    if (first.status !== "VALID" || second.status !== "VALID") return;
    expect(first.value.integrityChecksum).not.toBe(second.value.integrityChecksum);
  });

  it("returns structured failures for sparse reference arrays", () => {
    const sparseEvidence = new Array<RuntimeExecutionResultReference>(2);
    sparseEvidence[1] = reference("evidence-1", "EVIDENCE", "d");
    const sparseLimitations = new Array<RuntimeExecutionResultReference>(2);
    sparseLimitations[1] = reference("limitation-1", "LIMITATION", "e");

    const evidenceResult = buildRuntimeExecutionResult(validInput({ evidenceReferences: sparseEvidence }));
    const limitationResult = buildRuntimeExecutionResult(
      validInput({
        status: "SUCCEEDED_WITH_LIMITATIONS",
        limitationReferences: sparseLimitations,
      }),
    );

    expect(evidenceResult.status).toBe("INVALID");
    expect(limitationResult.status).toBe("INVALID");
    if (evidenceResult.status === "INVALID") {
      expect(evidenceResult.failures).toContainEqual(
        expect.objectContaining({ target: "evidenceReferences" }),
      );
    }
    if (limitationResult.status === "INVALID") {
      expect(limitationResult.failures).toContainEqual(
        expect.objectContaining({ target: "limitationReferences" }),
      );
    }
  });

  it("returns a structured validator failure for sparse Result references", () => {
    const built = buildRuntimeExecutionResult(validInput());
    const sparseEvidence = new Array<RuntimeExecutionResultReference>(2);
    sparseEvidence[1] = reference("evidence-1", "EVIDENCE", "d");

    expect(built.status).toBe("VALID");
    if (built.status !== "VALID") return;
    const validation = validateRuntimeExecutionResult({
      ...built.value,
      evidenceReferences: sparseEvidence,
    });

    expect(validation.valid).toBe(false);
    if (validation.valid) return;
    expect(validation.failures).toContainEqual(
      expect.objectContaining({ target: "evidenceReferences" }),
    );
  });

  it("detects invalid immutable references in a Result artifact", () => {
    const built = buildRuntimeExecutionResult(validInput());

    expect(built.status).toBe("VALID");
    if (built.status !== "VALID") return;
    const validation = validateRuntimeExecutionResult({
      ...built.value,
      runtimeExecutionStartReference: {
        ...built.value.runtimeExecutionStartReference,
        integrityChecksum: "not-a-checksum",
      },
    });

    expect(validation.valid).toBe(false);
    if (validation.valid) return;
    expect(validation.failures).toContainEqual(
      expect.objectContaining({ target: "runtimeExecutionStartReference" }),
    );
  });

  it("rejects secret-bearing input without exposing the raw value", () => {
    const result = buildRuntimeExecutionResult({
      ...validInput(),
      errorReference: {
        referenceId: "error-1",
        referenceType: "ERROR",
        secret: "redacted",
      } as never,
    });

    expect(result).toEqual({
      status: "INVALID",
      failures: [{ code: "RESULT_SECRET_DETECTED" }],
    });
  });

  it("does not retain mutable caller references or perform external side effects", () => {
    const input = validInput({
      status: "SUCCEEDED_WITH_LIMITATIONS",
      limitationReferences: [reference("limitation-1", "LIMITATION", "e")],
    });
    const result = buildRuntimeExecutionResult(input);

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") return;
    const before = canonicalizeRuntimeExecutionResult(result.value);
    input.runtimeExecutionStart.runtimeExecutionRequestReference.integrityChecksum = checksum("z");
    if (input.evidenceReferences) {
      input.evidenceReferences.push(reference("evidence-2", "EVIDENCE", "f"));
      input.evidenceReferences[0].referenceId = "changed-evidence";
    }
    if (input.limitationReferences) {
      input.limitationReferences.push(reference("limitation-2", "LIMITATION", "g"));
      input.limitationReferences[0].referenceId = "changed-limitation";
    }

    expect(canonicalizeRuntimeExecutionResult(result.value)).toBe(before);
  });
});
