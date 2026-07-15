import { describe, expect, it } from "vitest";
import { calculateWorkflowProgress, difficultyLabel, workflowStatusForProgress, workflowStatusLabel } from "./progress";

describe("workflow progress", () => {
  it("calculates empty progress", () => expect(calculateWorkflowProgress(0, 0)).toEqual({ totalSteps: 0, completedSteps: 0, progressPercent: 0, isCompleted: false }));
  it.each([[0, 5, 0], [1, 5, 20], [3, 5, 60], [5, 5, 100]])("calculates %s/%s", (completed, total, percent) => expect(calculateWorkflowProgress(total, completed).progressPercent).toBe(percent));
  it("clamps invalid counts", () => expect(calculateWorkflowProgress(-1, 99).completedSteps).toBe(0));
  it("maps status from completion", () => { expect(workflowStatusForProgress(3, 0)).toBe("selected"); expect(workflowStatusForProgress(3, 1)).toBe("in_progress"); expect(workflowStatusForProgress(3, 3)).toBe("completed"); expect(workflowStatusForProgress(3, 2)).toBe("in_progress"); });
  it("maps user-facing labels", () => { expect(workflowStatusLabel.completed).toBe("완료"); expect(workflowStatusLabel.in_progress).toBe("진행 중"); expect(difficultyLabel.advanced).toBe("어려움"); });
});
