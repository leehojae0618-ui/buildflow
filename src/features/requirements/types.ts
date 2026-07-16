export type GoalType = "customer_support" | "content_creation" | "data_analysis" | "communication" | "productivity" | "unknown";
export type ConstraintLevel = "automatic" | "partial_automatic" | "user_required" | "expert_required" | "not_supported";
export type Requirement = { version: "requirement-v1"; goalOriginal: string; goalType: GoalType; category: string; expectedOutput: string; businessGoal: string; primaryUser: string | null; automationLevel: string; budget: string; deadline: string | null; currentTools: string[]; restrictions: string[]; requiredIntegrations: string[] };
export type ClarificationQuestion = { id: string; question: string; field: keyof Requirement | "platform" | "user_volume"; required: boolean };
export type ConstraintAssessment = { level: ConstraintLevel; reason: string; requiresUserAction: boolean };
export type ConsentRequirement = { id: string; subject: string; reason: string; status: "required" | "not_required" | "pending" };
export type RequirementSnapshot = { requirement: Requirement; clarificationQuestions: ClarificationQuestion[]; constraints: ConstraintAssessment[]; consents: ConsentRequirement[] };
