import type { CapabilitySupport, ExternalBuilderCapability, ExternalBuilderPlatform } from "./types";

type CapabilityMatrix = Readonly<Record<ExternalBuilderCapability, CapabilitySupport>>;

const makeCapabilities: CapabilityMatrix = {
  trigger: "SUPPORTED",
  transform: "SUPPORTED",
  approvalGate: "PARTIAL",
  externalAction: "REQUIRES_REAL_PLATFORM_VALIDATION",
  scheduling: "PARTIAL",
  webhook: "SUPPORTED",
  resultCollection: "REQUIRES_REAL_PLATFORM_VALIDATION",
};

const n8nCapabilities: CapabilityMatrix = {
  trigger: "SUPPORTED",
  transform: "SUPPORTED",
  approvalGate: "PARTIAL",
  externalAction: "REQUIRES_REAL_PLATFORM_VALIDATION",
  scheduling: "PARTIAL",
  webhook: "SUPPORTED",
  resultCollection: "REQUIRES_REAL_PLATFORM_VALIDATION",
};

export function getCapabilityMatrix(platform: ExternalBuilderPlatform): CapabilityMatrix {
  return platform === "MAKE" ? makeCapabilities : n8nCapabilities;
}

export function compileWarnings(platform: ExternalBuilderPlatform): string[] {
  return Object.entries(getCapabilityMatrix(platform))
    .filter(([, support]) => support !== "SUPPORTED")
    .map(([capability, support]) => `${platform}_${capability}_${support}`);
}

export function unsupportedCapabilities(platform: ExternalBuilderPlatform): ExternalBuilderCapability[] {
  return (Object.entries(getCapabilityMatrix(platform)) as Array<[ExternalBuilderCapability, CapabilitySupport]>)
    .filter(([, support]) => support === "UNSUPPORTED")
    .map(([capability]) => capability);
}
