import { TaskListView } from "@/components/tasks/TaskListView";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;
  return <TaskListView workspaceId={workspaceId} projectId={projectId} />;
}
