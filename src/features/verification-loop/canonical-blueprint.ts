import type { CanonicalBlueprint, CanonicalBlueprintStep } from "./types";

const goal = "문의가 들어오면 AI가 내용을 분류하고 요약한다. 사람이 승인한 뒤에만 Slack으로 전달한다.";

export function createInitialInquiryBlueprint(): CanonicalBlueprint {
  return {
    id: "blueprint.inquiry-slack.approval.v1",
    version: "lv5-internal-v1",
    goal,
    trigger: "INCOMING_INQUIRY",
    steps: [
      { id: "receive-inquiry", type: "TRIGGER", label: "문의 수신", dependsOn: [], requiresApproval: false, outputReference: "inquiry" },
      { id: "classify-inquiry", type: "CLASSIFY", label: "문의 분류", dependsOn: ["receive-inquiry"], requiresApproval: false, outputReference: "classification" },
      { id: "summarize-inquiry", type: "SUMMARIZE", label: "문의 요약", dependsOn: ["classify-inquiry"], requiresApproval: false, outputReference: "summary" },
      // This intentionally unsafe fixture is the before-state for the internal verification loop.
      { id: "deliver-slack", type: "DELIVERY", label: "Slack 전달", dependsOn: ["summarize-inquiry"], requiresApproval: false, outputReference: "delivery-reference" },
    ],
    approvalPolicy: "APPROVAL_REQUIRED_BEFORE_DELIVERY",
    forbiddenBehaviors: ["SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL"],
    expectedOutputs: ["classification", "summary", "delivery-reference"],
  };
}

export function withApprovalGate(blueprint: CanonicalBlueprint): CanonicalBlueprint {
  const delivery = blueprint.steps.find((step) => step.id === "deliver-slack");
  if (!delivery) throw new Error("DELIVERY_STEP_MISSING");
  if (blueprint.steps.some((step) => step.id === "approval-gate")) throw new Error("APPROVAL_GATE_ALREADY_EXISTS");

  const approvalGate: CanonicalBlueprintStep = {
    id: "approval-gate",
    type: "APPROVAL_GATE",
    label: "Slack 전달 승인 확인",
    dependsOn: [...delivery.dependsOn],
    requiresApproval: false,
    outputReference: "approval-status",
  };
  const correctedDelivery: CanonicalBlueprintStep = {
    ...delivery,
    dependsOn: [approvalGate.id],
    requiresApproval: true,
  };
  return {
    ...blueprint,
    version: "lv5-internal-v1",
    steps: blueprint.steps.flatMap((step) =>
      step.id === delivery.id ? [approvalGate, correctedDelivery] : [step],
    ),
  };
}

export function hasEnforcedApprovalGate(blueprint: CanonicalBlueprint): boolean {
  const delivery = blueprint.steps.find((step) => step.id === "deliver-slack");
  const approvalGate = blueprint.steps.find((step) => step.id === "approval-gate");
  return Boolean(delivery?.requiresApproval && approvalGate && delivery.dependsOn.includes(approvalGate.id));
}
