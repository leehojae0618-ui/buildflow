import type { ArchitectureComponent, ComponentCategory } from "../requirements/types";

export const componentRegistry: ArchitectureComponent[] = [
  { id: "frontend", name: "BuildFlow Web App", category: "frontend", reason: "사용자 입력과 결과를 제공", required: true },
  { id: "openai", name: "OpenAI", category: "llm", reason: "자연어 이해와 응답 생성", required: true },
  { id: "supabase", name: "Supabase", category: "database", reason: "Requirement와 운영 데이터 저장", required: true },
  { id: "n8n", name: "n8n", category: "automation", reason: "외부 서비스 Workflow 실행", required: false },
  { id: "slack", name: "Slack", category: "notification", reason: "운영 알림 전달", required: false },
  { id: "google-oauth", name: "Google OAuth", category: "auth", reason: "사용자 계정 권한 연결", required: false },
  { id: "supabase-storage", name: "Supabase Storage", category: "storage", reason: "파일과 산출물 저장", required: false },
];

export function findComponent(id: string) { return componentRegistry.find((component) => component.id === id); }
export function componentsByCategory(category: ComponentCategory) { return componentRegistry.filter((component) => component.category === category); }
