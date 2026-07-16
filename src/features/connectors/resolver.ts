import type { ArchitectureSnapshot, Requirement } from "../requirements/types";
import { connectorRegistry, findConnectorProvider } from "./registry";
import type { Connector } from "./types";

const componentToProvider: Record<string, string> = { openai: "openai", anthropic: "anthropic", gemini: "gemini", supabase: "supabase", "google-oauth": "google", slack: "slack", n8n: "n8n", make: "make", github: "github", resend: "resend" };
export function resolveRequiredConnectors(requirement: Requirement, architecture: ArchitectureSnapshot): Connector[] {
  const text = `${requirement.goalOriginal} ${requirement.currentTools.join(" ")} ${requirement.requiredIntegrations.join(" ")}`.toLocaleLowerCase();
  const ids = architecture.components.map((component) => componentToProvider[component.id]).filter(Boolean);
  const textMatches: [RegExp, string][] = [[/github/, "github"], [/resend|email|이메일/, "resend"], [/make/, "make"]];
  for (const [pattern, id] of textMatches) if (pattern.test(text)) ids.push(id);
  return [...new Set(ids)].map((providerId) => findConnectorProvider(providerId)).filter((provider): provider is NonNullable<typeof provider> => Boolean(provider)).map((provider) => ({ providerId: provider.id, providerName: provider.name, status: "NOT_CONNECTED", required: true, capabilities: provider.capabilities }));
}
export { connectorRegistry };
