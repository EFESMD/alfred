import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const secretKey = process.env.ADMIN_RESET_KEY || "efes_admin_reset";

    if (!key || key !== secretKey) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const settings = await prisma.globalSettings.upsert({
      where: { id: "system" },
      update: {
        maintenanceStatus: "INACTIVE",
        maintenanceStartsAt: null,
        maintenanceEndsAt: null,
      },
      create: {
        id: "system",
        maintenanceStatus: "INACTIVE",
      },
    });

    // Broadcast update via Pusher
    if (pusherServer) {
      await pusherServer.trigger("global", "maintenance-update", settings);
    }

    return NextResponse.json({
      message: "System maintenance mode has been deactivated successfully.",
      status: settings.maintenanceStatus,
    });
  } catch (error) {
    console.error("[ADMIN_RESET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
