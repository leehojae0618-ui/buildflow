import type { BuildEstimate } from "../types";

export function DeliverySummary({
  estimate,
}: {
  projectId: string;
  estimate: BuildEstimate;
}) {
  return (
    <div className="mt-5 border border-cyan-300/30 bg-cyan-300/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
        서비스 구축 예상
      </p>
      <h3 className="mt-2 text-lg font-medium">
        승인 후 AI가 구축부터 검증까지 이어서 진행합니다
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="예상 구축 시간"
          value={`${estimate.estimatedTotalMinutes}분`}
        />
        <Metric
          label="예상 월 운영비"
          value={`${Math.round(
            estimate.estimatedMonthlyCostCents / 100,
          ).toLocaleString("ko-KR")}원`}
        />
        <Metric label="자동화율" value={`${estimate.automationPercentage}%`} />
        <Metric
          label="예상 사용자 작업"
          value={`${estimate.userActionCount}건`}
        />
      </div>
      <p className="mt-4 text-xs text-zinc-400">
        별도 Deployment 버튼은 사용하지 않습니다. 위 자동 구축 세션이 저장된
        서버 상태에서 배포와 검증을 함께 관리합니다.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-zinc-800 bg-zinc-950/50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-medium text-zinc-100">{value}</p>
    </div>
  );
}
