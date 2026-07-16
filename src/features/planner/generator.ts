import type { ArchitectureComponent } from "../requirements/types";
import type { BuildPhase, BuildPhaseId, BuildPlan, BuildPlannerInput, BuildTask, BuildTaskAction } from "./types";

const phaseOrder: Array<[BuildPhaseId, string]> = [["preparation", "Preparation"], ["accounts", "Accounts"], ["environment", "Environment"], ["database", "Database"], ["authentication", "Authentication"], ["automation", "Automation"], ["deployment", "Deployment"], ["verification", "Verification"]];
const categoryPhase: Record<string, BuildPhaseId> = { database: "database", auth: "authentication", automation: "automation", notification: "automation", storage: "environment", frontend: "environment", llm: "environment" };

function actionFor(component: ArchitectureComponent, input: BuildPlannerInput): BuildTaskAction { if (component.category === "auth" || input.intelligence.consent > 0 && component.category === "llm") return "USER_ACTION"; if (input.intelligence.expert > 0 && component.category === "automation") return "EXPERT_REQUIRED"; return "AUTO"; }

export function generateBuildPlan(input: BuildPlannerInput): BuildPlan {
  const phases: BuildPhase[] = phaseOrder.map(([id, title], order) => ({ id, title, order, taskIds: [] }));
  const tasks: BuildTask[] = [{ id: "prepare-requirements", phaseId: "preparation", title: "Requirement 확인", description: "Requirement Snapshot과 Build Receipt를 확인합니다.", action: "AUTO", status: "PENDING", dependencyIds: [], componentIds: [] }];
  for (const component of input.architecture.components) { const phaseId = categoryPhase[component.category] ?? "environment"; const task: BuildTask = { id: `configure-${component.id}`, phaseId, title: `${component.name} 준비`, description: component.reason, action: actionFor(component, input), status: "PENDING", dependencyIds: tasks.length > 0 ? [tasks[tasks.length - 1].id] : [], componentIds: [component.id] }; tasks.push(task); }
  tasks.push({ id: "verify-system", phaseId: "verification", title: "시스템 검증", description: "연결과 기본 동작을 확인합니다.", action: "USER_ACTION", status: "PENDING", dependencyIds: tasks.length > 0 ? [tasks[tasks.length - 1].id] : [], componentIds: input.architecture.components.map((component) => component.id) });
  for (const task of tasks) phases.find((phase) => phase.id === task.phaseId)?.taskIds.push(task.id);
  return { version: "build-plan-v1", phases: phases.filter((phase) => phase.taskIds.length > 0), tasks, progress: calculateBuildPlanProgress(tasks), summary: `${phases.filter((phase) => phase.taskIds.length > 0).length}개 Phase, ${tasks.length}개 Task로 구축 순서를 구성했습니다.` };
}

export function calculateBuildPlanProgress(tasks: BuildTask[]) { const total = tasks.length; const completed = tasks.filter((task) => task.status === "COMPLETED").length; return { total, completed, percentage: total ? Math.round((completed / total) * 100) : 0 }; }
