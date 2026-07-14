# BuildFlow

AI Result Design Platform

현재는 Foundation 단계입니다.

## Supabase Setup

1. Supabase 프로젝트를 생성합니다.
2. `.env.example`을 `.env.local`로 복사합니다.
3. Supabase URL과 Publishable Key를 입력합니다.
4. `npm run dev`를 실행합니다.
5. `/api/health`에서 연결 상태를 확인합니다.

`Service Role Key`는 브라우저에 노출하지 않으며, 일반 사용자 요청 처리에 기본 사용하지 않습니다. Key 원문을 로그나 채팅에 출력하지 말고, `.env.local`은 Git에 포함하지 않습니다.
