import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = await params;

    // Find current membership
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return new NextResponse("Not a member of this project", { status: 403 });
    }

    // Toggle favorite status
    const updatedMembership = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
      data: {
        isFavorite: !membership.isFavorite,
      },
    });

    return NextResponse.json(updatedMembership);
  } catch (error) {
    console.error("[PROJECT_FAVORITE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
