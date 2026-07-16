import type { GoalType, Requirement } from "./types";
const rules: Array<{ type: GoalType; category: string; output: string; keywords: string[] }> = [
  { type: "customer_support", category: "customer_service", output: "AI 고객 지원 시스템", keywords: ["고객센터", "고객 지원", "문의", "상담", "support"] },
  { type: "content_creation", category: "content", output: "AI 콘텐츠 생성 시스템", keywords: ["블로그", "상품 설명", "콘텐츠", "대본", "글 작성"] },
  { type: "data_analysis", category: "data", output: "AI 데이터 분석 시스템", keywords: ["리뷰 분석", "데이터 분석", "분석", "보고서", "분류"] },
  { type: "communication", category: "communication", output: "AI 커뮤니케이션 자동화 시스템", keywords: ["이메일", "slack", "알림", "메시지"] },
  { type: "productivity", category: "productivity", output: "AI 업무 생산성 시스템", keywords: ["회의", "요약", "반복 업무", "정리"] },
];
export function parseGoal(goal: string, constraints: { automation_level?: string; budget_range?: string; current_tools?: string[] } = {}): Requirement { const original = goal.trim(); const normalized = original.toLocaleLowerCase(); const match = rules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword.toLocaleLowerCase()))); const rule = match ?? { type: "unknown" as const, category: "unknown", output: "목표에 맞는 AI 시스템", keywords: [] }; return { version: "requirement-v1", goalOriginal: original, goalType: rule.type, category: rule.category, expectedOutput: rule.output, businessGoal: original, primaryUser: null, automationLevel: constraints.automation_level ?? "unknown", budget: constraints.budget_range ?? "unknown", deadline: null, currentTools: constraints.current_tools ?? [], restrictions: [], requiredIntegrations: [] }; }
