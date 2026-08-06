import { createInitialInquiryBlueprint, withApprovalGate } from "../../verification-loop/canonical-blueprint";
import { deliveryBeforeApprovalTest, validInquiryApprovedTest } from "../../verification-loop/fixtures";
import { getCapabilityMatrix } from "../capabilities";
import { compileMakeScenario } from "../make/compiler";
import { makeForbiddenDeliveryFixture } from "../make/fixtures";
import { verifyMakeFixture } from "../make/result-adapter";
import { compileN8nWorkflow } from "../n8n/compiler";
import { n8nForbiddenDeliveryFixture } from "../n8n/fixtures";
import { verifyN8nFixture } from "../n8n/result-adapter";

type PreviewProps = {
  platform: "Make" | "n8n";
  artifact: unknown;
  checksum: string;
  warnings: readonly string[];
  credentials: readonly { reference: string }[];
  unsupportedCapabilities: readonly string[];
};

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="border border-zinc-800 bg-zinc-950/70 p-5">
      <h2 className="text-lg font-medium text-zinc-100">{title}</h2>
      <pre className="mt-4 overflow-x-auto border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

function Preview({ platform, artifact, checksum, warnings, credentials, unsupportedCapabilities }: PreviewProps) {
  return (
    <section className="border border-zinc-800 bg-zinc-950/70 p-5">
      <h2 className="text-lg font-medium text-zinc-100">{platform} Compile Preview</h2>
      <p className="mt-2 text-sm text-zinc-400">Internal preview only · actual external creation: false</p>
      <pre className="mt-4 overflow-x-auto border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
        {JSON.stringify(artifact, null, 2)}
      </pre>
      <p className="mt-3 break-all text-xs text-zinc-500">checksum: {checksum}</p>
      <p className="mt-3 text-sm text-amber-100">Credential placeholders: {credentials.map((item) => item.reference).join(", ")}</p>
      <p className="mt-2 text-sm text-zinc-400">Unsupported: {unsupportedCapabilities.join(", ") || "none"}</p>
      <ul className="mt-3 list-disc pl-5 text-sm text-amber-100">
        {warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </section>
  );
}

export function BuilderAdapterLab() {
  const blueprint = withApprovalGate(createInitialInquiryBlueprint());
  const make = compileMakeScenario({ blueprint });
  const n8n = compileN8nWorkflow({ blueprint });
  const makeFailure = verifyMakeFixture(deliveryBeforeApprovalTest, makeForbiddenDeliveryFixture);
  const n8nFailure = verifyN8nFixture(deliveryBeforeApprovalTest, n8nForbiddenDeliveryFixture);
  const fixtureResults = [
    { platform: "Make", result: makeFailure },
    { platform: "n8n", result: n8nFailure },
  ] as const;

  return (
    <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100">
      <section className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Internal builder adapter lab</p>
        <h1 className="mt-3 text-3xl font-semibold">Make / n8n Adapter Preview</h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-400">
          Canonical Blueprint을 두 플랫폼용 내부 Preview Artifact로 변환하고, Fixture 결과를 기존 Acceptance Verdict 규칙으로 판정합니다.
        </p>
        <div className="mt-6 border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-100">
          외부 플랫폼은 실제로 호출되지 않았습니다. 이 화면은 Adapter와 Compiler의 내부 검증이며, 실제 Scenario 또는 Workflow는 생성되지 않았습니다.
        </div>

        <section className="mt-8 border border-zinc-800 bg-zinc-950/70 p-5">
          <h2 className="text-lg font-medium">Canonical Blueprint</h2>
          <ol className="mt-4 grid gap-2">
            {blueprint.steps.map((step) => (
              <li key={step.id} className="border border-zinc-800 p-3 text-sm">
                <span className="font-medium">{step.label}</span>
                <span className="ml-2 text-zinc-500">{step.type} · depends on: {step.dependsOn.join(", ") || "none"}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Preview platform="Make" artifact={make.artifact} checksum={make.deterministicChecksum} warnings={make.warnings} credentials={make.credentialRequirements} unsupportedCapabilities={make.unsupportedCapabilities} />
          <Preview platform="n8n" artifact={n8n.artifact} checksum={n8n.deterministicChecksum} warnings={n8n.warnings} credentials={n8n.credentialRequirements} unsupportedCapabilities={n8n.unsupportedCapabilities} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {(["MAKE", "N8N"] as const).map((platform) => (
            <article key={platform} className="border border-zinc-800 bg-zinc-950/70 p-5">
              <h2 className="text-lg font-medium">{platform} Capability Comparison</h2>
              <dl className="mt-4 grid gap-2 text-sm">
                {Object.entries(getCapabilityMatrix(platform)).map(([capability, support]) => (
                  <div key={capability} className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                    <dt className="text-zinc-400">{capability}</dt>
                    <dd className="text-zinc-100">{support}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </section>

        <section className="mt-8 border border-red-400/30 bg-red-400/5 p-5">
          <h2 className="text-lg font-medium text-red-100">Fixture Execution → Evidence → Verdict</h2>
          <p className="mt-3 text-sm text-zinc-300">동일 Test Case: {deliveryBeforeApprovalTest.id}</p>
          <p className="mt-2 text-sm text-red-200">
            성공 상태라도 승인 전 Slack 전달 관찰이 있으면 Acceptance Verdict는 FAILED입니다.
          </p>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            {fixtureResults.map(({ platform, result }) => (
              <div key={platform} className="grid gap-4">
                <JsonPanel title={`${platform} Canonical Fixture Result`} value={result.execution} />
                <JsonPanel title={`${platform} Normalized Evidence`} value={result.evidence} />
                <JsonPanel title={`${platform} Acceptance Verdict`} value={result.verdict} />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 border border-emerald-400/30 bg-emerald-400/5 p-5">
          <h2 className="text-lg font-medium text-emerald-100">Approved Delivery Contract</h2>
          <p className="mt-3 text-sm text-zinc-200">
            {validInquiryApprovedTest.id}: Approval 상태가 APPROVED일 때만 Slack 전달 관찰이 허용됩니다.
          </p>
        </section>
      </section>
    </main>
  );
}
