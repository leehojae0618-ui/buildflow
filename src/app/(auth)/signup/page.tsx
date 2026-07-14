import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignupForm } from "@/features/auth/components/signup-form";

export default async function SignupPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/app");
  return <main className="flex min-h-screen items-center justify-center bg-[#090909] px-6 py-12 text-zinc-100"><section className="w-full max-w-md border border-zinc-800 bg-zinc-950/80 p-8"><Link href="/" className="text-sm font-medium tracking-[0.28em] text-cyan-300">BuildFlow</Link><h1 className="mt-10 mb-8 text-3xl font-semibold text-zinc-50">회원가입</h1><SignupForm /></section></main>;
}
