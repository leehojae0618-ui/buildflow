"use client";

import { useState } from "react";
import { startDeploymentSession } from "../actions";
import type { BuildEstimate, DeploymentState } from "../types";

export function DeliverySummary({ projectId, estimate }: { projectId: string; estimate: BuildEstimate }) {
  const [state, setState] = useState<DeploymentState | null>(null);
  const [message, setMessage] = useState("");
  async function start() { setMessage(""); const result = await startDeploymentSession(projectId); if (result.error) setMessage(result.error); else if (result.session) { setState(result.session.state); setMessage("세션이 저장되었습니다. 필요한 사용자 작업이 완료되면 자동으로 이어집니다."); } }
  return <div className="mt-5 border border-cyan-300/30 bg-cyan-300/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">서비스 구축</p><h3 className="mt-2 text-lg font-medium">{state === "READY" ? "Production Ready" : "서비스를 만들고 있습니다"}</h3><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="예상 남은 시간" value={`${estimate.estimatedTotalMinutes}분`} /><Metric label="예상 월 운영비" value={`${Math.round(estimate.estimatedMonthlyCostCents / 100).toLocaleString("ko-KR")}원`} /><Metric label="자동화율" value={`${estimate.automationPercentage}%`} /><Metric label="남은 사용자 작업" value={`${estimate.userActionCount}건`} /></div><button type="button" onClick={start} className="mt-5 border border-cyan-300/50 px-4 py-2 text-sm text-cyan-100">서비스 구축 시작</button>{message && <p className="mt-3 text-sm text-zinc-300">{message}</p>}<details className="mt-5 text-xs text-zinc-500"><summary className="cursor-pointer">상세 보기</summary><p className="mt-2">상태: {state ?? "시작 전"} · 승인 {estimate.approvalCount}건 · 위험도 {estimate.risk}</p></details></div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="border border-zinc-800 bg-zinc-950/50 p-3"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 text-lg font-medium text-zinc-100">{value}</p></div>; }
