import type { Database } from "@/types/database";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectFormState = { error?: string; fieldErrors?: Record<string, string> };
