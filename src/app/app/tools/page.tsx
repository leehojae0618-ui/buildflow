import Link from "next/link";
import { getDiscoveryTools } from "@/features/discovery/queries";
import { ToolBrowser } from "@/features/discovery/components/discovery-browser";
export default async function ToolsPage() { const tools = await getDiscoveryTools(); return <main className="min-h-screen bg-[#090909] px-6 py-10 text-zinc-100"><section className="mx-auto max-w-6xl"><Link href="/app" className="text-sm text-cyan-300">← Dashboard</Link><h1 className="mt-10 text-3xl font-semibold">Tool Explorer</h1><p className="mt-3 text-zinc-400">Workflow에 필요한 Tool을 탐색해보세요.</p><div className="mt-8"><ToolBrowser items={tools} /></div></section></main>; }
