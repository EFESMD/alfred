import nodemailer from "nodemailer";

const host = process.env.EMAIL_SERVER_HOST;
const port = parseInt(process.env.EMAIL_SERVER_PORT || "465");
const user = process.env.EMAIL_SERVER_USER;
const pass = process.env.EMAIL_SERVER_PASSWORD;
const from = process.env.EMAIL_FROM;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // True pentru 465 (SSL), False pentru 587 (STARTTLS)
  auth: {
    user,
    pass,
  },
  tls: {
    rejectUnauthorized: false, // Permite certificate interne
    minVersion: "TLSv1.2",
  },
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    console.log(`[MAIL] Railway Server Public IP: ${ipData.ip}`);
  } catch (ipErr) {
    console.warn("[MAIL] Could not fetch server IP:", ipErr);
  }

  console.log(`[MAIL] Attempting to send email via ${host}:${port} as ${user}`);
  
  if (!host || !user || !pass) {
    console.warn("[MAIL] Skipping email send: Missing environment variables.");
    console.log("[MAIL] Current config:", { host, port, user, hasPass: !!pass });
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: from || user,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });

    console.log("[MAIL] Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("[MAIL] Error sending email:", error);
    throw error;
  }
}
