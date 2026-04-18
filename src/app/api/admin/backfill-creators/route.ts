import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/utils";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !checkIsAdmin(session.user.email)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[BACKFILL] Starting creatorId backfill...");

    // 1. Find all tasks with null creatorId
    const tasks = await prisma.task.findMany({
      where: {
        creatorId: null,
      },
    });

    let updatedCount = 0;

    for (const task of tasks) {
      // 2. Find the TASK_CREATED activity for this task
      const activity = await prisma.activity.findFirst({
        where: {
          taskId: task.id,
          type: "TASK_CREATED",
        },
      });

      if (activity) {
        // 3. Update the task
        await prisma.task.update({
          where: { id: task.id },
          data: { creatorId: activity.userId },
        });
        updatedCount++;
      }
    }

    console.log(`[BACKFILL] Completed. Updated ${updatedCount} tasks.`);

    return NextResponse.json({ 
      message: "Backfill completed", 
      tasksProcessed: tasks.length,
      tasksUpdated: updatedCount 
    });
  } catch (error) {
    console.error("[BACKFILL_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
