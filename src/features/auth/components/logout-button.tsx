"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-cyan-400/50 hover:text-cyan-200 disabled:opacity-50">{pending ? "로그아웃 중..." : "로그아웃"}</button>;
}

export function LogoutButton({ action }: { action: () => Promise<void> }) {
  return <form action={action}><SubmitButton /></form>;
}
