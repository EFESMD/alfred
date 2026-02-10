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
    console.log(`[API] Fetching tasks for project: ${projectId}`);

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        parentId: null, // Only fetch top-level tasks
      },
      include: {
        assignee: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`[API] Found ${tasks.length} tasks for project ${projectId}`);
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
    console.log("[API] Creating task with data:", body);
    const { title, description, status, priority, dueDate, assigneeId, parentId } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const { projectId } = await params;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId,
        parentId: parentId || null, // Explicitly set to null if not provided
      },
    });

    console.log("[API] Task created successfully:", task.id);

    // Trigger real-time update
    if (pusherServer) {
      await pusherServer.trigger(`project-${projectId}`, "task-created", task);
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
