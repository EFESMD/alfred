import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";
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
      },
    });
    console.log("[REGISTER] User created with ID:", user.id);

    // Generate Verification Token
    console.log("[REGISTER] Generating verification token...");
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });
    console.log("[REGISTER] Token saved to DB");

    // Send Verification Email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify?token=${token}`;
    
    console.log("[REGISTER] Attempting to send email to:", email);
    try {
      await sendEmail({
        to: email,
        subject: "Alfred - Verificarea contului tău",
        text: `Salut ${firstName},\n\nBine ai venit în Alfred! Te rugăm să îți confirmi adresa de email accesând acest link: ${verificationUrl}\n\nAcest link va expira în 24 de ore.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
            <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 16px;">Salut ${firstName},</h1>
            <p style="color: #475569; font-size: 16px; line-height: 24px;">Bine ai venit în platforma de project management <strong>Alfred</strong>!</p>
            <p style="color: #475569; font-size: 16px; line-height: 24px;">Pentru a activa contul tău și a începe colaborarea cu echipa, te rugăm să confirmi adresa de email făcând clic pe butonul de mai jos:</p>
            <div style="margin: 32px 0;">
              <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Confirmă Email</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">Sau copiază acest link în browser:</p>
            <p style="color: #2563eb; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">Acest link va expira în 24 de ore. Dacă nu tu ai creat acest cont, te rugăm să ignori acest mesaj.</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Echipa Alfred</p>
          </div>
        `,
      });
      console.log("[REGISTER] Email sent successfully");
    } catch (mailError) {
      console.error("[REGISTER] Email failed to send, but user was created:", mailError);
      // We don't throw here so the user is still created, but they might need manual verification
    }

    return NextResponse.json({ 
      message: "User created. Verification email sent.",
      userId: user.id 
    });
  } catch (error) {
    console.error("[REGISTER_ERROR] Fatal:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
