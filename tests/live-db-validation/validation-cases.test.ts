import { describe, expect, it } from "vitest";
import {
  liveDbValidationCases,
  unitTestableValidationCases,
  validateLiveDbValidationCaseRegistry,
  validateLiveDbValidationCases,
} from "./validation-cases";

describe("LIVE-DB validation case registry", () => {
  it("contains approval, RLS, concurrency, and product-runtime coverage", () => {
    expect(liveDbValidationCases.filter((item) => item.category === "APPROVAL")).toHaveLength(6);
    expect(liveDbValidationCases.filter((item) => item.category === "RLS")).toHaveLength(3);
    expect(liveDbValidationCases.filter((item) => item.category === "CONCURRENT_CONSUME")).toHaveLength(2);
    expect(liveDbValidationCases.some((item) => item.category === "PRODUCT_RUNTIME")).toBe(true);
  });

  it("uses approved classifications and keeps database cases out of unit execution", () => {
    expect(validateLiveDbValidationCases()).toBe(true);
    expect(unitTestableValidationCases().every((item) => item.classification === "UNIT_TESTABLE_WITHOUT_DB")).toBe(true);
    expect(unitTestableValidationCases().map((item) => item.id)).not.toContain("consume-exactly-one-winner");
    expect(liveDbValidationCases.some((item) => item.classification === "REQUIRES_STAGING")).toBe(true);
  });

  it("rejects duplicate or unknown case definitions with a dedicated safe code", () => {
    expect(validateLiveDbValidationCaseRegistry([
      { id: "duplicate", category: "ENVIRONMENT", classification: "UNIT_TESTABLE_WITHOUT_DB", expectedResult: "safe" },
      { id: "duplicate", category: "ENVIRONMENT", classification: "UNIT_TESTABLE_WITHOUT_DB", expectedResult: "safe" },
    ])).toEqual({ status: "INVALID", safeErrorCode: "LIVE_DB_VALIDATION_REGISTRY_INVALID" });
    expect(validateLiveDbValidationCaseRegistry([
      { id: "unknown", category: "ENVIRONMENT", classification: "UNKNOWN" as never, expectedResult: "safe" },
    ])).toEqual({ status: "INVALID", safeErrorCode: "LIVE_DB_VALIDATION_REGISTRY_INVALID" });
  });
});
