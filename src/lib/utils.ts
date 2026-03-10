import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function checkIsAdmin(email: string | null | undefined) {
  if (!email) return false;
  
  const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}
