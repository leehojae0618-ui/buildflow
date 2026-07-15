export function calculateWorkflowProgress(totalSteps: number, completedSteps: number) {
  const total = Math.max(0, Math.floor(totalSteps));
  const completed = Math.min(total, Math.max(0, Math.floor(completedSteps)));
  return { totalSteps: total, completedSteps: completed, progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100), isCompleted: total > 0 && completed === total };
}

export function workflowStatusForProgress(totalSteps: number, completedSteps: number): "selected" | "in_progress" | "completed" {
  if (completedSteps <= 0 || totalSteps <= 0) return "selected";
  return completedSteps >= totalSteps ? "completed" : "in_progress";
}

export const workflowStatusLabel: Record<string, string> = { selected: "선택됨", in_progress: "진행 중", setup: "준비 중", ready: "준비 완료", completed: "완료", archived: "보관됨" };
export const difficultyLabel: Record<string, string> = { beginner: "쉬움", intermediate: "보통", advanced: "어려움" };
