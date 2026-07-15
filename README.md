# BuildFlow

AI Result Design Platform

현재는 Foundation 단계입니다.

## Supabase Setup

1. Supabase 프로젝트를 생성합니다.
2. `.env.example`을 `.env.local`로 복사합니다.
3. Supabase URL과 Publishable Key를 입력합니다.
4. `npm run dev`를 실행합니다.
5. `/api/health`에서 연결 상태를 확인합니다.

Database 작업:

```bash
npx supabase migration list
npx supabase db push
npm run db:types
```

Database 구조는 [`docs/07-database.md`](docs/07-database.md)를 참고합니다.

OpenAI API Key와 Model은 server-only 환경변수입니다. ChatGPT Plus 구독과 OpenAI API 과금은 별도일 수 있으므로 API Dashboard에서 결제수단과 사용 한도를 확인합니다. Key 원문은 로그나 채팅에 출력하지 않습니다.

Reference Seed 데이터는 [`docs/08-seed-data.md`](docs/08-seed-data.md)에서 확인할 수 있습니다.
Recommendation Engine 설계는 [`docs/09-recommendation-engine.md`](docs/09-recommendation-engine.md)에서 확인할 수 있습니다.

```bash
npm run db:seed
```

## Authentication Setup

Supabase Dashboard의 `Authentication → URL Configuration`에서 다음을 설정합니다.

```text
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/auth/callback
```

Email Provider와 Google Provider가 활성화되어 있어야 합니다. Google OAuth Client의 Callback URL은 Supabase Dashboard가 제공하는 Provider 설정값을 사용하고, Supabase `Authentication → URL Configuration`에는 위 Callback URL을 등록합니다. 로컬 실행 후 `/signup`, `/login`, `/app`에서 Email 및 Google 인증 흐름을 수동 확인합니다. 신규 Auth 사용자는 `handle_new_user()` Trigger를 통해 `profiles`가 자동 생성됩니다. 이 Trigger는 기존 사용자에게 소급 적용되지 않습니다. Service Role Key는 Auth UI에서 사용하지 않습니다.

## Project CRUD

로그인 후 `/app`에서 최근 프로젝트를 확인하고, `/app/projects/new`에서 목표와 조건을 입력해 새 프로젝트를 만들 수 있습니다. `/app/projects`는 보관되지 않은 자신의 프로젝트만 표시하며, 상세 화면에서 기본 수정과 Archive를 지원합니다. Recommendation 생성은 다음 단계에서 추가합니다.

수동 QA: 프로젝트 생성 validation → 상세 이동 → 수정 후 새로고침 → Archive 후 목록에서 숨김 → 다른 사용자 Project ID 접근 시 Not Found 처리를 확인합니다.

`Service Role Key`는 브라우저에 노출하지 않으며, 일반 사용자 요청 처리에 기본 사용하지 않습니다. Key 원문을 로그나 채팅에 출력하지 말고, `.env.local`은 Git에 포함하지 않습니다.
