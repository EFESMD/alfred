import { CalendarView } from "@/components/calendar/CalendarView";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;
  return <CalendarView workspaceId={workspaceId} projectId={projectId} />;
}
