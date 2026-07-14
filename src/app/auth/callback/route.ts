import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeRedirect } from "@/features/auth/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeRedirect(url.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/login?error=auth-callback", url.origin));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=auth-callback", url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
