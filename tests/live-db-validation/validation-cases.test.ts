import { describe, expect, it } from "vitest";
import {
  dryRunnableValidationCases,
  liveDbValidationCases,
  validateLiveDbValidationCases,
} from "./validation-cases";

describe("LIVE-DB validation case registry", () => {
  it("contains approval, RLS, concurrency, and product-runtime coverage", () => {
    expect(liveDbValidationCases.filter((item) => item.category === "APPROVAL")).toHaveLength(6);
    expect(liveDbValidationCases.filter((item) => item.category === "RLS")).toHaveLength(3);
    expect(liveDbValidationCases.filter((item) => item.category === "CONCURRENT_CONSUME")).toHaveLength(2);
    expect(liveDbValidationCases.some((item) => item.category === "PRODUCT_RUNTIME")).toBe(true);
  });

  it("uses unique deterministic ids and keeps database cases out of dry execution", () => {
    expect(validateLiveDbValidationCases()).toBe(true);
    expect(dryRunnableValidationCases().every((item) => item.classification === "DRY_RUNNABLE")).toBe(true);
    expect(dryRunnableValidationCases().map((item) => item.id)).not.toContain("consume-exactly-one-winner");
  });

  it("rejects duplicate or malformed case definitions", () => {
    expect(validateLiveDbValidationCases([
      { id: "duplicate", category: "ENVIRONMENT", classification: "DRY_RUNNABLE", expectedResult: "safe" },
      { id: "duplicate", category: "ENVIRONMENT", classification: "DRY_RUNNABLE", expectedResult: "safe" },
    ])).toBe(false);
  });
});
