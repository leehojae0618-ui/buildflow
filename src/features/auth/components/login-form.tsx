"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/features/auth/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, {});
  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next ?? "/app"} />
      {state.error && <p role="alert" className="border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{state.error}</p>}
      <label className="block space-y-2 text-sm text-zinc-300">이메일<input name="email" type="email" autoComplete="email" required className="w-full border border-zinc-700 bg-zinc-900 px-3 py-3 text-zinc-100 outline-none focus:border-cyan-400" />{state.fieldErrors?.email && <span className="text-xs text-red-300">{state.fieldErrors.email}</span>}</label>
      <label className="block space-y-2 text-sm text-zinc-300">비밀번호<input name="password" type="password" autoComplete="current-password" required className="w-full border border-zinc-700 bg-zinc-900 px-3 py-3 text-zinc-100 outline-none focus:border-cyan-400" />{state.fieldErrors?.password && <span className="text-xs text-red-300">{state.fieldErrors.password}</span>}</label>
      <button disabled={pending} className="w-full border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-200 disabled:cursor-wait disabled:opacity-50">{pending ? "로그인 중..." : "로그인"}</button>
      <p className="text-center text-sm text-zinc-500">계정이 없나요? <Link href="/signup" className="text-cyan-300 hover:text-cyan-200">회원가입</Link></p>
    </form>
  );
}
