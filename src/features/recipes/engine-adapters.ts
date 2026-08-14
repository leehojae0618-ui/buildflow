import { findService } from "./service-registry";
import type { ExecutionEngineAdapter, ExecutionEnginePlan, Recipe, ServiceConnectionRequirement } from "./types";

function connectionsFor(recipe: Recipe): ServiceConnectionRequirement[] {
  return recipe.requiredConnections.flatMap((serviceId) => findService(serviceId)?.connectionRequirements ?? []);
}

function preview(engine: ExecutionEnginePlan["engine"], recipe: Recipe): ExecutionEnginePlan {
  return { engine, supported: recipe.executionEngineCandidates.includes(engine), summary: `${recipe.title}의 ${engine} build preview입니다. 외부 workflow 생성이나 실행은 수행하지 않습니다.`, connectionRequirements: connectionsFor(recipe), previewStatus: "PREVIEW_ONLY", actualExternalAction: false };
}

function adapter(engine: ExecutionEnginePlan["engine"]): ExecutionEngineAdapter {
  return {
    engine,
    supports: (recipe) => recipe.executionEngineCandidates.includes(engine),
    plan: (recipe) => preview(engine, recipe),
    connectionRequirements: connectionsFor,
    validateConfiguration: ({ recipe, connectedServiceIds }) => {
      const missingServiceIds = connectionsFor(recipe).filter((connection) => connection.required && !connectedServiceIds.includes(connection.serviceId)).map((connection) => connection.serviceId);
      return { valid: missingServiceIds.length === 0, missingServiceIds };
    },
    previewBuild: (recipe) => preview(engine, recipe),
  };
}

export const executionEngineAdapters = [adapter("PIPEDREAM"), adapter("MAKE"), adapter("ACTIVEPIECES"), adapter("N8N")];
export function getExecutionEngineAdapter(engine: ExecutionEnginePlan["engine"]) { return executionEngineAdapters.find((adapter) => adapter.engine === engine); }
