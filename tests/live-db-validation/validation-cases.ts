export type LiveDbValidationCategory =
  | "ENVIRONMENT"
  | "APPROVAL"
  | "RLS"
  | "CONCURRENT_CONSUME"
  | "PRODUCT_RUNTIME";

import type { LiveDbSafeErrorCode } from "./types";

export type LiveDbValidationClassification =
  | "UNIT_TESTABLE_WITHOUT_DB"
  | "STRUCTURE_ONLY_WITHOUT_DB"
  | "REQUIRES_SUPABASE_LOCAL"
  | "REQUIRES_STAGING";

export type LiveDbValidationCase = {
  id: string;
  category: LiveDbValidationCategory;
  classification: LiveDbValidationClassification;
  expectedResult: string;
};

const cases: readonly LiveDbValidationCase[] = [
  { id: "environment-local-target", category: "ENVIRONMENT", classification: "UNIT_TESTABLE_WITHOUT_DB", expectedResult: "local target is accepted" },
  { id: "environment-production-block", category: "ENVIRONMENT", classification: "UNIT_TESTABLE_WITHOUT_DB", expectedResult: "production target is blocked" },
  { id: "provider-fake-identity", category: "PRODUCT_RUNTIME", classification: "UNIT_TESTABLE_WITHOUT_DB", expectedResult: "explicit fake provider identity is accepted" },
  { id: "client-explicit-injection", category: "PRODUCT_RUNTIME", classification: "UNIT_TESTABLE_WITHOUT_DB", expectedResult: "explicit repository clients are accepted" },
  { id: "registry-integrity", category: "PRODUCT_RUNTIME", classification: "UNIT_TESTABLE_WITHOUT_DB", expectedResult: "validation registry is structurally valid" },
  { id: "evidence-safety", category: "PRODUCT_RUNTIME", classification: "UNIT_TESTABLE_WITHOUT_DB", expectedResult: "dry evidence contains no secret-shaped values" },
  { id: "approval-create", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "create contract is defined" },
  { id: "approval-approve", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "approve contract is defined" },
  { id: "approval-reject", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "reject contract is defined" },
  { id: "approval-revoke", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "revoke contract is defined" },
  { id: "approval-consume", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "consume contract is defined" },
  { id: "approval-expiry", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "expiry contract is defined" },
  { id: "approval-binding-mismatch", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "binding mismatch is rejected" },
  { id: "rls-owner-read", category: "RLS", classification: "REQUIRES_SUPABASE_LOCAL", expectedResult: "owner can read owned approval" },
  { id: "rls-cross-user-denied", category: "RLS", classification: "REQUIRES_SUPABASE_LOCAL", expectedResult: "other user is denied" },
  { id: "rls-anon-denied", category: "RLS", classification: "REQUIRES_SUPABASE_LOCAL", expectedResult: "anonymous access is denied" },
  { id: "consume-exactly-one-winner", category: "CONCURRENT_CONSUME", classification: "REQUIRES_SUPABASE_LOCAL", expectedResult: "exactly one consume succeeds" },
  { id: "consume-replay-blocked", category: "CONCURRENT_CONSUME", classification: "REQUIRES_SUPABASE_LOCAL", expectedResult: "replay is rejected" },
  { id: "product-runtime-fake-provider", category: "PRODUCT_RUNTIME", classification: "REQUIRES_STAGING", expectedResult: "evidence persists without external provider calls" },
];

export const liveDbValidationCases = Object.freeze(cases.map((item) => Object.freeze({ ...item })));

const validClassifications = new Set<LiveDbValidationClassification>([
  "UNIT_TESTABLE_WITHOUT_DB",
  "STRUCTURE_ONLY_WITHOUT_DB",
  "REQUIRES_SUPABASE_LOCAL",
  "REQUIRES_STAGING",
]);

export type LiveDbValidationRegistryResult =
  | { status: "VALID" }
  | { status: "INVALID"; safeErrorCode: LiveDbSafeErrorCode };

export function validateLiveDbValidationCaseRegistry(
  values: readonly LiveDbValidationCase[] = liveDbValidationCases,
): LiveDbValidationRegistryResult {
  const seen = new Set<string>();
  for (const value of values) {
    const valid = Boolean(
      value.id.trim() &&
      value.expectedResult.trim() &&
      value.category &&
      validClassifications.has(value.classification),
    );
    if (!valid || seen.has(value.id)) {
      return { status: "INVALID", safeErrorCode: "LIVE_DB_VALIDATION_REGISTRY_INVALID" };
    }
    seen.add(value.id);
  }
  return { status: "VALID" };
}

export function validateLiveDbValidationCases(
  values: readonly LiveDbValidationCase[] = liveDbValidationCases,
) {
  return validateLiveDbValidationCaseRegistry(values).status === "VALID";
}

export function unitTestableValidationCases() {
  return liveDbValidationCases.filter((item) => item.classification === "UNIT_TESTABLE_WITHOUT_DB");
}
