export const applicationCapabilities = [
  "AUTH",
  "USER_SCOPED_CRUD",
  "SEARCH",
  "STATUS_WORKFLOW",
  "ADMIN_READ",
  "RESPONSIVE_UI",
] as const;

export type ApplicationCapability = (typeof applicationCapabilities)[number];
export type ApplicationBlueprintId = "ai-inquiry-v1" | "general-crud-v1";

function normalizedGoal(input: { title?: string; goal: string }) {
  return `${input.title ?? ""} ${input.goal}`.trim().toLocaleLowerCase();
}

export function applicationGoalSignals(input: {
  title?: string;
  goal: string;
}) {
  const value = normalizedGoal(input);
  return {
    hasCrudSignal:
      /\b(task manager|todo|to-do|crud|project tracker|content manager)\b|할\s*일|업무\s*관리|작업\s*관리|콘텐츠\s*(등록|관리)/i.test(
        value,
      ),
    hasInquirySignal:
      /\b(customer support|inquiry|help desk|support agent)\b|고객센터|고객\s*문의|문의\s*(분류|답변)|상담\s*초안/i.test(
        value,
      ),
  };
}

export function inferApplicationCapabilities(input: {
  title?: string;
  goal: string;
}): ApplicationCapability[] {
  const value = normalizedGoal(input);
  const { hasCrudSignal } = applicationGoalSignals(input);
  const capabilities = new Set<ApplicationCapability>();
  if (
    hasCrudSignal ||
    /\b(auth|signup|sign up|login|account)\b|회원가입|로그인|인증/i.test(value)
  ) {
    capabilities.add("AUTH");
  }
  if (
    hasCrudSignal ||
    /\b(crud|create|update|delete|record)\b|생성|조회|수정|삭제|등록/i.test(
      value,
    )
  ) {
    capabilities.add("USER_SCOPED_CRUD");
  }
  if (hasCrudSignal || /\b(search|filter)\b|검색|필터/i.test(value)) {
    capabilities.add("SEARCH");
  }
  if (
    hasCrudSignal ||
    /\b(status|workflow|complete|progress)\b|상태|완료|진행/i.test(value)
  ) {
    capabilities.add("STATUS_WORKFLOW");
  }
  if (hasCrudSignal || /\b(admin|administrator)\b|관리자/i.test(value)) {
    capabilities.add("ADMIN_READ");
  }
  if (
    hasCrudSignal ||
    /\b(responsive|mobile|web app|webapp)\b|반응형|모바일|웹앱/i.test(value)
  ) {
    capabilities.add("RESPONSIVE_UI");
  }
  return applicationCapabilities.filter((capability) =>
    capabilities.has(capability),
  );
}

export function inferApplicationBlueprintId(input: {
  title?: string;
  goal: string;
}): ApplicationBlueprintId | null {
  const { hasCrudSignal, hasInquirySignal } = applicationGoalSignals(input);
  if (hasCrudSignal === hasInquirySignal) return null;
  return hasCrudSignal ? "general-crud-v1" : "ai-inquiry-v1";
}
