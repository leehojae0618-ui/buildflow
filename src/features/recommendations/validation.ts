import { z } from "zod";
export const recommendationRequestSchema = z.object({ projectId: z.string().uuid() });
