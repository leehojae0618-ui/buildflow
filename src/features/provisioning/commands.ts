import type { ProvisioningCommand } from "./types";
const kinds: Record<ProvisioningCommand["provider"], string[]> = { github: ["CREATE_REPOSITORY", "UPSERT_FILES", "CREATE_BRANCH", "SET_REPOSITORY_VARIABLES"], supabase: ["VALIDATE_PROJECT", "APPLY_SQL_SCHEMA", "CONFIGURE_AUTH", "CONFIGURE_STORAGE", "CONFIGURE_SAFE_SETTINGS"], vercel: ["CREATE_PROJECT", "CONNECT_GIT_REPOSITORY", "SET_ENVIRONMENT_VARIABLE_REFERENCES", "DEPLOY", "CHECK_DEPLOYMENT_STATUS"] };
const secretKey = /(^|_)(secret|token|password|api_?key|private_?key|server_?key)($|_)/i;
function containsSecretField(value: unknown): boolean { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some(containsSecretField); return Object.entries(value).some(([key, nested]) => secretKey.test(key) || containsSecretField(nested)); }
export function isSafeProvisioningSql(sql: string) {
  const normalized = sql.replace(/--.*$/gm, " ").replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > 100_000) return false;
  const withoutBlueprintGrants = normalized
    .replace(
      /\bgrant select on table public\.buildflow_admins to authenticated\s*;?/gi,
      " ",
    )
    .replace(
      /\bgrant select, insert, update, delete on table public\.buildflow_todos to authenticated\s*;?/gi,
      " ",
    );
  return !/\b(drop\s+(database|schema|table|role|user)|truncate|alter\s+(role|user)|disable\s+row\s+level\s+security|grant\s+.+\s+to\s+(anon|authenticated|public)|revoke|copy\s+.+\s+program|pg_read_file|pg_write_file|lo_import|lo_export)\b/i.test(
    withoutBlueprintGrants,
  );
}
export function validateProvisioningCommand(command: ProvisioningCommand) { const errors: string[] = []; if (!command.projectId || !command.id || !command.approvalScope) errors.push("COMMAND_REQUIRED_FIELD_MISSING"); if (!kinds[command.provider].includes(command.kind)) errors.push("COMMAND_PROVIDER_MISMATCH"); if (command.estimatedCostCents < 0) errors.push("COMMAND_COST_INVALID"); if (containsSecretField(command.payload)) errors.push("COMMAND_SECRET_FIELD"); if (command.kind === "CREATE_REPOSITORY" && command.payload.private !== true) errors.push("PUBLIC_REPOSITORY_NOT_APPROVED"); if (command.kind === "APPLY_SQL_SCHEMA" && !isSafeProvisioningSql(String(command.payload.sql ?? ""))) errors.push("UNSAFE_SQL_BLOCKED"); return errors; }
export function commandFromPlan(projectId: string, provider: ProvisioningCommand["provider"], kind: ProvisioningCommand["kind"], payload: ProvisioningCommand["payload"], approvalScope: string): ProvisioningCommand { const command = { id: `${provider}-${kind.toLowerCase()}-${projectId}`, provider, kind, projectId, payload, approvalScope, estimatedCostCents: 0, reversible: true }; const errors = validateProvisioningCommand(command); if (errors.length) throw new Error(errors[0]); return command; }
