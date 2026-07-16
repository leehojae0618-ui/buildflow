import type { ArchitectureSnapshot, BuildIntelligence, CapabilitySummary, ConsentRequirement, Requirement } from "./types";

const accountLabels: Record<string, string> = { gmail: "Google", 이메일: "Google", google: "Google", 구글: "Google", slack: "Slack", 카페24: "카페24", 쇼핑몰: "쇼핑몰" };
const accountCosts: Record<string, number> = { gmail: 0, 이메일: 0, google: 0, 구글: 0, slack: 0, 카페24: 2900, 쇼핑몰: 2900 };

export function calculateBuildIntelligence(requirement: Requirement, architecture: ArchitectureSnapshot, summary: CapabilitySummary, consents: ConsentRequirement[], readiness: number): BuildIntelligence {
  const integrations = [...new Set([...requirement.currentTools, ...requirement.requiredIntegrations].map((item) => item.trim().toLocaleLowerCase()).filter(Boolean))];
  const requiredAccounts = [...new Set(integrations.flatMap((item) => Object.keys(accountLabels).filter((key) => item.includes(key)).map((key) => accountLabels[key]))), ...consents.map((consent) => accountLabels[consent.id] ?? consent.subject.replace(" 계정 연결", ""))];
  const estimatedSetupMinutes = 3 + consents.length * 2 + summary.manual * 5;
  const estimatedBuildMinutes = Math.max(3, 2 + architecture.components.length + summary.partial * 2 + summary.expert * 15 + summary.unsupported * 20);
  const architectureCost = architecture.components.reduce((total, component) => total + (component.id === "n8n" ? 0 : component.id === "supabase" ? 0 : 0), 0);
  const estimatedMonthlyCostCents = integrations.reduce((total, item) => total + (accountCosts[item] ?? 0), architectureCost) + (requirement.budget === "free" ? 0 : 1500);
  const difficulty = summary.expert > 0 || summary.unsupported > 0 ? "hard" : summary.manual > 0 || summary.partial > 0 ? "moderate" : "easy";
  const riskScore = Math.min(100, summary.unsupported * 35 + summary.expert * 20 + summary.manual * 8 + consents.length * 3);
  const confidence = Math.max(20, Math.min(99, readiness - riskScore / 2 + summary.automation / 5));
  const buildScore = Math.max(0, Math.round(summary.automation * 0.7 + (100 - riskScore) * 0.2 + confidence * 0.1));
  const userActions = [...consents.map((consent) => consent.subject), ...Array.from({ length: summary.manual }, (_, index) => `수동 설정 ${index + 1}`)];
  return { buildScore, automation: summary.automation, consent: consents.length, manual: summary.manual, expert: summary.expert, unsupported: summary.unsupported, estimatedBuildMinutes, estimatedSetupMinutes, estimatedMonthlyCostCents, difficulty, riskScore: Math.round(riskScore), confidence: Math.round(confidence), requiredAccounts, userActions, summary: `이 시스템은 약 ${estimatedBuildMinutes + estimatedSetupMinutes}분 안에 구축 준비가 가능합니다. 자동 구축률은 ${summary.automation}%입니다.` };
}
