import type { VerificationRun } from "../types";

const labels: Record<string, string> = {
  NOT_RUN: "검증 필요",
  WAITING_FOR_CREDENTIAL: "연결 정보 필요",
  RUNNING: "AI가 검증 중",
  VERIFIED: "검증됨",
  WARNING: "추가 확인 필요",
  FAILED: "검증 실패",
  EXPIRED: "결과 만료",
  UNAVAILABLE: "현재 확인 불가",
};

export function VerificationSummary({ run }: { run: VerificationRun }) {
  return (
    <section className="mt-5 border border-lime-400/20 bg-lime-400/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-lime-300">
        Verification Summary
      </p>
      <p className="mt-2 text-sm text-zinc-300">
        저장된 최종 상태: {run.result.status}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        구조 검증만으로 완료 처리하지 않습니다. 자동 구축 세션이 실제 Provider와
        배포 URL을 확인한 결과만 사용합니다.
      </p>
      <div className="mt-4 grid gap-2">
        {run.targets.map((target) => (
          <div
            key={target.id}
            className="flex items-center justify-between border border-zinc-800 bg-zinc-950/40 p-3 text-xs"
          >
            <span>
              {target.providerId} {target.required ? "(필수)" : "(선택)"}
            </span>
            <span className="text-zinc-400">
              {labels[target.status] ?? target.status}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        마지막 검증: {run.lastRunAt ?? "아직 없음"} · 결과가 만료되거나 Credential이
        변경되면 자동 구축 세션에서 다시 검증합니다.
      </p>
    </section>
  );
}
