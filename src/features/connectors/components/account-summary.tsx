"use client";
import { useState } from "react";
import type { AccountConnectionSession } from "../oauth";
import { acknowledgeConsent } from "../oauth";

const statusLabels: Record<string, string> = { NOT_CONNECTED: "연결 전", CONNECTED: "연결됨", INVALID: "확인 필요", EXPIRED: "갱신 필요", ERROR: "오류" };
export function AccountSummary({ initialSession }: { initialSession: AccountConnectionSession }) {
  const [session, setSession] = useState(initialSession);
  const current = session.steps[session.currentStepIndex];
  if (!current) return <section className="mt-5 border border-orange-400/20 bg-orange-400/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-orange-300">Account Summary</p><p className="mt-2 text-sm text-zinc-400">필요한 외부 계정이 없습니다.</p></section>;
  const consent = () => setSession((value) => acknowledgeConsent(value, current.id));
  const move = (delta: number) => setSession((value) => ({ ...value, currentStepIndex: Math.max(0, Math.min(value.steps.length - 1, value.currentStepIndex + delta)) }));
  return <section className="mt-5 border border-orange-400/20 bg-orange-400/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-orange-300">Account Summary</p><p className="mt-2 text-sm text-zinc-400">{session.summary} · 연결 확인 {session.completed}/{session.total}</p><div className="mt-4 border border-zinc-800 bg-zinc-950/40 p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-medium text-zinc-100">{current.title}</h3><span className="text-xs text-zinc-400">{statusLabels[current.status]}</span></div><p className="mt-2 text-sm text-zinc-400">{current.description}</p><label className="mt-4 flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={current.consented} onChange={consent} /> 연결 단계와 사용자 동의를 확인했습니다.</label><p className="mt-3 text-xs text-orange-200">실제 OAuth는 실행하지 않습니다. 동의 후에도 연결 완료는 외부 인증 결과가 필요합니다.</p></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => move(-1)} disabled={session.currentStepIndex === 0} className="border border-zinc-700 px-3 py-2 text-xs disabled:opacity-40">이전</button><button type="button" onClick={() => move(1)} disabled={session.currentStepIndex === session.steps.length - 1} className="border border-zinc-700 px-3 py-2 text-xs disabled:opacity-40">다음</button></div></section>;
}
