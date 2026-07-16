import { calculateClarificationSummary, getClarificationQuestions } from "./clarification";
import { assessConstraints } from "./constraints";
import { getConsentRequirements } from "./consent";
import { parseGoal } from "./goal-parser";
import { calculateCapabilities, calculateCapabilitySummary } from "./constraints";
import { createConversation } from "./conversation";
import { calculateBuildIntelligence } from "./intelligence";
import { selectArchitecture } from "../architecture/selector";
import type { RequirementSnapshot } from "./types";
import { generateBuildPlan } from "../planner/generator";
export function createRequirementSnapshot(goal: string, constraints: { automation_level?: string; budget_range?: string; current_tools?: string[] } = {}): RequirementSnapshot { const requirement = parseGoal(goal, constraints); const consents = getConsentRequirements(requirement); const clarificationQuestions = getClarificationQuestions(requirement); const clarificationSummary = calculateClarificationSummary(clarificationQuestions); const capabilities = calculateCapabilities(requirement, consents.length); const capabilitySummary = calculateCapabilitySummary(capabilities); const architecture = selectArchitecture(requirement); const buildIntelligence = calculateBuildIntelligence(requirement, architecture, capabilitySummary, consents, clarificationSummary.buildReadiness); return { requirement, clarificationQuestions, clarificationSummary, conversation: createConversation(requirement, clarificationQuestions, clarificationSummary.buildReadiness), constraints: assessConstraints(requirement), capabilities, capabilitySummary, consents, architecture, buildIntelligence, buildPlan: generateBuildPlan({ requirement, architecture, intelligence: buildIntelligence }) }; }
