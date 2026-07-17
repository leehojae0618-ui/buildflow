import { describe, expect, it } from "vitest";
import { sampleMcpServerDefinition, type McpToolDefinition } from "../mcp";
import {
  buildPackageApprovalDecision,
  buildPackageApprovalRequest,
  evaluatePackageApprovalGate,
  packageApprovalGateFormatVersion,
  stableSerializeAgentPackage,
  type PackageApprovalActorReference,
  type PackageApprovalRequest,
  type PackageApprovalScope,
} from ".";
import {
  exportAgentPackageArtifact,
  type AgentPackageExportInput,
} from "./package-export";
import { buildPackageEvidenceBundle } from "./package-evidence-bundle";
import {
  buildPackageEvidenceReport,
  type PackageEvidenceReport,
} from "./package-evidence-report";
import {
  createAgentPackageProfile,
  validateAgentPackageReadiness,
} from "./package-profile";
import { runPackageVerificationPipeline } from "./package-verification-pipeline";
import { verifyAgentPackageArtifact } from "./package-verification";
import { resolveAgentToolRequirements } from "./tool-resolution";
import { aiInquiryV1AgentBlueprint } from "./types";
import { definitionFromBlueprint } from "./validator";
import { validateAgentReadiness } from "./validation-gate";

const baseTool = sampleMcpServerDefinition.tools[0];
const userActor: PackageApprovalActorReference = {
  actorId: " user:pm ",
  actorType: "USER",
  roleReference: " role:owner ",
  organizationReference: " org:buildflow ",
};
const serviceActor: PackageApprovalActorReference = {
  actorId: "service:automation",
  actorType: "SERVICE",
};
const systemActor: PackageApprovalActorReference = {
  actorId: "system:gate",
  actorType: "SYSTEM",
};

function toolWith(overrides: Partial<McpToolDefinition> = {}): McpToolDefinition {
  return {
    ...baseTool,
    ...overrides,
    credential: {
      ...baseTool.credential,
      ...overrides.credential,
    },
    permissionPolicy: {
      ...baseTool.permissionPolicy,
      approvalRequirement: "NONE",
      ...overrides.permissionPolicy,
    },
    safeResultPolicy: {
      ...baseTool.safeResultPolicy,
      ...overrides.safeResultPolicy,
    },
  };
}

function exportInput(): AgentPackageExportInput {
  const tool = toolWith();
  const definition = definitionFromBlueprint({
    projectId: "agent-package-approval-gate-project",
    name: "AI Inquiry Agent",
    blueprint: aiInquiryV1AgentBlueprint,
    deliveryMode: "CHAT",
    interfaceModes: ["WEB_CHAT"],
  });
  const toolResolutionPlan = resolveAgentToolRequirements({
    requirements: [
      {
        id: "requirement.email-read",
        capability: "EMAIL_READ",
        required: true,
      },
    ],
    candidates: [
      {
        id: "candidate.gmail-read",
        credentialAvailable: true,
        tool,
      },
    ],
  });
  const validationGate = validateAgentReadiness({
    definition,
    blueprint: aiInquiryV1AgentBlueprint,
    toolResolutionPlan,
    mcpTools: [tool],
  });
  const profile = createAgentPackageProfile({
    packageId: "pkg.ai-inquiry-agent",
    packageVersion: "1.0.0",
    buildflowVersion: "0.1.0",
    definition,
    toolResolutionPlan,
    validationGate,
    mcpTools: [tool],
  });
  const readiness = validateAgentPackageReadiness(profile, {
    toolResolutionPlan,
    validationGate,
    mcpTools: [tool],
  });

  return {
    formatVersion: "bps-agent-profile-artifact-1.0",
    profile,
    readiness,
  };
}

function report(): PackageEvidenceReport {
  const input = exportInput();
  const packageArtifact = exportAgentPackageArtifact(input);
  const verificationReport = verifyAgentPackageArtifact(packageArtifact);
  const evidenceBundleResult = buildPackageEvidenceBundle({
    packageArtifact,
    verificationReport,
    packageArtifactReference: "artifact://pkg.ai-inquiry-agent/1.0.0/profile",
    verificationReportReference:
      "verification://pkg.ai-inquiry-agent/1.0.0/report",
  });
  const verificationPipeline = runPackageVerificationPipeline({
    ...input,
    packageArtifactReference: "artifact://pkg.ai-inquiry-agent/1.0.0/profile",
    verificationReportReference:
      "verification://pkg.ai-inquiry-agent/1.0.0/report",
  });
  return buildPackageEvidenceReport({
    packageArtifact,
    verificationReport,
    evidenceBundleResult,
    verificationPipeline,
    sourceReferences: {
      packageArtifact: "artifact://pkg.ai-inquiry-agent/1.0.0/profile",
      verificationReport: "verification://pkg.ai-inquiry-agent/1.0.0/report",
      evidenceBundle: "bundle://pkg.ai-inquiry-agent/1.0.0/evidence",
      verificationPipeline: "pipeline://pkg.ai-inquiry-agent/1.0.0/summary",
    },
  }).report;
}

function request(scopes: string[] = ["DEPLOYMENT"]): PackageApprovalRequest {
  const result = buildPackageApprovalRequest({
    evidenceReport: report(),
    requestedScopes: scopes,
    requestedBy: serviceActor,
    requiredApprover: userActor,
    reason: "AI Chief Engineer requests scoped approval.",
    limitations: ["Runtime is not executed."],
    metadata: { display: "ignored" },
  });
  if (result.status !== "VALID") throw new Error("expected request");
  return result.request;
}

function decision(
  approvalRequest = request(),
  scope: PackageApprovalScope = "DEPLOYMENT",
  decisionValue: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "ABSTAIN" = "APPROVE",
) {
  const reasonCode =
    decisionValue === "APPROVE"
      ? "BUSINESS_APPROVAL"
      : decisionValue === "REJECT"
        ? "USER_REJECTED"
        : decisionValue === "REQUEST_CHANGES"
          ? "CHANGES_REQUIRED"
          : "OTHER";
  const result = buildPackageApprovalDecision({
    request: approvalRequest,
    scope,
    actorReference: userActor,
    decision: decisionValue,
    reasonCode,
    comment: "Looks good.",
    metadata: { display: "ignored" },
  });
  if (result.status !== "RECORDED") throw new Error("expected decision");
  return result.record;
}

describe("package approval gate request builder", () => {
  it("creates a normal multi-scope request", () => {
    const result = buildPackageApprovalRequest({
      evidenceReport: report(),
      requestedScopes: ["DEPLOYMENT", "PACKAGE_ACCEPTANCE", "RUNTIME_EXECUTION"],
      requestedBy: serviceActor,
      requiredApprover: userActor,
    });

    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") throw new Error("expected request");
    expect(result.request.requestStatus).toBe("PENDING");
    expect(result.request.requestedScopes).toEqual([
      "PACKAGE_ACCEPTANCE",
      "RUNTIME_EXECUTION",
      "DEPLOYMENT",
    ]);
  });

  it("produces deterministic approvalRequestId and checksum", () => {
    const first = request(["DEPLOYMENT", "PACKAGE_ACCEPTANCE"]);
    const second = request(["PACKAGE_ACCEPTANCE", "DEPLOYMENT"]);

    expect(first.approvalRequestId).toBe(second.approvalRequestId);
    expect(first.integrityChecksum).toBe(second.integrityChecksum);
  });

  it("deduplicates scopes", () => {
    expect(request(["DEPLOYMENT", "DEPLOYMENT"]).requestedScopes).toEqual([
      "DEPLOYMENT",
    ]);
  });

  it("rejects empty scopes", () => {
    const result = buildPackageApprovalRequest({
      evidenceReport: report(),
      requestedScopes: [],
      requestedBy: serviceActor,
      requiredApprover: userActor,
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("SCOPE_MISMATCH");
  });

  it("rejects unsupported v1 scopes", () => {
    const result = buildPackageApprovalRequest({
      evidenceReport: report(),
      requestedScopes: ["MCP_INVOCATION"],
      requestedBy: serviceActor,
      requiredApprover: userActor,
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("UNSUPPORTED_SCOPE");
  });

  it("rejects missing source identifiers", () => {
    const evidenceReport = { ...report(), packageId: null };
    const result = buildPackageApprovalRequest({
      evidenceReport,
      requestedScopes: ["DEPLOYMENT"],
      requestedBy: serviceActor,
      requiredApprover: userActor,
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("CONTRACT_ERROR");
  });

  it("normalizes actor references", () => {
    expect(request().requiredApprover.actorId).toBe("user:pm");
    expect(request().requiredApprover.roleReference).toBe("role:owner");
  });

  it("rejects missing actor references", () => {
    const result = buildPackageApprovalRequest({
      evidenceReport: report(),
      requestedScopes: ["DEPLOYMENT"],
      requestedBy: { actorId: "", actorType: "SERVICE" },
      requiredApprover: userActor,
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("CONTRACT_ERROR");
  });

  it("keeps metadata and human reason outside request identity", () => {
    const first = buildPackageApprovalRequest({
      evidenceReport: report(),
      requestedScopes: ["DEPLOYMENT"],
      requestedBy: serviceActor,
      requiredApprover: userActor,
      reason: "first",
      metadata: { label: "first" },
    });
    const second = buildPackageApprovalRequest({
      evidenceReport: report(),
      requestedScopes: ["DEPLOYMENT"],
      requestedBy: serviceActor,
      requiredApprover: userActor,
      reason: "second",
      metadata: { label: "second" },
    });

    if (first.status !== "VALID" || second.status !== "VALID") {
      throw new Error("expected requests");
    }
    expect(first.request.approvalRequestId).toBe(second.request.approvalRequestId);
    expect(first.request.integrityChecksum).toBe(second.request.integrityChecksum);
  });

  it("rejects secret-like request text without exposing the value", () => {
    const rawSecret = "sk-" + "a".repeat(24);
    const result = buildPackageApprovalRequest({
      evidenceReport: report(),
      requestedScopes: ["DEPLOYMENT"],
      requestedBy: serviceActor,
      requiredApprover: userActor,
      reason: rawSecret,
    });

    expect(result.status).toBe("INVALID");
    expect(JSON.stringify(result.failures)).not.toContain(rawSecret);
  });

  it("does not mutate request input", () => {
    const input = {
      evidenceReport: report(),
      requestedScopes: ["DEPLOYMENT", "DEPLOYMENT"],
      requestedBy: serviceActor,
      requiredApprover: userActor,
    };
    const before = stableSerializeAgentPackage(input);
    buildPackageApprovalRequest(input);
    expect(stableSerializeAgentPackage(input)).toBe(before);
  });
});

describe("package approval decision builder", () => {
  it("records USER APPROVE decisions", () => {
    const result = buildPackageApprovalDecision({
      request: request(),
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
    });

    expect(result.status).toBe("RECORDED");
    if (result.status !== "RECORDED") throw new Error("expected decision");
    expect(result.record.decisionStatus).toBe("RECORDED");
  });

  it("records USER REJECT decisions", () => {
    expect(decision(request(), "DEPLOYMENT", "REJECT").decision).toBe("REJECT");
  });

  it("records USER REQUEST_CHANGES decisions", () => {
    expect(decision(request(), "DEPLOYMENT", "REQUEST_CHANGES").decision).toBe(
      "REQUEST_CHANGES",
    );
  });

  it("records USER ABSTAIN decisions", () => {
    expect(decision(request(), "DEPLOYMENT", "ABSTAIN").decision).toBe("ABSTAIN");
  });

  it("rejects SERVICE APPROVE", () => {
    const result = buildPackageApprovalDecision({
      request: request(),
      scope: "DEPLOYMENT",
      actorReference: serviceActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("APPROVER_MISMATCH");
  });

  it("rejects SYSTEM APPROVE", () => {
    const result = buildPackageApprovalDecision({
      request: request(),
      scope: "DEPLOYMENT",
      actorReference: systemActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
    });

    expect(result.status).toBe("INVALID");
  });

  it("rejects a scope not included in request", () => {
    const result = buildPackageApprovalDecision({
      request: request(["PACKAGE_ACCEPTANCE"]),
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("SCOPE_MISMATCH");
  });

  it("rejects actor mismatch", () => {
    const result = buildPackageApprovalDecision({
      request: request(),
      scope: "DEPLOYMENT",
      actorReference: { actorId: "user:other", actorType: "USER" },
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
    });

    expect(result.status).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("APPROVER_MISMATCH");
  });

  it("marks decision stale when source checksum changes", () => {
    const approvalRequest = request();
    const result = buildPackageApprovalDecision({
      request: approvalRequest,
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
      sourceReferences: {
        ...approvalRequest.sourceReferences,
        evidenceBundleChecksum: "0".repeat(64),
      },
    });

    expect(result.status).toBe("STALE");
  });

  it("marks superseded request decisions stale", () => {
    const approvalRequest: PackageApprovalRequest = {
      ...request(),
      requestStatus: "SUPERSEDED",
    };
    const result = buildPackageApprovalDecision({
      request: approvalRequest,
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
    });

    expect(result.status).toBe("STALE");
  });

  it("produces deterministic decision ids and checksums", () => {
    const approvalRequest = request();
    const first = decision(approvalRequest);
    const second = decision(approvalRequest);

    expect(first.approvalDecisionId).toBe(second.approvalDecisionId);
    expect(first.integrityChecksum).toBe(second.integrityChecksum);
  });

  it("keeps comment outside decision id", () => {
    const approvalRequest = request();
    const first = buildPackageApprovalDecision({
      request: approvalRequest,
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
      comment: "first",
    });
    const second = buildPackageApprovalDecision({
      request: approvalRequest,
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
      comment: "second",
    });

    if (first.status !== "RECORDED" || second.status !== "RECORDED") {
      throw new Error("expected decisions");
    }
    expect(first.record.approvalDecisionId).toBe(second.record.approvalDecisionId);
  });

  it("changes decision id when reasonCode changes", () => {
    const approvalRequest = request();
    const first = buildPackageApprovalDecision({
      request: approvalRequest,
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
    });
    const second = buildPackageApprovalDecision({
      request: approvalRequest,
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE",
      reasonCode: "ACCEPTED_RISK",
    });

    if (first.status !== "RECORDED" || second.status !== "RECORDED") {
      throw new Error("expected decisions");
    }
    expect(first.record.approvalDecisionId).not.toBe(second.record.approvalDecisionId);
  });

  it("rejects conflicting reasonCode", () => {
    const result = buildPackageApprovalDecision({
      request: request(),
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "REJECT",
      reasonCode: "BUSINESS_APPROVAL",
    });

    expect(result.status).toBe("INVALID");
  });

  it("rejects secret comments without exposing the value", () => {
    const rawSecret = "ghp_" + "a".repeat(24);
    const result = buildPackageApprovalDecision({
      request: request(),
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
      comment: rawSecret,
    });

    expect(result.status).toBe("INVALID");
    expect(JSON.stringify(result.failures)).not.toContain(rawSecret);
  });

  it("does not mutate decision input", () => {
    const approvalRequest = request();
    const input = {
      request: approvalRequest,
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE" as const,
      reasonCode: "BUSINESS_APPROVAL" as const,
    };
    const before = stableSerializeAgentPackage(input);
    buildPackageApprovalDecision(input);
    expect(stableSerializeAgentPackage(input)).toBe(before);
  });
});

describe("package approval gate evaluator", () => {
  it("returns PENDING_APPROVAL when decisions are missing", () => {
    const approvalRequest = request();
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("PENDING_APPROVAL");
    expect(result.authorization.authorizationStatus).toBe("PENDING");
  });

  it("returns APPROVED_WITH_LIMITATIONS when all requested scopes are approved", () => {
    const approvalRequest = request(["PACKAGE_ACCEPTANCE", "DEPLOYMENT"]);
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [
        decision(approvalRequest, "PACKAGE_ACCEPTANCE"),
        decision(approvalRequest, "DEPLOYMENT"),
      ],
      requestedExecutionScopes: ["DEPLOYMENT", "PACKAGE_ACCEPTANCE"],
    });

    expect(result.gateStatus).toBe("APPROVED_WITH_LIMITATIONS");
    expect(result.authorization.authorizationStatus).toBe(
      "AUTHORIZED_WITH_LIMITATIONS",
    );
  });

  it("never returns APPROVED in v1", () => {
    expect(
      evaluatePackageApprovalGate({
        evidenceReport: report(),
        request: request(),
        decisions: [decision()],
        requestedExecutionScopes: ["DEPLOYMENT"],
      }).gateStatus,
    ).not.toBe("APPROVED");
  });

  it("never returns AUTHORIZED in v1", () => {
    expect(
      evaluatePackageApprovalGate({
        evidenceReport: report(),
        request: request(),
        decisions: [decision()],
        requestedExecutionScopes: ["DEPLOYMENT"],
      }).authorization.authorizationStatus,
    ).not.toBe("AUTHORIZED");
  });

  it("supports partial approval with pending scopes", () => {
    const approvalRequest = request(["PACKAGE_ACCEPTANCE", "DEPLOYMENT"]);
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest, "PACKAGE_ACCEPTANCE")],
      requestedExecutionScopes: ["PACKAGE_ACCEPTANCE", "DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("PENDING_APPROVAL");
    expect(result.grantedScopes).toEqual(["PACKAGE_ACCEPTANCE"]);
    expect(result.pendingScopes).toEqual(["DEPLOYMENT"]);
  });

  it("returns REJECTED when one requested scope is rejected but keeps granted scopes", () => {
    const approvalRequest = request(["PACKAGE_ACCEPTANCE", "DEPLOYMENT"]);
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [
        decision(approvalRequest, "PACKAGE_ACCEPTANCE"),
        decision(approvalRequest, "DEPLOYMENT", "REJECT"),
      ],
      requestedExecutionScopes: ["PACKAGE_ACCEPTANCE", "DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("REJECTED");
    expect(result.grantedScopes).toEqual(["PACKAGE_ACCEPTANCE"]);
    expect(result.deniedScopes).toEqual(["DEPLOYMENT"]);
  });

  it("treats REQUEST_CHANGES as denied scope", () => {
    const approvalRequest = request();
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest, "DEPLOYMENT", "REQUEST_CHANGES")],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("REJECTED");
  });

  it("treats ABSTAIN as denied scope", () => {
    const approvalRequest = request();
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest, "DEPLOYMENT", "ABSTAIN")],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("REJECTED");
  });

  it("blocks invalid reports", () => {
    const evidenceReport = { ...report(), reportStatus: "INVALID" as const };
    const result = evaluatePackageApprovalGate({
      evidenceReport,
      request: request(),
      decisions: [decision()],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("BLOCKED");
  });

  it("blocks incomplete reports", () => {
    const evidenceReport = { ...report(), reportStatus: "INCOMPLETE" as const };
    const result = evaluatePackageApprovalGate({
      evidenceReport,
      request: request(),
      decisions: [decision()],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("BLOCKED");
  });

  it("marks changed report checksum as stale", () => {
    const approvalRequest = request();
    const evidenceReport = {
      ...report(),
      reportIntegrityChecksum: "1".repeat(64),
    };
    const result = evaluatePackageApprovalGate({
      evidenceReport,
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("STALE");
  });

  it("marks changed package artifact checksum as stale", () => {
    const approvalRequest = request();
    const evidenceReport = {
      ...report(),
      sourceReferences: {
        ...report().sourceReferences,
        packageArtifact: {
          ...report().sourceReferences.packageArtifact,
          checksum: "2".repeat(64),
        },
      },
    };
    const result = evaluatePackageApprovalGate({
      evidenceReport,
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("STALE");
  });

  it("marks changed verification checksum as stale", () => {
    const approvalRequest = request();
    const evidenceReport = {
      ...report(),
      sourceReferences: {
        ...report().sourceReferences,
        verificationReport: {
          ...report().sourceReferences.verificationReport,
          checksum: "3".repeat(64),
        },
      },
    };
    expect(
      evaluatePackageApprovalGate({
        evidenceReport,
        request: approvalRequest,
        decisions: [decision(approvalRequest)],
        requestedExecutionScopes: ["DEPLOYMENT"],
      }).gateStatus,
    ).toBe("STALE");
  });

  it("marks changed bundle checksum as stale", () => {
    const approvalRequest = request();
    const evidenceReport = {
      ...report(),
      sourceReferences: {
        ...report().sourceReferences,
        evidenceBundle: {
          ...report().sourceReferences.evidenceBundle,
          checksum: "4".repeat(64),
        },
      },
    };
    expect(
      evaluatePackageApprovalGate({
        evidenceReport,
        request: approvalRequest,
        decisions: [decision(approvalRequest)],
        requestedExecutionScopes: ["DEPLOYMENT"],
      }).gateStatus,
    ).toBe("STALE");
  });

  it("marks changed pipeline checksum as stale", () => {
    const approvalRequest = request();
    const evidenceReport = {
      ...report(),
      sourceReferences: {
        ...report().sourceReferences,
        verificationPipeline: {
          ...report().sourceReferences.verificationPipeline,
          checksum: "5".repeat(64),
        },
      },
    };
    expect(
      evaluatePackageApprovalGate({
        evidenceReport,
        request: approvalRequest,
        decisions: [decision(approvalRequest)],
        requestedExecutionScopes: ["DEPLOYMENT"],
      }).gateStatus,
    ).toBe("STALE");
  });

  it("blocks execution scope not included in request", () => {
    const approvalRequest = request(["PACKAGE_ACCEPTANCE"]);
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest, "PACKAGE_ACCEPTANCE")],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("BLOCKED");
  });

  it("dedupes identical decision IDs", () => {
    const approvalRequest = request();
    const approvalDecision = decision(approvalRequest);
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [approvalDecision, approvalDecision],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("APPROVED_WITH_LIMITATIONS");
    expect(result.decisionReferences).toHaveLength(2);
  });

  it("invalidates conflicting active decisions", () => {
    const approvalRequest = request();
    const approved = decision(approvalRequest);
    const rejected = decision(approvalRequest, "DEPLOYMENT", "REJECT");
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [approved, rejected],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("INVALID");
  });

  it("excludes revoked decisions from granted scopes", () => {
    const approvalRequest = request();
    const approved = decision(approvalRequest);
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [approved],
      requestedExecutionScopes: ["DEPLOYMENT"],
      revokedDecisionReferences: [approved.approvalDecisionId],
    });

    expect(result.gateStatus).toBe("PENDING_APPROVAL");
    expect(result.revokedScopes).toEqual(["DEPLOYMENT"]);
  });

  it("marks superseded request as stale", () => {
    const approvalRequest: PackageApprovalRequest = {
      ...request(),
      requestStatus: "SUPERSEDED",
    };
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("STALE");
  });

  it("keeps Package Readiness CONDITIONALLY_READY after approval", () => {
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: request(),
      decisions: [decision()],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.evidenceReportReference.packageReadiness).toBe(
      "CONDITIONALLY_READY",
    );
    expect(result.deterministicCore.packageReadiness).toBe("CONDITIONALLY_READY");
  });

  it("does not infer deployment success or marketplace publish", () => {
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: request(),
      decisions: [decision()],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.limitations.map((item) => item.code)).toContain(
      "DEPLOYMENT_NOT_EXECUTED",
    );
    expect(result.limitations.map((item) => item.code)).toContain(
      "MARKETPLACE_NOT_PUBLISHED",
    );
  });

  it("keeps fixed scope ordering independent of input order", () => {
    const approvalRequest = request(["DEPLOYMENT", "PACKAGE_ACCEPTANCE"]);
    expect(
      evaluatePackageApprovalGate({
        evidenceReport: report(),
        request: approvalRequest,
        decisions: [
          decision(approvalRequest, "DEPLOYMENT"),
          decision(approvalRequest, "PACKAGE_ACCEPTANCE"),
        ],
        requestedExecutionScopes: ["DEPLOYMENT", "PACKAGE_ACCEPTANCE"],
      }).requestedScopes,
    ).toEqual(["PACKAGE_ACCEPTANCE", "DEPLOYMENT"]);
  });

  it("keeps decision array order from changing result", () => {
    const approvalRequest = request(["PACKAGE_ACCEPTANCE", "DEPLOYMENT"]);
    const first = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [
        decision(approvalRequest, "DEPLOYMENT"),
        decision(approvalRequest, "PACKAGE_ACCEPTANCE"),
      ],
      requestedExecutionScopes: ["DEPLOYMENT", "PACKAGE_ACCEPTANCE"],
    });
    const second = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [
        decision(approvalRequest, "PACKAGE_ACCEPTANCE"),
        decision(approvalRequest, "DEPLOYMENT"),
      ],
      requestedExecutionScopes: ["PACKAGE_ACCEPTANCE", "DEPLOYMENT"],
    });

    expect(first.deterministicCore).toEqual(second.deterministicCore);
    expect(first.integrityChecksum).toBe(second.integrityChecksum);
  });

  it("keeps metadata changes outside gate checksum", () => {
    const approvalRequest = request();
    const first = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
      metadata: { display: "first" },
    });
    const second = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
      metadata: { display: "second" },
    });

    expect(first.integrityChecksum).toBe(second.integrityChecksum);
  });

  it("does not stale on human-readable report changes when checksum stays same", () => {
    const evidenceReport = {
      ...report(),
      humanReadable: { title: "Changed title" },
    };
    const approvalRequest = request();
    const result = evaluatePackageApprovalGate({
      evidenceReport,
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("APPROVED_WITH_LIMITATIONS");
  });

  it("rejects secret-like metadata without exposing the value", () => {
    const rawSecret = "AKIA" + "A".repeat(16);
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: request(),
      decisions: [decision()],
      requestedExecutionScopes: ["DEPLOYMENT"],
      metadata: { unsafe: rawSecret },
    });

    expect(result.gateStatus).toBe("INVALID");
    expect(JSON.stringify(result.failures)).not.toContain(rawSecret);
  });

  it("allows credential and vault reference identifiers", () => {
    const result = buildPackageApprovalRequest({
      evidenceReport: report(),
      requestedScopes: ["DEPLOYMENT"],
      requestedBy: {
        actorId: "credential-reference:gmail.mcp:gmail.read-message",
        actorType: "SERVICE",
      },
      requiredApprover: {
        actorId: "vault-reference:approver-record",
        actorType: "USER",
      },
    });

    expect(result.status).toBe("VALID");
  });

  it("sanitizes unexpected internal exceptions", () => {
    const result = evaluatePackageApprovalGate({
      get evidenceReport() {
        throw new Error("sk-" + "a".repeat(24));
      },
      request: null,
      decisions: [],
      requestedExecutionScopes: [],
    } as unknown as Parameters<typeof evaluatePackageApprovalGate>[0]);

    expect(result.gateStatus).toBe("INVALID");
    expect(result.failures[0]?.code).toBe("INTERNAL_APPROVAL_ERROR");
    expect(JSON.stringify(result)).not.toContain("sk-");
  });

  it("does not include full Evidence Report payload", () => {
    const evidenceReport = report();
    const result = evaluatePackageApprovalGate({
      evidenceReport,
      request: request(),
      decisions: [decision()],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(JSON.stringify(result)).not.toContain("humanReadable");
    expect(JSON.stringify(result)).not.toContain("executiveSummary");
    expect(JSON.stringify(result)).toContain(evidenceReport.reportId);
  });

  it("does not include request metadata or decision comments as source of truth", () => {
    const approvalRequest = request();
    const approvalDecision = buildPackageApprovalDecision({
      request: approvalRequest,
      scope: "DEPLOYMENT",
      actorReference: userActor,
      decision: "APPROVE",
      reasonCode: "BUSINESS_APPROVAL",
      comment: "Human-only comment.",
      metadata: { secretFreeDisplay: "Human display only" },
    });
    if (approvalDecision.status !== "RECORDED") throw new Error("expected decision");

    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [approvalDecision.record],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(JSON.stringify(result)).not.toContain("Human-only comment.");
    expect(JSON.stringify(result)).not.toContain("Human display only");
  });

  it("does not mutate gate input", () => {
    const approvalRequest = request();
    const input = {
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
    };
    const before = stableSerializeAgentPackage(input);
    evaluatePackageApprovalGate(input);
    expect(stableSerializeAgentPackage(input)).toBe(before);
  });

  it("uses the documented format version", () => {
    expect(
      evaluatePackageApprovalGate({
        evidenceReport: report(),
        request: request(),
        decisions: [decision()],
        requestedExecutionScopes: ["DEPLOYMENT"],
      }).formatVersion,
    ).toBe(packageApprovalGateFormatVersion);
  });

  it("does not rely on Date.now for identical inputs", () => {
    const approvalRequest = request();
    const first = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });
    const second = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(first.integrityChecksum).toBe(second.integrityChecksum);
  });

  it.each([
    [
      "evidenceReportId",
      (evidenceReport: PackageEvidenceReport) => ({
        ...evidenceReport,
        reportId: "report://" + "a".repeat(32),
      }),
    ],
    [
      "evidenceReportIntegrityChecksum",
      (evidenceReport: PackageEvidenceReport) => ({
        ...evidenceReport,
        reportIntegrityChecksum: "6".repeat(64),
      }),
    ],
    [
      "packageId",
      (evidenceReport: PackageEvidenceReport) => ({
        ...evidenceReport,
        packageId: "pkg.ai-inquiry-agent.changed",
      }),
    ],
    [
      "packageVersion",
      (evidenceReport: PackageEvidenceReport) => ({
        ...evidenceReport,
        packageVersion: "1.0.1",
      }),
    ],
    [
      "packageArtifactChecksum",
      (evidenceReport: PackageEvidenceReport) => ({
        ...evidenceReport,
        sourceReferences: {
          ...evidenceReport.sourceReferences,
          packageArtifact: {
            ...evidenceReport.sourceReferences.packageArtifact,
            checksum: "7".repeat(64),
          },
        },
      }),
    ],
    [
      "verificationReportChecksum",
      (evidenceReport: PackageEvidenceReport) => ({
        ...evidenceReport,
        sourceReferences: {
          ...evidenceReport.sourceReferences,
          verificationReport: {
            ...evidenceReport.sourceReferences.verificationReport,
            checksum: "8".repeat(64),
          },
        },
      }),
    ],
    [
      "evidenceBundleChecksum",
      (evidenceReport: PackageEvidenceReport) => ({
        ...evidenceReport,
        sourceReferences: {
          ...evidenceReport.sourceReferences,
          evidenceBundle: {
            ...evidenceReport.sourceReferences.evidenceBundle,
            checksum: "9".repeat(64),
          },
        },
      }),
    ],
    [
      "pipelineSummaryChecksum",
      (evidenceReport: PackageEvidenceReport) => ({
        ...evidenceReport,
        sourceReferences: {
          ...evidenceReport.sourceReferences,
          verificationPipeline: {
            ...evidenceReport.sourceReferences.verificationPipeline,
            checksum: "a".repeat(64),
          },
        },
      }),
    ],
  ])("marks %s single-source changes as STALE", (_label, mutate) => {
    const approvalRequest = request();
    const result = evaluatePackageApprovalGate({
      evidenceReport: mutate(report()),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("STALE");
    expect(result.authorization.authorizationStatus).toBe("STALE");
    expect(result.failures.map((item) => item.code)).toContain("APPROVAL_STALE");
    expect(result.failures.map((item) => item.code)).not.toContain(
      "CONTRACT_ERROR",
    );
  });

  it("invalidates unknown revoked decision references instead of ignoring them", () => {
    const approvalRequest = request();
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
      revokedDecisionReferences: ["decision://missing"],
    });

    expect(result.gateStatus).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("CONTRACT_ERROR");
  });

  it("normalizes duplicate revoked decision references deterministically", () => {
    const approvalRequest = request();
    const approvalDecision = decision(approvalRequest);
    const first = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [approvalDecision],
      requestedExecutionScopes: ["DEPLOYMENT"],
      revokedDecisionReferences: [
        approvalDecision.approvalDecisionId,
        approvalDecision.approvalDecisionId,
      ],
    });
    const second = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [approvalDecision],
      requestedExecutionScopes: ["DEPLOYMENT"],
      revokedDecisionReferences: [approvalDecision.approvalDecisionId],
    });

    expect(first.integrityChecksum).toBe(second.integrityChecksum);
    expect(first.gateStatus).toBe("PENDING_APPROVAL");
  });

  it("rejects secret-like revoked decision references", () => {
    const rawSecret = "ghp_" + "a".repeat(24);
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: request(),
      decisions: [],
      requestedExecutionScopes: ["DEPLOYMENT"],
      revokedDecisionReferences: [rawSecret],
    });

    expect(result.gateStatus).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain(
      "SECRET_SAFETY_ERROR",
    );
    expect(JSON.stringify(result)).not.toContain(rawSecret);
  });

  it("treats matching superseding reference as STALE and unrelated reference as INVALID", () => {
    const approvalRequest = request();
    const matching = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
      supersedingRequestReference: approvalRequest.approvalRequestId,
    });
    const unrelated = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
      supersedingRequestReference: "approval-request://other",
    });

    expect(matching.gateStatus).toBe("STALE");
    expect(unrelated.gateStatus).toBe("INVALID");
  });

  it("rejects secret-like superseding references", () => {
    const rawSecret = "sk-" + "a".repeat(24);
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: request(),
      decisions: [],
      requestedExecutionScopes: ["DEPLOYMENT"],
      supersedingRequestReference: rawSecret,
    });

    expect(result.gateStatus).toBe("INVALID");
    expect(JSON.stringify(result)).not.toContain(rawSecret);
  });

  it("rejects secret-like expiration policy references", () => {
    const rawSecret = "sk-" + "a".repeat(24);
    const result = buildPackageApprovalRequest({
      evidenceReport: report(),
      requestedScopes: ["DEPLOYMENT"],
      requestedBy: serviceActor,
      requiredApprover: userActor,
      expirationPolicy: { kind: "REFERENCE_ONLY", reference: rawSecret },
    });

    expect(result.status).toBe("INVALID");
    expect(JSON.stringify(result.failures)).not.toContain(rawSecret);
  });

  it("keeps REFERENCE_ONLY expiration unevaluated even with evaluationTime", () => {
    const approvalRequest: PackageApprovalRequest = {
      ...request(),
      expirationPolicy: { kind: "REFERENCE_ONLY", reference: "approval-window://v1" },
    };
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
      evaluationTime: "2099-01-01T00:00:00.000Z",
    });

    expect(result.gateStatus).toBe("APPROVED_WITH_LIMITATIONS");
    expect(result.deterministicCore.expirationEvaluation.status).toBe(
      "NOT_EVALUATED",
    );
  });

  it("requires evaluationTime for EXPLICIT_TIME expiration", () => {
    const approvalRequest: PackageApprovalRequest = {
      ...request(),
      expirationPolicy: {
        kind: "EXPLICIT_TIME",
        expiresAt: "2026-07-17T00:00:00.000Z",
      },
    };
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("CONTRACT_ERROR");
  });

  it("rejects invalid expiration times", () => {
    const approvalRequest: PackageApprovalRequest = {
      ...request(),
      expirationPolicy: {
        kind: "EXPLICIT_TIME",
        expiresAt: "not-a-date",
      },
    };
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
      evaluationTime: "2026-07-16T00:00:00.000Z",
    });

    expect(result.gateStatus).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("CONTRACT_ERROR");
  });

  it("treats expiration equality as expired and timezone offsets canonically", () => {
    const approvalRequest: PackageApprovalRequest = {
      ...request(),
      expirationPolicy: {
        kind: "EXPLICIT_TIME",
        expiresAt: "2026-07-17T09:00:00+09:00",
      },
    };
    const equal = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
      evaluationTime: "2026-07-17T00:00:00.000Z",
    });
    const before = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
      evaluationTime: "2026-07-16T23:59:59.000Z",
    });

    expect(equal.gateStatus).toBe("BLOCKED");
    expect(equal.deterministicCore.expirationEvaluation.expiresAt).toBe(
      "2026-07-17T00:00:00.000Z",
    );
    expect(before.gateStatus).toBe("APPROVED_WITH_LIMITATIONS");
  });

  it("uses BLOCKED before REJECTED for invalid or incomplete reports and expired requests", () => {
    const approvalRequest = request();
    const rejected = decision(approvalRequest, "DEPLOYMENT", "REJECT");
    const invalidReport = evaluatePackageApprovalGate({
      evidenceReport: { ...report(), reportStatus: "INVALID" },
      request: approvalRequest,
      decisions: [rejected],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });
    const incompleteReport = evaluatePackageApprovalGate({
      evidenceReport: { ...report(), reportStatus: "INCOMPLETE" },
      request: approvalRequest,
      decisions: [rejected],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });
    const expiredRequest = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: { ...approvalRequest, requestStatus: "EXPIRED" },
      decisions: [rejected],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(invalidReport.gateStatus).toBe("BLOCKED");
    expect(incompleteReport.gateStatus).toBe("BLOCKED");
    expect(expiredRequest.gateStatus).toBe("BLOCKED");
  });

  it("keeps STALE before REJECTED and INVALID before STALE", () => {
    const approvalRequest = request();
    const rejected = decision(approvalRequest, "DEPLOYMENT", "REJECT");
    const staleRejected = evaluatePackageApprovalGate({
      evidenceReport: {
        ...report(),
        reportIntegrityChecksum: "b".repeat(64),
      },
      request: approvalRequest,
      decisions: [rejected],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });
    const conflictAndStale = evaluatePackageApprovalGate({
      evidenceReport: {
        ...report(),
        reportIntegrityChecksum: "c".repeat(64),
      },
      request: approvalRequest,
      decisions: [decision(approvalRequest), rejected],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(staleRejected.gateStatus).toBe("STALE");
    expect(conflictAndStale.gateStatus).toBe("INVALID");
  });

  it("dedupes different IDs with the same integrity checksum as logical duplicates", () => {
    const approvalRequest = request();
    const approved = decision(approvalRequest);
    const duplicate = {
      ...approved,
      approvalDecisionId: "decision://duplicate-id",
    };
    const result = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [approved, duplicate],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("APPROVED_WITH_LIMITATIONS");
  });

  it("rejects VALID Evidence Report status as unsupported future status", () => {
    const result = evaluatePackageApprovalGate({
      evidenceReport: { ...report(), reportStatus: "VALID" },
      request: request(),
      decisions: [decision()],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });

    expect(result.gateStatus).toBe("INVALID");
    expect(result.failures.map((item) => item.code)).toContain("CONTRACT_ERROR");
  });

  it("does not copy upstream sentinel payload fields", () => {
    const evidenceReport = {
      ...report(),
      rawFailures: "sentinel-rawFailures",
      rawStagePayload: "sentinel-rawStagePayload",
      pipelineStageDetails: "sentinel-pipelineStageDetails",
      bundleArtifacts: "sentinel-bundleArtifacts",
      providerResponse: "sentinel-providerResponse",
      mcpResponse: "sentinel-mcpResponse",
      rawLogs: "sentinel-rawLogs",
      stack: "sentinel-stack",
      authClaims: "sentinel-authClaims",
      requestHeaders: "sentinel-requestHeaders",
    } as unknown as PackageEvidenceReport & Record<string, string>;
    const result = evaluatePackageApprovalGate({
      evidenceReport,
      request: request(),
      decisions: [decision()],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain("sentinel-rawFailures");
    expect(serialized).not.toContain("sentinel-rawStagePayload");
    expect(serialized).not.toContain("sentinel-pipelineStageDetails");
    expect(serialized).not.toContain("sentinel-bundleArtifacts");
    expect(serialized).not.toContain("sentinel-providerResponse");
    expect(serialized).not.toContain("sentinel-mcpResponse");
    expect(serialized).not.toContain("sentinel-rawLogs");
    expect(serialized).not.toContain("sentinel-stack");
    expect(serialized).not.toContain("sentinel-authClaims");
    expect(serialized).not.toContain("sentinel-requestHeaders");
  });

  it("does not mutate expiration, supersede, revoked, nested actor, source, or duplicate arrays", () => {
    const approvalRequest = request(["DEPLOYMENT", "DEPLOYMENT"]);
    const approvalDecision = decision(approvalRequest);
    const input = {
      evidenceReport: report(),
      request: {
        ...approvalRequest,
        expirationPolicy: {
          kind: "EXPLICIT_TIME" as const,
          expiresAt: "2026-07-18T00:00:00.000Z",
        },
        requiredApprover: {
          ...approvalRequest.requiredApprover,
          roleReference: " role:nested ",
        },
      },
      decisions: [approvalDecision, approvalDecision],
      requestedExecutionScopes: ["DEPLOYMENT", "DEPLOYMENT"],
      evaluationTime: "2026-07-17T00:00:00.000Z",
      revokedDecisionReferences: [
        approvalDecision.approvalDecisionId,
        approvalDecision.approvalDecisionId,
      ],
    };
    const before = stableSerializeAgentPackage(input);
    evaluatePackageApprovalGate(input);
    expect(stableSerializeAgentPackage(input)).toBe(before);
  });

  it("evaluates explicit expiration only with explicit evaluationTime", () => {
    const approvalRequest: PackageApprovalRequest = {
      ...request(),
      expirationPolicy: {
        kind: "EXPLICIT_TIME",
        expiresAt: "2026-07-17T00:00:00.000Z",
      },
    };
    const withoutTime = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
    });
    const withTime = evaluatePackageApprovalGate({
      evidenceReport: report(),
      request: approvalRequest,
      decisions: [decision(approvalRequest)],
      requestedExecutionScopes: ["DEPLOYMENT"],
      evaluationTime: "2026-07-18T00:00:00.000Z",
    });

    expect(withoutTime.gateStatus).toBe("INVALID");
    expect(withTime.gateStatus).toBe("BLOCKED");
  });
});
