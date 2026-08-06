"use client";

import { useMemo, useState } from "react";
import { deliveryBeforeApprovalTest, validInquiryApprovedTest } from "../../verification-loop/fixtures";
import type { ExternalBuilderPlatform } from "../../external-builders/types";
import { buildNoKeyExecutionPackage } from "../package-builder";
import { submitNoKeyResult } from "../result-submission";
import { noKeyBlueprint } from "../fixtures";
import type { NoKeyResultSubmission } from "../types";

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return <section className="border border-zinc-800 bg-zinc-950/70 p-5"><h2 className="text-lg font-medium">{title}</h2><pre className="mt-4 overflow-x-auto border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">{JSON.stringify(value, null, 2)}</pre></section>;
}

export function NoKeyBuilder() {
  const [platform, setPlatform] = useState<ExternalBuilderPlatform>("N8N");
  const [testCaseId, setTestCaseId] = useState(validInquiryApprovedTest.id);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [logExcerpt, setLogExcerpt] = useState("");
  const executionPackage = useMemo(() => buildNoKeyExecutionPackage(platform, noKeyBlueprint), [platform]);
  const testCase = testCaseId === validInquiryApprovedTest.id ? validInquiryApprovedTest : deliveryBeforeApprovalTest;
  const defaultObservations = testCase.id === validInquiryApprovedTest.id
    ? ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "APPROVAL_STATUS_APPROVED", "SLACK_DELIVERY_ATTEMPTED_AFTER_APPROVAL"] as const
    : ["INQUIRY_CLASSIFIED", "INQUIRY_SUMMARIZED", "SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL"] as const;
  const submission: NoKeyResultSubmission = {
    platform,
    blueprintChecksum: executionPackage.blueprintChecksum,
    testCaseId: testCase.id,
    claimedStatus: "SUCCEEDED",
    externalWorkflowReference: "user-managed-reference",
    externalExecutionReference: "user-submitted-execution-reference",
    observations: defaultObservations,
    submittedAt: "2026-08-06T04:00:00.000Z",
    userConfirmed,
    ...(logExcerpt.trim() ? { sanitizedLogExcerpt: logExcerpt.trim() } : {}),
  };
  let outcome: ReturnType<typeof submitNoKeyResult> | { safeError: string };
  try {
    outcome = submitNoKeyResult(executionPackage, testCase, submission);
  } catch {
    outcome = { safeError: "민감 정보로 보이는 입력은 제출할 수 없습니다. 값을 제거한 뒤 다시 확인하세요." };
  }

  return (
    <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100"><section className="mx-auto max-w-5xl">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">No-Key Builder Flow</p><h1 className="mt-3 text-3xl font-semibold">API Key 없이 설계·설정 안내·결과 검증</h1>
      <div className="mt-6 border border-emerald-400/30 bg-emerald-400/5 p-4 text-sm text-emerald-100">BuildFlow는 API Key를 요구하지 않습니다. 외부 서비스 연결은 Make 또는 n8n에서 사용자가 직접 진행합니다. BuildFlow는 설계, 설정 안내, 결과 검증을 제공합니다.</div>
      <div className="mt-4 border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-100">API Key, Token, 비밀번호, Cookie를 붙여넣지 마세요. 실행 결과에서 민감 정보는 제거한 뒤 제출하세요.</div>
      <section className="mt-8 grid gap-4 border border-zinc-800 bg-zinc-950/70 p-5 sm:grid-cols-2"><label className="grid gap-2 text-sm">플랫폼<select className="border border-zinc-700 bg-zinc-900 p-2" value={platform} onChange={(event) => setPlatform(event.target.value as ExternalBuilderPlatform)}><option value="N8N">n8n</option><option value="MAKE">Make</option></select></label><label className="grid gap-2 text-sm">Acceptance Test<select className="border border-zinc-700 bg-zinc-900 p-2" value={testCaseId} onChange={(event) => setTestCaseId(event.target.value as typeof testCaseId)}><option value={validInquiryApprovedTest.id}>{validInquiryApprovedTest.title}</option><option value={deliveryBeforeApprovalTest.id}>{deliveryBeforeApprovalTest.title}</option></select></label><label className="sm:col-span-2 grid gap-2 text-sm">Sanitized log excerpt (선택)<textarea className="min-h-24 border border-zinc-700 bg-zinc-900 p-2" value={logExcerpt} onChange={(event) => setLogExcerpt(event.target.value)} /></label><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={userConfirmed} onChange={(event) => setUserConfirmed(event.target.checked)} />민감 정보를 제거했고, 외부 플랫폼에서 직접 수행한 결과임을 확인합니다.</label></section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2"><JsonPanel title="No-Key Execution Package" value={executionPackage} /><JsonPanel title="User Submission Preview" value={submission} /></section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2"><JsonPanel title="USER_SUBMITTED Evidence" value={"evidence" in outcome ? outcome.evidence : undefined} /><JsonPanel title="Acceptance Verdict" value={outcome} /></section>
      <div className="mt-8 border border-zinc-800 bg-zinc-950/70 p-5 text-sm text-zinc-300">BuildFlow 외부 API 호출 없음 · Credential 저장 없음 · 실제 연결은 사용자가 외부 플랫폼에서 진행 · 제출 결과의 출처: USER_SUBMITTED</div>
    </section></main>
  );
}
