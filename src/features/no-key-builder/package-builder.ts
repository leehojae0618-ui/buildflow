import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "../agents/package-export";
import { compileMakeScenario } from "../external-builders/make/compiler";
import { compileN8nWorkflow } from "../external-builders/n8n/compiler";
import type { ExternalBuilderPlatform } from "../external-builders/types";
import { deliveryBeforeApprovalTest, validInquiryApprovedTest } from "../verification-loop/fixtures";
import type { CanonicalBlueprint } from "../verification-loop/types";
import type { NoKeyExecutionPackage } from "./types";

function blueprintChecksum(blueprint: CanonicalBlueprint): string {
  return createHash("sha256").update(stableSerializeAgentPackage(blueprint), "utf8").digest("hex");
}

const resultSubmissionSchema = [
  "claimedStatus", "externalWorkflowReference", "externalExecutionReference", "observations", "submittedAt", "userConfirmed", "sanitizedLogExcerpt",
] as const;

export function buildNoKeyExecutionPackage(platform: ExternalBuilderPlatform, blueprint: CanonicalBlueprint): NoKeyExecutionPackage {
  const checksum = blueprintChecksum(blueprint);
  const acceptanceTests = [validInquiryApprovedTest, deliveryBeforeApprovalTest] as const;
  const common = {
    packageVersion: "no-key-v1" as const,
    platform,
    blueprintChecksum: checksum,
    title: `BuildFlow ${platform} No-Key Package: ${blueprint.goal}`,
    mode: "NO_KEY" as const,
    acceptanceTests,
    resultSubmissionSchema,
    requiresExternalLogin: true as const,
    requiresUserCredentialSetup: true as const,
    actualExternalCreation: false as const,
    actualExternalExecution: false as const,
  };
  if (platform === "N8N") {
    const compiled = compileN8nWorkflow({ blueprint });
    return {
      ...common,
      setupSteps: ["n8n에 로그인합니다.", "Workflow JSON을 Import 화면에서 검토합니다.", "Slack Credential을 n8n 내부에서 직접 연결합니다.", "활성화 전 Approval Gate와 Slack 연결 순서를 확인합니다.", "사용자가 직접 활성화·실행한 뒤 결과를 제출합니다."],
      requiredUserConnections: compiled.credentialRequirements.map((item) => item.reference),
      artifact: {
        kind: "N8N_WORKFLOW_EXPORT",
        workflowJson: JSON.stringify(compiled.artifact, null, 2),
        fileName: `buildflow-n8n-${checksum.slice(0, 12)}.json`,
        importInstructions: ["n8n Workflow Import를 엽니다.", "이 JSON은 Preview Artifact임을 확인합니다.", "Import 후 실제 node schema와 version 호환성을 검토합니다.", "Import 성공은 실행 성공이 아닙니다."],
        connectionInstructions: ["Credential은 n8n Credential 화면에서 직접 생성·선택합니다.", "BuildFlow에 API Key나 OAuth Token을 입력하지 않습니다.", "Slack Action은 Approval Gate 뒤에서만 연결합니다."],
        importCompatibility: "REQUIRES_REAL_PLATFORM_VALIDATION",
      },
      warnings: [...compiled.warnings, "N8N_IMPORT_IS_USER_MANAGED", "N8N_IMPORT_AND_EXECUTION_REQUIRE_REAL_PLATFORM_VALIDATION"],
    };
  }
  const compiled = compileMakeScenario({ blueprint });
  return {
    ...common,
    setupSteps: ["Make에 로그인합니다.", "Scenario를 Make UI에서 새로 만듭니다.", "Webhook/Input부터 Approval Gate, Slack Action 순서로 모듈을 직접 구성합니다.", "Connection은 Make 안에서 직접 생성·선택합니다.", "승인 후에만 실행하고 결과를 제출합니다."],
    requiredUserConnections: compiled.credentialRequirements.map((item) => item.reference),
    artifact: {
      kind: "MAKE_MANUAL_SETUP_GUIDE",
      scenarioGuide: ["Make Import 호환성은 아직 확인되지 않았습니다.", "따라서 자동 Import 파일 대신 수동 구성 가이드를 사용합니다.", "승인 전 Slack 전달 관찰은 실패 조건입니다."],
      moduleSequence: compiled.artifact.blueprint.modules.map((module) => `${module.label} (${module.role})`),
      fieldMappingGuide: compiled.artifact.blueprint.modules.map((module) => `${module.id}: ${module.dependsOn.length === 0 ? "입력 수신" : `선행 모듈 ${module.dependsOn.join(", ")} 출력 참조`}`),
      connectionInstructions: ["Slack Connection은 Make UI에서 사용자가 직접 설정합니다.", "BuildFlow는 Make API Key, Connection 값, OAuth Token을 받거나 저장하지 않습니다."],
      importCompatibility: "MANUAL_SETUP_REQUIRED",
    },
    warnings: [...compiled.warnings, "MAKE_MANUAL_SETUP_REQUIRED", "MAKE_IMPORT_COMPATIBILITY_NOT_CONFIRMED"],
  };
}
