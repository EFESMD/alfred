import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { hashToken } from "@/lib/utils";
import { sendPasswordChangedNotification } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("[DEBUG] Password change confirmation for user ID:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("[DEBUG] Unauthorized request attempt");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { otp, newPassword } = await req.json();

    if (!otp || !newPassword) {
      console.log("[DEBUG] Missing OTP or new password in request");
      return new NextResponse("Missing fields", { status: 400 });
    }

    const hashedOtp = hashToken(otp);
    console.log("[DEBUG] Verifying OTP against DB...");

    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        changePasswordOTP: hashedOtp,
        changePasswordOTPExp: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      console.log("[DEBUG] Invalid or expired OTP code for user ID:", session.user.id);
      return new NextResponse("Invalid or expired verification code", { status: 400 });
    }

    // 1. Hash new password
    console.log("[DEBUG] OTP verified. Hashing new password with bcrypt...");
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 2. Update user and CLEAR OTP fields
    console.log("[DEBUG] Updating DB and clearing OTP tokens...");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        changePasswordOTP: null,
        changePasswordOTPExp: null,
        lastPasswordChange: new Date(),
      },
    });

    // 3. Send notification email
    console.log("[DEBUG] Attempting to send password change success notification...");
    try {
      await sendPasswordChangedNotification(user.email!);
      console.log("[DEBUG] Success notification sent");
    } catch (mailError: any) {
      console.error("[DEBUG] Success notification send failed:", mailError.message);
    }

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error: any) {
    console.error("[PASSWORD_CHANGE_CONFIRM_ERROR] Full error:", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
