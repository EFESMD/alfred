import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { content } = await req.json();

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const { taskId, projectId } = await params;

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            assigneeId: true,
          },
        },
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: "COMMENT_ADDED",
        description: `added a comment: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
        taskId,
        userId: session.user.id,
      },
    });

    // Send notification to task assignee if it's not the commenter
    if (comment.task.assigneeId && comment.task.assigneeId !== session.user.id) {
      const { createNotification } = await import("@/lib/notifications");
      await createNotification({
        userId: comment.task.assigneeId,
        type: "COMMENT_ADDED",
        title: "New Comment",
        message: `${session.user.name} commented on "${comment.task.title}": ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
        link: `/workspaces/${projectId}/projects/${projectId}?taskId=${taskId}`,
      });
    }

    // Trigger real-time update
    if (pusherServer) {
      await pusherServer.trigger(`project-${projectId}`, "comment-added", { taskId });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
