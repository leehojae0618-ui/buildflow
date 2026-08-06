const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/i,
  /(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|private[_ -]?key|password|cookie)\s*[:=]/i,
  /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
  /Authorization\s*:/i,
  /(?:^|[;\s])(?:session|cookie)=/i,
  /xox[baprs]-[A-Za-z0-9-]{10,}/i,
];

export function containsNoKeySecret(value: string | undefined): boolean {
  return value !== undefined && secretPatterns.some((pattern) => pattern.test(value));
}

export function assertNoKeySubmissionSafe(values: readonly (string | undefined)[]): void {
  if (values.some(containsNoKeySecret)) throw new Error("NO_KEY_SUBMISSION_CONTAINS_SENSITIVE_VALUE");
}
