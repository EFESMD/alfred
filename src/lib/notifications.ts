import { pusherServer } from "./pusher";
import prisma from "./prisma";

interface CreateNotificationParams {
  userId: string;
  type: "TASK_ASSIGNED" | "COMMENT_ADDED" | "WORKSPACE_INVITE" | "PROJECT_UPDATE";
  title: string;
  message: string;
  link?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });

    if (pusherServer) {
      await pusherServer.trigger(
        `private-user-${userId}`,
        "notification:new",
        notification
      );
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}
