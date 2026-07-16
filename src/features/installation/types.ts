import type { BuildTaskAction, BuildTaskStatus } from "../planner/types";
export type InstallationStep = { id: string; taskId: string; phaseId: string; title: string; description: string; action: BuildTaskAction; status: BuildTaskStatus; order: number };
export type InstallationProgress = { total: number; completed: number; percentage: number };
export type InstallationSession = { version: "installation-v1"; currentStepIndex: number; steps: InstallationStep[]; progress: InstallationProgress; summary: string };
