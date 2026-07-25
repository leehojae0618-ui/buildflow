import {
  calculateClarificationSummary,
  getClarificationQuestions,
  validateClarificationRevisionDiff,
} from "./clarification";
import { assessConstraints } from "./constraints";
import { getConsentRequirements } from "./consent";
import { parseGoal } from "./goal-parser";
import { calculateCapabilities, calculateCapabilitySummary } from "./constraints";
import { inferApplicationBlueprintId, inferApplicationCapabilities } from "../capabilities/application";
import { createConversation } from "./conversation";
import { calculateBuildIntelligence } from "./intelligence";
import type {
  ClarificationDerivedRevisionProjection,
  ClarificationMaterialChange,
  ClarificationRevisionDiff,
  RequirementSnapshot,
} from "./types";
import { generateBuildPlan } from "../planner/generator";
import { createInstallationSession } from "../installation/session";
import { createTestSuite } from "../testing/engine";
import { resolveRequiredConnectors } from "../connectors/resolver";
import { createAccountConnectionSession } from "../connectors/oauth";
import { createCredentialReferences } from "../credentials/references";
import { generateArchitectureCandidates } from "../architecture/candidates";
import { selectArchitectureCandidate } from "../architecture/candidates";
import { normalizeBuildPreference } from "../preferences/types";

export type RequirementSnapshotConstraints = {
  automation_level?: string;
  budget_range?: string;
  current_tools?: string[];
  cost_preference?: "FREE_FIRST" | "BALANCED" | "PERFORMANCE_FIRST" | "CUSTOM_BUDGET";
  automation_preference?: "GUIDED" | "PARTIAL_AUTOMATION" | "FULL_AUTOMATION";
  monthly_budget_limit?: number | null;
  preferred_tools?: string[];
  excluded_tools?: string[];
};

export type ClarificationDerivedRevisionInput = {
  diff: ClarificationRevisionDiff;
  previousSnapshot: RequirementSnapshot;
  goal: string;
  constraints?: RequirementSnapshotConstraints;
};

export function createRequirementSnapshot(goal: string, constraints: RequirementSnapshotConstraints = {}): RequirementSnapshot { const preference = normalizeBuildPreference({ ...constraints, costPreference: constraints.cost_preference, automationPreference: constraints.automation_preference, monthlyBudgetLimit: constraints.monthly_budget_limit, preferredTools: constraints.preferred_tools, excludedTools: constraints.excluded_tools }); const requirement = parseGoal(goal, constraints); const candidates = generateArchitectureCandidates(requirement, preference); const selected = candidates.candidates.find((candidate) => candidate.strategy === (preference.costPreference === "CUSTOM_BUDGET" ? "BALANCED" : preference.costPreference)) ?? candidates.candidates[1]; const architecture = selected.architecture; const consents = getConsentRequirements(requirement); const clarificationQuestions = getClarificationQuestions(requirement); const clarificationSummary = calculateClarificationSummary(clarificationQuestions); const capabilities = calculateCapabilities(requirement, consents.length); const capabilitySummary = calculateCapabilitySummary(capabilities); const applicationCapabilities = inferApplicationCapabilities({ goal }); const applicationBlueprintId = inferApplicationBlueprintId({ goal }); const connectors = resolveRequiredConnectors(requirement, architecture); const credentialReferences = createCredentialReferences(connectors); const connectorsWithReferences = connectors.map((connector) => ({ ...connector, credentialReference: credentialReferences.find((reference) => reference.providerId === connector.providerId) })); const accountConnection = createAccountConnectionSession(connectorsWithReferences); const buildIntelligence = calculateBuildIntelligence(requirement, architecture, capabilitySummary, consents, clarificationSummary.buildReadiness); const buildPlan = generateBuildPlan({ requirement, architecture, intelligence: buildIntelligence }); const installation = createInstallationSession(buildPlan); return { requirement, buildPreference: preference, architectureCandidates: candidates, selectedCandidateId: selected.id, applicationCapabilities, applicationBlueprintId, clarificationQuestions, clarificationSummary, conversation: createConversation(requirement, clarificationQuestions, clarificationSummary.buildReadiness), constraints: assessConstraints(requirement), capabilities, capabilitySummary, consents, architecture, connectors: connectorsWithReferences, credentialReferences, accountConnection, buildIntelligence, buildPlan, installation, testSuite: createTestSuite({ architecture, buildPlan, installation }) }; }

export function classifyClarificationMaterialChange(
  diff: ClarificationRevisionDiff,
): ClarificationMaterialChange {
  validateClarificationRevisionDiff(diff);
  return {
    isMaterial: diff.affectedRequirementFields.length > 0,
    affectedRequirementFields: [...diff.affectedRequirementFields],
    reason: diff.affectedRequirementFields.length > 0
      ? "REQUIREMENT_FACTS_CHANGED"
      : "NO_REQUIREMENT_FACT_CHANGE",
  };
}

export function projectClarificationDerivedRevision(
  input: ClarificationDerivedRevisionInput,
): ClarificationDerivedRevisionProjection {
  const materialChange = classifyClarificationMaterialChange(input.diff);
  const previousSelectedCandidateId = input.previousSnapshot.selectedCandidateId ?? null;

  if (!materialChange.isMaterial) {
    assertUnchangedDerivedEffects(input.diff);
    return {
      materialChange,
      regeneration: { performed: false, count: 0, path: "NONE" },
      blueprint: {
        status: "UNCHANGED",
        previousSelectedCandidateId,
        selectedCandidateId: previousSelectedCandidateId,
        reason: "NO_MATERIAL_CHANGE",
      },
      plan: {
        status: "UNCHANGED",
        sourceRevision: input.diff.revision,
        reason: "NO_MATERIAL_CHANGE",
      },
      snapshot: null,
    };
  }

  if (input.diff.derivedEffects.buildPlan !== "REGENERATED") {
    throw new TypeError("material clarification change must regenerate the Build Plan projection");
  }

  const regenerated = createRequirementSnapshot(input.goal, input.constraints);
  const retainedCandidate = previousSelectedCandidateId && regenerated.architectureCandidates
    ? selectArchitectureCandidate(regenerated.architectureCandidates, previousSelectedCandidateId)
    : null;
  const selectionInvalidated = previousSelectedCandidateId !== null && retainedCandidate === null;

  if (selectionInvalidated && input.diff.derivedEffects.blueprintCandidates !== "SELECTED_CANDIDATE_INVALIDATED") {
    throw new TypeError("invalidated Blueprint selection must be recorded in derived effects");
  }
  if (!selectionInvalidated && input.diff.derivedEffects.blueprintCandidates !== "REGENERATED") {
    throw new TypeError("material Blueprint projection must be recorded as regenerated");
  }

  const selectedCandidateId = retainedCandidate?.id ?? null;
  const architectureCandidates = regenerated.architectureCandidates
    ? {
        ...regenerated.architectureCandidates,
        selectedCandidateId,
        candidates: regenerated.architectureCandidates.candidates.map((candidate) =>
          candidate.id === selectedCandidateId ? retainedCandidate! : candidate,
        ),
      }
    : regenerated.architectureCandidates;
  const snapshot = {
    ...regenerated,
    architecture: retainedCandidate?.architecture ?? regenerated.architecture,
    architectureCandidates,
    selectedCandidateId,
  };

  return {
    materialChange,
    regeneration: { performed: true, count: 1, path: "CREATE_REQUIREMENT_SNAPSHOT" },
    blueprint: selectionInvalidated
      ? {
          status: "SUPERSEDED",
          previousSelectedCandidateId,
          selectedCandidateId: null,
          reason: "SELECTION_INVALIDATED",
        }
      : retainedCandidate
        ? {
            status: "RETAINED",
            previousSelectedCandidateId,
            selectedCandidateId,
            reason: "SELECTION_RETAINED",
          }
        : {
            status: "REGENERATED",
            previousSelectedCandidateId: null,
            selectedCandidateId: null,
            reason: "NO_PRIOR_SELECTION",
          },
    plan: {
      status: "REGENERATED",
      sourceRevision: input.diff.revision,
      reason: "MATERIAL_REQUIREMENT_CHANGE",
    },
    snapshot,
  };
}

function assertUnchangedDerivedEffects(diff: ClarificationRevisionDiff): void {
  if (diff.derivedEffects.blueprintCandidates !== "UNCHANGED" || diff.derivedEffects.buildPlan !== "UNCHANGED") {
    throw new TypeError("non-material clarification change must leave Blueprint and Plan projections unchanged");
  }
}
