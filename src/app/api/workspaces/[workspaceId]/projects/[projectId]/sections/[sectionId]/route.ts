import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sectionId } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const section = await prisma.section.update({
      where: {
        id: sectionId,
      },
      data: {
        name,
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("[SECTION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sectionId } = await params;

    await prisma.section.delete({
      where: {
        id: sectionId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SECTION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
