import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logout } from "@/features/auth/actions";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default async function AppPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");
  return <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100"><section className="mx-auto max-w-3xl border border-zinc-800 bg-zinc-950/80 p-8"><p className="text-sm font-medium tracking-[0.28em] text-cyan-300">BuildFlow</p><h1 className="mt-10 text-3xl font-semibold text-zinc-50">Foundation Dashboard</h1><p className="mt-4 text-zinc-400">로그인 완료</p><p className="mt-2 text-zinc-500">프로젝트 기능은 다음 단계에서 추가됩니다.</p><p className="mt-6 text-sm text-zinc-500">{user.email ? `${user.email.slice(0, 2)}•••` : "사용자"}</p><div className="mt-8"><LogoutButton action={logout} /></div></section></main>;
}
