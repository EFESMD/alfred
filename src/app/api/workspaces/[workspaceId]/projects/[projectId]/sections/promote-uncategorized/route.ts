import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Use a transaction to create the section and move the tasks atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the last section order
      const lastSection = await tx.section.findFirst({
        where: { projectId },
        orderBy: { order: "desc" },
      });

      // 2. Create the new section
      const newSection = await tx.section.create({
        data: {
          name,
          projectId,
          order: lastSection ? lastSection.order + 1 : 0,
        },
      });

      // 3. Move all tasks with no sectionId in this project to the new section
      await tx.task.updateMany({
        where: {
          projectId,
          sectionId: null,
        },
        data: {
          sectionId: newSection.id,
        },
      });

      return newSection;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PROMOTE_UNCATEGORIZED]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
