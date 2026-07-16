import { z } from "zod";

const constraintsSchema = z.object({
  ai_skill_level: z.enum(["beginner", "intermediate", "advanced"]),
  can_code: z.enum(["false", "true"]),
  budget_range: z.enum(["free", "low", "medium", "high", "unknown"]),
  automation_level: z.enum(["guide", "partial", "high", "unknown"]),
  current_tools: z.string().max(500).optional().default(""),
  cost_preference: z.enum(["FREE_FIRST", "BALANCED", "PERFORMANCE_FIRST", "CUSTOM_BUDGET"]).optional().default("BALANCED"),
  automation_preference: z.enum(["GUIDED", "PARTIAL_AUTOMATION", "FULL_AUTOMATION"]).optional().default("PARTIAL_AUTOMATION"),
  monthly_budget_limit: z.coerce.number().int().min(0).max(100000000).nullable().optional().default(null),
  preferred_tools: z.string().max(500).optional().default(""),
  excluded_tools: z.string().max(500).optional().default(""),
});

export const projectSchema = z.object({
  title: z.string().trim().min(2, "프로젝트 이름은 2자 이상 입력해주세요.").max(80, "프로젝트 이름은 80자 이하로 입력해주세요."),
  goal: z.string().trim().min(10, "목표는 10자 이상 입력해주세요.").max(2000, "목표는 2000자 이하로 입력해주세요."),
  description: z.string().trim().max(3000, "추가 설명은 3000자 이하로 입력해주세요.").optional().default(""),
  ...constraintsSchema.shape,
});

export function parseProjectForm(formData: FormData) {
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false as const, fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message])) };
  const currentTools = [...new Set(parsed.data.current_tools.split(",").map((tool) => tool.trim()).filter(Boolean))].slice(0, 20);
  if (currentTools.some((tool) => tool.length > 80)) return { success: false as const, fieldErrors: { current_tools: "도구 이름은 항목당 80자 이하로 입력해주세요." } };
  const splitTools = (value: string) => [...new Set(value.split(",").map((tool) => tool.trim()).filter(Boolean))].slice(0, 20);
  return { success: true as const, data: { ...parsed.data, current_tools: currentTools, preferred_tools: splitTools(parsed.data.preferred_tools), excluded_tools: splitTools(parsed.data.excluded_tools), can_code: parsed.data.can_code === "true" } };
}
