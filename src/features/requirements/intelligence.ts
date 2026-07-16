import type { ArchitectureSnapshot, BuildIntelligence, CapabilitySummary, ConsentRequirement, Requirement } from "./types";

const accountLabels: Record<string, string> = { gmail: "Google", 이메일: "Google", google: "Google", 구글: "Google", slack: "Slack", 카페24: "카페24", 쇼핑몰: "쇼핑몰" };

export function calculateBuildIntelligence(requirement: Requirement, architecture: ArchitectureSnapshot, summary: CapabilitySummary, consents: ConsentRequirement[], readiness: number): BuildIntelligence {
  const components = architecture.components;
  const architectureComplexity = components.length + architecture.connections.length + architecture.dependencies.reduce((total, dependency) => total + dependency.dependsOn.length, 0);
  const architectureCompleteness = Math.min(100, Math.round((components.length / Math.max(1, components.filter((component) => component.required).length)) * 50 + (architecture.connections.length > 0 ? 25 : 0) + (architecture.dependencies.length === components.length ? 25 : 0)));
  const requiredAccounts = [...new Set([...components.filter((component) => component.category === "auth" || component.category === "llm").map((component) => component.name), ...consents.map((consent) => accountLabels[consent.id] ?? consent.subject.replace(" 계정 연결", ""))])];
  const estimatedSetupMinutes = 3 + components.filter((component) => component.category === "auth").reduce((total, component) => total + (component.setupMinutes ?? 2), 0) + consents.length * 2 + summary.manual * 5;
  const estimatedBuildMinutes = Math.max(3, components.reduce((total, component) => total + (component.setupMinutes ?? 2), 0) + architecture.connections.length + summary.partial * 2 + summary.expert * 15 + summary.unsupported * 20);
  const estimatedMonthlyCostCents = components.reduce((total, component) => total + (component.monthlyCostCents ?? 0), 0) + (requirement.budget === "free" ? 0 : 0);
  const difficulty = summary.expert > 0 || summary.unsupported > 0 || architectureComplexity > 12 ? "hard" : summary.manual > 0 || summary.partial > 0 || architectureComplexity > 7 ? "moderate" : "easy";
  const architectureRisk = components.reduce((total, component) => total + (component.riskWeight ?? 0), 0) + architecture.connections.length * 2;
  const riskScore = Math.min(100, architectureRisk + summary.unsupported * 35 + summary.expert * 20 + summary.manual * 8 + consents.length * 3);
  const confidence = Math.max(20, Math.min(99, Math.round(readiness * 0.45 + architectureCompleteness * 0.35 + summary.automation * 0.2 - riskScore * 0.15)));
  const buildScore = Math.max(0, Math.min(100, Math.round(summary.automation * 0.45 + (100 - riskScore) * 0.25 + confidence * 0.2 + Math.max(0, 100 - architectureComplexity * 5) * 0.1)));
  const userActions = [...consents.map((consent) => consent.subject), ...Array.from({ length: summary.manual }, (_, index) => `수동 설정 ${index + 1}`)];
  return { buildScore, automation: summary.automation, consent: consents.length, manual: summary.manual, expert: summary.expert, unsupported: summary.unsupported, estimatedBuildMinutes, estimatedSetupMinutes, estimatedMonthlyCostCents, difficulty, riskScore: Math.round(riskScore), confidence, requiredAccounts, userActions, summary: `이 시스템은 약 ${estimatedBuildMinutes + estimatedSetupMinutes}분 안에 구축 준비가 가능합니다. Architecture ${components.length}개 Component와 ${architecture.connections.length}개 연결을 기준으로 계산했습니다.` };
}
