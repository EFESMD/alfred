import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function checkIsAdmin(email: string | null | undefined) {
  if (!email) return false;
  
  const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export function formatStatus(status: string) {
  if (status === "PLANNED") return "Planned";
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "DELAYED") return "Delayed";
  if (status === "OVERDUE") return "Overdue";
  if (status === "DONE") return "Done";
  return status.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}
