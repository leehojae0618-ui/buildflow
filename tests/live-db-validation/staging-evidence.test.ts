import { describe, expect, it } from "vitest";

import { createLiveDbStagingEvidenceSummary, hasStagingUnsafeValue } from "./staging-evidence";
import type { LiveDbCaseResult } from "./types";

const caseResults: readonly LiveDbCaseResult[] = [
  { caseId: "approval-create", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
  { caseId: "rls-anon-denied", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
  { caseId: "product-runtime-fake-provider", executionStatus: "SKIPPED_REQUIRES_STAGING", verdict: "SKIPPED" },
];

const summary = () =>
  createLiveDbStagingEvidenceSummary({
    validationRunId: "live-db-validation-001-staging",
    maskedProjectRef: "stag…gabc",
    migrationApplied: true,
    appliedMigrationCount: 20,
    caseResults,
    cases: [
      {
        caseId: "rls-anon-denied",
        actorClass: "ANONYMOUS",
        expectedResult: "anonymous access is denied",
        actualSafeResult: "denied",
        verdict: "PASS",
        rowCount: 0,
      },
    ],
    timestamp: "2026-08-17T00:00:00.000Z",
    verdict: "PASS",
  });

describe("hasStagingUnsafeValue", () => {
  it("detects database URLs, which embed the password", () => {
    expect(
      hasStagingUnsafeValue({ note: "postgresql://postgres:pw@db.abc.supabase.co:5432/postgres" }),
    ).toBe(true);
    expect(hasStagingUnsafeValue({ note: "postgres://postgres:pw@db.abc.supabase.co:5432/postgres" })).toBe(true);
  });

  it("detects JWTs, publishable and service keys, and bearer tokens", () => {
    expect(
      hasStagingUnsafeValue({ key: "eyJhbGciOiJIUzI1NiIs.eyJyb2xlIjoiYW5vbiJ9.signature" }),
    ).toBe(true);
    expect(hasStagingUnsafeValue({ key: "sb_secret_abcdefgh1234" })).toBe(true);
    expect(hasStagingUnsafeValue({ key: "sb_publishable_abcdefgh1234" })).toBe(true);
    expect(hasStagingUnsafeValue({ role: "service_role" })).toBe(true);
    expect(hasStagingUnsafeValue({ key: "sk-abcdefgh1234" })).toBe(true);
    expect(hasStagingUnsafeValue({ header: "Bearer abcdefgh.1234" })).toBe(true);
  });

  it("detects a full project URL", () => {
    expect(hasStagingUnsafeValue({ url: "https://stagingabc.supabase.co" })).toBe(true);
  });

  it("detects a full project ref only when it is named as forbidden", () => {
    const value = { ref: "stagingabc" };
    expect(hasStagingUnsafeValue(value)).toBe(false);
    expect(hasStagingUnsafeValue(value, { forbiddenProjectRefs: ["stagingabc"] })).toBe(true);
    expect(hasStagingUnsafeValue(value, { forbiddenProjectRefs: ["StagingABC"] })).toBe(true);
  });

  it("does not reject legitimate masked refs or binding checksums", () => {
    expect(
      hasStagingUnsafeValue(
        { maskedProjectRef: "stag…gabc", bindingChecksum: "9f2c4b7ae1d0c3f58b6a" },
        { forbiddenProjectRefs: ["productionxyz"] },
      ),
    ).toBe(false);
  });

  it("ignores an empty forbidden ref rather than matching everything", () => {
    expect(hasStagingUnsafeValue({ note: "safe" }, { forbiddenProjectRefs: ["", "  "] })).toBe(false);
  });
});

describe("createLiveDbStagingEvidenceSummary", () => {
  it("builds a summary from safe fields and partitions case ids", () => {
    expect(summary()).toMatchObject({
      validationRunId: "live-db-validation-001-staging",
      targetEnvironment: "staging",
      maskedProjectRef: "stag…gabc",
      actorType: "HARNESS",
      externalProviderCallCount: 0,
      executionMode: "STAGING",
      migrationApplied: true,
      appliedMigrationCount: 20,
      timestamp: "2026-08-17T00:00:00.000Z",
      executedCaseIds: ["approval-create", "rls-anon-denied"],
      failedCaseIds: [],
      skippedCaseIds: ["product-runtime-fake-provider"],
      secretExposureDetected: false,
      verdict: "PASS",
    });
  });

  it("carries only the allowed evidence fields per case", () => {
    const [entry] = summary().cases;
    expect(Object.keys(entry).sort()).toEqual(
      ["actorClass", "actualSafeResult", "caseId", "expectedResult", "rowCount", "verdict"].sort(),
    );
  });

  it("contains no unsafe value, including the staging project ref", () => {
    expect(
      hasStagingUnsafeValue(summary(), { forbiddenProjectRefs: ["stagingabc", "productionxyz"] }),
    ).toBe(false);
  });

  it("freezes the summary and its cases so evidence cannot be mutated after the fact", () => {
    const evidence = summary();
    expect(Object.isFrozen(evidence)).toBe(true);
    expect(Object.isFrozen(evidence.cases[0])).toBe(true);
  });
});
