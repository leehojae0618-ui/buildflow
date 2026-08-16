"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { prepareAiNewsDigestRun, runAiNewsFetchStep, runAiNewsSlackWriteStep, runAiNewsSummaryStep, type AiNewsDigestGateErrorCode, type AiNewsDigestPreview, type AiNewsDigestRunResult } from "@/features/live-ai-news/actions";
import type { LiveRecipeEvidence } from "@/features/live-recipe/types";
import { requestApprovedSlackTestWrite, requestSlackConnectLink, requestSlackTestActionPreparation } from "@/features/live-recipe/actions";
import { applyBuildPackageClarification, createBuildPackage } from "../build-package";
import { buildRecipeFirstView } from "../recipe-first-view-model";
import type { ExecutionEngine, RankedRecipe } from "../types";

const digestGateErrorLabel: Record<AiNewsDigestGateErrorCode, string> = {
  LIVE_DISABLED: "실제 연결은 아직 비활성화되어 있습니다.",
  WRITE_DISABLED: "Live Slack 쓰기는 비활성화되어 있습니다.",
  CONFIGURATION_MISSING: "실행에 필요한 서버 설정(대상 채널 또는 AI Provider)이 아직 준비되지 않았습니다.",
  EXTERNAL_ACTION_FAILED: "Recipe 실행 중 외부 호출이 실패했습니다.",
  ATTEMPT_NOT_FOUND: "실행 정보를 찾을 수 없습니다. 처음부터 다시 실행해 주세요.",
};

const examples = [
  "매일 AI 뉴스를 찾아서 중요한 것만 요약해서 Slack으로 보내줘",
  "중요한 이메일만 골라서 Slack으로 알려줘",
  "회의가 끝나면 내용을 정리해서 Notion에 저장해줘",
];
const difficultyLabel = { LOW: "낮음", MEDIUM: "보통", HIGH: "높음" } as const;
const automationLabel = { FULL: "전체 자동화", PARTIAL: "반자동", ASSISTED: "보조형" } as const;

export function RecipeFirstExperience() {
  const [goal, setGoal] = useState("");
  const [submittedGoal, setSubmittedGoal] = useState("");
  const [costPreference, setCostPreference] = useState<"FREE_FIRST" | "BALANCED">("FREE_FIRST");
  const [connectionPreference, setConnectionPreference] = useState<"FEWER_CONNECTIONS" | "FULL_CAPABILITY">("FEWER_CONNECTIONS");
  const [selected, setSelected] = useState<RankedRecipe | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<ExecutionEngine | undefined>();
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [testWriteNotice, setTestWriteNotice] = useState<string | null>(null);
  const [awaitingTestWriteApproval, setAwaitingTestWriteApproval] = useState(false);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [digestPreview, setDigestPreview] = useState<AiNewsDigestPreview | null>(null);
  const [digestSteps, setDigestSteps] = useState<Array<{ label: string; detail: string; service: string; completedAt: string }>>([]);
  const [digestRunResult, setDigestRunResult] = useState<AiNewsDigestRunResult | null>(null);
  const [digestEvidence, setDigestEvidence] = useState<LiveRecipeEvidence | null>(null);
  const [digestRunning, setDigestRunning] = useState(false);
  const view = useMemo(() => buildRecipeFirstView(submittedGoal, { costPreference, connectionPreference }), [submittedGoal, costPreference, connectionPreference]);
  const baseBuildPackage = useMemo(() => selected ? createBuildPackage({ recipe: selected.recipe, intent: view.recommendation.intent, selectedEngine }) : null, [selected, selectedEngine, view.recommendation.intent]);
  const buildPackage = useMemo(() => baseBuildPackage ? applyBuildPackageClarification(baseBuildPackage, clarificationAnswers) : null, [baseBuildPackage, clarificationAnswers]);

  function resetDigestRun() { setDigestPreview(null); setDigestSteps([]); setDigestRunResult(null); setDigestEvidence(null); setDigestRunning(false); }
  function submit() { setSelected(null); setSelectedEngine(undefined); setConnectionNotice(null); setTestWriteNotice(null); setAwaitingTestWriteApproval(false); setClarificationAnswers({}); resetDigestRun(); setSubmittedGoal(goal.trim()); }
  function selectRecipe(item: RankedRecipe) { setSelected(item); setSelectedEngine(undefined); setConnectionNotice(null); setTestWriteNotice(null); setAwaitingTestWriteApproval(false); setClarificationAnswers({}); resetDigestRun(); }
  function answerClarification(id: string, value: string) { setClarificationAnswers((current) => ({ ...current, [id]: value })); }
  async function requestSlackConnection() {
    if (!selected) return;
    const result = await requestSlackConnectLink(selected.recipe.id);
    setConnectionNotice(result.ok
      ? "Slack Connect Link가 준비되었습니다. Live 승인 전에는 이 링크를 열지 않습니다."
      : result.errorCode === "LIVE_DISABLED"
        ? "실제 연결은 아직 비활성화되어 있습니다. Live 연결 승인 전 단계입니다."
        : "Slack 연결 준비를 시작할 수 없습니다. 안전한 서버 진단 상태를 확인하세요.");
  }
  async function prepareTestWrite() {
    if (!selected) return;
    const result = await requestSlackTestActionPreparation(selected.recipe.id);
    setTestWriteNotice(result.ok
      ? "테스트 메시지 action 경계가 준비되었습니다. 전송에는 별도 명시적 승인이 필요합니다."
      : result.errorCode === "WRITE_DISABLED"
        ? "Live Slack 쓰기는 비활성화되어 있습니다."
        : "테스트 메시지 준비를 시작할 수 없습니다.");
    setAwaitingTestWriteApproval(result.ok);
  }
  async function approveTestWrite() {
    if (!selected) return;
    const requestId = `slack-test-${selected.recipe.id.replace("recipe.", "")}-phase-a`;
    const result = await requestApprovedSlackTestWrite({ approved: true, recipeId: selected.recipe.id, targetConfigurationReference: "recipe-build-package", requestId });
    setTestWriteNotice(result.ok ? "테스트 메시지 전송 결과가 준비되었습니다." : result.errorCode === "WRITE_DISABLED" ? "Live Slack 쓰기는 비활성화되어 있습니다." : "테스트 메시지를 전송하지 않았습니다.");
    setAwaitingTestWriteApproval(false);
  }
  async function prepareDigestRun() {
    setDigestRunResult(null);
    setDigestPreview(await prepareAiNewsDigestRun());
  }
  async function approveDigestRun() {
    setDigestRunning(true);
    setDigestRunResult(null);
    setDigestSteps([]);
    setDigestPreview(null);

    const fetchResult = await runAiNewsFetchStep();
    if (!fetchResult.ok) { setDigestRunResult(fetchResult); setDigestRunning(false); return; }
    setDigestSteps((steps) => [...steps, { label: "1. 뉴스 수집", detail: `${fetchResult.selectedItemCount}건 확인`, service: fetchResult.service, completedAt: fetchResult.completedAt }]);

    const summaryResult = await runAiNewsSummaryStep(fetchResult.attemptId);
    if (!summaryResult.ok) { setDigestRunResult(summaryResult); setDigestRunning(false); return; }
    setDigestSteps((steps) => [...steps, { label: "2. AI 요약", detail: `${summaryResult.summaryLineCount}줄 생성`, service: summaryResult.service, completedAt: summaryResult.completedAt }]);

    const writeResult = await runAiNewsSlackWriteStep(fetchResult.attemptId);
    if (!writeResult.ok) { setDigestRunResult(writeResult); setDigestRunning(false); return; }
    setDigestSteps((steps) => [...steps, { label: "3. Slack 전송", detail: writeResult.safeSlackReference, service: "Slack (Pipedream)", completedAt: writeResult.evidence.completedAt ?? writeResult.evidence.requestedAt }]);
    setDigestEvidence(writeResult.evidence);

    setDigestRunResult({ ok: true, selectedItemCount: fetchResult.selectedItemCount, summaryLineCount: summaryResult.summaryLineCount, safeSlackReference: writeResult.safeSlackReference });
    setDigestRunning(false);
  }

  return <main className="min-h-screen bg-[#081112] text-zinc-100">
    <header className="border-b border-emerald-100/10 bg-[#0b1615]"><div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-5 px-5 sm:px-8"><div className="flex items-center gap-3"><span className="text-sm font-semibold tracking-[0.18em] text-emerald-200">BUILDFLOW</span><span className="border border-emerald-200/20 px-2 py-1 text-[10px] font-medium tracking-[0.12em] text-emerald-100">RECIPE-FIRST</span></div><Link href="/bf0" className="text-sm text-zinc-400 underline-offset-4 hover:text-emerald-100 hover:underline">Legacy BF0</Link></div></header>

    <section className="border-b border-emerald-100/10 bg-[#0d1b19] px-5 py-12 sm:px-8 sm:py-16"><div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)] lg:items-end"><div><p className="text-xs font-medium tracking-[0.18em] text-emerald-200">AUTOMATION RECIPE FINDER</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">무엇을 자동화하고 싶으세요?</h1><p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">원하는 일을 말하면, BuildFlow가 서비스 조합과 구축 준비 계획을 가진 Recipe를 추천합니다.</p><label htmlFor="recipe-goal" className="sr-only">자동화 목표</label><textarea id="recipe-goal" value={goal} onChange={(event) => setGoal(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submit(); }} placeholder="예: 매일 AI 뉴스를 찾아서 중요한 것만 요약해서 Slack으로 보내줘" className="mt-8 min-h-32 w-full max-w-3xl resize-y border border-emerald-100/20 bg-[#07100f] px-4 py-4 text-base leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-200" /><div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={submit} disabled={!goal.trim()} className="min-h-11 bg-emerald-200 px-5 text-sm font-semibold text-[#09201b] disabled:cursor-not-allowed disabled:opacity-40">Recipe 찾기</button><span className="text-xs text-zinc-500">외부 연결이나 실행은 이 화면에서 수행하지 않습니다.</span></div></div><aside className="border-l border-emerald-100/10 pl-0 lg:pl-8"><p className="text-sm font-medium text-zinc-200">이렇게 시작해 보세요</p><div className="mt-4 grid gap-2">{examples.map((example) => <button key={example} type="button" onClick={() => { setGoal(example); setSubmittedGoal(example); setSelected(null); setSelectedEngine(undefined); setConnectionNotice(null); }} className="border border-zinc-700/70 bg-[#0b1514] px-4 py-3 text-left text-sm leading-6 text-zinc-300 transition hover:border-emerald-200/50 hover:text-white">{example}</button>)}</div></aside></div></section>

    <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14"><div className="flex flex-col justify-between gap-5 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end"><div><p className="text-xs font-medium tracking-[0.16em] text-emerald-200">RECOMMENDATIONS</p><h2 className="mt-2 text-2xl font-semibold text-white">{submittedGoal ? view.heading : "목표를 입력하면 추천을 시작합니다"}</h2>{submittedGoal && <p className="mt-2 text-sm text-zinc-400">{view.goalSummary}</p>}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setCostPreference((value) => value === "FREE_FIRST" ? "BALANCED" : "FREE_FIRST")} className="border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-emerald-200/50">{costPreference === "FREE_FIRST" ? "무료/저비용 우선" : "균형 추천"}</button><button type="button" onClick={() => setConnectionPreference((value) => value === "FEWER_CONNECTIONS" ? "FULL_CAPABILITY" : "FEWER_CONNECTIONS")} className="border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-emerald-200/50">{connectionPreference === "FEWER_CONNECTIONS" ? "적은 연결 우선" : "기능 범위 우선"}</button></div></div>
      {!submittedGoal ? <p className="py-16 text-sm leading-7 text-zinc-500">추천에는 목표, 자주 쓰는 서비스, 자동화 빈도를 함께 반영합니다. 저장하거나 연결하지 않아도 먼저 비교할 수 있습니다.</p> : view.recommendation.results.length ? <div className="grid gap-5 py-8 lg:grid-cols-3">{view.recommendation.results.map((item, index) => <RecipeCard key={item.recipe.id} item={item} rank={index + 1} selected={selected?.recipe.id === item.recipe.id} onSelect={() => selectRecipe(item)} />)}</div> : <p className="py-16 text-sm leading-7 text-amber-100">{view.recommendation.noMatchReason}</p>}
      {buildPackage && <BuildPreparation buildPackage={buildPackage} onEngineSelect={setSelectedEngine} onStartConnection={requestSlackConnection} connectionNotice={connectionNotice} onPrepareTestWrite={prepareTestWrite} onApproveTestWrite={approveTestWrite} testWriteNotice={testWriteNotice} awaitingTestWriteApproval={awaitingTestWriteApproval} onAnswerClarification={answerClarification} digestPreview={digestPreview} digestSteps={digestSteps} digestRunResult={digestRunResult} digestEvidence={digestEvidence} digestRunning={digestRunning} onPrepareDigestRun={prepareDigestRun} onApproveDigestRun={approveDigestRun} onClose={() => { setSelected(null); setSelectedEngine(undefined); setConnectionNotice(null); setTestWriteNotice(null); setAwaitingTestWriteApproval(false); setClarificationAnswers({}); resetDigestRun(); }} />}
    </section>
  </main>;
}

function ClarificationQuestion({ index, id, question, onAnswer }: { index: number; id: string; question: string; onAnswer: (id: string, value: string) => void }) {
  const [draft, setDraft] = useState("");
  return <li className="border border-zinc-800 bg-[#0b1514] px-4 py-3"><label htmlFor={`clarification-${id}`} className="text-sm text-zinc-300">{index + 1}. {question}</label><form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (draft.trim()) onAnswer(id, draft); }}><input id={`clarification-${id}`} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="답변을 입력하세요" className="min-h-9 flex-1 border border-zinc-700 bg-[#07100f] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-200" /><button type="submit" disabled={!draft.trim()} className="min-h-9 border border-emerald-200/50 px-4 text-xs font-medium text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-200/10">답변</button></form></li>;
}

function RecipeCard({ item, rank, selected, onSelect }: { item: RankedRecipe; rank: number; selected: boolean; onSelect: () => void }) {
  const { recipe } = item;
  return <article className={`border p-5 ${selected ? "border-emerald-200 bg-emerald-200/5" : "border-zinc-800 bg-[#0b1514]"}`}><div className="flex items-start justify-between gap-4"><span className="text-xs font-medium text-emerald-200">RECIPE {rank}</span><span className="text-xs text-zinc-500">{recipe.verificationStatus}</span></div><h3 className="mt-4 text-xl font-semibold leading-7 text-white">{recipe.title}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{recipe.description}</p><div className="mt-5 flex flex-wrap gap-2">{recipe.requiredServices.map((service) => <span key={service} className="border border-zinc-700 px-2 py-1 text-xs text-zinc-300">{service}</span>)}</div><dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-xs"><div><dt className="text-zinc-500">예상 비용</dt><dd className="mt-1 text-zinc-200">{recipe.costProfile.label}</dd></div><div><dt className="text-zinc-500">설정 난이도</dt><dd className="mt-1 text-zinc-200">{difficultyLabel[recipe.setupDifficulty]}</dd></div><div><dt className="text-zinc-500">자동화 범위</dt><dd className="mt-1 text-zinc-200">{automationLabel[recipe.automationLevel]}</dd></div><div><dt className="text-zinc-500">필요 연결</dt><dd className="mt-1 text-zinc-200">{item.connectionCount}개</dd></div></dl><div className="mt-5 border-t border-zinc-800 pt-4"><p className="text-xs leading-5 text-zinc-400">{item.reasons[0]}</p><button type="button" onClick={onSelect} className="mt-4 min-h-10 border border-emerald-200/50 px-4 text-sm font-medium text-emerald-100 hover:bg-emerald-200/10">{selected ? "선택됨" : "이 Recipe 선택"}</button></div></article>;
}

function BuildPreparation({ buildPackage, onEngineSelect, onStartConnection, connectionNotice, onPrepareTestWrite, onApproveTestWrite, testWriteNotice, awaitingTestWriteApproval, onAnswerClarification, digestPreview, digestSteps, digestRunResult, digestEvidence, digestRunning, onPrepareDigestRun, onApproveDigestRun, onClose }: { buildPackage: ReturnType<typeof createBuildPackage>; onEngineSelect: (engine: ExecutionEngine) => void; onStartConnection: () => void; connectionNotice: string | null; onPrepareTestWrite: () => void; onApproveTestWrite: () => void; testWriteNotice: string | null; awaitingTestWriteApproval: boolean; onAnswerClarification: (id: string, value: string) => void; digestPreview: AiNewsDigestPreview | null; digestSteps: Array<{ label: string; detail: string; service: string; completedAt: string }>; digestRunResult: AiNewsDigestRunResult | null; digestEvidence: LiveRecipeEvidence | null; digestRunning: boolean; onPrepareDigestRun: () => void; onApproveDigestRun: () => void; onClose: () => void }) {
  return <section aria-live="polite" className="border-t border-emerald-100/20 py-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium tracking-[0.16em] text-emerald-200">BUILD PREPARATION</p><h2 className="mt-2 text-2xl font-semibold text-white">구축 준비</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">선택한 Recipe를 실제 연결 전까지 구성한 결과입니다. Package 상태: <span className="text-emerald-100">{buildPackage.status}</span></p></div><button type="button" onClick={onClose} className="border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-400">닫기</button></div>
    <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="space-y-7"><section><h3 className="text-sm font-semibold text-white">선택한 Recipe</h3><div className="mt-3 border border-zinc-800 bg-[#0b1514] p-4"><p className="text-lg font-semibold text-white">{buildPackage.title.replace(" 구축 준비", "")}</p><p className="mt-2 text-sm text-zinc-400">{buildPackage.steps.map((step) => step.label).join(" -> ")}</p><p className="mt-3 text-xs text-zinc-500">예상 비용: <span className="text-zinc-200">{buildPackage.costProfile.label}</span></p></div></section><section><h3 className="text-sm font-semibold text-white">필요한 승인</h3>{buildPackage.approvals.length ? <ul className="mt-3 grid gap-2">{buildPackage.approvals.map((approval) => <li key={approval} className="border border-amber-200/20 bg-amber-200/5 px-4 py-3 text-sm leading-6 text-amber-100">{approval}</li>)}</ul> : <p className="mt-3 text-sm text-zinc-500">이 Recipe는 추가 승인 항목이 없습니다.</p>}</section><section><h3 className="text-sm font-semibold text-white">추천 실행 엔진</h3><div className="mt-3 grid gap-2">{buildPackage.engineCompatibility.filter((item) => item.supported).map((item) => <button key={item.engine} type="button" onClick={() => onEngineSelect(item.engine)} className={`border p-4 text-left ${item.engine === buildPackage.selectedEngine ? "border-emerald-200 bg-emerald-200/5" : "border-zinc-800 bg-[#0b1514] hover:border-emerald-200/50"}`}><div className="flex items-center justify-between gap-4"><span className="text-sm font-semibold text-white">{item.engine}{item.engine === buildPackage.selectedEngine ? " - 추천" : ""}</span><span className="text-xs text-emerald-100">적합도 {item.compatibilityScore}</span></div><p className="mt-2 text-xs leading-5 text-zinc-400">{item.reasons.join(" ")}</p>{item.limitations.map((limitation) => <p key={limitation} className="mt-2 text-xs leading-5 text-amber-100">주의: {limitation}</p>)}</button>)}</div></section><section><h3 className="text-sm font-semibold text-white">추가로 필요한 정보</h3>{buildPackage.missingInformation.length ? <ol className="mt-3 grid gap-2">{buildPackage.missingInformation.map((item, index) => <ClarificationQuestion key={item.id} index={index} id={item.id} question={item.question} onAnswer={onAnswerClarification} />)}</ol> : <p role="status" className="mt-3 border border-emerald-200/30 bg-emerald-200/5 px-4 py-3 text-sm text-emerald-100">모든 정보가 준비되었습니다. Recipe 구성이 완성되었습니다.</p>}</section></div>
      <div className="space-y-7"><section><h3 className="text-sm font-semibold text-white">필요한 연결</h3><div className="mt-3 grid gap-2">{buildPackage.connections.map((connection) => <div key={connection.serviceId} className="flex items-start gap-3 border border-zinc-800 bg-[#0b1514] px-4 py-3"><span className={connection.status === "READY" ? "text-emerald-200" : "text-amber-100"}>{connection.status === "READY" ? "✓" : "○"}</span><div><p className="text-sm font-medium text-zinc-100">{connection.title} {connection.status === "READY" ? "- 연결 불필요" : "- 연결 필요"}</p><p className="mt-1 text-xs leading-5 text-zinc-400">{connection.reason} · {connection.connectionType}</p></div></div>)}</div></section><section><h3 className="text-sm font-semibold text-white">BuildFlow가 구성할 항목</h3><div className="mt-3 grid gap-2">{buildPackage.configurationRequirements.map((item) => <div key={item.id} className="border border-zinc-800 bg-[#0b1514] px-4 py-3"><p className="text-sm font-medium text-zinc-100">{item.label}</p><p className="mt-1 text-xs leading-5 text-zinc-400">기본값: {item.defaultValue ?? "UNKNOWN"} · {item.userInputRequired ? "사용자 입력 필요" : "BuildFlow 준비 가능"}</p></div>)}</div></section><section><h3 className="text-sm font-semibold text-white">테스트 계획</h3><ol className="mt-3 grid gap-2">{buildPackage.testPlan.map((item, index) => <li key={item.id} className="border border-zinc-800 bg-[#0b1514] px-4 py-3 text-sm leading-6 text-zinc-300">{index + 1}. {item.label}<span className="ml-2 text-xs text-zinc-500">{item.status}</span></li>)}</ol></section></div></div>
    {buildPackage.recipeId === "recipe.ai-news-slack-digest" && <section className="mt-8 border-t border-zinc-800 pt-6"><h3 className="text-sm font-semibold text-white">Recipe 실행</h3><p className="mt-2 text-sm leading-6 text-zinc-400">승인 전에는 어떤 외부 호출도 일어나지 않습니다. 아래에서 실행 대상을 먼저 확인하세요.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={onPrepareDigestRun} disabled={digestRunning} className="min-h-11 bg-emerald-200 px-5 text-sm font-semibold text-[#09201b] disabled:cursor-not-allowed disabled:opacity-40">Recipe 실행 준비</button></div>
      {digestPreview && (digestPreview.ok
        ? <div className="mt-4 border border-emerald-200/30 bg-emerald-200/5 p-4"><p className="text-sm text-emerald-100">작업: AI 뉴스 수집 → Groq 요약 → Slack 전송</p><p className="mt-1 text-sm text-emerald-100">대상: Slack 채널 <span className="font-mono">{digestPreview.targetConfigurationReference}</span></p><button type="button" onClick={onApproveDigestRun} disabled={digestRunning} className="mt-4 min-h-11 border border-amber-200/60 px-5 text-sm font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-40">{digestRunning ? "실행 중..." : "실행 승인"}</button></div>
        : <p role="status" className="mt-4 border border-amber-200/30 bg-amber-200/5 p-4 text-sm text-amber-100">{digestGateErrorLabel[digestPreview.errorCode]}</p>)}
      {(digestSteps.length > 0 || digestRunning) && <ol aria-live="polite" className="mt-4 grid gap-2">{digestSteps.map((step) => <li key={step.label} className="flex items-center gap-3 border border-emerald-200/20 bg-emerald-200/5 px-4 py-3 text-sm text-emerald-100"><span>✓</span><span>{step.label} — {step.detail} <span className="text-emerald-200/70">({step.service})</span></span></li>)}{digestRunning && digestSteps.length < 3 && <li className="flex items-center gap-3 border border-zinc-800 bg-[#0b1514] px-4 py-3 text-sm text-zinc-300"><span>○</span><span>{["1. 뉴스 수집", "2. AI 요약", "3. Slack 전송"][digestSteps.length]} 진행 중...</span></li>}</ol>}
      {digestRunResult && (digestRunResult.ok
        ? <div className="mt-4 border border-emerald-200/30 bg-emerald-200/5 p-4"><p className="text-sm font-semibold text-emerald-100">실행 완료 (성공)</p><dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-emerald-100"><div><dt className="text-emerald-200/70">사용 서비스</dt><dd className="mt-1">OpenAI News RSS, Groq, Slack (Pipedream)</dd></div><div><dt className="text-emerald-200/70">완료 시각</dt><dd className="mt-1">{digestEvidence && new Date(digestEvidence.completedAt ?? digestEvidence.requestedAt).toLocaleString("ko-KR")}</dd></div><div><dt className="text-emerald-200/70">결과</dt><dd className="mt-1">뉴스 {digestRunResult.selectedItemCount}건, 요약 {digestRunResult.summaryLineCount}줄</dd></div><div><dt className="text-emerald-200/70">Slack 참조</dt><dd className="mt-1 font-mono">{digestRunResult.safeSlackReference}</dd></div></dl></div>
        : <p role="status" className="mt-4 border border-amber-200/30 bg-amber-200/5 p-4 text-sm text-amber-100">실행 실패: {digestGateErrorLabel[digestRunResult.errorCode]}</p>)}
    </section>}
    {buildPackage.connections.some((connection) => connection.serviceId === "slack") && <section className="mt-8 border-t border-zinc-800 pt-6"><h3 className="text-sm font-semibold text-white">Slack Live 연결</h3><p className="mt-2 text-sm leading-6 text-zinc-400">연결 코드는 준비되었지만 현재 실제 연결과 쓰기는 비활성화되어 있습니다.</p><div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={onStartConnection} className="min-h-11 bg-emerald-200 px-5 text-sm font-semibold text-[#09201b]">Slack 연결</button><button type="button" onClick={onPrepareTestWrite} className="min-h-11 border border-emerald-200/50 px-5 text-sm font-semibold text-emerald-100">Test message</button>{awaitingTestWriteApproval && <button type="button" onClick={onApproveTestWrite} className="min-h-11 border border-amber-200/60 px-5 text-sm font-semibold text-amber-100">전송 승인</button>}</div><p className="mt-3 text-xs leading-5 text-zinc-500">OAuth, credential 저장, workflow 생성, 외부 실행은 별도 Live 승인 전까지 수행하지 않습니다.</p>{connectionNotice && <p role="status" className="mt-4 border border-amber-200/30 bg-amber-200/5 p-4 text-sm text-amber-100">{connectionNotice}</p>}{testWriteNotice && <p role="status" className="mt-3 border border-amber-200/30 bg-amber-200/5 p-4 text-sm text-amber-100">{testWriteNotice}</p>}</section>}</section>;
}
