import { describe, expect, it } from "vitest";
import {
  RUNTIME_EXECUTION_RESULT_FORMAT_VERSION,
  buildRuntimeExecutionResult,
  canonicalizeRuntimeExecutionResult,
  digestRuntimeExecutionResult,
  validateRuntimeExecutionResult,
  type BuildRuntimeExecutionResultInput,
} from "./runtime-execution-result";

const checksum = (value: string) => value.padEnd(64, value).slice(0, 64);

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
    stepSummaryReference: { referenceId: "step-summary-1", referenceType: "STEP_SUMMARY" },
    evidenceReferences: [
      { referenceId: "evidence-1", referenceType: "EVIDENCE", integrityChecksum: checksum("d") },
    ],
    ...overrides,
  };
}

describe("RuntimeExecutionResult", () => {
  it("constructs and validates a deterministic Result", () => {
    const result = buildRuntimeExecutionResult(validInput());

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") return;
    expect(result.value.formatVersion).toBe(RUNTIME_EXECUTION_RESULT_FORMAT_VERSION);
    expect(result.value.runtimeExecutionId).toBe("execution-1");
    expect(validateRuntimeExecutionResult(result.value)).toEqual({ valid: true, failures: [] });
  });

  it("rejects missing status-required references", () => {
    const input = validInput({
      status: "CANCELLED",
      stepSummaryReference: undefined,
      evidenceReferences: undefined,
    });

    const result = buildRuntimeExecutionResult(input);

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") return;
    expect(result.failures).toContainEqual(
      expect.objectContaining({ target: "cancellationReference" }),
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

  it("rejects conditional references that are forbidden for the selected status", () => {
    const result = buildRuntimeExecutionResult(
      validInput({
        errorReference: { referenceId: "error-1", referenceType: "ERROR" },
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") return;
    expect(result.failures).toContainEqual(
      expect.objectContaining({ target: "errorReference" }),
    );
  });

  it("canonicalizes top-level and nested object keys", () => {
    expect(canonicalizeRuntimeExecutionResult({ z: { y: 1, a: 2 }, a: true })).toBe(
      '{"a":true,"z":{"a":2,"y":1}}',
    );
  });

  it("preserves exact array order", () => {
    expect(canonicalizeRuntimeExecutionResult({ values: ["second", "first"] })).toBe(
      '{"values":["second","first"]}',
    );
  });

  it("rejects unsupported and cyclic values", () => {
    expect(() => canonicalizeRuntimeExecutionResult({ value: undefined })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: Number.NaN })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: Number.POSITIVE_INFINITY })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: BigInt(1) })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: Symbol("value") })).toThrow();
    expect(() => canonicalizeRuntimeExecutionResult({ value: () => undefined })).toThrow();

    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(() => canonicalizeRuntimeExecutionResult(cyclic)).toThrow();
  });

  it("produces the same serialization and digest for logically identical input", () => {
    const left = { z: 1, nested: { b: "value", a: [2, 1] } };
    const right = { nested: { a: [2, 1], b: "value" }, z: 1 };

    expect(canonicalizeRuntimeExecutionResult(left)).toBe(
      canonicalizeRuntimeExecutionResult(right),
    );
    expect(digestRuntimeExecutionResult(left)).toBe(digestRuntimeExecutionResult(right));
  });

  it("changes the digest when a contract-significant Result field changes", () => {
    const first = buildRuntimeExecutionResult(validInput());
    const second = buildRuntimeExecutionResult(
      validInput({ outputReference: { referenceId: "output-2", referenceType: "OUTPUT" } }),
    );

    expect(first.status).toBe("VALID");
    expect(second.status).toBe("VALID");
    if (first.status !== "VALID" || second.status !== "VALID") return;
    expect(first.value.integrityChecksum).not.toBe(second.value.integrityChecksum);
    expect(first.value.integrityChecksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects non-canonical repeated Evidence references", () => {
    const result = buildRuntimeExecutionResult(
      validInput({
        evidenceReferences: [
          { referenceId: "evidence-2", referenceType: "EVIDENCE", integrityChecksum: checksum("e") },
          { referenceId: "evidence-1", referenceType: "EVIDENCE", integrityChecksum: checksum("d") },
        ],
      }),
    );

    expect(result.status).toBe("INVALID");
    if (result.status !== "INVALID") return;
    expect(result.failures).toContainEqual(
      expect.objectContaining({ target: "evidenceReferences" }),
    );
  });

  it("detects an invalid immutable reference in a Result artifact", () => {
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

  it("does not mutate caller input or perform side effects", () => {
    const input = validInput();
    const before = JSON.stringify(input);

    const result = buildRuntimeExecutionResult(input);

    expect(result.status).toBe("VALID");
    expect(JSON.stringify(input)).toBe(before);
  });
});
