import { createHash } from "node:crypto";
import {
  buildPackageApprovalDecision,
  buildPackageApprovalRequest,
  evaluatePackageApprovalGate,
  type PackageApprovalGateResult,
} from "../agents/package-approval-gate";
import { buildPackageEvidenceBundle } from "../agents/package-evidence-bundle";
import { buildPackageEvidenceReport } from "../agents/package-evidence-report";
import { exportAgentPackageArtifact, stableSerializeAgentPackage } from "../agents/package-export";
import { createAgentPackageProfile, validateAgentPackageReadiness } from "../agents/package-profile";
import { verifyAgentPackageArtifact } from "../agents/package-verification";
import { runPackageVerificationPipeline } from "../agents/package-verification-pipeline";
import { buildRuntimeExecutionRequest, type RuntimeExecutionRequest } from "../agents/runtime-execution-request";
import { buildRuntimePlan, type RuntimePlan, type RuntimeTransientProviderInput, validateRuntimePlan } from "../agents/runtime-plan";
import { resolveAgentToolRequirements } from "../agents/tool-resolution";
import type { AgentBlueprint, AgentDefinition } from "../agents/types";
import { generateAgentDefinition } from "../agents/generator";
import { validateAgentBlueprint, validateAgentDefinition } from "../agents/validator";
import { validateAgentReadiness } from "../agents/validation-gate";
import { buildRuntimeApprovalBinding } from "../runtime-approval/validator";
import type { RuntimeApprovalBinding } from "../runtime-approval/types";
import type { Bf0DesignDraft } from "./bf0-view-model";

export type Bf0RuntimeEligibilityReason =
  | "DIRECT_INPUT_REQUIRED"
  | "LOCAL_RESULT_REQUIRED"
  | "EXTERNAL_FLOW_DETECTED"
  | "DRAFT_INCOMPLETE"
  | "UNSAFE_INPUT";

export type Bf0RuntimeProjection =
  | {
      status: "INELIGIBLE";
      reason: Bf0RuntimeEligibilityReason;
      safeMessage: string;
    }
  | {
      status: "INVALID";
      safeMessage: string;
    }
  | {
      status: "ELIGIBLE";
      projectId: string;
      userId: string;
      blueprint: AgentBlueprint;
      definition: AgentDefinition;
      approvalGate: PackageApprovalGateResult;
      runtimeExecutionRequest: RuntimeExecutionRequest;
      runtimePlan: RuntimePlan;
      runtimeApprovalBinding: RuntimeApprovalBinding;
      transientProviderInput: RuntimeTransientProviderInput;
    };

type Bf0RuntimeIneligible = Exclude<Bf0RuntimeProjection, { status: "ELIGIBLE" }>;

export type Bf0RuntimeProjectionOptions = {
  runtimeInput?: string;
  systemInstruction?: string;
  model?: string;
  profileId?: string;
};

function createBf0RuntimeBlueprint(options: Required<Pick<Bf0RuntimeProjectionOptions, "model" | "profileId">>): AgentBlueprint {
  return {
  id: options.profileId,
  version: "1.0.0",
  displayName: options.profileId === "bf0-controlled-runtime" ? "BF0 Controlled Runtime" : "BF0 Customer Reply Runtime",
  capabilities: ["AI_RESPONSE"],
  deliveryModes: ["CHAT"],
  interfaceModes: ["WEB_CHAT"],
  requiredProviders: ["openai"],
  compatibility: { minBuildFlowVersion: "0.1.0", minRuntimeVersion: "1.0.0" },
  blocks: [
    { id: "model.runtime", kind: "MODEL", name: "Runtime model contract", required: true, provider: "openai", model: options.model },
    { id: "prompt.runtime", kind: "PROMPT", name: "Runtime prompt", required: true, promptRef: `prompts/${options.profileId}/system` },
    { id: "guardrail.runtime", kind: "GUARDRAIL", name: "Runtime guardrail", required: true, rules: ["NO_SECRET_EXPOSURE", "NO_UNAPPROVED_TOOL_EXECUTION"] },
    { id: "output.runtime", kind: "OUTPUT", name: "BuildFlow web result", required: true, schema: { id: `${options.profileId}-result`, version: "1.0.0" } },
    { id: "delivery.runtime", kind: "DELIVERY_SURFACE", name: "BuildFlow web result", required: true, deliveryMode: "CHAT", interfaces: ["WEB_CHAT"] },
  ],
  };
}

const externalPattern = /gmail|slack|github|repository|webhook|\bapi\b|database|\bdb\b|n8n|make|mcp|oauth|google\s*forms?|web\s*form|웹\s*폼|구글\s*폼|데이터베이스|파일\s*(업로드|저장)|외부\s*(연결|서비스)/i;

function digest(value: unknown) {
  return createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");
}

function ineligible(reason: Bf0RuntimeEligibilityReason, safeMessage: string): Extract<Bf0RuntimeProjection, { status: "INELIGIBLE" }> {
  return { status: "INELIGIBLE", reason, safeMessage };
}

function invalid(): Extract<Bf0RuntimeProjection, { status: "INVALID" }> {
  return { status: "INVALID", safeMessage: "통제된 내부 실행 준비를 완료하지 못했습니다." };
}

export function getBf0RuntimeEligibility(draft: Pick<Bf0DesignDraft, "idea" | "goal" | "source" | "approval" | "output">): Bf0RuntimeIneligible | null {
  if (!draft.idea.trim() || !draft.goal?.trim() || !draft.approval?.trim()) {
    return ineligible("DRAFT_INCOMPLETE", "설계에 필요한 선택을 모두 완료한 뒤 내부 실행 검증을 확인할 수 있습니다.");
  }
  if (draft.source !== "직접 입력") {
    return ineligible("DIRECT_INPUT_REQUIRED", "이 설계는 현재 통제된 내부 실행 대상이 아닙니다. 구축 가이드는 계속 확인할 수 있습니다.");
  }
  if (draft.output !== "다운로드 결과") {
    return ineligible("LOCAL_RESULT_REQUIRED", "외부 결과 위치가 포함된 설계는 통제된 내부 실행 대상이 아닙니다.");
  }
  if (externalPattern.test([draft.idea, draft.goal, draft.source, draft.output].filter(Boolean).join(" "))) {
    return ineligible("EXTERNAL_FLOW_DETECTED", "외부 연결 또는 서비스 작업이 필요한 설계는 통제된 내부 실행 대상이 아닙니다.");
  }
  return null;
}

/**
 * Builds the small, no-tool product artifact chain used only after the user
 * explicitly requests a controlled internal verification.
 */
export function projectBf0Runtime(
  draft: Pick<Bf0DesignDraft, "idea" | "goal" | "source" | "approval" | "output">,
  options: Bf0RuntimeProjectionOptions = {},
): Bf0RuntimeProjection {
  const eligibility = getBf0RuntimeEligibility(draft);
  if (eligibility) return eligibility;

  const runtimeInput = options.runtimeInput === undefined
    ? draft.idea.trim()
    : options.runtimeInput.trim();
  const model = options.model?.trim() || "controlled-runtime-v1";
  const profileId = options.profileId?.trim() || "bf0-controlled-runtime";
  const blueprint = createBf0RuntimeBlueprint({ model, profileId });

  const transientProviderInput: RuntimeTransientProviderInput = {
    systemInstruction: options.systemInstruction?.trim() || "Produce only a controlled BuildFlow runtime reference. Do not call external services.",
    userInput: runtimeInput,
  };
  if (/sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|Bearer\s+/i.test(transientProviderInput.userInput)) {
    return ineligible("UNSAFE_INPUT", "안전하게 처리할 수 없는 입력이 포함되어 내부 실행 검증을 시작하지 않았습니다.");
  }

  const inputChecksum = digest({ source: "direct-input", runtimeInput: transientProviderInput.userInput });
  const projectId = `${profileId}-${inputChecksum.slice(0, 24)}`;
  const userId = `${profileId}-user-${inputChecksum.slice(0, 16)}`;
  if (!validateAgentBlueprint(blueprint).valid) return invalid();

  const generated = generateAgentDefinition({
    projectId,
    goal: draft.goal!.trim(),
    blueprint,
    selectedDeliveryMode: "CHAT",
    selectedInterfaceModes: ["WEB_CHAT"],
  });
  if (generated.warnings.length || generated.definition.validationStatus !== "VALID" || !validateAgentDefinition(generated.definition, blueprint).valid) return invalid();

  const toolResolutionPlan = resolveAgentToolRequirements({ requirements: [], candidates: [] });
  const validationGate = validateAgentReadiness({ definition: generated.definition, blueprint, toolResolutionPlan, mcpTools: [] });
  const profile = createAgentPackageProfile({ packageId: `pkg.${projectId}`, packageVersion: "1.0.0", buildflowVersion: "0.1.0", definition: generated.definition, toolResolutionPlan, validationGate, mcpTools: [] });
  const readiness = validateAgentPackageReadiness(profile, { toolResolutionPlan, validationGate, mcpTools: [] });
  if (!readiness.exportReady) return invalid();

  try {
    const packageArtifact = exportAgentPackageArtifact({ formatVersion: "bps-agent-profile-artifact-1.0", profile, readiness });
    const verificationReport = verifyAgentPackageArtifact(packageArtifact);
    const packageArtifactReference = `artifact://${profile.packageId}/${profile.packageVersion}/profile`;
    const verificationReportReference = `verification://${profile.packageId}/${profile.packageVersion}/report`;
    const evidenceBundleResult = buildPackageEvidenceBundle({ packageArtifact, verificationReport, packageArtifactReference, verificationReportReference });
    const verificationPipeline = runPackageVerificationPipeline({ formatVersion: "bps-agent-profile-artifact-1.0", profile, readiness, packageArtifactReference, verificationReportReference });
    const evidenceReport = buildPackageEvidenceReport({
      packageArtifact,
      verificationReport,
      evidenceBundleResult,
      verificationPipeline,
      sourceReferences: { packageArtifact: packageArtifactReference, verificationReport: verificationReportReference, evidenceBundle: `bundle://${profile.packageId}/${profile.packageVersion}/evidence`, verificationPipeline: `pipeline://${profile.packageId}/${profile.packageVersion}/summary` },
    });
    if (evidenceReport.status !== "VALID_WITH_LIMITATIONS") return invalid();
    const approver = { actorId: userId, actorType: "USER" as const, roleReference: "controlled-user" };
    const request = buildPackageApprovalRequest({ evidenceReport: evidenceReport.report, requestedScopes: ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"], requestedBy: approver, requiredApprover: approver, expirationPolicy: { kind: "REFERENCE_ONLY" } });
    if (request.status !== "VALID") return invalid();
    const decisions = ["PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"].map((scope) => buildPackageApprovalDecision({ request: request.request, scope, actorReference: approver, decision: "APPROVE", reasonCode: "VERIFIED_SCOPE" }));
    if (decisions.some((decision) => decision.status !== "RECORDED")) return invalid();
    const recordedDecisions = decisions.filter((decision): decision is Extract<typeof decision, { status: "RECORDED" }> => decision.status === "RECORDED");
    const approvalGate = evaluatePackageApprovalGate({ evidenceReport: evidenceReport.report, request: request.request, decisions: recordedDecisions.map((decision) => decision.record), requestedExecutionScopes: ["RUNTIME_EXECUTION"] });
    if (approvalGate.gateStatus !== "APPROVED_WITH_LIMITATIONS" || approvalGate.authorization.authorizationStatus !== "AUTHORIZED_WITH_LIMITATIONS") return invalid();
    const inputArtifactReference = { artifactId: `bf0-input-${inputChecksum.slice(0, 24)}`, artifactType: "bf0-direct-input", integrityChecksum: inputChecksum, mediaType: "text/plain", storageReference: "memory://bf0-direct-input" };
    const runtimeExecutionRequest = buildRuntimeExecutionRequest({ approvalGate, requestedExecutionMode: "STANDARD", executionProfileReference: { referenceId: `${profileId}-profile`, integrityChecksum: digest({ profile: profileId }), referenceType: "runtime-profile" }, requestedBy: approver, inputArtifactReferences: [inputArtifactReference], requestedCapabilityReferences: [{ capabilityId: "AI_RESPONSE", policyReference: `policy://${profileId}/ai-response`, integrityChecksum: digest({ capability: "AI_RESPONSE" }) }], expirationPolicy: { mode: "REFERENCE_ONLY", expirationReference: `${profileId}-invocation` } });
    if (runtimeExecutionRequest.status !== "VALID") return invalid();
    const runtimePlan = buildRuntimePlan({ runtimeExecutionRequest: runtimeExecutionRequest.value, blueprint, blueprintIntegrityChecksum: digest(blueprint), agentDefinition: generated.definition, agentDefinitionIntegrityChecksum: digest(generated.definition), inputArtifactReference, transientProviderInput });
    if (runtimePlan.status !== "VALID" || !validateRuntimePlan(runtimePlan.value).valid) return invalid();
    const runtimeApprovalBinding = buildRuntimeApprovalBinding({ projectId, userId, runtimeExecutionRequest: runtimeExecutionRequest.value, runtimePlan: runtimePlan.value });
    if (runtimeApprovalBinding.status !== "VALID") return invalid();
    return { status: "ELIGIBLE", projectId, userId, blueprint, definition: generated.definition, approvalGate, runtimeExecutionRequest: runtimeExecutionRequest.value, runtimePlan: runtimePlan.value, runtimeApprovalBinding: runtimeApprovalBinding.value, transientProviderInput };
  } catch {
    return invalid();
  }
}
