import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logout } from "@/features/auth/actions";
import { LogoutButton } from "@/features/auth/components/logout-button";
import Link from "next/link";
import { getRecentProjects } from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";

export default async function AppPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");
  const projects = await getRecentProjects();
  return <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100"><section className="mx-auto max-w-4xl"><div className="flex items-center justify-between"><p className="text-sm font-medium tracking-[0.28em] text-cyan-300">BuildFlow</p><LogoutButton action={logout} /></div><div className="mt-14 flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm text-zinc-500">무엇을 만들고 싶나요?</p><h1 className="mt-3 text-3xl font-semibold text-zinc-50">프로젝트를 시작해보세요.</h1></div><Link href="/app/projects/new" className="border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">새 프로젝트 만들기</Link></div>{projects.length === 0 ? <div className="mt-10 border border-zinc-800 bg-zinc-950/70 p-8"><p className="text-zinc-300">아직 프로젝트가 없습니다.</p><p className="mt-2 text-sm text-zinc-500">고객 문의 자동 분류처럼 만들고 싶은 결과를 입력해보세요.</p><Link href="/app/projects/new" className="mt-6 inline-block text-sm text-cyan-300">첫 프로젝트 만들기 →</Link></div> : <div className="mt-10 grid gap-4 md:grid-cols-3">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>}<Link href="/app/projects" className="mt-8 inline-block text-sm text-zinc-500 hover:text-cyan-300">모든 프로젝트 보기 →</Link></section></main>;
}
