import { useState } from "react";
import { BF0_STEP_PROBLEM_OPTIONS, type Bf0BuildPlanItem, type Bf0InputTarget, type Bf0StepProgress } from "../bf0-view-model";
import { Bf0Brand } from "./bf0-shared";

const progressCopy: Record<Bf0StepProgress, string> = {
  "not-started": "아직 시작하지 않음",
  "in-progress": "진행 중",
  "user-reported-complete": "완료 표시됨 · 자동 검증 아님",
  "problem-reported": "문제 기록됨 · 자동 검증 아님",
};

const verificationCopy: Record<Bf0InputTarget["verificationState"], string> = {
  OFFICIAL_VERIFIED: "공식 안내 기준",
  NOT_VERIFIED: "화면 위치 확인 필요",
};

export function Bf0StepMode({
  items,
  index,
  progress,
  onBack,
  onNext,
  onShowPlan,
  onProgress,
}: {
  items: Bf0BuildPlanItem[];
  index: number;
  progress: Record<string, Bf0StepProgress>;
  onBack: () => void;
  onNext: () => void;
  onShowPlan: () => void;
  onProgress: (id: string, value: Bf0StepProgress) => void;
}) {
  const [problemOpen, setProblemOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const item = items[index];
  if (!item) return null;
  const current = progress[item.id] ?? "not-started";
  const finish = () => { onProgress(item.id, "user-reported-complete"); onNext(); };
  const continueWithoutCompletion = () => { onProgress(item.id, "in-progress"); onNext(); };
  const reportProblem = (value: string) => { setProblem(value); onProgress(item.id, "problem-reported"); };

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(55,116,190,.14),transparent_40%)] px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-[760px]">
        <header className="flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="min-h-[44px] rounded-xl px-3 text-sm text-slate-400 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">← 이전 단계</button>
          <Bf0Brand compact />
        </header>
        <main className="pb-8 pt-12 sm:pt-16">
          <p className="text-sm font-medium text-cyan-200">STEP {index + 1} / {items.length}</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">{friendlyTitle(item.title)}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span>{item.workLocation}</span>
            <span aria-hidden="true">·</span>
            <span>내가 직접</span>
            <span aria-hidden="true">·</span>
            <span>{progressCopy[current]}</span>
          </div>
          <StepLink item={item} />

          <section className="mt-9 rounded-[1.25rem] bg-slate-950/78 px-5 py-6 shadow-[inset_0_0_0_1px_rgba(148,163,184,.14)] sm:px-7 sm:py-8">
            <p className="text-sm font-medium text-cyan-200">지금 이것만 하세요</p>
            <ol className="mt-5 grid gap-4">
              {item.steps.map((step, stepIndex) => (
                <li key={step} className="grid grid-cols-[2.25rem_1fr] gap-3 text-lg leading-8 text-slate-100">
                  <span className="text-2xl font-semibold text-cyan-100">{stepIndex + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <InputTutorial targets={item.inputTargets} />
          </section>

          <section className="mt-6 rounded-2xl bg-cyan-200/8 p-5">
            <h2 className="text-lg font-semibold text-cyan-50">여기까지 되면 완료</h2>
            <p className="mt-2 text-base leading-7 text-slate-200">{item.completion}</p>
            <p className="mt-2 text-sm text-slate-500">완료 표시는 사용자가 직접 누르는 상태이며 자동 검증이 아닙니다.</p>
          </section>

          <div className="mt-6 grid gap-3">
            <button type="button" onClick={finish} className="min-h-[54px] rounded-xl border border-cyan-100/50 bg-cyan-200/15 px-5 text-base font-semibold text-cyan-50 shadow-[0_12px_32px_rgba(34,211,238,.12)] hover:bg-cyan-200/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">완료했어요</button>
            <button type="button" onClick={() => setProblemOpen((open) => !open)} aria-expanded={problemOpen} className="min-h-[44px] rounded-xl px-3 text-sm text-amber-100 hover:bg-amber-200/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">문제가 생겼어요</button>
          </div>

          {problemOpen && (
            <section className="mt-3 rounded-2xl bg-amber-200/6 p-5">
              <h2 className="text-sm font-medium text-amber-100">어떤 문제가 있나요?</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {BF0_STEP_PROBLEM_OPTIONS.map((option) => <button key={option} type="button" onClick={() => reportProblem(option)} aria-pressed={problem === option} className="min-h-[42px] rounded-xl border border-amber-200/20 px-3 text-left text-sm text-slate-200 hover:bg-amber-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">{option}</button>)}
              </div>
              {problem && (
                <div className="mt-5 text-sm leading-7 text-slate-300">
                  <p className="font-medium text-amber-100">선택한 문제: {problem}</p>
                  <ol className="mt-3 list-decimal space-y-1 pl-5">
                    <li>현재 로그인한 계정을 확인합니다.</li>
                    <li>공식 서비스 첫 화면으로 다시 이동합니다.</li>
                    <li>새 탭에서 열렸는지와 권한 요청 범위를 확인합니다.</li>
                    <li>해결되지 않으면 현재 화면과 오류 문구를 기록합니다.</li>
                  </ol>
                  <p className="mt-3 text-slate-500">이 안내는 실제 오류를 자동 진단한 결과가 아닙니다.</p>
                </div>
              )}
            </section>
          )}

          <div className="mt-7 grid gap-4">
            <details className="group">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-300 hover:text-cyan-100">어디서 입력하나요? <span aria-hidden="true" className="text-cyan-200">›</span></summary>
              <LocationDetails item={item} />
            </details>
            <details className="group">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-300 hover:text-cyan-100">왜 필요한가요? <span aria-hidden="true" className="text-cyan-200">›</span></summary>
              <div className="mt-3 text-sm leading-7 text-slate-400">
                <p>{item.reason}</p>
                <p className="mt-3 text-amber-100">{item.caution}</p>
              </div>
            </details>
            {item.requirements && item.requirements.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-300 hover:text-cyan-100">반영된 요구사항 <span aria-hidden="true" className="text-cyan-200">›</span></summary>
                <ul className="mt-3 grid gap-1 text-sm leading-6 text-slate-400">
                  {item.requirements.map((requirement) => <li key={requirement.id}>• {requirement.value}</li>)}
                </ul>
              </details>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={onShowPlan} className="min-h-[44px] rounded-xl px-3 text-sm text-slate-300 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">전체 계획 보기</button>
            <button type="button" onClick={continueWithoutCompletion} className="min-h-[44px] rounded-xl px-3 text-sm text-slate-300 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">다음: {nextTitle(items[index + 1])} →</button>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">진행 상태는 이번 브라우저 세션에만 유지됩니다.</p>
        </main>
      </div>
    </section>
  );
}

function InputTutorial({ targets }: { targets?: Bf0InputTarget[] }) {
  if (!targets || targets.length === 0) return null;
  return (
    <section className="mt-7">
      <h2 className="text-lg font-semibold text-white">{targets.length}개를 이렇게 입력하세요</h2>
      <div className="mt-4 grid gap-4">
        {targets.map((target) => (
          <div key={target.id} className="min-w-0 border-l border-cyan-200/30 pl-4">
            <p className="text-lg font-semibold text-slate-50">{target.value}</p>
            <dl className="mt-2 grid gap-1 text-sm leading-6">
              <TutorialRow label={target.field} value={target.value} />
              {target.format && !target.format.includes("확인 필요") && <TutorialRow label="형식" value={target.format} />}
              {target.setting && !target.setting.includes("확인 필요") && <TutorialRow label="설정" value={target.setting} />}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function TutorialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words text-slate-200">{value}</dd>
    </div>
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

function StepLink({ item }: { item: Bf0BuildPlanItem }) {
  if (!item.guideUrl) return <p className="mt-5 text-sm text-slate-500">이 단계는 BuildFlow 안에서 준비합니다.</p>;
  return <a href={item.guideUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-[48px] items-center rounded-xl border border-violet-200/25 px-4 text-sm font-medium text-violet-100 hover:bg-violet-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200">{item.guideLabel} ↗</a>;
}

function friendlyTitle(title: string): string {
  return title.replace(/준비$/, "준비해볼게요").replace(/확인$/, "확인해볼게요").replace(/정하기$/, "정해볼게요");
}

function nextTitle(item?: Bf0BuildPlanItem): string {
  return item?.title ?? "구축 계획 확인 완료";
}
