import { z } from "zod";
import { findService } from "./service-registry";
import type { ExecutionEngine, Recipe, RecipeIntent, ServiceConnectionRequirement } from "./types";

const engineCompatibilitySchema = z.object({
  engine: z.enum(["PIPEDREAM", "MAKE", "ACTIVEPIECES", "N8N"]),
  supported: z.boolean(),
  compatibilityScore: z.number().int().min(0).max(100),
  reasons: z.array(z.string().min(3)).min(1),
  limitations: z.array(z.string().min(3)),
  requiredConnections: z.array(z.string()),
  costNotes: z.string().min(3),
  setupDifficulty: z.enum(["LOW", "MEDIUM", "HIGH"]),
  automationCoverage: z.enum(["FULL", "PARTIAL", "ASSISTED"]),
});

const connectionPlanItemSchema = z.object({
  serviceId: z.string(),
  title: z.string(),
  connectionType: z.enum(["OAUTH", "API_KEY", "NONE", "MANAGED_AUTH_CANDIDATE"]),
  required: z.boolean(),
  reason: z.string().min(3),
  status: z.enum(["READY", "NOT_CONNECTED"]),
  userActionRequired: z.boolean(),
  actualConnection: z.literal(false),
});

const configurationRequirementSchema = z.object({
  id: z.string(),
  label: z.string(),
  defaultValue: z.string().nullable(),
  userInputRequired: z.boolean(),
  buildFlowCanConfigure: z.boolean(),
  caution: z.string().min(3),
});

const missingInformationSchema = z.object({ id: z.string(), question: z.string().min(3), reason: z.string().min(3), requiredFor: z.string().min(3) });
const testPlanItemSchema = z.object({ id: z.string(), label: z.string().min(3), purpose: z.string().min(3), requiresExternalAction: z.boolean(), status: z.literal("PLANNED") });

export const buildPackageSchema = z.object({
  packageId: z.string().regex(/^build-package\.[a-z0-9-]+$/),
  recipeId: z.string(),
  title: z.string(),
  intentSummary: z.string().min(3),
  selectedEngine: z.enum(["PIPEDREAM", "MAKE", "ACTIVEPIECES", "N8N"]),
  alternativeEngines: z.array(z.enum(["PIPEDREAM", "MAKE", "ACTIVEPIECES", "N8N"])),
  engineCompatibility: z.array(engineCompatibilitySchema).min(1),
  services: z.array(z.string()).min(1),
  trigger: z.object({ type: z.string(), label: z.string() }),
  steps: z.array(z.object({ id: z.string(), label: z.string(), capability: z.string() })).min(1),
  connections: z.array(connectionPlanItemSchema).min(1),
  configurationRequirements: z.array(configurationRequirementSchema).min(1),
  missingInformation: z.array(missingInformationSchema),
  approvals: z.array(z.string()),
  costProfile: z.object({ tier: z.string(), label: z.string() }),
  testPlan: z.array(testPlanItemSchema).min(1),
  provenance: z.object({ recipeVerificationStatus: z.string(), sourceReferences: z.array(z.object({ sourceTitle: z.string(), sourceUrl: z.string().url() })).min(1) }),
  status: z.enum(["DRAFT", "CONNECTION_REQUIRED", "READY_FOR_BUILD"]),
  actualExternalAction: z.literal(false),
});

export type EngineCompatibility = z.infer<typeof engineCompatibilitySchema>;
export type BuildPackage = z.infer<typeof buildPackageSchema>;
export type BuildPackageInput = { recipe: Recipe; intent: RecipeIntent; selectedEngine?: ExecutionEngine };

const supportedEngines = ["PIPEDREAM", "MAKE", "ACTIVEPIECES", "N8N"] as const;

function engineDetails(engine: EngineCompatibility["engine"], recipe: Recipe): EngineCompatibility {
  const scheduled = recipe.trigger.type === "SCHEDULE";
  const supported = recipe.executionEngineCandidates.includes(engine);
  const base = scheduled
    ? { MAKE: 90, PIPEDREAM: 80, ACTIVEPIECES: 76, N8N: 70 }[engine]
    : { PIPEDREAM: 88, MAKE: 85, ACTIVEPIECES: 80, N8N: 74 }[engine];
  const compatibilityScore = supported ? base : 0;
  const reasons = engine === "MAKE"
    ? ["Scenario 생성, 관리, 실행, scheduling API 후보를 제공합니다.", scheduled ? "정기 실행 Recipe에 적합한 scheduling 후보입니다." : "필요한 서비스 조합을 scenario로 표현할 수 있습니다."]
    : engine === "PIPEDREAM"
      ? ["Workflow template/API와 managed end-user auth 후보를 제공합니다.", "이 Recipe의 서비스 조합을 workflow로 계획할 수 있습니다."]
      : engine === "ACTIVEPIECES"
        ? ["Embedded connection 후보를 제공하는 flow engine입니다.", "연결 단계와 flow 구성을 분리해 계획할 수 있습니다."]
        : ["Workflow preview/export 후보를 제공합니다.", "상업적 embedding과 license 조건은 연결 전 검토가 필요합니다."];
  const limitations = engine === "PIPEDREAM" && scheduled
    ? ["Timer 실행에서 end-user ID를 런타임에 찾는 제약은 live 연결 전 확인이 필요합니다."]
    : engine === "N8N"
      ? ["Commercial embedding and license suitability must be reviewed before live use."]
      : engine === "ACTIVEPIECES"
        ? ["Embedded connection behavior requires live-platform validation before use."]
        : ["Actual remote creation, execution, and credential handling require a separate Live E2E gate."];
  return { engine, supported, compatibilityScore, reasons, limitations, requiredConnections: recipe.requiredConnections, costNotes: recipe.costProfile.label, setupDifficulty: recipe.setupDifficulty, automationCoverage: recipe.automationLevel };
}

export function evaluateEngineCompatibility(recipe: Recipe): EngineCompatibility[] {
  return supportedEngines.map((engine) => engineDetails(engine, recipe)).sort((a, b) => b.compatibilityScore - a.compatibilityScore || a.engine.localeCompare(b.engine));
}

function connectionPlan(recipe: Recipe) {
  return recipe.requiredServices.map((serviceId) => {
    const service = findService(serviceId);
    const requirement: ServiceConnectionRequirement | undefined = service?.connectionRequirements.find((item) => item.required) ?? service?.connectionRequirements[0];
    return {
      serviceId,
      title: service?.title ?? serviceId,
      connectionType: requirement?.mode ?? "NONE",
      required: requirement?.required ?? true,
      reason: service?.capabilities[0]?.label ?? "Recipe delivery requirement",
      status: requirement?.mode && requirement.mode !== "NONE" ? "NOT_CONNECTED" as const : "READY" as const,
      userActionRequired: Boolean(requirement && requirement.mode !== "NONE"),
      actualConnection: false as const,
    };
  });
}

function configurationPlan(recipe: Recipe, intent: RecipeIntent) {
  const schedule = recipe.trigger.type === "SCHEDULE" ? [
    { id: "schedule-frequency", label: "Schedule Frequency", defaultValue: intent.frequency === "DAILY" ? "daily" : intent.frequency === "WEEKLY" ? "weekly" : null, userInputRequired: false, buildFlowCanConfigure: true, caution: "반복 빈도는 목표에서 추출한 값입니다." },
    { id: "schedule-time", label: "Schedule Time", defaultValue: null, userInputRequired: true, buildFlowCanConfigure: true, caution: "실행 시간은 아직 제공되지 않았습니다." },
  ] : [];
  const source = recipe.requiredServices.includes("rss") ? [{ id: "news-source", label: "News Source", defaultValue: "RSS", userInputRequired: false, buildFlowCanConfigure: true, caution: "구체적인 source list는 연결 전 검토에서 결정합니다." }] : [];
  const ai = recipe.requiredServices.some((service) => service === "groq" || service === "openai") ? [{ id: "ai-summarizer", label: "AI Summarizer", defaultValue: null, userInputRequired: false, buildFlowCanConfigure: false, caution: "Provider는 candidate only이며 API key를 받거나 저장하지 않습니다." }] : [];
  const slack = recipe.requiredServices.includes("slack") ? [{ id: "slack-delivery", label: "Slack Delivery", defaultValue: null, userInputRequired: true, buildFlowCanConfigure: false, caution: "대상 channel은 아직 제공되지 않았습니다." }] : [];
  const notion = recipe.requiredServices.includes("notion") ? [{ id: "notion-destination", label: "Notion Destination", defaultValue: null, userInputRequired: true, buildFlowCanConfigure: false, caution: "대상 database 또는 page는 아직 제공되지 않았습니다." }] : [];
  const sheets = recipe.requiredServices.includes("google-sheets") ? [{ id: "sheet-destination", label: "Google Sheets Destination", defaultValue: null, userInputRequired: true, buildFlowCanConfigure: false, caution: "대상 spreadsheet와 sheet는 아직 제공되지 않았습니다." }] : [];
  return [...schedule, ...source, ...ai, ...slack, ...notion, ...sheets];
}

function missingInformation(recipe: Recipe, configurationRequirements: ReturnType<typeof configurationPlan>) {
  return configurationRequirements.filter((item) => item.userInputRequired && !item.defaultValue).map((item) => ({ id: item.id, question: item.id === "schedule-time" ? "몇 시에 실행할까요?" : item.id === "slack-delivery" ? "어느 Slack 채널로 보낼까요?" : item.id === "notion-destination" ? "어느 Notion 공간에 저장할까요?" : item.id === "sheet-destination" ? "어느 Google Sheets에 기록할까요?" : "어떤 AI Provider 연결을 사용할까요?", reason: item.caution, requiredFor: recipe.title }));
}

function testPlan(recipe: Recipe) {
  const steps = [{ id: "input", label: `${recipe.inputs[0]}에서 item 1개 확인`, purpose: "입력 source가 Recipe에 맞게 읽히는지 확인합니다.", requiresExternalAction: true, status: "PLANNED" as const }];
  if (recipe.requiredServices.some((service) => service === "groq" || service === "openai")) steps.push({ id: "ai", label: "AI step이 non-empty 결과 생성", purpose: "요약 또는 분류 결과가 비어 있지 않은지 확인합니다.", requiresExternalAction: true, status: "PLANNED" as const });
  if (recipe.requiredServices.includes("slack")) steps.push({ id: "delivery", label: "Slack test channel로 메시지 1개 전송", purpose: "발송과 formatting을 live 연결 전 Test Plan으로 기록합니다.", requiresExternalAction: true, status: "PLANNED" as const });
  if (recipe.trigger.type === "SCHEDULE") steps.push({ id: "approval", label: "Schedule 활성화 전 사용자 승인", purpose: "자동 실행은 명시적인 최종 승인 뒤에만 활성화합니다.", requiresExternalAction: false, status: "PLANNED" as const });
  return steps;
}

export function createBuildPackage(input: BuildPackageInput): BuildPackage {
  const engineCompatibility = evaluateEngineCompatibility(input.recipe);
  const compatible = engineCompatibility.filter((item) => item.supported);
  const requested = input.selectedEngine && supportedEngines.includes(input.selectedEngine as typeof supportedEngines[number]) ? engineCompatibility.find((item) => item.engine === input.selectedEngine) : undefined;
  const selectedEngine = requested?.supported ? requested.engine : compatible[0]?.engine;
  if (!selectedEngine) throw new Error("NO_SUPPORTED_ENGINE");
  const connections = connectionPlan(input.recipe);
  const configurationRequirements = configurationPlan(input.recipe, input.intent);
  const packageValue = {
    packageId: `build-package.${input.recipe.id.replace("recipe.", "")}`,
    recipeId: input.recipe.id,
    title: `${input.recipe.title} 구축 준비`,
    intentSummary: input.intent.originalGoal,
    selectedEngine,
    alternativeEngines: compatible.filter((item) => item.engine !== selectedEngine).map((item) => item.engine),
    engineCompatibility,
    services: input.recipe.requiredServices,
    trigger: input.recipe.trigger,
    steps: input.recipe.steps,
    connections,
    configurationRequirements,
    missingInformation: missingInformation(input.recipe, configurationRequirements),
    approvals: input.recipe.approvalRequirements,
    costProfile: input.recipe.costProfile,
    testPlan: testPlan(input.recipe),
    provenance: { recipeVerificationStatus: input.recipe.verificationStatus, sourceReferences: input.recipe.sourceReferences.map((reference) => ({ sourceTitle: reference.sourceTitle, sourceUrl: reference.sourceUrl })) },
    status: connections.some((connection) => connection.status === "NOT_CONNECTED" && connection.required) ? "CONNECTION_REQUIRED" as const : "READY_FOR_BUILD" as const,
    actualExternalAction: false as const,
  };
  return buildPackageSchema.parse(packageValue);
}
