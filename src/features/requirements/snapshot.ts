import { calculateClarificationSummary, getClarificationQuestions } from "./clarification";
import { assessConstraints } from "./constraints";
import { getConsentRequirements } from "./consent";
import { parseGoal } from "./goal-parser";
import { calculateCapabilities, calculateCapabilitySummary } from "./constraints";
import type { RequirementSnapshot } from "./types";
export function createRequirementSnapshot(goal: string, constraints: { automation_level?: string; budget_range?: string; current_tools?: string[] } = {}): RequirementSnapshot { const requirement = parseGoal(goal, constraints); const consents = getConsentRequirements(requirement); const clarificationQuestions = getClarificationQuestions(requirement); const capabilities = calculateCapabilities(requirement, consents.length); return { requirement, clarificationQuestions, clarificationSummary: calculateClarificationSummary(clarificationQuestions), constraints: assessConstraints(requirement), capabilities, capabilitySummary: calculateCapabilitySummary(capabilities), consents }; }
