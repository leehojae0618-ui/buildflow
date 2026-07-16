import { createHash } from "node:crypto";
import {
  serviceSlug,
  type GeneratedService,
  type GeneratedServiceFile,
} from "./service-template";

function safeTitle(value: string) {
  return value.trim().slice(0, 120) || "Task Manager";
}

export function generateCrudServiceTemplate(input: {
  projectId: string;
  title: string;
  goal: string;
}): GeneratedService {
  const title = safeTitle(input.title);
  const goal = input.goal.trim().slice(0, 1000);
  const titleLiteral = JSON.stringify(title);
  const goalLiteral = JSON.stringify(goal);
  const files: GeneratedServiceFile[] = [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: serviceSlug(title, input.projectId),
          version: "1.0.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
          },
          dependencies: {
            "@supabase/supabase-js": "^2.110.4",
            next: "16.2.10",
            react: "19.2.4",
            "react-dom": "19.2.4",
          },
          devDependencies: {
            "@types/node": "^20",
            "@types/react": "^19",
            "@types/react-dom": "^19",
            typescript: "^5",
          },
        },
        null,
        2,
      ),
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2017",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: false,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "react-jsx",
            incremental: true,
            plugins: [{ name: "next" }],
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"],
        },
        null,
        2,
      ),
    },
    {
      path: "next.config.ts",
      content:
        "import type { NextConfig } from 'next';\nconst nextConfig: NextConfig = { poweredByHeader: false };\nexport default nextConfig;\n",
    },
    {
      path: ".gitignore",
      content: ".next\nnode_modules\n.env\n.env.local\n.vercel\n",
    },
    {
      path: "lib/supabase.ts",
      content:
        "import { createClient } from '@supabase/supabase-js';\nconst url = process.env.NEXT_PUBLIC_SUPABASE_URL;\nconst key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;\nif (!url || !key) throw new Error('Supabase configuration is required.');\nexport const supabase = createClient(url, key);\n",
    },
    {
      path: "app/layout.tsx",
      content:
        "import type { Metadata } from 'next';\nimport './globals.css';\nexport const metadata: Metadata = { title: " +
        titleLiteral +
        ", description: " +
        goalLiteral +
        " };\nexport default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang=\"ko\"><body>{children}</body></html>; }\n",
    },
    {
      path: "app/globals.css",
      content:
        "*{box-sizing:border-box}body{margin:0;background:#090b10;color:#f6f7fb;font-family:Arial,sans-serif}.shell{max-width:980px;margin:0 auto;padding:48px 20px}.panel{border:1px solid #263141;border-radius:28px;background:#111722;padding:26px;box-shadow:0 24px 80px #0008}.header,.toolbar,.todo,.auth-actions{display:flex;gap:12px;align-items:center}.header{justify-content:space-between;margin-bottom:24px}.grid{display:grid;grid-template-columns:1fr auto;gap:12px}.toolbar{margin:20px 0;flex-wrap:wrap}.todo{justify-content:space-between;border:1px solid #273548;border-radius:18px;padding:16px;margin-top:10px;background:#0b1018}.todo-main{min-width:0}.todo-title{font-weight:700;word-break:break-word}.muted,p{color:#aeb8c7;line-height:1.6}input,select{border:1px solid #34435a;border-radius:14px;background:#0b1018;color:white;padding:12px;font:inherit}input{width:100%}button,.link{border:0;border-radius:14px;background:#67e8f9;color:#06202a;padding:11px 16px;font-weight:700;cursor:pointer;text-decoration:none}.secondary{background:#202b3a;color:#dce5f2}.danger{background:#3a2025;color:#fecaca}.status{min-width:130px}.error{color:#fdba74}.empty{padding:28px;text-align:center;color:#8190a5}@media(max-width:680px){.shell{padding:24px 12px}.panel{border-radius:22px;padding:18px}.header,.todo{align-items:stretch;flex-direction:column}.grid{grid-template-columns:1fr}.auth-actions{flex-wrap:wrap}.status{width:100%}}\n",
    },
    {
      path: "app/page.tsx",
      content: `"use client";
import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type TodoStatus = 'pending' | 'in_progress' | 'completed';
type Todo = { id: string; title: string; description: string | null; status: TodoStatus; created_at: string };
const appTitle = ${titleLiteral};
const appGoal = ${goalLiteral};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | TodoStatus>('all');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTodos = useCallback(async () => {
    if (!session) return;
    let query = supabase.from('buildflow_todos').select('id,title,description,status,created_at').order('created_at', { ascending: false });
    if (search.trim()) query = query.ilike('title', '%' + search.trim() + '%');
    if (filter !== 'all') query = query.eq('status', filter);
    const { data, error } = await query;
    if (error) setMessage(error.message);
    else setTodos((data ?? []) as Todo[]);
  }, [filter, search, session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => { void loadTodos(); }, [loadTodos]);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === 'signup' && !result.data.session) setMessage('가입 확인 메일을 확인한 뒤 로그인해 주세요.');
  }

  async function createTodo(event: FormEvent) {
    event.preventDefault();
    if (!session || !title.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('buildflow_todos').insert({ user_id: session.user.id, title: title.trim(), status: 'pending' });
    setLoading(false);
    if (error) setMessage(error.message);
    else { setTitle(''); await loadTodos(); }
  }

  async function changeStatus(id: string, status: TodoStatus) {
    const { error } = await supabase.from('buildflow_todos').update({ status }).eq('id', id);
    if (error) setMessage(error.message); else await loadTodos();
  }

  async function removeTodo(id: string) {
    const { error } = await supabase.from('buildflow_todos').delete().eq('id', id);
    if (error) setMessage(error.message); else await loadTodos();
  }

  if (!session) return <main className="shell"><section className="panel"><p>BuildFlow가 준비한 업무 관리 서비스</p><h1>{appTitle}</h1><p>{appGoal}</p><form onSubmit={authenticate}><div className="grid"><input aria-label="이메일" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" required/><input aria-label="비밀번호" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상 비밀번호" required/></div><div className="auth-actions"><button disabled={loading}>{loading ? '확인하고 있습니다' : mode === 'login' ? '로그인' : '회원가입'}</button><button type="button" className="secondary" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? '회원가입으로 전환' : '로그인으로 전환'}</button></div></form>{message && <p className="error">{message}</p>}</section></main>;

  return <main className="shell"><section className="panel"><header className="header"><div><p>나의 업무 공간</p><h1>{appTitle}</h1></div><div className="auth-actions"><a className="link secondary" href="/admin">관리자</a><button className="secondary" onClick={() => supabase.auth.signOut()}>로그아웃</button></div></header><form className="grid" onSubmit={createTodo}><input aria-label="새 할 일" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="새 할 일을 입력하세요." maxLength={200}/><button disabled={loading || !title.trim()}>추가</button></form><div className="toolbar"><input aria-label="검색" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="할 일 검색"/><select aria-label="상태 필터" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | TodoStatus)}><option value="all">전체 상태</option><option value="pending">대기</option><option value="in_progress">진행 중</option><option value="completed">완료</option></select><button className="secondary" onClick={() => loadTodos()}>새로고침</button></div>{message && <p className="error">{message}</p>}{todos.length === 0 ? <div className="empty">조건에 맞는 할 일이 없습니다.</div> : todos.map((todo) => <article className="todo" key={todo.id}><div className="todo-main"><div className="todo-title">{todo.title}</div><div className="muted">{new Date(todo.created_at).toLocaleString()}</div></div><select className="status" aria-label="상태 변경" value={todo.status} onChange={(event) => changeStatus(todo.id, event.target.value as TodoStatus)}><option value="pending">대기</option><option value="in_progress">진행 중</option><option value="completed">완료</option></select><button className="danger" onClick={() => removeTodo(todo.id)}>삭제</button></article>)}</section></main>;
}
`,
    },
    {
      path: "app/admin/page.tsx",
      content: `"use client";
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

type Todo = { id: string; user_id: string; title: string; status: string; created_at: string };

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (!data.session) { setAuthorized(false); return; }
      const admin = await supabase.from('buildflow_admins').select('user_id').eq('user_id', data.session.user.id).maybeSingle();
      if (admin.error || !admin.data) { setAuthorized(false); return; }
      setAuthorized(true);
      const result = await supabase.from('buildflow_todos').select('id,user_id,title,status,created_at').order('created_at', { ascending: false });
      if (result.error) setMessage(result.error.message); else setTodos((result.data ?? []) as Todo[]);
    });
  }, []);

  return <main className="shell"><section className="panel"><header className="header"><div><p>관리자 전용 읽기 화면</p><h1>전체 할 일</h1></div><a className="link secondary" href="/">내 업무로 돌아가기</a></header>{authorized === null ? <p>권한을 확인하고 있습니다.</p> : !session ? <p>먼저 로그인해 주세요.</p> : !authorized ? <p className="error">관리자 권한이 확인되지 않았습니다.</p> : todos.length === 0 ? <div className="empty">등록된 할 일이 없습니다.</div> : todos.map((todo) => <article className="todo" key={todo.id}><div className="todo-main"><div className="todo-title">{todo.title}</div><div className="muted">사용자 {todo.user_id} · {todo.status}</div></div></article>)}{message && <p className="error">{message}</p>}</section></main>;
}
`,
    },
    {
      path: "app/api/health/route.ts",
      content:
        "import { NextResponse } from 'next/server';\nexport function GET(){const configured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);return NextResponse.json({status:configured?'ready':'configuration_required',blueprint:'general-crud-v1'},{status:configured?200:503});}\n",
    },
    {
      path: "README.md",
      content: `# ${title}\n\n${goal}\n\nBuildFlow General CRUD Web App Blueprint v1.\n\nCapabilities: Auth, user-scoped CRUD, search, status workflow, administrator read-only access, responsive UI.\n\nSecret values are configured only in the hosting environment.\n`,
    },
  ];

  const sql = `
create table if not exists public.buildflow_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.buildflow_todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists buildflow_todos_user_created_idx
  on public.buildflow_todos(user_id, created_at desc);
create index if not exists buildflow_todos_user_status_idx
  on public.buildflow_todos(user_id, status);

create or replace function public.set_buildflow_todo_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists buildflow_todos_updated_at on public.buildflow_todos;
create trigger buildflow_todos_updated_at
before update on public.buildflow_todos
for each row execute function public.set_buildflow_todo_updated_at();

alter table public.buildflow_admins enable row level security;
alter table public.buildflow_todos enable row level security;

grant select on table public.buildflow_admins to authenticated;
grant select, insert, update, delete on table public.buildflow_todos to authenticated;

drop policy if exists "Users can inspect their administrator membership"
  on public.buildflow_admins;
create policy "Users can inspect their administrator membership"
  on public.buildflow_admins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users and administrators can read todos"
  on public.buildflow_todos;
create policy "Users and administrators can read todos"
  on public.buildflow_todos
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1
      from public.buildflow_admins administrator
      where administrator.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can create their own todos"
  on public.buildflow_todos;
create policy "Users can create their own todos"
  on public.buildflow_todos
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own todos"
  on public.buildflow_todos;
create policy "Users can update their own todos"
  on public.buildflow_todos
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own todos"
  on public.buildflow_todos;
create policy "Users can delete their own todos"
  on public.buildflow_todos
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
`.trim();

  const checksum = createHash("sha256")
    .update("general-crud-v1")
    .update(JSON.stringify(files))
    .update(sql)
    .digest("hex");

  return {
    files,
    sql,
    outcomes: [
      "회원가입과 로그인",
      "사용자별 할 일 생성·조회·수정·삭제",
      "검색과 상태 필터",
      "관리자 전체 조회",
      "모바일과 데스크톱 반응형 화면",
      "배포 상태 Health Check",
    ],
    checksum,
  };
}
