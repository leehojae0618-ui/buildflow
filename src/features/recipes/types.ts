import { z } from "zod";

export const recipeCategories = ["SUPPORT", "NOTIFICATION", "RESEARCH", "CONTENT", "SALES", "DATA", "KNOWLEDGE", "MEETINGS", "COMMERCE", "AI"] as const;
export const serviceConnectionModes = ["OAUTH", "API_KEY", "NONE", "MANAGED_AUTH_CANDIDATE"] as const;
export const verificationStatuses = ["CURATED", "REFERENCE_ONLY", "LOCALLY_VALIDATED", "LIVE_VALIDATED"] as const;
export const executionEngines = ["PIPEDREAM", "MAKE", "ACTIVEPIECES", "N8N", "DIRECT_API", "MCP"] as const;

export const sourceReferenceSchema = z.object({
  sourceType: z.enum(["OFFICIAL_DOCUMENTATION", "OFFICIAL_TEMPLATE", "GENERALIZED_PATTERN"]),
  sourceUrl: z.string().url(),
  sourceTitle: z.string().min(3),
  organization: z.string().min(2).optional(),
  license: z.string().min(2),
  usageRightsStatus: z.enum(["REFERENCE_ONLY", "GENERALIZED_COMPOSITION", "LICENSE_REVIEW_REQUIRED"]),
  collectedAt: z.string().date(),
  lastVerifiedAt: z.string().date(),
});

export const recipeSchema = z.object({
  id: z.string().regex(/^recipe\.[a-z0-9-]+$/),
  title: z.string().min(3),
  description: z.string().min(20),
  userGoalPatterns: z.array(z.string().min(2)).min(1),
  category: z.enum(recipeCategories),
  trigger: z.object({ type: z.enum(["SCHEDULE", "EVENT", "MANUAL"]), label: z.string().min(2) }),
  inputs: z.array(z.string().min(2)).min(1),
  steps: z.array(z.object({ id: z.string().min(2), label: z.string().min(2), capability: z.string().min(2) })).min(2),
  outputs: z.array(z.string().min(2)).min(1),
  requiredServices: z.array(z.string().min(2)).min(1),
  optionalServices: z.array(z.string().min(2)),
  executionEngineCandidates: z.array(z.enum(executionEngines)).min(1),
  requiredConnections: z.array(z.string().min(2)),
  costProfile: z.object({ tier: z.enum(["FREE_FIRST", "LOW_COST", "PAID_DEPENDENT"]), label: z.string().min(2) }),
  setupDifficulty: z.enum(["LOW", "MEDIUM", "HIGH"]),
  automationLevel: z.enum(["FULL", "PARTIAL", "ASSISTED"]),
  approvalRequirements: z.array(z.string().min(2)),
  knownFailurePatterns: z.array(z.string().min(2)),
  alternatives: z.array(z.string().min(2)),
  sourceReferences: z.array(sourceReferenceSchema).min(1),
  licenseMetadata: z.object({ status: z.enum(["REFERENCE_ONLY", "GENERALIZED_COMPOSITION", "LICENSE_REVIEW_REQUIRED"]), note: z.string().min(5) }),
  lastVerifiedAt: z.string().date(),
  verificationStatus: z.enum(verificationStatuses),
});

export const serviceCapabilitySchema = z.object({
  id: z.string().min(2),
  label: z.string().min(2),
  externalProcessing: z.boolean(),
  externalWrite: z.boolean(),
});

export const serviceConnectionRequirementSchema = z.object({
  serviceId: z.string().min(2),
  mode: z.enum(serviceConnectionModes),
  required: z.boolean(),
  userAction: z.string().min(2),
  storesCredential: z.literal(false),
});

export const serviceDefinitionSchema = z.object({
  id: z.string().min(2),
  title: z.string().min(2),
  category: z.string().min(2),
  capabilities: z.array(serviceCapabilitySchema).min(1),
  connectionRequirements: z.array(serviceConnectionRequirementSchema),
  sourceReferences: z.array(sourceReferenceSchema).min(1),
  licenseNote: z.string().min(5),
});

export type Recipe = z.infer<typeof recipeSchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type ServiceDefinition = z.infer<typeof serviceDefinitionSchema>;
export type ServiceCapability = z.infer<typeof serviceCapabilitySchema>;
export type ServiceConnectionRequirement = z.infer<typeof serviceConnectionRequirementSchema>;
export type ExecutionEngine = (typeof executionEngines)[number];

export type RecipeIntent = {
  originalGoal: string;
  normalizedGoal: string;
  frequency: "DAILY" | "WEEKLY" | "EVENT_DRIVEN" | "ON_DEMAND" | "UNKNOWN";
  domains: string[];
  operations: string[];
  destinations: string[];
  automation: "SCHEDULED" | "EVENT_DRIVEN" | "ASSISTED" | "UNKNOWN";
  keywords: string[];
  status: "UNDERSTOOD" | "PARTIAL" | "UNSUPPORTED" | "EMPTY";
};

export type RecipeRankingPreference = {
  costPreference?: "FREE_FIRST" | "BALANCED";
  connectionPreference?: "FEWER_CONNECTIONS" | "FULL_CAPABILITY";
};

export type RankedRecipe = {
  recipe: Recipe;
  score: number;
  reasons: string[];
  cautions: string[];
  connectionCount: number;
};

export type RecipeRecommendation = {
  intent: RecipeIntent;
  results: RankedRecipe[];
  noMatchReason?: string;
};

export type ExecutionEnginePlan = {
  engine: ExecutionEngine;
  supported: boolean;
  summary: string;
  connectionRequirements: ServiceConnectionRequirement[];
  previewStatus: "PREVIEW_ONLY";
  actualExternalAction: false;
};

export type ExecutionEngineAdapter = {
  engine: ExecutionEngine;
  supports(recipe: Recipe): boolean;
  plan(recipe: Recipe): ExecutionEnginePlan;
  connectionRequirements(recipe: Recipe): ServiceConnectionRequirement[];
  validateConfiguration(input: { recipe: Recipe; connectedServiceIds: string[] }): { valid: boolean; missingServiceIds: string[] };
  previewBuild(recipe: Recipe): ExecutionEnginePlan;
};
