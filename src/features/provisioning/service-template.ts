import { createHash } from "node:crypto";

export type GeneratedServiceFile = { path: string; content: string };
export type GeneratedService = {
  files: GeneratedServiceFile[];
  sql: string;
  outcomes: string[];
  checksum: string;
};

function safeTitle(value: string) {
  return value.trim().slice(0, 120) || "AI Service";
}

export function serviceSlug(title: string, projectId: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "ai-service";
  return `${base}-${projectId.replace(/-/g, "").slice(0, 8)}`;
}

export function generateServiceTemplate(input: {
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
            openai: "^6.47.0",
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
        "*{box-sizing:border-box}body{margin:0;background:#090b10;color:#f6f7fb;font-family:Arial,sans-serif}.shell{max-width:760px;margin:0 auto;padding:64px 24px}.panel{border:1px solid #263141;border-radius:28px;background:#111722;padding:28px;box-shadow:0 24px 80px #0008}h1{font-size:36px;margin:0 0 12px}p{color:#aeb8c7;line-height:1.65}textarea{width:100%;min-height:160px;border:1px solid #34435a;border-radius:18px;background:#0b1018;color:white;padding:16px;font:inherit}button{margin-top:12px;border:0;border-radius:14px;background:#67e8f9;color:#06202a;padding:12px 18px;font-weight:700;cursor:pointer}.result{margin-top:20px;border:1px solid #284454;border-radius:18px;background:#0b141b;padding:18px;white-space:pre-wrap}.error{color:#fdba74}\n",
    },
    {
      path: "app/page.tsx",
      content:
        "\"use client\";\nimport { useState } from 'react';\nconst title = " +
        titleLiteral +
        ";\nconst goal = " +
        goalLiteral +
        ";\nexport default function Home(){const [message,setMessage]=useState('');const [result,setResult]=useState('');const [loading,setLoading]=useState(false);async function submit(){setLoading(true);setResult('');try{const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});const data=await response.json();if(!response.ok)throw new Error(data.error||'요청을 처리하지 못했습니다.');setResult(data.draft);}catch(error){setResult(error instanceof Error?error.message:'요청을 처리하지 못했습니다.');}finally{setLoading(false);}}return <main className=\"shell\"><section className=\"panel\"><p>BuildFlow가 준비한 AI 서비스</p><h1>{title}</h1><p>{goal}</p><textarea value={message} onChange={(event)=>setMessage(event.target.value)} placeholder=\"처리할 내용을 입력하세요.\" maxLength={4000}/><button onClick={submit} disabled={loading||!message.trim()}>{loading?'AI가 확인하고 있습니다':'AI에게 요청하기'}</button>{result&&<div className=\"result\">{result}</div>}</section></main>}\n",
    },
    {
      path: "app/api/inquiries/route.ts",
      content:
        "import { NextResponse } from 'next/server';\nimport OpenAI from 'openai';\nimport { createClient } from '@supabase/supabase-js';\nconst goal = " +
        goalLiteral +
        ";\nexport async function POST(request: Request){try{const body=await request.json();const message=typeof body.message==='string'?body.message.trim():'';if(!message||message.length>4000)return NextResponse.json({error:'입력 내용을 확인해 주세요.'},{status:400});const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});const response=await openai.responses.create({model:process.env.OPENAI_MODEL||'gpt-5-mini',input:[{role:'system',content:`당신은 다음 목표를 수행하는 차분하고 정확한 AI입니다: ${goal}. 사용자가 바로 활용할 수 있는 결과를 한국어로 작성하세요.`},{role:'user',content:message}]});const draft=response.output_text||'답변을 생성하지 못했습니다.';const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SECRET_KEY;if(url&&key){const supabase=createClient(url,key,{auth:{persistSession:false}});await supabase.from('buildflow_inquiries').insert({message,draft});}return NextResponse.json({draft});}catch{return NextResponse.json({error:'AI가 요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.'},{status:500});}}\n",
    },
    {
      path: "app/api/health/route.ts",
      content:
        "import { NextResponse } from 'next/server';\nexport function GET(){const configured=Boolean(process.env.OPENAI_API_KEY&&process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SECRET_KEY);return NextResponse.json({status:configured?'ready':'configuration_required'},{status:configured?200:503});}\n",
    },
    {
      path: "README.md",
      content: `# ${title}\n\n${goal}\n\nGenerated by BuildFlow. Secret values are configured only in the hosting environment.\n`,
    },
  ];

  const sql = `
create table if not exists public.buildflow_inquiries (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 1 and 4000),
  draft text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.buildflow_inquiries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'buildflow_inquiries'
      and policyname = 'No direct client access'
  ) then
    create policy "No direct client access"
    on public.buildflow_inquiries
    for all
    using (false)
    with check (false);
  end if;
end
$$;
`.trim();

  const checksum = createHash("sha256")
    .update(JSON.stringify(files))
    .update(sql)
    .digest("hex");

  return {
    files,
    sql,
    outcomes: [
      "사용자 입력을 받는 웹 화면",
      "목표에 맞는 AI 응답 생성",
      "문의와 AI 초안의 안전한 서버 저장",
      "배포 상태 Health Check",
    ],
    checksum,
  };
}
