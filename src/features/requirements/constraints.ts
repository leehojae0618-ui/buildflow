import type { AutomationLevel, Capability, CapabilitySummary, ConstraintAssessment, Requirement } from "./types";

export function assessConstraints(requirement: Requirement): ConstraintAssessment[] {
  const results: ConstraintAssessment[] = [];
  results.push(requirement.automationLevel === "high" ? { level: "partial_automatic", reason: "외부 계정과 실행 권한 확인이 필요해 일부 단계는 사용자 승인이 필요합니다.", requiresUserAction: true } : { level: "automatic", reason: "현재 입력 기준으로 설계와 안내를 자동화할 수 있습니다.", requiresUserAction: false });
  if (requirement.budget === "free") results.push({ level: "partial_automatic", reason: "무료 플랜과 사용량 제한을 먼저 확인해야 합니다.", requiresUserAction: true });
  if (requirement.category === "unknown") results.push({ level: "user_required", reason: "목표를 더 구체화해야 적합한 시스템을 설계할 수 있습니다.", requiresUserAction: true });
  return results;
}

export function calculateCapabilitySummary(capabilities: Capability[]): CapabilitySummary {
  const count = (level: AutomationLevel) => capabilities.filter((capability) => capability.level === level).length;
  const total = capabilities.length;
  return { total, automatic: count("AUTO_BUILD"), partial: count("PARTIAL_BUILD"), userAction: count("USER_ACTION"), expertRequired: count("EXPERT_REQUIRED"), unsupported: count("UNSUPPORTED"), automationPercentage: total ? Math.round((count("AUTO_BUILD") / total) * 100) : 0 };
}

export function calculateCapabilities(requirement: Requirement, consentCount: number): Capability[] {
  const capabilities: Capability[] = [{ id: "requirement-analysis", label: "Requirement 분석", level: "AUTO_BUILD", reason: "입력한 목표를 Requirement Snapshot으로 정리합니다.", requiresConsent: false }];
  if (requirement.category === "unknown") capabilities.push({ id: "goal-clarification", label: "목표 구체화", level: "USER_ACTION", reason: "정확한 설계를 위해 추가 질문에 답해야 합니다.", requiresConsent: false });
  if (requirement.automationLevel === "high" || requirement.budget === "free") capabilities.push({ id: "implementation-plan", label: "구축 계획 준비", level: "PARTIAL_BUILD", reason: "권한, 플랜 또는 사용량 조건을 확인한 뒤 진행합니다.", requiresConsent: false });
  if (consentCount > 0) capabilities.push({ id: "external-connection", label: "외부 서비스 연결", level: "USER_ACTION", reason: "외부 계정 권한은 사용자가 직접 동의해야 합니다.", requiresConsent: true });
  return capabilities;
}
