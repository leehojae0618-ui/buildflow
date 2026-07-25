import type {
  ClarificationAnalysis,
  ClarificationAnalysisInput,
  ClarificationAnswer,
  ClarificationAnswerBatchCommitInput,
  ClarificationAnswerBatchPersistenceProjection,
  ClarificationAssumption,
  ClarificationCoverage,
  ClarificationDecisionProjection,
  ClarificationDecisionState,
  ClarificationDerivedEffects,
  ClarificationExitReason,
  ClarificationFieldDiff,
  ClarificationFieldValue,
  ClarificationImpact,
  ClarificationKnownFact,
  ClarificationNextDecision,
  ClarificationNonChangeScope,
  ClarificationQuestionBatch,
  ClarificationQuestionBatchInput,
  ClarificationQuestion,
  ClarificationRevisionTransition,
  ClarificationRevisionTransitionInput,
  ClarificationRevisionDiff,
  ClarificationRevisionDiffInput,
  ClarificationState,
  ClarificationSummary,
  ClarificationUnknown,
  ClarificationValue,
  Requirement,
} from "./types";

export const CLARIFICATION_POLICY_VERSION = "clarification-confidence-v1" as const;
export const MAX_QUESTIONS_PER_BATCH = 3;
export const MAX_CLARIFICATION_CYCLES = 5;
export const CLARIFICATION_NON_CHANGE_SCOPES: ClarificationNonChangeScope[] = [
  "RUNTIME",
  "PROVIDER",
  "MCP",
  "APPROVAL",
  "SESSION",
  "EVIDENCE",
  "COMPLETED_EXECUTION",
];

export class ClarificationPersistenceError extends Error {
  constructor(
    public readonly code:
      | "STALE_REVISION"
      | "POLICY_VERSION_UNSUPPORTED"
      | "ANSWER_BATCH_INVALID"
      | "SECRET_SHAPED_INPUT",
  ) {
    super(code);
    this.name = "ClarificationPersistenceError";
  }
}

export function classifyClarificationPreparationError(
  error: unknown,
): ClarificationPersistenceError["code"] | "PROJECTION_FAILED" {
  if (error instanceof ClarificationPersistenceError) return error.code;
  return "PROJECTION_FAILED";
}

const impactWeight: Record<ClarificationImpact, number> = {
  CRITICAL: 0.5,
  IMPORTANT: 0.35,
  OPTIONAL: 0.15,
};

const questionImpact: Record<string, ClarificationImpact> = {
  platform: "CRITICAL",
  automation: "IMPORTANT",
  primary_user: "IMPORTANT",
  budget: "IMPORTANT",
  user_volume: "OPTIONAL",
  current_tools: "OPTIONAL",
};

export function createInitialClarificationState(): ClarificationState {
  return {
    revision: 0,
    policyVersion: CLARIFICATION_POLICY_VERSION,
    status: "ANALYZING",
    exitReason: null,
    confidence: 0,
    askedQuestionIds: [],
    answers: [],
    knownFacts: [],
    unknowns: [],
    assumptions: [],
    deferredQuestionIds: [],
    batchCount: 0,
    decisionState: createDecisionState({ revision: 0, confidence: 0, unknowns: [], assumptions: [], exitReason: null, noMaterialQuestion: false }),
    revisionDiffs: [],
  };
}

/**
 * Reads the compatible JSON boundary stored in `requirement_snapshot`.
 * A missing clarification record is the supported legacy shape; an unknown
 * policy version is deliberately not interpreted or upgraded in place.
 */
export function readCompatibleClarificationState(value: unknown): ClarificationState {
  if (value === undefined || value === null) return createInitialClarificationState();
  if (!isRecord(value) || value.policyVersion !== CLARIFICATION_POLICY_VERSION) {
    throw new ClarificationPersistenceError("POLICY_VERSION_UNSUPPORTED");
  }

  const state = value as ClarificationState;
  if (!Number.isSafeInteger(state.revision) || state.revision < 0 || !Array.isArray(state.revisionDiffs)) {
    throw new ClarificationPersistenceError("POLICY_VERSION_UNSUPPORTED");
  }
  if (state.revisionDiffs.length !== state.revision) {
    throw new ClarificationPersistenceError("POLICY_VERSION_UNSUPPORTED");
  }
  state.revisionDiffs.forEach((diff, index) => {
    validateClarificationRevisionDiff(diff);
    if (diff.revision !== index + 1) {
      throw new ClarificationPersistenceError("POLICY_VERSION_UNSUPPORTED");
    }
  });
  if (state.revision > 0) {
    const latest = state.revisionDiffs[state.revisionDiffs.length - 1]!;
    if (
      latest.decisionState.after.clarificationRevision !== state.revision ||
      latest.decisionState.after.revisionDiff !== state.revision ||
      state.exitReason !== latest.confidence.exitReasonAfter ||
      state.confidence !== latest.confidence.after ||
      !sameDecisionState(state.decisionState, latest.decisionState.after)
    ) {
      throw new ClarificationPersistenceError("POLICY_VERSION_UNSUPPORTED");
    }
  }
  return cloneClarificationState(state);
}

/**
 * Builds the next append-only Clarification record without reading time,
 * randomness, a database, or UI state. The caller persists the returned JSON
 * atomically only after project ownership has been checked.
 */
export function prepareClarificationAnswerBatch(
  requirement: Requirement,
  storedClarification: unknown,
  input: ClarificationAnswerBatchCommitInput,
): ClarificationAnswerBatchPersistenceProjection {
  const current = readCompatibleClarificationState(storedClarification);
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0 || input.expectedRevision !== current.revision) {
    throw new ClarificationPersistenceError("STALE_REVISION");
  }
  if (!Array.isArray(input.answers) || input.answers.length === 0 || (input.assumptions !== undefined && !Array.isArray(input.assumptions))) {
    throw new ClarificationPersistenceError("ANSWER_BATCH_INVALID");
  }
  if (containsSecretLikeInput(input.answers) || containsSecretLikeInput(input.assumptions ?? [])) {
    throw new ClarificationPersistenceError("SECRET_SHAPED_INPUT");
  }

  const questions = getClarificationQuestions(requirement);
  const currentBatch = projectClarificationQuestionBatch({
    questions,
    completedCycles: current.batchCount,
    revision: current.revision,
    confidence: current.confidence,
    answeredQuestionIds: current.answers
      .filter((answer) => answer.source === "USER" && hasValue(answer.value))
      .map((answer) => answer.questionId),
    resolvedQuestionIds: [
      ...current.knownFacts.map((fact) => questionIdForField(questions, fact.field)).filter(isString),
      ...current.assumptions.map((assumption) => assumption.questionId),
    ],
    assumptionQuestionIds: current.assumptions.map((assumption) => assumption.questionId),
  });
  if (currentBatch.status !== "ASKING") {
    throw new ClarificationPersistenceError("ANSWER_BATCH_INVALID");
  }

  const submittedQuestionIds = validateSubmittedAnswers(input.answers, currentBatch.questions);
  validateSubmittedAssumptions(input.assumptions ?? [], questions, input.answers);

  const previousAnalysis = analyzeClarification({
    requirement,
    answers: current.answers,
    knownFacts: current.knownFacts,
    assumptions: current.assumptions,
    revision: current.revision,
  });
  const previous: ClarificationDecisionProjection = current.revision === 0
    ? { decisionState: previousAnalysis.decisionState, exitReason: previousAnalysis.exitReason }
    : { decisionState: current.decisionState, exitReason: current.exitReason };
  validateClarificationDecisionProjection(previous);

  const answers = [...current.answers.map(cloneAnswer), ...input.answers.map(cloneAnswer)];
  const assumptions = [...current.assumptions.map(cloneAssumption), ...(input.assumptions ?? []).map(cloneAssumption)];
  const nextRevision = current.revision + 1;
  const nextAnalysis = analyzeClarification({
    requirement,
    answers,
    knownFacts: current.knownFacts,
    assumptions,
    revision: nextRevision,
  });
  const next: ClarificationDecisionProjection = {
    decisionState: nextAnalysis.decisionState,
    exitReason: nextAnalysis.exitReason,
  };
  const before = clarificationFieldValues(questions, current.answers, current.assumptions);
  const after = clarificationFieldValues(questions, answers, assumptions);
  const material = hasMaterialFieldChange(before, after);
  const diff = createClarificationRevisionDiff({
    previous,
    next,
    before,
    after,
    reason: input.assumptions?.length ? "ASSUMPTION_ACCEPTED" : "ANSWER_BATCH",
    sourceQuestionIds: submittedQuestionIds,
    derivedEffects: material
      ? { blueprintCandidates: "REGENERATED", buildPlan: "REGENERATED" }
      : { blueprintCandidates: "UNCHANGED", buildPlan: "UNCHANGED" },
  });
  const revisionDiffs = appendClarificationRevisionDiff(current.revisionDiffs, diff);
  const clarification: ClarificationState = {
    revision: nextRevision,
    policyVersion: CLARIFICATION_POLICY_VERSION,
    status: interactionStatus(nextAnalysis.exitReason),
    exitReason: nextAnalysis.exitReason,
    confidence: nextAnalysis.confidence,
    askedQuestionIds: [],
    answers,
    knownFacts: nextAnalysis.knownFacts.map(cloneKnownFact),
    unknowns: nextAnalysis.unknowns.map((unknown) => ({ ...unknown })),
    assumptions,
    deferredQuestionIds: answers.filter((answer) => answer.source === "USER_UNKNOWN").map((answer) => answer.questionId).sort(compareStableString),
    batchCount: current.batchCount + 1,
    decisionState: cloneDecisionState(diff.decisionState.after),
    revisionDiffs,
  };
  return { clarification: cloneClarificationState(clarification), diff };
}

export function getClarificationQuestions(requirement: Requirement): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];
  if (requirement.goalType === "customer_support") {
    questions.push(
      createQuestion("platform", "쇼핑몰 또는 서비스 플랫폼은 무엇인가요?", "platform", true, 1),
      createQuestion("user_volume", "월간 문의량은 어느 정도인가요?", "user_volume", false, 3),
    );
  }
  if (!requirement.primaryUser) questions.push(createQuestion("primary_user", "이 시스템을 주로 사용할 사람은 누구인가요?", "primaryUser", true, 2));
  if (requirement.budget === "unknown") questions.push(createQuestion("budget", "월 예산은 어느 정도인가요?", "budget", true, 2));
  if (requirement.currentTools.length === 0) questions.push(createQuestion("current_tools", "현재 사용하는 Tool이 있나요?", "currentTools", false, 4));
  if (requirement.automationLevel === "unknown") questions.push(createQuestion("automation", "자동화 수준은 어느 정도를 원하시나요?", "automationLevel", true, 1));
  return rankClarificationQuestions(questions);
}

export function rankClarificationQuestions(questions: ClarificationQuestion[]): ClarificationQuestion[] {
  return [...questions]
    .map((question) => ({ ...question, impact: question.impact ?? questionImpact[question.id] ?? "IMPORTANT" }))
    .sort((left, right) => impactRank(left.impact!) - impactRank(right.impact!) || left.priority - right.priority || left.id.localeCompare(right.id));
}

export function projectClarificationQuestionBatch(input: ClarificationQuestionBatchInput): ClarificationQuestionBatch {
  if (!Number.isSafeInteger(input.completedCycles) || input.completedCycles < 0) throw new RangeError("completedCycles must be a non-negative safe integer");

  const questions = uniqueQuestions(rankClarificationQuestions(input.questions));
  const resolvedQuestionIds = new Set([...(input.answeredQuestionIds ?? []), ...(input.resolvedQuestionIds ?? [])]);
  const unresolvedQuestions = questions.filter((question) => !resolvedQuestionIds.has(question.id));
  const pendingAskedQuestionIds = new Set((input.askedQuestionIds ?? []).filter((questionId) => unresolvedQuestions.some((question) => question.id === questionId)));
  const revision = input.revision ?? 0;
  const confidence = input.confidence ?? 0;
  const assumptionQuestionIds = [...new Set(input.assumptionQuestionIds ?? [])].sort();

  if (unresolvedQuestions.length === 0) {
    const exitReason = questions.length === 0 ? "NO_MATERIAL_QUESTION" : "SUFFICIENT_INFORMATION";
    return createBatch({ status: "NO_MATERIAL_QUESTION", cycle: input.completedCycles, questions: [], remainingQuestionIds: [], exitReason, decisionState: createBatchDecisionState({ revision, confidence, assumptionQuestionIds, unresolvedQuestionIds: [], status: "READY_FOR_REVIEW", nextDecision: "REVIEW_BLUEPRINT", reasonCodes: [exitReason] }) });
  }

  if (pendingAskedQuestionIds.size > 0) {
    const pendingQuestionIds = [...pendingAskedQuestionIds].sort();
    return createBatch({ status: "AWAITING_CURRENT_ANSWERS", cycle: input.completedCycles, questions: [], remainingQuestionIds: unresolvedQuestions.map((question) => question.id), exitReason: null, decisionState: createBatchDecisionState({ revision, confidence, assumptionQuestionIds, unresolvedQuestionIds: pendingQuestionIds, status: "NOT_READY", nextDecision: "ANSWER_PENDING_QUESTION", reasonCodes: ["PENDING_QUESTION_ANSWER"] }) });
  }

  if (input.completedCycles >= MAX_CLARIFICATION_CYCLES) {
    const remainingQuestionIds = unresolvedQuestions.map((question) => question.id);
    return createBatch({ status: "CYCLE_LIMIT_REACHED", cycle: input.completedCycles, questions: [], remainingQuestionIds, exitReason: "QUESTION_CYCLE_LIMIT", decisionState: createBatchDecisionState({ revision, confidence, assumptionQuestionIds, unresolvedQuestionIds: remainingQuestionIds, status: "NOT_READY", nextDecision: "REVIEW_REMAINING_QUESTIONS", reasonCodes: ["QUESTION_CYCLE_LIMIT"] }) });
  }

  const batchQuestions = unresolvedQuestions.slice(0, MAX_QUESTIONS_PER_BATCH);
  return createBatch({ status: "ASKING", cycle: input.completedCycles + 1, questions: batchQuestions, remainingQuestionIds: unresolvedQuestions.slice(MAX_QUESTIONS_PER_BATCH).map((question) => question.id), exitReason: null, decisionState: createBatchDecisionState({ revision, confidence, assumptionQuestionIds, unresolvedQuestionIds: unresolvedQuestions.map((question) => question.id), status: "NOT_READY", nextDecision: "ANSWER_QUESTION", reasonCodes: ["QUESTIONS_PENDING"] }) });
}

export function projectClarificationRevisionTransition(
  input: ClarificationRevisionTransitionInput,
): ClarificationRevisionTransition {
  validateClarificationDecisionProjection(input.previous);
  validateClarificationDecisionProjection(input.next);

  const previous = cloneDecisionProjection(input.previous);
  const next = cloneDecisionProjection(input.next);
  const expectedRevision = previous.decisionState.clarificationRevision + 1;

  if (previous.decisionState.status === "SUPERSEDED") {
    throw new TypeError("previous revision is already superseded");
  }
  if (next.decisionState.status === "SUPERSEDED") {
    throw new TypeError("new revision cannot begin superseded");
  }
  if (previous.decisionState.scope !== "REQUIREMENT_READINESS" || next.decisionState.scope !== previous.decisionState.scope) {
    throw new TypeError("revision transition must remain within REQUIREMENT_READINESS");
  }
  if (previous.decisionState.supersededByClarificationRevision !== null) {
    throw new TypeError("previous revision already has a superseding revision");
  }
  if (next.decisionState.clarificationRevision !== expectedRevision) {
    throw new RangeError("new revision must immediately follow the previous revision");
  }
  if (next.decisionState.previousClarificationRevision !== null || next.decisionState.supersededByClarificationRevision !== null) {
    throw new TypeError("new revision must not contain an existing revision link");
  }

  const transition: ClarificationRevisionTransition = {
    previous: {
      exitReason: previous.exitReason,
      decisionState: {
        ...previous.decisionState,
        status: "SUPERSEDED",
        supersededByClarificationRevision: expectedRevision,
        nextDecision: "REVIEW_CURRENT_REVISION",
        reasonCodes: appendReasonCode(previous.decisionState.reasonCodes, "SUPERSEDED_BY_REVISION"),
      },
    },
    current: {
      exitReason: next.exitReason,
      decisionState: {
        ...next.decisionState,
        previousClarificationRevision: previous.decisionState.clarificationRevision,
      },
    },
  };

  validateClarificationDecisionProjection(transition.previous);
  validateClarificationDecisionProjection(transition.current);
  return transition;
}

export function validateClarificationDecisionProjection(
  projection: ClarificationDecisionProjection,
): void {
  const { decisionState, exitReason } = projection;

  if (decisionState.scope !== "REQUIREMENT_READINESS") {
    throw new TypeError("decision state scope must be REQUIREMENT_READINESS");
  }
  if (!Number.isSafeInteger(decisionState.clarificationRevision) || decisionState.clarificationRevision < 0) {
    throw new RangeError("clarification revision must be a non-negative safe integer");
  }
  if (!Number.isFinite(decisionState.confidence) || decisionState.confidence < 0 || decisionState.confidence > 1) {
    throw new RangeError("clarification confidence must be a finite number from 0 to 1");
  }
  const status = decisionState.status as string;
  if (!isKnownDecisionStatus(status)) {
    throw new TypeError("unknown clarification decision status");
  }
  if (status === "READY_FOR_BUILD") {
    throw new TypeError("REQUIREMENT_READINESS cannot create READY_FOR_BUILD");
  }

  if (decisionState.status === "SUPERSEDED") {
    if (!isLaterRevision(decisionState.supersededByClarificationRevision, decisionState.clarificationRevision)) {
      throw new TypeError("superseded revision must reference a later revision");
    }
    if (decisionState.nextDecision !== "REVIEW_CURRENT_REVISION") {
      throw new TypeError("superseded revision must direct review to the current revision");
    }
    return;
  }

  if (decisionState.supersededByClarificationRevision !== null) {
    throw new TypeError("current decision state cannot reference a superseding revision");
  }
  if (!isOptionalPastRevision(decisionState.previousClarificationRevision, decisionState.clarificationRevision)) {
    throw new TypeError("previous revision must precede the current revision");
  }

  if (exitReason === "BLOCKED_CRITICAL_UNKNOWN") {
    assertDecisionCombination(decisionState, "NOT_READY", "ANSWER_CRITICAL_QUESTION", exitReason);
    assertNonEmptyReferences(decisionState.unresolvedQuestionIds, exitReason);
    return;
  }
  if (exitReason === "QUESTION_CYCLE_LIMIT") {
    assertDecisionCombination(decisionState, "NOT_READY", "REVIEW_REMAINING_QUESTIONS", exitReason);
    assertNonEmptyReferences(decisionState.unresolvedQuestionIds, exitReason);
    return;
  }
  if (exitReason === "USER_PROCEED_WITH_ASSUMPTIONS") {
    assertDecisionCombination(decisionState, "READY_WITH_ASSUMPTIONS", "REVIEW_ASSUMPTIONS", exitReason);
    assertNonEmptyReferences(decisionState.assumptionQuestionIds, exitReason);
    return;
  }
  if (exitReason === "SUFFICIENT_INFORMATION" || exitReason === "NO_MATERIAL_QUESTION") {
    assertDecisionCombination(decisionState, "READY_FOR_REVIEW", "REVIEW_BLUEPRINT", exitReason);
    if (decisionState.unresolvedQuestionIds.length > 0) {
      throw new TypeError(`${exitReason} cannot retain unresolved questions`);
    }
    return;
  }

  if (decisionState.status === "READY_WITH_ASSUMPTIONS" || decisionState.status === "READY_FOR_REVIEW") {
    throw new TypeError("ready decision states require an exit reason");
  }
  if (decisionState.nextDecision === "REVIEW_REMAINING_QUESTIONS" || decisionState.nextDecision === "REVIEW_ASSUMPTIONS" || decisionState.nextDecision === "REVIEW_BLUEPRINT" || decisionState.nextDecision === "REVIEW_CURRENT_REVISION") {
    throw new TypeError("review decision requires a matching exit reason");
  }
}

export function createClarificationRevisionDiff(
  input: ClarificationRevisionDiffInput,
): ClarificationRevisionDiff {
  const transition = projectClarificationRevisionTransition({
    previous: input.previous,
    next: input.next,
  });
  const revision = transition.current.decisionState.clarificationRevision;
  const beforeValues = normalizeFieldValues(input.before);
  const afterValues = normalizeFieldValues(input.after);
  const snapshots = alignFieldValueSnapshots(beforeValues, afterValues);
  const sourceQuestionIds = normalizeReferenceIds(input.sourceQuestionIds, "source question IDs");
  const unchangedScopes = normalizeNonChangeScopes(input.unchangedScopes);
  const afterDecisionState = {
    ...cloneDecisionState(transition.current.decisionState),
    revisionDiff: revision,
  };

  const diff: ClarificationRevisionDiff = {
    revision,
    priorRevision: transition.previous.decisionState.clarificationRevision,
    policyVersion: CLARIFICATION_POLICY_VERSION,
    reason: input.reason,
    before: snapshots.before,
    changed: createFieldChanges(snapshots.before, snapshots.after),
    after: snapshots.after,
    affectedRequirementFields: [],
    confidence: {
      before: transition.previous.decisionState.confidence,
      after: afterDecisionState.confidence,
      delta: afterDecisionState.confidence - transition.previous.decisionState.confidence,
      exitReasonBefore: transition.previous.exitReason,
      exitReasonAfter: transition.current.exitReason,
    },
    decisionState: {
      before: cloneDecisionState(input.previous.decisionState),
      after: afterDecisionState,
    },
    supersession: {
      mode: "CURRENT_REVISION_SUPERSEDES_PREVIOUS",
      supersedesRevision: transition.previous.decisionState.clarificationRevision,
      priorProjection: "SUPERSEDED",
    },
    derivedEffects: cloneDerivedEffects(input.derivedEffects),
    unchangedScopes,
    reasonCodes: normalizeReasonCodes(afterDecisionState.reasonCodes),
    sourceQuestionIds,
  };
  diff.affectedRequirementFields = diff.changed.map((change) => change.field);

  validateClarificationRevisionDiff(diff);
  return cloneRevisionDiff(diff);
}

export function appendClarificationRevisionDiff(
  existing: ClarificationRevisionDiff[],
  next: ClarificationRevisionDiff,
): ClarificationRevisionDiff[] {
  existing.forEach((diff, index) => {
    validateClarificationRevisionDiff(diff);
    if (diff.revision !== index + 1) {
      throw new RangeError("revision diffs must be append-only and contiguous");
    }
  });
  validateClarificationRevisionDiff(next);

  const expectedRevision = existing.length + 1;
  if (next.revision !== expectedRevision || next.priorRevision !== expectedRevision - 1) {
    throw new RangeError("appended revision diff must immediately follow history");
  }
  return [...existing.map(cloneRevisionDiff), cloneRevisionDiff(next)];
}

export function validateClarificationRevisionDiff(diff: ClarificationRevisionDiff): void {
  if (!Number.isSafeInteger(diff.revision) || diff.revision <= 0) {
    throw new RangeError("revision diff must use a positive safe integer revision");
  }
  if (diff.priorRevision !== diff.revision - 1) {
    throw new RangeError("revision diff must reference its immediate prior revision");
  }
  if (diff.policyVersion !== CLARIFICATION_POLICY_VERSION) {
    throw new TypeError("revision diff policy version is not supported");
  }
  if (diff.supersession.mode !== "CURRENT_REVISION_SUPERSEDES_PREVIOUS" || diff.supersession.supersedesRevision !== diff.priorRevision || diff.supersession.priorProjection !== "SUPERSEDED") {
    throw new TypeError("revision diff must record append-only supersession metadata");
  }

  validateClarificationDecisionProjection({ decisionState: diff.decisionState.before, exitReason: diff.confidence.exitReasonBefore });
  validateClarificationDecisionProjection({ decisionState: diff.decisionState.after, exitReason: diff.confidence.exitReasonAfter });
  if (diff.decisionState.before.clarificationRevision !== diff.priorRevision || diff.decisionState.after.clarificationRevision !== diff.revision) {
    throw new TypeError("revision diff decision states must match revision identity");
  }
  if (diff.decisionState.after.previousClarificationRevision !== diff.priorRevision || diff.decisionState.after.supersededByClarificationRevision !== null || diff.decisionState.after.revisionDiff !== diff.revision) {
    throw new TypeError("current decision state must link to this revision diff without supersession");
  }
  if (diff.decisionState.before.status === "SUPERSEDED") {
    throw new TypeError("revision diff must preserve the original prior decision state");
  }
  if (!Number.isFinite(diff.confidence.delta) || diff.confidence.delta !== diff.confidence.after - diff.confidence.before) {
    throw new TypeError("revision diff confidence delta is invalid");
  }

  const snapshots = alignFieldValueSnapshots(normalizeFieldValues(diff.before), normalizeFieldValues(diff.after));
  if (!sameFieldValues(diff.before, snapshots.before) || !sameFieldValues(diff.after, snapshots.after)) {
    throw new TypeError("revision diff snapshots must be canonical and include absence markers");
  }
  const expectedChanges = createFieldChanges(diff.before, diff.after);
  if (!sameFieldChanges(diff.changed, expectedChanges) || !sameStringList(diff.affectedRequirementFields, expectedChanges.map((change) => change.field))) {
    throw new TypeError("revision diff changed fields do not match before and after snapshots");
  }
  if (!sameStringList(diff.sourceQuestionIds, normalizeReferenceIds(diff.sourceQuestionIds, "source question IDs"))) {
    throw new TypeError("revision diff source question IDs must be canonical");
  }
  if (!sameStringList(diff.reasonCodes, normalizeReasonCodes(diff.reasonCodes))) {
    throw new TypeError("revision diff reason codes must be canonical");
  }
  if (!sameStringList(diff.unchangedScopes, CLARIFICATION_NON_CHANGE_SCOPES)) {
    throw new TypeError("revision diff must record every protected non-change scope");
  }
}

export function analyzeClarification(input: ClarificationAnalysisInput): ClarificationAnalysis {
  const answers = input.answers ?? [];
  const knownFacts = input.knownFacts ?? [];
  const assumptions = input.assumptions ?? [];
  const questions = getClarificationQuestions(input.requirement);
  const coverage = questions.map((question) => coverageForQuestion(question, answers, knownFacts, assumptions));
  const unknowns = questions
    .filter((question, index) => coverage[index]?.source === "UNRESOLVED" || coverage[index]?.source === "INVALID_ASSUMPTION")
    .map((question) => ({ field: question.field, questionId: question.id, impact: question.impact!, reason: unknownReason(question) }));
  const confidence = calculateClarificationConfidence(coverage);
  const noMaterialQuestion = questions.length === 0;
  const exitReason = projectExitReason({ unknowns, confidence, noMaterialQuestion, hasAssumptions: assumptions.length > 0 });
  const decisionState = createDecisionState({ revision: input.revision ?? 0, confidence, unknowns, assumptions, exitReason, noMaterialQuestion });

  return { policyVersion: CLARIFICATION_POLICY_VERSION, questions, unknowns, knownFacts: resolvedKnownFacts(answers, knownFacts), coverage, confidence, exitReason, decisionState };
}

export function calculateClarificationConfidence(coverage: ClarificationCoverage[]): number {
  if (coverage.length === 0) return 1;
  const totalWeight = coverage.reduce((total, item) => total + item.weight, 0);
  if (totalWeight === 0) return 1;
  return coverage.reduce((total, item) => total + item.weight * item.coverage, 0) / totalWeight;
}

export function calculateClarificationSummary(questions: ClarificationQuestion[]): ClarificationSummary {
  const total = questions.length;
  const answered = 0;
  const required = questions.filter((question) => question.required).length;
  return { completeness: total ? Math.round(((total - required) / total) * 100) : 100, buildReadiness: required === 0 ? 100 : Math.max(0, 100 - required * 20), answered, total };
}

function createQuestion(id: string, question: string, field: ClarificationQuestion["field"], required: boolean, priority: number): ClarificationQuestion {
  return { id, question, field, required, priority, impact: questionImpact[id] ?? "IMPORTANT" };
}

function coverageForQuestion(question: ClarificationQuestion, answers: ClarificationAnswer[], knownFacts: ClarificationKnownFact[], assumptions: ClarificationAssumption[]): ClarificationCoverage {
  const impact = question.impact!;
  const answer = answers.find((item) => item.questionId === question.id && item.field === question.field && item.source === "USER" && hasValue(item.value));
  if (answer) return createCoverage(question, 1, "ANSWER");

  const knownFact = knownFacts.find((item) => item.field === question.field && item.source !== "SYSTEM_ASSUMPTION" && hasValue(item.value));
  if (knownFact) return createCoverage(question, 1, "KNOWN_FACT");

  const assumption = assumptions.find((item) => item.questionId === question.id && item.field === question.field && hasValue(item.value));
  if (assumption) {
    if (impact === "CRITICAL") return createCoverage(question, 0, "INVALID_ASSUMPTION");
    return createCoverage(question, impact === "IMPORTANT" ? 0.75 : 1, "ASSUMPTION");
  }

  return createCoverage(question, 0, "UNRESOLVED");
}

function createCoverage(question: ClarificationQuestion, coverage: number, source: ClarificationCoverage["source"]): ClarificationCoverage {
  return { questionId: question.id, impact: question.impact!, weight: impactWeight[question.impact!], coverage, source };
}

function createDecisionState(input: { revision: number; confidence: number; unknowns: ClarificationUnknown[]; assumptions: ClarificationAssumption[]; exitReason: ClarificationAnalysis["exitReason"]; noMaterialQuestion: boolean }): ClarificationDecisionState {
  const criticalUnknowns = input.unknowns.filter((unknown) => unknown.impact === "CRITICAL");
  const assumptionQuestionIds = input.assumptions.map((assumption) => assumption.questionId);
  if (criticalUnknowns.length > 0) {
    return createDecisionStateRecord({ revision: input.revision, confidence: input.confidence, unresolvedQuestionIds: input.unknowns.map((unknown) => unknown.questionId), assumptionQuestionIds, status: "NOT_READY", nextDecision: "ANSWER_CRITICAL_QUESTION", reasonCodes: criticalUnknowns.map((unknown) => unknownReasonCode(unknown)) });
  }
  if (input.unknowns.length > 0) {
    return createDecisionStateRecord({ revision: input.revision, confidence: input.confidence, unresolvedQuestionIds: input.unknowns.map((unknown) => unknown.questionId), assumptionQuestionIds, status: "NOT_READY", nextDecision: "ANSWER_QUESTION", reasonCodes: input.unknowns.map((unknown) => unknownReasonCode(unknown)) });
  }
  if (assumptionQuestionIds.length > 0 && input.exitReason === "USER_PROCEED_WITH_ASSUMPTIONS") {
    return createDecisionStateRecord({ revision: input.revision, confidence: input.confidence, unresolvedQuestionIds: [], assumptionQuestionIds, status: "READY_WITH_ASSUMPTIONS", nextDecision: "REVIEW_ASSUMPTIONS", reasonCodes: ["ASSUMPTIONS_REQUIRE_REVIEW"] });
  }
  if (assumptionQuestionIds.length > 0) {
    return createDecisionStateRecord({ revision: input.revision, confidence: input.confidence, unresolvedQuestionIds: [], assumptionQuestionIds, status: "NOT_READY", nextDecision: "ANALYZE_REQUIREMENTS", reasonCodes: ["CONFIDENCE_BELOW_THRESHOLD"] });
  }
  if (input.noMaterialQuestion || input.exitReason === "NO_MATERIAL_QUESTION" || input.exitReason === "SUFFICIENT_INFORMATION") {
    return createDecisionStateRecord({ revision: input.revision, confidence: input.confidence, unresolvedQuestionIds: [], assumptionQuestionIds, status: "READY_FOR_REVIEW", nextDecision: "REVIEW_BLUEPRINT", reasonCodes: [input.exitReason ?? "SUFFICIENT_INFORMATION"] });
  }
  return createDecisionStateRecord({ revision: input.revision, confidence: input.confidence, unresolvedQuestionIds: [], assumptionQuestionIds, status: "NOT_READY", nextDecision: "ANALYZE_REQUIREMENTS", reasonCodes: [] });
}

function createBatch(input: ClarificationQuestionBatch): ClarificationQuestionBatch {
  return input;
}

function createBatchDecisionState(input: { revision: number; confidence: number; assumptionQuestionIds: string[]; unresolvedQuestionIds: string[]; status: ClarificationDecisionState["status"]; nextDecision: ClarificationNextDecision; reasonCodes: string[] }): ClarificationDecisionState {
  return createDecisionStateRecord({
    revision: input.revision,
    confidence: input.confidence,
    unresolvedQuestionIds: input.unresolvedQuestionIds,
    assumptionQuestionIds: input.assumptionQuestionIds,
    status: input.status,
    nextDecision: input.nextDecision,
    reasonCodes: input.reasonCodes,
  });
}

function createDecisionStateRecord(input: {
  revision: number;
  confidence: number;
  unresolvedQuestionIds: string[];
  assumptionQuestionIds: string[];
  status: ClarificationDecisionState["status"];
  nextDecision: ClarificationNextDecision;
  reasonCodes: string[];
}): ClarificationDecisionState {
  return {
    scope: "REQUIREMENT_READINESS",
    status: input.status,
    clarificationRevision: input.revision,
    previousClarificationRevision: null,
    supersededByClarificationRevision: null,
    confidencePolicyVersion: CLARIFICATION_POLICY_VERSION,
    confidence: input.confidence,
    unresolvedQuestionIds: [...input.unresolvedQuestionIds],
    assumptionQuestionIds: [...input.assumptionQuestionIds],
    revisionDiff: null,
    nextDecision: input.nextDecision,
    reasonCodes: [...input.reasonCodes],
  };
}

function projectExitReason(input: { unknowns: ClarificationUnknown[]; confidence: number; noMaterialQuestion: boolean; hasAssumptions: boolean }): ClarificationAnalysis["exitReason"] {
  if (input.noMaterialQuestion) return "NO_MATERIAL_QUESTION";
  if (input.unknowns.some((unknown) => unknown.impact === "CRITICAL")) return "BLOCKED_CRITICAL_UNKNOWN";
  if (input.hasAssumptions && input.confidence >= 0.8) return "USER_PROCEED_WITH_ASSUMPTIONS";
  if (input.unknowns.length === 0 && input.confidence >= 0.8) return "SUFFICIENT_INFORMATION";
  return null;
}

function resolvedKnownFacts(answers: ClarificationAnswer[], knownFacts: ClarificationKnownFact[]): ClarificationKnownFact[] {
  return [
    ...knownFacts.filter((fact) => fact.source !== "SYSTEM_ASSUMPTION" && hasValue(fact.value)),
    ...answers.filter((answer) => answer.source === "USER" && hasValue(answer.value)).map((answer) => ({ field: answer.field, value: answer.value, source: answer.source })),
  ];
}

function unknownReason(question: ClarificationQuestion): string {
  return `MISSING_${question.id.toUpperCase()}`;
}

function unknownReasonCode(unknown: ClarificationUnknown): string {
  return unknown.reason;
}

function cloneDecisionProjection(projection: ClarificationDecisionProjection): ClarificationDecisionProjection {
  return {
    exitReason: projection.exitReason,
    decisionState: cloneDecisionState(projection.decisionState),
  };
}

function cloneDecisionState(decisionState: ClarificationDecisionState): ClarificationDecisionState {
  return {
    ...decisionState,
    unresolvedQuestionIds: [...decisionState.unresolvedQuestionIds],
    assumptionQuestionIds: [...decisionState.assumptionQuestionIds],
    reasonCodes: [...decisionState.reasonCodes],
  };
}

function normalizeFieldValues(values: ClarificationFieldValue[]): ClarificationFieldValue[] {
  const fields = new Set<ClarificationFieldValue["field"]>();
  return values
    .map((value) => {
      if (fields.has(value.field)) {
        throw new TypeError("revision diff cannot contain duplicate fields");
      }
      fields.add(value.field);
      if (!value.present && value.value !== null) {
        throw new TypeError("absent revision diff values must use null");
      }
      return {
        field: value.field,
        value: cloneValue(value.value),
        present: value.present,
        source: value.source,
      };
    })
    .sort((left, right) => compareStableString(left.field, right.field));
}

function alignFieldValueSnapshots(
  before: ClarificationFieldValue[],
  after: ClarificationFieldValue[],
): { before: ClarificationFieldValue[]; after: ClarificationFieldValue[] } {
  const beforeByField = new Map(before.map((value) => [value.field, value]));
  const afterByField = new Map(after.map((value) => [value.field, value]));
  const fields = [...new Set([...beforeByField.keys(), ...afterByField.keys()])].sort(compareStableString);

  return {
    before: fields.map((field) => cloneFieldValue(beforeByField.get(field) ?? absentFieldValue(field))),
    after: fields.map((field) => cloneFieldValue(afterByField.get(field) ?? absentFieldValue(field))),
  };
}

function createFieldChanges(
  before: ClarificationFieldValue[],
  after: ClarificationFieldValue[],
): ClarificationFieldDiff[] {
  return before.flatMap((beforeValue, index) => {
    const afterValue = after[index]!;
    if (sameFieldValue(beforeValue, afterValue)) {
      return [];
    }
    return [{
      field: beforeValue.field,
      before: cloneValue(beforeValue.value),
      after: cloneValue(afterValue.value),
      source: afterValue.present ? afterValue.source : beforeValue.source,
    }];
  });
}

function normalizeNonChangeScopes(
  scopes: ClarificationNonChangeScope[] | undefined,
): ClarificationNonChangeScope[] {
  if (scopes !== undefined && !sameStringList(scopes, CLARIFICATION_NON_CHANGE_SCOPES)) {
    throw new TypeError("revision diff cannot omit or reorder protected non-change scopes");
  }
  return [...CLARIFICATION_NON_CHANGE_SCOPES];
}

function normalizeReferenceIds(referenceIds: string[], label: string): string[] {
  const normalized = [...new Set(referenceIds.map((referenceId) => referenceId.trim()))]
    .filter((referenceId) => referenceId.length > 0)
    .sort(compareStableString);
  if (normalized.length === 0) {
    throw new TypeError(`${label} must contain at least one non-empty reference`);
  }
  return normalized;
}

function normalizeReasonCodes(reasonCodes: string[]): string[] {
  const normalized = [...new Set(reasonCodes.map((reasonCode) => reasonCode.trim()))]
    .filter((reasonCode) => reasonCode.length > 0)
    .sort(compareStableString);
  if (normalized.length === 0) {
    throw new TypeError("revision diff must contain at least one reason code");
  }
  return normalized;
}

function cloneRevisionDiff(diff: ClarificationRevisionDiff): ClarificationRevisionDiff {
  return {
    ...diff,
    before: diff.before.map(cloneFieldValue),
    changed: diff.changed.map((change) => ({ ...change, before: cloneValue(change.before), after: cloneValue(change.after) })),
    after: diff.after.map(cloneFieldValue),
    affectedRequirementFields: [...diff.affectedRequirementFields],
    confidence: { ...diff.confidence },
    decisionState: {
      before: cloneDecisionState(diff.decisionState.before),
      after: cloneDecisionState(diff.decisionState.after),
    },
    supersession: { ...diff.supersession },
    derivedEffects: cloneDerivedEffects(diff.derivedEffects),
    unchangedScopes: [...diff.unchangedScopes],
    reasonCodes: [...diff.reasonCodes],
    sourceQuestionIds: [...diff.sourceQuestionIds],
  };
}

function cloneDerivedEffects(effects: ClarificationDerivedEffects): ClarificationDerivedEffects {
  return { ...effects };
}

function cloneFieldValue(value: ClarificationFieldValue): ClarificationFieldValue {
  return { ...value, value: cloneValue(value.value) };
}

function absentFieldValue(field: ClarificationFieldValue["field"]): ClarificationFieldValue {
  return { field, value: null, present: false, source: "USER_UNKNOWN" };
}

function sameFieldValues(left: ClarificationFieldValue[], right: ClarificationFieldValue[]): boolean {
  return left.length === right.length && left.every((value, index) => sameFieldValue(value, right[index]!));
}

function sameFieldValue(left: ClarificationFieldValue, right: ClarificationFieldValue): boolean {
  return left.field === right.field && left.present === right.present && left.source === right.source && sameValue(left.value, right.value);
}

function sameDecisionState(left: ClarificationDecisionState, right: ClarificationDecisionState): boolean {
  return left.scope === right.scope &&
    left.status === right.status &&
    left.clarificationRevision === right.clarificationRevision &&
    left.previousClarificationRevision === right.previousClarificationRevision &&
    left.supersededByClarificationRevision === right.supersededByClarificationRevision &&
    left.confidencePolicyVersion === right.confidencePolicyVersion &&
    left.confidence === right.confidence &&
    left.revisionDiff === right.revisionDiff &&
    left.nextDecision === right.nextDecision &&
    sameStringList(left.unresolvedQuestionIds, right.unresolvedQuestionIds) &&
    sameStringList(left.assumptionQuestionIds, right.assumptionQuestionIds) &&
    sameStringList(left.reasonCodes, right.reasonCodes);
}

function sameFieldChanges(left: ClarificationFieldDiff[], right: ClarificationFieldDiff[]): boolean {
  return left.length === right.length && left.every((change, index) => {
    const compared = right[index]!;
    return change.field === compared.field && change.source === compared.source && sameValue(change.before, compared.before) && sameValue(change.after, compared.after);
  });
}

function sameStringList(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function cloneValue(value: ClarificationValue): ClarificationValue {
  return Array.isArray(value) ? [...value] : value;
}

function sameValue(left: ClarificationValue, right: ClarificationValue): boolean {
  return Array.isArray(left) && Array.isArray(right)
    ? left.length === right.length && left.every((value, index) => value === right[index])
    : left === right;
}

function compareStableString(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function appendReasonCode(reasonCodes: string[], reasonCode: string): string[] {
  return reasonCodes.includes(reasonCode) ? [...reasonCodes] : [...reasonCodes, reasonCode];
}

function assertDecisionCombination(
  decisionState: ClarificationDecisionState,
  expectedStatus: ClarificationDecisionState["status"],
  expectedNextDecision: ClarificationNextDecision,
  exitReason: string,
): void {
  if (decisionState.status !== expectedStatus || decisionState.nextDecision !== expectedNextDecision) {
    throw new TypeError(`${exitReason} has an invalid decision state combination`);
  }
}

function assertNonEmptyReferences(references: string[], exitReason: string): void {
  if (references.length === 0) {
    throw new TypeError(`${exitReason} requires at least one reference`);
  }
}

function isKnownDecisionStatus(status: string): boolean {
  return status === "NOT_READY" || status === "READY_WITH_ASSUMPTIONS" || status === "READY_FOR_REVIEW" || status === "SUPERSEDED" || status === "READY_FOR_BUILD";
}

function isOptionalPastRevision(revision: number | null, currentRevision: number): boolean {
  return revision === null || (Number.isSafeInteger(revision) && revision >= 0 && revision < currentRevision);
}

function isLaterRevision(revision: number | null, currentRevision: number): boolean {
  return revision !== null && Number.isSafeInteger(revision) && revision > currentRevision;
}

function impactRank(impact: ClarificationImpact): number {
  return impact === "CRITICAL" ? 0 : impact === "IMPORTANT" ? 1 : 2;
}

function uniqueQuestions(questions: ClarificationQuestion[]): ClarificationQuestion[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

function hasValue(value: ClarificationValue): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some((item) => item.trim().length > 0);
  return false;
}

function validateSubmittedAnswers(
  answers: ClarificationAnswer[],
  currentBatch: ClarificationQuestion[],
): string[] {
  const expected = new Map(currentBatch.map((question) => [question.id, question]));
  const submitted = new Set<string>();
  for (const answer of answers) {
    const question = expected.get(answer.questionId);
    if (
      !question ||
      submitted.has(answer.questionId) ||
      answer.field !== question.field ||
      answer.impact !== question.impact ||
      (answer.source !== "USER" && answer.source !== "USER_UNKNOWN")
    ) {
      throw new ClarificationPersistenceError("ANSWER_BATCH_INVALID");
    }
    if ((answer.source === "USER" && !hasValue(answer.value)) || (answer.source === "USER_UNKNOWN" && answer.value !== null)) {
      throw new ClarificationPersistenceError("ANSWER_BATCH_INVALID");
    }
    submitted.add(answer.questionId);
  }
  if (submitted.size !== currentBatch.length || currentBatch.some((question) => !submitted.has(question.id))) {
    throw new ClarificationPersistenceError("ANSWER_BATCH_INVALID");
  }
  return [...submitted].sort(compareStableString);
}

function validateSubmittedAssumptions(
  assumptions: ClarificationAssumption[],
  questions: ClarificationQuestion[],
  answers: ClarificationAnswer[],
): void {
  const candidates = new Map(questions.map((question) => [question.id, question]));
  const answersByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));
  const seen = new Set<string>();
  for (const assumption of assumptions) {
    const question = candidates.get(assumption.questionId);
    if (
      !question ||
      question.impact === "CRITICAL" ||
      seen.has(assumption.questionId) ||
      assumption.field !== question.field ||
      assumption.impact !== question.impact ||
      assumption.visibility !== "USER_VISIBLE" ||
      !hasValue(assumption.value) ||
      !assumption.reason.trim() ||
      answersByQuestionId.get(assumption.questionId)?.source !== "USER_UNKNOWN"
    ) {
      throw new ClarificationPersistenceError("ANSWER_BATCH_INVALID");
    }
    seen.add(assumption.questionId);
  }
}

function clarificationFieldValues(
  questions: ClarificationQuestion[],
  answers: ClarificationAnswer[],
  assumptions: ClarificationAssumption[],
): ClarificationFieldValue[] {
  const answerByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));
  const assumptionByQuestionId = new Map(assumptions.map((assumption) => [assumption.questionId, assumption]));
  return questions.map((question) => {
    const answer = answerByQuestionId.get(question.id);
    if (answer?.source === "USER" && hasValue(answer.value)) {
      return { field: question.field, value: cloneValue(answer.value), present: true, source: "USER" as const };
    }
    const assumption = assumptionByQuestionId.get(question.id);
    if (assumption) {
      return { field: question.field, value: cloneValue(assumption.value), present: true, source: "SYSTEM_ASSUMPTION" as const };
    }
    return absentFieldValue(question.field);
  });
}

function hasMaterialFieldChange(before: ClarificationFieldValue[], after: ClarificationFieldValue[]): boolean {
  const beforeByField = new Map(before.map((value) => [value.field, value]));
  return after.some((value) => !sameFieldValue(beforeByField.get(value.field) ?? absentFieldValue(value.field), value));
}

function interactionStatus(exitReason: ClarificationExitReason | null): ClarificationState["status"] {
  if (exitReason === "BLOCKED_CRITICAL_UNKNOWN" || exitReason === "QUESTION_CYCLE_LIMIT") return "BLOCKED";
  if (exitReason === "USER_PROCEED_WITH_ASSUMPTIONS") return "DEFERRED_WITH_ASSUMPTIONS";
  if (exitReason === "SUFFICIENT_INFORMATION" || exitReason === "NO_MATERIAL_QUESTION") return "READY_FOR_REVIEW";
  return "ASKING";
}

function questionIdForField(questions: ClarificationQuestion[], field: ClarificationKnownFact["field"]): string | undefined {
  return questions.find((question) => question.field === field)?.id;
}

function isString(value: string | undefined): value is string {
  return typeof value === "string";
}

function containsSecretLikeInput(value: unknown): boolean {
  if (typeof value === "string") {
    return [
      /sk-[A-Za-z0-9_-]{20,}/,
      /ghp_[A-Za-z0-9_]{20,}/,
      /github_pat_[A-Za-z0-9_]{20,}/,
      /xox[baprs]-[A-Za-z0-9-]{10,}/,
      /AKIA[0-9A-Z]{16}/,
      /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /(?:postgres|postgresql|mysql|mongodb):\/\/[^/\s:@]+:[^@\s]+@/i,
    ].some((pattern) => pattern.test(value));
  }
  if (Array.isArray(value)) return value.some(containsSecretLikeInput);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, nested]) => /(?:secret|token|password|api.?key|credential|private.?key)/i.test(key) || containsSecretLikeInput(nested));
}

function cloneClarificationState(state: ClarificationState): ClarificationState {
  return {
    ...state,
    askedQuestionIds: [...state.askedQuestionIds],
    answers: state.answers.map(cloneAnswer),
    knownFacts: state.knownFacts.map(cloneKnownFact),
    unknowns: state.unknowns.map((unknown) => ({ ...unknown })),
    assumptions: state.assumptions.map(cloneAssumption),
    deferredQuestionIds: [...state.deferredQuestionIds],
    decisionState: cloneDecisionState(state.decisionState),
    revisionDiffs: state.revisionDiffs.map(cloneRevisionDiff),
  };
}

function cloneAnswer(answer: ClarificationAnswer): ClarificationAnswer {
  return { ...answer, value: cloneValue(answer.value) };
}

function cloneKnownFact(fact: ClarificationKnownFact): ClarificationKnownFact {
  return { ...fact, value: cloneValue(fact.value) };
}

function cloneAssumption(assumption: ClarificationAssumption): ClarificationAssumption {
  return { ...assumption, value: cloneValue(assumption.value) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
