import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "./package-export";
import type {
  ReferenceIdentifier,
  RuntimeArtifactReference,
  RuntimeExecutionRequest,
} from "./runtime-execution-request";
import type { AgentBlueprint, AgentDefinition } from "./types";
import { validateAgentBlueprint, validateAgentDefinition } from "./validator";

export const RUNTIME_PLAN_FORMAT_VERSION = "buildflow.runtime-plan.v1" as const;
export const RUNTIME_PLAN_RUNTIME_VERSION = "1.0.0" as const;

export type RuntimePlanProvider = "openai";

export type RuntimePlanReference = {
  id: string;
  version: string;
  integrityChecksum: string;
};

export type RuntimePlanStep = {
  runtimePlanStepId: string;
  sequence: 1;
  invocationBoundary: "PROVIDER";
  provider: RuntimePlanProvider;
  model: string;
  promptReference: ReferenceIdentifier;
  inputArtifactReference: ReferenceIdentifier;
  safeInputChecksum: string;
  retryAllowed: false;
};

export type RuntimePlan = {
  formatVersion: typeof RUNTIME_PLAN_FORMAT_VERSION;
  runtimeVersion: typeof RUNTIME_PLAN_RUNTIME_VERSION;
  runtimePlanId: string;
  runtimeExecutionRequestReference: {
    runtimeExecutionRequestId: string;
    integrityChecksum: string;
  };
  blueprintReference: RuntimePlanReference;
  agentDefinitionReference: RuntimePlanReference;
  steps: readonly [RuntimePlanStep];
  integrityChecksum: string;
};

export type RuntimeTransientProviderInput = {
  systemInstruction: string;
  userInput: string;
};

export type BuildRuntimePlanInput = {
  runtimeExecutionRequest: Pick<
    RuntimeExecutionRequest,
    "runtimeExecutionRequestId" | "integrityChecksum" | "inputArtifactReferences"
  >;
  blueprint: AgentBlueprint;
  blueprintIntegrityChecksum: string;
  agentDefinition: AgentDefinition;
  agentDefinitionIntegrityChecksum: string;
  inputArtifactReference: RuntimeArtifactReference;
  transientProviderInput: RuntimeTransientProviderInput;
};

export type RuntimePlanFailureCode =
  | "RUNTIME_PLAN_REQUEST_INVALID"
  | "RUNTIME_PLAN_BLUEPRINT_INVALID"
  | "RUNTIME_PLAN_AGENT_DEFINITION_INVALID"
  | "RUNTIME_PLAN_BINDING_MISMATCH"
  | "RUNTIME_PLAN_PROVIDER_UNSUPPORTED"
  | "RUNTIME_PLAN_MODEL_INVALID"
  | "RUNTIME_PLAN_PROMPT_INVALID"
  | "RUNTIME_PLAN_INPUT_INVALID"
  | "RUNTIME_PLAN_INPUT_SECRET_DETECTED"
  | "RUNTIME_PLAN_INTEGRITY_INVALID"
  | "RUNTIME_PLAN_INTERNAL_ERROR";

export type RuntimePlanFailure = {
  code: RuntimePlanFailureCode;
  target?: string;
};

export type BuildRuntimePlanResult =
  | { status: "VALID"; value: RuntimePlan; failures: [] }
  | { status: "INVALID"; failures: RuntimePlanFailure[] };

export type RuntimePlanValidationResult =
  | { valid: true; failures: [] }
  | { valid: false; failures: RuntimePlanFailure[] };

const checksumPattern = /^[a-f0-9]{64}$/;
const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /AKIA[0-9A-Z]{16}/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
  /Authorization:\s*[^\s]+/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
] as const;

function digest(value: unknown) {
  return createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");
}

function failure(code: RuntimePlanFailureCode, target?: string): RuntimePlanFailure {
  return { code, ...(target ? { target } : {}) };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function containsSecret(value: string) {
  return secretPatterns.some((pattern) => pattern.test(value));
}

function hasOnlyKeys(value: unknown, allowedKeys: readonly string[]): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  try {
    return Object.keys(value).every((key) => allowedKeys.includes(key));
  } catch {
    return false;
  }
}

function isReference(value: unknown): value is ReferenceIdentifier {
  if (!hasOnlyKeys(value, ["referenceId", "integrityChecksum", "referenceType"])) return false;
  const reference = value as ReferenceIdentifier;
  return (
    isNonEmptyString(reference.referenceId) &&
    (reference.integrityChecksum === undefined || checksumPattern.test(reference.integrityChecksum))
  );
}

function cloneAndFreeze<T>(value: T): T {
  const clone = structuredClone(value);
  const freeze = (item: unknown, seen = new WeakSet<object>()): unknown => {
    if (!item || typeof item !== "object" || seen.has(item)) return item;
    seen.add(item);
    for (const child of Object.values(item)) freeze(child, seen);
    return Object.freeze(item);
  };
  return freeze(clone) as T;
}

export function isSafeRuntimeTransientProviderInput(
  value: RuntimeTransientProviderInput,
): boolean {
  return (
    isNonEmptyString(value.systemInstruction) &&
    isNonEmptyString(value.userInput) &&
    !containsSecret(value.systemInstruction) &&
    !containsSecret(value.userInput)
  );
}

export function validateRuntimePlan(value: unknown): RuntimePlanValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, failures: [failure("RUNTIME_PLAN_INTEGRITY_INVALID")] };
  }
  try {
    const plan = value as RuntimePlan;
    if (
      !hasOnlyKeys(value, [
        "formatVersion",
        "runtimeVersion",
        "runtimePlanId",
        "runtimeExecutionRequestReference",
        "blueprintReference",
        "agentDefinitionReference",
        "steps",
        "integrityChecksum",
      ]) ||
      !hasOnlyKeys(plan.runtimeExecutionRequestReference, [
        "runtimeExecutionRequestId",
        "integrityChecksum",
      ]) ||
      !hasOnlyKeys(plan.blueprintReference, ["id", "version", "integrityChecksum"]) ||
      !hasOnlyKeys(plan.agentDefinitionReference, ["id", "version", "integrityChecksum"]) ||
      !Array.isArray(plan.steps) ||
      plan.steps.length !== 1 ||
      !hasOnlyKeys(plan.steps[0], [
        "runtimePlanStepId",
        "sequence",
        "invocationBoundary",
        "provider",
        "model",
        "promptReference",
        "inputArtifactReference",
        "safeInputChecksum",
        "retryAllowed",
      ])
    ) {
      return { valid: false, failures: [failure("RUNTIME_PLAN_INTEGRITY_INVALID")] };
    }
    const failures: RuntimePlanFailure[] = [];
    if (
      plan.formatVersion !== RUNTIME_PLAN_FORMAT_VERSION ||
      plan.runtimeVersion !== RUNTIME_PLAN_RUNTIME_VERSION ||
      !isNonEmptyString(plan.runtimePlanId) ||
      !checksumPattern.test(plan.integrityChecksum)
    ) {
      failures.push(failure("RUNTIME_PLAN_INTEGRITY_INVALID"));
    }
    if (
      !isNonEmptyString(plan.runtimeExecutionRequestReference?.runtimeExecutionRequestId) ||
      !checksumPattern.test(plan.runtimeExecutionRequestReference?.integrityChecksum ?? "") ||
      !isNonEmptyString(plan.blueprintReference?.id) ||
      !isNonEmptyString(plan.blueprintReference?.version) ||
      !checksumPattern.test(plan.blueprintReference?.integrityChecksum ?? "") ||
      !isNonEmptyString(plan.agentDefinitionReference?.id) ||
      !isNonEmptyString(plan.agentDefinitionReference?.version) ||
      !checksumPattern.test(plan.agentDefinitionReference?.integrityChecksum ?? "")
    ) {
      failures.push(failure("RUNTIME_PLAN_BINDING_MISMATCH"));
    }
    if (plan.steps?.length !== 1) {
      failures.push(failure("RUNTIME_PLAN_PROVIDER_UNSUPPORTED", "steps"));
    }
    const step = plan.steps?.[0];
    if (
      !step ||
      step.sequence !== 1 ||
      step.invocationBoundary !== "PROVIDER" ||
      step.provider !== "openai" ||
      step.retryAllowed !== false ||
      !isNonEmptyString(step.runtimePlanStepId) ||
      !isNonEmptyString(step.model) ||
      !isReference(step.promptReference) ||
      !isReference(step.inputArtifactReference) ||
      !checksumPattern.test(step.safeInputChecksum ?? "")
    ) {
      failures.push(failure("RUNTIME_PLAN_PROVIDER_UNSUPPORTED", "steps"));
    }
    if (failures.length > 0) return { valid: false, failures };
    const deterministicCore = {
      formatVersion: plan.formatVersion,
      runtimeVersion: plan.runtimeVersion,
      runtimeExecutionRequestReference: plan.runtimeExecutionRequestReference,
      blueprintReference: plan.blueprintReference,
      agentDefinitionReference: plan.agentDefinitionReference,
      steps: plan.steps,
    };
    if (
      plan.runtimePlanId !== digest(deterministicCore) ||
      plan.integrityChecksum !== digest({ ...deterministicCore, runtimePlanId: plan.runtimePlanId })
    ) {
      return { valid: false, failures: [failure("RUNTIME_PLAN_INTEGRITY_INVALID")] };
    }
    return { valid: true, failures: [] };
  } catch {
    return { valid: false, failures: [failure("RUNTIME_PLAN_INTEGRITY_INVALID")] };
  }
}

export function buildRuntimePlan(input: BuildRuntimePlanInput): BuildRuntimePlanResult {
  try {
    const failures: RuntimePlanFailure[] = [];
    const request = input.runtimeExecutionRequest;
    if (
      !isNonEmptyString(request.runtimeExecutionRequestId) ||
      !checksumPattern.test(request.integrityChecksum)
    ) {
      failures.push(failure("RUNTIME_PLAN_REQUEST_INVALID", "runtimeExecutionRequest"));
    }
    if (!checksumPattern.test(input.blueprintIntegrityChecksum)) {
      failures.push(failure("RUNTIME_PLAN_INTEGRITY_INVALID", "blueprintIntegrityChecksum"));
    }
    if (!checksumPattern.test(input.agentDefinitionIntegrityChecksum)) {
      failures.push(failure("RUNTIME_PLAN_INTEGRITY_INVALID", "agentDefinitionIntegrityChecksum"));
    }
    if (!validateAgentBlueprint(input.blueprint).valid) {
      failures.push(failure("RUNTIME_PLAN_BLUEPRINT_INVALID", "blueprint"));
    }
    if (
      input.agentDefinition.validationStatus !== "VALID" ||
      !validateAgentDefinition(input.agentDefinition, input.blueprint).valid
    ) {
      failures.push(failure("RUNTIME_PLAN_AGENT_DEFINITION_INVALID", "agentDefinition"));
    }
    if (
      input.agentDefinition.blueprintId !== input.blueprint.id ||
      input.agentDefinition.blueprintVersion !== input.blueprint.version
    ) {
      failures.push(failure("RUNTIME_PLAN_BINDING_MISMATCH", "agentDefinition.blueprint"));
    }
    if (
      !isNonEmptyString(input.inputArtifactReference.artifactId) ||
      !checksumPattern.test(input.inputArtifactReference.integrityChecksum) ||
      !request.inputArtifactReferences.some(
        (item) =>
          item.artifactId === input.inputArtifactReference.artifactId &&
          item.integrityChecksum === input.inputArtifactReference.integrityChecksum,
      )
    ) {
      failures.push(failure("RUNTIME_PLAN_INPUT_INVALID", "inputArtifactReference"));
    }

    const models = input.agentDefinition.blocks.filter(
      (block): block is Extract<typeof block, { kind: "MODEL" }> => block.kind === "MODEL" && block.required,
    );
    const prompts = input.agentDefinition.blocks.filter(
      (block): block is Extract<typeof block, { kind: "PROMPT" }> => block.kind === "PROMPT" && block.required,
    );
    if (models.length !== 1 || models[0]?.provider !== "openai") {
      failures.push(failure("RUNTIME_PLAN_PROVIDER_UNSUPPORTED", "agentDefinition.blocks"));
    }
    if (!isNonEmptyString(models[0]?.model)) {
      failures.push(failure("RUNTIME_PLAN_MODEL_INVALID", "agentDefinition.blocks"));
    }
    if (prompts.length !== 1 || !isNonEmptyString(prompts[0]?.promptRef)) {
      failures.push(failure("RUNTIME_PLAN_PROMPT_INVALID", "agentDefinition.blocks"));
    }
    const transient = input.transientProviderInput;
    if (!isNonEmptyString(transient.systemInstruction) || !isNonEmptyString(transient.userInput)) {
      failures.push(failure("RUNTIME_PLAN_INPUT_INVALID", "transientProviderInput"));
    } else if (!isSafeRuntimeTransientProviderInput(transient)) {
      failures.push(failure("RUNTIME_PLAN_INPUT_SECRET_DETECTED", "transientProviderInput"));
    }
    if (failures.length > 0) return { status: "INVALID", failures };

    const promptReference: ReferenceIdentifier = {
      referenceId: prompts[0]!.promptRef,
      referenceType: "PROMPT_TEMPLATE",
      integrityChecksum: digest({ promptRef: prompts[0]!.promptRef }),
    };
    const inputArtifactReference: ReferenceIdentifier = {
      referenceId: input.inputArtifactReference.artifactId,
      referenceType: input.inputArtifactReference.artifactType,
      integrityChecksum: input.inputArtifactReference.integrityChecksum,
    };
    if (!isReference(promptReference) || !isReference(inputArtifactReference)) {
      return { status: "INVALID", failures: [failure("RUNTIME_PLAN_INPUT_INVALID")] };
    }
    const safeInputChecksum = digest({
      systemInstruction: transient.systemInstruction,
      userInput: transient.userInput,
    });
    const stepCore = {
      sequence: 1 as const,
      invocationBoundary: "PROVIDER" as const,
      provider: "openai" as const,
      model: models[0]!.model,
      promptReference,
      inputArtifactReference,
      safeInputChecksum,
      retryAllowed: false as const,
    };
    const step: RuntimePlanStep = {
      runtimePlanStepId: digest({ request: request.runtimeExecutionRequestId, stepCore }),
      ...stepCore,
    };
    const deterministicCore = {
      formatVersion: RUNTIME_PLAN_FORMAT_VERSION,
      runtimeVersion: RUNTIME_PLAN_RUNTIME_VERSION,
      runtimeExecutionRequestReference: {
        runtimeExecutionRequestId: request.runtimeExecutionRequestId,
        integrityChecksum: request.integrityChecksum,
      },
      blueprintReference: {
        id: input.blueprint.id,
        version: input.blueprint.version,
        integrityChecksum: input.blueprintIntegrityChecksum,
      },
      agentDefinitionReference: {
        id: input.agentDefinition.id,
        version: input.agentDefinition.blueprintVersion,
        integrityChecksum: input.agentDefinitionIntegrityChecksum,
      },
      steps: [step] as const,
    };
    const runtimePlanId = digest(deterministicCore);
    const plan: RuntimePlan = {
      ...deterministicCore,
      runtimePlanId,
      integrityChecksum: digest({ ...deterministicCore, runtimePlanId }),
    };
    return { status: "VALID", value: cloneAndFreeze(plan), failures: [] };
  } catch {
    return { status: "INVALID", failures: [failure("RUNTIME_PLAN_INTERNAL_ERROR")] };
  }
}
