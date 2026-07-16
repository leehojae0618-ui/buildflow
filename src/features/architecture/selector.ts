import { componentRegistry } from "./registry";
import type { ArchitectureSnapshot, Requirement } from "../requirements/types";
import { inferApplicationBlueprintId } from "../capabilities/application";

export function selectArchitecture(requirement: Requirement): ArchitectureSnapshot {
  const text = `${requirement.goalOriginal} ${requirement.currentTools.join(" ")}`.toLocaleLowerCase();
  const blueprintId = inferApplicationBlueprintId({
    goal: requirement.goalOriginal,
  });
  const ids =
    blueprintId === "general-crud-v1"
      ? ["frontend", "supabase-auth", "supabase"]
      : ["frontend", "openai", "supabase"];
  const needsAutomation = requirement.automationLevel === "high" || requirement.automationLevel === "partial" || /workflow|자동화|알림|연결|n8n/.test(text);
  if (needsAutomation) ids.push("n8n");
  if (blueprintId !== "general-crud-v1" && (text.includes("slack") || requirement.goalType === "customer_support")) ids.push("slack");
  if (text.includes("google") || text.includes("gmail") || text.includes("이메일")) ids.push("google-oauth");
  const components = [...new Set(ids)].map((id) => componentRegistry.find((component) => component.id === id)).filter((component): component is NonNullable<typeof component> => Boolean(component));
  const connections = blueprintId === "general-crud-v1"
    ? [
        { from: "frontend", to: "supabase-auth", label: "회원 인증" },
        { from: "frontend", to: "supabase", label: "사용자별 데이터 관리" },
      ]
    : [
        { from: "frontend", to: "openai", label: "요청 전달" },
        { from: "openai", to: "supabase", label: "Requirement 저장" },
      ];
  if (ids.includes("n8n")) connections.push({ from: blueprintId === "general-crud-v1" ? "supabase" : "openai", to: "n8n", label: "Workflow 실행" });
  if (ids.includes("slack")) connections.push({ from: ids.includes("n8n") ? "n8n" : "openai", to: "slack", label: "알림 전달" });
  if (ids.includes("google-oauth")) connections.push({ from: "frontend", to: "google-oauth", label: "사용자 동의" });
  return { version: "architecture-v1", components, connections, dependencies: components.map((component) => ({ componentId: component.id, dependsOn: component.id === "frontend" ? [] : ["frontend"] })), summary: `${components.map((component) => component.name).join(" · ")} 조합으로 초기 Architecture를 구성했습니다.` };
}
