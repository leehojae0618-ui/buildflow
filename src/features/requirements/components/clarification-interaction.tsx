"use client";

import { useMemo, useRef, useState } from "react";
import {
  getClarificationQuestions,
  projectClarificationQuestionBatch,
  readCompatibleClarificationState,
} from "../clarification";
import type {
  ClarificationAnswer,
  ClarificationQuestionBatch,
  ClarificationQuestion,
  ClarificationState,
  RequirementSnapshot,
} from "../types";
import type {
  SaveClarificationAnswerBatchInput,
  SaveClarificationAnswerBatchResult,
} from "../../projects/actions";

type SaveAction = (input: SaveClarificationAnswerBatchInput) => Promise<SaveClarificationAnswerBatchResult>;
type Snapshot = Pick<RequirementSnapshot, "requirement" | "clarification" | "clarificationQuestions">;

const impactLabel = {
  CRITICAL: "필수 확인",
  IMPORTANT: "중요 결정",
  OPTIONAL: "선택 정보",
} as const;

export type ClarificationInteractionView =
  | {
      kind: "READY";
      clarification: ClarificationState;
      questions: ClarificationQuestion[];
      batch: ClarificationQuestionBatch;
    }
  | { kind: "UNSUPPORTED_POLICY"; message: string };

type SubmissionState =
  | { kind: "IDLE" }
  | { kind: "SUBMITTING" }
  | { kind: "SUCCESS" }
  | { kind: "ERROR"; message: string };

type ClarificationBlockingReason = {
  code: string;
  label: string;
  description: string;
};

/**
 * A Decision State can be blocked without having a terminal Exit Reason.
 * Keep this presentation mapping separate from the persisted policy contract:
 * Exit Reason describes completion, while reasonCodes describe why progress
 * is currently blocked.
 */
export function getClarificationBlockingReason(
  clarification: ClarificationState,
): ClarificationBlockingReason | null {
  if (clarification.decisionState.status !== "NOT_READY") return null;

  if (clarification.decisionState.reasonCodes.includes("CONFIDENCE_BELOW_THRESHOLD")) {
    return {
      code: "CONFIDENCE_BELOW_THRESHOLD",
      label: "정보 완성도가 기준(80%)에 도달하지 않았습니다.",
      description: "현재 질문 배치에는 새 질문이 없지만, 가정으로 기록된 정보를 검토한 뒤 Requirement를 다시 분석해야 합니다.",
    };
  }

  return null;
}

export function deriveClarificationInteractionView(snapshot: Snapshot): ClarificationInteractionView {
  try {
    const clarification = readCompatibleClarificationState(snapshot.clarification);
    const questions = snapshot.clarificationQuestions ?? getClarificationQuestions(snapshot.requirement);
    const batch = projectClarificationQuestionBatch({
      questions,
      completedCycles: clarification.batchCount,
      revision: clarification.revision,
      confidence: clarification.confidence,
      answeredQuestionIds: clarification.answers
        .filter((answer) => answer.source === "USER" && answer.value !== null)
        .map((answer) => answer.questionId),
      resolvedQuestionIds: [
        ...clarification.knownFacts
          .map((fact) => questions.find((question) => question.field === fact.field)?.id)
          .filter((questionId): questionId is string => Boolean(questionId)),
        ...clarification.assumptions.map((assumption) => assumption.questionId),
      ],
    });
    return { kind: "READY", clarification, questions, batch };
  } catch {
    return {
      kind: "UNSUPPORTED_POLICY",
      message: "이 프로젝트의 Clarification 정책 버전을 읽을 수 없습니다. 기존 기록은 변경하지 않았습니다.",
    };
  }
}

export function ClarificationInteraction({
  snapshot,
  projectId,
  saveAction,
}: {
  snapshot: Snapshot;
  projectId?: string;
  saveAction?: SaveAction;
}) {
  const view = useMemo(() => deriveClarificationInteractionView(snapshot), [snapshot]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [assumptionQuestionIds, setAssumptionQuestionIds] = useState<string[]>([]);
  const [submission, setSubmission] = useState<SubmissionState>({ kind: "IDLE" });
  const submissionInFlight = useRef(false);

  if (view.kind !== "READY") {
    return <section className="mt-5 border border-amber-400/30 bg-amber-400/5 p-5" aria-labelledby="clarification-heading">
      <p id="clarification-heading" className="text-xs uppercase tracking-[0.2em] text-amber-200">Clarification</p>
      <p className="mt-3 text-sm text-amber-100">{view.message}</p>
    </section>;
  }

  const { clarification, batch } = view;
  const blockingReason = getClarificationBlockingReason(clarification);

  const latestDiff = clarification.revisionDiffs.at(-1);
  const canSubmit = Boolean(projectId && saveAction && batch.status === "ASKING" && batch.questions.length > 0);
  const submit = async () => {
    if (!projectId || !saveAction || batch.status !== "ASKING" || submissionInFlight.current) return;
    const answers = batch.questions.map((question): ClarificationAnswer => {
      const assumed = assumptionQuestionIds.includes(question.id);
      return {
        questionId: question.id,
        field: question.field,
        value: assumed ? null : values[question.id]?.trim() ?? "",
        source: assumed ? "USER_UNKNOWN" : "USER",
        impact: question.impact ?? "IMPORTANT",
      };
    });
    const assumptions = batch.questions
      .filter((question) => assumptionQuestionIds.includes(question.id))
      .map((question) => ({
        questionId: question.id,
        field: question.field,
        value: values[question.id]?.trim() ?? "",
        reason: "사용자가 이 값을 명시적 가정으로 검토했습니다.",
        visibility: "USER_VISIBLE" as const,
        impact: question.impact === "OPTIONAL" ? "OPTIONAL" as const : "IMPORTANT" as const,
      }));
    if (answers.some((answer) => answer.source === "USER" && !answer.value) || assumptions.some((assumption) => !assumption.value)) {
      setSubmission({ kind: "ERROR", message: "각 질문에 답하거나, 가정으로 검토할 경우 가정값을 입력해 주세요." });
      return;
    }
    submissionInFlight.current = true;
    setSubmission({ kind: "SUBMITTING" });
    try {
      const result = await saveAction({ projectId, expectedRevision: clarification.revision, answers, assumptions });
      setSubmission(result.ok ? { kind: "SUCCESS" } : { kind: "ERROR", message: errorMessage(result.error) });
    } catch {
      setSubmission({ kind: "ERROR", message: "답변 처리 중 예기치 않은 오류가 발생했습니다. 기존 기록은 변경되지 않았습니다." });
    } finally {
      submissionInFlight.current = false;
    }
  };

  return <section className="mt-5 border border-cyan-300/30 bg-zinc-950/50 p-5" aria-labelledby="clarification-heading">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p id="clarification-heading" className="text-xs uppercase tracking-[0.2em] text-cyan-300">Clarification</p>
        <h3 className="mt-2 text-lg font-medium text-zinc-100">결정에 필요한 정보 확인</h3>
        <p className="mt-2 text-sm text-zinc-400">실행을 시작하지 않습니다. 필요한 사실을 확인하고 Blueprint 검토 준비 상태만 갱신합니다.</p>
      </div>
      <span className="border border-cyan-300/30 px-2 py-1 text-xs text-cyan-100">Revision {clarification.revision}</span>
    </div>

    <DecisionState clarification={clarification} blockingReason={blockingReason} />

    {batch.status === "ASKING" && batch.questions.length > 0 ? <div className="mt-5">
      <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-medium text-zinc-200">현재 질문 배치</h4><span className="text-xs text-zinc-500">최대 3개 · Cycle {batch.cycle}</span></div>
      <div className="mt-3 grid gap-3">
        {batch.questions.map((question, index) => <QuestionField
          key={question.id}
          question={question}
          index={index}
          value={values[question.id] ?? ""}
          assumption={assumptionQuestionIds.includes(question.id)}
          onValueChange={(value) => setValues((current) => ({ ...current, [question.id]: value }))}
          onAssumptionChange={(checked) => setAssumptionQuestionIds((current) => checked ? [...new Set([...current, question.id])] : current.filter((id) => id !== question.id))}
        />)}
      </div>
      {submission.kind === "ERROR" && <p role="alert" className="mt-3 border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{submission.message}</p>}
      {submission.kind === "SUCCESS" && <p role="status" className="mt-3 border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">답변이 저장되었습니다. 최신 Revision을 확인하는 중입니다.</p>}
      {canSubmit ? <button type="button" onClick={() => void submit()} disabled={submission.kind === "SUBMITTING"} className="mt-4 border border-cyan-300/50 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 disabled:opacity-40">{submission.kind === "SUBMITTING" ? "저장 중..." : "답변 저장 및 변경 내용 확인"}</button> : <p className="mt-4 text-xs text-zinc-500">저장 권한이 없는 읽기 전용 상태입니다.</p>}
    </div> : <EmptyState batchStatus={batch.status} exitReason={clarification.exitReason} blockingReason={blockingReason} />}

    <RevisionExplanation diff={latestDiff} />
    <RevisionHistory revisions={clarification.revisionDiffs} />
  </section>;
}

function QuestionField({ question, index, value, assumption, onValueChange, onAssumptionChange }: { question: ClarificationQuestion; index: number; value: string; assumption: boolean; onValueChange: (value: string) => void; onAssumptionChange: (checked: boolean) => void }) {
  const allowUnknown = question.impact !== "CRITICAL";
  const fieldId = `clarification-${question.id}`;
  return <fieldset className="border border-zinc-800 bg-zinc-950/60 p-4">
    <legend className="sr-only">질문 {index + 1}</legend>
    <div className="flex flex-wrap items-start justify-between gap-3"><label htmlFor={fieldId} className="text-sm font-medium text-zinc-100">{index + 1}. {question.question}</label><span className="border border-zinc-700 px-2 py-1 text-xs text-zinc-400">{impactLabel[question.impact ?? "IMPORTANT"]}</span></div>
    <p className="mt-2 text-xs text-zinc-500">이 답변은 Requirement, Blueprint 후보 또는 Build Plan 검토 내용에 영향을 줄 수 있습니다.</p>
    <input id={fieldId} value={value} onChange={(event) => onValueChange(event.target.value)} className="mt-3 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" aria-describedby={`${fieldId}-help`} />
    <p id={`${fieldId}-help`} className="mt-2 text-xs text-zinc-500">{assumption ? "이 값은 사실이 아니라 사용자 가정으로 기록됩니다." : "Credential, access token, 비밀번호 등 민감한 값은 입력하지 마세요."}</p>
    {allowUnknown && <label className="mt-3 flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={assumption} onChange={(event) => onAssumptionChange(event.target.checked)} /> 이 값을 명시적 가정으로 검토합니다</label>}
    {!allowUnknown && <p className="mt-3 text-xs text-amber-200">이 항목은 필수 확인 정보이므로 가정하거나 건너뛸 수 없습니다.</p>}
  </fieldset>;
}

function DecisionState({ clarification, blockingReason }: { clarification: NonNullable<Snapshot["clarification"]>; blockingReason: ClarificationBlockingReason | null }) {
  return <div className="mt-5 grid gap-3 border border-zinc-800 bg-zinc-950/50 p-4 sm:grid-cols-3">
    <div><p className="text-xs text-zinc-500">Decision State</p><p className="mt-1 text-sm font-medium text-cyan-100">{clarification.decisionState.status}</p></div>
    <div><p className="text-xs text-zinc-500">Confidence</p><progress className="mt-2 h-2 w-full accent-cyan-300" value={clarification.confidence} max="1">{Math.round(clarification.confidence * 100)}%</progress><p className="mt-1 text-xs text-zinc-400">{Math.round(clarification.confidence * 100)}% · {clarification.policyVersion}</p></div>
    <div><p className="text-xs text-zinc-500">다음 행동</p><p className="mt-1 text-sm text-zinc-200">{clarification.decisionState.nextDecision}</p><p className="mt-1 text-xs text-zinc-500">{blockingReason?.label ?? clarification.exitReason ?? "현재 분석 상태를 확인 중입니다."}</p></div>
  </div>;
}

function EmptyState({ batchStatus, exitReason, blockingReason }: { batchStatus: string; exitReason: string | null; blockingReason: ClarificationBlockingReason | null }) {
  const description = blockingReason?.description ?? (exitReason === "QUESTION_CYCLE_LIMIT"
    ? "자동 질문 배치 한도에 도달했습니다. 남은 사항을 검토해야 합니다."
    : exitReason === "BLOCKED_CRITICAL_UNKNOWN"
      ? "필수 확인 정보가 남아 있습니다. 해당 정보를 확인해야 다음 검토로 이동할 수 있습니다."
      : "새로 답할 질문이 없습니다. 현재 Decision State와 변경 이력을 검토하세요.");
  return <div className="mt-5 border border-zinc-800 bg-zinc-950/50 p-4"><p className="text-sm font-medium text-zinc-200">{blockingReason ? "추가 검토 필요" : "현재 질문 없음"}</p><p className="mt-2 text-sm text-zinc-400">{description}</p><p className="mt-2 text-xs text-zinc-600">질문 배치: {batchStatus === "NO_MATERIAL_QUESTION" ? "새 질문 없음" : batchStatus}</p></div>;
}

function RevisionExplanation({ diff }: { diff: NonNullable<Snapshot["clarification"]>["revisionDiffs"][number] | undefined }) {
  if (!diff) return <div className="mt-5 border border-zinc-800 bg-zinc-950/50 p-4"><p className="text-sm font-medium text-zinc-200">변경 이력 준비 중</p><p className="mt-2 text-sm text-zinc-500">첫 답변을 저장하면 Before → Changed → After 설명이 여기에 표시됩니다.</p></div>;
  return <div className="mt-5 border border-emerald-400/20 bg-emerald-400/5 p-4"><p className="text-xs uppercase tracking-[0.15em] text-emerald-200">Latest Snapshot Diff</p><p className="mt-2 text-sm text-zinc-200">Revision {diff.revision} · {diff.reason}</p><p className="mt-1 text-xs text-zinc-400">Confidence {Math.round(diff.confidence.before * 100)}% → {Math.round(diff.confidence.after * 100)}% · {diff.confidence.exitReasonAfter ?? "계속 확인 필요"}</p><div className="mt-3 grid gap-2 text-sm text-zinc-300">{diff.changed.length > 0 ? diff.changed.map((change) => <p key={change.field}><span className="text-emerald-200">{change.field}</span>: {displayValue(change.before)} → {displayValue(change.after)}</p>) : <p>Requirement 사실 변경 없음</p>}</div><p className="mt-3 text-xs text-zinc-500">Blueprint: {diff.derivedEffects.blueprintCandidates} · Build Plan: {diff.derivedEffects.buildPlan}</p><p className="mt-1 text-xs text-zinc-600">변경 없음: {diff.unchangedScopes.join(", ")}</p></div>;
}

function RevisionHistory({ revisions }: { revisions: NonNullable<Snapshot["clarification"]>["revisionDiffs"] }) {
  if (revisions.length === 0) return null;
  return <details className="mt-5 border border-zinc-800 bg-zinc-950/40 p-4"><summary className="cursor-pointer text-sm font-medium text-zinc-200">Revision History ({revisions.length})</summary><ol className="mt-4 grid gap-3">{[...revisions].reverse().map((revision) => <li key={revision.revision} className="border-l-2 border-zinc-700 pl-3 text-sm"><p className="text-zinc-200">Revision {revision.revision} · 이전 {revision.priorRevision}</p><p className="mt-1 text-xs text-zinc-500">질문: {revision.sourceQuestionIds.join(", ")} · 상태: {revision.decisionState.after.status}</p></li>)}</ol></details>;
}

function displayValue(value: unknown): string {
  if (value === null) return "미입력";
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function errorMessage(error: Exclude<SaveClarificationAnswerBatchResult, { ok: true }> ["error"]): string {
  const messages = {
    PROJECT_ID_INVALID: "프로젝트 식별자가 올바르지 않습니다.",
    PROJECT_NOT_FOUND: "프로젝트를 찾을 수 없거나 접근 권한이 없습니다.",
    SNAPSHOT_UNAVAILABLE: "현재 Requirement Snapshot을 저장할 수 없습니다.",
    STALE_REVISION: "다른 변경이 먼저 저장되었습니다. 최신 상태를 확인한 뒤 다시 시도해 주세요.",
    POLICY_VERSION_UNSUPPORTED: "지원하지 않는 Clarification 정책 버전입니다.",
    ANSWER_BATCH_INVALID: "현재 질문 배치와 일치하지 않는 답변입니다.",
    SECRET_SHAPED_INPUT: "민감한 값처럼 보이는 입력은 저장할 수 없습니다.",
    PROJECTION_FAILED: "답변은 검증되었지만 변경 내용 계산에 실패했습니다. 기존 기록은 변경되지 않았습니다.",
    UNEXPECTED_ERROR: "답변 처리 중 예기치 않은 오류가 발생했습니다. 기존 기록은 변경되지 않았습니다.",
    PERSISTENCE_FAILED: "답변을 저장하지 못했습니다. 기존 기록은 변경되지 않았습니다.",
  } as const;
  return messages[error];
}
