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

## Authentication Setup

Supabase Dashboard의 `Authentication → URL Configuration`에서 다음을 설정합니다.

```text
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/auth/callback
```

Email Provider가 활성화되어 있어야 합니다. Google OAuth는 아직 설정하지 않습니다. 로컬 실행 후 `/signup`, `/login`, `/app`에서 이메일 인증 흐름을 수동 확인합니다. Service Role Key는 Auth UI에서 사용하지 않습니다.

`Service Role Key`는 브라우저에 노출하지 않으며, 일반 사용자 요청 처리에 기본 사용하지 않습니다. Key 원문을 로그나 채팅에 출력하지 말고, `.env.local`은 Git에 포함하지 않습니다.
