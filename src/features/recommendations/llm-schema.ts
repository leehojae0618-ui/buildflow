import { z } from "zod";

export const candidateExplanationSchema = z.object({ candidateId: z.string(), headline: z.string().min(10).max(80), explanation: z.string().min(50).max(500), fitReasons: z.array(z.string()).min(1).max(4), cautions: z.array(z.string()).max(3), nextStep: z.string().min(10).max(160) });
export const recommendationExplanationSchema = z.object({ overview: z.string().min(30).max(300), candidates: z.array(candidateExplanationSchema) });
export type RecommendationExplanation = z.infer<typeof recommendationExplanationSchema>;
