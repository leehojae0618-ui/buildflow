import { createInitialInquiryBlueprint, withApprovalGate } from "../../verification-loop/canonical-blueprint";
import { createNormalizedError } from "../client/errors";
import type { ExternalBuilderClientConfig, ExternalBuilderRequestContext } from "../client/types";
import { compileMakeScenario } from "../make/compiler";
import { createMakeDryRun } from "../make/client";
import { compileN8nWorkflow } from "../n8n/compiler";
import { createN8nDryRun } from "../n8n/client";

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="border border-zinc-800 bg-zinc-950/70 p-5">
      <h2 className="text-lg font-medium">{title}</h2>
      <pre className="mt-4 overflow-x-auto border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

const policy = {
  retryPolicy: { maxAttempts: 2, initialDelayMs: 250, maxDelayMs: 1_000, backoffMultiplier: 2, retryableStatusCodes: [408, 429, 502, 503, 504] },
  pollingPolicy: { intervalMs: 1_000, maxAttempts: 5, overallTimeoutMs: 10_000, terminalStatuses: ["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"] as const },
};

function clientConfig(platform: ExternalBuilderClientConfig["platform"], credentialReference: string): ExternalBuilderClientConfig {
  return {
    platform,
    baseUrl: platform === "MAKE" ? "https://make.example.invalid" : "https://n8n.example.invalid",
    credentialReference,
    timeoutMs: 5_000,
    ...policy,
    dryRun: true,
  };
}

function requestContext(credentialReference: string): ExternalBuilderRequestContext {
  return {
    requestId: "builder-client-lab-dry-run",
    projectId: "preview-project-only",
    blueprintChecksum: "preview-blueprint-checksum",
    credentialReference,
    dryRun: true,
  };
}

export function BuilderClientLab() {
  const blueprint = withApprovalGate(createInitialInquiryBlueprint());
  const make = createMakeDryRun({
    config: clientConfig("MAKE", "MAKE_CONNECTION_SLACK_REFERENCE_REQUIRED"),
    operation: "CREATE",
    context: requestContext("MAKE_CONNECTION_SLACK_REFERENCE_REQUIRED"),
    artifact: compileMakeScenario({ blueprint }).artifact,
  });
  const n8n = createN8nDryRun({
    config: clientConfig("N8N", "N8N_CREDENTIAL_SLACK_REFERENCE_REQUIRED"),
    operation: "CREATE",
    context: requestContext("N8N_CREDENTIAL_SLACK_REFERENCE_REQUIRED"),
    artifact: compileN8nWorkflow({ blueprint }).artifact,
  });
  const normalizedErrorExample = createNormalizedError("MAKE", "CREATE", "APPROVAL_REQUIRED", "2026-08-06T00:00:00.000Z", { retryable: false });

  return (
    <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100">
      <section className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Live client foundation · dry-run only</p>
        <h1 className="mt-3 text-3xl font-semibold">Make / n8n Client Safety Preview</h1>
        <div className="mt-6 border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-100">
          실제 Make 또는 n8n API는 호출되지 않았습니다. 실제 Scenario 또는 Workflow는 생성되지 않았습니다. Credential은 사용되지 않았습니다.
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          이 화면은 요청 Preview, 검증 경계, 제한적 재시도·Polling 정책만 보여줍니다. Network Call Performed는 항상 false입니다.
        </p>
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <JsonPanel title="Make Client Dry-run" value={make} />
          <JsonPanel title="n8n Client Dry-run" value={n8n} />
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <JsonPanel title="Retry Policy" value={policy.retryPolicy} />
          <JsonPanel title="Polling Policy" value={policy.pollingPolicy} />
        </section>
        <section className="mt-8">
          <JsonPanel title="Normalized Error Example" value={normalizedErrorExample} />
        </section>
        <section className="mt-8 border border-red-400/30 bg-red-400/5 p-5 text-sm text-red-100">
          <h2 className="text-lg font-medium">Validation and Error Boundary</h2>
          <p className="mt-3">Secret-shaped 입력, localhost·사설 IP Base URL, 승인 참조가 없는 변경 Operation, 잘못된 플랫폼 응답은 안전한 구조 오류로 차단됩니다.</p>
          <p className="mt-2">Mock HTTP 결과만 SIMULATED_FIXTURE Evidence로 연결할 수 있으며, Dry-run은 Evidence 또는 VERIFIED 결과가 될 수 없습니다.</p>
        </section>
      </section>
    </main>
  );
}
