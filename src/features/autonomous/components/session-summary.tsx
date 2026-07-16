"use client";
import { useEffect, useState } from "react";
import { continueAutonomousBuildSession, getAutonomousBuildSession, resumeAutonomousBuildSession, startAutonomousBuildSession } from "../actions";
import { ApprovalSummary } from "./approval-summary";
import { ProviderCredentialPanel } from "@/features/credentials/components/provider-credential-panel";

const statusCopy: Record<string, { title: string; detail: string; progress: number; waiting?: boolean }> = {
  PLANNING: { title: "AI가 구축 계획을 정리하고 있습니다", detail: "선택한 목표와 설계를 확인하는 중입니다.", progress: 20 },
  WAITING_FOR_CREDENTIAL: { title: "연결 정보가 필요합니다", detail: "필요한 계정을 연결하면 자동으로 이어집니다.", progress: 25, waiting: true },
  WAITING_FOR_CONSENT: { title: "사용자 동의를 기다리고 있습니다", detail: "외부 서비스 사용 범위를 확인해 주세요.", progress: 30, waiting: true },
  WAITING_FOR_APPROVAL: { title: "구축 승인을 기다리고 있습니다", detail: "예상 비용과 생성 항목을 확인해 주세요.", progress: 35, waiting: true },
  PROVISIONING: { title: "AI가 서비스를 구축하고 있습니다", detail: "필요한 연결과 기능을 준비하고 있습니다.", progress: 65 },
  VERIFYING: { title: "AI가 완성된 서비스를 확인하고 있습니다", detail: "실제로 사용할 수 있는지 점검하는 중입니다.", progress: 85 },
  READY: { title: "서비스 구축이 완료되었습니다", detail: "사용할 준비가 끝났습니다.", progress: 100 },
  READY_WITH_WARNINGS: { title: "서비스가 준비되었습니다", detail: "일부 확인이 필요한 항목이 있습니다.", progress: 100 },
  FAILED: { title: "자동 구축을 완료하지 못했습니다", detail: "해결 방법을 확인한 뒤 다시 이어갈 수 있습니다.", progress: 0 },
};
const timeline = ["준비", "설계", "구축", "검증", "완료"];

type SessionView = { id: string; status: string; completionReport?: unknown };
export function AutonomousSessionSummary({ projectId, initialSession }: { projectId: string; initialSession?: SessionView | null }) {
  const [session, setSession] = useState<SessionView | null>(initialSession ?? null); const [message, setMessage] = useState("");
  const sessionId = session?.id;
  const sessionStatus = session?.status;
  useEffect(() => { if (!initialSession) getAutonomousBuildSession(projectId).then(setSession); }, [initialSession, projectId]);
  useEffect(() => {
    if (!sessionId || !sessionStatus || !["PROVISIONING", "VERIFYING", "RECOVERING"].includes(sessionStatus)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function continueBuild() {
      const result = await continueAutonomousBuildSession(projectId, sessionId!);
      if (cancelled) return;
      if (!result.ok) {
        setMessage(result.error);
        if ("status" in result && result.status) setSession((current) => current ? { ...current, status: result.status } : current);
        return;
      }
      const refreshed = await getAutonomousBuildSession(projectId);
      if (cancelled || !refreshed) return;
      setSession(refreshed);
      if (["PROVISIONING", "VERIFYING", "RECOVERING"].includes(refreshed.status)) timer = setTimeout(continueBuild, 8000);
    }
    void continueBuild();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [projectId, sessionId, sessionStatus]);
  async function start() { const result = await startAutonomousBuildSession(projectId); if (!result.ok) setMessage(result.error); else setSession({ id: result.sessionId, status: result.status }); }
  async function resume(event: "CREDENTIALS_READY" | "CONSENT_GRANTED" | "APPROVAL_GRANTED") { if (!session) return; const result = await resumeAutonomousBuildSession(projectId, session.id, event); if (!result.ok) setMessage(result.error); else setSession({ ...session, status: result.status }); }
  const copy = session ? statusCopy[session.status] ?? { title: "AI가 서비스를 준비하고 있습니다", detail: "자동으로 다음 단계를 진행합니다.", progress: 45 } : null;
  const completion = session?.completionReport && typeof session.completionReport === "object" ? session.completionReport as { serviceUrl?: string; repositoryUrl?: string; outcomes?: string[]; warnings?: string[]; productionReady?: boolean } : null;
  return <section className="mt-5 border border-cyan-400/20 bg-cyan-400/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">진행 상황</p>{!session ? <><h3 className="mt-3 text-lg font-medium">준비가 되면 AI가 구축을 시작합니다</h3><p className="mt-2 text-sm text-zinc-400">페이지를 닫아도 저장된 세션에서 이어갈 수 있습니다.</p><button type="button" onClick={start} className="mt-4 border border-cyan-300/40 px-3 py-2 text-sm text-cyan-200">구축 시작</button></> : <><h3 className="mt-3 text-lg font-medium text-white">{copy?.title}</h3><p className="mt-2 text-sm text-zinc-300">{copy?.detail}</p><div className="mt-5 h-2 overflow-hidden bg-zinc-800"><div className="h-full bg-cyan-300 transition-all" style={{ width: `${copy?.progress ?? 0}%` }} /></div><p className="mt-2 text-right text-xs text-zinc-400">약 {copy?.progress ?? 0}% 진행</p><div className="mt-5 flex flex-wrap gap-2">{timeline.map((item, index) => <span key={item} className={`px-2 py-1 text-xs ${index < Math.ceil((copy?.progress ?? 0) / 20) ? "text-emerald-200" : "text-zinc-500"}`}>{index < Math.ceil((copy?.progress ?? 0) / 20) ? "✓" : "○"} {item}</span>)}</div>{session.status === "WAITING_FOR_CREDENTIAL" ? <ProviderCredentialPanel projectId={projectId} onReady={() => resume("CREDENTIALS_READY")} /> : session.status === "WAITING_FOR_APPROVAL" ? <ApprovalSummary onApprove={() => resume("APPROVAL_GRANTED")} /> : copy?.waiting && <button type="button" onClick={() => resume("CONSENT_GRANTED")} className="mt-4 border border-amber-300/40 px-3 py-2 text-sm text-amber-200">완료 후 자동으로 이어가기</button>}{completion && ["READY", "READY_WITH_WARNINGS"].includes(session.status) && <div className="bf-panel bf-active mt-5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{completion.productionReady ? "서비스를 사용할 준비가 완료되었습니다" : "일부 확인이 필요합니다"}</p>{completion.serviceUrl && <a href={completion.serviceUrl} target="_blank" rel="noreferrer" className="mt-3 block text-lg text-cyan-200 underline">{completion.serviceUrl}</a>}{completion.outcomes?.length ? <ul className="mt-4 grid gap-2 text-sm text-zinc-200">{completion.outcomes.map((outcome) => <li key={outcome}>✓ {outcome}</li>)}</ul> : null}{completion.warnings?.map((warning) => <p key={warning} className="mt-3 text-xs text-amber-100">{warning}</p>)}</div>}<details className="mt-5 text-xs text-zinc-500"><summary className="cursor-pointer">기술 상세 보기</summary><p className="mt-2">Session 상태: {session.status}</p>{completion?.repositoryUrl && <p className="mt-1">Repository: {completion.repositoryUrl}</p>}</details></>}{message && <p className="mt-3 text-xs text-red-300" role="alert">{message}</p>}</section>;
}
