import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deriveLiveUserIdentity, type LiveUserIdentityProvider } from "./identity";

export const serverLiveUserIdentityProvider: LiveUserIdentityProvider = {
  async resolve(environment) {
    if (environment.pipedreamEnvironment !== "development") return { ok: false, errorCode: "IDENTITY_UNAVAILABLE" };
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user?.id) return { ok: true, value: deriveLiveUserIdentity(user.id) };
      if (error) return { ok: false, errorCode: "AUTH_REQUIRED" };
    } catch {
      // Development fallback below is deliberately unavailable in production.
    }
    if (environment.nodeEnvironment !== "production" && environment.liveTestUserId) {
      return { ok: true, value: deriveLiveUserIdentity(environment.liveTestUserId) };
    }
    return { ok: false, errorCode: "AUTH_REQUIRED" };
  },
};
