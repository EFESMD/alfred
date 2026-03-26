import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const favorites = await prisma.projectMember.findMany({
      where: {
        userId: session.user.id,
        isFavorite: true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            workspaceId: true,
            color: true,
            icon: true,
            isArchived: true,
          }
        }
      }
    });

    return NextResponse.json(favorites.map(f => ({
      ...f.project,
      workspaceId: f.project.workspaceId
    })));
  } catch (error) {
    console.error("[PROJECTS_FAVORITES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
