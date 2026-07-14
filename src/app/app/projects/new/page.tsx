import Link from "next/link";
import { createProject } from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/components/project-form";
export default function NewProjectPage() { return <main className="min-h-screen bg-[#090909] px-6 py-12 text-zinc-100"><section className="mx-auto max-w-2xl"><Link href="/app/projects" className="text-sm text-cyan-300">← 프로젝트 목록</Link><h1 className="mt-8 text-3xl font-semibold">새 프로젝트</h1><p className="mt-3 text-zinc-500">만들고 싶은 결과와 현재 조건을 알려주세요.</p><div className="mt-10 border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8"><ProjectForm action={createProject} /></div></section></main>; }
