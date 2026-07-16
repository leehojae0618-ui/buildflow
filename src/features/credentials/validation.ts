import type { CredentialDefinition } from "./types";
import type { CredentialStatus, CredentialValidationResult } from "./types";

type Input = Record<string, string | undefined>;
export function validateRequiredFields(definition: CredentialDefinition, input: Input): string[] { return definition.fields.filter((field) => field.required && !input[field.id]?.trim()).map((field) => field.id); }
export function validateFormat(definition: CredentialDefinition, input: Input): string[] { return definition.fields.filter((field) => { const value = input[field.id]?.trim(); if (!value) return false; if (field.format === "url") { try { return !/^https?:\/\//.test(value) || !new URL(value).hostname; } catch { return true; } } return field.format === "token" && value.length < 8; }).map((field) => field.id); }
export function validateCredential(definition: CredentialDefinition, input: Input): CredentialValidationResult { const missingFields = validateRequiredFields(definition, input); const invalidFields = validateFormat(definition, input); const status: CredentialStatus = missingFields.length ? "MISSING" : invalidFields.length ? "INVALID" : "PROVIDED"; return { status, valid: status === "PROVIDED", missingFields, invalidFields, message: status === "PROVIDED" ? "형식 검증을 통과했습니다. 외부 연결은 아직 확인하지 않았습니다." : "필수 값 또는 형식을 확인하세요." }; }
export function getCredentialStatus(reference: { configured: boolean; status: CredentialStatus }): CredentialStatus { return reference.configured ? reference.status : "MISSING"; }
