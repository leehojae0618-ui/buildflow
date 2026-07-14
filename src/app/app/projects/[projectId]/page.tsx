import Link from "next/link";
import { getProject } from "@/features/projects/queries";
import { updateProject } from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/components/project-form";
import { ArchiveProjectButton } from "@/features/projects/components/archive-project-button";
export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; const project = await getProject(projectId); return <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100"><section className="mx-auto max-w-2xl"><Link href="/app/projects" className="text-sm text-cyan-300">← 프로젝트 목록</Link><h1 className="mt-8 text-3xl font-semibold">{project.title}</h1><div className="mt-10 border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8"><ProjectForm action={updateProject} project={project} /><div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-6"><p className="text-sm text-zinc-500">추천 설계는 다음 단계에서 시작됩니다.</p><ArchiveProjectButton projectId={project.id} /></div></div></section></main>; }
