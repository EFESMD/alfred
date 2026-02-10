import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default async function KanbanPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;
  return <KanbanBoard workspaceId={workspaceId} projectId={projectId} />;
}
