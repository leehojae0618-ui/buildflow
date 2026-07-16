import { generateCrudServiceTemplate } from "./crud-template";
import {
  generateServiceTemplate,
  type GeneratedService,
} from "./service-template";
import {
  applicationCapabilities,
  applicationGoalSignals,
  inferApplicationCapabilities,
  type ApplicationBlueprintId,
  type ApplicationCapability,
} from "../capabilities/application";

export {
  applicationCapabilities,
  inferApplicationCapabilities,
  type ApplicationBlueprintId,
  type ApplicationCapability,
} from "../capabilities/application";
export type VerificationProfile = "AI_INQUIRY" | "GENERAL_CRUD";

export type GeneratedApplication = GeneratedService & {
  blueprintId: ApplicationBlueprintId;
  capabilities: ApplicationCapability[];
  requiredProviders: Array<"github" | "supabase" | "vercel" | "openai">;
  verification: {
    profile: VerificationProfile;
    expectedTables: string[];
  };
};

export class BlueprintSelectionError extends Error {
  constructor(
    public readonly code:
      | "BLUEPRINT_NOT_SUPPORTED"
      | "BLUEPRINT_AMBIGUOUS"
      | "BLUEPRINT_CAPABILITY_MISMATCH",
  ) {
    super(code);
  }
}

const crudCoreCapabilities: ApplicationCapability[] = [
  "AUTH",
  "USER_SCOPED_CRUD",
  "SEARCH",
  "STATUS_WORKFLOW",
  "ADMIN_READ",
  "RESPONSIVE_UI",
];

export function selectApplicationBlueprint(input: {
  title: string;
  goal: string;
  requestedCapabilities?: ApplicationCapability[];
}): {
  id: ApplicationBlueprintId;
  capabilities: ApplicationCapability[];
  requiredProviders: GeneratedApplication["requiredProviders"];
  verification: GeneratedApplication["verification"];
} {
  const inferred =
    input.requestedCapabilities ?? inferApplicationCapabilities(input);
  const signals = applicationGoalSignals(input);
  const hasCrudSignal =
    inferred.includes("USER_SCOPED_CRUD") || signals.hasCrudSignal;
  const hasInquirySignal = signals.hasInquirySignal;

  if (hasCrudSignal && hasInquirySignal) {
    throw new BlueprintSelectionError("BLUEPRINT_AMBIGUOUS");
  }
  if (hasCrudSignal) {
    const capabilities = applicationCapabilities.filter(
      (capability) =>
        inferred.includes(capability) ||
        crudCoreCapabilities.includes(capability),
    );
    if (
      crudCoreCapabilities.some(
        (capability) => !capabilities.includes(capability),
      )
    ) {
      throw new BlueprintSelectionError("BLUEPRINT_CAPABILITY_MISMATCH");
    }
    return {
      id: "general-crud-v1",
      capabilities,
      requiredProviders: ["github", "supabase", "vercel"],
      verification: {
        profile: "GENERAL_CRUD",
        expectedTables: ["buildflow_todos", "buildflow_admins"],
      },
    };
  }
  if (hasInquirySignal) {
    return {
      id: "ai-inquiry-v1",
      capabilities: ["RESPONSIVE_UI"],
      requiredProviders: ["github", "supabase", "vercel", "openai"],
      verification: {
        profile: "AI_INQUIRY",
        expectedTables: ["buildflow_inquiries"],
      },
    };
  }
  throw new BlueprintSelectionError("BLUEPRINT_NOT_SUPPORTED");
}

export function generateApplicationBlueprint(input: {
  projectId: string;
  title: string;
  goal: string;
  requestedCapabilities?: ApplicationCapability[];
}): GeneratedApplication {
  const blueprint = selectApplicationBlueprint(input);
  const generated =
    blueprint.id === "general-crud-v1"
      ? generateCrudServiceTemplate(input)
      : generateServiceTemplate(input);
  return {
    ...generated,
    blueprintId: blueprint.id,
    capabilities: blueprint.capabilities,
    requiredProviders: blueprint.requiredProviders,
    verification: blueprint.verification,
  };
}
