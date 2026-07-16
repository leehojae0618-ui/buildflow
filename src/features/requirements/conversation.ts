import type { ClarificationQuestion, Conversation, Requirement } from "./types";

const missingLabels: Record<string, string> = { platform: "플랫폼", user_volume: "예상 사용자 규모", primaryUser: "주요 사용자", budget: "예산", currentTools: "현재 사용 Tool", automationLevel: "자동화 수준" };

export function getMissingRequirements(requirement: Requirement, questions: ClarificationQuestion[]): string[] {
  return questions.filter((question) => question.required).map((question) => missingLabels[String(question.field)] ?? question.question);
}

export function createConversation(requirement: Requirement, questions: ClarificationQuestion[], buildReadiness: number): Conversation {
  const queue = [...questions].sort((a, b) => a.priority - b.priority);
  const missing = getMissingRequirements(requirement, queue);
  const nextQuestion = queue[0] ?? null;
  const state = queue.length === 0 ? (buildReadiness >= 80 ? "READY_FOR_BUILD" : "COMPLETE") : "ASKING";
  return { state, queue, missing, summary: { understood: [requirement.businessGoal, requirement.expectedOutput], missing, nextQuestion } };
}
