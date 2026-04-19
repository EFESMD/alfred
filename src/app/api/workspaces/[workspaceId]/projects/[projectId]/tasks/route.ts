import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = await params;

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        parentId: null, // Only fetch top-level tasks
      },
      include: {
        assignee: true,
        predecessors: true,
        successors: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("[TASKS_GET] Error:", error.message);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, description, status, priority, startDate, dueDate, assigneeId, parentId, sectionId } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const { projectId } = await params;

    console.log("[TASKS_POST] Creating task with data:", { title, projectId, sectionId });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "PLANNED",
        priority: priority || "MEDIUM",
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: session.user.id,
        parentId: parentId || null,
        sectionId: (sectionId === "uncategorized" || !sectionId) ? null : sectionId,
      },
    });

    // Create activity log for task creation
    await prisma.activity.create({
      data: {
        type: "TASK_CREATED",
        description: "created the task",
        taskId: task.id,
        userId: session.user.id,
      },
    });

    console.log("[TASKS_POST] Task created successfully:", task.id);

    // Send notification to assignee
    if (task.assigneeId && task.assigneeId !== session.user.id) {
      const { createNotification } = await import("@/lib/notifications");
      const { workspaceId } = await params;
      await createNotification({
        userId: task.assigneeId,
        type: "TASK_ASSIGNED",
        title: "New Task Assigned",
        message: `${session.user.name} assigned you a task: ${task.title}`,
        link: `/workspaces/${workspaceId}/projects/${projectId}?taskId=${task.id}`,
      });
    }

    // Trigger real-time update
    if (pusherServer) {
      try {
        console.log("[TASKS_POST] Triggering Pusher update...");
        await pusherServer.trigger(`project-${projectId}`, "task-created", task);
        console.log("[TASKS_POST] Pusher triggered successfully");
      } catch (pusherError) {
        console.error("[TASKS_POST] Pusher error (Non-fatal):", pusherError);
        // We don't fail the whole request if Pusher fails
      }
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("[TASKS_POST] ERROR:", error.message || error);
    return new NextResponse(JSON.stringify({ error: error.message || "Internal Error" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}