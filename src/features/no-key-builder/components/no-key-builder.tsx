"use client";

import { useMemo, useState } from "react";
import { deliveryBeforeApprovalTest, validInquiryApprovedTest } from "../../verification-loop/fixtures";
import type { ExternalBuilderPlatform } from "../../external-builders/types";
import { buildNoKeyExecutionPackage } from "../package-builder";
import { submitNoKeyResult } from "../result-submission";
import { noKeyBlueprint } from "../fixtures";
import { createNoKeyVerificationExport } from "../verification-export";
import type { NoKeyResultSubmission, NoKeySubmissionOutcome } from "../types";

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return <section className="border border-zinc-800 bg-zinc-950/70 p-5"><h2 className="text-lg font-medium">{title}</h2><pre className="mt-4 overflow-x-auto border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">{JSON.stringify(value, null, 2)}</pre></section>;
}

type NoKeyBuilderProps = { lab?: boolean };

const observationOptions = [
  "INQUIRY_CLASSIFIED",
  "INQUIRY_SUMMARIZED",
  "APPROVAL_GATE_ENFORCED",
  "APPROVAL_STATUS_APPROVED",
  "SLACK_DELIVERY_BLOCKED_UNTIL_APPROVED",
  "SLACK_DELIVERY_ATTEMPTED_AFTER_APPROVAL",
  "SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL",
] as const;

function defaultObservationsFor(testCaseId: NoKeyResultSubmission["testCaseId"]): readonly NoKeyResultSubmission["observations"][number][] {
  return testCaseId === validInquiryApprovedTest.id
    ? ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "APPROVAL_STATUS_APPROVED", "SLACK_DELIVERY_ATTEMPTED_AFTER_APPROVAL"]
    : ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL"];
}

export function NoKeyBuilder({ lab = false }: NoKeyBuilderProps) {
  const [platform, setPlatform] = useState<ExternalBuilderPlatform>("N8N");
  const [testCaseId, setTestCaseId] = useState(validInquiryApprovedTest.id);
  const [claimedStatus, setClaimedStatus] = useState<NoKeyResultSubmission["claimedStatus"]>("SUCCEEDED");
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [logExcerpt, setLogExcerpt] = useState("");
  const [workflowReference, setWorkflowReference] = useState("");
  const [executionReference, setExecutionReference] = useState("");
  const [blueprintChecksum, setBlueprintChecksum] = useState("");
  const [observations, setObservations] = useState<readonly NoKeyResultSubmission["observations"][number][]>(() => defaultObservationsFor(validInquiryApprovedTest.id));
  const [outcome, setOutcome] = useState<NoKeySubmissionOutcome | undefined>();
  const [safeError, setSafeError] = useState<string | undefined>();
  const executionPackage = useMemo(() => buildNoKeyExecutionPackage(platform, noKeyBlueprint), [platform]);
  const testCase = testCaseId === validInquiryApprovedTest.id ? validInquiryApprovedTest : deliveryBeforeApprovalTest;
  const createSubmission = (): NoKeyResultSubmission => ({
    platform,
    blueprintChecksum: blueprintChecksum || executionPackage.blueprintChecksum,
    testCaseId: testCase.id,
    claimedStatus,
    ...(workflowReference.trim() ? { externalWorkflowReference: workflowReference.trim() } : {}),
    ...(executionReference.trim() ? { externalExecutionReference: executionReference.trim() } : {}),
    observations,
    submittedAt: new Date().toISOString(),
    userConfirmed,
    ...(logExcerpt.trim() ? { sanitizedLogExcerpt: logExcerpt.trim() } : {}),
  });

  function toggleObservation(observation: NoKeyResultSubmission["observations"][number]) {
    setObservations((current) => current.includes(observation)
      ? current.filter((item) => item !== observation)
      : [...current, observation]);
  }

  function changePlatform(nextPlatform: ExternalBuilderPlatform) {
    const nextPackage = buildNoKeyExecutionPackage(nextPlatform, noKeyBlueprint);
    setPlatform(nextPlatform);
    setBlueprintChecksum(nextPackage.blueprintChecksum);
    setOutcome(undefined);
    setSafeError(undefined);
  }

  function changeTestCase(nextTestCaseId: NoKeyResultSubmission["testCaseId"]) {
    setTestCaseId(nextTestCaseId);
    setObservations(defaultObservationsFor(nextTestCaseId));
    setOutcome(undefined);
    setSafeError(undefined);
  }

  function verifySubmission() {
    try {
      setOutcome(submitNoKeyResult(executionPackage, testCase, createSubmission()));
      setSafeError(undefined);
    } catch {
      setOutcome(undefined);
      setSafeError("민감 정보로 보이는 입력은 제출할 수 없습니다. 값을 제거한 뒤 다시 확인하세요.");
    }
  }

  function downloadVerificationJson() {
    if (!outcome) return;
    try {
      const artifact = createNoKeyVerificationExport(createSubmission(), outcome);
      const url = URL.createObjectURL(new Blob([artifact.content], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = artifact.fileName;
      link.click();
      URL.revokeObjectURL(url);
      setSafeError(undefined);
    } catch {
      setSafeError("민감 정보로 보이는 입력은 JSON으로 내보낼 수 없습니다. 값을 제거한 뒤 다시 확인하세요.");
    }
  }

  return (
    <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100"><section className="mx-auto max-w-5xl">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">{lab ? "No-Key Builder Guest Lab" : "No-Key Builder Flow"}</p><h1 className="mt-3 text-3xl font-semibold">API Key 없이 설계·설정 안내·결과 검증</h1>
      <div className="mt-6 border border-emerald-400/30 bg-emerald-400/5 p-4 text-sm text-emerald-100">BuildFlow는 API Key를 요구하지 않습니다. 외부 서비스 연결은 Make 또는 n8n에서 사용자가 직접 진행합니다. BuildFlow는 설계, 설정 안내, 결과 검증을 제공합니다.</div>
      <div className="mt-4 border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-100">API Key, Token, 비밀번호, Cookie를 붙여넣지 마세요. 실행 결과에서 민감 정보는 제거한 뒤 제출하세요.</div>
      {lab && <div className="mt-4 border border-cyan-400/30 bg-cyan-400/5 p-4 text-sm text-cyan-100">Guest Lab은 Supabase 조회·DB 접근·외부 API 없이 로컬 fixture로만 동작합니다. Production 인증 정책은 변경하지 않습니다.</div>}
      <section className="mt-8 grid gap-4 border border-zinc-800 bg-zinc-950/70 p-5 sm:grid-cols-2"><label className="grid gap-2 text-sm">플랫폼<select className="border border-zinc-700 bg-zinc-900 p-2" value={platform} onChange={(event) => changePlatform(event.target.value as ExternalBuilderPlatform)}><option value="N8N">n8n</option><option value="MAKE">Make</option></select></label><label className="grid gap-2 text-sm">Acceptance Test<select className="border border-zinc-700 bg-zinc-900 p-2" value={testCaseId} onChange={(event) => changeTestCase(event.target.value as NoKeyResultSubmission["testCaseId"])}><option value={validInquiryApprovedTest.id}>{validInquiryApprovedTest.title}</option><option value={deliveryBeforeApprovalTest.id}>{deliveryBeforeApprovalTest.title}</option></select></label><label className="grid gap-2 text-sm sm:col-span-2">Blueprint checksum<input className="border border-zinc-700 bg-zinc-900 p-2 font-mono text-xs" value={blueprintChecksum || executionPackage.blueprintChecksum} onChange={(event) => setBlueprintChecksum(event.target.value)} /></label></section>
      <section className="mt-8 grid gap-4 border border-zinc-800 bg-zinc-950/70 p-5 sm:grid-cols-2"><h2 className="text-lg font-medium sm:col-span-2">실행 결과 입력</h2><label className="grid gap-2 text-sm">Claimed status<select className="border border-zinc-700 bg-zinc-900 p-2" value={claimedStatus} onChange={(event) => setClaimedStatus(event.target.value as NoKeyResultSubmission["claimedStatus"])}><option value="SUCCEEDED">SUCCEEDED</option><option value="FAILED">FAILED</option><option value="UNKNOWN">UNKNOWN</option></select></label><label className="grid gap-2 text-sm">External workflow reference (선택)<input className="border border-zinc-700 bg-zinc-900 p-2" value={workflowReference} onChange={(event) => setWorkflowReference(event.target.value)} /></label><label className="grid gap-2 text-sm sm:col-span-2">External execution reference (선택)<input className="border border-zinc-700 bg-zinc-900 p-2" value={executionReference} onChange={(event) => setExecutionReference(event.target.value)} /></label><fieldset className="grid gap-2 text-sm sm:col-span-2"><legend>Observations</legend>{observationOptions.map((observation) => <label key={observation} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={observations.includes(observation)} onChange={() => toggleObservation(observation)} />{observation}</label>)}</fieldset><label className="grid gap-2 text-sm sm:col-span-2">Sanitized log excerpt (선택)<textarea className="min-h-24 border border-zinc-700 bg-zinc-900 p-2" value={logExcerpt} onChange={(event) => setLogExcerpt(event.target.value)} /></label><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={userConfirmed} onChange={(event) => setUserConfirmed(event.target.checked)} />민감 정보를 제거했고, 외부 플랫폼에서 직접 수행한 결과임을 확인합니다.</label><button type="button" className="border border-cyan-300/50 px-4 py-2 text-sm text-cyan-100 sm:col-span-2" onClick={verifySubmission}>검증하기</button></section>
      {executionPackage.artifact.kind === "N8N_WORKFLOW_EXPORT" && <section className="mt-8 border border-zinc-800 bg-zinc-950/70 p-5"><h2 className="text-lg font-medium">n8n Import Readiness</h2><p className="mt-2 text-sm text-zinc-300">Schema: {executionPackage.artifact.importReadiness.status} · 실제 Import: {executionPackage.artifact.importReadiness.realPlatformValidation}</p><p className="mt-2 text-xs text-amber-200">Slack 단계는 credential-free placeholder입니다. 실제 Slack Workflow 또는 실행 성공을 의미하지 않습니다.</p><JsonPanel title="n8n Workflow JSON" value={executionPackage.artifact.workflow} /></section>}
      {executionPackage.artifact.kind === "MAKE_MANUAL_SETUP_GUIDE" && <JsonPanel title="Make Manual Setup Guide" value={executionPackage.artifact} />}
      <section className="mt-8 grid gap-6 lg:grid-cols-2"><JsonPanel title="No-Key Execution Package" value={executionPackage} /><JsonPanel title="USER_SUBMITTED Evidence" value={outcome?.evidence} /></section>
      <section className="mt-8 border border-zinc-800 bg-zinc-950/70 p-5"><h2 className="text-lg font-medium">Acceptance Verdict</h2>{safeError ? <p className="mt-3 text-sm text-red-300" role="alert">{safeError}</p> : outcome ? <><p className="mt-3 text-lg font-semibold">Verdict: {outcome.verdict.presentation}</p><p className="mt-1 text-sm text-zinc-300">Evidence source: {outcome.evidence?.sourceType ?? "UNAVAILABLE"}</p><p className="text-sm text-zinc-300">Trust level: {outcome.evidence?.trustLevel ?? "UNAVAILABLE"}</p><p className="text-sm text-zinc-300">External platform directly observed by BuildFlow: NO</p><p className="text-sm text-zinc-300">Blueprint checksum: {blueprintChecksum || executionPackage.blueprintChecksum}</p><p className="text-sm text-zinc-300">Test case: {testCase.id}</p>{outcome.verdict.failureCode && <p className="text-sm text-amber-200">Reason: {outcome.verdict.failureCode}</p>}{outcome.limitation && <p className="text-sm text-amber-200">Limitation: {outcome.limitation}</p>}<button type="button" className="mt-4 border border-emerald-300/50 px-4 py-2 text-sm text-emerald-100" onClick={downloadVerificationJson}>Verification JSON 다운로드</button></> : <p className="mt-3 text-sm text-zinc-400">실행 결과를 입력한 뒤 검증하기를 선택하세요.</p>}</section>
      <div className="mt-8 border border-zinc-800 bg-zinc-950/70 p-5 text-sm text-zinc-300">BuildFlow 외부 API 호출 없음 · Credential 저장 없음 · 실제 연결은 사용자가 외부 플랫폼에서 진행 · 제출 결과의 출처: USER_SUBMITTED</div>
    </section></main>
  );
}
