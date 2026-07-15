import { getPromptAsset, type PromptAsset } from "./prompt-assets";
export type GuidedStepDetail = { id: string; stepOrder: number; title: string; purpose: string; whyItMatters: string; prerequisites: string[]; instructions: string[]; completionCriteria: string[]; warnings: string[]; primaryTool: { slug: string; name: string } | null; promptAsset: PromptAsset | null; isCompleted: boolean; completedAt: string | null };
type RawStep = { id: string; step_order: number; title: string; description: string; snapshot: unknown; is_completed: boolean; completed_at: string | null };
type RawTemplateStep = { step_order: number; title: string; description: string; tool_id: string | null; tools?: { slug: string; name: string } | null };
const splitText = (value: string) => value.split(/[.!?。！？\n]+/).map((part) => part.trim()).filter(Boolean);
export function buildGuidedStepDetail(input: { templateSlug: string; step: RawStep; templateStep?: RawTemplateStep; }): GuidedStepDetail {
  const snapshot = (input.step.snapshot && typeof input.step.snapshot === "object" ? input.step.snapshot : {}) as Record<string, unknown>;
  const description = input.step.description || input.templateStep?.description || "이 단계의 실행 내용을 확인합니다.";
  const purpose = typeof snapshot.purpose === "string" ? snapshot.purpose : description;
  const why = typeof snapshot.why_it_matters === "string" ? snapshot.why_it_matters : `${input.step.title} 단계는 Workflow가 다음 단계로 진행하기 위해 필요한 준비 과정입니다.`;
  const prerequisites = Array.isArray(snapshot.prerequisites) ? snapshot.prerequisites.map(String) : input.templateStep?.tools?.name ? [`${input.templateStep.tools.name} 계정 또는 접근 권한`] : [];
  const instructions = Array.isArray(snapshot.instructions) ? snapshot.instructions.map(String) : splitText(typeof snapshot.action_description === "string" ? snapshot.action_description : description);
  const completionCriteria = Array.isArray(snapshot.completion_criteria) ? snapshot.completion_criteria.map(String) : [typeof snapshot.output_description === "string" ? snapshot.output_description : `${input.step.title}의 결과를 확인합니다.`];
  const warnings = Array.isArray(snapshot.warnings) ? snapshot.warnings.map(String) : [];
  return { id: input.step.id, stepOrder: input.step.step_order, title: input.step.title, purpose, whyItMatters: why, prerequisites, instructions: instructions.length ? instructions : [purpose], completionCriteria, warnings, primaryTool: input.templateStep?.tools ? { slug: input.templateStep.tools.slug, name: input.templateStep.tools.name } : null, promptAsset: getPromptAsset(input.templateSlug, input.step.step_order), isCompleted: input.step.is_completed, completedAt: input.step.completed_at };
}
export function firstIncompleteStep(steps: GuidedStepDetail[]) { return steps.find((step) => !step.isCompleted)?.stepOrder ?? null; }
