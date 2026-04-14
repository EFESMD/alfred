import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";
import { validatePassword } from "@/lib/password-validator";
import crypto from "crypto";

export async function POST(req: Request) {
  console.log("[REGISTER] Request received");
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body;
    console.log("[REGISTER] Data parsed for:", email);

    if (!email || !password || !firstName || !lastName) {
      console.log("[REGISTER] Missing fields");
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Password complexity check
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      console.log("[REGISTER] Password too weak");
      return new NextResponse("Password does not meet complexity requirements.", { status: 400 });
    }

    // Check for allowed company domain
    const allowedDomain = "md.anadoluefes.com";
    if (!email.toLowerCase().endsWith(`@${allowedDomain}`)) {
      console.log("[REGISTER] Invalid domain:", email);
      return new NextResponse(`Only ${allowedDomain} email addresses are allowed for registration.`, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      console.log("[REGISTER] User already exists:", email);
      return new NextResponse("User already exists", { status: 400 });
    }

    console.log("[REGISTER] Creating user in DB...");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        password: hashedPassword,
        emailVerified: new Date(), // Auto-verify (Bypass email)
      },
    });
    console.log("[REGISTER] User created with ID:", user.id);

    // Try sending email in background but don't block registration
    console.log("[REGISTER] Attempting background email send...");
    sendEmail({
      to: email,
      subject: "Alfred - Contul tău a fost creat",
      text: `Salut ${firstName},\n\nContul tău în platforma Alfred a fost creat cu succes! Te poți loga acum.\n\nEchipa Alfred`,
    }).catch(err => console.error("[REGISTER] Background email failed:", err));

    return NextResponse.json({ 
      message: "User created successfully. You can now log in.",
      userId: user.id 
    });
  } catch (error) {
    console.error("[REGISTER_ERROR] Fatal:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
