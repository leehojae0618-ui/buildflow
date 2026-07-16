import type { CredentialDefinition } from "./types";

const token = (id = "api_key", label = "API Key") => ({ id, label, secret: true, required: true, format: "token" as const });
const url = (id = "base_url", label = "Base URL") => ({ id, label, secret: false, required: true, format: "url" as const });
export const credentialDefinitions: CredentialDefinition[] = [
  { id: "openai-api-key", providerId: "openai", name: "OpenAI API Key", fields: [token()] },
  { id: "anthropic-api-key", providerId: "anthropic", name: "Anthropic API Key", fields: [token()] },
  { id: "gemini-api-key", providerId: "gemini", name: "Gemini API Key", fields: [token()] },
  { id: "supabase-url-key", providerId: "supabase", name: "Supabase URL / Key", fields: [url(), token("key", "Project Key")] },
  { id: "github-token", providerId: "github", name: "GitHub Token", fields: [token("token", "Personal Access Token")] },
  { id: "google-oauth", providerId: "google", name: "Google OAuth", fields: [] },
  { id: "slack-token", providerId: "slack", name: "Slack Token or Webhook", fields: [token("token", "Token or Webhook")] },
  { id: "resend-api-key", providerId: "resend", name: "Resend API Key", fields: [token()] },
  { id: "n8n-url-key", providerId: "n8n", name: "n8n Base URL / API Key", fields: [url(), token()] },
  { id: "make-api-key", providerId: "make", name: "Make API Key", fields: [token()] },
];
export function findCredentialDefinition(providerId: string) { return credentialDefinitions.find((definition) => definition.providerId === providerId); }
