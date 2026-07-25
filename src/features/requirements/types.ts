export type GoalType = "customer_support" | "content_creation" | "data_analysis" | "communication" | "productivity" | "unknown";
export type ConstraintLevel = "AUTO" | "PARTIAL" | "CONSENT_REQUIRED" | "MANUAL" | "EXPERT" | "UNSUPPORTED";
export type AutomationLevel = ConstraintLevel;

export type Requirement = {
  version: "requirement-v1";
  goalOriginal: string;
  goalType: GoalType;
  category: string;
  expectedOutput: string;
  businessGoal: string;
  primaryUser: string | null;
  automationLevel: string;
  budget: string;
  deadline: string | null;
  currentTools: string[];
  restrictions: string[];
  requiredIntegrations: string[];
};

export type ClarificationField = keyof Requirement | "platform" | "user_volume";
export type ClarificationImpact = "CRITICAL" | "IMPORTANT" | "OPTIONAL";
export type ClarificationAnswerSource = "USER" | "USER_UNKNOWN" | "SYSTEM_ASSUMPTION";
export type ClarificationValue = string | number | boolean | string[] | null;
export type ClarificationInteractionStatus = "ANALYZING" | "ASKING" | "REFRESHING" | "READY_FOR_REVIEW" | "BLOCKED" | "DEFERRED_WITH_ASSUMPTIONS";
export type ClarificationExitReason = "SUFFICIENT_INFORMATION" | "NO_MATERIAL_QUESTION" | "USER_PROCEED_WITH_ASSUMPTIONS" | "BLOCKED_CRITICAL_UNKNOWN" | "QUESTION_CYCLE_LIMIT";
export type ClarificationDecisionScope = "REQUIREMENT_READINESS";
export type ClarificationDecisionStatus = "NOT_READY" | "READY_WITH_ASSUMPTIONS" | "READY_FOR_REVIEW" | "SUPERSEDED";
export type ClarificationNextDecision =
  | "ANALYZE_REQUIREMENTS"
  | "ANSWER_CRITICAL_QUESTION"
  | "ANSWER_QUESTION"
  | "ANSWER_PENDING_QUESTION"
  | "REVIEW_REMAINING_QUESTIONS"
  | "REVIEW_ASSUMPTIONS"
  | "REVIEW_BLUEPRINT"
  | "REVIEW_CURRENT_REVISION";

export type ClarificationQuestion = {
  id: string;
  question: string;
  field: ClarificationField;
  required: boolean;
  priority: number;
  impact?: ClarificationImpact;
};
export type ClarificationAnswer = {
  questionId: string;
  field: ClarificationField;
  value: ClarificationValue;
  source: ClarificationAnswerSource;
  impact: ClarificationImpact;
};
export type ClarificationKnownFact = {
  field: ClarificationField;
  value: ClarificationValue;
  source: ClarificationAnswerSource;
};
export type ClarificationUnknown = {
  field: ClarificationField;
  questionId: string;
  impact: ClarificationImpact;
  reason: string;
};
export type ClarificationAssumption = {
  questionId: string;
  field: ClarificationField;
  value: ClarificationValue;
  reason: string;
  visibility: "USER_VISIBLE";
  impact: Exclude<ClarificationImpact, "CRITICAL">;
};
export type ClarificationFieldDiff = {
  field: ClarificationField;
  before: ClarificationValue;
  after: ClarificationValue;
  source: ClarificationAnswerSource;
};
export type ClarificationFieldValue = {
  field: ClarificationField;
  value: ClarificationValue;
  present: boolean;
  source: ClarificationAnswerSource;
};
export type ClarificationDerivedEffects = {
  blueprintCandidates: "UNCHANGED" | "REGENERATED" | "SELECTED_CANDIDATE_INVALIDATED";
  buildPlan: "UNCHANGED" | "REGENERATED";
};
export type ClarificationNonChangeScope =
  | "RUNTIME"
  | "PROVIDER"
  | "MCP"
  | "APPROVAL"
  | "SESSION"
  | "EVIDENCE"
  | "COMPLETED_EXECUTION";
export type ClarificationRevisionDiff = {
  revision: number;
  priorRevision: number | null;
  policyVersion: "clarification-confidence-v1";
  reason: "ANSWER_BATCH" | "ANSWER_REVISION" | "ASSUMPTION_ACCEPTED";
  before: ClarificationFieldValue[];
  changed: ClarificationFieldDiff[];
  after: ClarificationFieldValue[];
  affectedRequirementFields: ClarificationField[];
  confidence: {
    before: number;
    after: number;
    delta: number;
    exitReasonBefore: ClarificationExitReason | null;
    exitReasonAfter: ClarificationExitReason | null;
  };
  decisionState: {
    before: ClarificationDecisionState;
    after: ClarificationDecisionState;
  };
  supersession: {
    mode: "CURRENT_REVISION_SUPERSEDES_PREVIOUS";
    supersedesRevision: number;
    priorProjection: "SUPERSEDED";
  };
  derivedEffects: ClarificationDerivedEffects;
  unchangedScopes: ClarificationNonChangeScope[];
  reasonCodes: string[];
  sourceQuestionIds: string[];
};
export type ClarificationDecisionState = {
  scope: ClarificationDecisionScope;
  status: ClarificationDecisionStatus;
  clarificationRevision: number;
  previousClarificationRevision: number | null;
  supersededByClarificationRevision: number | null;
  confidencePolicyVersion: "clarification-confidence-v1";
  confidence: number;
  unresolvedQuestionIds: string[];
  assumptionQuestionIds: string[];
  revisionDiff: number | null;
  nextDecision: ClarificationNextDecision;
  reasonCodes: string[];
};
export type ClarificationDecisionProjection = {
  decisionState: ClarificationDecisionState;
  exitReason: ClarificationExitReason | null;
};
export type ClarificationRevisionTransitionInput = {
  previous: ClarificationDecisionProjection;
  next: ClarificationDecisionProjection;
};
export type ClarificationRevisionTransition = {
  previous: ClarificationDecisionProjection;
  current: ClarificationDecisionProjection;
};
export type ClarificationRevisionDiffInput = {
  previous: ClarificationDecisionProjection;
  next: ClarificationDecisionProjection;
  before: ClarificationFieldValue[];
  after: ClarificationFieldValue[];
  reason: ClarificationRevisionDiff["reason"];
  sourceQuestionIds: string[];
  derivedEffects: ClarificationDerivedEffects;
  unchangedScopes?: ClarificationNonChangeScope[];
};
export type ClarificationMaterialChange = {
  isMaterial: boolean;
  affectedRequirementFields: ClarificationField[];
  reason: "REQUIREMENT_FACTS_CHANGED" | "NO_REQUIREMENT_FACT_CHANGE";
};
export type ClarificationBlueprintRevisionProjection = {
  status: "UNCHANGED" | "REGENERATED" | "RETAINED" | "SUPERSEDED";
  previousSelectedCandidateId: string | null;
  selectedCandidateId: string | null;
  reason: "NO_MATERIAL_CHANGE" | "SELECTION_RETAINED" | "SELECTION_INVALIDATED" | "NO_PRIOR_SELECTION";
};
export type ClarificationPlanRevisionProjection = {
  status: "UNCHANGED" | "REGENERATED";
  sourceRevision: number;
  reason: "NO_MATERIAL_CHANGE" | "MATERIAL_REQUIREMENT_CHANGE";
};
export type ClarificationDerivedRevisionProjection = {
  materialChange: ClarificationMaterialChange;
  regeneration: {
    performed: boolean;
    count: 0 | 1;
    path: "NONE" | "CREATE_REQUIREMENT_SNAPSHOT";
  };
  blueprint: ClarificationBlueprintRevisionProjection;
  plan: ClarificationPlanRevisionProjection;
  snapshot: RequirementSnapshot | null;
};
export type ClarificationState = {
  revision: number;
  policyVersion: "clarification-confidence-v1";
  status: ClarificationInteractionStatus;
  exitReason: ClarificationExitReason | null;
  confidence: number;
  askedQuestionIds: string[];
  answers: ClarificationAnswer[];
  knownFacts: ClarificationKnownFact[];
  unknowns: ClarificationUnknown[];
  assumptions: ClarificationAssumption[];
  deferredQuestionIds: string[];
  batchCount: number;
  decisionState: ClarificationDecisionState;
  revisionDiffs: ClarificationRevisionDiff[];
};
export type ClarificationCoverage = {
  questionId: string;
  impact: ClarificationImpact;
  weight: number;
  coverage: number;
  source: "ANSWER" | "KNOWN_FACT" | "ASSUMPTION" | "UNRESOLVED" | "INVALID_ASSUMPTION";
};
export type ClarificationAnalysisInput = {
  requirement: Requirement;
  answers?: ClarificationAnswer[];
  knownFacts?: ClarificationKnownFact[];
  assumptions?: ClarificationAssumption[];
  revision?: number;
};
export type ClarificationAnswerBatchCommitInput = {
  expectedRevision: number;
  answers: ClarificationAnswer[];
  assumptions?: ClarificationAssumption[];
};
export type ClarificationAnswerBatchPersistenceProjection = {
  clarification: ClarificationState;
  diff: ClarificationRevisionDiff;
};
export type ClarificationQuestionBatchInput = {
  questions: ClarificationQuestion[];
  completedCycles: number;
  revision?: number;
  confidence?: number;
  answeredQuestionIds?: string[];
  resolvedQuestionIds?: string[];
  askedQuestionIds?: string[];
  assumptionQuestionIds?: string[];
};
export type ClarificationQuestionBatchStatus = "ASKING" | "AWAITING_CURRENT_ANSWERS" | "CYCLE_LIMIT_REACHED" | "NO_MATERIAL_QUESTION";
export type ClarificationQuestionBatch = {
  status: ClarificationQuestionBatchStatus;
  cycle: number;
  questions: ClarificationQuestion[];
  remainingQuestionIds: string[];
  exitReason: ClarificationExitReason | null;
  decisionState: ClarificationDecisionState;
};
export type ClarificationAnalysis = {
  policyVersion: "clarification-confidence-v1";
  questions: ClarificationQuestion[];
  unknowns: ClarificationUnknown[];
  knownFacts: ClarificationKnownFact[];
  coverage: ClarificationCoverage[];
  confidence: number;
  exitReason: ClarificationExitReason | null;
  decisionState: ClarificationDecisionState;
};

export type ConstraintAssessment = { level: ConstraintLevel; reason: string; requiresUserAction: boolean };
export type ConsentRequirement = { id: string; subject: string; reason: string; status: "required" | "not_required" | "pending" };
export type Capability = { id: string; label: string; level: AutomationLevel; reason: string; requiresConsent: boolean };
export type CapabilitySummary = { total: number; automation: number; partial: number; consent: number; manual: number; expert: number; unsupported: number };
export type ClarificationSummary = { completeness: number; buildReadiness: number; answered: number; total: number };
export type ConversationState = "WAITING" | "ASKING" | "COMPLETE" | "READY_FOR_BUILD";
export type ConversationSummary = { understood: string[]; missing: string[]; nextQuestion: ClarificationQuestion | null };
export type Conversation = { state: ConversationState; queue: ClarificationQuestion[]; missing: string[]; summary: ConversationSummary };
export type BuildIntelligence = { buildScore: number; automation: number; consent: number; manual: number; expert: number; unsupported: number; estimatedBuildMinutes: number; estimatedSetupMinutes: number; estimatedMonthlyCostCents: number; difficulty: "easy" | "moderate" | "hard"; riskScore: number; confidence: number; requiredAccounts: string[]; userActions: string[]; summary: string };
export type ComponentCategory = "frontend" | "llm" | "database" | "automation" | "notification" | "auth" | "storage" | "deployment";
export type ArchitectureComponent = { id: string; name: string; category: ComponentCategory; reason: string; required: boolean; setupMinutes?: number; monthlyCostCents?: number; riskWeight?: number };
export type ArchitectureConnection = { from: string; to: string; label: string };
export type ArchitectureDependency = { componentId: string; dependsOn: string[] };
export type ArchitectureSnapshot = { version: "architecture-v1"; components: ArchitectureComponent[]; connections: ArchitectureConnection[]; dependencies: ArchitectureDependency[]; summary: string };
export type RequirementSnapshot = { requirement: Requirement; buildPreference?: import("../preferences/types").BuildPreference; architectureCandidates?: import("../architecture/candidates").ArchitectureCandidates; selectedCandidateId?: string | null; applicationCapabilities: import("../capabilities/application").ApplicationCapability[]; applicationBlueprintId: import("../capabilities/application").ApplicationBlueprintId | null; clarificationQuestions: ClarificationQuestion[]; clarificationSummary: ClarificationSummary; conversation: Conversation; clarification?: ClarificationState; constraints: ConstraintAssessment[]; capabilities: Capability[]; capabilitySummary: CapabilitySummary; consents: ConsentRequirement[]; architecture: ArchitectureSnapshot; connectors: import("../connectors/types").Connector[]; credentialReferences: import("../credentials/types").CredentialReference[]; accountConnection: import("../connectors/oauth").AccountConnectionSession; buildIntelligence: BuildIntelligence; buildPlan: BuildPlan; installation: InstallationSession; testSuite: TestSuite };

import type { TestSuite } from "../testing/types";
import type { BuildPlan } from "../planner/types";
import type { InstallationSession } from "../installation/types";
