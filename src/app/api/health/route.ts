import { NextResponse } from "next/server";
import { hasSupabasePublicEnv, publicEnv } from "@/lib/env";

export async function GET() {
  let reachable = false;
  if (hasSupabasePublicEnv) {
    try {
      const response = await fetch(`${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      reachable = response.ok;
    } catch {
      reachable = false;
    }
  }

  return NextResponse.json({ status: "ok", app: "BuildFlow", supabase: { configured: hasSupabasePublicEnv, reachable } }, { headers: { "Cache-Control": "no-store" } });
}
