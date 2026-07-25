import { describe, expect, it } from "vitest";
import {
  analyzeClarification,
  CLARIFICATION_POLICY_VERSION,
  CLARIFICATION_NON_CHANGE_SCOPES,
  appendClarificationRevisionDiff,
  classifyClarificationPreparationError,
  createClarificationRevisionDiff,
  createInitialClarificationState,
  ClarificationPersistenceError,
  getClarificationQuestions,
  MAX_CLARIFICATION_CYCLES,
  MAX_QUESTIONS_PER_BATCH,
  projectClarificationQuestionBatch,
  projectClarificationRevisionTransition,
  prepareClarificationAnswerBatch,
  rankClarificationQuestions,
  readCompatibleClarificationState,
  validateClarificationDecisionProjection,
  validateClarificationRevisionDiff,
} from "./clarification";
import { parseGoal } from "./goal-parser";
import type {
  ClarificationAnalysisInput,
  ClarificationAnswer,
  ClarificationAssumption,
  ClarificationDecisionProjection,
  ClarificationRevisionDiff,
  Requirement,
} from "./types";

function supportRequirement(): Requirement {
  return parseGoal("쇼핑몰 고객센터 자동화를 만들고 싶어요");
}

function allDirectAnswers(requirement: Requirement): ClarificationAnalysisInput {
  const questions = getClarificationQuestions(requirement);
  return {
    requirement,
    revision: 3,
    answers: questions.map((question) => ({ questionId: question.id, field: question.field, value: `${question.id}-answer`, source: "USER" as const, impact: question.impact! })),
  };
}

function directReadyProjection(revision: number): ClarificationDecisionProjection {
  const analysis = analyzeClarification({ ...allDirectAnswers(supportRequirement()), revision });
  return { decisionState: analysis.decisionState, exitReason: analysis.exitReason };
}

function blockedProjection(revision: number): ClarificationDecisionProjection {
  const analysis = analyzeClarification({ requirement: supportRequirement(), revision });
  return { decisionState: analysis.decisionState, exitReason: analysis.exitReason };
}

function createRevisionDiffFixture(): ClarificationRevisionDiff {
  return createClarificationRevisionDiff({
    previous: blockedProjection(0),
    next: directReadyProjection(1),
    before: [
      { field: "platform", value: null, present: false, source: "USER_UNKNOWN" },
      { field: "currentTools", value: ["Notion"], present: true, source: "USER" },
    ],
    after: [
      { field: "platform", value: "Cafe24", present: true, source: "USER" },
      { field: "currentTools", value: ["Notion", "Slack"], present: true, source: "USER" },
    ],
    reason: "ANSWER_BATCH",
    sourceQuestionIds: ["platform", "current_tools"],
    derivedEffects: {
      blueprintCandidates: "REGENERATED",
      buildPlan: "REGENERATED",
    },
  });
}

function nonCriticalImpact(impact: "CRITICAL" | "IMPORTANT" | "OPTIONAL" | undefined): "IMPORTANT" | "OPTIONAL" {
  return impact === "OPTIONAL" ? "OPTIONAL" : "IMPORTANT";
}

function answerCurrentBatch(requirement: Requirement, completedCycles = 0): ClarificationAnswer[] {
  const batch = projectClarificationQuestionBatch({
    questions: getClarificationQuestions(requirement),
    completedCycles,
  });
  if (batch.status !== "ASKING") throw new Error("fixture expected a question batch");
  return batch.questions.map((question) => ({
    questionId: question.id,
    field: question.field,
    value: `${question.id}-answer`,
    source: "USER" as const,
    impact: question.impact!,
  }));
}

describe("clarification snapshot model", () => {
  it("creates the versioned initial Requirement Readiness state", () => {
    const state = createInitialClarificationState();

    expect(state).toMatchObject({
      revision: 0,
      policyVersion: CLARIFICATION_POLICY_VERSION,
      status: "ANALYZING",
      exitReason: null,
      confidence: 0,
      batchCount: 0,
      decisionState: {
        scope: "REQUIREMENT_READINESS",
        status: "NOT_READY",
        confidencePolicyVersion: CLARIFICATION_POLICY_VERSION,
        revisionDiff: null,
      },
    });
    expect(state.answers).toEqual([]);
    expect(state.unknowns).toEqual([]);
    expect(state.revisionDiffs).toEqual([]);
  });

  it("creates isolated collections for each initial state", () => {
    const first = createInitialClarificationState();
    const second = createInitialClarificationState();

    first.askedQuestionIds.push("platform");
    first.decisionState.reasonCodes.push("MISSING_PLATFORM");

    expect(second.askedQuestionIds).toEqual([]);
    expect(second.decisionState.reasonCodes).toEqual([]);
  });
});

describe("clarification persistence projection", () => {
  it("keeps validation failures distinct from projection exceptions", () => {
    expect(classifyClarificationPreparationError(new ClarificationPersistenceError("ANSWER_BATCH_INVALID")))
      .toBe("ANSWER_BATCH_INVALID");
    expect(classifyClarificationPreparationError(new TypeError("invalid decision transition")))
      .toBe("PROJECTION_FAILED");
  });

  it("treats a missing clarification object as the compatible legacy snapshot shape", () => {
    expect(readCompatibleClarificationState(undefined)).toEqual(createInitialClarificationState());
  });

  it("rejects an unknown stored policy version instead of guessing its meaning", () => {
    expect(() => readCompatibleClarificationState({
      ...createInitialClarificationState(),
      policyVersion: "clarification-confidence-v0",
    })).toThrow(ClarificationPersistenceError);
  });

  it("prepares one append-only answer revision without mutating the prior state", () => {
    const requirement = supportRequirement();
    const initial = createInitialClarificationState();
    const initialBefore = structuredClone(initial);
    const projection = prepareClarificationAnswerBatch(requirement, initial, {
      expectedRevision: 0,
      answers: answerCurrentBatch(requirement),
    });

    expect(initial).toEqual(initialBefore);
    expect(projection.clarification).toMatchObject({
      revision: 1,
      policyVersion: CLARIFICATION_POLICY_VERSION,
      batchCount: 1,
    });
    expect(projection.clarification.revisionDiffs.map((diff) => diff.revision)).toEqual([1]);
    expect(projection.diff.priorRevision).toBe(0);
    expect(projection.diff.sourceQuestionIds).toEqual(answerCurrentBatch(requirement).map((answer) => answer.questionId).sort());
  });

  it("rejects stale revision writes before producing a persistence projection", () => {
    const requirement = supportRequirement();

    expect(() => prepareClarificationAnswerBatch(requirement, createInitialClarificationState(), {
      expectedRevision: 1,
      answers: answerCurrentBatch(requirement),
    })).toThrow("STALE_REVISION");
  });

  it("rejects secret-shaped answer input before it can enter the JSON boundary", () => {
    const requirement = supportRequirement();
    const answers = answerCurrentBatch(requirement);
    answers[0] = { ...answers[0]!, value: "sk-" + "123456789012345678901234567890" };

    expect(() => prepareClarificationAnswerBatch(requirement, createInitialClarificationState(), {
      expectedRevision: 0,
      answers,
    })).toThrow("SECRET_SHAPED_INPUT");
  });

  it("requires the complete current batch and rejects duplicate or out-of-batch answers", () => {
    const requirement = supportRequirement();
    const answers = answerCurrentBatch(requirement);

    expect(() => prepareClarificationAnswerBatch(requirement, createInitialClarificationState(), {
      expectedRevision: 0,
      answers: answers.slice(0, 1),
    })).toThrow("ANSWER_BATCH_INVALID");
    expect(() => prepareClarificationAnswerBatch(requirement, createInitialClarificationState(), {
      expectedRevision: 0,
      answers: [...answers, { ...answers[0]! }],
    })).toThrow("ANSWER_BATCH_INVALID");
  });

  it("does not let a User Unknown response resolve a Critical question", () => {
    const requirement = supportRequirement();
    const answers = answerCurrentBatch(requirement).map((answer) =>
      answer.questionId === "platform"
        ? { ...answer, source: "USER_UNKNOWN" as const, value: null }
        : answer,
    );
    const first = prepareClarificationAnswerBatch(requirement, createInitialClarificationState(), {
      expectedRevision: 0,
      answers,
    });
    const next = projectClarificationQuestionBatch({
      questions: getClarificationQuestions(requirement),
      completedCycles: first.clarification.batchCount,
      answeredQuestionIds: first.clarification.answers
        .filter((answer) => answer.source === "USER" && answer.value !== null)
        .map((answer) => answer.questionId),
    });

    expect(first.clarification.decisionState).toMatchObject({
      status: "NOT_READY",
      nextDecision: "ANSWER_CRITICAL_QUESTION",
    });
    expect(next.questions.map((question) => question.id)).toContain("platform");
  });

  it("persists a reviewed non-Critical assumption only beside a User Unknown answer", () => {
    const requirement = supportRequirement();
    const answers = answerCurrentBatch(requirement).map((answer) =>
      answer.questionId === "automation"
        ? { ...answer, source: "USER_UNKNOWN" as const, value: null }
        : answer,
    );
    const persisted = prepareClarificationAnswerBatch(requirement, createInitialClarificationState(), {
      expectedRevision: 0,
      answers,
      assumptions: [{
        questionId: "automation",
        field: "automationLevel",
        value: "partial",
        reason: "사용자 검토 가정",
        visibility: "USER_VISIBLE",
        impact: "IMPORTANT",
      }],
    });

    expect(persisted.clarification.assumptions).toHaveLength(1);
    const next = projectClarificationQuestionBatch({
      questions: getClarificationQuestions(requirement),
      completedCycles: persisted.clarification.batchCount,
      answeredQuestionIds: persisted.clarification.answers
        .filter((answer) => answer.source === "USER" && answer.value !== null)
        .map((answer) => answer.questionId),
      resolvedQuestionIds: persisted.clarification.assumptions.map((assumption) => assumption.questionId),
    });
    expect(next.questions.map((question) => question.id)).not.toContain("automation");
  });

  it("continues only with the immediate next persisted revision", () => {
    const requirement = supportRequirement();
    const first = prepareClarificationAnswerBatch(requirement, createInitialClarificationState(), {
      expectedRevision: 0,
      answers: answerCurrentBatch(requirement),
    });
    const firstBefore = structuredClone(first.clarification);
    const nextBatch = projectClarificationQuestionBatch({
      questions: getClarificationQuestions(requirement),
      completedCycles: first.clarification.batchCount,
      answeredQuestionIds: first.clarification.answers.map((answer) => answer.questionId),
    });
    const nextAnswers = nextBatch.questions.map((question) => ({
      questionId: question.id,
      field: question.field,
      value: `${question.id}-answer`,
      source: "USER" as const,
      impact: question.impact!,
    }));
    const second = prepareClarificationAnswerBatch(requirement, first.clarification, {
      expectedRevision: 1,
      answers: nextAnswers,
    });

    expect(first.clarification).toEqual(firstBefore);
    expect(second.clarification.revisionDiffs.map((diff) => diff.revision)).toEqual([1, 2]);
    expect(second.diff.priorRevision).toBe(1);
  });

  it("accepts an Optional follow-up batch after an initial non-Critical assumption batch", () => {
    const requirement = parseGoal("AI 콘텐츠 생성 시스템을 만들고 싶어요");
    const initialBatch = projectClarificationQuestionBatch({
      questions: getClarificationQuestions(requirement),
      completedCycles: 0,
    });
    if (initialBatch.status !== "ASKING") throw new Error("fixture expected an initial question batch");

    const first = prepareClarificationAnswerBatch(requirement, createInitialClarificationState(), {
      expectedRevision: 0,
      answers: initialBatch.questions.map((question) => ({
        questionId: question.id,
        field: question.field,
        value: null,
        source: "USER_UNKNOWN" as const,
        impact: question.impact!,
      })),
      assumptions: initialBatch.questions.map((question) => ({
        questionId: question.id,
        field: question.field,
        value: `${question.id}-assumption`,
        reason: "사용자 검토 가정",
        visibility: "USER_VISIBLE" as const,
        impact: nonCriticalImpact(question.impact),
      })),
    });
    const followUpBatch = projectClarificationQuestionBatch({
      questions: getClarificationQuestions(requirement),
      completedCycles: first.clarification.batchCount,
      revision: first.clarification.revision,
      confidence: first.clarification.confidence,
      answeredQuestionIds: first.clarification.answers
        .filter((answer) => answer.source === "USER" && answer.value !== null)
        .map((answer) => answer.questionId),
      resolvedQuestionIds: first.clarification.assumptions.map((assumption) => assumption.questionId),
    });
    expect(followUpBatch).toMatchObject({ status: "ASKING", questions: [{ id: "current_tools", impact: "OPTIONAL" }] });

    const second = prepareClarificationAnswerBatch(requirement, first.clarification, {
      expectedRevision: 1,
      answers: [{
        questionId: "current_tools",
        field: "currentTools",
        value: null,
        source: "USER_UNKNOWN",
        impact: "OPTIONAL",
      }],
      assumptions: [{
        questionId: "current_tools",
        field: "currentTools",
        value: "도구 없음",
        reason: "사용자 검토 가정",
        visibility: "USER_VISIBLE",
        impact: "OPTIONAL",
      }],
    });

    expect(second.clarification.revision).toBe(2);
    expect(second.clarification.revisionDiffs.map((diff) => diff.revision)).toEqual([1, 2]);
    expect(second.clarification.confidence).toBeLessThan(0.8);
    expect(second.clarification).toMatchObject({
      exitReason: null,
      decisionState: {
        status: "NOT_READY",
        nextDecision: "ANALYZE_REQUIREMENTS",
        reasonCodes: ["CONFIDENCE_BELOW_THRESHOLD"],
      },
    });
  });
});

describe("clarification policy layer", () => {
  it("ranks Critical, Important, and Optional questions deterministically", () => {
    const questions = rankClarificationQuestions([
      { id: "current_tools", question: "tools", field: "currentTools", required: false, priority: 1, impact: "OPTIONAL" },
      { id: "budget", question: "budget", field: "budget", required: true, priority: 9, impact: "IMPORTANT" },
      { id: "platform", question: "platform", field: "platform", required: true, priority: 9, impact: "CRITICAL" },
      { id: "automation", question: "automation", field: "automationLevel", required: true, priority: 1, impact: "IMPORTANT" },
    ]);

    expect(questions.map((question) => question.id)).toEqual(["platform", "automation", "budget", "current_tools"]);
  });

  it("blocks Decision Readiness while a Critical unknown remains", () => {
    const analysis = analyzeClarification({ requirement: supportRequirement() });

    expect(analysis.unknowns.some((unknown) => unknown.questionId === "platform" && unknown.impact === "CRITICAL")).toBe(true);
    expect(analysis.exitReason).toBe("BLOCKED_CRITICAL_UNKNOWN");
    expect(analysis.decisionState).toMatchObject({ status: "NOT_READY", nextDecision: "ANSWER_CRITICAL_QUESTION" });
  });

  it("does not let a Critical assumption satisfy confidence or readiness", () => {
    const requirement = supportRequirement();
    const questions = getClarificationQuestions(requirement);
    const assumptions: ClarificationAssumption[] = questions.map((question) => ({ questionId: question.id, field: question.field, value: "assumed", reason: "test", visibility: "USER_VISIBLE", impact: nonCriticalImpact(question.impact) }));
    const analysis = analyzeClarification({ requirement, assumptions });

    expect(analysis.coverage.find((coverage) => coverage.questionId === "platform")).toMatchObject({ coverage: 0, source: "INVALID_ASSUMPTION" });
    expect(analysis.decisionState.status).toBe("NOT_READY");
  });

  it("projects Ready With Assumptions without producing Build readiness", () => {
    const requirement = supportRequirement();
    const questions = getClarificationQuestions(requirement);
    const platform = questions.find((question) => question.id === "platform")!;
    const assumptions: ClarificationAssumption[] = questions
      .filter((question) => question.id !== "platform")
      .map((question) => ({ questionId: question.id, field: question.field, value: "assumed", reason: "test", visibility: "USER_VISIBLE", impact: nonCriticalImpact(question.impact) }));
    const analysis = analyzeClarification({ requirement, answers: [{ questionId: platform.id, field: platform.field, value: "Cafe24", source: "USER", impact: "CRITICAL" }], assumptions });

    expect(analysis.confidence).toBeGreaterThanOrEqual(0.8);
    expect(analysis.decisionState).toMatchObject({ scope: "REQUIREMENT_READINESS", status: "READY_WITH_ASSUMPTIONS", nextDecision: "REVIEW_ASSUMPTIONS" });
    expect(analysis.decisionState.status).not.toBe("READY_FOR_BUILD");
  });

  it("does not let an assumption hide another unresolved Important question", () => {
    const requirement = supportRequirement();
    const questions = getClarificationQuestions(requirement);
    const platform = questions.find((question) => question.id === "platform")!;
    const automation = questions.find((question) => question.id === "automation")!;
    const analysis = analyzeClarification({
      requirement,
      answers: [{ questionId: platform.id, field: platform.field, value: "Cafe24", source: "USER", impact: "CRITICAL" }],
      assumptions: [{ questionId: automation.id, field: automation.field, value: "high", reason: "test", visibility: "USER_VISIBLE", impact: "IMPORTANT" }],
    });

    expect(analysis.unknowns.some((unknown) => unknown.questionId === "primary_user" && unknown.impact === "IMPORTANT")).toBe(true);
    expect(analysis.decisionState).toMatchObject({ status: "NOT_READY", nextDecision: "ANSWER_QUESTION" });
  });

  it("projects Ready For Review only after all applicable questions have direct answers", () => {
    const requirement = supportRequirement();
    const analysis = analyzeClarification(allDirectAnswers(requirement));

    expect(analysis.policyVersion).toBe(CLARIFICATION_POLICY_VERSION);
    expect(analysis.confidence).toBe(1);
    expect(analysis.exitReason).toBe("SUFFICIENT_INFORMATION");
    expect(analysis.decisionState).toMatchObject({ status: "READY_FOR_REVIEW", nextDecision: "REVIEW_BLUEPRINT", clarificationRevision: 3 });
  });

  it("uses no-material-question readiness when the requirement has no applicable unknowns", () => {
    const requirement: Requirement = { ...supportRequirement(), primaryUser: "operator", automationLevel: "high", budget: "low", currentTools: ["Notion"], goalType: "productivity" };
    const analysis = analyzeClarification({ requirement });

    expect(analysis.questions).toEqual([]);
    expect(analysis.confidence).toBe(1);
    expect(analysis.exitReason).toBe("NO_MATERIAL_QUESTION");
    expect(analysis.decisionState.status).toBe("READY_FOR_REVIEW");
  });

  it("treats whitespace-only answers as unresolved", () => {
    const requirement = supportRequirement();
    const platform = getClarificationQuestions(requirement).find((question) => question.id === "platform")!;
    const analysis = analyzeClarification({ requirement, answers: [{ questionId: platform.id, field: platform.field, value: "   ", source: "USER", impact: "CRITICAL" }] });

    expect(analysis.unknowns.some((unknown) => unknown.questionId === "platform")).toBe(true);
    expect(analysis.decisionState.status).toBe("NOT_READY");
  });
});

describe("clarification question batch policy", () => {
  const batchQuestions = [
    { id: "current_tools", question: "tools", field: "currentTools" as const, required: false, priority: 4, impact: "OPTIONAL" as const },
    { id: "budget", question: "budget", field: "budget" as const, required: true, priority: 2, impact: "IMPORTANT" as const },
    { id: "platform", question: "platform", field: "platform" as const, required: true, priority: 1, impact: "CRITICAL" as const },
    { id: "automation", question: "automation", field: "automationLevel" as const, required: true, priority: 1, impact: "IMPORTANT" as const },
    { id: "primary_user", question: "user", field: "primaryUser" as const, required: true, priority: 2, impact: "IMPORTANT" as const },
    { id: "user_volume", question: "volume", field: "user_volume" as const, required: false, priority: 3, impact: "OPTIONAL" as const },
  ];

  it("returns at most three deterministically ranked questions", () => {
    const batch = projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: 0, revision: 2, confidence: 0.3 });

    expect(batch.status).toBe("ASKING");
    expect(batch.cycle).toBe(1);
    expect(batch.questions).toHaveLength(MAX_QUESTIONS_PER_BATCH);
    expect(batch.questions.map((question) => question.id)).toEqual(["platform", "automation", "budget"]);
    expect(batch.decisionState).toMatchObject({ status: "NOT_READY", nextDecision: "ANSWER_QUESTION", clarificationRevision: 2 });
  });

  it("produces the same batch regardless of input question order", () => {
    const forward = projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: 1 });
    const reverse = projectClarificationQuestionBatch({ questions: [...batchQuestions].reverse(), completedCycles: 1 });

    expect(forward).toEqual(reverse);
  });

  it("excludes answered and resolved questions and de-duplicates repeated candidates", () => {
    const batch = projectClarificationQuestionBatch({ questions: [...batchQuestions, batchQuestions[2]!], completedCycles: 0, answeredQuestionIds: ["platform"], resolvedQuestionIds: ["automation"] });

    expect(batch.questions.map((question) => question.id)).toEqual(["budget", "primary_user", "user_volume"]);
    expect(new Set(batch.questions.map((question) => question.id)).size).toBe(batch.questions.length);
  });

  it("does not issue a duplicate batch while an earlier question is pending", () => {
    const batch = projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: 1, askedQuestionIds: ["platform"] });

    expect(batch).toMatchObject({ status: "AWAITING_CURRENT_ANSWERS", questions: [], exitReason: null, decisionState: { status: "NOT_READY", nextDecision: "ANSWER_PENDING_QUESTION", unresolvedQuestionIds: ["platform"] } });
  });

  it("allows the fifth cycle but blocks a sixth batch with QUESTION_CYCLE_LIMIT", () => {
    const fifth = projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: MAX_CLARIFICATION_CYCLES - 1 });
    const limited = projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: MAX_CLARIFICATION_CYCLES });

    expect(fifth).toMatchObject({ status: "ASKING", cycle: MAX_CLARIFICATION_CYCLES });
    expect(limited).toMatchObject({ status: "CYCLE_LIMIT_REACHED", questions: [], exitReason: "QUESTION_CYCLE_LIMIT", decisionState: { status: "NOT_READY", nextDecision: "REVIEW_REMAINING_QUESTIONS", reasonCodes: ["QUESTION_CYCLE_LIMIT"] } });
  });

  it("projects Sufficient Information when applicable questions are all resolved", () => {
    const batch = projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: 0, resolvedQuestionIds: batchQuestions.map((question) => question.id) });

    expect(batch).toMatchObject({ status: "NO_MATERIAL_QUESTION", questions: [], exitReason: "SUFFICIENT_INFORMATION", decisionState: { status: "READY_FOR_REVIEW", nextDecision: "REVIEW_BLUEPRINT" } });
  });

  it("keeps No Material Question distinct when no question applies", () => {
    const batch = projectClarificationQuestionBatch({ questions: [], completedCycles: 0 });

    expect(batch).toMatchObject({
      status: "NO_MATERIAL_QUESTION",
      questions: [],
      exitReason: "NO_MATERIAL_QUESTION",
      decisionState: { status: "READY_FOR_REVIEW", nextDecision: "REVIEW_BLUEPRINT" },
    });
  });

  it("rejects non-deterministic cycle inputs", () => {
    expect(() => projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: -1 })).toThrow("completedCycles must be a non-negative safe integer");
    expect(() => projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: 1.5 })).toThrow("completedCycles must be a non-negative safe integer");
    expect(() => projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: Number.NaN })).toThrow("completedCycles must be a non-negative safe integer");
    expect(() => projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: Number.POSITIVE_INFINITY })).toThrow("completedCycles must be a non-negative safe integer");
    expect(() => projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: "1" as unknown as number })).toThrow("completedCycles must be a non-negative safe integer");
    expect(() => projectClarificationQuestionBatch({ questions: batchQuestions, completedCycles: Number.MAX_SAFE_INTEGER + 1 })).toThrow("completedCycles must be a non-negative safe integer");
  });
});

describe("clarification decision state revision transitions", () => {
  it("supersedes the previous revision and links a new current revision without mutating either input", () => {
    const previous = directReadyProjection(0);
    const next = blockedProjection(1);
    const previousBefore = structuredClone(previous);
    const nextBefore = structuredClone(next);

    const transition = projectClarificationRevisionTransition({ previous, next });

    expect(previous).toEqual(previousBefore);
    expect(next).toEqual(nextBefore);
    expect(transition.previous).toMatchObject({
      exitReason: "SUFFICIENT_INFORMATION",
      decisionState: {
        status: "SUPERSEDED",
        clarificationRevision: 0,
        supersededByClarificationRevision: 1,
        nextDecision: "REVIEW_CURRENT_REVISION",
      },
    });
    expect(transition.current).toMatchObject({
      exitReason: "BLOCKED_CRITICAL_UNKNOWN",
      decisionState: {
        status: "NOT_READY",
        clarificationRevision: 1,
        previousClarificationRevision: 0,
        supersededByClarificationRevision: null,
      },
    });
  });

  it("requires a direct, fresh revision successor", () => {
    const previous = directReadyProjection(2);
    const skipped = blockedProjection(4);
    const linked = blockedProjection(3);
    linked.decisionState.previousClarificationRevision = 2;

    expect(() => projectClarificationRevisionTransition({ previous, next: skipped })).toThrow("new revision must immediately follow the previous revision");
    expect(() => projectClarificationRevisionTransition({ previous, next: linked })).toThrow("new revision must not contain an existing revision link");
  });

  it("accepts only valid exit reason and Decision State combinations", () => {
    const cycleLimited = projectClarificationQuestionBatch({
      questions: getClarificationQuestions(supportRequirement()),
      completedCycles: MAX_CLARIFICATION_CYCLES,
    });
    const validCycleLimit: ClarificationDecisionProjection = {
      decisionState: cycleLimited.decisionState,
      exitReason: cycleLimited.exitReason,
    };
    const invalidCycleLimit: ClarificationDecisionProjection = {
      exitReason: "QUESTION_CYCLE_LIMIT",
      decisionState: {
        ...cycleLimited.decisionState,
        status: "READY_FOR_REVIEW",
        nextDecision: "REVIEW_BLUEPRINT",
      },
    };

    expect(() => validateClarificationDecisionProjection(validCycleLimit)).not.toThrow();
    expect(() => validateClarificationDecisionProjection(invalidCycleLimit)).toThrow("QUESTION_CYCLE_LIMIT has an invalid decision state combination");
  });

  it("does not allow Requirement Readiness to create READY_FOR_BUILD", () => {
    const invalid: ClarificationDecisionProjection = {
      ...directReadyProjection(0),
      decisionState: {
        ...directReadyProjection(0).decisionState,
        status: "READY_FOR_BUILD" as never,
      },
    };

    expect(() => validateClarificationDecisionProjection(invalid)).toThrow("REQUIREMENT_READINESS cannot create READY_FOR_BUILD");
  });

  it("rejects non-finite, fractional, or negative revision values", () => {
    for (const revision of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const invalid: ClarificationDecisionProjection = {
        ...directReadyProjection(0),
        decisionState: {
          ...directReadyProjection(0).decisionState,
          clarificationRevision: revision,
        },
      };

      expect(() => validateClarificationDecisionProjection(invalid)).toThrow("clarification revision must be a non-negative safe integer");
    }
  });
});

describe("clarification snapshot diff projection", () => {
  it("creates a structured Before, Changed, After diff with confidence, decision, and supersession metadata", () => {
    const diff = createRevisionDiffFixture();

    expect(diff).toMatchObject({
      revision: 1,
      priorRevision: 0,
      policyVersion: CLARIFICATION_POLICY_VERSION,
      reason: "ANSWER_BATCH",
      affectedRequirementFields: ["currentTools", "platform"],
      confidence: {
        exitReasonBefore: "BLOCKED_CRITICAL_UNKNOWN",
        exitReasonAfter: "SUFFICIENT_INFORMATION",
      },
      decisionState: {
        before: { status: "NOT_READY", clarificationRevision: 0 },
        after: {
          status: "READY_FOR_REVIEW",
          clarificationRevision: 1,
          previousClarificationRevision: 0,
          revisionDiff: 1,
        },
      },
      supersession: {
        mode: "CURRENT_REVISION_SUPERSEDES_PREVIOUS",
        supersedesRevision: 0,
        priorProjection: "SUPERSEDED",
      },
      derivedEffects: {
        blueprintCandidates: "REGENERATED",
        buildPlan: "REGENERATED",
      },
      unchangedScopes: CLARIFICATION_NON_CHANGE_SCOPES,
    });
    expect(diff.changed).toEqual([
      { field: "currentTools", before: ["Notion"], after: ["Notion", "Slack"], source: "USER" },
      { field: "platform", before: null, after: "Cafe24", source: "USER" },
    ]);
    expect(diff.confidence.delta).toBeGreaterThan(0);
  });

  it("uses absence markers and distinguishes an initial lack of questions from resolved questions", () => {
    const diff = createRevisionDiffFixture();

    expect(diff.before).toContainEqual({
      field: "platform",
      value: null,
      present: false,
      source: "USER_UNKNOWN",
    });
    expect(diff.after).toContainEqual({
      field: "platform",
      value: "Cafe24",
      present: true,
      source: "USER",
    });
  });

  it("preserves input values and decision projections without in-place mutation", () => {
    const previous = blockedProjection(0);
    const next = directReadyProjection(1);
    const before = [{ field: "currentTools" as const, value: ["Notion"], present: true, source: "USER" as const }];
    const after = [{ field: "currentTools" as const, value: ["Notion", "Slack"], present: true, source: "USER" as const }];
    const previousBefore = structuredClone(previous);
    const nextBefore = structuredClone(next);

    const diff = createClarificationRevisionDiff({
      previous,
      next,
      before,
      after,
      reason: "ANSWER_BATCH",
      sourceQuestionIds: ["current_tools"],
      derivedEffects: { blueprintCandidates: "UNCHANGED", buildPlan: "UNCHANGED" },
    });
    (after[0]!.value as string[]).push("Linear");
    diff.after[0]!.value = ["changed-only-in-output"];

    expect(previous).toEqual(previousBefore);
    expect(next).toEqual(nextBefore);
    expect(before[0]!.value).toEqual(["Notion"]);
    expect(diff.before[0]!.value).toEqual(["Notion"]);
    expect(diff.after[0]!.value).toEqual(["changed-only-in-output"]);
  });

  it("appends only the immediate next diff and preserves existing history", () => {
    const first = createRevisionDiffFixture();
    const existing = [first];
    const existingBefore = structuredClone(existing);
    const second = createClarificationRevisionDiff({
      previous: { decisionState: first.decisionState.after, exitReason: first.confidence.exitReasonAfter },
      next: blockedProjection(2),
      before: [{ field: "platform", value: "Cafe24", present: true, source: "USER" }],
      after: [{ field: "platform", value: null, present: false, source: "USER_UNKNOWN" }],
      reason: "ANSWER_REVISION",
      sourceQuestionIds: ["platform"],
      derivedEffects: { blueprintCandidates: "SELECTED_CANDIDATE_INVALIDATED", buildPlan: "REGENERATED" },
    });

    const appended = appendClarificationRevisionDiff(existing, second);

    expect(existing).toEqual(existingBefore);
    expect(appended.map((diff) => diff.revision)).toEqual([1, 2]);
    expect(() => appendClarificationRevisionDiff(existing, first)).toThrow("appended revision diff must immediately follow history");
  });

  it("rejects inconsistent diff contents and incomplete non-change scope", () => {
    const diff = createRevisionDiffFixture();
    const mismatched = { ...diff, changed: [] };

    expect(() => validateClarificationRevisionDiff(mismatched)).toThrow("revision diff changed fields do not match before and after snapshots");
    expect(() => createClarificationRevisionDiff({
      previous: blockedProjection(0),
      next: directReadyProjection(1),
      before: [],
      after: [],
      reason: "ANSWER_BATCH",
      sourceQuestionIds: ["platform"],
      derivedEffects: { blueprintCandidates: "UNCHANGED", buildPlan: "UNCHANGED" },
      unchangedScopes: ["RUNTIME"],
    })).toThrow("revision diff cannot omit or reorder protected non-change scopes");
  });
});
