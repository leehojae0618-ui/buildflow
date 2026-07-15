export type PromptAsset = { title: string; content: string; variables: string[] };
const assets: Record<string, PromptAsset> = {
  "blog-draft-generation:2": { title: "블로그 개요 작성 Prompt", content: "다음 주제로 블로그 글의 개요를 작성하세요.\n\n주제: {{topic}}\n핵심 정보: {{key_information}}\n대상 독자: {{target_reader}}\n\n출력: 제목 후보 3개, 섹션 구조, 각 섹션의 핵심 내용을 제안하세요.", variables: ["topic", "key_information", "target_reader"] },
  "product-description-generation:3": { title: "상품 설명 작성 Prompt", content: "다음 상품 정보를 바탕으로 구매자가 이해하기 쉬운 상품 설명을 작성하세요.\n\n상품명: {{product_name}}\n핵심 특징: {{features}}\n타깃 고객: {{target_customer}}\n톤: {{tone}}\n\n출력: 한 줄 핵심 문구, 주요 장점 3개, 상세 설명, 구매 전 확인사항.", variables: ["product_name", "features", "target_customer", "tone"] },
  "email-reply-draft:3": { title: "이메일 답변 초안 Prompt", content: "다음 이메일의 의도와 맥락을 파악해 정중한 답변 초안을 작성하세요.\n\n이메일 내용: {{email_content}}\n원하는 답변 방향: {{reply_goal}}\n톤: {{tone}}\n\n사실을 추측하지 말고, 확인이 필요한 내용은 별도로 표시하세요.", variables: ["email_content", "reply_goal", "tone"] },
  "meeting-notes-summary:2": { title: "회의 메모 요약 Prompt", content: "다음 회의 메모를 요약하세요.\n\n회의 메모: {{meeting_notes}}\n\n출력: 핵심 요약, 결정사항, 담당자별 Action Item, 추가 확인사항.", variables: ["meeting_notes"] },
  "customer-review-analysis:2": { title: "고객 리뷰 분석 Prompt", content: "다음 고객 리뷰를 긍정, 부정, 개선 요청으로 분류하고 반복되는 의견을 요약하세요.\n\n리뷰 데이터: {{reviews}}\n\n근거가 없는 결론은 만들지 말고 대표적인 문장을 함께 제시하세요.", variables: ["reviews"] },
};
export function getPromptAsset(templateSlug: string, stepOrder: number) { return assets[`${templateSlug}:${stepOrder}`] ?? null; }
export function extractPromptVariables(content: string) { return [...new Set([...content.matchAll(/\{\{([a-z0-9_]+)\}\}/gi)].map((match) => match[1]))]; }
