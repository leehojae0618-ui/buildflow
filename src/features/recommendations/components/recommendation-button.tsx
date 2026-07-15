import { createRecommendation } from "@/features/recommendations/actions";
export function RecommendationButton({ projectId }: { projectId: string }) { return <form action={createRecommendation}><input type="hidden" name="projectId" value={projectId} /><button type="submit" className="border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">추천 설계 만들기</button></form>; }
