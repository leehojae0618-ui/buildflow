export type CredentialStatus = "MISSING" | "PROVIDED" | "VALID" | "INVALID" | "EXPIRED" | "ERROR";
export type CredentialField = { id: string; label: string; secret: boolean; required: boolean; placeholder?: string; format: "text" | "url" | "token" };
export type CredentialDefinition = { id: string; providerId: string; name: string; fields: CredentialField[] };
export type CredentialReference = { id: string; providerId: string; definitionId: string; status: CredentialStatus; configured: boolean };
export type CredentialValidationResult = { status: CredentialStatus; valid: boolean; missingFields: string[]; invalidFields: string[]; message: string };

// Raw credential values intentionally have no domain type and never cross this boundary.
