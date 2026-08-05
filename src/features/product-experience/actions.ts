"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  persistBf0ProjectDraft,
  type Bf0ProjectDraftInput,
  type Bf0ProjectPersistenceResult,
} from "./draft-persistence";

/** Creates a Project from a completed BF0 design; it never starts Runtime work. */
export async function createProjectFromBf0Draft(
  input: Bf0ProjectDraftInput,
): Promise<Bf0ProjectPersistenceResult> {
  try {
    const supabase = await createSupabaseServerClient();
    return persistBf0ProjectDraft(input, {
      userId: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id ?? null;
      },
      insert: async (payload) => {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            user_id: payload.userId,
            title: payload.title,
            goal: payload.goal,
            goal_description: payload.goalDescription,
            goal_constraints: payload.goalConstraints as never,
          })
          .select("id")
          .single();
        return error || !data ? null : data.id;
      },
      revalidate: (projectId) => {
        revalidatePath("/app");
        revalidatePath("/app/projects");
        revalidatePath(`/app/projects/${projectId}`);
      },
    });
  } catch {
    return { ok: false, errorCode: "PERSISTENCE_FAILED" };
  }
}
