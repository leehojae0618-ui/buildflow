"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthErrorMessage } from "@/features/auth/errors";
import { getSafeRedirect, loginSchema, signupSchema, toFieldErrors, type AuthFormState } from "@/features/auth/validation";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function login(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: getAuthErrorMessage(error.message) };

  redirect(getSafeRedirect(String(formData.get("next") || "/app")));
}

export async function signup(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  });
  if (error) return { error: getAuthErrorMessage(error.message) };
  if (data.session) redirect("/app");
  redirect("/login?message=email-confirmation");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const next = getSafeRedirect(String(formData.get("next") || "/app"));
  const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}
