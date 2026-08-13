"use client";

import { useState } from "react";
import type { Bf0BuildPlanItem, Bf0InputTarget, Bf0Route } from "../bf0-view-model";
import { Bf0ActionFooter, Bf0ProgressHeader } from "./bf0-shared";

const stateTextClass: Record<Bf0BuildPlanItem["state"], string> = {
  "설계 초안": "text-cyan-100",
  "연결 필요": "text-amber-100",
  "구축 가이드": "text-violet-100",
  "현재 미지원": "text-rose-100",
  "검증 필요": "text-orange-100",
};

const verificationCopy: Record<Bf0InputTarget["verificationState"], string> = {
  OFFICIAL_VERIFIED: "공식 안내 기준",
  NOT_VERIFIED: "화면 위치 확인 필요",
};

export function Bf0BuildPlanScreen({
  items,
  summary,
  onBack,
  onNavigate,
  onNext,
  onStartStepMode,
}: {
  items: Bf0BuildPlanItem[];
  summary: string;
  onBack: () => void;
  onNavigate: (route: Bf0Route) => void;
  onNext: () => void;
  onStartStepMode: () => void;
}) {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const toggle = (id: string) => setOpenIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const openNext = (id?: string) => {
    if (!id) return;
    setOpenIds((current) => current.includes(id) ? current : [...current, id]);
    setTimeout(() => document.getElementById(`bf0-plan-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" }), 0);
  };

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(95,75,220,.14),transparent_40%)]">
      <Bf0ProgressHeader route="plan" onBack={onBack} />
      <div className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-28 pt-14 sm:px-8">
        <main className="mx-auto w-full max-w-[920px]">
          <p className="text-sm font-medium text-cyan-200">구축 지도</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">{items.length}단계면 준비됩니다</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">이 순서대로 하나씩 진행하면 됩니다. 자세한 설명은 필요할 때만 열어보세요.</p>
          <section className="mt-7 rounded-2xl bg-cyan-200/5 p-5" aria-label="현재 설계 요약">
            <p className="text-sm text-slate-400">이번 준비 흐름</p>
            <p className="mt-2 break-words text-lg font-medium text-slate-100">{summary}</p>
            <p className="mt-2 text-sm text-slate-500">연결·저장·실행은 아직 하지 않았습니다.</p>
          </section>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-medium text-white">처음부터 함께 따라가려면</p>
              <p className="mt-1 text-sm text-slate-400">완료 표시는 사용자 자기보고이며 자동 검증이 아닙니다.</p>
            </div>
            <button type="button" onClick={onStartStepMode} className="min-h-[50px] rounded-xl border border-cyan-100/50 bg-cyan-200/15 px-5 text-base font-semibold text-cyan-50 shadow-[0_12px_32px_rgba(34,211,238,.12)] hover:bg-cyan-200/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">단계별로 따라하기</button>
          </div>
          <ol className="mt-9 grid gap-3">
            {items.map((item, index) => (
              <PlanItem
                key={item.id}
                item={item}
                nextItem={items[index + 1]}
                index={index}
                open={openIds.includes(item.id)}
                onToggle={() => toggle(item.id)}
                onOpenNext={() => openNext(items[index + 1]?.id)}
                onNavigate={onNavigate}
              />
            ))}
          </ol>
        </main>
        <Bf0ActionFooter backLabel="요약" nextLabel="설계 초안 완성" onBack={onBack} onNext={onNext} />
      </div>
    </section>
  );
}

function PlanItem({
  item,
  nextItem,
  index,
  open,
  onToggle,
  onOpenNext,
  onNavigate,
}: {
  item: Bf0BuildPlanItem;
  nextItem?: Bf0BuildPlanItem;
  index: number;
  open: boolean;
  onToggle: () => void;
  onOpenNext: () => void;
  onNavigate: (route: Bf0Route) => void;
}) {
  const firstAction = item.steps[0] ?? item.task;
  return (
    <li className="rounded-2xl bg-slate-950/72 shadow-[inset_0_0_0_1px_rgba(148,163,184,.14)]">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`bf0-plan-${item.id}`} className="grid min-h-[116px] w-full grid-cols-[3rem_1fr_auto] items-start gap-4 px-5 py-5 text-left hover:bg-slate-900/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-cyan-200 sm:grid-cols-[4rem_1fr_auto] sm:px-6">
        <span className="text-2xl font-semibold text-cyan-100">{String(index + 1).padStart(2, "0")}</span>
        <span className="min-w-0">
          <strong className="block text-lg font-semibold text-white">{item.title}</strong>
          <span className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-400">
            <span>{item.workLocation}</span>
            <span aria-hidden="true">·</span>
            <span>내가 직접</span>
            <span aria-hidden="true">·</span>
            <span className={stateTextClass[item.state]}>{shortStateHint(item.state)}</span>
          </span>
          <span className="mt-3 block text-base leading-7 text-slate-200">{firstAction}</span>
          <span className="mt-2 block text-sm leading-6 text-slate-500">{shortCompletion(item.completion)}</span>
        </span>
        <span aria-hidden="true" className={`mt-1 text-2xl text-cyan-100 transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`}>›</span>
      </button>
      {open && (
        <div id={`bf0-plan-${item.id}`} className="scroll-mt-24 px-5 pb-6 sm:px-[5.5rem]">
          <section className="border-t border-slate-800/70 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">지금 할 일</p>
                <ol className="mt-3 grid gap-2 text-base leading-7 text-slate-100">
                  {item.steps.map((step, stepIndex) => (
                    <li key={step} className="flex gap-3">
                      <span className="text-cyan-200">{stepIndex + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <PlanGuide item={item} onNavigate={onNavigate} />
            </div>
            <InputPreview targets={item.inputTargets} />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl bg-cyan-200/7 p-5">
                <h3 className="text-base font-semibold text-cyan-50">여기까지 되면 완료</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.completion}</p>
              </section>
              <section className="p-5">
                <h3 className="text-sm font-medium text-slate-300">다음</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.nextAction}</p>
                {nextItem && <button type="button" onClick={onOpenNext} className="mt-3 min-h-[44px] rounded-xl px-1 text-sm font-medium text-cyan-100 hover:text-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">다음 단계 보기 →</button>}
              </section>
            </div>
            <details className="mt-5 group">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-300 hover:text-cyan-100">왜 필요한가요? <span aria-hidden="true" className="text-cyan-200">›</span></summary>
              <div className="mt-3 text-sm leading-7 text-slate-400">
                <p>{item.detail}</p>
                <p className="mt-3 text-amber-100">{item.caution}</p>
              </div>
            </details>
            <details className="mt-4 group">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-300 hover:text-cyan-100">어디서 입력하나요? <span aria-hidden="true" className="text-cyan-200">›</span></summary>
              <LocationDetails item={item} />
            </details>
            {item.requirements && item.requirements.length > 0 && (
              <details className="mt-4 group">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-300 hover:text-cyan-100">반영된 요구사항 <span aria-hidden="true" className="text-cyan-200">›</span></summary>
                <ul className="mt-3 grid gap-1 text-sm leading-6 text-slate-400">
                  {item.requirements.map((requirement) => <li key={requirement.id}>• {requirement.value} <span className="text-slate-500">({requirement.support})</span></li>)}
                </ul>
              </details>
            )}
            {item.editRoute && <button type="button" onClick={() => onNavigate(item.editRoute!)} className="mt-6 min-h-[44px] rounded-xl px-1 text-sm text-slate-400 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">{item.editLabel ?? "선택 다시 보기"}</button>}
          </section>
        </div>
      )}
    </li>
  );
}

function InputPreview({ targets }: { targets?: Bf0InputTarget[] }) {
  if (!targets || targets.length === 0) return null;
  return (
    <section className="mt-6">
      <h3 className="text-base font-semibold text-white">{targets.length}개를 준비하세요</h3>
      <div className="mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-2">
        {targets.map((target) => (
          <div key={target.id} className="min-w-0">
            <p className="font-medium text-slate-100">{target.value}</p>
            <p className="mt-1 text-slate-400">{target.field} → <span className="text-slate-200">{target.value}</span></p>
            {target.format && !target.format.includes("확인 필요") && <p className="text-slate-500">형식 → {target.format}</p>}
            {target.setting && !target.setting.includes("확인 필요") && <p className="text-slate-500">설정 → {target.setting}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function LocationDetails({ item }: { item: Bf0BuildPlanItem }) {
  const targets = item.inputTargets ?? [];
  return (
    <div className="mt-3 min-w-0 overflow-hidden break-words text-sm leading-6 text-slate-400">
      <p>{item.workLocation}</p>
      {targets.length > 0 && (
        <div className="mt-3 grid min-w-0 gap-3">
          {targets.map((target) => (
            <div key={target.id} className="min-w-0 overflow-hidden break-words border-l border-slate-700 pl-3">
              <p className="font-medium text-slate-200">{target.value}</p>
              <p>{target.service} → {target.screen} → {target.control} → {target.field}</p>
              <p>{verificationCopy[target.verificationState]}</p>
              {target.officialSource && <p className="break-words text-slate-500">{target.officialSource}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlanGuide({ item, onNavigate }: { item: Bf0BuildPlanItem; onNavigate: (route: Bf0Route) => void }) {
  if (item.guideUrl) return <a href={item.guideUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[46px] w-fit items-center rounded-xl border border-violet-200/25 px-4 text-sm font-medium text-violet-100 hover:bg-violet-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200">{item.guideLabel} ↗</a>;
  if (item.guideRoute) return <button type="button" onClick={() => onNavigate(item.guideRoute!)} className="inline-flex min-h-[46px] w-fit items-center rounded-xl border border-violet-200/25 px-4 text-left text-sm font-medium text-violet-100 hover:bg-violet-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200">{item.guideLabel} →</button>;
  return null;
}

function shortCompletion(value: string): string {
  return value.replace(/되면 완료입니다\.?$/, "되면 됩니다.");
}

function shortStateHint(state: Bf0BuildPlanItem["state"]): string {
  if (state === "연결 필요") return "연결은 나중에";
  if (state === "검증 필요") return "확인 필요";
  if (state === "현재 미지원") return "후속 검토";
  if (state === "구축 가이드") return "안내 가능";
  return "준비 단계";
}
