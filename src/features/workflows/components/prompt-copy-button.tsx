"use client";
import { useState } from "react";
export function PromptCopyButton({ content }: { content: string }) { const [message, setMessage] = useState(""); async function copy() { try { await navigator.clipboard.writeText(content); setMessage("복사했습니다."); } catch { setMessage("복사하지 못했습니다. Prompt를 직접 선택해주세요."); } } return <div><button type="button" onClick={copy} className="border border-zinc-700 px-3 py-2 text-xs text-zinc-300">Prompt 복사</button>{message && <span role="status" className="ml-3 text-xs text-zinc-500">{message}</span>}</div>; }
