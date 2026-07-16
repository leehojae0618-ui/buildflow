import type { ArchitectureSnapshot } from "../requirements/types";
import { componentRegistry } from "./registry";

export function normalizeArchitectureSnapshot(value: unknown): ArchitectureSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ArchitectureSnapshot>;
  if (candidate.version !== "architecture-v1" || !Array.isArray(candidate.components) || !Array.isArray(candidate.connections) || !Array.isArray(candidate.dependencies)) return null;
  const components = candidate.components.filter((component) => component && typeof component.id === "string" && componentRegistry.some((registered) => registered.id === component.id));
  return { version: "architecture-v1", components, connections: candidate.connections, dependencies: candidate.dependencies, summary: typeof candidate.summary === "string" ? candidate.summary : "Architecture Snapshot" };
}
