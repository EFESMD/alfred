import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { deletePhysicalFile } from "@/lib/storage";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string; taskId: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { attachmentId, taskId } = await params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return new NextResponse("Attachment not found", { status: 404 });
    }

    // Delete file from filesystem using helper
    await deletePhysicalFile(attachment.url);

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "ATTACHMENT_DELETED",
        description: `removed attachment: ${attachment.name}`,
        taskId: taskId,
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ATTACHMENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
