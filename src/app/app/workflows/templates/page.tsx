import Link from "next/link";
import { getDiscoveryWorkflows } from "@/features/discovery/queries";
import { WorkflowBrowser } from "@/features/discovery/components/discovery-browser";
export default async function WorkflowLibraryPage() { const workflows = await getDiscoveryWorkflows(); return <main className="min-h-screen bg-[#090909] px-6 py-10 text-zinc-100"><section className="mx-auto max-w-6xl"><Link href="/app" className="text-sm text-cyan-300">← Dashboard</Link><h1 className="mt-10 text-3xl font-semibold">Workflow Library</h1><p className="mt-3 text-zinc-400">검증된 Workflow Template을 목표와 조건에 맞게 탐색해보세요.</p><div className="mt-8"><WorkflowBrowser items={workflows} /></div></section></main>; }
