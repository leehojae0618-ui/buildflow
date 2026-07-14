import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; message?: string; error?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/app");
  const params = await searchParams;
  return <AuthCard title="로그인"><>{params.message === "email-confirmation" && <p className="mb-5 border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200">이메일을 확인한 뒤 로그인해주세요.</p>}{params.error === "oauth" && <p role="alert" className="mb-5 border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">Google 로그인 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.</p>}{params.error === "auth-callback" && <p role="alert" className="mb-5 border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">인증을 완료하지 못했습니다. 다시 시도해주세요.</p>}<LoginForm next={params.next} /><Link href="/" className="mt-6 block text-center text-xs text-zinc-600 hover:text-zinc-400">BuildFlow 홈</Link></></AuthCard>;
}

function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#090909] px-6 py-12 text-zinc-100"><section className="w-full max-w-md border border-zinc-800 bg-zinc-950/80 p-8"><Link href="/" className="text-sm font-medium tracking-[0.28em] text-cyan-300">BuildFlow</Link><h1 className="mt-10 mb-8 text-3xl font-semibold text-zinc-50">{title}</h1>{children}</section></main>;
}
