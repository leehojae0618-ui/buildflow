export type LiveDbValidationCategory =
  | "ENVIRONMENT"
  | "APPROVAL"
  | "RLS"
  | "CONCURRENT_CONSUME"
  | "PRODUCT_RUNTIME";

export type LiveDbValidationClassification =
  | "DRY_RUNNABLE"
  | "STRUCTURE_ONLY_WITHOUT_DB"
  | "REQUIRES_SUPABASE_LOCAL"
  | "REQUIRES_DISPOSABLE_STAGING";

export type LiveDbValidationCase = {
  id: string;
  category: LiveDbValidationCategory;
  classification: LiveDbValidationClassification;
  expectedResult: string;
};

const cases: readonly LiveDbValidationCase[] = [
  { id: "environment-local-target", category: "ENVIRONMENT", classification: "DRY_RUNNABLE", expectedResult: "local target is accepted" },
  { id: "environment-production-block", category: "ENVIRONMENT", classification: "DRY_RUNNABLE", expectedResult: "production target is blocked" },
  { id: "approval-create", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "create contract is defined" },
  { id: "approval-approve", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "approve contract is defined" },
  { id: "approval-reject", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "reject contract is defined" },
  { id: "approval-consume", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "consume contract is defined" },
  { id: "approval-expiry", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "expiry contract is defined" },
  { id: "approval-binding-mismatch", category: "APPROVAL", classification: "STRUCTURE_ONLY_WITHOUT_DB", expectedResult: "binding mismatch is rejected" },
  { id: "rls-owner-read", category: "RLS", classification: "REQUIRES_SUPABASE_LOCAL", expectedResult: "owner can read owned approval" },
  { id: "rls-cross-user-denied", category: "RLS", classification: "REQUIRES_SUPABASE_LOCAL", expectedResult: "other user is denied" },
  { id: "rls-anon-denied", category: "RLS", classification: "REQUIRES_SUPABASE_LOCAL", expectedResult: "anonymous access is denied" },
  { id: "consume-exactly-one-winner", category: "CONCURRENT_CONSUME", classification: "REQUIRES_SUPABASE_LOCAL", expectedResult: "exactly one consume succeeds" },
  { id: "consume-replay-blocked", category: "CONCURRENT_CONSUME", classification: "REQUIRES_SUPABASE_LOCAL", expectedResult: "replay is rejected" },
  { id: "product-runtime-fake-provider", category: "PRODUCT_RUNTIME", classification: "REQUIRES_DISPOSABLE_STAGING", expectedResult: "evidence persists without external provider calls" },
];

export const liveDbValidationCases = Object.freeze(cases.map((item) => Object.freeze({ ...item })));

export function validateLiveDbValidationCases(
  values: readonly LiveDbValidationCase[] = liveDbValidationCases,
) {
  const seen = new Set<string>();
  return values.every((value) => {
    const valid = Boolean(value.id.trim() && value.expectedResult.trim() && value.category && value.classification);
    if (!valid || seen.has(value.id)) return false;
    seen.add(value.id);
    return true;
  });
}

export function dryRunnableValidationCases() {
  return liveDbValidationCases.filter((item) => item.classification === "DRY_RUNNABLE");
}
