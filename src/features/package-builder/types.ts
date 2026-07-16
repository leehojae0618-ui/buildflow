import type { RequirementSnapshot } from "@/features/requirements/types";

export type PackageManifest = {
  id: string; name: string; displayName: string; description: string; version: string;
  author: { name: string; id?: string }; license: string; category: string; tags: string[]; visibility: "private";
  createdAt: string; updatedAt: string; buildflowVersion: string; packageVersion: string;
  compatibility: { minRuntime: string; minBuildFlowVersion: string; providers: string[]; connectors: string[]; regions: string[]; hosting: string[] };
  dependency: { packages: string[]; blueprints: string[]; connectors: string[]; providers: string[] };
};
export type PackageArtifact = { path: string; type: string; content: string; checksum: string };
export type PackageValidation = { valid: boolean; errors: string[]; missing: string[] };
export type PackagePreview = { manifest: PackageManifest; artifacts: PackageArtifact[]; missing: string[]; estimatedSize: number; validation: PackageValidation };
export type BuiltPackage = PackagePreview & { files: Record<string, string>; archive: Uint8Array };
export type PackageBuilderInput = { projectId: string; title: string; goal: string; snapshot: RequirementSnapshot; author: { name: string; id?: string }; buildFlowVersion?: string; now?: string };
