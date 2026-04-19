import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let settings = await prisma.globalSettings.findUnique({
      where: { id: "system" },
    });

    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: { id: "system" },
      });
    }

    // Auto-lockdown logic: If we are in WARNING and the time has passed, update to LOCKDOWN
    if (settings.maintenanceStatus === "WARNING" && settings.maintenanceStartsAt && new Date(settings.maintenanceStartsAt) <= new Date()) {
      settings = await prisma.globalSettings.update({
        where: { id: "system" },
        data: { maintenanceStatus: "LOCKDOWN" },
      });
      
      if (pusherServer) {
        await pusherServer.trigger("global", "maintenance-update", settings);
      }
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[MAINTENANCE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can change maintenance settings
    if (!session || !session.user.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action, durationMinutes } = await req.json();

    let maintenanceStatus = "INACTIVE";
    let maintenanceStartsAt: Date | null = null;
    let maintenanceEndsAt: Date | null = null;

    if (action === "START_WARNING") {
      maintenanceStatus = "WARNING";
      maintenanceStartsAt = new Date(Date.now() + (durationMinutes || 20) * 60 * 1000);
    } else if (action === "LOCKDOWN") {
      maintenanceStatus = "LOCKDOWN";
      maintenanceStartsAt = new Date();
    } else if (action === "INACTIVE") {
      maintenanceStatus = "INACTIVE";
      maintenanceStartsAt = null;
    }

    const settings = await prisma.globalSettings.upsert({
      where: { id: "system" },
      update: {
        maintenanceStatus,
        maintenanceStartsAt,
        maintenanceEndsAt,
      },
      create: {
        id: "system",
        maintenanceStatus,
        maintenanceStartsAt,
        maintenanceEndsAt,
      },
    });

    // Broadcast update via Pusher
    if (pusherServer) {
      await pusherServer.trigger("global", "maintenance-update", settings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[MAINTENANCE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
