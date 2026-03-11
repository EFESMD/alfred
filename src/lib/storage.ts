import path from "path";
import { unlink } from "fs/promises";
import prisma from "@/lib/prisma";

/**
 * Gets the base directory for uploads on the filesystem.
 */
export function getUploadDir() {
  // If we have a custom STORAGE_PATH env var, use it. Otherwise fall back to public/uploads
  if (process.env.STORAGE_PATH) {
    return path.join(process.env.STORAGE_PATH, "uploads");
  }
  return path.join(process.cwd(), "public", "uploads");
}

/**
 * Gets the full path for a file on the filesystem.
 */
export function getFullUploadPath(fileName: string, subDir: string = "") {
  return path.join(getUploadDir(), subDir, fileName);
}

/**
 * Gets the URL for a file.
 */
export function getFileUrl(fileName: string, subDir: string = "") {
  const prefix = subDir ? `/uploads/${subDir}` : "/uploads";
  return `${prefix}/${fileName}`;
}

/**
 * Deletes a file from the filesystem based on its URL.
 */
export async function deletePhysicalFile(fileUrl: string) {
  try {
    if (!fileUrl || !fileUrl.includes('/uploads/')) return false;

    // Remove the leading /uploads/ or uploads/ from the URL to get the relative path
    const relativePath = fileUrl.replace(/^\/?uploads\//, "");
    const absolutePath = path.join(getUploadDir(), relativePath);
    
    await unlink(absolutePath);
    return true;
  } catch (err) {
    console.error(`Failed to delete file at ${fileUrl}:`, err);
    return false;
  }
}

/**
 * Deletes all attachments linked to a task.
 */
export async function deletePhysicalTaskAttachments(taskId: string) {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { taskId },
    });

    for (const attachment of attachments) {
      await deletePhysicalFile(attachment.url);
    }
    return true;
  } catch (err) {
    console.error(`[STORAGE] Failed to delete task attachments for ${taskId}:`, err);
    return false;
  }
}

/**
 * Deletes all attachments for all tasks in a project.
 */
export async function deletePhysicalProjectAttachments(projectId: string) {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { task: { projectId } },
    });

    for (const attachment of attachments) {
      await deletePhysicalFile(attachment.url);
    }
    return true;
  } catch (err) {
    console.error(`[STORAGE] Failed to delete project attachments for ${projectId}:`, err);
    return false;
  }
}

/**
 * Deletes all attachments for all projects in a workspace.
 */
export async function deletePhysicalWorkspaceAttachments(workspaceId: string) {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { task: { project: { workspaceId } } },
    });

    for (const attachment of attachments) {
      await deletePhysicalFile(attachment.url);
    }
    return true;
  } catch (err) {
    console.error(`[STORAGE] Failed to delete workspace attachments for ${workspaceId}:`, err);
    return false;
  }
}
