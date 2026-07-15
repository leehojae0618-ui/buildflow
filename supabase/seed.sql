-- BuildFlow reference data. Re-runnable: slugs and (template, step_order) are stable keys.
insert into public.tools (slug, name, category, description, pricing_model, has_api, has_oauth, difficulty, execution_support, last_verified, is_active)
values
('openai', 'OpenAI', 'ai', '텍스트 생성과 분석을 위한 AI 모델 제공자입니다.', 'usage_based', true, false, 'beginner', 'guide_only', '2026-07-15', true),
('anthropic-claude', 'Anthropic Claude', 'ai', '긴 문서와 텍스트 작업에 사용할 수 있는 AI 모델 제공자입니다.', 'usage_based', true, false, 'beginner', 'guide_only', '2026-07-15', true),
('google-gemini', 'Google Gemini', 'ai', 'Google의 멀티모달 AI 모델 제공자입니다.', 'usage_based', true, true, 'beginner', 'guide_only', '2026-07-15', true),
('n8n', 'n8n', 'automation', '서비스를 연결하고 반복 작업을 자동화하는 Workflow 도구입니다.', 'self_hosted_or_cloud', true, true, 'intermediate', 'template_available', '2026-07-15', true),
('supabase', 'Supabase', 'data', '인증과 PostgreSQL 데이터 저장을 제공하는 플랫폼입니다.', 'free_and_paid', true, true, 'intermediate', 'guide_only', '2026-07-15', true),
('gmail', 'Gmail', 'communication', '이메일을 확인하고 답변을 작성하는 도구입니다.', 'free_and_paid', true, true, 'beginner', 'guide_only', '2026-07-15', true),
('google-sheets', 'Google Sheets', 'data', '표 형태의 데이터를 정리하고 공유하는 도구입니다.', 'free_and_paid', true, true, 'beginner', 'template_available', '2026-07-15', true),
('google-drive', 'Google Drive', 'productivity', '문서와 파일을 저장하고 공유하는 도구입니다.', 'free_and_paid', true, true, 'beginner', 'guide_only', '2026-07-15', true),
('slack', 'Slack', 'communication', '팀 채널과 알림을 관리하는 협업 도구입니다.', 'free_and_paid', true, true, 'beginner', 'template_available', '2026-07-15', true),
('youtube', 'YouTube', 'content', '영상 콘텐츠를 게시하고 관리하는 플랫폼입니다.', 'free', true, true, 'beginner', 'guide_only', '2026-07-15', true),
('generic-webhook', 'Generic Webhook', 'automation', '서비스 사이에 이벤트를 전달하는 범용 HTTP 연결입니다.', 'free', true, false, 'intermediate', 'guide_only', '2026-07-15', true),
('pdf-input', 'PDF Input', 'productivity', 'PDF 파일을 Workflow 입력으로 준비하는 단계입니다.', 'manual', false, false, 'beginner', 'guide_only', '2026-07-15', true),
('manual-review', 'Manual Review', 'productivity', '사람이 결과를 확인하고 수정하는 검토 단계입니다.', 'manual', false, false, 'beginner', 'guide_only', '2026-07-15', true)
on conflict (slug) do nothing;

insert into public.workflow_templates (slug, name, description, category, goal_summary, required_tools, alternatives, cost_model, difficulty, estimated_setup_minutes, execution_support_level, is_active)
values
('blog-draft-generation', '블로그 초안 생성', '주제와 핵심 정보를 바탕으로 블로그 초안을 만듭니다.', 'content', '블로그 글의 구조와 본문 초안을 빠르게 준비합니다.', '["openai"]', '["anthropic-claude", "google-gemini"]', '{"note":"사용량과 선택한 모델에 따라 달라짐"}', 'beginner', 20, 'guide_only', true),
('youtube-shorts-script', '유튜브 쇼츠 대본 생성', '주제와 길이를 바탕으로 짧은 영상 대본을 만듭니다.', 'content', '짧은 영상의 Hook, 본문, CTA 초안을 만듭니다.', '["openai"]', '["anthropic-claude", "google-gemini"]', '{"note":"사용량 기반"}', 'beginner', 20, 'guide_only', true),
('social-post-generation', 'SNS 게시물 생성', '브랜드와 캠페인 정보를 기반으로 SNS 게시물 초안을 만듭니다.', 'marketing', '채널별 게시물 문구와 해시태그 후보를 준비합니다.', '["openai"]', '["anthropic-claude", "google-gemini"]', '{"note":"자동 게시하지 않음"}', 'beginner', 20, 'guide_only', true),
('meeting-notes-summary', '회의 메모 요약', '회의 메모를 핵심 결정사항과 할 일로 정리합니다.', 'productivity', '긴 회의 메모에서 요약, 결정사항, Action Item을 추출합니다.', '["openai"]', '["anthropic-claude", "google-gemini"]', '{"note":"사용량 기반"}', 'beginner', 15, 'guide_only', true),
('pdf-summary-organization', 'PDF 요약 및 정리', 'PDF 내용을 요약하고 핵심 항목으로 구조화합니다.', 'productivity', 'PDF의 주요 내용과 핵심 항목을 검토 가능한 형태로 정리합니다.', '["pdf-input", "openai"]', '["anthropic-claude"]', '{"note":"민감정보 업로드 주의"}', 'intermediate', 30, 'guide_only', true),
('recurring-report-draft', '반복 보고서 초안 생성', '정리된 데이터를 바탕으로 반복 보고서 초안을 작성합니다.', 'data', '스프레드시트 지표를 읽고 보고서 초안을 준비합니다.', '["google-sheets", "openai"]', '[]', '{"note":"템플릿 기반 연결 후보"}', 'intermediate', 45, 'template_available', true),
('email-reply-draft', '이메일 답변 초안 생성', '수신 이메일의 의도에 맞는 답변 초안을 작성합니다.', 'email', '문의 의도를 파악하고 Gmail에서 검토할 답변을 준비합니다.', '["gmail", "openai"]', '["anthropic-claude", "google-gemini"]', '{"note":"자동 발송하지 않음"}', 'intermediate', 30, 'guide_only', true),
('important-email-slack-alert', '중요 이메일 Slack 알림', '중요 이메일을 감지해 Slack으로 알립니다.', 'communication', 'Gmail 이벤트를 조건에 따라 Slack 알림으로 전달합니다.', '["gmail", "n8n", "slack"]', '["openai"]', '{"note":"연결 서비스 요금은 별도"}', 'advanced', 60, 'template_available', true),
('product-description-generation', '상품 설명 생성', '상품 정보와 타깃 고객을 바탕으로 상품 설명 초안을 만듭니다.', 'ecommerce', '상품의 특징과 고객 맥락을 반영한 설명을 준비합니다.', '["openai"]', '["anthropic-claude", "google-gemini"]', '{"note":"사용량 기반"}', 'beginner', 20, 'guide_only', true),
('customer-review-analysis', '고객 리뷰 분석', '고객 리뷰를 긍정·부정·요청사항으로 분석합니다.', 'data', '리뷰를 분류하고 반복 의견과 개선사항을 요약합니다.', '["google-sheets", "openai"]', '["manual-review"]', '{"note":"데이터 정리 품질에 따라 결과가 달라짐"}', 'intermediate', 40, 'guide_only', true)
on conflict (slug) do nothing;

insert into public.workflow_template_steps (workflow_template_id, step_order, title, description, tool_id, is_required)
select t.id, s.step_order, s.title, s.description, tool.id, true
from (values
 ('blog-draft-generation', 1, '주제와 핵심 정보 입력', '작성 목적과 참고 정보를 준비합니다.', 'manual-review'), ('blog-draft-generation', 2, '개요 생성', '글의 구조와 핵심 흐름을 만듭니다.', 'openai'), ('blog-draft-generation', 3, '본문 초안 생성', '개요를 바탕으로 초안을 작성합니다.', 'openai'), ('blog-draft-generation', 4, '사용자 검토 및 수정', '사실관계와 브랜드 톤을 확인합니다.', 'manual-review'),
 ('youtube-shorts-script', 1, '주제와 대상 입력', '영상의 주제와 시청자를 정합니다.', 'manual-review'), ('youtube-shorts-script', 2, 'Hook 생성', '짧은 영상 첫 부분의 관심 유도 문구를 만듭니다.', 'openai'), ('youtube-shorts-script', 3, '본문 대본 생성', '영상 길이에 맞는 대본을 작성합니다.', 'openai'), ('youtube-shorts-script', 4, 'CTA와 최종 검토', '행동 유도 문구와 사실관계를 확인합니다.', 'manual-review'),
 ('social-post-generation', 1, '채널과 목적 입력', '게시 채널과 캠페인 목적을 정합니다.', 'manual-review'), ('social-post-generation', 2, '게시 문구 생성', '채널 형식에 맞는 문구를 만듭니다.', 'openai'), ('social-post-generation', 3, '해시태그 후보 생성', '관련 해시태그 후보를 정리합니다.', 'openai'), ('social-post-generation', 4, '검토 후 게시 준비', '게시 전 문구와 링크를 확인합니다.', 'manual-review'),
 ('meeting-notes-summary', 1, '회의 메모 입력', '회의 메모를 준비합니다.', 'manual-review'), ('meeting-notes-summary', 2, '핵심 내용 요약', '논의의 핵심을 짧게 정리합니다.', 'openai'), ('meeting-notes-summary', 3, '결정사항 추출', '합의된 결정사항을 분리합니다.', 'openai'), ('meeting-notes-summary', 4, 'Action Item 정리', '담당자와 다음 행동을 검토합니다.', 'manual-review'),
 ('pdf-summary-organization', 1, 'PDF 준비', '요약할 PDF를 준비하고 민감정보를 확인합니다.', 'pdf-input'), ('pdf-summary-organization', 2, '텍스트 추출', 'PDF에서 검토할 내용을 준비합니다.', 'pdf-input'), ('pdf-summary-organization', 3, '내용 요약', '문서의 주요 내용을 요약합니다.', 'openai'), ('pdf-summary-organization', 4, '핵심 항목 정리', '핵심 항목을 구조화합니다.', 'openai'), ('pdf-summary-organization', 5, '사용자 검토', '요약 정확성과 공개 가능 여부를 확인합니다.', 'manual-review'),
 ('recurring-report-draft', 1, '데이터 준비', '보고서에 사용할 표 데이터를 정리합니다.', 'google-sheets'), ('recurring-report-draft', 2, '핵심 지표 정리', '기간별 주요 변화를 확인합니다.', 'google-sheets'), ('recurring-report-draft', 3, '보고서 초안 생성', '지표를 설명하는 보고서 초안을 만듭니다.', 'openai'), ('recurring-report-draft', 4, '사용자 검토', '수치와 해석을 확인합니다.', 'manual-review'),
 ('email-reply-draft', 1, '이메일 내용 입력', '답변이 필요한 이메일을 준비합니다.', 'gmail'), ('email-reply-draft', 2, '문의 의도 분류', '요청과 우선순위를 파악합니다.', 'openai'), ('email-reply-draft', 3, '답변 초안 생성', '상황에 맞는 답변 초안을 만듭니다.', 'openai'), ('email-reply-draft', 4, '사용자 검토', '사실관계와 톤을 확인합니다.', 'manual-review'), ('email-reply-draft', 5, 'Gmail에서 발송', '검토된 답변을 사용자가 직접 발송합니다.', 'gmail'),
 ('important-email-slack-alert', 1, 'Gmail 연결', '알림 대상 Gmail 계정을 연결합니다.', 'gmail'), ('important-email-slack-alert', 2, '중요도 조건 설정', '알림을 보낼 조건을 정합니다.', 'n8n'), ('important-email-slack-alert', 3, 'n8n Trigger', '조건에 맞는 이메일 이벤트를 받습니다.', 'n8n'), ('important-email-slack-alert', 4, '이메일 내용 정리', '알림에 필요한 정보를 정리합니다.', 'n8n'), ('important-email-slack-alert', 5, 'Slack 알림 전송', '정리된 내용을 Slack 채널에 보냅니다.', 'slack'),
 ('product-description-generation', 1, '상품 정보 입력', '상품 특징과 타깃 고객을 준비합니다.', 'manual-review'), ('product-description-generation', 2, '핵심 특징 정리', '구매 판단에 중요한 정보를 추립니다.', 'openai'), ('product-description-generation', 3, '상품 설명 생성', '고객 관점의 설명 초안을 작성합니다.', 'openai'), ('product-description-generation', 4, '사용자 검토', '표현과 사실관계를 확인합니다.', 'manual-review'),
 ('customer-review-analysis', 1, '리뷰 데이터 준비', '리뷰를 표 형태로 정리합니다.', 'google-sheets'), ('customer-review-analysis', 2, '리뷰 분류', '긍정·부정·요청사항으로 분류합니다.', 'openai'), ('customer-review-analysis', 3, '반복 의견 추출', '반복되는 주제와 패턴을 찾습니다.', 'openai'), ('customer-review-analysis', 4, '개선사항 요약', '제품 개선에 참고할 내용을 정리합니다.', 'openai'), ('customer-review-analysis', 5, '결과 검토', '분류와 요약의 정확성을 확인합니다.', 'manual-review')
) as s(template_slug, step_order, title, description, tool_slug)
join public.workflow_templates t on t.slug = s.template_slug
join public.tools tool on tool.slug = s.tool_slug
on conflict (workflow_template_id, step_order) do update set title = excluded.title, description = excluded.description, tool_id = excluded.tool_id, is_required = excluded.is_required;
