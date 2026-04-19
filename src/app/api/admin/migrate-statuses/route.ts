import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admins to run migration
    const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim().toLowerCase());
    const isAdmin = session?.user?.email && adminEmails.includes(session.user.email.toLowerCase());

    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[MIGRATION] Starting Task Status Migration...");

    // 1. Update TODO -> PLANNED
    const todoUpdate = await prisma.task.updateMany({
      where: { status: "TODO" },
      data: { status: "PLANNED" },
    });

    // 2. Update BACKLOG -> PLANNED
    const backlogUpdate = await prisma.task.updateMany({
      where: { status: "BACKLOG" },
      data: { status: "PLANNED" },
    });

    console.log(`[MIGRATION] Finished. TODO updated: ${todoUpdate.count}, BACKLOG updated: ${backlogUpdate.count}`);

    // Optional: Trigger a global refresh via Pusher if needed
    if (pusherServer) {
      await pusherServer.trigger("global", "system-update", { 
        type: "STATUS_MIGRATION_COMPLETE",
        message: "Task statuses have been migrated."
      });
    }

    return NextResponse.json({
      success: true,
      details: {
        todoUpdated: todoUpdate.count,
        backlogUpdated: backlogUpdate.count,
      }
    });
  } catch (error: any) {
    console.error("[MIGRATION_ERROR]", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
