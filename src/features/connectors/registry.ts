import type { ConnectorProvider } from "./types";

const capability = (id: string, name: string, description: string) => ({ id, name, description });
export const connectorRegistry: ConnectorProvider[] = [
  { id: "openai", name: "OpenAI", category: "AI", credentialRequired: true, capabilities: [capability("text_generation", "텍스트 생성", "AI 응답 생성")] },
  { id: "anthropic", name: "Anthropic", category: "AI", credentialRequired: true, capabilities: [capability("text_generation", "텍스트 생성", "AI 응답 생성")] },
  { id: "gemini", name: "Gemini", category: "AI", credentialRequired: true, capabilities: [capability("text_generation", "텍스트 생성", "AI 응답 생성")] },
  { id: "supabase", name: "Supabase", category: "DATABASE", credentialRequired: true, capabilities: [capability("database", "데이터 저장", "구조화된 데이터 저장")] },
  { id: "github", name: "GitHub", category: "CODE", credentialRequired: true, capabilities: [capability("repository", "코드 저장소", "소스 코드와 버전 관리")] },
  { id: "google", name: "Google", category: "AUTH", credentialRequired: true, capabilities: [capability("oauth", "OAuth", "사용자 계정 동의")] },
  { id: "slack", name: "Slack", category: "COMMUNICATION", credentialRequired: true, capabilities: [capability("notification", "알림", "팀 알림 전송")] },
  { id: "resend", name: "Resend", category: "EMAIL", credentialRequired: true, capabilities: [capability("email", "이메일", "이메일 발송")] },
  { id: "n8n", name: "n8n", category: "AUTOMATION", credentialRequired: true, capabilities: [capability("workflow", "Workflow", "외부 자동화 실행")] },
  { id: "make", name: "Make", category: "AUTOMATION", credentialRequired: true, capabilities: [capability("workflow", "Workflow", "외부 자동화 실행")] },
];
export function findConnectorProvider(id: string) { return connectorRegistry.find((provider) => provider.id === id); }
