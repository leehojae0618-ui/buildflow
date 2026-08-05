"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import {
  BF0_APPROVAL_OPTIONS,
  BF0_GOAL_OPTIONS,
  BF0_IDEA_EXAMPLES,
  BF0_OUTPUT_OPTIONS,
  BF0_SOURCE_OPTIONS,
  EMPTY_BF0_DRAFT,
  buildBuildPlan,
  buildNavigatorSummary,
  buildWorkflowDraft,
  clampStepIndex,
  extractRequirementCandidates,
  getActiveRequirements,
  getCompletionCopy,
  getCostAndAccessSummary,
  getFirstIncompleteRoute,
  getIdeaValidationError,
  getRequirementGaps,
  getStepProgressSummary,
  getUnresolvedQuestions,
  normalizeIdea,
  type Bf0ChoiceOption,
  type Bf0DesignDraft,
  type Bf0Route,
  type Bf0RequirementCandidate,
  type Bf0RequirementKind,
  type Bf0StepProgress,
} from "../bf0-view-model";
import { Bf0BuildPlanScreen } from "./bf0-build-plan-screen";
import { Bf0NavigatorPreviewScreen } from "./bf0-navigator-preview";
import { Bf0ActionFooter, Bf0Brand, Bf0ProgressHeader } from "./bf0-shared";
import { Bf0StepMode } from "./bf0-step-mode";

const onboardingSlides = [
  { title: "아이디어를 말하세요", description: "하고 싶은 일을 평소 말하듯 입력하면 BuildFlow가 요청의 목적부터 정리합니다.", glyph: "✦" },
  { title: "필요한 것만 묻습니다", description: "입력 위치, 승인 방식, 결과 전달처처럼 설계에 필요한 결정만 한 페이지씩 확인합니다.", glyph: "↗" },
  { title: "실행을 준비하는 설계 초안으로 정리합니다", description: "작동 흐름, 필요한 권한, 예상 비용과 구축 순서를 확인한 뒤 다음 단계를 검토합니다.", glyph: "✓" },
];

export function Bf0ProductExperience() {
  const [route, setRoute] = useState<Bf0Route>("onboarding");
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [draft, setDraft] = useState<Bf0DesignDraft>(EMPTY_BF0_DRAFT);
  const [ideaInput, setIdeaInput] = useState("");
  const [ideaError, setIdeaError] = useState<string | null>(null);
  const [submittingIdea, setSubmittingIdea] = useState(false);
  const [customGoal, setCustomGoal] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [customOutput, setCustomOutput] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState<Record<string, Bf0StepProgress>>({});
  const submissionLocked = useRef(false);

  const workflow = useMemo(() => buildWorkflowDraft(draft), [draft]);
  const buildPlan = useMemo(() => buildBuildPlan(draft), [draft]);
  const costAndAccess = useMemo(() => getCostAndAccessSummary(draft), [draft]);
  const completion = useMemo(() => getCompletionCopy(draft), [draft]);
  const activeRequirements = useMemo(() => getActiveRequirements(draft), [draft]);
  const requirementGaps = useMemo(() => getRequirementGaps(activeRequirements), [activeRequirements]);
  const navigatorPreview = useMemo(() => buildNavigatorSummary(draft), [draft]);
  const stepSummary = useMemo(() => getStepProgressSummary(buildPlan, stepProgress), [buildPlan, stepProgress]);
  const safeStepIndex = clampStepIndex(stepIndex, buildPlan.length);

  const navigate = (target: Bf0Route) => {
    const firstIncomplete = getFirstIncompleteRoute(draft);
    const protectedRoutes: Bf0Route[] = ["workflow", "access", "plan", "step", "complete"];
    if (protectedRoutes.includes(target) && firstIncomplete !== "workflow") {
      setRoute(firstIncomplete);
      return;
    }
    if (target === "idea") {
      submissionLocked.current = false;
      setSubmittingIdea(false);
    }
    if (target === "step") setStepIndex(0);
    setRoute(target);
  };

  const choose = (key: keyof Pick<Bf0DesignDraft, "goal" | "source" | "approval" | "output">, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submitIdea = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionLocked.current) return;
    const normalized = normalizeIdea(ideaInput);
    const error = getIdeaValidationError(normalized);
    if (error) {
      setIdeaError(error);
      return;
    }
    submissionLocked.current = true;
    setSubmittingIdea(true);
    const requirementCandidates = extractRequirementCandidates(normalized);
    setDraft({ ...EMPTY_BF0_DRAFT, idea: normalized, originalIdea: normalized, requirementCandidates, userEditedRequirements: requirementCandidates, hasUserEditedRequirements: true, unsupportedRequirements: getRequirementGaps(requirementCandidates), unresolvedQuestions: getUnresolvedQuestions(requirementCandidates) });
    setCustomGoal("");
    setCustomSource("");
    setCustomOutput("");
    setStepProgress({});
    setStepIndex(0);
    setRoute("navigator");
  };

  const updateRequirement = (id: string, value: string) => setDraft((current) => {
    const requirements = getActiveRequirements(current).map((item) => item.id === id ? { ...item, value } : item);
    return { ...current, userEditedRequirements: requirements, hasUserEditedRequirements: true, unsupportedRequirements: getRequirementGaps(requirements), unresolvedQuestions: getUnresolvedQuestions(requirements) };
  });

  const removeRequirement = (id: string) => setDraft((current) => {
    const requirements = getActiveRequirements(current).filter((item) => item.id !== id);
    return { ...current, userEditedRequirements: requirements, hasUserEditedRequirements: true, unsupportedRequirements: getRequirementGaps(requirements), unresolvedQuestions: getUnresolvedQuestions(requirements) };
  });

  const addRequirement = (kind: Bf0RequirementKind, value: string) => setDraft((current) => {
    const support = kind === "constraint" ? "표준 선택으로 표현 가능" : kind === "source" || kind === "destination" ? "추가 연결 필요" : "기준 추가 확인 필요";
    const item: Bf0RequirementCandidate = { id: `user-${kind}-${Date.now()}`, kind, label: "사용자가 추가한 요구", value, sourceText: current.originalIdea ?? current.idea, support, confidence: "높음", editable: true };
    const requirements = [...getActiveRequirements(current), item];
    return { ...current, userEditedRequirements: requirements, hasUserEditedRequirements: true, unsupportedRequirements: getRequirementGaps(requirements), unresolvedQuestions: getUnresolvedQuestions(requirements) };
  });

  const restart = () => {
    submissionLocked.current = false;
    setDraft(EMPTY_BF0_DRAFT);
    setIdeaInput("");
    setIdeaError(null);
    setCustomGoal("");
    setCustomSource("");
    setCustomOutput("");
    setSubmittingIdea(false);
    setStepProgress({});
    setStepIndex(0);
    setOnboardingIndex(0);
    setRoute("idea");
  };

  return <main className="min-h-screen overflow-x-hidden bg-[#050812] text-slate-100">
    {route === "onboarding" && <OnboardingScreen
      index={onboardingIndex}
      onSelect={setOnboardingIndex}
      onSkip={() => navigate("idea")}
      onNext={() => onboardingIndex === onboardingSlides.length - 1 ? navigate("idea") : setOnboardingIndex((index) => index + 1)}
    />}
    {route === "idea" && <IdeaScreen
      value={ideaInput}
      error={ideaError}
      submitting={submittingIdea}
      onChange={(value) => { setIdeaInput(value); setIdeaError(null); }}
      onExample={(value) => { setIdeaInput(value); setIdeaError(null); }}
      onSubmit={submitIdea}
      onBack={() => navigate("onboarding")}
    />}
    {route === "navigator" && <Bf0NavigatorPreviewScreen preview={navigatorPreview} requirements={activeRequirements} gaps={requirementGaps} onBack={() => navigate("idea")} onConfirm={() => navigate("goal")} onUpdateRequirement={updateRequirement} onRemoveRequirement={removeRequirement} onAddRequirement={addRequirement} />}
    {route === "goal" && <ChoiceScreen
      route={route}
      eyebrow="01 · 목표"
      title="가장 중요한 결과는 무엇인가요?"
      description="처음 입력한 아이디어에서 우선할 결과 하나만 선택합니다."
      prompt={draft.idea}
      options={BF0_GOAL_OPTIONS}
      value={draft.goal}
      onSelect={(value) => { setCustomGoal(""); choose("goal", value); }}
      customValue={customGoal}
      customLabel="다른 목표 직접 입력"
      onCustomChange={(value) => { setCustomGoal(value); choose("goal", normalizeIdea(value)); }}
      onBack={() => navigate("idea")}
      onNext={() => navigate("source")}
      nextLabel="다음"
    />}
    {route === "source" && <ChoiceScreen
      route={route}
      eyebrow="02 · 입력"
      title="정보는 어디에서 들어오나요?"
      description="자동 설계가 시작되는 입력 위치를 선택합니다. 실제 연결은 이 화면에서 수행하지 않습니다."
      options={BF0_SOURCE_OPTIONS}
      value={draft.source}
      onSelect={(value) => { setCustomSource(""); choose("source", value); }}
      customValue={customSource}
      customLabel="직접 입력 위치 적기"
      onCustomChange={(value) => { setCustomSource(value); choose("source", normalizeIdea(value)); }}
      onBack={() => navigate("goal")}
      onNext={() => navigate("approval")}
      nextLabel="다음"
    />}
    {route === "approval" && <ChoiceScreen
      route={route}
      eyebrow="03 · 확인"
      title="실행 전에 확인할까요?"
      description="외부 작업이 생길 경우의 통제 방식을 설계합니다. 이 선택은 실제 실행 허가가 아닙니다."
      options={BF0_APPROVAL_OPTIONS}
      value={draft.approval}
      onSelect={(value) => choose("approval", value)}
      onBack={() => navigate("source")}
      onNext={() => navigate("output")}
      nextLabel="다음"
    />}
    {route === "output" && <ChoiceScreen
      route={route}
      eyebrow="04 · 결과"
      title="결과는 어디로 보낼까요?"
      description="결과를 전달하거나 보관할 위치를 선택합니다. 현재 연결 상태와 설계 선택은 구분됩니다."
      options={BF0_OUTPUT_OPTIONS}
      value={draft.output}
      onSelect={(value) => { setCustomOutput(""); choose("output", value); }}
      customValue={customOutput}
      customLabel="직접 결과 위치 적기"
      onCustomChange={(value) => { setCustomOutput(value); choose("output", normalizeIdea(value)); }}
      onBack={() => navigate("approval")}
      onNext={() => navigate("workflow")}
      nextLabel="설계 보기"
    />}
    {route === "workflow" && <WorkflowScreen workflow={workflow} preview={navigatorPreview} requirements={activeRequirements} onBack={() => navigate("output")} onNext={() => navigate("access")} />}
    {route === "access" && <AccessScreen summary={costAndAccess} route={route} onBack={() => navigate("workflow")} onNext={() => navigate("plan")} />}
    {route === "plan" && <Bf0BuildPlanScreen items={buildPlan} summary={completion.flow} onBack={() => navigate("access")} onNavigate={navigate} onNext={() => navigate("complete")} onStartStepMode={() => navigate("step")} />}
    {route === "step" && <Bf0StepMode items={buildPlan} index={safeStepIndex} progress={stepProgress} onBack={() => safeStepIndex === 0 ? navigate("plan") : setStepIndex((index) => index - 1)} onNext={() => safeStepIndex === buildPlan.length - 1 ? navigate("complete") : setStepIndex((index) => index + 1)} onShowPlan={() => navigate("plan")} onProgress={(id, value) => setStepProgress((current) => ({ ...current, [id]: value }))} />}
    {route === "complete" && <CompletionScreen completion={completion} requirements={activeRequirements} gaps={requirementGaps} unresolvedQuestions={completion.unresolvedQuestions} stepSummary={stepSummary} onRestart={restart} onEditRequirements={() => navigate("navigator")} onPlan={() => navigate("plan")} />}
  </main>;
}

function OnboardingScreen({ index, onSelect, onSkip, onNext }: { index: number; onSelect: (index: number) => void; onSkip: () => void; onNext: () => void }) {
  const slide = onboardingSlides[index];
  return <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
    <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(92,109,255,.18),transparent_36%),linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.015)_1px,transparent_1px)] bg-[length:auto,72px_72px,72px_72px]" />
    <button type="button" onClick={onSkip} className="absolute right-5 top-5 min-h-[44px] rounded-xl px-3 text-sm text-slate-400 underline-offset-4 hover:text-cyan-100 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 sm:right-8 sm:top-8">아이디어 입력으로</button>
    <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
      <Bf0Brand />
      <div className="mx-auto mt-14 grid size-44 place-items-center rounded-[2.5rem] border border-violet-300/25 bg-violet-300/10 text-6xl text-violet-100 shadow-[0_0_80px_rgba(123,97,255,.15)]" aria-hidden="true">{slide.glyph}</div>
      <p className="mt-12 text-xs font-medium tracking-[0.28em] text-cyan-200">BUILD WITH CLARITY</p>
      <h1 className="mx-auto mt-5 max-w-[13ch] break-keep text-balance text-4xl font-semibold tracking-tight text-white sm:max-w-none sm:text-5xl">{slide.title}</h1>
      <p className="mx-auto mt-5 max-w-[34ch] break-keep text-balance text-base leading-8 text-slate-300 sm:max-w-xl sm:text-lg">{slide.description}</p>
      <div className="mt-12 flex items-center justify-center gap-3" aria-label="온보딩 단계">
        {onboardingSlides.map((item, itemIndex) => <button key={item.title} type="button" onClick={() => onSelect(itemIndex)} aria-label={`${itemIndex + 1}단계: ${item.title}`} aria-current={index === itemIndex ? "step" : undefined} className={`min-h-[44px] min-w-[44px] rounded-full p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 ${index === itemIndex ? "text-cyan-100" : "text-slate-500"}`}><span className={`block h-2 rounded-full transition-all ${index === itemIndex ? "w-8 bg-cyan-200" : "w-2 bg-slate-600"}`} /></button>)}
      </div>
      <button type="button" onClick={onNext} className="mt-6 min-h-[52px] rounded-2xl border border-cyan-200/50 bg-cyan-300/15 px-7 text-sm font-semibold text-cyan-50 shadow-[0_10px_30px_rgba(34,211,238,.12)] transition hover:bg-cyan-300/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">{index === onboardingSlides.length - 1 ? "아이디어 입력하기" : "다음"} <span aria-hidden="true">→</span></button>
    </div>
  </section>;
}

function IdeaScreen({ value, error, submitting, onChange, onExample, onSubmit, onBack }: { value: string; error: string | null; submitting: boolean; onChange: (value: string) => void; onExample: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onBack: () => void }) {
  return <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
    <ParticleField />
    <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
      <button type="button" onClick={onBack} className="absolute -top-10 left-0 min-h-[44px] rounded-xl px-2 text-sm text-slate-400 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">← 온보딩</button>
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-8 -z-10 -translate-x-1/2 select-none text-[15rem] font-semibold leading-none text-violet-200/[0.045] sm:text-[22rem]">B</div>
      <Bf0Brand />
      <p className="mt-16 text-xs font-medium tracking-[0.28em] text-cyan-200">IDEA TO DESIGN DRAFT</p>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">무엇을 만들고 싶나요?</h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">완성된 문장일 필요는 없습니다. 하고 싶은 일을 편하게 입력하면 설계에 필요한 선택을 하나씩 정리합니다.</p>
      <div className="mt-9" aria-label="아이디어 예시">
        <div className="flex flex-wrap justify-center gap-2">{BF0_IDEA_EXAMPLES.map((example) => <button key={example} type="button" onClick={() => onExample(example)} className="min-h-[44px] max-w-full break-keep rounded-full border border-slate-700/80 bg-slate-950/65 px-4 py-2 text-sm leading-5 text-slate-300 transition hover:border-cyan-200/50 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">{example}</button>)}</div>
      </div>
      <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-2xl text-left">
        <label htmlFor="bf0-idea" className="sr-only">아이디어 입력</label>
        <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-700 bg-slate-950/85 p-2 shadow-[0_0_90px_rgba(69,113,255,.12)] focus-within:border-cyan-200/70">
          <span aria-hidden="true" className="pl-3 text-xl text-cyan-100">✦</span>
          <input id="bf0-idea" value={value} onChange={(event) => onChange(event.target.value)} maxLength={280} placeholder="무엇을 만들고 싶나요?" aria-invalid={error ? true : undefined} aria-describedby={error ? "bf0-idea-error" : undefined} className="min-h-[52px] min-w-0 flex-1 bg-transparent px-1 text-base text-white outline-none placeholder:text-slate-500" />
          <button type="submit" disabled={submitting} className="grid size-[52px] shrink-0 place-items-center rounded-2xl bg-cyan-200 text-lg font-bold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200" aria-label="설계 시작">→</button>
        </div>
        <div className="mt-3 flex justify-between gap-4"><p id="bf0-idea-error" role="alert" className="text-sm text-rose-200">{error}</p><p className="shrink-0 text-xs text-slate-500">{value.length} / 280</p></div>
      </form>
      <p className="mt-8 text-sm text-slate-500">입력한 내용은 이 브라우저 세션의 설계 초안에만 반영됩니다. 서버에 저장하거나 실행하지 않습니다.</p>
    </div>
  </section>;
}

function ParticleField() {
  const particles = ["left-[12%] top-[17%]", "left-[24%] top-[66%]", "right-[17%] top-[22%]", "right-[11%] top-[72%]", "left-[43%] top-[10%]", "right-[38%] top-[48%]"];
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(70,100,255,.2),transparent_35%)]" />{particles.map((position, index) => <span key={position} className={`absolute ${position} size-1.5 rounded-full bg-cyan-100/70 shadow-[0_0_20px_rgba(165,243,252,.8)] motion-safe:animate-[pulse_3s_ease-in-out_infinite] motion-reduce:hidden`} style={{ animationDelay: `${index * 240}ms` }} />)}</div>;
}

function ChoiceScreen({ route, eyebrow, title, description, options, value, prompt, customValue, customLabel, onSelect, onCustomChange, onBack, onNext, nextLabel }: { route: Bf0Route; eyebrow: string; title: string; description: string; options: Bf0ChoiceOption[]; value: string | null; prompt?: string; customValue?: string; customLabel?: string; onSelect: (value: string) => void; onCustomChange?: (value: string) => void; onBack: () => void; onNext: () => void; nextLabel: string }) {
  return <section className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(54,79,187,.14),transparent_34%)]"><Bf0ProgressHeader route={route} onBack={onBack} /><div className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-28 pt-14 sm:px-8"><main className="mx-auto w-full max-w-[920px]"><p className="text-xs font-medium tracking-[0.26em] text-cyan-200">{eyebrow}</p><h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-[17px]">{description}</p>{prompt && <p className="mt-7 rounded-2xl border border-cyan-200/15 bg-cyan-200/5 px-5 py-4 text-sm text-cyan-50">“{prompt}”</p>}<ChoiceGrid options={options} value={value} onSelect={onSelect} />{customLabel && onCustomChange && <label className="mt-5 block rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-300"><span className="block font-medium text-slate-100">{customLabel}</span><input value={customValue ?? ""} onChange={(event) => onCustomChange(event.target.value)} maxLength={120} placeholder="예: 매일 핵심 지표를 알려주기" className="mt-3 min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-slate-100 outline-none focus:border-cyan-200" /></label>}</main><Bf0ActionFooter backLabel="이전" nextLabel={nextLabel} disabled={!value} onBack={onBack} onNext={onNext} /></div></section>;
}

function ChoiceGrid({ options, value, onSelect }: { options: Bf0ChoiceOption[]; value: string | null; onSelect: (value: string) => void }) {
  return <div className="mt-9 grid gap-4 sm:grid-cols-2" role="group" aria-label="선택 항목">{options.map((option) => { const selected = value === option.value; return <button key={option.value} type="button" onClick={() => onSelect(option.value)} aria-pressed={selected} className={`min-h-[150px] rounded-3xl border p-6 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 ${selected ? "border-cyan-200 bg-cyan-200/10 shadow-[0_0_30px_rgba(103,232,249,.08)]" : "border-slate-800 bg-slate-950/65 hover:border-slate-600"}`}><div className="flex items-start justify-between gap-4"><span className="grid size-10 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-cyan-100" aria-hidden="true">{selected ? "✓" : "○"}</span>{option.status && <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-300">{option.status}</span>}</div><strong className="mt-5 block text-base text-white">{option.title}</strong><span className="mt-2 block text-sm leading-6 text-slate-400">{option.description}</span></button>; })}</div>;
}

function WorkflowScreen({ workflow, preview, requirements, onBack, onNext }: { workflow: ReturnType<typeof buildWorkflowDraft>; preview: ReturnType<typeof buildNavigatorSummary>; requirements: Bf0RequirementCandidate[]; onBack: () => void; onNext: () => void }) {
  return <section className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,.16),transparent_36%)]"><Bf0ProgressHeader route="workflow" onBack={onBack} /><div className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-28 pt-14 sm:px-8"><main className="mx-auto w-full max-w-[1040px]"><p className="text-xs font-medium tracking-[0.26em] text-cyan-200">05 · 작동 흐름</p><h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">BuildFlow 추천 경로를 선택에 맞춰 정리했습니다</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-[17px]">기술 용어 대신 사용자가 확인할 수 있는 순서만 보여드립니다. 이 흐름은 실행 계획이 아닌 설계 초안입니다.</p><section className="mt-8 rounded-2xl border border-violet-200/20 bg-violet-200/5 p-5"><p className="text-xs font-medium tracking-[0.2em] text-violet-100">추천 경로</p><ol className="mt-3 flex flex-wrap items-center gap-2 text-sm leading-7 text-slate-200">{preview.recommendedPath.map((part, index) => <li key={`${part}-${index}`} className="flex items-center gap-2"><span>{part}</span>{index < preview.recommendedPath.length - 1 && <span aria-hidden="true">→</span>}</li>)}</ol><p className="mt-3 text-sm leading-6 text-slate-400">필요한 계정: {preview.requiredAccounts.join(" · ")}</p><details className="mt-4 rounded-xl border border-violet-200/15 px-4 py-3"><summary className="cursor-pointer text-sm font-medium text-violet-100">다른 방법 보기</summary><p className="mt-3 text-sm leading-6 text-slate-400">더 쉬운 방법이나 더 적은 운영 비용을 목표로 하는 방법은 입력 위치·승인 수준·결과 위치를 바꿔 비교할 수 있습니다. 실제 지원과 가격은 확인되지 않았습니다.</p></details></section><section className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5"><h2 className="text-sm font-medium text-white">핵심 조건</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">{requirements.map((requirement) => <li key={requirement.id} className="flex flex-wrap items-center gap-x-2 gap-y-1"><span>• {requirement.value}</span><span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-400">{requirement.support}</span></li>)}</ul></section><div className="mt-10 grid gap-4 lg:grid-cols-4">{workflow.map((stage, index) => <article key={stage.label} className="relative min-h-[210px] rounded-3xl border border-slate-800 bg-slate-950/70 p-6"><span className="text-xs font-medium tracking-[0.2em] text-cyan-200">0{index + 1} · {stage.label}</span><h2 className="mt-5 text-lg font-semibold text-white">{stage.value}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{stage.description}</p></article>)}</div><p className="mt-7 rounded-2xl border border-violet-300/20 bg-violet-300/5 px-5 py-4 text-sm text-violet-100">선택한 입력·승인·결과 위치는 아직 연결되지 않았으며, 실제 실행은 시작되지 않았습니다.</p></main><Bf0ActionFooter backLabel="수정하기" nextLabel="비용과 권한 확인" onBack={onBack} onNext={onNext} /></div></section>;
}

function AccessScreen({ summary, route, onBack, onNext }: { summary: ReturnType<typeof getCostAndAccessSummary>; route: Bf0Route; onBack: () => void; onNext: () => void }) {
  return <section className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(15,118,110,.14),transparent_36%)]"><Bf0ProgressHeader route={route} onBack={onBack} /><div className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-28 pt-14 sm:px-8"><main className="mx-auto w-full max-w-[920px]"><p className="text-xs font-medium tracking-[0.26em] text-cyan-200">06 · 비용과 권한</p><h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">시작 전에 필요한 것만 확인합니다</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-[17px]">현재는 설계 단계입니다. 비용과 권한은 실제 Provider와 서비스 연결을 검토한 뒤에만 확정할 수 있습니다.</p><div className="mt-9 grid gap-4 lg:grid-cols-2"><section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6"><p className="text-xs font-medium tracking-[0.22em] text-cyan-200">비용</p><h2 className="mt-3 text-xl font-semibold text-white">현재 구성 기준</h2><dl className="mt-5 divide-y divide-slate-800">{summary.costRows.map(([label, detail]) => <div key={label} className="py-4"><dt className="text-sm text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium text-slate-100">{detail}</dd></div>)}</dl></section><section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6"><p className="text-xs font-medium tracking-[0.22em] text-cyan-200">권한</p><h2 className="mt-3 text-xl font-semibold text-white">필요 시 별도 확인</h2><dl className="mt-5 divide-y divide-slate-800">{summary.permissionRows.map(({ id, label, detail }) => <div key={id} className="py-4"><dt className="text-sm font-medium text-slate-100">{label}</dt><dd className="mt-1 text-sm leading-6 text-slate-400">{detail}</dd></div>)}</dl></section></div></main><Bf0ActionFooter backLabel="이전" nextLabel="구축 계획 보기" onBack={onBack} onNext={onNext} /></div></section>;
}

function CompletionScreen({ completion, requirements, gaps, unresolvedQuestions, stepSummary, onRestart, onEditRequirements, onPlan }: { completion: ReturnType<typeof getCompletionCopy>; requirements: Bf0RequirementCandidate[]; gaps: Bf0RequirementCandidate[]; unresolvedQuestions: string[]; stepSummary: ReturnType<typeof getStepProgressSummary>; onRestart: () => void; onEditRequirements: () => void; onPlan: () => void }) {
  return <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(93,125,255,.2),transparent_33%)]" /><div className="relative z-10 mx-auto w-full max-w-[740px] rounded-[2rem] border border-slate-700/80 bg-slate-950/85 p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,.35)] sm:p-10"><Bf0Brand /><div aria-hidden="true" className="mx-auto mt-9 grid size-20 place-items-center rounded-full border border-cyan-200/40 bg-cyan-200/10 text-3xl text-cyan-100">✓</div><p className="mt-7 text-xs font-medium tracking-[0.25em] text-cyan-200">DESIGN DRAFT</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{completion.title}</h1><div className="mt-5 grid gap-2 text-left text-sm leading-6 text-slate-300">{completion.lines.map((line) => <p key={line} className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">{line}</p>)}</div>{unresolvedQuestions.length > 0 && <section className="mt-6 rounded-2xl border border-amber-200/20 bg-amber-200/5 p-5 text-left"><h2 className="text-sm font-medium text-amber-100">아직 확인이 필요한 항목</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-200">{unresolvedQuestions.map((question) => <li key={question} className="break-words">• {question}</li>)}</ul></section>}{gaps.length > 0 && <section className="mt-4 rounded-2xl border border-violet-200/20 bg-violet-200/5 p-5 text-left"><h2 className="text-sm font-medium text-violet-100">별도 연결 또는 도구가 필요한 요구</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-200">{gaps.map((requirement) => <li key={requirement.id} className="break-words">• {requirement.value} · {requirement.support}</li>)}</ul></section>}<dl className="mt-7 overflow-hidden rounded-2xl border border-slate-800 text-left text-sm"><div className="grid gap-1 border-b border-slate-800 p-4 sm:grid-cols-[150px_1fr]"><dt className="text-slate-500">사용자 완료 표시</dt><dd className="text-slate-100">{stepSummary.userReportedComplete}단계</dd></div><div className="grid gap-1 border-b border-slate-800 p-4 sm:grid-cols-[150px_1fr]"><dt className="text-slate-500">남은 단계</dt><dd className="text-slate-100">{stepSummary.remaining}단계</dd></div><div className="grid gap-1 border-b border-slate-800 p-4 sm:grid-cols-[150px_1fr]"><dt className="text-slate-500">자동 검증 상태</dt><dd className="text-slate-100">{completion.actualVerificationState}</dd></div><div className="grid gap-1 border-b border-slate-800 p-4 sm:grid-cols-[150px_1fr]"><dt className="text-slate-500">실제 외부 연결</dt><dd className="text-slate-100">{completion.externalConnectionState}</dd></div><div className="grid gap-1 border-b border-slate-800 p-4 sm:grid-cols-[150px_1fr]"><dt className="text-slate-500">보존된 요구</dt><dd className="text-slate-100">{requirements.length}개</dd></div><div className="grid gap-1 p-4 sm:grid-cols-[150px_1fr]"><dt className="text-slate-500">작동 흐름</dt><dd className="break-words text-slate-100">{completion.flow}</dd></div></dl><p className="mt-5 text-sm leading-6 text-slate-400">사용자가 모든 단계를 표시했더라도 실제 연결과 작동은 아직 자동 검증되지 않았습니다.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={onEditRequirements} className="min-h-[48px] rounded-xl border border-slate-700 px-5 text-sm font-medium text-slate-200 hover:border-cyan-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">확인 항목 수정하기</button><button type="button" onClick={onPlan} className="min-h-[48px] rounded-xl border border-cyan-200/45 bg-cyan-200/10 px-5 text-sm font-semibold text-cyan-50 hover:bg-cyan-200/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">전체 계획 보기</button><button type="button" onClick={onRestart} className="min-h-[48px] rounded-xl border border-slate-700 px-5 text-sm font-medium text-slate-200 hover:border-cyan-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">처음부터 다시 시작</button></div></div></section>;
}
