import { archiveProject } from "@/features/projects/actions";

export function ArchiveProjectButton({ projectId }: { projectId: string }) {
  return (
    <form action={archiveProject}>
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" className="text-sm text-zinc-500 hover:text-red-300">
        프로젝트 보관
      </button>
    </form>
  );
}
