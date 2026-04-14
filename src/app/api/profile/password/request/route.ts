import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { hashToken } from "@/lib/utils";
import { validatePassword } from "@/lib/password-validator";
import { sendPasswordChangeOTP } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("[DEBUG] Password change request for user ID:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("[DEBUG] Unauthorized request attempt");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      console.log("[DEBUG] Missing required password fields");
      return new NextResponse("Missing fields", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      console.log("[DEBUG] User or current password not found in DB");
      return new NextResponse("User not found", { status: 404 });
    }

    // 1. Verify current password
    console.log("[DEBUG] Verifying current password with bcrypt...");
    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      console.log("[DEBUG] Current password verification failed");
      return new NextResponse("Incorrect current password", { status: 400 });
    }

    // 2. Validate new password complexity
    console.log("[DEBUG] Validating new password complexity...");
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      console.log("[DEBUG] New password complexity validation failed");
      return new NextResponse("New password does not meet requirements", { status: 400 });
    }

    // 3. Generate 6-digit OTP
    console.log("[DEBUG] Generating 6-digit OTP and hashing it...");
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = hashToken(otp);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. Save to DB
    console.log("[DEBUG] Saving hashed OTP and expiry to DB...");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        changePasswordOTP: hashedOtp,
        changePasswordOTPExp: expiry,
      },
    });

    // 5. Send Email
    console.log("[DEBUG] Attempting to send OTP email...");
    try {
      await sendPasswordChangeOTP(user.email!, otp);
      console.log("[DEBUG] OTP email sent successfully");
    } catch (mailError: any) {
      console.error("[DEBUG] OTP mail send failed:", mailError.message);
      throw mailError;
    }

    return NextResponse.json({ message: "OTP sent to your email." });
  } catch (error: any) {
    console.error("[PASSWORD_CHANGE_REQUEST_ERROR] Full error:", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
