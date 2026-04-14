import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { hashToken } from "@/lib/utils";
import { validatePassword } from "@/lib/password-validator";

export async function POST(req: Request) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Complexity check for the new password
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return new NextResponse("Password does not meet requirements", { status: 400 });
    }

    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetPasswordToken: hashedToken,
        resetPasswordExp: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return new NextResponse("Invalid or expired reset link", { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user and CLEAR reset tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExp: null,
        lastPasswordChange: new Date(),
      },
    });

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
