type JourneySnapshot = {
  requirement?: { expectedOutput?: string };
  clarificationQuestions?: { required: boolean }[];
  selectedCandidateId?: string | null;
  buildPlan?: unknown;
};

type CompletionReport = {
  serviceUrl?: string;
  outcomes?: string[];
  warnings?: string[];
  productionReady?: boolean;
};

type JourneySession = {
  id: string;
  status: string;
  completionReport?: unknown;
} | null | undefined;

export type JourneyStage = {
  id: "goal" | "requirement" | "blueprint" | "plan" | "approval" | "progress" | "result";
  label: string;
  state: "COMPLETE" | "CURRENT" | "BLOCKED" | "PENDING" | "RESULT";
  detail: string;
};

export type AgentBuildJourneyModel = {
  stages: JourneyStage[];
  nextAction: string;
  result: {
    kind: "NONE" | "READY" | "READY_WITH_WARNINGS" | "FAILED" | "CANCELLED";
    detail: string;
    serviceUrl?: string;
    outcomes: string[];
    warnings: string[];
  };
};

const terminalStatuses = new Set(["READY", "READY_WITH_WARNINGS", "FAILED", "CANCELLED"]);

function completionReport(value: unknown): CompletionReport | null {
  return value && typeof value === "object" ? value as CompletionReport : null;
}

function pendingClarifications(snapshot: JourneySnapshot): number {
  return snapshot.clarificationQuestions?.filter((question) => question.required).length ?? 0;
}

function sessionDetail(status: string | undefined): string {
  const details: Record<string, string> = {
    WAITING_FOR_CREDENTIAL: "연결 정보가 필요합니다.",
    WAITING_FOR_CONSENT: "외부 서비스 사용 동의를 기다립니다.",
    WAITING_FOR_APPROVAL: "승인 범위를 검토해야 합니다.",
    PLANNING: "저장된 세션이 계획 상태입니다.",
    PROVISIONING: "저장된 세션이 구축 진행 상태입니다.",
    VERIFYING: "저장된 세션이 검증 진행 상태입니다.",
    RECOVERING: "저장된 세션이 복구 상태입니다.",
    BLOCKED: "저장된 세션이 차단되었습니다.",
  };
  return details[status ?? ""] ?? "저장된 세션 상태를 확인할 수 있습니다.";
}

export function deriveAgentBuildJourney(snapshot: JourneySnapshot, session: JourneySession): AgentBuildJourneyModel {
  const hasRequirement = Boolean(snapshot.requirement);
  const clarificationCount = pendingClarifications(snapshot);
  const hasBlueprint = Boolean(snapshot.selectedCandidateId);
  const hasPlan = Boolean(snapshot.buildPlan);
  const status = session?.status;
  const report = completionReport(session?.completionReport);
  const resultKind = status === "READY" || status === "READY_WITH_WARNINGS" || status === "FAILED" || status === "CANCELLED" ? status : "NONE";
  const resultDetail = resultKind === "READY"
    ? report ? "저장된 완료 보고서가 준비 상태를 확인합니다." : "저장된 세션이 준비 완료 상태입니다."
    : resultKind === "READY_WITH_WARNINGS"
      ? "저장된 세션이 경고 포함 준비 상태입니다."
      : resultKind === "FAILED"
        ? "저장된 세션이 실패 상태입니다."
        : resultKind === "CANCELLED"
          ? "저장된 세션이 취소 상태입니다."
          : "저장된 최종 결과가 아직 없습니다.";

  const stages: JourneyStage[] = [
    { id: "goal", label: "Goal", state: hasRequirement ? "COMPLETE" : "CURRENT", detail: hasRequirement ? "목표가 저장되어 있습니다." : "목표 입력이 필요합니다." },
    { id: "requirement", label: "Requirement", state: !hasRequirement ? "PENDING" : clarificationCount ? "CURRENT" : "COMPLETE", detail: !hasRequirement ? "요구사항이 아직 생성되지 않았습니다." : clarificationCount ? `필수 확인 항목 ${clarificationCount}개가 남아 있습니다.` : "필수 요구사항이 정리되었습니다." },
    { id: "blueprint", label: "Blueprint", state: hasBlueprint ? "COMPLETE" : hasRequirement ? "CURRENT" : "PENDING", detail: hasBlueprint ? "선택된 Blueprint가 저장되어 있습니다." : "Blueprint 선택이 필요합니다." },
    { id: "plan", label: "Build Plan", state: hasPlan ? "COMPLETE" : hasBlueprint ? "CURRENT" : "PENDING", detail: hasPlan ? "Build Plan이 저장되어 있습니다." : "선택된 Blueprint의 Build Plan이 필요합니다." },
    { id: "approval", label: "Approval", state: status === "WAITING_FOR_CREDENTIAL" || status === "WAITING_FOR_CONSENT" || status === "WAITING_FOR_APPROVAL" ? "CURRENT" : session ? "COMPLETE" : "PENDING", detail: status ? sessionDetail(status) : "저장된 세션이 생성되면 승인 경계가 표시됩니다." },
    { id: "progress", label: "Saved Session", state: session && !terminalStatuses.has(status ?? "") ? "CURRENT" : session ? "COMPLETE" : "PENDING", detail: session ? sessionDetail(status) : "저장된 세션이 아직 없습니다." },
    { id: "result", label: "Result", state: resultKind === "NONE" ? "PENDING" : "RESULT", detail: resultDetail },
  ];

  const nextAction = !hasRequirement
    ? "프로젝트 목표를 저장하세요."
    : clarificationCount > 0
      ? "필수 확인 항목을 보완하세요."
      : !hasBlueprint
        ? "Blueprint를 선택하세요."
        : !hasPlan
          ? "Build Plan을 확인하세요."
          : status === "WAITING_FOR_CREDENTIAL"
            ? "기존 연결 정보 흐름에서 필요한 Credential을 제공하세요."
            : status === "WAITING_FOR_CONSENT"
              ? "기존 동의 흐름에서 외부 서비스 사용 범위를 확인하세요."
              : status === "WAITING_FOR_APPROVAL"
                ? "기존 승인 흐름에서 작업 범위를 검토하세요."
                : resultKind !== "NONE"
                  ? "저장된 결과와 후속 조치를 검토하세요."
                  : "저장된 세션이 생성되면 진행 상태가 표시됩니다.";

  return {
    stages,
    nextAction,
    result: {
      kind: resultKind,
      detail: resultDetail,
      serviceUrl: report?.serviceUrl,
      outcomes: report?.outcomes ?? [],
      warnings: report?.warnings ?? [],
    },
  };
}

const stateClass: Record<JourneyStage["state"], string> = {
  COMPLETE: "border-emerald-300/40 text-emerald-100",
  CURRENT: "border-cyan-300/60 text-cyan-100",
  BLOCKED: "border-amber-300/50 text-amber-100",
  PENDING: "border-zinc-700 text-zinc-400",
  RESULT: "border-violet-300/50 text-violet-100",
};

export function AgentBuildJourney({ snapshot, session }: { snapshot: JourneySnapshot; session: JourneySession }) {
  const journey = deriveAgentBuildJourney(snapshot, session);
  return <section className="mb-6 border border-cyan-300/40 bg-zinc-950/70 p-5" aria-labelledby="agent-build-journey-title">
    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Agent Build Journey</p>
    <h2 id="agent-build-journey-title" className="mt-2 text-xl font-semibold text-white">목표부터 현재 결과까지</h2>
    <p className="mt-2 text-sm text-zinc-400">이 화면은 저장된 상태만 표시하며 실행·승인·연결 작업을 수행하지 않습니다.</p>
    <ol className="mt-5 grid gap-2 sm:grid-cols-2">
      {journey.stages.map((stage) => <li key={stage.id} className={`border p-3 ${stateClass[stage.state]}`}><p className="text-xs uppercase tracking-[0.15em]">{stage.label}</p><p className="mt-2 text-sm">{stage.detail}</p></li>)}
    </ol>
    <div className="mt-5 border border-zinc-800 bg-zinc-950 p-4"><p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Next Action</p><p className="mt-2 text-sm text-zinc-100">{journey.nextAction}</p></div>
    {journey.result.kind !== "NONE" && <div className="mt-3 border border-violet-300/30 bg-violet-300/5 p-4"><p className="text-xs uppercase tracking-[0.15em] text-violet-200">Persisted Result</p><p className="mt-2 text-sm text-zinc-100">{journey.result.detail}</p>{journey.result.serviceUrl && <a className="mt-3 block text-sm text-cyan-200 underline" href={journey.result.serviceUrl} target="_blank" rel="noreferrer">{journey.result.serviceUrl}</a>}{journey.result.outcomes.length > 0 && <ul className="mt-3 grid gap-1 text-sm text-zinc-200">{journey.result.outcomes.map((outcome) => <li key={outcome}>• {outcome}</li>)}</ul>}{journey.result.warnings.map((warning) => <p key={warning} className="mt-2 text-xs text-amber-100">{warning}</p>)}</div>}
  </section>;
}
