import { createRequirementSnapshot } from "../requirements/snapshot";

export type Bf0ProjectDraftInput = {
  idea: string;
  goal: string | null;
  source: string | null;
  approval: string | null;
  output: string | null;
};

export type Bf0ProjectDraftPayload = {
  title: string;
  goal: string;
  goalDescription: string;
  goalConstraints: Record<string, unknown>;
};

export type Bf0ProjectDraftValidationResult =
  | { status: "VALID"; value: Bf0ProjectDraftPayload }
  | { status: "INVALID"; errorCode: "DRAFT_INVALID" | "DRAFT_UNSAFE" };

export type Bf0ProjectPersistenceResult =
  | { ok: true; projectId: string }
  | { ok: false; errorCode: "UNAUTHENTICATED" | "DRAFT_INVALID" | "DRAFT_UNSAFE" | "PERSISTENCE_FAILED" };

type Bf0ProjectPersistenceDependencies = {
  userId: () => Promise<string | null>;
  insert: (payload: Bf0ProjectDraftPayload & { userId: string }) => Promise<string | null>;
  revalidate: (projectId: string) => void;
};

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /AKIA[0-9A-Z]{16}/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
] as const;

function normalizeText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized && normalized.length <= max ? normalized : null;
}

function containsSecret(value: string) {
  return secretPatterns.some((pattern) => pattern.test(value));
}

function titleFromIdea(idea: string) {
  const firstLine = idea.split(/[.!?。]/, 1)[0]?.trim() || idea;
  return firstLine.slice(0, 80).trim();
}

/**
 * This server-side projection intentionally accepts choices, not a browser
 * Requirement Snapshot. The canonical snapshot is recreated here.
 */
export function buildBf0ProjectDraftPayload(
  input: Bf0ProjectDraftInput,
): Bf0ProjectDraftValidationResult {
  const idea = normalizeText(input.idea, 280);
  const goal = normalizeText(input.goal, 120);
  const source = normalizeText(input.source, 120);
  const approval = normalizeText(input.approval, 120);
  const output = normalizeText(input.output, 120);
  if (!idea || idea.length < 10 || !goal || !source || !approval || !output) {
    return { status: "INVALID", errorCode: "DRAFT_INVALID" };
  }
  if ([idea, goal, source, approval, output].some(containsSecret)) {
    return { status: "INVALID", errorCode: "DRAFT_UNSAFE" };
  }

  const title = titleFromIdea(idea);
  if (title.length < 2) return { status: "INVALID", errorCode: "DRAFT_INVALID" };

  const requirementSnapshot = createRequirementSnapshot(idea, {
    automation_level: approval === "자동 진행" ? "high" : "guide",
    budget_range: "unknown",
    current_tools: [],
  });
  return {
    status: "VALID",
    value: {
      title,
      goal: idea,
      goalDescription: `BF0 설계 초안 · 목표: ${goal} · 입력: ${source} · 승인: ${approval} · 결과: ${output}`,
      goalConstraints: {
        source: "BF0_PRODUCT_EXPERIENCE",
        bf0_design_draft: { goal, source, approval, output },
        requirement_snapshot: requirementSnapshot,
      },
    },
  };
}

export async function persistBf0ProjectDraft(
  input: Bf0ProjectDraftInput,
  dependencies: Bf0ProjectPersistenceDependencies,
): Promise<Bf0ProjectPersistenceResult> {
  const built = buildBf0ProjectDraftPayload(input);
  if (built.status === "INVALID") return { ok: false, errorCode: built.errorCode };
  try {
    const userId = await dependencies.userId();
    if (!userId) return { ok: false, errorCode: "UNAUTHENTICATED" };
    const projectId = await dependencies.insert({ ...built.value, userId });
    if (!projectId) return { ok: false, errorCode: "PERSISTENCE_FAILED" };
    dependencies.revalidate(projectId);
    return { ok: true, projectId };
  } catch {
    return { ok: false, errorCode: "PERSISTENCE_FAILED" };
  }
}
