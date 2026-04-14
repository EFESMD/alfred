import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { hashToken } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    console.log("[DEBUG] Forgot password request for:", email);

    if (!email) {
      console.log("[DEBUG] Missing email in request");
      return new NextResponse("Email is required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Security: Always return success to prevent user enumeration
    if (!user) {
      console.log("[DEBUG] User not found in DB:", email);
      return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
    }

    console.log("[DEBUG] User found, generating reset token...");

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(resetToken);
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save to DB
    console.log("[DEBUG] Saving hashed token to DB for user ID:", user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExp: expiry,
      },
    });

    // Send email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email || "")}`;

    console.log("[DEBUG] Attempting to send reset email via nodemailer/brevo...");
    try {
      await sendPasswordResetEmail(user.email!, resetUrl);
      console.log("[DEBUG] Email function completed successfully");
    } catch (mailError: any) {
      console.error("[DEBUG] Mail function threw error:", mailError.message);
      throw mailError; // Re-throw to catch block
    }

    return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
  } catch (error: any) {
    console.error("[FORGOT_PASSWORD_ERROR] Full error:", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
