import type { ArchitectureSnapshot, BuildIntelligence, Requirement } from "../requirements/types";

export type BuildTaskAction = "AUTO" | "USER_ACTION" | "EXPERT_REQUIRED";
export type BuildTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type BuildPhaseId = "preparation" | "accounts" | "environment" | "database" | "authentication" | "automation" | "deployment" | "verification";
export type BuildTask = { id: string; phaseId: BuildPhaseId; title: string; description: string; action: BuildTaskAction; status: BuildTaskStatus; dependencyIds: string[]; componentIds: string[] };
export type BuildPhase = { id: BuildPhaseId; title: string; order: number; taskIds: string[] };
export type BuildPlanProgress = { total: number; completed: number; percentage: number };
export type BuildPlan = { version: "build-plan-v1"; phases: BuildPhase[]; tasks: BuildTask[]; progress: BuildPlanProgress; summary: string };
export type BuildPlannerInput = { requirement: Requirement; architecture: ArchitectureSnapshot; intelligence: BuildIntelligence };
