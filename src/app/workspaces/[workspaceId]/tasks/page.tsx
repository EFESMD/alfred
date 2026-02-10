import { MyTasksView } from "@/components/tasks/MyTasksView";

export default async function MyTasksPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <MyTasksView workspaceId={workspaceId} />;
}
