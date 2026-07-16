import type { ArchitectureCandidate, ArchitectureCandidates } from "./candidates";

export type SelectionValidationInput = { candidateId: string; confirmOverBudget: boolean; excludedTools: string[] };
export type SelectionValidationResult = { ok: true; candidate: ArchitectureCandidate } | { ok: false; reason: "NOT_FOUND" | "OUT_OF_BUDGET" | "EXCLUDED_TOOL" | "STALE" };
export function validateCandidateSelection(candidates: ArchitectureCandidates, input: SelectionValidationInput): SelectionValidationResult { const candidate = candidates.candidates.find((item) => item.id === input.candidateId); if (!candidate) return { ok: false, reason: "NOT_FOUND" }; if (candidate.status === "OUT_OF_BUDGET" && !input.confirmOverBudget) return { ok: false, reason: "OUT_OF_BUDGET" }; if (candidate.architecture.components.some((component) => input.excludedTools.includes(component.id))) return { ok: false, reason: "EXCLUDED_TOOL" }; return { ok: true, candidate }; }
